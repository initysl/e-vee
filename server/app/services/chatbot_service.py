import re
from typing import List, Dict, Any
from app.embeddings.chroma_client import get_chroma_client
from app.services.product_service import get_products
from app.embeddings.embed_products import create_embeddings
from app.services.cart_service import get_cart, add_to_cart


class ChatbotService:
    """Chatbot responses based on user queries"""

    def __init__(self):
        self.collection = get_chroma_client()

    async def process_message(self, message: str, session_id: str) -> Dict[str, Any]:
        """
        Process user message and return appropriate response.
        Args:
            message: User's message
            session_id: User session ID
        Returns:
            dict: Response with message and metadata
        """
        message_lower = message.lower()

        # Detect intent
        intent = self._detect_intent(message_lower)
        
        # Extract product IDs for relevant intents
        product_ids = self._extract_product_ids(message) if any(
            keyword in intent for keyword in ["add", "cart", "checkout", "product"]
        ) else []

        # Route to appropriate handler
        if intent == "greeting":
            return {
                "response": "Hey there! I'm E-vee, your shopping assistant. How can I help you today?",
                "intent": "greeting"
            }
        
        elif intent == "cart_query":
            return await self._handle_cart_query(session_id)
        
        elif intent == "add_multiple_to_cart":
            return await self._handle_add_multiple_to_cart(session_id, product_ids)
        
        elif intent == "add_and_checkout":
            return await self._handle_add_and_checkout(session_id, product_ids)
        
        elif intent == "checkout":
            return await self._handle_checkout(session_id)
        
        elif intent == "product_by_id":
            product_id = product_ids[0] if product_ids else None
            if product_id is None:
                return {
                    "response": "Please provide a valid product ID. For example: 'Tell me about product 5'",
                    "intent": "product_by_id"
                }
            return await self._handle_product_by_id(session_id, product_id)
        
        elif intent == "add_to_cart":  
            product_id = product_ids[0] if product_ids else None
            if product_id is None:
                return {
                    "response": "Please specify which product to add. For example: 'Add product 5 to cart'",
                    "intent": "add_to_cart"
                }
            return await self._handle_add_to_cart(session_id, product_id)

        elif intent == "product_search" or intent == "shophub_info":
            return await self._handle_semantic_search(message)
        
        elif intent == "unknown":
            return {
                "response": "I'm not sure I understand. I can help you with:\n- Finding products\n- Checking your cart\n- Checking out your cart\n- Store info (shipping, returns, about...)\n- Adding items to cart\n\nWhat would you like to do?",
                "intent": "unknown"
            }
        
        else:
            return {
                "response": "Hey there! I'm E-vee, your shopping assistant. How can I help you today?",
                "intent": "greeting"
            }

    def _detect_intent(self, message: str) -> str:
        """
        Classify user intent based on keywords.
        Args:
            message: User's message in lowercase
        Returns:
            str: Detected intent
        """

        # Greeting queries (check first for friendly responses)
        if any(greet in message for greet in ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"]):
            return "greeting"

        # Multi-product add to cart (check before single add)
        if ("add" in message or "put" in message) and len(self._extract_product_ids(message)) > 1:
            return "add_multiple_to_cart"

        # Add to cart (check early to avoid conflicts with "cart")
        if any(phrase in message for phrase in ["add product", "add item", "add this", "add to cart", "put in cart"]):
            return "add_to_cart"

        # Checkout with products (e.g., "add 5 and 9 and checkout")
        if "checkout" in message and any(word in message for word in ["add", "put", "product"]):
            return "add_and_checkout"
        
        # Checkout (check before cart_query but be specific)
        if any(phrase in message for phrase in ["checkout", "buy now", "purchase", "place order", "pay now"]):
            return "checkout"

        # Cart queries (check after checkout and add_to_cart)
        if any(phrase in message for phrase in ["my cart", "show cart", "view cart", "cart contents", "what's in my cart", "what's in my"]) or message.strip() == "cart":
            return "cart_query"

        # Product by ID
        if re.search(r'product\s*(?:id|#)?\s*(\d+)', message) or re.search(r'id\s*:?\s*\d+', message):
            return "product_by_id"

        # ShopHub info (shipping, returns, etc.)
        if any(word in message for word in ["shipping", "return", "refund", "policy", "delivery", "warranty", "support", "help"]):
            return "shophub_info"

        # Before defaulting to product_search, check if message has product-related keywords
        product_keywords = ["product", "item", "buy", "shop", "find", "show", "looking for", "need", "want", "price", "cost", "cheap", "expensive", "available"]
    
        if any(keyword in message for keyword in product_keywords):
            return "product_search"
        
        # If nothing matches and no product keywords, return unknown
        return "unknown"
    
    def _extract_product_ids(self, message: str) -> List[str]:
        """
        Extract multiple product IDs from message.
        Handles: "Add product 5, 6, and 7", "products 1 2 3", "product 5 and 9"
        """
        # Pattern 1: "product 5, 6, and 7" or "products 5, 6, 7"
        pattern1 = r'products?\s+(\d+(?:\s*,?\s*(?:and\s+)?\d+)*)'
        
        # Pattern 2: Just numbers with commas/and: "5, 6, and 7"
        pattern2 = r'\b(\d+)\b'
        
        matches = re.findall(pattern1, message.lower())
        
        product_ids = []
        if matches:
            # Extract all numbers from the matched string
            for match in matches:
                numbers = re.findall(r'\d+', match)
                product_ids.extend(numbers)
        else:
            # Fallback: extract any numbers mentioned
            product_ids = re.findall(pattern2, message)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_ids = []
        for pid in product_ids:
            if pid not in seen:
                seen.add(pid)
                unique_ids.append(pid)
        
        return unique_ids

    async def _handle_cart_query(self, session_id: str) -> Dict[str, Any]:
        """Handle cart query intent."""
        cart = await get_cart(session_id)

        if cart['item_count'] == 0:
            return {
                "response": "Your cart is currently empty. Would you like to add some products?",
                "intent": "cart_query",
                "cart": cart
            }
        else:
            items_list = "\n".join([
                f"- {item['title']} (x{item['quantity']}): ${item['subtotal']:.2f}" 
                for item in cart['items']])
            
            response_text = f"Here's what's in your cart:\n\n{items_list}\n\nTotal: ${cart['total']:.2f}\n\nReady to checkout?"
            return {
                "response": response_text,
                "intent": "cart_query",
                "cart": cart
            }
        
    async def _handle_add_multiple_to_cart(self, session_id: str, product_ids: List[str]) -> Dict[str, Any]:
        """Handle adding multiple products to cart in one request."""
        if not product_ids:
            return {
                "response": "Please specify which products to add. For example: 'Add products 5, 6, and 7 to cart'",
                "intent": "add_multiple_to_cart"
            }
        
        products = await get_products()
        added_products = []
        failed_products = []
        
        # Try to add each product
        for product_id in product_ids:
            product = next((p for p in products if str(p['id']) == product_id), None)
            
            if not product:
                failed_products.append(product_id)
                continue
            
            try:
                await add_to_cart(session_id, product_id, quantity=1)
                added_products.append(product)
            except Exception as e:
                print(f"Failed to add product {product_id}: {e}")
                failed_products.append(product_id)
        
        # Get updated cart
        cart = await get_cart(session_id)
        
        # Build response message
        if not added_products:
            return {
                "response": f"Sorry, I couldn't add any of the products. Product IDs {', '.join(failed_products)} were not found.",
                "intent": "add_multiple_to_cart"
            }
        
        added_names = [p['title'] for p in added_products]
        response_parts = [
            f"Successfully added {len(added_products)} items to your cart:",
            *[f"• {name}" for name in added_names]
        ]
        
        if failed_products:
            response_parts.append(f"\nCould not find products: {', '.join(failed_products)}")
        
        response_parts.append(f"\nYour cart now has {cart['item_count']} items totaling ${cart['total']:.2f}")
        
        return {
            "response": "\n".join(response_parts),
            "intent": "add_multiple_to_cart",
            "cart": cart,
            "added_products": added_products,
            "failed_products": failed_products
        }

    async def _handle_add_and_checkout(self, session_id: str, product_ids: List[str]) -> Dict[str, Any]:
        """Handle adding products and immediately checking out."""
        if not product_ids:
            return {
                "response": "Please specify which products to add and checkout. For example: 'Add products 5 and 9 and checkout'",
                "intent": "add_and_checkout"
            }
        
        # First, add products to cart
        add_result = await self._handle_add_multiple_to_cart(session_id, product_ids)
        
        # If adding failed completely, return the error
        if not add_result.get('added_products'):
            return add_result
        
        # Get cart for checkout
        cart = await get_cart(session_id)
        
        if cart['item_count'] == 0:
            return {
                "response": "Your cart is empty. Please add items before checking out.",
                "intent": "add_and_checkout"
            }
        
        # Build checkout response
        added_count = len(add_result['added_products'])
        response = (
            f"Added {added_count} items to your cart!\n\n"
            f"Ready to checkout:\n"
            f"Total Items: {cart['item_count']}\n"
            f"Total Amount: ${cart['total']:.2f}\n\n"
            f"To complete your purchase, please proceed to the checkout page where you can enter your shipping and payment details."
        )
        
        return {
            "response": response,
            "intent": "add_and_checkout",
            "cart": cart,
            "checkout_ready": True,
            "added_products": add_result['added_products']
        }
        
    async def _handle_checkout(self, session_id: str) -> Dict[str, Any]:
        """Handle checkout requests"""
        cart = await get_cart(session_id)

        if cart['item_count'] == 0:
            return {
                "response": "Your cart is empty. Add some products before checking out!",
                "intent": "checkout",
                "cart": cart
            }

        return {
            "response": f"Great! Your order total is ${cart['total']:.2f} for {cart['item_count']} items. To complete checkout, please proceed to our checkout page where you can enter shipping and payment details.",
            "intent": "checkout",
            "cart": cart,
            "checkout_ready": True
        }
    
    async def _handle_product_by_id(self, session_id: str, product_id: str) -> Dict[str, Any]:
        """Handle requests for specific product by ID."""
        if not product_id:
            return {
                "response": "Please provide a valid product ID. For example: 'Tell me about product 5'",
                "intent": "product_by_id"
            }
        
        products = await get_products()
        product = next((p for p in products if str(p['id']) == product_id), None)

        if not product:
            return {
                "response": f"Sorry, I couldn't find a product with ID {product_id}. Please check the ID and try again.",
                "intent": "product_by_id"
            }
        
        return {
            "response": f"{product['title']}\n\nPrice: ${product['price']}\nCategory: {product['category']}\n\n{product['description']}\n\nWould you like to add this to your cart?",
            "intent": "product_by_id",
            "product": product
        }
    
    async def _handle_add_to_cart(self, session_id: str, product_id: str) -> Dict[str, Any]:
        """Handle adding product to cart."""
        if not product_id:
            return {
                "response": "Please specify which product to add. For example: 'Add product 5 to cart'",
                "intent": "add_to_cart"
            }
        
        try:
            cart = await add_to_cart(session_id, product_id)
            products = await get_products()
            product = next((p for p in products if str(p['id']) == product_id), None)
            
            if not product:
                return {
                    "response": f"Sorry, I couldn't find a product with ID {product_id}. Please check the ID and try again.",
                    "intent": "add_to_cart"
                }
            
            return {
                "response": f"Added {product['title']} to your cart! You now have {cart['item_count']} items totaling ${cart['total']:.2f}.",
                "intent": "add_to_cart",
                "cart": cart,
                "product": product
            }
        except ValueError as e:
            return {
                "response": str(e),
                "intent": "add_to_cart"
            }
    
    async def _handle_semantic_search(self, query: str) -> Dict[str, Any]:
        """Handle product search and platform info queries using ChromaDB."""
        # Generate query embedding
        query_embedding = create_embeddings([query])[0]
        
        # Search in ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        
        # Safety checks for empty results
        if not results or not results.get('documents') or not isinstance(results['documents'], list) or not results['documents'][0]:
            return {
                "response": "I couldn't find relevant information. Could you rephrase your question?",
                "intent": "product_search"
            }
        
        # Check if metadatas exist
        if not results.get('metadatas') or not results['metadatas'][0]: # type: ignore
            return {
                "response": "I found some results but couldn't retrieve the details. Please try again.",
                "intent": "product_search"
            }
        
        # Format results
        response_parts = []
        products_found = []
        
        for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])): # type: ignore
            if metadata['type'] == 'product':
                products_found.append(metadata)
                response_parts.append(
                    f"{i+1}. {metadata['title']} - ${metadata['price']}\n"
                    f"   Category: {metadata['category']}\n"
                    f"   Product ID: {metadata['product_id']}"
                )
            elif metadata['type'] == 'hub_info':
                if metadata.get('content_type') == 'faq':
                    response_parts.append(f"{metadata['question']}\n{metadata['answer']}")
                else:
                    response_parts.append(doc.strip())
        
        response_text = "\n\n".join(response_parts)
        
        if products_found:
            response_text += "\n\nWould you like to know more about any of these products or add one to your cart?"
        
        return {
            "response": response_text,
            "intent": "product_search" if products_found else "hub_info",
            "results": products_found if products_found else results['metadatas'][0] # type: ignore
        }


# Singleton instance
_chatbot_service = None


def get_chatbot_service() -> ChatbotService:
    """Get singleton instance of ChatbotService."""
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service
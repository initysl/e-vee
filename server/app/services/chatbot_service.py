import re
from typing import List, Dict, Any, Optional
from app.embeddings.chroma_client import get_chroma_client
from app.services.product_service import get_products
from app.embeddings.embed_products import create_embeddings
from app.services.cart_service import get_cart, add_to_cart, remove_from_cart, update_quantity, clear_cart


class ChatbotService:
    """Chatbot responses based on user queries"""

    # ShopHub topic keywords mapping
    SHOPHUB_TOPICS = {
        "shipping": ["shipping", "ship"],
        "returns": ["return", "returns"],
        "customer_service": ["support", "help", "customer service"],
        "refund": ["refund", "refunds"],
        "delivery": ["delivery", "deliver"],
        "warranty": ["warranty", "guarantee"],
        "contact": ["contact"],
        "policy": ["policy", "policies", "terms"],
    }

    def __init__(self):
        self.collection = get_chroma_client()

    def _detect_shophub_topic(self, message: str) -> Optional[str]:
        """Detect ShopHub topic from message keywords."""
        message_lower = message.lower()
        for topic, keywords in self.SHOPHUB_TOPICS.items():
            if any(keyword in message_lower for keyword in keywords):
                return topic
        return None
    
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
        
        # Extract product IDs and quantities for relevant intents
        product_ids = self._extract_product_ids(message) if any(
            keyword in intent for keyword in ["add", "remove", "cart", "checkout", "product"]
        ) else []
        
        quantity = self._extract_quantity(message) if "add" in intent else 1

        # Route to appropriate handler
        if intent == "greeting":
            return {
                "response": "Hey there! I'm E-vee, your shopping assistant. How can I help you today?",
                "intent": "greeting"
            }
        
        elif intent == "cart_query":
            return await self._handle_cart_query(session_id)
        
        elif intent == "clear_cart":
            return await self._handle_clear_cart(session_id)
        
        elif intent == "remove_from_cart":
            return await self._handle_remove_from_cart(session_id, product_ids)
        
        elif intent == "add_multiple_to_cart":
            return await self._handle_add_multiple_to_cart(session_id, product_ids, quantity)
        
        elif intent == "add_and_checkout":
            return await self._handle_add_and_checkout(session_id, product_ids, quantity)
        
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
            return await self._handle_add_to_cart(session_id, product_id, quantity)

        elif intent == "shophub_info":
            topic = self._detect_shophub_topic(message_lower)
            
            if topic is None:
                return {
                    "response": "Could you clarify what information you need? I can help with shipping, returns, refunds, policies, or support.",
                    "intent": "shophub_info"
                }
            
            return await self._handle_shophub_info(message, topic)

        elif intent == "product_search":
            return await self._handle_semantic_search(message)
        
        elif intent == "unknown":
            return {
                "response": "I'm not sure I understand. I can help you with:\n- Finding products\n- Checking your cart\n- Adding/removing items\n- Checkout\n- Store info\n\nWhat would you like to do?",
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

        # Greeting queries
        if any(greet in message for greet in ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"]):
            return "greeting"

        # Clear/empty cart
        if any(phrase in message for phrase in ["clear cart", "empty cart", "remove everything", "delete everything", "clear my cart"]):
            return "clear_cart"

        # Remove from cart
        if any(phrase in message for phrase in ["remove", "delete", "take out"]) and ("cart" in message or "product" in message):
            return "remove_from_cart"

        # Multi-product add to cart (check before single add)
        if ("add" in message or "put" in message) and len(self._extract_product_ids(message)) > 1:
            return "add_multiple_to_cart"

        # Add to cart
        if any(phrase in message for phrase in ["add product", "add item", "add this", "add to cart", "put in cart"]):
            return "add_to_cart"

        # Checkout with products
        if "checkout" in message and any(word in message for word in ["add", "put", "product"]):
            return "add_and_checkout"
        
        # Checkout
        if any(phrase in message for phrase in ["checkout", "buy now", "purchase", "place order", "pay now", "proceed to checkout"]):
            return "checkout"

        # Cart queries
        if any(phrase in message for phrase in ["my cart", "show cart", "view cart", "cart contents", "what's in my cart"]) or message.strip() == "cart":
            return "cart_query"

        # Product by ID
        if re.search(r'product\s*(?:id|#)?\s*(\d+)', message) or re.search(r'id\s*:?\s*\d+', message):
            return "product_by_id"

        # ShopHub info - check before product search
        if self._detect_shophub_topic(message):
            return "shophub_info"
        
        # Product search keywords
        product_keywords = ["product", "item", "buy", "shop", "find", "show", "looking for", "need", "want", "price", "cost", "cheap", "expensive", "available"]
        
        if any(keyword in message for keyword in product_keywords):
            return "product_search"
        
        return "unknown"
    
    def _extract_product_ids(self, message: str) -> List[str]:
        """
        Extract multiple product IDs from message.
        Handles: "Add product 5, 6, and 7", "products 1 2 3", "product 5 and 9"
        """
        pattern1 = r'products?\s+(\d+(?:\s*,?\s*(?:and\s+)?\d+)*)'
        pattern2 = r'\b(\d+)\b'
        
        matches = re.findall(pattern1, message.lower())
        
        product_ids = []
        if matches:
            for match in matches:
                numbers = re.findall(r'\d+', match)
                product_ids.extend(numbers)
        else:
            product_ids = re.findall(pattern2, message)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_ids = []
        for pid in product_ids:
            if pid not in seen:
                seen.add(pid)
                unique_ids.append(pid)
        
        return unique_ids

    def _extract_quantity(self, message: str) -> int:
        """
        Extract quantity from message.
        Handles: "add 2 of product 5", "add 5 products", "put 3 items"
        """
        patterns = [
            r'(\d+)\s+(?:of|x)\s+product',
            r'(\d+)\s+products?',
            r'(\d+)\s+items?',
            r'add\s+(\d+)\s+',
            r'put\s+(\d+)\s+',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message.lower())
            if match:
                quantity = int(match.group(1))
                return min(quantity, 99)
        
        return 1

    async def _handle_cart_query(self, session_id: str) -> Dict[str, Any]:
        """Handle cart query intent."""
        cart = await get_cart(session_id)

        if cart['item_count'] == 0:
            return {
                "response": "Your cart is currently empty. Browse our products and add items you like!",
                "intent": "cart_query",
                "cart": cart,
                "action": "browse_products"
            }
        else:
            items_list = "\n".join([
                f"- {item['title']} (x{item['quantity']}): ${item['subtotal']:.2f}" 
                for item in cart['items']])
            
            response_text = (
                f"Here's what's in your cart:\n\n{items_list}\n\n"
                f"Total: ${cart['total']:.2f}\n\n"
                f"Ready to checkout?"
            )
            return {
                "response": response_text,
                "intent": "cart_query",
                "cart": cart,
                "action": "show_checkout_button"
            }
    
    async def _handle_clear_cart(self, session_id: str) -> Dict[str, Any]:
        """Handle clearing the entire cart."""
        cart = await get_cart(session_id)
        
        if cart['item_count'] == 0:
            return {
                "response": "Your cart is already empty.",
                "intent": "clear_cart",
                "cart": cart
            }
        
        await clear_cart(session_id)
        updated_cart = await get_cart(session_id)
        
        return {
            "response": "Your cart has been cleared successfully.",
            "intent": "clear_cart",
            "cart": updated_cart,
            "action": "browse_products"
        }
    
    async def _handle_remove_from_cart(self, session_id: str, product_ids: List[str]) -> Dict[str, Any]:
        """Handle removing products from cart."""
        if not product_ids:
            return {
                "response": "Please specify which product to remove. For example: 'Remove product 5 from cart'",
                "intent": "remove_from_cart"
            }
        
        products = await get_products()
        removed_products = []
        failed_products = []
        
        for product_id in product_ids:
            product = next((p for p in products if str(p['id']) == product_id), None)
            
            if not product:
                failed_products.append(product_id)
                continue
            
            try:
                await remove_from_cart(session_id, product_id)
                removed_products.append(product)
            except Exception as e:
                print(f"Failed to remove product {product_id}: {e}")
                failed_products.append(product_id)
        
        cart = await get_cart(session_id)
        
        if not removed_products:
            return {
                "response": f"Could not remove products: {', '.join(failed_products)}. They may not be in your cart.",
                "intent": "remove_from_cart",
                "cart": cart
            }
        
        removed_names = [p['title'] for p in removed_products]
        response_parts = [
            f"Removed {len(removed_products)} item(s) from your cart:",
            *[f"• {name}" for name in removed_names]
        ]
        
        if failed_products:
            response_parts.append(f"\nCould not remove: {', '.join(failed_products)}")
        
        response_parts.append(f"\nYour cart now has {cart['item_count']} items totaling ${cart['total']:.2f}")
        
        return {
            "response": "\n".join(response_parts),
            "intent": "remove_from_cart",
            "cart": cart,
            "removed_products": removed_products
        }
        
    async def _handle_add_multiple_to_cart(self, session_id: str, product_ids: List[str], quantity: int = 1) -> Dict[str, Any]:
        """Handle adding multiple products to cart in one request."""
        if not product_ids:
            return {
                "response": "Please specify which products to add. For example: 'Add products 5, 6, and 7 to cart'",
                "intent": "add_multiple_to_cart"
            }
        
        products = await get_products()
        added_products = []
        failed_products = []
        
        for product_id in product_ids:
            product = next((p for p in products if str(p['id']) == product_id), None)
            
            if not product:
                failed_products.append(product_id)
                continue
            
            try:
                await add_to_cart(session_id, product_id, quantity=quantity)
                added_products.append(product)
            except Exception as e:
                print(f"Failed to add product {product_id}: {e}")
                failed_products.append(product_id)
        
        cart = await get_cart(session_id)
        
        if not added_products:
            return {
                "response": f"Sorry, I couldn't add any products. IDs {', '.join(failed_products)} were not found.",
                "intent": "add_multiple_to_cart"
            }
        
        added_names = [p['title'] for p in added_products]
        response_parts = [
            f"Added {len(added_products)} item(s) to your cart:",
            *[f"• {name} (x{quantity})" for name in added_names]
        ]
        
        if failed_products:
            response_parts.append(f"\nCould not find: {', '.join(failed_products)}")
        
        response_parts.append(f"\nCart total: {cart['item_count']} items - ${cart['total']:.2f}")
        
        return {
            "response": "\n".join(response_parts),
            "intent": "add_multiple_to_cart",
            "cart": cart,
            "added_products": added_products,
            "action": "show_cart_button"
        }

    async def _handle_add_and_checkout(self, session_id: str, product_ids: List[str], quantity: int = 1) -> Dict[str, Any]:
        """Handle adding products and immediately checking out."""
        if not product_ids:
            return {
                "response": "Please specify which products to add. For example: 'Add product 5 and checkout'",
                "intent": "add_and_checkout"
            }
        
        add_result = await self._handle_add_multiple_to_cart(session_id, product_ids, quantity)
        
        if not add_result.get('added_products'):
            return add_result
        
        cart = await get_cart(session_id)
        
        if cart['item_count'] == 0:
            return {
                "response": "Your cart is empty. Add items first.",
                "intent": "add_and_checkout"
            }
        
        added_count = len(add_result['added_products'])
        response = (
            f"Added {added_count} item(s) to cart!\n\n"
            f"Ready to checkout:\n"
            f"Items: {cart['item_count']}\n"
            f"Total: ${cart['total']:.2f}\n\n"
            f"Click the button below to proceed to checkout."
        )
        
        return {
            "response": response,
            "intent": "add_and_checkout",
            "cart": cart,
            "checkout_ready": True,
            "added_products": add_result['added_products'],
            "action": "redirect_to_checkout"
        }
        
    async def _handle_checkout(self, session_id: str) -> Dict[str, Any]:
        """Handle checkout requests"""
        cart = await get_cart(session_id)

        if cart['item_count'] == 0:
            return {
                "response": "Your cart is empty. Add products before checking out!",
                "intent": "checkout",
                "cart": cart,
                "action": "browse_products"
            }

        return {
            "response": (
                f"Ready to checkout!\n\n"
                f"Items: {cart['item_count']}\n"
                f"Total: ${cart['total']:.2f}\n\n"
                f"Click the button below to enter shipping and payment details."
            ),
            "intent": "checkout",
            "cart": cart,
            "checkout_ready": True,
            "action": "redirect_to_checkout"
        }
    
    async def _handle_product_by_id(self, session_id: str, product_id: str) -> Dict[str, Any]:
        """Handle requests for specific product by ID."""
        if not product_id:
            return {
                "response": "Please provide a valid product ID.",
                "intent": "product_by_id"
            }
        
        products = await get_products()
        product = next((p for p in products if str(p['id']) == product_id), None)

        if not product:
            return {
                "response": f"Product ID {product_id} not found.",
                "intent": "product_by_id"
            }
        
        return {
            "response": (
                f"{product['title']}\n\n"
                f"${product['price']}\n"
                f"{product['category']}\n\n"
                f"{product['description']}\n\n"
                f"Add product {product_id} to cart?"
            ),
            "intent": "product_by_id",
            "product": product,
            "action": "show_add_to_cart_button"
        }
    
    async def _handle_add_to_cart(self, session_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
        """Handle adding product to cart."""
        if not product_id:
            return {
                "response": "Please specify which product to add.",
                "intent": "add_to_cart"
            }
        
        try:
            cart = await add_to_cart(session_id, product_id, quantity)
            products = await get_products()
            product = next((p for p in products if str(p['id']) == product_id), None)
            
            if not product:
                return {
                    "response": f"Product ID {product_id} not found.",
                    "intent": "add_to_cart"
                }
            
            qty_text = f" (x{quantity})" if quantity > 1 else ""
            return {
                "response": (
                    f"Added {product['title']}{qty_text} to cart!\n\n"
                    f"Cart: {cart['item_count']} items - ${cart['total']:.2f}"
                ),
                "intent": "add_to_cart",
                "cart": cart,
                "product": product,
                "action": "show_cart_button"
            }
        except ValueError as e:
            return {
                "response": str(e),
                "intent": "add_to_cart"
            }
    
    async def _handle_shophub_info(self, query: str, topic: str) -> Dict[str, Any]:
        """Handle ShopHub info queries using ChromaDB filtering."""
        try:
            # Query ChromaDB with proper where clause using $and operator
            results = self.collection.query(
                query_embeddings=[create_embeddings([query])[0]],
                n_results=3,
                where={
                    "$and": [
                        {"type": {"$eq": "hub_info"}},
                        {"topic": {"$eq": topic}}
                    ]
                }
            )

            # Check if results exist
            if not results or not results.get("metadatas") or not results["metadatas"][0]: # type: ignore
                return {
                    "response": f"I couldn't find information about {topic}. Try asking about shipping, returns, refunds, or support.",
                    "intent": "hub_info",
                    "topic": topic
                }

            # Extract metadata
            metadata = results["metadatas"][0][0] # type: ignore
            
            # Get title and answer from metadata
            title = metadata.get("title", topic.capitalize())
            answer = metadata.get("answer", "Information not available.")

            return {
                "response": f"{title}\n\n{answer}",
                "intent": "hub_info",
                "topic": topic
            }
        
        except Exception as e:
            print(f"Error in _handle_shophub_info: {e}")
            return {
                "response": "Sorry, I encountered an error retrieving that information. Please try again.",
                "intent": "hub_info",
                "topic": topic
            }
    
    async def _handle_semantic_search(self, query: str) -> Dict[str, Any]:
        """Handle product search using ChromaDB."""
        try:
            query_embedding = create_embeddings([query])[0]
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=3,
                where={"type": {"$eq": "product"}}
            )
            
            if not results or not results.get("metadatas") or not results["metadatas"][0]: # type: ignore
                return {
                    "response": "I couldn't find relevant products. Could you rephrase your search?",
                    "intent": "product_search"
                }
            
            response_parts = []
            for i, meta in enumerate(results["metadatas"][0]): # type: ignore
                response_parts.append(
                    f"{i+1}. {meta['title']} - ${meta['price']} | ID: {meta['product_id']}"
                )

            return {
                "response": "\n".join(response_parts) + "\n\nAdd any to cart?",
                "intent": "product_search",
                "action": "show_product_buttons"
            }
        
        except Exception as e:
            print(f"Error in _handle_semantic_search: {e}")
            return {
                "response": "Sorry, I encountered an error searching for products. Please try again.",
                "intent": "product_search"
            }


# Singleton instance
_chatbot_service = None


def get_chatbot_service() -> ChatbotService:
    """Get singleton instance of ChatbotService."""
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service
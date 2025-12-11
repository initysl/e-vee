import re
from typing import List, Dict, Any
from app.embeddings.chroma_client import get_chroma_client
from app.services.product_service import get_products
from app.embeddings.embed_products import create_embeddings, embed_and_store_products
from app.services.cart_service import get_cart, add_to_cart, get_cart_item_count
from app.services.product_service import get_products

class ChatbotService:
    """ Chatbot responses based on user quries """

    def __init__(self):
        self.collection = get_chroma_client()

    async def process_message(self, message: str, session_id: str) -> Dict[str, Any] | None:
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

        # Route to appropriate hadnler
        if intent == "cart_query":
            return await self._handle_checkout(session_id)
        
        elif intent == "checkout":
            return await self._handle_checkout(session_id)
        
        elif intent == "product_by_id":
            product_id = self._extract_product_id(message)
            if product_id is None:
                return {
                    "response": "Please provide a valid product ID. For example: 'Tell me about product 5'",
                    "intent": "product_by_id"
                }
            return await self._handle_add_to_cart(session_id, product_id)
        
        elif intent == "product_search" or intent == "shophub_info":
            return await self._handle_semantic_search(message)
        
        else:
            return{
                "response": "I'm E-vee, your shopping assistant. I can help you find products, check your cart, or answer questions about our store. How can i help you today?",
                "intent":"greeting"
            }

    def _detect_intent(self, message: str) -> str:
        """
        Classify user intent based on keywords.
        Args:
            message: User's message in lowercase
        Returns:
            str: Detected intent
        """

        # Grettings queries
        if any(greet in message for greet in ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]):
            return "greeting"

        # Cart  queries
        if any(word in message for word in ["cart", "my cart", "show cart", "view cart", "my items", "what's in my"]):
            return "cart_query"
        
        # Checkout intent
        if any(word in message for word in ["checkout", "buy now", "purchase", "place order", "pay"]):
            return "checkout"
        
        # Add to cart 
        if any(phrase in message for phrase in ["add product", "add item","add this", "add to cart", "put in cart"]):
            return "add_to_cart"
        
        # Product by ID
        if re.search(r'products\s*(?:id|#)?\s*(\d+)', message) or re.search(r'id\s*:?\s*\d+', message):
            return "product_by_id"
        
        # Shophub (shipping, returns, etc.) 
        if any(word in message for word in ["shipping", "return", "refund", "policy," "delivery", "warranty", "support", "help"]):
            return "shophub_info"
        
        # Product search (default for most queries)
        return "product_search"
    
    def _extract_product_id(self, message: str) -> str | None:
        """Extract product ID from user message."""
        match = re.search(r'\d+', message)
        return match.group(0) if match else None

    async def _handle_cart_query(self, session_id: str) -> Dict[str, Any]:
        """Handle cart query intent."""
        cart = await get_cart(session_id)

        if cart['item_count'] == 0:
            return {
                "response": "Your cart is currently empty. Would you like to add some products?",
                "intent": "cart_query"
            }
        else:
            items_list = "\n".join([
                f"- {item['title']} (x{item['quantity']}): ${item['subtotal']:.2f}" 
                for item in cart['items']])
            
            response_text = f"Here's what's in your cart:\n\n{items_list}\n\nTotal: ${cart['total']:.2f}\n\nReady to checkout?"
            return {
                "response": response_text,
                "intent": "cart_details",
                "cart": cart
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
            "response": f"**{product['title']}**\n\nPrice: ${product['price']}\nCategory: {product['category']}\n\n{product['description']}\n\nWould you like to add this to your cart?",
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
                "response": f"Added **{product['title']}** to your cart! You now have {cart['item_count']} items totaling ${cart['total']:.2f}.",
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
        
        if not results.get('documents') or not isinstance(results['documents'], list) or not results['documents'][0]:
            return {
                "response": "I couldn't find relevant information. Could you rephrase your question?",
                "intent": "product_search"
            }
        
        # Format results
        response_parts = []
        products_found = []
        
        for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])): # type: ignore
            if metadata['type'] == 'product':
                products_found.append(metadata)
                response_parts.append(
                    f"{i+1}. **{metadata['title']}** - ${metadata['price']}\n"
                    f"   Category: {metadata['category']}\n"
                    f"   Product ID: {metadata['product_id']}"
                )
            elif metadata['type'] == 'hub_info':
                if metadata.get('content_type') == 'faq':
                    response_parts.append(f"**{metadata['question']}**\n{metadata['answer']}")
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
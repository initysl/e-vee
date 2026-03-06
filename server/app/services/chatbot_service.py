import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.embeddings.chroma_client import get_chroma_client
from app.services.chat_session_service import get_chat_session, save_chat_session
from app.services.chatbot_tools import (
    add_to_cart_tool,
    cart_query_tool,
    checkout_readiness_tool,
    clear_cart_tool,
    compare_products_tool,
    hub_info_tool,
    product_detail_tool,
    remove_from_cart_tool,
    search_products_tool,
)


@dataclass
class ParsedRequest:
    intent: str
    product_ids: List[str] = field(default_factory=list)
    quantity: int = 1
    topic: Optional[str] = None
    query: Optional[str] = None
    sort_hint: str = "relevance"
    reference_indices: List[int] = field(default_factory=list)


class ChatbotService:
    """Session-aware shopping assistant built around structured actions."""

    TOPIC_KEYWORDS = {
        "shipping": ["shipping", "ship"],
        "return": ["return", "returns"],
        "refund": ["refund", "refunds"],
        "delivery": ["delivery", "deliver"],
        "warranty": ["warranty", "guarantee"],
        "support": ["support", "help", "customer service", "service"],
        "contact": ["contact"],
        "policy": ["policy", "policies", "terms", "privacy"],
    }

    CATEGORY_SYNONYMS = {
        "electronics": ["electronics", "electronic", "gadget", "gadgets", "tech"],
        "jewelery": ["jewelery", "jewelry", "jewel", "jewels", "ring", "necklace"],
        "men's clothing": ["men", "mens", "male", "shirt", "jacket"],
        "women's clothing": ["women", "womens", "female", "dress", "skirt", "bag"],
    }

    ORDINAL_MAP = {
        "first": 0,
        "1st": 0,
        "one": 0,
        "second": 1,
        "2nd": 1,
        "two": 1,
        "third": 2,
        "3rd": 2,
        "three": 2,
        "fourth": 3,
        "4th": 3,
        "four": 3,
        "last": -1,
    }

    STOP_WORDS = {
        "a",
        "an",
        "the",
        "for",
        "and",
        "or",
        "to",
        "me",
        "show",
        "find",
        "want",
        "need",
        "please",
        "some",
        "that",
        "this",
        "with",
        "about",
    }

    def __init__(self):
        self.collection = get_chroma_client()

    async def process_message(self, message: str, session_id: str) -> Dict[str, Any]:
        session = await get_chat_session(session_id)
        request = self._parse_request(message, session)
        result = await self._dispatch(request, session_id, session)
        await self._persist_session(session, message, result, request)
        return result

    def _parse_request(self, message: str, session: Dict[str, Any]) -> ParsedRequest:
        normalized = message.strip()
        message_lower = normalized.lower()
        explicit_ids = self._extract_product_ids(normalized)
        quantity = self._extract_quantity(message_lower)
        reference_indices = self._extract_reference_indices(message_lower)
        resolved_ids = self._resolve_product_ids(message_lower, session, explicit_ids, reference_indices)
        topic = self._detect_topic(message_lower)
        sort_hint = self._detect_sort_hint(message_lower)

        if self._is_greeting(message_lower):
            return ParsedRequest(intent="greeting")

        if self._contains_phrase(
            message_lower,
            ["clear cart", "empty cart", "remove everything", "delete everything", "clear my cart"],
        ):
            return ParsedRequest(intent="clear_cart")

        if self._contains_phrase(
            message_lower,
            ["my cart", "show cart", "view cart", "cart contents", "what's in my cart", "what is in my cart"],
        ) or message_lower == "cart":
            return ParsedRequest(intent="cart_query")

        if "checkout" in message_lower and any(word in message_lower for word in ["add", "put", "buy"]):
            return ParsedRequest(
                intent="add_and_checkout",
                product_ids=resolved_ids,
                quantity=quantity,
                reference_indices=reference_indices,
            )

        if self._contains_phrase(
            message_lower,
            ["checkout", "buy now", "purchase", "place order", "pay now", "proceed to checkout"],
        ):
            return ParsedRequest(intent="checkout")

        if topic and (
            "policy" in message_lower
            or "shipping" in message_lower
            or "return" in message_lower
            or "refund" in message_lower
            or "support" in message_lower
            or "contact" in message_lower
            or "delivery" in message_lower
            or "warranty" in message_lower
        ):
            return ParsedRequest(intent="hub_info", topic=topic)

        if self._contains_phrase(message_lower, ["compare", "difference", "vs", "versus"]):
            return ParsedRequest(
                intent="compare_products",
                product_ids=resolved_ids,
                reference_indices=reference_indices,
            )

        if any(word in message_lower for word in ["remove", "delete", "take out"]):
            return ParsedRequest(
                intent="remove_from_cart",
                product_ids=resolved_ids,
                reference_indices=reference_indices,
            )

        if any(word in message_lower for word in ["add", "put", "include"]) and (
            "cart" in message_lower or resolved_ids
        ):
            return ParsedRequest(
                intent="add_to_cart",
                product_ids=resolved_ids,
                quantity=quantity,
                reference_indices=reference_indices,
            )

        if resolved_ids and self._contains_phrase(
            message_lower,
            ["tell me about", "details", "more about", "what about", "show me", "describe"],
        ):
            return ParsedRequest(
                intent="product_detail",
                product_ids=resolved_ids,
                reference_indices=reference_indices,
            )

        if resolved_ids and not any(
            word in message_lower for word in ["cart", "checkout", "remove", "delete", "add", "put"]
        ):
            return ParsedRequest(
                intent="product_detail",
                product_ids=resolved_ids,
                reference_indices=reference_indices,
            )

        if topic:
            return ParsedRequest(intent="hub_info", topic=topic)

        if self._looks_like_search(message_lower):
            base_query = session.get("last_query") if self._is_refinement(message_lower) else None
            query = normalized if not base_query else f"{base_query} {normalized}".strip()
            return ParsedRequest(intent="product_search", query=query, sort_hint=sort_hint)

        return ParsedRequest(intent="unknown")

    async def _dispatch(
        self,
        request: ParsedRequest,
        session_id: str,
        session: Dict[str, Any],
    ) -> Dict[str, Any]:
        if request.intent == "greeting":
            return {
                "response": "Hi, I'm E-vee. I can search products, compare options, manage your cart, and help you checkout.",
                "intent": "greeting",
                "suggestions": self._build_suggestions(
                    ("Browse products", "Show me popular products"),
                    ("View cart", "What's in my cart?"),
                ),
            }

        if request.intent == "cart_query":
            return await self._handle_cart_query(session_id)

        if request.intent == "clear_cart":
            return await self._handle_clear_cart(session_id)

        if request.intent == "remove_from_cart":
            return await self._handle_remove_from_cart(session_id, request.product_ids)

        if request.intent == "add_and_checkout":
            add_result = await self._handle_add_to_cart(session_id, request.product_ids, request.quantity)
            if add_result.get("cart", {}).get("item_count", 0) == 0:
                return add_result
            add_result["action"] = "redirect_to_checkout"
            add_result["checkout_ready"] = True
            add_result["suggestions"] = self._build_suggestions(
                ("Go to checkout", "Checkout"),
                ("Review cart", "What's in my cart?"),
            )
            return add_result

        if request.intent == "checkout":
            return await self._handle_checkout(session_id)

        if request.intent == "hub_info":
            return await self._handle_hub_info(request.topic or "support")

        if request.intent == "compare_products":
            return await self._handle_compare_products(request.product_ids)

        if request.intent == "product_detail":
            product_id = request.product_ids[0] if request.product_ids else None
            return await self._handle_product_detail(product_id)

        if request.intent == "add_to_cart":
            return await self._handle_add_to_cart(session_id, request.product_ids, request.quantity)

        if request.intent == "product_search":
            return await self._handle_product_search(request.query or "", request.sort_hint, session)

        return {
            "response": (
                "I can help with product discovery, product details, cart actions, and checkout. "
                "Try asking for electronics, asking about a product, or checking your cart."
            ),
            "intent": "unknown",
            "suggestions": self._build_suggestions(
                ("Find electronics", "Show me some electronics"),
                ("View cart", "What's in my cart?"),
            ),
        }

    async def _persist_session(
        self,
        session: Dict[str, Any],
        user_message: str,
        result: Dict[str, Any],
        request: ParsedRequest,
    ) -> None:
        history = session.get("history", [])
        history.extend(
            [
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": result.get("response", ""), "intent": result.get("intent")},
            ]
        )

        session["history"] = history
        session["last_intent"] = result.get("intent")
        session["last_query"] = request.query or session.get("last_query")
        session["last_topic"] = result.get("topic") or request.topic
        if result.get("preferred_product_id") is not None:
            session["preferred_product_id"] = str(result["preferred_product_id"])

        products = result.get("products") or []
        product = result.get("product")

        if products:
            session["last_results"] = products[:5]
            session["last_product_id"] = str(result.get("preferred_product_id") or products[0]["id"])
        elif product:
            session["last_product_id"] = str(product["id"])
            session["last_results"] = session.get("last_results", [])

        await save_chat_session(session["session_id"], session)

    async def _handle_cart_query(self, session_id: str) -> Dict[str, Any]:
        cart = await cart_query_tool(session_id)

        if cart["item_count"] == 0:
            return {
                "response": "Your cart is empty. I can help you find products to add.",
                "intent": "cart_query",
                "cart": cart,
                "action": "browse_products",
                "suggestions": self._build_suggestions(
                    ("Browse market", "Show me popular products"),
                    ("Find electronics", "Show me some electronics"),
                ),
            }

        items_list = "\n".join(
            [
                f"- {item['title']} x{item['quantity']} (${item['subtotal']:.2f})"
                for item in cart["items"]
            ]
        )
        response = (
            f"Here's your cart:\n\n{items_list}\n\n"
            f"Total items: {cart['item_count']}\n"
            f"Subtotal: ${cart['total']:.2f}"
        )
        return {
            "response": response,
            "intent": "cart_query",
            "cart": cart,
            "action": "show_checkout_button",
            "suggestions": self._build_suggestions(
                ("Proceed to checkout", "Checkout"),
                ("Remove an item", "Remove product 1 from cart"),
            ),
        }

    async def _handle_clear_cart(self, session_id: str) -> Dict[str, Any]:
        cart = await cart_query_tool(session_id)
        if cart["item_count"] == 0:
            return {
                "response": "Your cart is already empty.",
                "intent": "clear_cart",
                "cart": cart,
            }

        updated_cart = await clear_cart_tool(session_id)
        return {
            "response": "I cleared your cart.",
            "intent": "clear_cart",
            "cart": updated_cart,
            "action": "browse_products",
            "suggestions": self._build_suggestions(
                ("Browse market", "Show me popular products"),
            ),
        }

    async def _handle_remove_from_cart(self, session_id: str, product_ids: List[str]) -> Dict[str, Any]:
        if not product_ids:
            return {
                "response": "Tell me which product to remove, for example: 'Remove product 5 from cart'.",
                "intent": "remove_from_cart",
            }

        tool_result = await remove_from_cart_tool(session_id, product_ids)
        removed_products = tool_result["products"]
        failed_products = tool_result["failed_products"]
        cart = tool_result["cart"]
        if not removed_products:
            return {
                "response": "I couldn't remove those items. They may not be in your cart.",
                "intent": "remove_from_cart",
                "cart": cart,
            }

        removed_names = ", ".join(product["title"] for product in removed_products)
        response = f"Removed {removed_names} from your cart."
        if failed_products:
            response += f" I couldn't remove: {', '.join(failed_products)}."

        return {
            "response": response,
            "intent": "remove_from_cart",
            "cart": cart,
            "products": removed_products,
            "suggestions": self._build_suggestions(
                ("View cart", "What's in my cart?"),
                ("Checkout", "Checkout"),
            ),
        }

    async def _handle_add_to_cart(
        self,
        session_id: str,
        product_ids: List[str],
        quantity: int,
    ) -> Dict[str, Any]:
        if not product_ids:
            return {
                "response": "Tell me which product to add, for example: 'Add product 5 to cart'.",
                "intent": "add_to_cart",
            }

        tool_result = await add_to_cart_tool(session_id, product_ids, quantity)
        added_products = tool_result["products"]
        failed_products = tool_result["failed_products"]
        cart = tool_result["cart"]
        if not added_products:
            return {
                "response": "I couldn't add those items to your cart.",
                "intent": "add_to_cart",
                "cart": cart,
            }

        titles = ", ".join(product["title"] for product in added_products)
        response = (
            f"Added {titles} to your cart"
            f"{f' (x{quantity})' if quantity > 1 else ''}.\n\n"
            f"Cart now has {cart['item_count']} items totaling ${cart['total']:.2f}."
        )

        if failed_products:
            response += f"\nI couldn't find: {', '.join(failed_products)}."

        return {
            "response": response,
            "intent": "add_to_cart",
            "cart": cart,
            "products": added_products,
            "action": "show_cart_button",
            "suggestions": self._build_suggestions(
                ("View cart", "What's in my cart?"),
                ("Checkout", "Checkout"),
            ),
        }

    async def _handle_checkout(self, session_id: str) -> Dict[str, Any]:
        cart = await checkout_readiness_tool(session_id)
        if cart["item_count"] == 0:
            return {
                "response": "Your cart is empty. Add something before checking out.",
                "intent": "checkout",
                "cart": cart,
                "action": "browse_products",
                "suggestions": self._build_suggestions(
                    ("Browse market", "Show me some electronics"),
                ),
            }

        return {
            "response": (
                f"You're ready to checkout.\n\n"
                f"Items: {cart['item_count']}\n"
                f"Subtotal: ${cart['total']:.2f}\n\n"
                f"Open checkout when you're ready."
            ),
            "intent": "checkout",
            "cart": cart,
            "checkout_ready": True,
            "action": "redirect_to_checkout",
            "suggestions": self._build_suggestions(
                ("Go to checkout", "Checkout"),
                ("Review cart", "What's in my cart?"),
            ),
        }

    async def _handle_product_detail(self, product_id: Optional[str]) -> Dict[str, Any]:
        product = await product_detail_tool(product_id)
        if not product_id or not product:
            return {
                "response": "Tell me which product you want details about." if not product_id else f"I couldn't find product {product_id}.",
                "intent": "product_detail",
            }

        product_data = product
        rating = product_data.get("rating") or {}
        rating_line = ""
        if rating:
            rating_line = f"\nRating: {rating.get('rate', 'N/A')} ({rating.get('count', 0)} reviews)"

        response = (
            f"{product_data['title']}\n"
            f"Price: ${float(product_data['price']):.2f}\n"
            f"Category: {product_data['category']}"
            f"{rating_line}\n\n"
            f"{product_data['description']}"
        )

        return {
            "response": response,
            "intent": "product_detail",
            "product": product_data,
            "products": [product_data],
            "suggestions": self._build_suggestions(
                ("Add to cart", f"Add product {product_id} to cart"),
                ("Show similar", f"Show me more {product_data['category']} like this"),
            ),
        }

    async def _handle_compare_products(self, product_ids: List[str]) -> Dict[str, Any]:
        compared_products = await compare_products_tool(product_ids)
        if len(compared_products) < 2:
            return {
                "response": "I need two products to compare. Try: 'Compare the first and second one'.",
                "intent": "compare_products",
            }

        first, second = compared_products[:2]

        first_rating = first.get("rating", {}).get("rate", "N/A")
        second_rating = second.get("rating", {}).get("rate", "N/A")

        response = (
            f"Comparison:\n\n"
            f"{first['title']}\n"
            f"- Price: ${float(first['price']):.2f}\n"
            f"- Category: {first['category']}\n"
            f"- Rating: {first_rating}\n\n"
            f"{second['title']}\n"
            f"- Price: ${float(second['price']):.2f}\n"
            f"- Category: {second['category']}\n"
            f"- Rating: {second_rating}\n\n"
            f"The cheaper option is {'the first' if float(first['price']) <= float(second['price']) else 'the second'} item."
        )

        return {
            "response": response,
            "intent": "compare_products",
            "products": [first, second],
            "preferred_product_id": first["id"] if float(first["price"]) <= float(second["price"]) else second["id"],
            "suggestions": self._build_suggestions(
                ("Add the cheaper one", f"Add product {first['id'] if float(first['price']) <= float(second['price']) else second['id']} to cart"),
                ("Show me cheaper options", "Show me cheaper options"),
            ),
        }

    async def _handle_hub_info(self, topic: str) -> Dict[str, Any]:
        metadata = await hub_info_tool(self.collection, topic)
        if metadata:
            return {
                "response": f"{metadata['title']}\n\n{metadata['answer']}",
                "intent": "hub_info",
                "topic": topic,
            }

        return {
            "response": f"I couldn't find information about {topic}. Try shipping, returns, refunds, contact, or support.",
            "intent": "hub_info",
            "topic": topic,
        }

    async def _handle_product_search(
        self,
        query: str,
        sort_hint: str,
        session: Dict[str, Any],
    ) -> Dict[str, Any]:
        products = await search_products_tool(
            self.collection,
            query,
            sort_hint,
            session,
            self.CATEGORY_SYNONYMS,
            self.STOP_WORDS,
        )
        if not products:
            return {
                "response": "I couldn't find relevant products. Try a category like electronics or a specific product type.",
                "intent": "product_search",
                "suggestions": self._build_suggestions(
                    ("Show electronics", "Show me some electronics"),
                    ("Show jewelry", "Show me some jewelry"),
                ),
            }

        response_lines = ["Here are the best matches I found:"]
        for index, product in enumerate(products, start=1):
            response_lines.append(
                f"{index}. {product['title']} - ${product['price']:.2f} ({product['category']})"
            )

        response_lines.append(
            "\nYou can say 'tell me about the first one', 'compare the first and second', or 'add product 3 to cart'."
        )

        suggestions = []
        if products:
            suggestions.append(("First product details", "Tell me about the first one"))
            suggestions.append(("Cheaper options", "Show me cheaper options"))

        return {
            "response": "\n".join(response_lines),
            "intent": "product_search",
            "products": products,
            "query_used": query,
            "suggestions": self._build_suggestions(*suggestions),
        }

    def _resolve_product_ids(
        self,
        message: str,
        session: Dict[str, Any],
        explicit_ids: List[str],
        reference_indices: List[int],
    ) -> List[str]:
        if explicit_ids:
            return explicit_ids

        resolved: List[str] = []
        last_results = session.get("last_results", [])
        for index in reference_indices:
            if not last_results:
                continue
            resolved_index = len(last_results) - 1 if index == -1 else index
            if 0 <= resolved_index < len(last_results):
                resolved.append(str(last_results[resolved_index]["id"]))

        if resolved:
            return resolved

        if any(word in message for word in ["cheaper", "cheapest", "affordable", "better"]) and session.get("preferred_product_id"):
            return [str(session["preferred_product_id"])]

        if any(word in message for word in ["this", "that", "it", "one"]) and session.get("last_product_id"):
            return [str(session["last_product_id"])]

        return []

    def _extract_product_ids(self, message: str) -> List[str]:
        pattern = r"product\s*(?:id|#)?\s*(\d+)"
        ids = re.findall(pattern, message.lower())
        if ids:
            return ids

        if "products" in message.lower():
            return re.findall(r"\b(\d+)\b", message)

        return []

    def _extract_quantity(self, message: str) -> int:
        patterns = [
            r"(\d+)\s+(?:of|x)\s+product",
            r"add\s+(\d+)\s+",
            r"put\s+(\d+)\s+",
        ]
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                return min(int(match.group(1)), 99)
        return 1

    def _extract_reference_indices(self, message: str) -> List[int]:
        indices = []
        for token, index in self.ORDINAL_MAP.items():
            if re.search(rf"\b{re.escape(token)}\b", message):
                indices.append(index)

        seen = set()
        ordered = []
        for index in indices:
            if index in seen:
                continue
            seen.add(index)
            ordered.append(index)
        return ordered

    def _detect_topic(self, message: str) -> Optional[str]:
        for topic, keywords in self.TOPIC_KEYWORDS.items():
            for keyword in keywords:
                if re.search(rf"\b{re.escape(keyword)}\b", message):
                    return topic
        return None

    def _detect_sort_hint(self, message: str) -> str:
        if any(word in message for word in ["cheap", "cheaper", "affordable", "lowest"]):
            return "price_asc"
        return "relevance"

    def _looks_like_search(self, message: str) -> bool:
        if self._find_category_filter(message):
            return True

        if self._find_max_price(message) is not None:
            return True

        return any(
            phrase in message
            for phrase in [
                "show me",
                "find",
                "search",
                "looking for",
                "need",
                "want",
                "browse",
                "products",
                "items",
                "cheaper options",
            ]
        )

    def _is_refinement(self, message: str) -> bool:
        return any(word in message for word in ["cheaper", "cheap", "affordable", "more like", "similar"])

    def _is_greeting(self, message: str) -> bool:
        return bool(
            re.fullmatch(
                r"(hello|hi|hey|good morning|good afternoon|good evening|how are you)[!. ]*",
                message.strip(),
            )
        )

    def _contains_phrase(self, message: str, phrases: List[str]) -> bool:
        return any(phrase in message for phrase in phrases)

    def _build_suggestions(self, *items: tuple[str, str]) -> List[Dict[str, str]]:
        return [{"label": label, "prompt": prompt} for label, prompt in items if label and prompt]

    def _find_category_filter(self, message: str) -> Optional[str]:
        for category, keywords in self.CATEGORY_SYNONYMS.items():
            for keyword in keywords:
                if re.search(rf"\b{re.escape(keyword)}\b", message):
                    return category
        return None

    def _find_max_price(self, message: str) -> Optional[float]:
        match = re.search(r"(?:under|below|less than|max)\s*\$?(\d+(?:\.\d+)?)", message)
        if match:
            return float(match.group(1))
        return None


_chatbot_service: Optional[ChatbotService] = None


def get_chatbot_service() -> ChatbotService:
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service

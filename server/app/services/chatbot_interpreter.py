import re
from typing import Any, Dict, List, Optional

from app.services.chatbot_types import ParsedRequest


class ChatRequestInterpreter:
    """Schema-driven interpreter for raw user messages."""

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

    def interpret(self, message: str, session: Dict[str, Any]) -> ParsedRequest:
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

        if topic and any(
            keyword in message_lower
            for keyword in ["policy", "shipping", "return", "refund", "support", "contact", "delivery", "warranty"]
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

    def _resolve_product_ids(
        self,
        message: str,
        session: Dict[str, Any],
        explicit_ids: List[str],
        reference_indices: List[int],
    ) -> List[str]:
        if explicit_ids:
            return explicit_ids

        if any(word in message for word in ["cheaper", "cheapest", "affordable", "better"]) and session.get("preferred_product_id"):
            return [str(session["preferred_product_id"])]

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

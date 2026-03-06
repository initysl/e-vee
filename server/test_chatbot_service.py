import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

fake_chroma_client_module = types.ModuleType("app.embeddings.chroma_client")
fake_chroma_client_module.get_chroma_client = lambda: None
sys.modules.setdefault("app.embeddings.chroma_client", fake_chroma_client_module)

fake_embed_products_module = types.ModuleType("app.embeddings.embed_products")
fake_embed_products_module.create_embeddings = lambda texts: [[0.1, 0.2, 0.3] for _ in texts]
sys.modules.setdefault("app.embeddings.embed_products", fake_embed_products_module)

fake_chat_session_module = types.ModuleType("app.services.chat_session_service")
fake_chat_session_module.get_chat_session = AsyncMock()
fake_chat_session_module.save_chat_session = AsyncMock()
sys.modules.setdefault("app.services.chat_session_service", fake_chat_session_module)

fake_cart_module = types.ModuleType("app.services.cart_service")
fake_cart_module.add_to_cart = AsyncMock()
fake_cart_module.clear_cart = AsyncMock()
fake_cart_module.get_cart = AsyncMock()
fake_cart_module.remove_from_cart = AsyncMock()
sys.modules.setdefault("app.services.cart_service", fake_cart_module)

fake_product_module = types.ModuleType("app.services.product_service")
fake_product_module.get_products = AsyncMock()
sys.modules.setdefault("app.services.product_service", fake_product_module)

from app.services.chatbot_service import ChatbotService


class FakeCollection:
    def get(self, where=None):
        topic = None
        if where and "$and" in where:
            for clause in where["$and"]:
                if "topic" in clause:
                    topic = clause["topic"]["$eq"]

        if topic == "return":
            return {
                "metadatas": [
                    {
                        "title": "Return Policy",
                        "answer": "30-day returns are supported.",
                    }
                ]
            }

        return {"metadatas": []}

    def query(self, query_embeddings=None, n_results=4, where=None):
        return {
            "metadatas": [
                [
                    {"product_id": "1"},
                    {"product_id": "2"},
                ]
            ]
        }


class ChatbotServiceTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.service = ChatbotService()
        self.service.collection = FakeCollection()

        self.products = [
            {
                "id": 1,
                "title": "Wireless Headphones",
                "price": 89.99,
                "description": "Noise cancelling over-ear headphones",
                "category": "electronics",
                "image": "https://example.com/1.jpg",
                "rating": {"rate": 4.6, "count": 120},
            },
            {
                "id": 2,
                "title": "Budget Earbuds",
                "price": 29.99,
                "description": "Affordable in-ear earbuds",
                "category": "electronics",
                "image": "https://example.com/2.jpg",
                "rating": {"rate": 4.1, "count": 80},
            },
            {
                "id": 3,
                "title": "Leather Jacket",
                "price": 140.0,
                "description": "Classic men's clothing jacket",
                "category": "men's clothing",
                "image": "https://example.com/3.jpg",
                "rating": {"rate": 4.7, "count": 35},
            },
        ]

    async def test_follow_up_detail_uses_previous_search_results(self):
        session_store = {}

        async def fake_get_chat_session(session_id):
            return session_store.get(
                session_id,
                {
                    "session_id": session_id,
                    "history": [],
                    "last_intent": None,
                    "last_query": None,
                    "last_topic": None,
                    "last_product_id": None,
                    "preferred_product_id": None,
                    "last_results": [],
                },
            )

        async def fake_save_chat_session(session_id, session):
            session_store[session_id] = session

        with patch(
            "app.services.chatbot_service.get_chat_session",
            new=AsyncMock(side_effect=fake_get_chat_session),
        ), patch(
            "app.services.chatbot_service.save_chat_session",
            new=AsyncMock(side_effect=fake_save_chat_session),
        ), patch(
            "app.services.chatbot_tools.get_products",
            new=AsyncMock(return_value=self.products),
        ), patch(
            "app.services.chatbot_tools.create_embeddings",
            return_value=[[0.1, 0.2, 0.3]],
        ):
            search = await self.service.process_message("Show me some electronics", "session-1")
            detail = await self.service.process_message("Tell me about the first one", "session-1")

        self.assertEqual(search["intent"], "product_search")
        self.assertEqual(detail["intent"], "product_detail")
        self.assertEqual(detail["product"]["id"], search["products"][0]["id"])
        self.assertIn(search["products"][0]["title"], detail["response"])
        self.assertEqual(session_store["session-1"]["last_product_id"], str(search["products"][0]["id"]))

    async def test_compare_and_add_flow_uses_session_context(self):
        session_store = {}
        cart_state = {"item_count": 0, "total": 0.0, "items": []}

        async def fake_get_chat_session(session_id):
            return session_store.get(
                session_id,
                {
                    "session_id": session_id,
                    "history": [],
                    "last_intent": None,
                    "last_query": None,
                    "last_topic": None,
                    "last_product_id": None,
                    "preferred_product_id": None,
                    "last_results": [],
                },
            )

        async def fake_save_chat_session(session_id, session):
            session_store[session_id] = session

        async def fake_add_to_cart(session_id, product_id, quantity):
            product = next(item for item in self.products if str(item["id"]) == str(product_id))
            cart_state["item_count"] += quantity
            cart_state["total"] += float(product["price"]) * quantity
            existing = next((item for item in cart_state["items"] if item["product_id"] == str(product_id)), None)
            if existing:
                existing["quantity"] += quantity
                existing["subtotal"] += float(product["price"]) * quantity
            else:
                cart_state["items"].append(
                    {
                        "product_id": str(product_id),
                        "title": product["title"],
                        "price": float(product["price"]),
                        "quantity": quantity,
                        "subtotal": float(product["price"]) * quantity,
                        "image": product["image"],
                    }
                )

        async def fake_get_cart(session_id):
            return {
                "session_id": session_id,
                "item_count": cart_state["item_count"],
                "total": round(cart_state["total"], 2),
                "items": cart_state["items"],
            }

        with patch(
            "app.services.chatbot_service.get_chat_session",
            new=AsyncMock(side_effect=fake_get_chat_session),
        ), patch(
            "app.services.chatbot_service.save_chat_session",
            new=AsyncMock(side_effect=fake_save_chat_session),
        ), patch(
            "app.services.chatbot_tools.get_products",
            new=AsyncMock(return_value=self.products),
        ), patch(
            "app.services.chatbot_tools.create_embeddings",
            return_value=[[0.1, 0.2, 0.3]],
        ), patch(
            "app.services.chatbot_tools.add_to_cart",
            new=AsyncMock(side_effect=fake_add_to_cart),
        ), patch(
            "app.services.chatbot_tools.get_cart",
            new=AsyncMock(side_effect=fake_get_cart),
        ):
            await self.service.process_message("Show me some electronics", "session-2")
            compare = await self.service.process_message("Compare the first and second one", "session-2")
            add = await self.service.process_message("Add the cheaper one to cart", "session-2")
            cart = await self.service.process_message("What's in my cart?", "session-2")

        self.assertEqual(compare["intent"], "compare_products")
        self.assertEqual(len(compare["products"]), 2)
        self.assertIn("Budget Earbuds", add["response"])
        self.assertEqual(add["intent"], "add_to_cart")
        self.assertEqual(cart["cart"]["item_count"], 1)
        self.assertAlmostEqual(cart["cart"]["total"], 29.99, places=2)

    async def test_hub_info_query_returns_policy_answer(self):
        async def fake_get_chat_session(session_id):
            return {
                "session_id": session_id,
                "history": [],
                "last_intent": None,
                "last_query": None,
                "last_topic": None,
                "last_product_id": None,
                "preferred_product_id": None,
                "last_results": [],
            }

        with patch(
            "app.services.chatbot_service.get_chat_session",
            new=AsyncMock(side_effect=fake_get_chat_session),
        ), patch(
            "app.services.chatbot_service.save_chat_session",
            new=AsyncMock(),
        ):
            result = await self.service.process_message("What's your return policy?", "session-3")

        self.assertEqual(result["intent"], "hub_info")
        self.assertIn("Return Policy", result["response"])


if __name__ == "__main__":
    unittest.main()

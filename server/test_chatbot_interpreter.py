import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.chatbot_interpreter import ChatRequestInterpreter


class ChatRequestInterpreterTests(unittest.TestCase):
    def setUp(self):
        self.interpreter = ChatRequestInterpreter()

    def test_follow_up_detail_resolves_first_result(self):
        session = {
            "last_query": "Show me some electronics",
            "last_results": [
                {"id": 7, "title": "First Product"},
                {"id": 9, "title": "Second Product"},
            ],
            "last_product_id": "7",
            "preferred_product_id": None,
        }

        request = self.interpreter.interpret("Tell me about the first one", session)

        self.assertEqual(request.intent, "product_detail")
        self.assertEqual(request.product_ids, ["7"])
        self.assertEqual(request.reference_indices, [0])

    def test_comparison_follow_up_prefers_selected_product(self):
        session = {
            "last_query": "Compare these",
            "last_results": [
                {"id": 7, "title": "First Product"},
                {"id": 9, "title": "Second Product"},
            ],
            "last_product_id": "7",
            "preferred_product_id": "9",
        }

        request = self.interpreter.interpret("Add the cheaper one to cart", session)

        self.assertEqual(request.intent, "add_to_cart")
        self.assertEqual(request.product_ids, ["9"])

    def test_refinement_keeps_previous_query_context(self):
        session = {
            "last_query": "Show me some electronics",
            "last_results": [],
            "last_product_id": None,
            "preferred_product_id": None,
        }

        request = self.interpreter.interpret("Show me cheaper options", session)

        self.assertEqual(request.intent, "product_search")
        self.assertEqual(request.sort_hint, "price_asc")
        self.assertEqual(request.query, "Show me some electronics Show me cheaper options")


if __name__ == "__main__":
    unittest.main()

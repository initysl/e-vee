import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.chatbot_selector import ChatToolSelector


class ChatToolSelectorTests(unittest.TestCase):
    def setUp(self):
        self.selector = ChatToolSelector()

    def test_add_and_checkout_selects_two_step_tool_plan(self):
        request = SimpleNamespace(
            intent="add_and_checkout",
            product_ids=["2"],
            quantity=3,
        )

        plan = self.selector.select(request)

        self.assertEqual(plan.intent, "add_and_checkout")
        self.assertEqual([call.name for call in plan.tool_calls], ["add_to_cart", "checkout_readiness"])
        self.assertEqual(plan.tool_calls[0].kwargs["product_ids"], ["2"])
        self.assertEqual(plan.tool_calls[0].kwargs["quantity"], 3)

    def test_unknown_request_returns_static_fallback(self):
        request = SimpleNamespace(intent="unknown")

        plan = self.selector.select(request)

        self.assertEqual(plan.intent, "unknown")
        self.assertEqual(plan.tool_calls, [])
        self.assertIsNotNone(plan.static_response)
        self.assertIn("product discovery", plan.static_response["response"])


if __name__ == "__main__":
    unittest.main()

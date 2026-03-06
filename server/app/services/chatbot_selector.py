from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.core.logging_config import log_info


@dataclass
class ToolCall:
    name: str
    kwargs: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolPlan:
    intent: str
    tool_calls: List[ToolCall] = field(default_factory=list)
    static_response: Optional[Dict[str, Any]] = None


class ChatToolSelector:
    """Selects the concrete tool plan for a parsed request."""

    def select(self, request: Any) -> ToolPlan:
        if request.intent == "greeting":
            plan = ToolPlan(
                intent="greeting",
                static_response={
                    "response": "Hi, I'm E-vee. I can search products, compare options, manage your cart, and help you checkout.",
                    "intent": "greeting",
                },
            )
        elif request.intent == "cart_query":
            plan = ToolPlan(
                intent="cart_query",
                tool_calls=[ToolCall(name="cart_query")],
            )
        elif request.intent == "clear_cart":
            plan = ToolPlan(
                intent="clear_cart",
                tool_calls=[
                    ToolCall(name="cart_query"),
                    ToolCall(name="clear_cart"),
                ],
            )
        elif request.intent == "remove_from_cart":
            plan = ToolPlan(
                intent="remove_from_cart",
                tool_calls=[
                    ToolCall(
                        name="remove_from_cart",
                        kwargs={"product_ids": request.product_ids},
                    )
                ],
            )
        elif request.intent == "add_and_checkout":
            plan = ToolPlan(
                intent="add_and_checkout",
                tool_calls=[
                    ToolCall(
                        name="add_to_cart",
                        kwargs={
                            "product_ids": request.product_ids,
                            "quantity": request.quantity,
                        },
                    ),
                    ToolCall(name="checkout_readiness"),
                ],
            )
        elif request.intent == "checkout":
            plan = ToolPlan(
                intent="checkout",
                tool_calls=[ToolCall(name="checkout_readiness")],
            )
        elif request.intent == "hub_info":
            plan = ToolPlan(
                intent="hub_info",
                tool_calls=[
                    ToolCall(name="hub_info", kwargs={"topic": request.topic or "support"})
                ],
            )
        elif request.intent == "compare_products":
            plan = ToolPlan(
                intent="compare_products",
                tool_calls=[
                    ToolCall(
                        name="compare_products",
                        kwargs={"product_ids": request.product_ids},
                    )
                ],
            )
        elif request.intent == "product_detail":
            plan = ToolPlan(
                intent="product_detail",
                tool_calls=[
                    ToolCall(
                        name="product_detail",
                        kwargs={
                            "product_id": request.product_ids[0] if request.product_ids else None
                        },
                    )
                ],
            )
        elif request.intent == "add_to_cart":
            plan = ToolPlan(
                intent="add_to_cart",
                tool_calls=[
                    ToolCall(
                        name="add_to_cart",
                        kwargs={
                            "product_ids": request.product_ids,
                            "quantity": request.quantity,
                        },
                    )
                ],
            )
        elif request.intent == "product_search":
            plan = ToolPlan(
                intent="product_search",
                tool_calls=[
                    ToolCall(
                        name="search_products",
                        kwargs={
                            "query": request.query or "",
                            "sort_hint": request.sort_hint,
                        },
                    )
                ],
            )
        else:
            plan = ToolPlan(
                intent="unknown",
                static_response={
                    "response": (
                        "I can help with product discovery, product details, cart actions, and checkout. "
                        "Try asking for electronics, asking about a product, or checking your cart."
                    ),
                    "intent": "unknown",
                },
            )

        log_info(
            "Selected chatbot tool plan",
            intent=plan.intent,
            tools=",".join(call.name for call in plan.tool_calls) or "none",
        )
        return plan

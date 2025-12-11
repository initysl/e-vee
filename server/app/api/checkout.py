from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel
from app.services.cart_service import get_cart, clear_cart

router = APIRouter(prefix="/checkout", tags=["checkout"])

class CheckoutRequest(BaseModel):
    shipping_address: str
    payment_method: str
    total_amount: float
    phone: Optional[str] = None

class CheckoutResponse(BaseModel):
    order_id: str
    total: float
    status: str
    message: str
    items: list

@router.post("/", response_model=CheckoutResponse)
async def process_checkout(request: CheckoutRequest, session_id: Optional[str] = Header(None)):
    """
    Process checkout for the current cart.
    In a real app, this would integrate with payment processing.
    """
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    
    try:
        cart = await get_cart(session_id)
        if cart['item_count'] == 0:
            raise HTTPException(status_code=400, detail="Shipping address and email are required")
        
        # Simulate order processing
        order_id = "ORDER" + session_id[-6:].upper()
        total = cart['total']
        status = "Success"
        message = "Order placed successfully"

        # Clear the cart after checkout
        await clear_cart(session_id)
        return CheckoutResponse(
            order_id=order_id,
            total=total,
            status=status,
            message=message,
            items=cart['items']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Checkout error: " + str(e))


@router.get("/summary")
async def checkout_summary(session_id: Optional[str] = Header(None)):
    """Get checkout summary before final purchase.
    Shows cart items, total, and what will be charged.
    """
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    try:
        cart = await get_cart(session_id)
        if cart['item_count'] == 0:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        subtotal = cart['total']
        tax = round(subtotal * 0.07, 2)  # Example: 7% tax
        shipping = 5.00 if subtotal < 50 else 0.00  # Free shipping over $50
        total = round(subtotal + tax + shipping, 2)

        return {
            "items": cart['items'],
            "subtotal": subtotal,
            "tax": tax,
            "shipping": shipping,
            "total": total,
            "item_count": cart['item_count']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Checkout summary error: " + str(e))
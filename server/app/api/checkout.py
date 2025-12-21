from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel, EmailStr
import uuid

from app.services.cart_service import get_cart, clear_cart

router = APIRouter(prefix="/checkout", tags=["checkout"])

class CheckoutRequest(BaseModel):
    email: EmailStr
    phone: str
    shipping_address: str
    payment_method: str

class CheckoutResponse(BaseModel):
    order_id: str
    total: float
    message: str
    estimated_delivery: str

class CheckoutSummary(BaseModel):
    items: list
    subtotal: float
    tax: float
    shipping: float
    total: float
    item_count: int

@router.post("/process", response_model=CheckoutResponse)
async def process_checkout(
    request: CheckoutRequest, 
    session_id: Optional[str] = Header(None)
):
    """
    Process checkout for the current cart.
    Validates cart, calculates totals, and creates order.
    """
    if not session_id:
        raise HTTPException(
            status_code=400, 
            detail="Missing session_id header"
        )
    
    try:
        # Get cart
        cart = await get_cart(session_id)
        
        if cart['item_count'] == 0:
            raise HTTPException(
                status_code=400, 
                detail="Cannot checkout with empty cart"
            )
        
        # Calculate totals
        subtotal = cart['total']
        tax = round(subtotal * 0.08, 2)  # 8% tax
        shipping = 0.00 if subtotal >= 50 else 5.99  # Free shipping over $50
        total = round(subtotal + tax + shipping, 2)
        
        # Generate order ID
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # In production: process payment here
        # payment_result = process_payment(request.payment_method, total)
        
        # Clear cart after successful order
        await clear_cart(session_id)
        
        return CheckoutResponse(
            order_id=order_id,
            total=total,
            message="Your order has been placed successfully! You'll receive a confirmation email shortly.",
            estimated_delivery="3-5 business days"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Checkout error: {str(e)}"
        )


@router.get("/summary", response_model=CheckoutSummary)
async def checkout_summary(session_id: Optional[str] = Header(None)):
    """
    Get checkout summary before final purchase.
    Shows cart items, subtotal, tax, shipping, and total.
    """
    if not session_id:
        raise HTTPException(
            status_code=400, 
            detail="Missing session_id header"
        )
    
    try:
        cart = await get_cart(session_id)
        
        if cart['item_count'] == 0:
            raise HTTPException(
                status_code=400, 
                detail="Cart is empty"
            )
        
        subtotal = cart['total']
        tax = round(subtotal * 0.08, 2)  # 8% tax
        shipping = 0.00 if subtotal >= 50 else 5.99  # Free shipping over $50
        total = round(subtotal + tax + shipping, 2)

        return {
            "items": cart['items'],
            "subtotal": subtotal,
            "tax": tax,
            "shipping": shipping,
            "total": total,
            "item_count": cart['item_count']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Checkout summary error: {str(e)}"
        )
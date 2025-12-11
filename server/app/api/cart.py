from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from pydantic import BaseModel
from app.services.cart_service import (
    get_cart,
    add_to_cart,
    remove_from_cart,
    update_quantity,
    clear_cart
    )

router = APIRouter(prefix="/cart", tags=["cart"])

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1

class UpdateQuantityRequest(BaseModel):
    product_id: str
    quantity: int


@router.get("/")
async def view_cart(session_id: Optional[str] = Header(None)):
    """Get current cart contents."""
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    try:
        cart = await get_cart(session_id)
        return cart
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
async def add_item_to_cart(request: AddToCartRequest, session_id: Optional[str] = Header(None)):
    """Add item to cart."""
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    try:
        cart = await add_to_cart(session_id, request.product_id, request.quantity)
        return {"message":"Item added to cart", "cart": cart}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.put("/update")
async def update_cart_item(request: UpdateQuantityRequest, session_id: Optional[str] = Header(None)):
    """Update item quantity in cart."""
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    try:
        cart = await update_quantity(session_id, request.product_id, request.quantity)
        return {"message":"Cart item updated", "cart": cart}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/remove/{product_id}")
async def remove_item_from_cart(product_id: str, session_id: Optional[str] = Header(None)):
    """Remove item from cart"""
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    try:
        cart = await remove_from_cart(session_id, product_id)
        return {"message":"Item removed from cart", "cart": cart}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/clear")
async def clear_user_cart(session_id: Optional[str] = Header(None)):
    """Clear the entire cart."""
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    try:
        cart = await clear_cart(session_id)
        return {"message": "Cart cleared", "cart": cart}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
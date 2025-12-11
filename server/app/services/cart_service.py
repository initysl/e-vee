from typing import Any, Dict
from app.services.product_service import get_products

# In-memory cart storage: {session_id: {product_id: quantity}}
_carts: Dict[str, Dict[str, int]] = {}


async def get_cart(session_id: str) -> Dict[str, Any]:
    """
    Get cart contents for a session.
    Args:
        session_id: User session identifier
    Returns:
        dict: Cart with items and total
    """
    if session_id not in _carts:
        _carts[session_id] = {}
    
    cart_items = _carts[session_id]
    products = await get_products()
    
    # Build cart details
    items = []
    total = 0.0
    
    for product_id, quantity in cart_items.items():
        product = next((p for p in products if str(p['id']) == product_id), None)
        if product:
            item_total = product['price'] * quantity
            items.append({
                'product_id': product_id,
                'title': product['title'],
                'price': product['price'],
                'quantity': quantity,
                'subtotal': item_total,
                'image': product.get('image', '')
            })
            total += item_total
    
    return {
        'session_id': session_id,
        'items': items,
        'total': round(total, 2),
        'item_count': sum(cart_items.values())
    }


async def add_to_cart(session_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
    """
    Add product to cart.
    Args:
        session_id: User session identifier
        product_id: Product ID to add
        quantity: Quantity to add
    Returns:
        dict: Updated cart
    """
    if session_id not in _carts:
        _carts[session_id] = {}
    
    # Verify product exists
    products = await get_products()
    product = next((p for p in products if str(p['id']) == product_id), None)
    
    if not product:
        raise ValueError(f"Product {product_id} not found")
    
    # Add or update quantity
    if product_id in _carts[session_id]:
        _carts[session_id][product_id] += quantity
    else:
        _carts[session_id][product_id] = quantity
    
    return await get_cart(session_id)


async def remove_from_cart(session_id: str, product_id: str) -> Dict[str, Any]:
    """
    Remove product from cart.
    Args:
        session_id: User session identifier
        product_id: Product ID to remove
    Returns:
        dict: Updated cart
    """
    if session_id in _carts and product_id in _carts[session_id]:
        del _carts[session_id][product_id]
        
    
    return await get_cart(session_id)


async def update_quantity(session_id: str, product_id: str, quantity: int) -> Dict[str, Any]:
    """
    Update product quantity in cart.
    Args:
        session_id: User session identifier
        product_id: Product ID
        quantity: New quantity (0 removes item)
    Returns:
        dict: Updated cart
    """
    if quantity <= 0:
        return await remove_from_cart(session_id, product_id)
    
    if session_id not in _carts:
        _carts[session_id] = {}
    
    _carts[session_id][product_id] = quantity
    
    return await get_cart(session_id)


async def clear_cart(session_id: str) -> Dict[str, Any]:
    """
    Clear all items from cart.
    Args:
        session_id: User session identifier
    Returns:
        dict: Empty cart
    """
    if session_id in _carts:
        _carts[session_id] = {}
    
    return await get_cart(session_id)


def get_cart_item_count(session_id: str) -> int:
    """
    Get total number of items in cart.
    Args:
        session_id: User session identifier
    Returns:
        int: Total item count
    """
    if session_id not in _carts:
        return 0
    
    return sum(_carts[session_id].values())
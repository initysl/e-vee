import os
from typing import Any, Dict
import json
from redis.exceptions import RedisError
from app.services.product_service import get_products, get_redis_client
from app.core.logging_config import log_error, log_info, log_warning

CART_KEY = "cart:"
CART_TTL = int(os.getenv("CART_CACHE_TTL","31536000"))


async def get_cart(session_id: str) -> Dict[str, Any]:
    """
    Get cart contents for a session from Redis.
    Args:
        session_id: User session identifier
    Returns:
        dict: Cart with items and total
    """
    try:
        redis = await get_redis_client()
        cart_key = f"{CART_KEY}{session_id}"
        
        # Get cart from Redis
        cached_cart = await redis.get(cart_key)
        cart_items = json.loads(cached_cart) if cached_cart else {}
        
        # Build cart details
        products = await get_products()
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
                    'subtotal': round(item_total, 2),
                    'image': product.get('image', '')
                })
                total += item_total
        
        log_info("Cart retrieved", session_id=session_id, item_count=len(items))
        
        return {
            'session_id': session_id,
            'items': items,
            'total': round(total, 2),
            'item_count': sum(cart_items.values())
        }
        
    except RedisError as e:
        log_error(e, "Redis error getting cart", session_id=session_id)
        return {
            'session_id': session_id,
            'items': [],
            'total': 0.0,
            'item_count': 0
        }
    except Exception as e:
        log_error(e, "Unexpected error getting cart", session_id=session_id)
        return {
            'session_id': session_id,
            'items': [],
            'total': 0.0,
            'item_count': 0
        }


async def add_to_cart(session_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
    """
    Add product to cart in Redis.
    Args:
        session_id: User session identifier
        product_id: Product ID to add
        quantity: Quantity to add
    Returns:
        dict: Updated cart
    """
    try:
        # Verify product exists
        products = await get_products()
        product = next((p for p in products if str(p['id']) == product_id), None)
        
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        redis = await get_redis_client()
        cart_key = f"{CART_KEY}{session_id}"
        
        # Get current cart
        cached_cart = await redis.get(cart_key)
        cart_items = json.loads(cached_cart) if cached_cart else {}
        
        # Add or update quantity
        if product_id in cart_items:
            cart_items[product_id] += quantity
        else:
            cart_items[product_id] = quantity
        
        # Save back to Redis with TTL
        await redis.setex(cart_key, CART_TTL, json.dumps(cart_items))
        
        log_info("Item added to cart", 
                 session_id=session_id, 
                 product_id=product_id, 
                 quantity=quantity)
        
        return await get_cart(session_id)
        
    except ValueError as e:
        log_warning(str(e), session_id=session_id, product_id=product_id)
        raise
    except RedisError as e:
        log_error(e, "Redis error adding to cart", session_id=session_id)
        raise
    except Exception as e:
        log_error(e, "Unexpected error adding to cart", session_id=session_id)
        raise


async def remove_from_cart(session_id: str, product_id: str) -> Dict[str, Any]:
    """
    Remove product from cart in Redis.
    Args:
        session_id: User session identifier
        product_id: Product ID to remove
    Returns:
        dict: Updated cart
    """
    try:
        redis = await get_redis_client()
        cart_key = f"{CART_KEY}{session_id}"
        
        # Get current cart
        cached_cart = await redis.get(cart_key)
        cart_items = json.loads(cached_cart) if cached_cart else {}
        
        # Remove item
        if product_id in cart_items:
            del cart_items[product_id]
            
            # Save back to Redis
            if cart_items:
                await redis.setex(cart_key, CART_TTL, json.dumps(cart_items))
            else:
                await redis.delete(cart_key)
            
            log_info("Item removed from cart", 
                     session_id=session_id, 
                     product_id=product_id)
        
        return await get_cart(session_id)
        
    except RedisError as e:
        log_error(e, "Redis error removing from cart", session_id=session_id)
        raise
    except Exception as e:
        log_error(e, "Unexpected error removing from cart", session_id=session_id)
        raise


async def update_quantity(session_id: str, product_id: str, quantity: int) -> Dict[str, Any]:
    """
    Update product quantity in cart in Redis.
    Args:
        session_id: User session identifier
        product_id: Product ID
        quantity: New quantity (0 removes item)
    Returns:
        dict: Updated cart
    """
    if quantity <= 0:
        return await remove_from_cart(session_id, product_id)
    
    try:
        redis = await get_redis_client()
        cart_key = f"{CART_KEY}{session_id}"
        
        # Get current cart
        cached_cart = await redis.get(cart_key)
        cart_items = json.loads(cached_cart) if cached_cart else {}
        
        # Update quantity
        cart_items[product_id] = quantity
        
        # Save back to Redis
        await redis.setex(cart_key, CART_TTL, json.dumps(cart_items))
        
        log_info("Cart quantity updated", 
                 session_id=session_id, 
                 product_id=product_id, 
                 quantity=quantity)
        
        return await get_cart(session_id)
        
    except RedisError as e:
        log_error(e, "Redis error updating cart", session_id=session_id)
        raise
    except Exception as e:
        log_error(e, "Unexpected error updating cart", session_id=session_id)
        raise


async def clear_cart(session_id: str) -> Dict[str, Any]:
    """
    Clear all items from cart in Redis.
    Args:
        session_id: User session identifier
    Returns:
        dict: Empty cart
    """
    try:
        redis = await get_redis_client()
        cart_key = f"{CART_KEY}{session_id}"
        
        # Delete cart from Redis
        await redis.delete(cart_key)
        
        log_info("Cart cleared", session_id=session_id)
        
        return await get_cart(session_id)
        
    except RedisError as e:
        log_error(e, "Redis error clearing cart", session_id=session_id)
        raise
    except Exception as e:
        log_error(e, "Unexpected error clearing cart", session_id=session_id)
        raise


async def get_cart_item_count(session_id: str) -> int:
    """
    Get total number of items in cart from Redis.
    Args:
        session_id: User session identifier
    Returns:
        int: Total item count
    """
    try:
        redis = await get_redis_client()
        cart_key = f"{CART_KEY}{session_id}"
        
        cached_cart = await redis.get(cart_key)
        cart_items = json.loads(cached_cart) if cached_cart else {}
        
        return sum(cart_items.values())
        
    except Exception as e:
        log_error(e, "Error getting cart item count", session_id=session_id)
        return 0
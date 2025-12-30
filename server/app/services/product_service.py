import os
from dotenv import load_dotenv
import httpx
from typing import List, Dict, Any, Optional
import json
from redis import asyncio as aioredis
from redis.exceptions import RedisError
import time
from app.core.logging_config import log_performance, log_error, log_warning, log_info


FAKE_STORE_URL = os.getenv("FAKE_STORE")
REDIS_URL = os.getenv("REDIS_URL")
CACHE_KEY = "products:all"
CACHE_TTL = int(os.getenv("PRODUCTS_CACHE_TTL","31536000"))

_redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    """Get or create Redis client singleton."""
    global _redis_client
    if _redis_client is None:
        start_time = time.time()
        try:
            _redis_client = await aioredis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            duration = time.time() - start_time
            log_performance("redis_connection", duration, status="success")
            log_info("Redis client initialized successfully")
        except Exception as e:
            duration = time.time() - start_time
            log_performance("redis_connection", duration, status="failed")
            log_error(e, "Failed to create Redis client", redis_url=REDIS_URL)
            raise
    return _redis_client


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.close()
            _redis_client = None
            log_info("Redis connection closed successfully")
        except Exception as e:
            log_error(e, "Error closing Redis connection")


async def _fetch_from_api() -> List[Dict[str, Any]]:
    """
    Internal function to fetch product data from the Fake Store API.
    Returns:
        List[Dict[str, Any]]: List of product dictionaries, or empty list on error.
    """
    if not FAKE_STORE_URL:
        error = ValueError("FAKE_STORE environment variable is not set")
        log_error(error, "Missing FAKE_STORE environment variable")
        raise error
    
    start_time = time.time()
    timeout = httpx.Timeout(10.0)
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(FAKE_STORE_URL)
            response.raise_for_status()
            products = response.json()
            
            duration = time.time() - start_time
            log_performance(
                "external_api_fetch",
                duration,
                url=FAKE_STORE_URL,
                status_code=response.status_code,
                product_count=len(products)
            )
            return products
            
    except httpx.TimeoutException as e:
        duration = time.time() - start_time
        log_performance("external_api_fetch", duration, status="timeout")
        log_error(e, "External API timeout", url=FAKE_STORE_URL, timeout=10.0)
        return []
    except httpx.HTTPStatusError as e:
        duration = time.time() - start_time
        log_performance("external_api_fetch", duration, status="http_error", status_code=e.response.status_code)
        log_error(e, "External API HTTP error", url=FAKE_STORE_URL, status_code=e.response.status_code)
        return []
    except httpx.RequestError as e:
        duration = time.time() - start_time
        log_performance("external_api_fetch", duration, status="request_error")
        log_error(e, "External API request error", url=FAKE_STORE_URL)
        return []
    except Exception as e:
        duration = time.time() - start_time
        log_performance("external_api_fetch", duration, status="unexpected_error")
        log_error(e, "Unexpected error during API fetch", url=FAKE_STORE_URL)
        return []


async def get_products(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Get product data with Redis caching.
    Args:
        force_refresh: If True, bypass cache and fetch fresh data.
    Returns:
        List[Dict[str, Any]]: List of product dictionaries from Redis cache or API.
    """
    start_time = time.time()
    
    try:
        redis = await get_redis_client()
        
        # Try Redis cache first unless force refresh
        if not force_refresh:
            try:
                cached_data = await redis.get(CACHE_KEY)
                if cached_data:
                    products = json.loads(cached_data)
                    duration = time.time() - start_time
                    log_performance(
                        "get_products",
                        duration,
                        source="redis_cache",
                        product_count=len(products)
                    )
                    log_info("Products retrieved from Redis cache", count=len(products))
                    return products
            except json.JSONDecodeError as e:
                log_error(e, "Failed to decode cached products from Redis")
        
        # Cache miss or force refresh - fetch from API
        log_info("Fetching products from external API", force_refresh=force_refresh)
        products = await _fetch_from_api()
        
        if products:
            try:
                # Store in Redis with TTL
                await redis.setex(
                    CACHE_KEY,
                    CACHE_TTL,
                    json.dumps(products)
                )
                duration = time.time() - start_time
                log_performance(
                    "get_products",
                    duration,
                    source="external_api",
                    product_count=len(products),
                    cached=True
                )
                log_info(
                    "Products cached in Redis",
                    count=len(products),
                    ttl=CACHE_TTL
                )
            except Exception as e:
                log_error(e, "Failed to cache products in Redis", product_count=len(products))
        else:
            log_warning("No products returned from external API")
        
        return products
        
    except RedisError as e:
        duration = time.time() - start_time
        log_performance("get_products", duration, source="fallback_api", status="redis_error")
        log_error(e, "Redis error - falling back to direct API call")
        return await _fetch_from_api()
    except Exception as e:
        duration = time.time() - start_time
        log_performance("get_products", duration, status="failed")
        log_error(e, "Unexpected error in get_products")
        return []


async def get_product_by_id(product_id: int) -> Optional[Dict[str, Any]]:
    """
    Get a specific product by ID from Redis cache.
    Args:
        product_id: The product ID to retrieve.
    Returns:
        Optional[Dict[str, Any]]: Product dictionary or None if not found.
    """
    start_time = time.time()
    
    try:
        redis = await get_redis_client()
        product_key = f"product:{product_id}"
        
        # Try individual product cache first
        try:
            cached_product = await redis.get(product_key)
            if cached_product:
                product = json.loads(cached_product)
                duration = time.time() - start_time
                log_performance(
                    "get_product_by_id",
                    duration,
                    product_id=product_id,
                    source="redis_cache"
                )
                return product
        except json.JSONDecodeError as e:
            log_error(e, "Failed to decode cached product", product_id=product_id)
        
        # If not in individual cache, search in main products cache
        products = await get_products()
        product = next((p for p in products if p.get("id") == product_id), None)
        
        if product:
            try:
                # Cache individual product for faster future lookups
                await redis.setex(
                    product_key,
                    CACHE_TTL,
                    json.dumps(product)
                )
                duration = time.time() - start_time
                log_performance(
                    "get_product_by_id",
                    duration,
                    product_id=product_id,
                    source="products_cache",
                    cached=True
                )
            except Exception as e:
                log_error(e, "Failed to cache individual product", product_id=product_id)
        else:
            duration = time.time() - start_time
            log_performance("get_product_by_id", duration, product_id=product_id, found=False)
            log_warning("Product not found", product_id=product_id)
        
        return product
        
    except RedisError as e:
        duration = time.time() - start_time
        log_performance("get_product_by_id", duration, product_id=product_id, status="redis_error")
        log_error(e, "Redis error in get_product_by_id", product_id=product_id)
        products = await get_products()
        return next((p for p in products if p.get("id") == product_id), None)
    except Exception as e:
        duration = time.time() - start_time
        log_performance("get_product_by_id", duration, product_id=product_id, status="failed")
        log_error(e, "Unexpected error in get_product_by_id", product_id=product_id)
        return None


async def clear_cache():
    """Clear the product cache in Redis."""
    start_time = time.time()
    
    try:
        redis = await get_redis_client()
        
        # Delete main products cache
        await redis.delete(CACHE_KEY)
        
        # Delete all individual product caches
        cursor = 0
        deleted_count = 0
        while True:
            cursor, keys = await redis.scan(cursor, match="product:*", count=100)
            if keys:
                await redis.delete(*keys)
                deleted_count += len(keys)
            if cursor == 0:
                break
        
        duration = time.time() - start_time
        log_performance("clear_cache", duration, keys_deleted=deleted_count + 1)
        log_info("Redis cache cleared", keys_deleted=deleted_count + 1)
        
    except RedisError as e:
        duration = time.time() - start_time
        log_performance("clear_cache", duration, status="failed")
        log_error(e, "Error clearing Redis cache")
    except Exception as e:
        duration = time.time() - start_time
        log_performance("clear_cache", duration, status="failed")
        log_error(e, "Unexpected error clearing cache")


async def get_cache_ttl() -> Optional[int]:
    """Get remaining TTL for products cache."""
    try:
        redis = await get_redis_client()
        ttl = await redis.ttl(CACHE_KEY)
        return ttl if ttl > 0 else None
    except RedisError as e:
        log_error(e, "Error getting cache TTL")
        return None
    except Exception as e:
        log_error(e, "Unexpected error getting cache TTL")
        return None
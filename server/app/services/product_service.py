import os
from dotenv import load_dotenv
import httpx
import asyncio
from typing import List, Dict, Any

load_dotenv()

FAKE_STORE_URL = os.getenv("FAKE_STORE")

# Module-level cache - fetch once and keep forever
_products_cache: List[Dict[str, Any]] = []


async def _fetch_from_api() -> List[Dict[str, Any]]:
    """
    Internal function to fetch product data from the Fake Store API.
    Returns:
        List[Dict[str, Any]]: List of product dictionaries, or empty list on error.
    """
    if not FAKE_STORE_URL:
        raise ValueError("FAKE_STORE environment variable is not set")
    
    timeout = httpx.Timeout(10.0)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(FAKE_STORE_URL)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        print(f"Request timed out for URL: {FAKE_STORE_URL}")
        return []
    except httpx.HTTPStatusError as e:
        print(f"HTTP error {e.response.status_code}: {e}")
        return []
    except httpx.RequestError as e:
        print(f"Request error: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []


async def get_products(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Get product data. Fetches from API only once on first call, then returns cached data.
    Args:
        force_refresh: If True, bypass cache and fetch fresh data.
    Returns:
        List[Dict[str, Any]]: List of product dictionaries from cache or API.
    """
    global _products_cache
    
    # Return cache if already populated and not forcing refresh
    if _products_cache and not force_refresh:
        print(f"Returning cached products ({len(_products_cache)} items)")
        return _products_cache
    
    # Fetch and cache data (only happens once unless force_refresh=True)
    print("Fetching products from API...")
    products = await _fetch_from_api()
    
    if products:
        _products_cache = products
        print(f"Cached {len(_products_cache)} products")
    
    return _products_cache


def clear_cache():
    """Clear the product cache."""
    global _products_cache
    _products_cache = []
    print("Cache cleared")


# if __name__ == "__main__":
#     # First call - fetches from API
#     products = asyncio.run(get_products())
#     print(f"Fetched {len(products)} products\n")
    
#     # Second call - returns from cache instantly
#     products = asyncio.run(get_products())
#     print(f"Got {len(products)} products from cache\n")
    
#     # Force refresh if needed
#     products = asyncio.run(get_products(force_refresh=True))
#     print(f"Force refreshed {len(products)} products")
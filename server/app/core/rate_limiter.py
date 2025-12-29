import os
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis

async def init_limiter():
    """
    Initialize FastAPI Limiter with Redis.
    Call this in your app startup event.
    """
    redis_client = await redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379"),
        encoding="utf-8",
        decode_responses=True
    )
    await FastAPILimiter.init(redis_client)


# Chatbot - moderate limit 
chatbot_limit = RateLimiter(times=30, seconds=60)  

# Product browsing - generous limit (cheap read operations)
product_limit = RateLimiter(times=100, seconds=60) 

# Cart operations - moderate limit (writes but frequent)
cart_limit = RateLimiter(times=50, seconds=60)  

# Checkout - strict limit (critical operation, prevent abuse)
checkout_limit = RateLimiter(times=5, seconds=60)  

# Aggressive limit for suspicious activity
strict_limit = RateLimiter(times=10, seconds=60) 
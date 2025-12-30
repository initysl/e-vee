import os
from dotenv import load_dotenv

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    load_dotenv(".env.production")
    print(f"Loading production environment from .env.production")
else:
    load_dotenv(".env")
    print(f"Loading development environment from .env")

from app.core.logging_config import log_error, log_info, log_warning
from app.services.product_service import close_redis
import time
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import api_router
from app.embeddings.embed_products import embed_and_store_products
from app.embeddings.chroma_client import get_collection_count
from app.core.rate_limiter import init_limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events for the application."""
    
    # Startup
    startup_time = time.time()
    log_info(f"Starting ShopHub E-commerce API in {ENVIRONMENT} mode")

    # Validate environment variables
    required_vars = ["FAKE_STORE", "REDIS_URL"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
        log_error(ValueError(error_msg), "Environment validation failed")
        raise ValueError(error_msg)

    # Safe logging of environment variables
    fake_store = os.getenv("FAKE_STORE", "")
    cache_ttl = os.getenv("PRODUCTS_CACHE_TTL", "3600")
    
    log_info("Environment variables validated", 
             fake_store=fake_store[:50] if fake_store else "NOT SET",
             redis_configured=bool(os.getenv("REDIS_URL")),
             cache_ttl=cache_ttl)

    # Initialize rate limiter
    try:
        await init_limiter()
        log_info("Rate limiter initialized successfully")
    except Exception as e:
        log_error(e, "Failed to initialize rate limiter")
        raise

    # Initialize ChromaDB and embeddings
    try:
        count = get_collection_count()
        if count == 0:
            log_info("No data found in ChromaDB, loading products and creating embeddings")
            await embed_and_store_products()
            count = get_collection_count()
            
            if count == 0:
                log_warning("No products were embedded. Check external API connectivity.")
        else:
            log_info("Found existing documents in ChromaDB", count=count)
        
        log_info("ChromaDB ready", document_count=count)
    except Exception as e:
        log_error(e, "Error during startup embedding process")
        if ENVIRONMENT == "production":
            raise  # Fail fast in production
        else:
            log_warning("Continuing startup despite embedding error (development mode)")
    
    startup_duration = time.time() - startup_time
    log_info("Startup complete", 
             duration=f"{startup_duration:.2f}s",
             environment=ENVIRONMENT)
    
    yield

    log_info("Shutting down ShopHub API")
    await close_redis()
    log_info("Shutdown complete")


app = FastAPI(
    title="ShopHub E-commerce API",
    description="RAG-powered e-commerce platform with chatbot assistance",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if ENVIRONMENT == "development" else None,  # Disable docs in production
    redoc_url="/redoc" if ENVIRONMENT == "development" else None
)


if ENVIRONMENT == "production":
    allowed_origins = [
        "https://e-vee.vercel.app",
    ]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "session-id", "Authorization"],
)

log_info(f"CORS configured for {ENVIRONMENT}", allowed_origins=allowed_origins)


# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Welcome to ShopHub E-commerce API!",
        "status": "running",
        "environment": ENVIRONMENT,
        "docs": "/docs" if ENVIRONMENT == "development" else "disabled",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        count = get_collection_count()
        
        # Check Redis connectivity
        from app.services.product_service import get_redis_client
        redis = await get_redis_client()
        redis_healthy =  redis.ping()
        
        return {
            "status": "healthy",
            "environment": ENVIRONMENT,
            "database": "connected",
            "documents_count": count,
            "redis": "connected" if redis_healthy else "disconnected"
        }
    except Exception as e:
        log_error(e, "Health check failed")
        return {
            "status": "unhealthy",
            "environment": ENVIRONMENT,
            "error": str(e)
        }


if __name__ == "__main__":
    # Development server configuration
    reload = ENVIRONMENT == "development"
    
    log_info(f"Starting uvicorn server", 
             host="0.0.0.0", 
             port=8000, 
             reload=reload,
             environment=ENVIRONMENT)
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=reload
    )
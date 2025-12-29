from dotenv import load_dotenv
load_dotenv()
from app.core.logging_config import log_error, log_info
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
    log_info("Starting ShopHub E-commerce API")

    # Initialize rate limiter
    try:
        await init_limiter()
        log_info("Rate limiter initialized successfully")
    except Exception as e:
        log_error(e, "Failed to initialize rate limiter")
        raise

    try:
        count = get_collection_count()
        if count == 0:
            log_info("No data found in ChromaDB, loading products and creating embeddings")
            await embed_and_store_products()
            count = get_collection_count()
        else:
            log_info(f"Found existing documents in ChromaDB", count=count)
        
        log_info("ChromaDB ready", document_count=count)
    except Exception as e:
        log_error(e, "Error during startup embedding process")
        raise
    
    startup_duration = time.time() - startup_time
    log_info(f"Startup complete", duration=f"{startup_duration:.2f}s")
    
    yield

    # Shutdown
    log_info("Shutting down ShopHub API")
    await close_redis()
    log_info("Shutdown complete")

# Initialize FastAPI app
app = FastAPI(
    title="ShopHub E-commerce API",
    description="RAG-powered e-commerce platform with chatbot assistance",
    version="1.0.0",
    lifespan=lifespan
)


# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "session-id", "Authorization"],
)


# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Welcome to ShopHub E-commerce API!",
        "status": "running",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """"Health check endpoint"""
    try:
        count = get_collection_count()
        return {
            "status": "healthy",
            "database": "connected",
            "documents_count": count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
    

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
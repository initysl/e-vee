import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import api_router
from app.embeddings.embed_products import embed_and_store_products
from app.embeddings.chroma_client import get_collection_count


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events for the application.
    Loads products and creates embeddings on startup.
    """

    # Startup
    print("Starting up.. Starting ShopHub E-commerce API..")

    try:
        count = get_collection_count()
        if count == 0:
            print("No data found. Loading products and creating embeddings...")
            await embed_and_store_products()
            count = get_collection_count()
        else:
            print(f"Found existing {count} documents in ChromaDB. Skipping embedding.")
        
        print(f"ChromaDB ready with {count} documents. ✅ ")
    except Exception as e:
        print(f"Error during startup embedding: {e} ❌")
        raise
    print("Startup complete; API is ready. ✅")
    yield

    # Shutdown
    print("Shutting down ShopHub API... 👋 ")


# Initialize FastAPI app
app = FastAPI(
    title="ShopHub E-commerce API",
    description="AI-powered e-commerce platform with chatbot assistance",
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
        "satus": "running",
        "docs:": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """"Health check endpoint"""
    try:
        count = get_collection_count()
        return {
            "satus": "healthy",
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
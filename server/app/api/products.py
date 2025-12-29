from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.services.product_service import get_products
from app.core.rate_limiter import product_limit

router = APIRouter(prefix="/products", tags=["products"])

class Product(BaseModel):
    id: int
    title: str
    price: float
    description: str
    category: str
    image: str
    rating: Optional[dict] = None

@router.get("/", response_model=List[Product], dependencies=[Depends(product_limit)])
async def list_products():
    """"Get all products."""
    try:
        products = await get_products()
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{product_id}", response_model=Product, dependencies=[Depends(product_limit)])
async def get_product_by_id(product_id: int):
    """"Get a specific product by ID."""
    try:
        products = await get_products()
        product = next((p for p in products if p['id'] == product_id), None)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/category/{category_name}", response_model=List[Product], dependencies=[Depends(product_limit)])
async def get_products_by_category(category_name: str):
    """"Get products by category."""
    try:
        products = await get_products()
        filtered_products = [p for p in products if p['category'].lower() == category_name.lower()]

        if not filtered_products:
            raise HTTPException(status_code=404, detail=f"No products found in category '{category_name}'")
    
        return filtered_products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/search/{query}", dependencies=[Depends(product_limit)])
async def search_products(query: str):
    """"Search products by title or description."""
    try:
        products = await get_products()
        query_lower = query.lower()
        matched_products = [
            p for p in products 
            if query_lower in p['title'].lower() or query_lower in p['description'].lower()
        ]
        
        if not matched_products:
            raise HTTPException(status_code=404, detail=f"No products matched the query '{query}'")
        
        return matched_products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
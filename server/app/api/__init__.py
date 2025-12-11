from fastapi import APIRouter
from app.api import products, cart, chatbot, checkout

api_router = APIRouter()

api_router.include_router(products.router)
api_router.include_router(cart.router)
api_router.include_router(chatbot.router)
api_router.include_router(checkout.router)
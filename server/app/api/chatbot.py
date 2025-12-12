from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel
from app.services.chatbot_service import get_chatbot_service

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    intent: str
    metadata: Optional[dict] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, session_id: Optional[str] = Header(None)):
    """"Process user message through chatbot."""
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Pls provide a message")
    
    try:
        chatbot = get_chatbot_service()
        response = await chatbot.process_message(request.message, session_id)
        if response is None:
            raise HTTPException(status_code=500, detail="Chatbot failed to process the message")
        
        return ChatResponse(
            response = response['response'],
            intent = response['intent'],
            metadata = {k:v for k,v in response.items() if k not in ['response','intent']}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")
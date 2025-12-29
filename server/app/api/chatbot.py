from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
from pydantic import BaseModel
from app.services.chatbot_service import get_chatbot_service
from app.core.rate_limiter import chatbot_limit

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    intent: str
    metadata: Optional[dict] = None


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(chatbot_limit)])
async def chat(request: ChatRequest, session_id: Optional[str] = Header(None)):
    """"Process user message through chatbot."""
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id header")
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Pls provide a message")
    
    try:
        chatbot = get_chatbot_service()
        result = await chatbot.process_message(request.message, session_id)

        if not isinstance(result, dict):
            raise HTTPException(
                status_code=500,
                detail=f"Invalid chatbot response type: {type(result)}"
            )

        if "response" not in result or "intent" not in result:
            raise HTTPException(
                status_code=500,
                detail="Chatbot response missing required keys"
            )

        return ChatResponse(
        response=result["response"],
        intent=result["intent"],
        metadata={k: v for k, v in result.items() if k not in ("response", "intent")}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")
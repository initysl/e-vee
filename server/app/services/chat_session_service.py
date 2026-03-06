import json
import os
from typing import Any, Dict

from redis.exceptions import RedisError

from app.core.logging_config import log_error, log_info, log_warning
from app.services.product_service import get_redis_client


CHAT_SESSION_PREFIX = "chat:session:"
CHAT_SESSION_TTL = int(os.getenv("CHAT_SESSION_TTL", "604800"))
MAX_CHAT_HISTORY = int(os.getenv("CHAT_HISTORY_LIMIT", "16"))


def build_default_session(session_id: str) -> Dict[str, Any]:
    return {
        "session_id": session_id,
        "history": [],
        "last_intent": None,
        "last_query": None,
        "last_topic": None,
        "last_product_id": None,
        "preferred_product_id": None,
        "last_results": [],
    }


async def get_chat_session(session_id: str) -> Dict[str, Any]:
    session = build_default_session(session_id)

    try:
        redis = await get_redis_client()
        payload = await redis.get(f"{CHAT_SESSION_PREFIX}{session_id}")

        if not payload:
            return session

        data = json.loads(payload)
        if not isinstance(data, dict):
            return session

        session.update(data)
        session["history"] = session.get("history", [])[-MAX_CHAT_HISTORY:]
        session["last_results"] = session.get("last_results", [])[:5]
        return session
    except (RedisError, json.JSONDecodeError) as exc:
        log_warning(
            "Falling back to default chat session",
            session_id=session_id,
            error=str(exc),
        )
        return session
    except Exception as exc:
        log_error(exc, "Unexpected error loading chat session", session_id=session_id)
        return session


async def save_chat_session(session_id: str, session: Dict[str, Any]) -> None:
    session = dict(session)
    session["session_id"] = session_id
    session["history"] = session.get("history", [])[-MAX_CHAT_HISTORY:]
    session["last_results"] = session.get("last_results", [])[:5]

    try:
        redis = await get_redis_client()
        await redis.setex(
            f"{CHAT_SESSION_PREFIX}{session_id}",
            CHAT_SESSION_TTL,
            json.dumps(session),
        )
        log_info("Chat session updated", session_id=session_id)
    except RedisError as exc:
        log_warning("Unable to persist chat session", session_id=session_id, error=str(exc))
    except Exception as exc:
        log_error(exc, "Unexpected error saving chat session", session_id=session_id)


async def clear_chat_session(session_id: str) -> None:
    try:
        redis = await get_redis_client()
        await redis.delete(f"{CHAT_SESSION_PREFIX}{session_id}")
        log_info("Chat session cleared", session_id=session_id)
    except RedisError as exc:
        log_warning("Unable to clear chat session", session_id=session_id, error=str(exc))
    except Exception as exc:
        log_error(exc, "Unexpected error clearing chat session", session_id=session_id)

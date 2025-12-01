from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from .ai_core import chat_model, system_prompt
from sqlalchemy.orm import Session
from db.models import ChatHistory
from datetime import datetime, timedelta
import uuid
import asyncio

async def generate_cyber_response(db: Session, session_id: uuid.UUID, user_text: str):

    # 1. Save user message immediately
    db.add(ChatHistory(
        session_id=session_id,
        role="user",
        content=user_text,
        last_activity=datetime.utcnow()
    ))
    db.commit()

    # 2. Load history
    messages = db.query(ChatHistory).filter(
        ChatHistory.session_id == session_id
    ).order_by(ChatHistory.id.asc()).limit(20).all()

    history = []
    for m in messages:
        if m.role == "user":
            history.append(HumanMessage(content=m.content))
        else:
            history.append(AIMessage(content=m.content))

    # --- Buffers ---
    full_output = ""        
    stream_buffer = ""        
    last_token_time = 0        

    def safe_boundary(text):
        t = text.strip()

        if t.endswith((".", "?", "!")):
            return True

        if t.endswith("```"):
            return True

        if t.startswith("#") and t.endswith("\n"):
            return True

        if t.endswith("\n") and (t.strip().startswith("- ") or t.strip().startswith("* ")):
            return True

        if len(t) > 60:
            return True

        return False

    async for chunk in chat_model.astream(history):
        token = chunk.content or ""

        full_output += token
        stream_buffer += token

        yield token

       
        if safe_boundary(stream_buffer):
            stream_buffer = ""  
            
    if stream_buffer.strip():
        cleaned = stream_buffer.strip()
        if not cleaned.endswith((".", "?", "!")):
            cleaned += "..."
        full_output += cleaned
        yield cleaned

    cleaned_full = full_output.strip()
    if not cleaned_full.endswith((".", "?", "!")):
        cleaned_full += "..."

    db.add(ChatHistory(
        session_id=session_id,
        role="ai",
        content=cleaned_full,
        last_activity=datetime.utcnow()
    ))
    db.commit()
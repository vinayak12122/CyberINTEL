from langchain_core.messages import AIMessage, HumanMessage
from .ai_core import chat_model
from sqlalchemy.orm import Session
from db.models import ChatHistory
from datetime import datetime
import uuid

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

    def safe_boundary(text):
        t = text.strip()
        return (
            t.endswith((".", "?", "!")) or
            t.endswith("```") or
            (t.startswith("#") and t.endswith("\n")) or
            (t.endswith("\n") and (t.strip().startswith("- ") or t.strip().startswith("* "))) or
            len(t) > 60
        )

    try:
        async for chunk in chat_model.astream(history):
            token = chunk.content or ""

            full_output += token
            stream_buffer += token

            yield token

            if safe_boundary(stream_buffer):
                stream_buffer = ""

    finally:

        if stream_buffer.strip():
            extra = stream_buffer.strip()
            if not extra.endswith((".", "?", "!")):
                extra += "..."
            full_output += extra

        cleaned_full = full_output.strip()
        if cleaned_full and not cleaned_full.endswith((".", "?", "!")):
            cleaned_full += "..."

        if cleaned_full:
            db.add(ChatHistory(
                session_id=session_id,
                role="assistant", 
                content=cleaned_full,
                last_activity=datetime.utcnow()
            ))
            db.commit()
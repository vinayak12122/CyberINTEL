from fastapi import APIRouter,Depends,HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import ChatHistory
from api.schema import ChatResponse,ChatRequest,FetchMessages
from ai.cyber_engine import generate_cyber_response
import uuid

router = APIRouter()


@router.get("/new-session")
async def create_session():
    new_session_id = uuid.uuid4()
    return {"session_id": str(new_session_id)}

@router.post("/chat")
async def chat(payload:ChatRequest,db:Session = Depends(get_db)):

    async def event_generator():
        async for chunk in generate_cyber_response(
            db,
            payload.session_id,
            payload.message
        ):
            yield f"data:{chunk}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/chat/{session_id}" ,response_model=list[FetchMessages])
async def get_chat_history(session_id:uuid.UUID,db:Session = Depends(get_db)):
    msgs = (
        db.query(ChatHistory)
        .filter(ChatHistory.session_id == session_id)
        .order_by(ChatHistory.id.asc())
        .all()
    )

    if msgs is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    out = [
        {
            "id": m.id,
            "session_id": str(m.session_id),
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in msgs
    ]

    return out
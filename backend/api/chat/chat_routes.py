from fastapi import APIRouter,Depends,Request,HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime,timezone

from db.database import get_db
from db.models import ChatSession,ChatHistory
from api.schema import AuthChatRequest
from utils import security
from ai.cyber_engine import generate_cyber_response

router = APIRouter()

@router.post("/new-session")
def new_session(db:Session = Depends(get_db),user=Depends(security.get_current_user)):
    session = ChatSession(user_id=user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id":str(session.session_id)}

@router.post("")
async def chat(
    payload: AuthChatRequest,
    request: Request,
    db: Session = Depends(get_db),
    user = Depends(security.get_current_user),
):
    if not payload.session_id:
        raise HTTPException(400, "session_id required")

    session = db.query(ChatSession).filter(
        ChatSession.session_id == payload.session_id,
        ChatSession.user_id == user.id
    ).one_or_none()

    if not session:
        raise HTTPException(403, "Invalid session or not owned by user")

    session_id = session.session_id

    session.last_activity = datetime.now(timezone.utc)
    db.commit()

    async def sse_response():
        async for chunk in generate_cyber_response(
            db=db,
            session_id=session_id,
            user_text=payload.message
        ):
            yield f"data:{chunk}\n\n"

    # print("SESSION STILL USED??", session)

    return StreamingResponse(sse_response(), media_type="text/event-stream")

@router.get("/{session_id}")
def get_history(session_id:UUID,db:Session = Depends(get_db),user=Depends(security.get_current_user)):
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == user.id
    ).one_or_none()

    if not session:
        raise HTTPException(403,"Not allowed")
    
    msgs = db.query(ChatHistory).filter(
        ChatHistory.session_id == session_id
    ).order_by(ChatHistory.id.asc()).all()

    return [
        {
            "id": m.id,
            "session_id": str(m.session_id),
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat()
        }
        for m in msgs
    ]
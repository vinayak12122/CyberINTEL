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

def generate_chat_title(messages):
    if not messages:
        return "New Chat"
    
    text = messages[0].content.strip()
    title = text[:50].split("\n")[0]

    if len(title) < 3:
        return "New Chat"
    return title


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

@router.delete("/{session_id}")
def delete_chat(session_id:UUID,db:Session = Depends(get_db),user=Depends(security.get_current_user)):
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == user.id,
    ).one_or_none()

    if not session:
        raise HTTPException(404,"Chat not found")
    
    db.delete(session)
    db.commit()

    return {"success":True}


@router.get("/search")
def search(q:str,db:Session = Depends(get_db),user=Depends(security.get_current_user)):
    sql = """
        SELECT ch.id, ch.session_id, ch.role, ch.content, ch.created_at
        FROM chat_history ch
        JOIN chat_sessions cs ON ch.session_id = cs.session_id
        WHERE cs.user_id = :uid 
          AND ch.content ILIKE :pattern
        ORDER BY ch.created_at DESC
        LIMIT 50;
    """

    rows = db.execute(sql,{
        "uid":user.id,
        "pattern":f"%{q}%"
    }).fetchall()

    return [dict(r) for r in rows]

@router.get("/session/all")
def list_sessions(db:Session = Depends(get_db),user=Depends(security.get_current_user)):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == user.id
    ).order_by(ChatSession.last_activity.desc()).all()

    formatted_sessions = []

    for s in sessions:
        if not s.title:
            first_msg = db.query(ChatHistory).filter(
                ChatHistory.session_id == s.session_id
            ).order_by(ChatHistory.created_at.asc()).first()

            if first_msg:
                generated_title = generate_chat_title([first_msg])
                s.title = generated_title
                db.commit()
            else:
                s.title = "New Chat"

        formatted_sessions.append({
            "session_id": str(s.session_id),
            "title": s.title,
            "created_at": s.created_at.isoformat(),
            "last_activity": s.last_activity.isoformat()
        })

    return formatted_sessions
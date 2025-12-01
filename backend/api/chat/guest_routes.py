from fastapi import APIRouter,Request,HTTPException
from fastapi.responses import StreamingResponse
from api.schema import GuestChatRequest
from ai.ai_core import chat_model,system_prompt
from langchain_core.messages import HumanMessage,SystemMessage
import asyncio

router = APIRouter()

async def _guest_stream(message: str):
    full_prompt = f"{system_prompt}\n\nUser: {message}\nAssistant:"

    history = [
        HumanMessage(content=full_prompt)
    ]

    async for chunk in chat_model.astream(history):
        yield f"data:{chunk.content or ''}\n\n"
        await asyncio.sleep(0)

@router.post("/chat")
async def guest_chat(request:GuestChatRequest):
    if not request.message:
        raise HTTPException(400,"Message required")
    
    return StreamingResponse(
        _guest_stream(request.message),
        media_type="text/event-stream"
        )


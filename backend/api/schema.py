from pydantic import BaseModel
import uuid

class ChatRequest(BaseModel):
    session_id:uuid.UUID
    message:str

class ChatResponse(BaseModel):
    message:str

class FetchMessages(BaseModel):
    id:int
    session_id:uuid.UUID
    role:str
    content:str
    created_at:str

class GuestChatRequest(BaseModel):
    message: str

class AuthChatRequest(BaseModel):
    session_id: uuid.UUID
    message: str
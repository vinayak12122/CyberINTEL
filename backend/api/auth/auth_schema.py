from pydantic import BaseModel,EmailStr
from typing import Optional
from uuid import UUID

class SignupRequest(BaseModel):
    name:str
    email:EmailStr
    password:str

class LoginRequest(BaseModel):
    email:EmailStr
    password:str

class GoogleAuthRequest(BaseModel):
    code:str

class TokenResponse(BaseModel):
    access_token:str
    token_type:str = "bearer"
    expires_in:int

class MeResponse(BaseModel):
    id:UUID
    email:EmailStr
    provider:Optional[str]
    is_verified:bool
    name:str
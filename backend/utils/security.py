import os
import secrets
import hashlib
from datetime import datetime,timedelta,timezone
from typing import Optional,Tuple
import requests

from dotenv import load_dotenv
from passlib.context import CryptContext
import jwt

from fastapi import Depends, HTTPException,Request,status
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User,RefreshToken

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY",None)
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY env variable is required")

ALGO = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRES = int(os.getenv("ACCESS_TOKEN_EXPIRES", "3600"))
REFRESH_TOKEN_EXPIRES = int(os.getenv("REFRESH_TOKEN_EXPIRES", "1209600"))

pwd_contxt = CryptContext(schemes=["bcrypt"],deprecated="auto")

def hash_password(password:str) -> str :
    sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_contxt.hash(sha)

def verify_password(password:str,pass_hash:str) -> bool:
    sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_contxt.verify(sha, pass_hash)

def create_access_token(user_id:str,expires_seconds:Optional[int] = None):
    if expires_seconds is None:
        expires_seconds = int(ACCESS_TOKEN_EXPIRES)
    now = datetime.now(timezone.utc)
    payload = {
        "sub":str(user_id),
        "iat":int(now.timestamp()),
        "exp":int((now + timedelta(seconds=expires_seconds)).timestamp()),
        "type":"access",
    }
    token = jwt.encode(payload,SECRET_KEY,algorithm=ALGO)
    if isinstance(token,bytes):
        token = token.decode()
    return token

def decode_token(token:str) -> dict:
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGO])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
def generate_raw_refresh_token() :
    return secrets.token_urlsafe(64)

def hash_refresh_token(raw:str):
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def store_refrsh_token(
        db:Session,
        user_id:str,
        raw_refrsh_token:str,
        client_ip:Optional[str] = None,
        user_agent:Optional[str] = None,
        expires_seconds:Optional[int] = None,
) :
    if expires_seconds is None:
        expires_seconds = int(REFRESH_TOKEN_EXPIRES)
    token_hash = hash_refresh_token(raw_refrsh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_seconds)
    rt = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        issued_at=datetime.now(timezone.utc),
        expires_at=expires_at,
        revoked=False,
        client_ip=client_ip,
        user_agent=user_agent,
    )
    db.add(rt)
    db.commit()

def revoke_refresh_token_by_raw(db:Session,raw_refresh_token:str):
    token_hash = hash_refresh_token(raw_refresh_token)
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).one_or_none()
    if rt:
        rt.revoked = True
        db.add(rt)
        db.commit()
    
def revoke_all_user_refresh_token(db:Session,user_id:str):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id,RefreshToken.revoked == False).update({"revoked":True})
    db.commit()

def validate_refresh_token(db:Session,raw_refresh_token:str):
    token_hash = hash_refresh_token(raw_refresh_token)
    rt = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash,RefreshToken.revoked == False)
        .one_or_none()
    )
    if not rt:
        return None
    
    if rt.expires_at < datetime.now(timezone.utc):
        rt.revoked = True
        db.add(rt)
        db.commit()
        return None
    return rt

def _extract_token_from_request(request:Request):
    auth: Optional[str] = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer"):
        return auth.split(" ",1)[1].strip()
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
    return None

def get_current_user(request:Request,db:Session=Depends(get_db)) -> User:
    token = _extract_token_from_request(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Not Authenticated")
    
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid Token Type")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    user = db.query(User).filter(User.id == user_id).one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")
    return user

def create_accress_and_refresh(db:Session,user:User,request:Request):
    access_token = create_access_token(str(user.id))
    raw_refresh = generate_raw_refresh_token()
    store_refrsh_token(
        db,
        user_id=str(user.id),
        raw_refrsh_token=raw_refresh,
        client_ip=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )
    return access_token,raw_refresh

def verify_csrf_header(request:Request):
    csrf_cookie = request.cookies.get("csrf_token")
    csrf_header = request.headers.get("X-CSRF-Token")

    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed"
        )


def exchange_google_code_for_tokens(code: str):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": "postmessage",  
        "grant_type": "authorization_code",
    }

    r = requests.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})

    if r.status_code != 200:
        print("GOOGLE TOKEN ERROR:", r.text) 
        raise HTTPException(status_code=400, detail=f"Google token exchange failed: {r.text}")

    return r.json()
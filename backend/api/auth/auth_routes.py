import os
from datetime import datetime,timezone,timedelta
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse,RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional

from db.database import get_db
from db.models import User
from .auth_schema import SignupRequest,LoginRequest,GoogleAuthRequest,MeResponse
from utils import security
from .google_oauth import verify_google_id_token

router = APIRouter()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "False").lower() in ("1", "true", "yes")
ACCESS_EXPIRES = int(os.getenv("ACCESS_TOKEN_EXPIRES"))
REFRESH_EXPIRES = int(os.getenv("REFRESH_TOKEN_EXPIRES"))

@router.post("/signup",status_code=201)
def signup(payload:SignupRequest,db:Session=Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    if len(payload.password) > 72:
        raise HTTPException(status_code=400, detail="Password cannot exceed 72 characters")
    
    existing = db.query(User).filter(User.email == payload.email).one_or_none()
    if existing:
        raise HTTPException(status_code=400,details="Email already resgistered")
    pw_hash = security.hash_password(payload.password)
    user = User(
        id=None,
        email=payload.email,
        password_hash=pw_hash,
        provider="local",
        is_verified=False,
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"detail":"Account created"}

@router.post("/login")
def login(payload:LoginRequest,request:Request,response:Response,db:Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not security.verify_password(payload.password,user.password_hash):
        raise HTTPException(status_code=401,detail="Invalid credentials")
    
    access_token ,raw_refresh = security.create_accress_and_refresh(db,user,request)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none",
        max_age=ACCESS_EXPIRES,
    )
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="none",
        max_age=REFRESH_EXPIRES,
    )
    csrf = security.generate_raw_refresh_token()[:32]
    response.set_cookie(
        key="csrf_token",
        value=csrf,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite="none",
        max_age=ACCESS_EXPIRES,
    )

    user.last_login = datetime.now(timezone.utc)
    db.add(user)
    db.commit()

    response.body = b'{"detail": "ok"}'
    response.headers["Content-Type"] = "application/json"
    response.status_code = 200
    return response

@router.post("/google")
def google_signin(payload: GoogleAuthRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    # 1) Exchange auth code for tokens (access_token + id_token etc)
    try:
        tokens = security.exchange_google_code_for_tokens(payload.code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange code: {str(e)}")

    if not tokens:
        raise HTTPException(status_code=400, detail="Token exchange failed")

    id_token = tokens.get("id_token")
    if not id_token:
        raise HTTPException(status_code=401, detail="No id_token received from Google")

    # 2) Verify ID token (same as before)
    claims = verify_google_id_token(id_token)
    email = claims.get("email")
    sub = claims.get("sub")
    name = claims.get("name")
    email_verified = claims.get("email_verified") in ("true", True, "True")

    if not email or not sub:
        raise HTTPException(status_code=400, detail="Invalid id_token claims")

    # 3) Create or update user
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        user = User(
            id=None,
            email=email,
            password_hash=None,
            provider="google",
            provider_id=sub,
            is_verified=email_verified,
            name=name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not user.provider_id:
            user.provider = "google"
            user.provider_id = sub
            user.is_verified = user.is_verified or email_verified
            db.add(user)
            db.commit()

    # 4) Create access + refresh cookies
    access_token, raw_refresh = security.create_accress_and_refresh(db, user, request)
    # set cookies (same as other endpoints)
    response.set_cookie("access_token", access_token, httponly=True, secure=COOKIE_SECURE, samesite="none", max_age=ACCESS_EXPIRES)
    response.set_cookie("refresh_token", raw_refresh, httponly=True, secure=COOKIE_SECURE, samesite="none", max_age=REFRESH_EXPIRES)
    csrf = security.generate_raw_refresh_token()[:32]
    response.set_cookie("csrf_token", csrf, httponly=True, secure=COOKIE_SECURE, samesite="none", max_age=ACCESS_EXPIRES)

    user.last_login = datetime.now(timezone.utc)
    db.add(user)
    db.commit()

    response.body = b'{"detail": "ok"}'
    response.headers["Content-Type"] = "application/json"
    response.status_code = 200
    return response

@router.post("/refresh")
def refresh(request:Request,response:Response,db:Session=Depends(get_db)):

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    rt = security.validate_refresh_token(db,refresh_token)
    if not rt:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    security.revoke_refresh_token_by_raw(db,refresh_token)
    user = db.query(User).filter(User.id == rt.user_id).one_or_none()
    if not user:
        raise HTTPException(status_code=401,detail="User not found")
    
    access_token,new_raw_refresh = security.create_accress_and_refresh(db,user,request)
    response.set_cookie("access_token", access_token, httponly=True, secure=COOKIE_SECURE, samesite="lax", max_age=ACCESS_EXPIRES)
    response.set_cookie("refresh_token", new_raw_refresh, httponly=True, secure=COOKIE_SECURE, samesite="lax", max_age=REFRESH_EXPIRES)
    csrf = security.generate_raw_refresh_token()[:32]
    response.set_cookie("csrf_token", csrf, httponly=False, secure=COOKIE_SECURE, samesite="lax", max_age=ACCESS_EXPIRES)

    return {"detail":"refreshed","access_expires":ACCESS_EXPIRES}

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    rt = request.cookies.get("refresh_token")
    if rt:
        security.revoke_refresh_token_by_raw(db, rt)

    response.delete_cookie("access_token", path="/", samesite="none", secure=False)
    response.delete_cookie("refresh_token", path="/", samesite="none", secure=False)
    response.delete_cookie("csrf_token", path="/", samesite="none", secure=False)

    return {"detail": "Logged out"}


@router.get("/me",response_model=MeResponse)
def me(current_user = Depends(security.get_current_user)):
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        provider=current_user.provider,
        is_verified=current_user.is_verified,
        name=current_user.name,
    )
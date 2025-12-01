import os
from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def verify_google_id_token(id_token_str: str):
    if not id_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing id_token"
        )
    
    try:
        claims = id_token.verify_oauth2_token(
            id_token_str,
            requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # Extra safety validation
    if not claims.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified by Google"
        )
    
    return claims

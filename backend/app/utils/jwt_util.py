import os
from jose import jwt, JWTError
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from typing import Optional
from typing import Any, Optional
from fastapi import Depends, Header, HTTPException
from fastapi import Depends, Request, Response
from enum import Enum
from fastapi import HTTPException
from fastapi.responses import JSONResponse

REFRESH_TOKEN = "refresh_token"

class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"

    def __str__(self) -> str:
        return self.value
    

load_dotenv() 
# JWT config
ALGORITHM = os.getenv("ALGORITHM","HS256")
SECRET_KEY = os.getenv("SECRET_KEY","None")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))   
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))   
SECURE_COOKIE = os.getenv("SECURE_COOKIE","FALSE").upper() == "TRUE"  # Convert to boolean
REACT_APP_URL = os.getenv("REACT_APP_URL", "http://localhost:5173")


def create_token(subject: str, email: str, expires_delta: timedelta, token_type: str):
    issued_at = datetime.now(timezone.utc)  # timezone-aware UTC datetime
    expires_at = issued_at + expires_delta
    payload = {
        "token_type" : token_type,
        "sub"  : subject, # user id
        "email": email,
        "iat"  : int(issued_at.timestamp()),
        "exp"  : int(expires_at.timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError("Invalid token. Please reset your password to generate a new link.") from e

def get_token_from_header(authorization: Optional[str] = Header(None)):
        if not authorization or not authorization.lower().startswith("bearer "):
            print("no authorization header!!!!")
            raise HTTPException(status_code=401, detail="Missing or invalid token")
        encoded_token = authorization.split(" ", 1)[1]
        return decode_token(encoded_token)

    
def get_token_subject(authorization: Optional[str] = Header(None)):
        payload = get_token_from_header(authorization)
        try:
            if payload.get("token_type") != TokenType.ACCESS:
                raise HTTPException(status_code=401, detail="Invalid token type")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
        token_subject = payload["sub"]
        return token_subject
    
def get_token_email(authorization: Optional[str] = Header(None)):
        payload = get_token_from_header(authorization)
        try:
            if payload.get("token_type") != TokenType.ACCESS:
                raise HTTPException(status_code=401, detail="Invalid token type")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
        token_subject = payload["sub"]
        return token_subject
    
def issue_tokens(user_id: str, user_email: str, user_dict: Optional[dict] = None):
    """Generate access/refresh tokens, build LoginResponse, and set HttpOnly cookie."""
    
    access_token = create_token(
        subject= user_id,
        email=user_email,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
    )
    refresh_token = create_token(
        subject=str(user_id),
        email=user_email,
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )

    content: dict[str, Any] ={"access_token": access_token, "token_type": "bearer"}
    if user_dict:
        content["user"] = user_dict
        
    response = JSONResponse(content=content)
        
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=SECURE_COOKIE,   # True in prod (HTTPS)
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )
    return response

def refresh_token(token):
    print("what the f")
    if not token:
        print("no token")
        raise HTTPException(status_code=401, detail="Missing refresh token")
    try:
        print("have a token")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("have a payload")
        if payload.get("token_type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except JWTError:
        print("some exception")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    print("narrowing it down")
    user_id = payload["sub"]
    user_email = payload["email"]
    return issue_tokens(user_id, user_email)

def delete_refresh_cookie(request: Request, response: Response):
    print("=== LOGOUT DEBUG ===")
    print(f"Cookie being deleted: {request.cookies.get('refresh_token', 'NO COOKIE')}")

    response.delete_cookie(
        key="refresh_token",
        # Note: httponly is implied for delete_cookie
        secure=SECURE_COOKIE,  # Important: must match original
        samesite="lax",        # Important: must match original
        path="/",
    )
# authenticate.py 
import os
import json
from pydantic import BaseModel
from uuid import uuid4
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import Depends, Header, Request, Response
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.schemas.user import UserCreate, UserRead, LoginRequest, LoginResponse
from app.models.core_db import get_db
from app.services.auth_service import AuthService
from sqlalchemy.orm import Session

import logging
from dotenv import load_dotenv
logger = logging.getLogger()


router = APIRouter()

load_dotenv() 
# JWT config
ALGORITHM = os.getenv("ALGORITHM","HS256")
SECRET_KEY = os.getenv("SECRET_KEY","None")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))   
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))   
SECURE_COOKIE = os.getenv("SECURE_COOKIE","FALSE").upper() == "TRUE"  # Convert to boolean

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_token(sub: str, expires_delta: timedelta, token_type: str):
    now = datetime.now(timezone.utc)  # timezone-aware UTC datetime
    payload = {
        "sub": sub,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)



@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        return service.register(user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class MagicLinkRequest(BaseModel):
    email: str


@router.post("/magic-link")
async def magic_link(magic_link_request: MagicLinkRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        return service.send_magic_link(magic_link_request.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class VerifyRequest(BaseModel):
    token: str


@router.post("/verify", response_model=UserRead)
async def verify(verify_request: VerifyRequest, db: Session = Depends(get_db)):
    print("=== VERIFY DEBUG ===")
    print(f"Received token: {verify_request.token}")
    service = AuthService(db)
    try:
        return service.verify(verify_request.token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(user_data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        user_read = service.signin(user_data.email, user_data.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    access_token = create_token(
        sub=str(user_read.id), 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), 
        token_type="access"
    )
    refresh_token = create_token(
        sub=str(user_read.id), 
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), 
        token_type="refresh"
    )
    
    login_response = LoginResponse(access_token=access_token, user=user_read)
    login_dict = login_response.model_dump(mode="json")
    
    print(f"type {type(login_dict)}")
    print(json.dumps(login_dict, indent=4, sort_keys=True, default=str))
    
    # HttpOnly cookie for refresh
    response = JSONResponse( content=login_dict)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=SECURE_COOKIE, # in production True, ensure HTTPS
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/" # cookie sent for all paths  consider restricting to /auth in production
    )
    return response
    

@router.post("/refresh")
async def refresh(request: Request, resp: Response):
    print("=== REFRESH DEBUG ===")
    print(f"Request URL: {request.url}")
    print(f"Request method: {request.method}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"All cookies from request: {dict(request.cookies)}")
    print(f"Cookie header: {request.headers.get('cookie', 'NO COOKIE HEADER')}")
    token = request.cookies.get("refresh_token")
    print("what the f")
    if not token:
        print("no token")
        raise HTTPException(status_code=401, detail="Missing refresh token")
    try:
        print("have a token")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("have a payload")
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except JWTError:
        print("some exception")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    print("narrowing it down")
    user_id = payload["sub"]
    new_access = create_token(sub=user_id, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), token_type="access")
    new_refresh = create_token(sub=user_id, expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), token_type="refresh")
    
    response = JSONResponse(
        content={"access_token": new_access, "token_type": "bearer"}
    )
    print("got past that")
    # HttpOnly cookie for refresh
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=SECURE_COOKIE,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    return response

@router.post("/logout")
async def logout(resp: Response):
    print("=== LOGOUT DEBUG ===")
    resp.delete_cookie("refresh_token", path="/")
    return {"message": "Signed out"}


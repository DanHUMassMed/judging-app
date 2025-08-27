# authenticate.py 
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from fastapi import Depends, Request, Response
from jose import jwt, JWTError
from app.schemas.user import UserCreate, UserRead, LoginRequest
from app.models.core_db import get_db
from app.services.auth_service import AuthService
from sqlalchemy.orm import Session
from app.utils.jwt_util import issue_tokens, refresh_token, delete_refresh_cookie, REFRESH_TOKEN

import logging
logger = logging.getLogger()

    
router = APIRouter()

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
        user_read =  service.verify(verify_request.token)
    except ValueError as e:
        print(f"Verification error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    user_read_json = user_read.model_dump(mode="json")
    return issue_tokens(str(user_read.id), user_read.email, user_read_json)


@router.post("/login")
async def login(user_data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        user_read = service.signin(user_data.email, user_data.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    user_read_json = user_read.model_dump(mode="json")
    return issue_tokens(str(user_read.id), user_read.email, user_read_json)
    

@router.post("/refresh")
async def refresh(request: Request, resp: Response):
    print("=== REFRESH DEBUG ===")
    print(f"Request URL: {request.url}")
    print(f"Request method: {request.method}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"All cookies from request: {dict(request.cookies)}")
    print(f"Cookie header: {request.headers.get('cookie', 'NO COOKIE HEADER')}")
    token = request.cookies.get(REFRESH_TOKEN)
    return refresh_token(token)

@router.post("/logout")
async def logout(request: Request, response: Response):    
    delete_refresh_cookie(request,response)
    
    return {"message": "Signed out"}
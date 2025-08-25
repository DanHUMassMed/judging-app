# authenticate.py 
import os
from pydantic import BaseModel
from uuid import uuid4
from typing import List
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import Depends, Header, Request, Response
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
import logging
from dotenv import load_dotenv
logger = logging.getLogger()

load_dotenv() 
# JWT config
ALGORITHM = os.getenv("ALGORITHM","HS256")
SECRET_KEY = os.getenv("SECRET_KEY","None")

router = APIRouter()

async def get_current_user(authorization: Optional[str] = Header(None)):
    print("=== GET CURRENT USER DEBUG ===")
    if not authorization or not authorization.lower().startswith("bearer "):
        print("no authorization header!!!!")
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded payload: {payload}")
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload["sub"]
    print(f"User ID from token: {user_id}")
    # look up user if needed
    return user_id


# Example data
class Poster(BaseModel):
    id: int
    title: str
    author: str
    score: float

fake_db = [
    Poster(id=1, title="Neural Networks in C. elegans", author="Alice", score=95.5),
    Poster(id=2, title="Autophagy Pathways", author="Bob", score=88.0),
    Poster(id=3, title="Mitochondrial Stress", author="Charlie", score=92.3),
]

@router.get("/posters")
async def get_posters(user_id: str = Depends(get_current_user)):
    print(f"get posters: {user_id}")
    return fake_db


@router.put("/posters/{poster_id}")
async def update_poster(poster_id: int, updated: Poster, user_id: str = Depends(get_current_user)):
    for i, poster in enumerate(fake_db):
        if poster.id == poster_id:
            fake_db[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Poster not found")

@router.delete("/posters/{poster_id}")
async def delete_poster(poster_id: int, user_id: str = Depends(get_current_user)):
    for i, poster in enumerate(fake_db):
        if poster.id == poster_id:
            deleted = fake_db.pop(i)
            return {"message": "Poster deleted", "poster": deleted}
    raise HTTPException(status_code=404, detail="Poster not found")





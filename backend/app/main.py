import os
from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import debugpy
import logging
from datetime import timedelta, datetime
from jose import jwt
from passlib.context import CryptContext
from fastapi import APIRouter
from datetime import timedelta, datetime
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, Header, Request, Response
from fastapi.responses import JSONResponse
from uuid import uuid4
from app.utils.email_util import email_verification


load_dotenv() 
react_app_url = os.getenv("REACT_APP_URL")

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "WARNING").upper())



# JWT config
SECRET_KEY = "super-secret-key"  # 🚨 move to .env in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_token(sub: str, expires_delta: timedelta, token_type: str):
    now = datetime.utcnow()
    payload = {
        "sub": sub,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Fake users DB
fake_users_db = {
    "dan@example.com": {
        "id": 1,
        "email": "dan@example.com",
        "hashed_password": hash_password("password"),  # bcrypt hash
        "is_active": True,
    }
}

auth_router = APIRouter(prefix="/auth", tags=["auth"])

###################################

class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    organization: str
    email: str
    password: str

@auth_router.post("/register")
async def register(data: RegisterRequest, resp: Response):
    # 1. Check if email already exists
    if data.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash password
    hashed_pw = hash_password(data.password)

    # 3. Create fake user entry
    user_id = len(fake_users_db) + 1
    fake_users_db[data.email] = {
        "id": user_id,
        "email": data.email,
        "hashed_password": hashed_pw,
        "first_name": data.firstName,
        "last_name": data.lastName,
        "organization": data.organization,
        "is_active": False,  # 🚨 Not active until email validated
    }

    # 4. Send verification email
    token = uuid4().hex
    try:
        email_verification(data.email, token, data.firstName)
    except Exception as e:
        # log the error but continue for now
        logger.error(f"Failed to send verification email: {e}")

    # 5. Create tokens
    access_token = create_token(
        sub=str(user_id),
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access"
    )
    refresh_token = create_token(
        sub=str(user_id),
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh"
    )

    response = JSONResponse(
        content={"access_token": access_token, 
                 "token_type": "bearer",
                 "message": "Registration successful, please check your email to verify your account"}
    )

    # 6. Set refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # change to True in prod
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )

    return response

#################################
class LoginRequest(BaseModel):
    email: str
    password: str


@auth_router.post("/login")
async def login(data: LoginRequest, resp: Response):
    user = fake_users_db.get(data.email)
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_token(
        sub=str(user["id"]), 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), 
        token_type="access"
    )
    refresh_token = create_token(
        sub=str(user["id"]), 
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), 
        token_type="refresh"
    )
    
    response = JSONResponse(
        content={"access_token": access_token, "token_type": "bearer"}
    )

    # HttpOnly cookie for refresh
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # in production True, ensure HTTPS
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/" # cookie sent for all paths  consider restricting to /auth in production
    )
    return response

@auth_router.post("/refresh")
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
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    return response

@auth_router.post("/logout")
async def logout(resp: Response):
    resp.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

#################################
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
#################################


ACTIVATE_DEBUG = os.getenv("ACTIVATE_DEBUG", "FALSE")
if ACTIVATE_DEBUG=="TRUE":
    debugpy.listen(("0.0.0.0", 58979))
    logger.info("Waiting for debugger to attach...")



app = FastAPI()


# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"{react_app_url}"
    ],  # Allows React app to make requests
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)



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

@app.get("/posters")
async def get_posters(user_id: str = Depends(get_current_user)):
    print(f"get posters: {user_id}")
    return fake_db


@app.put("/posters/{poster_id}")
async def update_poster(poster_id: int, updated: Poster, user_id: str = Depends(get_current_user)):
    for i, poster in enumerate(fake_db):
        if poster.id == poster_id:
            fake_db[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Poster not found")

@app.delete("/posters/{poster_id}")
async def delete_poster(poster_id: int, user_id: str = Depends(get_current_user)):
    for i, poster in enumerate(fake_db):
        if poster.id == poster_id:
            deleted = fake_db.pop(i)
            return {"message": "Poster deleted", "poster": deleted}
    raise HTTPException(status_code=404, detail="Poster not found")


app.include_router(auth_router)


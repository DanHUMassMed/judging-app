import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import debugpy
import logging
from app.api.v1 import auth_api, posters_api


load_dotenv() 
REACT_APP_URL = os.getenv("REACT_APP_URL")
API_VERSION_STR = os.getenv("API_VERSION_STR", "/api/v1")

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "WARNING").upper())

ACTIVATE_DEBUG = os.getenv("ACTIVATE_DEBUG", "FALSE").upper() == "TRUE"
print("=== ACTIVATE_DEBUG:", ACTIVATE_DEBUG)
if ACTIVATE_DEBUG:
    debugpy.listen(("0.0.0.0", 58979))
    logger.info("Waiting for debugger to attach...")

app = FastAPI()


# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"{REACT_APP_URL}",
    ],  # Allows React app to make requests
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth_api.router, prefix=f"{API_VERSION_STR}/auth", tags=["Authentication"])
app.include_router(posters_api.router, prefix=f"{API_VERSION_STR}", tags=["Posters"])













#############################################################################
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from datetime import timedelta, datetime
from jose import jwt
from passlib.context import CryptContext
from fastapi import APIRouter
from datetime import timedelta, datetime

from jose import jwt, JWTError
from passlib.context import CryptContext

from fastapi.responses import JSONResponse












###################################




#################################
#################################





#################################

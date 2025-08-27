# services/authenticate_service.py
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from app.models.user import UserModel
from app.schemas.user import UserCreate, UserRead
from app.utils.email_util import send_email_verification, send_magic_link
import re
from dateutil import parser
from app.utils.jwt_util import create_token, decode_token



pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

class AuthService:
    """
    Handles user authentication and registration logic.
    """
    MAGIC_LINK_EXPIRY_MINUTES = 15  # token valid for 15 minutes

    def __init__(self, db: Session):
        self.db = db

    # ---------------------------
    # Register
    # ---------------------------
    def register(self, user_data: UserCreate) -> UserRead:
        
        # Required fields
        if not user_data.password:
            raise ValueError("Password is required")
        
        if len(user_data.password) < 8:
            raise ValueError("Your Password must be at least 8 characters")
        
        # Check if email exists (case-insensitive)
        existing_user = self.db.query(UserModel).filter(UserModel.email.ilike(user_data.email)).first()
        if existing_user:
            raise ValueError(f"This Email ({user_data.email}) is already registered. Please log in or use a different email.")

        hashed_password = pwd_context.hash(user_data.password) if user_data.password else None

        verification_token = create_token(
            subject= user_data.first_name,
            email=user_data.email,
            expires_delta=timedelta(minutes=self.MAGIC_LINK_EXPIRY_MINUTES),
            token_type="magic-link")

        user = UserModel(
            first_name = user_data.first_name,
            last_name = user_data.last_name,
            email = user_data.email,
            password = hashed_password,
            organization = user_data.organization,
            magic_link_token = verification_token,
            magic_link_expires_at = self._generate_timestamp_str(minutes=self.MAGIC_LINK_EXPIRY_MINUTES),
            last_login_at = self._generate_timestamp_str(),
            is_verified=False
        )

        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Email already exists")

        # Send verification email (mock)
        send_email_verification(user.email, verification_token, user.first_name)

        return UserRead.model_validate(user)

    # ---------------------------
    # Verify magic link
    # ---------------------------
    def verify(self, magic_link_token: str) -> UserRead:
        if not magic_link_token:
            raise ValueError("Invalid token")

        # Case-insensitive lookup
        found_user = (
            self.db.query(UserModel)
            .filter(UserModel.magic_link_token.ilike(magic_link_token))
            .first()
        )

        if not found_user:
            # If we don't find a user with that token the user may have already verified
            # so we decode the token to get the email and check if that user is verified
            
            token_payload = decode_token(magic_link_token)  # Will raise ValueError if invalid
            token_payload_type = token_payload.get("token_type")
            if token_payload_type != "magic-link":
                raise ValueError("Invalid token type")
            
            email = token_payload.get("email")
            found_user = self.db.query(UserModel).filter(UserModel.email == email).first()
            if found_user and found_user.is_verified:
                expires_at_ts = token_payload.get("exp",0)
                dt_utc = datetime.fromtimestamp(expires_at_ts, tz=timezone.utc)
                # We still define expires_at_str 
                # The user can use this token multiple time until it expires with out any issue
                expires_at_str = dt_utc.isoformat(timespec="microseconds").replace("+00:00", "Z")
            else:
                # If we still can't find a verified user, the token is invalid
                raise ValueError("Invalid or expired verification link. Please reset your password to generate a new link.")        
        else:
            expires_at_str = found_user.magic_link_expires_at

        
        expires_at = parser.parse(expires_at_str) if expires_at_str else None

        now = datetime.now(timezone.utc)

        # print("DEBUG expires_at:", expires_at.isoformat() if expires_at else None)
        # print("DEBUG        now:", now.isoformat())
        # if expires_at:
        #     delta = expires_at - now
        #     seconds = int(delta.total_seconds())
        #     mins, secs = divmod(abs(seconds), 60)

        #     # Positive = still time left, Negative = expired already
        #     sign = "" if seconds >= 0 else "-"
        #     print(f"DEBUG Time before expires: {sign}{mins} min {secs} sec")
        # else:
        #     print("DEBUG expires_at is None")

        if not expires_at or expires_at < now:
            raise ValueError("Your Verification link has expired. Please reset your password to generate a new link.")

        # Mark user as verified
        found_user.is_verified = True
        found_user.magic_link_token = None  # Invalidate token after use
        found_user.magic_link_expires_at = None # Invalidate token after use
        found_user.last_login_at = self._generate_timestamp_str()
        
        self.db.commit()
        self.db.refresh(found_user)

        return UserRead.model_validate(found_user)
    
    
    # ---------------------------
    # Sign in
    # ---------------------------
    def signin(self, email: str, password: str) -> UserRead:
        
        user = self.db.query(UserModel).filter(UserModel.email == email).first()
        if not user or not user.password:
            raise ValueError("Invalid credentials")
        
        if not pwd_context.verify(password, user.password):
            raise ValueError("Invalid credentials")

        user.last_login_at = self._generate_timestamp_str()
        self.db.commit()
        self.db.refresh(user)

        return UserRead.model_validate(user)



    def send_magic_link(self, email: str) -> UserRead:
        """
        Sets a new magic link token and expiration for a user, given their email.
        Returns the generated token.
        """
        user = self.db.query(UserModel).filter(UserModel.email.ilike(email)).first()
        if not user:
            raise ValueError("User not found")

        # Generate a secure random token
        token = create_token(
            subject= user.first_name,
            email=user.email,
            expires_delta=timedelta(minutes=self.MAGIC_LINK_EXPIRY_MINUTES),
            token_type="magic-link")
                
        # Set token and expiry
        user.magic_link_token = token
        user.magic_link_expires_at = self._generate_timestamp_str(minutes=self.MAGIC_LINK_EXPIRY_MINUTES)

        self.db.commit()
        self.db.refresh(user)

        # Send verification email (mock)
        send_magic_link(user.email, token, user.first_name)

        return UserRead.model_validate(user)
    
    # ---------------------------
    # Password reset
    # ---------------------------
    def password_reset(self, email: str, new_password: str):
        user = self.db.query(UserModel).filter(UserModel.email == email).first()
        if not user:
            raise ValueError("User not found")

        user.password = pwd_context.hash(new_password)
        self.db.commit()
        self.db.refresh(user)

        # Optionally send confirmation email
        # send_password_reset_confirmation(user.email)
        return True

    def active_login_minutes(self, email: int):
        minutes_logged_in = -1 # -1 = never logged in
        user = self.db.query(UserModel).filter(UserModel.email == email).first()
        if not user:
            raise ValueError("User not found")
        if user.last_login_at:
            last_login_dt = parser.parse(user.last_login_at)
            now = datetime.now(timezone.utc)
            delta = now - last_login_dt 
            minutes_logged_in = int(delta.total_seconds() // 60)
        return minutes_logged_in
    
    # ---------------------------
    # Internal helpers
    # ---------------------------
    
    def _generate_timestamp_str(self, minutes: int = 0) -> str:
        now_dt=datetime.now(timezone.utc) + timedelta(minutes=minutes)
        now_str = now_dt.isoformat(timespec="microseconds").replace("+00:00", "Z")
        return now_str

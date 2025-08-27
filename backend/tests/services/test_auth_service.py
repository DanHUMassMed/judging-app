import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone
from app.models.user import UserModel, Base
from app.schemas import UserCreate, UserRead
from app.services.auth_service import AuthService
import re

@pytest.fixture
def db_session():
    """Creates an in-memory SQLite DB for testing."""
    engine = create_engine("sqlite:///:memory:", echo=False, future=True)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_register_success(db_session, monkeypatch):
    """Test successful user registration."""
    sent_emails = []

    # Mock email_verification to avoid actually sending
    def fake_email_verification(email, token, first_name):
        sent_emails.append((email, token, first_name))

    
    monkeypatch.setattr("app.services.auth_service.send_email_verification", fake_email_verification)
    
    service = AuthService(db_session)

    user_data = UserCreate(
        first_name="Alice",
        last_name="Smith",
        email="alice@example.com",
        password="supersecurepassword",
        organization="TestOrg",
    )

    user = service.register(user_data)

    assert isinstance(user, UserRead)
    assert user.email == "alice@example.com"
    assert user.is_verified is False
    assert len(sent_emails) == 1
    assert sent_emails[0][0] == "alice@example.com"


def test_register_fails_short_password(db_session):
    """Password shorter than 8 chars should raise."""
    service = AuthService(db_session)

    user_data = UserCreate(
        first_name="Bob",
        last_name="Jones",
        email="bob@example.com",
        password="short",
        organization="TestOrg",
    )

    with pytest.raises(ValueError, match="Password must be at least 8 characters"):
        service.register(user_data)


def test_register_fails_duplicate_email(db_session):
    """Registering the same email twice should fail."""
    service = AuthService(db_session)

    user_data = UserCreate(
        first_name="Carol",
        last_name="Doe",
        email="carol@example.com",
        password="longenoughpassword",
        organization="TestOrg",
    )

    # First registration works
    service.register(user_data)

    # Second one should fail
    error_msg = f"This Email ({user_data.email}) is already registered. Please log in or use a different email."
    with pytest.raises(ValueError, match=re.escape(error_msg)):
        service.register(user_data)


# ---------------------------
# Verify magic link
# ---------------------------

def test_verify_success(db_session):
    """User can verify with a valid token."""
    service = AuthService(db_session)
    token = "validtoken123"

    user = UserModel(
        first_name="Eve",
        last_name="Adams",
        email="eve@example.com",
        password="hashedpw",
        magic_link_token=token,
        magic_link_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_verified=False,
    )
    db_session.add(user)
    db_session.commit()

    result = service.verify(token)

    assert result.is_verified is True
    db_user = db_session.query(UserModel).filter_by(email="eve@example.com").first()
    assert db_user.magic_link_token is None
    assert db_user.magic_link_expires_at is None


def test_verify_invalid_token(db_session):
    """Invalid token should raise."""
    service = AuthService(db_session)
    with pytest.raises(ValueError, match="Invalid token. Please reset your password to generate a new link."):
        service.verify("doesnotexist")


def test_verify_expired_token(db_session):
    """Expired token should raise."""
    service = AuthService(db_session)
    token = "expiredtoken"

    user = UserModel(
        first_name="Frank",
        last_name="Miller",
        email="frank@example.com",
        password="hashedpw",
        magic_link_token=token,
        magic_link_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        is_verified=False,
    )
    db_session.add(user)
    db_session.commit()

    with pytest.raises(ValueError, match="Verification link has expired"):
        service.verify(token)


# ---------------------------
# Sign in
# ---------------------------

def test_signin_success(db_session):
    """Correct password allows sign in."""
    service = AuthService(db_session)

    # Register user so password is hashed
    user_data = UserCreate(
        first_name="Grace",
        last_name="Lee",
        email="grace@example.com",
        password="mysecurepass",
        organization="Org",
    )
    service.register(user_data)

    result = service.signin("grace@example.com", "mysecurepass")
    assert result.email == "grace@example.com"
    assert result.last_login_at is not None


def test_signin_invalid_password(db_session):
    """Wrong password should raise."""
    service = AuthService(db_session)
    user_data = UserCreate(
        first_name="Henry",
        last_name="Ford",
        email="henry@example.com",
        password="correctpass",
        organization="Org",
    )
    service.register(user_data)

    with pytest.raises(ValueError, match="Invalid credentials"):
        service.signin("henry@example.com", "wrongpass")


def test_signin_nonexistent_user(db_session):
    service = AuthService(db_session)
    with pytest.raises(ValueError, match="Invalid credentials"):
        service.signin("nobody@example.com", "whatever")


# ---------------------------
# Send magic link
# ---------------------------

def test_send_magic_link_success(db_session, monkeypatch):
    sent_links = []

    def fake_send_magic_link(email, token, first_name):
        sent_links.append((email, token, first_name))

    monkeypatch.setattr("app.services.auth_service.send_magic_link", fake_send_magic_link)

    service = AuthService(db_session)
    user_data = UserCreate(
        first_name="Ivy",
        last_name="Chen",
        email="ivy@example.com",
        password="longpassword",
        organization="Org",
    )
    service.register(user_data)

    user_response = service.send_magic_link("ivy@example.com")

    assert isinstance(user_response.magic_link_token, str)
    assert len(sent_links) == 1
    assert sent_links[0][0] == "ivy@example.com"


def test_send_magic_link_user_not_found(db_session):
    service = AuthService(db_session)
    with pytest.raises(ValueError, match="User not found"):
        service.send_magic_link("ghost@example.com")


# ---------------------------
# Password reset
# ---------------------------

def test_password_reset_success(db_session):
    service = AuthService(db_session)
    user_data = UserCreate(
        first_name="Jack",
        last_name="Ryan",
        email="jack@example.com",
        password="oldpassword",
        organization="Org",
    )
    service.register(user_data)

    assert service.password_reset("jack@example.com", "newsecurepass") is True

    # Sign in with new password should work
    result = service.signin("jack@example.com", "newsecurepass")
    assert result.email == "jack@example.com"


def test_password_reset_user_not_found(db_session):
    service = AuthService(db_session)
    with pytest.raises(ValueError, match="User not found"):
        service.password_reset("noone@example.com", "irrelevant")
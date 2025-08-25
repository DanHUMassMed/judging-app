# tests/test_authenticate.py
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from fastapi.testclient import TestClient
from fastapi import FastAPI
from unittest.mock import patch
from app.schemas.user import UserRead
from app.api.v1.auth_api import router, SECRET_KEY, ALGORITHM, REFRESH_TOKEN_EXPIRE_DAYS


# Create a test app and include your router
app = FastAPI()
app.include_router(router)

client = TestClient(app)

# Mock user data
mock_user_create = {"first_name": "Alice", "last_name": "Smith", "email": "alice@example.com", "password": "secret"}
from datetime import datetime
mock_user_read = UserRead(
    id=1,
    first_name="Alice",
    last_name="Smith",
    email="alice@example.com",
    is_verified=False,
    registered_at=datetime.utcnow(),
    role="user"
)


@pytest.fixture
def mock_auth_service_register():
    with patch("app.api.v1.auth_api.AuthService") as MockService:
        instance = MockService.return_value
        instance.register.return_value = mock_user_read
        yield instance

@pytest.fixture
def mock_auth_service_send_magic_link():
    with patch("app.api.v1.auth_api.AuthService") as MockService:
        instance = MockService.return_value
        instance.send_magic_link.return_value = {"message": "Magic link sent"}
        yield instance

@pytest.fixture
def mock_auth_service_verify():
    with patch("app.api.v1.auth_api.AuthService") as MockService:
        instance = MockService.return_value
        instance.verify.return_value = mock_user_read
        yield instance

@pytest.fixture
def mock_auth_service_signin():
    with patch("app.api.v1.auth_api.AuthService") as MockService:
        instance = MockService.return_value
        instance.signin.return_value = mock_user_read
        yield instance


def test_register_success(mock_auth_service_register):
    response = client.post("/register", json=mock_user_create)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == mock_user_create["email"]
    mock_auth_service_register.register.assert_called_once()


def test_register_failure():
    with patch("app.api.v1.auth_api.AuthService") as MockService:
        instance = MockService.return_value
        instance.register.side_effect = ValueError("Email already exists")
        response = client.post("/register", json=mock_user_create)
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already exists"


def test_magic_link_success(mock_auth_service_send_magic_link):
    response = client.post("/magic-link", json={"email": "alice@example.com"})
    assert response.status_code == 200
    assert response.json() == {"message": "Magic link sent"}


def test_verify_success(mock_auth_service_verify):
    response = client.post("/verify", json={"token": "some-token"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == mock_user_read.email


def test_login_success(mock_auth_service_signin):
    login_data = {"email": "alice@example.com", "password": "secret"}
    response = client.post("/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert "refresh_token" in response.cookies


def test_logout():
    response = client.post("/logout")
    assert response.status_code == 200
    assert response.cookies.get("refresh_token") is None
    assert response.json()["message"] == "Signed out"
    
#####################################################



def create_test_refresh_token(user_id: str):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@pytest.fixture
def mock_jwt_decode_valid():
    with patch("app.api.v1.auth_api.jwt.decode") as mock_decode:
        mock_decode.return_value = {"sub": "1", "type": "refresh"}
        yield mock_decode


@pytest.fixture
def mock_jwt_decode_invalid():
    with patch("app.api.v1.auth_api.jwt.decode") as mock_decode:
        from jose import JWTError
        mock_decode.side_effect = JWTError("Invalid token")
        yield mock_decode


def test_refresh_success(mock_jwt_decode_valid):
    token = create_test_refresh_token("1")
    response = client.post("/refresh", cookies={"refresh_token": token})
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies  # New refresh cookie set


def test_refresh_missing_token():
    response = client.post("/refresh")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing refresh token"


def test_refresh_invalid_token(mock_jwt_decode_invalid):
    response = client.post("/refresh", cookies={"refresh_token": "invalidtoken"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"


def test_refresh_wrong_token_type(mock_jwt_decode_valid):
    # Simulate decode returning wrong type
    mock_jwt_decode_valid.return_value = {"sub": "1", "type": "access"}  # should be "refresh"
    token = create_test_refresh_token("1")
    response = client.post("/refresh", cookies={"refresh_token": token})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token type"
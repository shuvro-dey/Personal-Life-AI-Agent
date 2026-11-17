"""Automated test script for Backend Core and Authentication."""
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.user import User

client = TestClient(app)


def run_tests():
    print("Running Backend Core + Auth tests...")
    Base.metadata.create_all(bind=engine)

    # 1. Health check
    resp = client.get("/api/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    print("[PASS] Health check: OK")

    # 2. Register user
    test_email = "shuvro.test@example.com"
    test_password = "SecurePassword2026"
    test_name = "Shuvro Prototype"

    # Cleanup any prior test user
    db = SessionLocal()
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()
    db.close()

    reg_payload = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
        "preferred_language": "en"
    }
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201, f"Registration failed: {resp.text}"
    reg_data = resp.json()
    assert "access_token" in reg_data, "access_token missing in registration"
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["name"] == test_name
    print("[PASS] User registration: OK")

    # 3. Verify bcrypt hash in database (never plain text)
    db = SessionLocal()
    user_in_db = db.query(User).filter(User.email == test_email).first()
    assert user_in_db is not None, "User not found in DB"
    assert user_in_db.password_hash != test_password, "Password stored in plain text!"
    assert user_in_db.password_hash.startswith("$2b$") or user_in_db.password_hash.startswith("$2a$"), "Password is not a bcrypt hash"
    print("[PASS] Password hash verification: Password is confirmed bcrypt hash, not plain text")
    db.close()

    # 4. Duplicate registration rejected
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 400, f"Duplicate registration should return 400: {resp.text}"
    print("[PASS] Duplicate registration rejected: OK")

    # 5. Login with invalid password rejected
    resp = client.post("/api/auth/login", json={"email": test_email, "password": "WrongPassword"})
    assert resp.status_code == 401, f"Login with invalid password should return 401: {resp.text}"
    print("[PASS] Invalid password rejected: OK")

    # 6. Login with correct password
    resp = client.post("/api/auth/login", json={"email": test_email, "password": test_password})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    login_data = resp.json()
    token = login_data["access_token"]
    assert token, "Token missing from login response"
    print("[PASS] User login: OK")

    # 7. Access protected route without token rejected
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401, f"Protected route without token should return 401: {resp.text}"
    print("[PASS] Protected route without token rejected: OK")

    # 8. Access protected route with valid token
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200, f"Protected route with token failed: {resp.text}"
    me_data = resp.json()
    assert me_data["email"] == test_email
    assert me_data["name"] == test_name
    assert me_data["timezone"] == "Asia/Dhaka"
    print("[PASS] Protected route /api/auth/me: OK")

    # 9. Update profile preference
    resp = client.put("/api/auth/profile", json={"preferred_language": "bn"}, headers=headers)
    assert resp.status_code == 200, f"Profile update failed: {resp.text}"
    assert resp.json()["preferred_language"] == "bn"
    print("[PASS] Profile update (language switch to bn): OK")

    print("\nAll Backend Core + Auth tests passed successfully!")


if __name__ == "__main__":
    run_tests()

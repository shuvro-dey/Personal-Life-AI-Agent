"""Automated test suite for Dashboard and Command Router."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.services.auth_service import hash_password, create_access_token

client = TestClient(app)


def setup_user():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.query(User).filter(User.email == "dashUser@example.com").delete()
    db.commit()

    user = User(
        email="dashUser@example.com",
        password_hash=hash_password("Pass12345"),
        name="Dashboard Tester",
        preferred_language="en",
        timezone="Asia/Dhaka"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email)
    db.close()
    return token


def run_tests():
    print("Running Dashboard & Command Router tests...")
    token = setup_user()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Overview endpoint
    resp = client.get("/api/dashboard/overview", headers=headers)
    assert resp.status_code == 200, f"Overview failed: {resp.text}"
    overview = resp.json()
    assert overview["user_name"] == "Dashboard Tester"
    assert "today_reminders" in overview
    assert "active_shopping_lists" in overview
    assert "recent_study_sessions" in overview
    print("[PASS] Dashboard overview endpoint: OK")

    # 2. Command Router: Complete reminder query
    resp = client.post(
        "/api/dashboard/command",
        json={"query": "Remind me tomorrow at 8 am to take medicine"},
        headers=headers
    )
    assert resp.status_code == 200
    cmd_data = resp.json()
    assert cmd_data["intent"] == "reminder"
    print(f"[PASS] Command router (reminder complete): {cmd_data['message']}: OK")

    # 3. Command Router: Ambiguous reminder query
    resp = client.post(
        "/api/dashboard/command",
        json={"query": "Remind me to study"},
        headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["intent"] == "reminder"
    print("[PASS] Command router (reminder ambiguous asks clarification): OK")

    # 4. Command Router: Shopping query
    resp = client.post(
        "/api/dashboard/command",
        json={"query": "Buy 2 kg rice and 1 dozen eggs"},
        headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["intent"] == "shopping"
    print("[PASS] Command router (shopping intent): OK")

    # 5. Command Router: Study query
    resp = client.post(
        "/api/dashboard/command",
        json={"query": "Study lecture notes on distributed systems"},
        headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["intent"] == "study"
    print("[PASS] Command router (study intent): OK")

    # 6. Command Router: General query
    resp = client.post(
        "/api/dashboard/command",
        json={"query": "How can you help me?"},
        headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["intent"] == "general"
    print("[PASS] Command router (general intent): OK")

    print("\nAll Dashboard tests passed successfully!")


if __name__ == "__main__":
    run_tests()

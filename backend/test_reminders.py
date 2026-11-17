"""Automated test suite for Reminder Tracker."""
import os
import sys
from datetime import timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.reminder import Reminder
from app.services.auth_service import hash_password, create_access_token
from app.utils.timezone import today_dhaka, now_dhaka

client = TestClient(app)


def setup_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.query(Reminder).delete()
    db.query(User).filter(User.email.in_(["remUserA@example.com", "remUserB@example.com"])).delete()
    db.commit()

    userA = User(
        email="remUserA@example.com",
        password_hash=hash_password("PassA12345"),
        name="Reminder User A",
        preferred_language="bn",
        timezone="Asia/Dhaka"
    )
    userB = User(
        email="remUserB@example.com",
        password_hash=hash_password("PassB12345"),
        name="Reminder User B",
        preferred_language="en",
        timezone="Asia/Dhaka"
    )
    db.add(userA)
    db.add(userB)
    db.commit()
    db.refresh(userA)
    db.refresh(userB)

    tokenA = create_access_token(user_id=userA.id, email=userA.email)
    tokenB = create_access_token(user_id=userB.id, email=userB.email)
    db.close()
    return tokenA, tokenB


def run_tests():
    print("Running Reminder Tracker tests...")
    tokenA, tokenB = setup_users()
    headersA = {"Authorization": f"Bearer {tokenA}"}
    headersB = {"Authorization": f"Bearer {tokenB}"}

    dhaka_today = today_dhaka()
    dhaka_tomorrow = dhaka_today + timedelta(days=1)

    # 1. User A creates a reminder for Today
    resp = client.post(
        "/api/reminders",
        json={
            "title": "Drink Water",
            "due_date": str(dhaka_today),
            "due_time": "14:00:00",
            "repeat": "daily"
        },
        headers=headersA
    )
    assert resp.status_code == 201, f"Create today reminder failed: {resp.text}"
    rem_today_id = resp.json()["id"]
    assert resp.json()["title"] == "Drink Water"
    assert resp.json()["repeat"] == "daily"
    print("[PASS] User A creates reminder for Today: OK")

    # 2. User A creates a reminder for Upcoming (Tomorrow)
    resp = client.post(
        "/api/reminders",
        json={
            "title": "Submit Capstone Report",
            "due_date": str(dhaka_tomorrow),
            "due_time": "17:00:00",
            "repeat": "none"
        },
        headers=headersA
    )
    assert resp.status_code == 201
    rem_upcoming_id = resp.json()["id"]
    print("[PASS] User A creates reminder for Upcoming: OK")

    # 3. View filtering: Today view
    resp = client.get("/api/reminders?view=today", headers=headersA)
    assert resp.status_code == 200
    today_items = resp.json()
    assert len(today_items) == 1
    assert today_items[0]["id"] == rem_today_id
    print("[PASS] Filter view 'today': OK")

    # 4. View filtering: Upcoming view
    resp = client.get("/api/reminders?view=upcoming", headers=headersA)
    assert resp.status_code == 200
    upcoming_items = resp.json()
    assert len(upcoming_items) == 1
    assert upcoming_items[0]["id"] == rem_upcoming_id
    print("[PASS] Filter view 'upcoming': OK")

    # 5. Status toggle: Mark Today reminder as done
    resp = client.patch(f"/api/reminders/{rem_today_id}/toggle", headers=headersA)
    assert resp.status_code == 200
    assert resp.json()["status"] == "done"

    # Now Completed view should have 1 item, and Today view should be empty
    resp = client.get("/api/reminders?view=completed", headers=headersA)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = client.get("/api/reminders?view=today", headers=headersA)
    assert len(resp.json()) == 0
    print("[PASS] Status toggle to 'done' and 'completed' view: OK")

    # 6. User Isolation enforcement (User B cannot see or toggle User A's reminder)
    resp = client.get(f"/api/reminders/{rem_today_id}", headers=headersB)
    assert resp.status_code == 404, "User B should not access User A's reminder"

    resp = client.patch(f"/api/reminders/{rem_today_id}/toggle", headers=headersB)
    assert resp.status_code == 404, "User B should not toggle User A's reminder"
    print("[PASS] User isolation enforcement (cross-user access blocked): OK")

    # 7. Smart Add with complete date & time (Bangla query: "কাল সকাল ৮টায় ওষুধ খেতে মনে করিয়ে দাও")
    smart_complete = "কাল সকাল ৮টায় ওষুধ খেতে মনে করিয়ে দাও"
    resp = client.post("/api/reminders/smart-parse", json={"text": smart_complete}, headers=headersA)
    assert resp.status_code == 200
    parse_result = resp.json()
    assert parse_result["status"] == "ready", f"Expected ready but got {parse_result}"
    assert parse_result["data"] is not None
    assert parse_result["data"]["due_time"].startswith("08:00")
    print("[PASS] Smart natural text parse with complete date/time: OK")

    # 8. Smart Add with missing date/time: MUST ASK CLARIFICATION, NEVER GUESS
    smart_ambiguous = "ওষুধ খেতে মনে করিয়ে দাও"
    resp = client.post("/api/reminders/smart-parse", json={"text": smart_ambiguous}, headers=headersA)
    assert resp.status_code == 200
    ambiguous_result = resp.json()
    assert ambiguous_result["status"] == "needs_clarification", "Should ask clarification when time/date missing!"
    assert ambiguous_result["clarification_question"] is not None
    assert len(ambiguous_result["clarification_question"]) > 0
    print(f"[PASS] Smart natural parse with missing time correctly asks clarification: '{ambiguous_result['clarification_question']}': OK")

    # 9. Delete reminder
    resp = client.delete(f"/api/reminders/{rem_upcoming_id}", headers=headersA)
    assert resp.status_code == 204

    resp = client.get(f"/api/reminders/{rem_upcoming_id}", headers=headersA)
    assert resp.status_code == 404
    print("[PASS] Delete reminder: OK")

    print("\nAll Reminder Tracker tests passed successfully!")


if __name__ == "__main__":
    run_tests()

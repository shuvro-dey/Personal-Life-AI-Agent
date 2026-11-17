"""Automated test suite for Shopping Manager."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.shopping import ShoppingList, ShoppingItem
from app.services.auth_service import hash_password, create_access_token

client = TestClient(app)


def setup_test_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clean existing test records
    db.query(ShoppingItem).delete()
    db.query(ShoppingList).delete()
    db.query(User).filter(User.email.in_(["userA@example.com", "userB@example.com"])).delete()
    db.commit()

    # Create User A
    userA = User(
        email="userA@example.com",
        password_hash=hash_password("PassA12345"),
        name="User A",
        preferred_language="en",
        timezone="Asia/Dhaka"
    )
    # Create User B
    userB = User(
        email="userB@example.com",
        password_hash=hash_password("PassB12345"),
        name="User B",
        preferred_language="bn",
        timezone="Asia/Dhaka"
    )
    db.add(userA)
    db.add(userB)
    db.commit()
    db.refresh(userA)
    db.refresh(userB)

    tokenA = create_access_token(user_id=userA.id, email=userA.email)
    tokenB = create_access_token(user_id=userB.id, email=userB.email)
    userA_id = userA.id
    userB_id = userB.id
    db.close()

    return tokenA, tokenB, userA_id, userB_id


def run_tests():
    print("Running Shopping Manager tests...")
    tokenA, tokenB, userA_id, userB_id = setup_test_users()
    headersA = {"Authorization": f"Bearer {tokenA}"}
    headersB = {"Authorization": f"Bearer {tokenB}"}

    # 1. User A creates a shopping list
    resp = client.post("/api/shopping/lists", json={"title": "Weekly Groceries"}, headers=headersA)
    assert resp.status_code == 201, f"Failed to create list: {resp.text}"
    listA_data = resp.json()
    listA_id = listA_data["id"]
    assert listA_data["title"] == "Weekly Groceries"
    assert listA_data["total_cost"] == 0.0
    print("[PASS] User A creates shopping list: OK")

    # 2. User A adds items with price and quantity
    # Item 1: 2 kg Rice @ 70 BDT = 140 BDT
    resp = client.post(
        f"/api/shopping/lists/{listA_id}/items",
        json={"name": "Rice", "quantity": 2.0, "unit": "kg", "price": 70.0},
        headers=headersA
    )
    assert resp.status_code == 201
    item1_id = resp.json()["id"]

    # Item 2: 1 dozen Eggs @ 150 BDT = 150 BDT
    resp = client.post(
        f"/api/shopping/lists/{listA_id}/items",
        json={"name": "Eggs", "quantity": 1.0, "unit": "dozen", "price": 150.0},
        headers=headersA
    )
    assert resp.status_code == 201

    # Item 3: 1 liter Milk without price (null)
    resp = client.post(
        f"/api/shopping/lists/{listA_id}/items",
        json={"name": "Milk", "quantity": 1.0, "unit": "liter", "price": None},
        headers=headersA
    )
    assert resp.status_code == 201
    print("[PASS] User A adds items with various prices and units: OK")

    # 3. Verify deterministic backend total cost calculation
    # Expected total = (2.0 * 70.0) + (1.0 * 150.0) = 140.0 + 150.0 = 290.0 BDT
    resp = client.get(f"/api/shopping/lists/{listA_id}", headers=headersA)
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["item_count"] == 3
    assert detail["total_cost"] == 290.0, f"Expected 290.0 but got {detail['total_cost']}"
    print("[PASS] Deterministic backend cost calculation (290.0 BDT): OK")

    # 4. Item check-off status toggle
    resp = client.put(
        f"/api/shopping/items/{item1_id}",
        json={"is_checked": True},
        headers=headersA
    )
    assert resp.status_code == 200
    assert resp.json()["is_checked"] is True

    resp = client.get(f"/api/shopping/lists/{listA_id}", headers=headersA)
    assert resp.json()["checked_count"] == 1
    print("[PASS] Item check-off status: OK")

    # 5. User isolation enforcement (User B cannot see or alter User A's list)
    resp = client.get(f"/api/shopping/lists/{listA_id}", headers=headersB)
    assert resp.status_code == 404, "User B should not be able to view User A's list"

    resp = client.post(
        f"/api/shopping/lists/{listA_id}/items",
        json={"name": "Hacked Item", "quantity": 1.0, "unit": "piece"},
        headers=headersB
    )
    assert resp.status_code == 404, "User B should not be able to add items to User A's list"

    resp = client.delete(f"/api/shopping/items/{item1_id}", headers=headersB)
    assert resp.status_code == 404, "User B should not be able to delete User A's items"
    print("[PASS] User isolation enforcement (cross-user access blocked): OK")

    # 6. Smart parse preview endpoint
    smart_text = "২ কেজি চাল, ১ ডজন ডিম, ১ লিটার তেল"
    resp = client.post("/api/shopping/smart-parse", json={"text": smart_text, "language": "bn"}, headers=headersA)
    assert resp.status_code == 200
    preview = resp.json()
    assert "items" in preview
    assert len(preview["items"]) > 0
    print(f"[PASS] Smart natural text parse preview returned {len(preview['items'])} items: OK")

    # 7. Batch add preview items into list
    batch_payload = {
        "items": [
            {"name": "Mustard Oil", "quantity": 1.0, "unit": "liter", "price": 220.0},
            {"name": "Salt", "quantity": 1.0, "unit": "kg", "price": 40.0}
        ]
    }
    resp = client.post(f"/api/shopping/lists/{listA_id}/batch-add", json=batch_payload, headers=headersA)
    assert resp.status_code == 201
    assert len(resp.json()) == 2

    # New total should be: 290.0 + 220.0 + 40.0 = 550.0 BDT
    resp = client.get(f"/api/shopping/lists/{listA_id}", headers=headersA)
    assert resp.json()["total_cost"] == 550.0
    print("[PASS] Batch add confirmed preview items and updated total (550.0 BDT): OK")

    # 8. Rename list
    resp = client.put(f"/api/shopping/lists/{listA_id}", json={"title": "Monthly Bazaar List"}, headers=headersA)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Monthly Bazaar List"
    print("[PASS] Rename list: OK")

    # 9. Delete list
    resp = client.delete(f"/api/shopping/lists/{listA_id}", headers=headersA)
    assert resp.status_code == 204

    resp = client.get(f"/api/shopping/lists/{listA_id}", headers=headersA)
    assert resp.status_code == 404
    print("[PASS] Delete list and cascade: OK")

    print("\nAll Shopping Manager tests passed successfully!")


if __name__ == "__main__":
    run_tests()

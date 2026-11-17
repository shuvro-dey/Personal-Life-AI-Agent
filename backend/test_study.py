"""Automated test suite for Study Assistant."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.study import StudySession, StudyQuestion, QuizSubmission
from app.services.auth_service import hash_password, create_access_token

client = TestClient(app)


def setup_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.query(QuizSubmission).delete()
    db.query(StudyQuestion).delete()
    db.query(StudySession).delete()
    db.query(User).filter(User.email.in_(["studyUserA@example.com", "studyUserB@example.com"])).delete()
    db.commit()

    userA = User(
        email="studyUserA@example.com",
        password_hash=hash_password("PassA12345"),
        name="Study User A",
        preferred_language="en",
        timezone="Asia/Dhaka"
    )
    userB = User(
        email="studyUserB@example.com",
        password_hash=hash_password("PassB12345"),
        name="Study User B",
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
    db.close()
    return tokenA, tokenB


def run_tests():
    print("Running Study Assistant tests...")
    tokenA, tokenB = setup_users()
    headersA = {"Authorization": f"Bearer {tokenA}"}
    headersB = {"Authorization": f"Bearer {tokenB}"}

    sample_text = (
        "Operating systems coordinate hardware resources and manage software execution. "
        "Key concepts include processes, threads, virtual memory management, and CPU scheduling algorithms. "
        "Memory management uses paging and segmentation to provide memory isolation."
    )

    # 1. User A creates a study session via text
    form_data = {
        "title": "Operating Systems Chapter 3",
        "language": "en",
        "pasted_text": sample_text
    }
    resp = client.post("/api/study/sessions", data=form_data, headers=headersA)
    assert resp.status_code == 201, f"Create session failed: {resp.text}"
    session_data = resp.json()
    session_id = session_data["id"]
    assert session_data["title"] == "Operating Systems Chapter 3"
    print("[PASS] User A creates study session with text: OK")

    # 2. User A creates a study session via TXT file upload
    file_content = b"Database normalization organizes fields and tables of a relational database to minimize redundancy."
    files = {"file": ("database_normalization.txt", file_content, "text/plain")}
    resp = client.post(
        "/api/study/sessions",
        data={"title": "Database Normalization", "language": "en"},
        files=files,
        headers=headersA
    )
    assert resp.status_code == 201
    assert resp.json()["document_name"] == "database_normalization.txt"
    print("[PASS] User A creates study session with file upload: OK")

    # 3. Generate structured summary
    resp = client.post(
        f"/api/study/sessions/{session_id}/generate",
        json={"action": "summary", "language": "en"},
        headers=headersA
    )
    assert resp.status_code == 200
    assert "result" in resp.json()
    assert len(resp.json()["result"]) > 10
    print("[PASS] Generate structured summary: OK")

    # 4. Generate simple explanation
    resp = client.post(
        f"/api/study/sessions/{session_id}/generate",
        json={"action": "explanation", "language": "en"},
        headers=headersA
    )
    assert resp.status_code == 200
    assert "result" in resp.json()
    print("[PASS] Generate simple explanation: OK")

    # 5. Generate practice questions (MCQs + short answer)
    resp = client.post(
        f"/api/study/sessions/{session_id}/generate",
        json={"action": "questions", "language": "en"},
        headers=headersA
    )
    assert resp.status_code == 200
    questions_data = resp.json()
    assert "questions" in questions_data
    questions = questions_data["questions"]
    assert len(questions) >= 3, f"Expected at least 3 questions, got {len(questions)}"
    mcq_questions = [q for q in questions if q["question_type"] == "mcq"]
    assert len(mcq_questions) >= 1
    assert len(mcq_questions[0]["options"]) == 4, "MCQ must have 4 options"
    print(f"[PASS] Generate practice questions ({len(questions)} questions generated with MCQs): OK")

    # 6. User isolation (User B cannot access or submit to User A's session)
    resp = client.get(f"/api/study/sessions/{session_id}", headers=headersB)
    assert resp.status_code == 404, "User B should not access User A's study session"

    resp = client.post(
        f"/api/study/sessions/{session_id}/quiz/submit",
        json={"answers": {}},
        headers=headersB
    )
    assert resp.status_code == 404, "User B should not submit to User A's quiz"
    print("[PASS] User isolation enforcement (cross-user access blocked): OK")

    # 7. Deterministic quiz submission grading
    # Answer the first question correctly and the rest with wrong answers to verify exact deterministic math
    answers_payload = {}
    correct_count = 1
    answers_payload[questions[0]["id"]] = questions[0]["correct_answer"]
    for q in questions[1:]:
        answers_payload[q["id"]] = "Completely wrong answer"

    resp = client.post(
        f"/api/study/sessions/{session_id}/quiz/submit",
        json={"answers": answers_payload},
        headers=headersA
    )
    assert resp.status_code == 200, f"Quiz submission failed: {resp.text}"
    quiz_res = resp.json()
    assert quiz_res["score"] == 1, f"Expected score 1, got {quiz_res['score']}"
    assert quiz_res["total"] == len(questions)
    expected_pct = round(1.0 / len(questions) * 100, 1)
    assert quiz_res["percentage"] == expected_pct
    assert len(quiz_res["results"]) == len(questions)
    assert quiz_res["results"][0]["is_correct"] is True
    assert quiz_res["results"][1]["is_correct"] is False
    print(f"[PASS] Deterministic quiz scoring (1/{len(questions)} = {expected_pct}%): OK")

    # 8. Follow-up streaming chat endpoint
    resp = client.post(
        f"/api/study/sessions/{session_id}/chat",
        json={"message": "Can you elaborate on virtual memory?"},
        headers=headersA
    )
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")
    print("[PASS] Streaming follow-up chat endpoint: OK")

    # 9. Delete session and verify cascading deletion
    resp = client.delete(f"/api/study/sessions/{session_id}", headers=headersA)
    assert resp.status_code == 204

    resp = client.get(f"/api/study/sessions/{session_id}", headers=headersA)
    assert resp.status_code == 404
    print("[PASS] Delete study session with cascade: OK")

    print("\nAll Study Assistant tests passed successfully!")


if __name__ == "__main__":
    run_tests()

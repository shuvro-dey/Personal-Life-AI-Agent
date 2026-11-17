import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.study import StudySession, StudyQuestion, QuizSubmission
from app.models.audit import AuditLog
from app.schemas.study import (
    StudySessionCreate,
    StudySessionSummaryResponse,
    StudySessionDetailResponse,
    StudyQuestionResponse,
    GenerateActionRequest,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
    QuizQuestionResult,
    ChatMessageRequest
)
from app.api.deps import get_current_user
from app.services.document_service import extract_text_from_file
from app.services.ai_service import (
    AIServiceError,
    generate_study_summary,
    generate_study_explanation,
    generate_practice_questions,
    chat_study_stream
)

router = APIRouter(prefix="/study", tags=["Study Assistant"])


@router.get("/sessions", response_model=List[StudySessionSummaryResponse])
def get_study_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all study sessions belonging to the current user."""
    sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id
    ).order_by(StudySession.updated_at.desc()).all()

    results = []
    for s in sessions:
        results.append(
            StudySessionSummaryResponse(
                id=s.id,
                user_id=s.user_id,
                title=s.title,
                document_name=s.document_name,
                document_type=s.document_type,
                language=s.language,
                has_summary=bool(s.summary),
                has_explanation=bool(s.explanation),
                question_count=len(s.questions),
                created_at=s.created_at,
                updated_at=s.updated_at
            )
        )
    return results


@router.post("/sessions", response_model=StudySessionSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_study_session(
    title: str = Form(...),
    language: str = Form("en"),
    pasted_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new study session from uploaded PDF/TXT or pasted text."""
    raw_content = ""
    document_name = None
    document_type = "text"

    if file and file.filename:
        document_name = file.filename
        content_bytes = await file.read()
        try:
            extracted, doc_type = extract_text_from_file(content_bytes, file.filename)
            raw_content = extracted
            document_type = doc_type
        except ValueError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(ve)
            )

    if pasted_text and pasted_text.strip():
        if raw_content:
            raw_content = f"{raw_content}\n\nAdditional Notes:\n{pasted_text.strip()}"
        else:
            raw_content = pasted_text.strip()
            document_type = "text"

    if not raw_content.strip():
        if document_name and document_name.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF contains no extractable text. If this is a scanned document, please paste the text directly into the notes field."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Study content is required. Please provide text or upload a document."
        )

    new_session = StudySession(
        user_id=current_user.id,
        title=title.strip(),
        raw_content=raw_content.strip(),
        document_name=document_name,
        document_type=document_type,
        language=language if language in ["en", "bn"] else "en"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="study_session_created",
        details_json=json.dumps({"session_id": new_session.id, "title": new_session.title}),
        status="success"
    )
    db.add(audit)
    db.commit()

    return StudySessionSummaryResponse(
        id=new_session.id,
        user_id=new_session.user_id,
        title=new_session.title,
        document_name=new_session.document_name,
        document_type=new_session.document_type,
        language=new_session.language,
        has_summary=False,
        has_explanation=False,
        question_count=0,
        created_at=new_session.created_at,
        updated_at=new_session.updated_at
    )


@router.get("/sessions/{session_id}", response_model=StudySessionDetailResponse)
def get_study_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full details of a study session, enforcing user isolation."""
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found"
        )

    questions_res = []
    for q in session.questions:
        options = json.loads(q.options_json) if q.options_json else None
        questions_res.append(
            StudyQuestionResponse(
                id=q.id,
                session_id=q.session_id,
                question_type=q.question_type,
                question_text=q.question_text,
                options=options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                created_at=q.created_at
            )
        )

    # Latest quiz submission
    latest_sub = None
    sub = db.query(QuizSubmission).filter(
        QuizSubmission.session_id == session_id,
        QuizSubmission.user_id == current_user.id
    ).order_by(QuizSubmission.created_at.desc()).first()

    if sub:
        answers = json.loads(sub.answers_json) if sub.answers_json else {}
        results = []
        for q in session.questions:
            u_ans = answers.get(str(q.id))
            is_corr = (u_ans or "").strip().lower() == q.correct_answer.strip().lower()
            results.append(
                QuizQuestionResult(
                    question_id=q.id,
                    question_text=q.question_text,
                    user_answer=u_ans,
                    correct_answer=q.correct_answer,
                    is_correct=is_corr,
                    explanation=q.explanation
                )
            )
        percentage = round((sub.score / sub.total * 100), 1) if sub.total > 0 else 0.0
        latest_sub = QuizSubmissionResponse(
            id=sub.id,
            session_id=sub.session_id,
            score=sub.score,
            total=sub.total,
            percentage=percentage,
            results=results,
            created_at=sub.created_at
        )

    return StudySessionDetailResponse(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        raw_content=session.raw_content,
        document_name=session.document_name,
        document_type=session.document_type,
        language=session.language,
        summary=session.summary,
        explanation=session.explanation,
        gemini_interaction_id=session.gemini_interaction_id,
        questions=questions_res,
        latest_submission=latest_sub,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a study session and associated questions/submissions."""
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found"
        )

    title = session.title
    db.delete(session)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="study_session_deleted",
        details_json=json.dumps({"session_id": session_id, "title": title}),
        status="success"
    )
    db.add(audit)
    db.commit()

    return None


@router.post("/sessions/{session_id}/generate")
def generate_study_action(
    session_id: int,
    payload: GenerateActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate study output: Summary, Simple Explanation, or Practice Questions.
    Output language selectable: Bangla / English.
    """
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found"
        )

    target_lang = payload.language or session.language or "en"

    try:
        if payload.action == "summary":
            summary = generate_study_summary(session.raw_content, language=target_lang)
            session.summary = summary
            session.language = target_lang
            db.commit()
            return {"action": "summary", "result": summary}

        elif payload.action == "explanation":
            explanation = generate_study_explanation(session.raw_content, language=target_lang)
            session.explanation = explanation
            session.language = target_lang
            db.commit()
            return {"action": "explanation", "result": explanation}

        elif payload.action == "questions":
            raw_questions = generate_practice_questions(session.raw_content, language=target_lang)
            # Clear existing questions for fresh generation
            db.query(StudyQuestion).filter(StudyQuestion.session_id == session.id).delete()

            created_questions = []
            for q in raw_questions:
                opts = q.get("options")
                options_str = json.dumps(opts) if opts else None
                new_q = StudyQuestion(
                    user_id=current_user.id,
                    session_id=session.id,
                    question_type=q.get("question_type", "mcq"),
                    question_text=q.get("question_text", ""),
                    options_json=options_str,
                    correct_answer=q.get("correct_answer", ""),
                    explanation=q.get("explanation", "")
                )
                db.add(new_q)
                created_questions.append(new_q)

            db.commit()
            for q in created_questions:
                db.refresh(q)

            return {
                "action": "questions",
                "questions": [
                    StudyQuestionResponse(
                        id=q.id,
                        session_id=q.session_id,
                        question_type=q.question_type,
                        question_text=q.question_text,
                        options=json.loads(q.options_json) if q.options_json else None,
                        correct_answer=q.correct_answer,
                        explanation=q.explanation,
                        created_at=q.created_at
                    )
                    for q in created_questions
                ]
            }

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported action: {payload.action}"
            )
    except AIServiceError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


@router.post("/sessions/{session_id}/quiz/submit", response_model=QuizSubmissionResponse)
def submit_quiz_answers(
    session_id: int,
    payload: QuizSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deterministically grade quiz answers against stored question records.
    Computes exact score and records submission in database.
    """
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found"
        )

    questions = session.questions
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions exist for this study session."
        )

    score = 0
    total = len(questions)
    results = []

    for q in questions:
        user_ans = payload.answers.get(q.id)
        if not user_ans:
            user_ans = payload.answers.get(str(q.id))

        is_correct = False
        if user_ans and str(user_ans).strip().lower() == q.correct_answer.strip().lower():
            is_correct = True
            score += 1

        results.append(
            QuizQuestionResult(
                question_id=q.id,
                question_text=q.question_text,
                user_answer=user_ans,
                correct_answer=q.correct_answer,
                is_correct=is_correct,
                explanation=q.explanation
            )
        )

    # Convert answers dict to JSON string with string keys
    stored_answers = {str(k): v for k, v in payload.answers.items()}
    new_sub = QuizSubmission(
        user_id=current_user.id,
        session_id=session.id,
        score=score,
        total=total,
        answers_json=json.dumps(stored_answers)
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    percentage = round((score / total * 100), 1) if total > 0 else 0.0

    return QuizSubmissionResponse(
        id=new_sub.id,
        session_id=session.id,
        score=score,
        total=total,
        percentage=percentage,
        results=results,
        created_at=new_sub.created_at
    )


@router.post("/sessions/{session_id}/chat")
async def chat_study_session(
    session_id: int,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Streamed follow-up chat using Gemini Interactions API with previous_interaction_id.
    Yields Server-Sent Events (SSE) data chunks.
    """
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found"
        )

    content = session.raw_content
    prev_id = session.gemini_interaction_id

    async def sse_event_stream():
        async for chunk in chat_study_stream(content, payload.message, prev_id):
            if chunk["type"] == "chunk":
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk['text']})}\n\n"
            elif chunk["type"] == "done":
                # Save new interaction_id to database if provided
                new_id = chunk.get("interaction_id")
                if new_id and new_id != prev_id:
                    try:
                        inner_db = SessionLocal()
                        s = inner_db.query(StudySession).filter(StudySession.id == session_id).first()
                        if s:
                            s.gemini_interaction_id = new_id
                            inner_db.commit()
                        inner_db.close()
                    except Exception:
                        pass
                yield f"data: {json.dumps({'type': 'done', 'interaction_id': new_id})}\n\n"

    from app.database import SessionLocal
    return StreamingResponse(sse_event_stream(), media_type="text/event-stream")

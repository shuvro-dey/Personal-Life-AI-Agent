import json
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class StudySessionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    raw_content: str = Field(..., min_length=1)
    document_name: Optional[str] = None
    document_type: str = "text"
    language: Literal["en", "bn"] = "en"


class StudyQuestionResponse(BaseModel):
    id: int
    session_id: int
    question_type: str
    question_text: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizQuestionResult(BaseModel):
    question_id: int
    question_text: str
    user_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    explanation: str


class QuizSubmissionRequest(BaseModel):
    answers: Dict[int, str]  # question_id -> chosen option string


class QuizSubmissionResponse(BaseModel):
    id: int
    session_id: int
    score: int
    total: int
    percentage: float
    results: List[QuizQuestionResult]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudySessionSummaryResponse(BaseModel):
    id: int
    user_id: int
    title: str
    document_name: Optional[str] = None
    document_type: str
    language: str
    has_summary: bool
    has_explanation: bool
    question_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudySessionDetailResponse(BaseModel):
    id: int
    user_id: int
    title: str
    raw_content: str
    document_name: Optional[str] = None
    document_type: str
    language: str
    summary: Optional[str] = None
    explanation: Optional[str] = None
    gemini_interaction_id: Optional[str] = None
    questions: List[StudyQuestionResponse]
    latest_submission: Optional[QuizSubmissionResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateActionRequest(BaseModel):
    action: Literal["summary", "explanation", "questions"]
    language: Optional[Literal["en", "bn"]] = None


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

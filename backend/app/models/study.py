from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    raw_content = Column(Text, nullable=False)
    document_name = Column(String(255), nullable=True)
    document_type = Column(String(50), default="text", nullable=False)  # text, pdf, image
    language = Column(String(10), default="en", nullable=False)  # en, bn
    summary = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    gemini_interaction_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="study_sessions")
    questions = relationship("StudyQuestion", back_populates="session", cascade="all, delete-orphan")
    submissions = relationship("QuizSubmission", back_populates="session", cascade="all, delete-orphan")


class StudyQuestion(Base):
    __tablename__ = "study_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_type = Column(String(20), default="mcq", nullable=False)  # mcq, short_answer
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=True)  # JSON serialized list of options
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("StudySession", back_populates="questions")


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    answers_json = Column(Text, nullable=False)  # JSON serialized user answers
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("StudySession", back_populates="submissions")

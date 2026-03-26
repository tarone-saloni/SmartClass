"""
models.py — Pydantic request/response schemas for all API endpoints.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    course_context: Optional[str] = None
    user_role: Optional[str] = "student"  # "student" | "teacher"


class QuizGenerationRequest(BaseModel):
    topic: str
    content: Optional[str] = None
    num_questions: int = 5
    difficulty: str = "medium"  # easy | medium | hard
    course_title: Optional[str] = None


class SummarizeRequest(BaseModel):
    content: str
    style: str = "bullet-points"  # concise | detailed | bullet-points | key-concepts


class FeedbackRequest(BaseModel):
    assignment_title: str
    assignment_description: Optional[str] = None
    student_submission: str
    max_score: int = 100
    course_title: Optional[str] = None


class StudyPlanRequest(BaseModel):
    student_name: str
    enrolled_courses: List[str]
    weak_areas: Optional[List[str]] = []
    available_hours_per_week: int = 10
    goals: Optional[str] = ""


class ExplainRequest(BaseModel):
    concept: str
    course_context: Optional[str] = None
    difficulty_level: str = "intermediate"  # beginner | intermediate | advanced


class PerformanceRequest(BaseModel):
    subject: str
    quiz_scores: Optional[List[float]] = []
    assignment_grades: Optional[List[float]] = []
    course_progress: Optional[float] = 0


class CourseOutlineRequest(BaseModel):
    course_title: str
    subject: str
    duration_weeks: int = 8
    target_level: str = "intermediate"
    learning_objectives: Optional[str] = ""


class AgentRequest(BaseModel):
    task: str
    context: Optional[Dict[str, Any]] = {}

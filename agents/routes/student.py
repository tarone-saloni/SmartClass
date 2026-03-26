"""
routes/student.py — Endpoints primarily used by students.

  POST /chat               — Multi-turn AI chat assistant
  POST /feedback           — AI feedback on assignment submission
  POST /study-plan         — Personalized study plan generator
  POST /explain            — Concept explanation (adaptive difficulty)
  POST /analyze-performance — Student performance analysis
  POST /summarize          — Summarize course materials
"""

from fastapi import APIRouter, HTTPException
from config import client, MODEL
from models import (
    ChatRequest,
    FeedbackRequest,
    StudyPlanRequest,
    ExplainRequest,
    PerformanceRequest,
    SummarizeRequest,
)
import llm

router = APIRouter(tags=["Student"])


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    General-purpose AI chat assistant.
    Supports multi-turn conversations with optional course context.
    """
    system = f"""You are SmartClass AI, a helpful and friendly educational assistant.
You are currently talking with a **{request.user_role}**.
{f'Current course context: {request.course_context}' if request.course_context else ''}

Guidelines:
- For students: explain concepts clearly, use examples, be encouraging.
- For teachers: offer pedagogical strategies, help with content creation.
- Keep responses focused and educational.
- If asked something outside education, gently redirect."""

    messages = [{"role": m.role, "content": m.content} for m in (request.history or [])]
    messages.append({"role": "user", "content": request.message})

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=system,
            messages=messages,
        )
        return {
            "response": response.content[0].text,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def get_feedback(request: FeedbackRequest):
    """
    AI-powered feedback on a student's assignment submission.
    Returns strengths, improvement areas, and a suggested score.
    """
    try:
        result = llm.grade_and_feedback({
            "assignment_title": request.assignment_title,
            "assignment_requirements": request.assignment_description or "",
            "student_submission": request.student_submission,
            "max_score": request.max_score,
        })
        return {
            "feedback": result,
            "assignment": request.assignment_title,
            "max_score": request.max_score,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/study-plan")
async def create_study_plan(request: StudyPlanRequest):
    """Generate a personalized weekly study plan for a student."""
    try:
        result = llm.create_study_schedule({
            "courses": request.enrolled_courses,
            "weak_topics": request.weak_areas,
            "hours_per_week": request.available_hours_per_week,
            "goals": request.goals or f"Academic excellence for {request.student_name}",
            "student_name": request.student_name,
        })
        return {"study_plan": result, "student": request.student_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain")
async def explain_concept(request: ExplainRequest):
    """Explain any concept with adaptive difficulty, examples, and clear structure."""
    try:
        result = llm.explain_concept({
            "concept": request.concept,
            "level": request.difficulty_level,
            "include_examples": True,
            "subject_context": request.course_context or "",
        })
        return {
            "explanation": result,
            "concept": request.concept,
            "level": request.difficulty_level,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-performance")
async def analyze_performance(request: PerformanceRequest):
    """Analyze student performance data and provide actionable insights."""
    try:
        result = llm.analyze_performance({
            "subject": request.subject,
            "quiz_scores": request.quiz_scores,
            "assignment_grades": request.assignment_grades,
            "course_progress": request.course_progress,
        })
        return {"analysis": result, "subject": request.subject}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize(request: SummarizeRequest):
    """Summarize educational content in the requested style."""
    try:
        result = llm.summarize_material({"content": request.content, "format": request.style})
        return {"summary": result, "style": request.style, "word_count": len(result.split())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

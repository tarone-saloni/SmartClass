"""
routes/teacher.py — Endpoints primarily used by teachers.

  POST /generate-quiz   — Generate MCQ quiz questions from topic or content
  POST /course-outline  — Generate a full N-week course outline
  POST /agent           — Agentic workflow (multi-tool, multi-step tasks)
"""

import json
from fastapi import APIRouter, HTTPException
from models import QuizGenerationRequest, CourseOutlineRequest, AgentRequest
import llm
from agent import run_agent

router = APIRouter(tags=["Teacher"])


@router.post("/generate-quiz")
async def generate_quiz(request: QuizGenerationRequest):
    """
    Generate multiple-choice quiz questions for a topic or content.
    Returns structured JSON questions ready to import into SmartClass.
    """
    try:
        raw = llm.generate_quiz({
            "topic": request.topic,
            "content": request.content or "",
            "num_questions": request.num_questions,
            "difficulty": request.difficulty,
        })
        # Strip markdown code fences if Claude wraps the JSON
        try:
            text = raw.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            questions = json.loads(text)
            return {
                "questions": questions,
                "topic": request.topic,
                "difficulty": request.difficulty,
                "count": len(questions),
            }
        except json.JSONDecodeError:
            return {"raw_response": raw, "topic": request.topic, "parse_error": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/course-outline")
async def generate_course_outline(request: CourseOutlineRequest):
    """Generate a detailed course outline for teachers."""
    try:
        result = llm.generate_course_outline({
            "course_title": request.course_title,
            "subject": request.subject,
            "duration_weeks": request.duration_weeks,
            "target_level": request.target_level,
            "learning_objectives": request.learning_objectives or "",
        })
        return {"outline": result, "course_title": request.course_title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent")
async def run_smart_agent(request: AgentRequest):
    """
    Full agentic workflow — Claude autonomously selects and chains multiple tools
    to complete complex, multi-step educational tasks.

    Example tasks:
    - "Generate a quiz on recursion AND create a study plan for a student weak in algorithms"
    - "Summarize this content then generate quiz questions from the summary"
    - "Analyze this student's performance and recommend a personalized study schedule"
    - "Create a complete 8-week course outline for Introduction to Machine Learning"
    """
    try:
        result = run_agent(request.task, request.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""
routes/info.py — Health check and API index endpoints.
"""

from fastapi import APIRouter
from config import MODEL

router = APIRouter(tags=["Info"])


@router.get("/")
async def root():
    return {
        "service": "SmartClass AI Agent API",
        "version": "1.0.0",
        "model": MODEL,
        "endpoints": {
            "GET  /health": "Health check",
            "POST /chat": "AI chat assistant (students & teachers)",
            "POST /generate-quiz": "Generate quiz questions from topic/content",
            "POST /summarize": "Summarize course material",
            "POST /feedback": "AI feedback on assignment submission",
            "POST /study-plan": "Personalized study plan generator",
            "POST /explain": "Explain any concept (adaptive difficulty)",
            "POST /analyze-performance": "Analyze student performance data",
            "POST /course-outline": "Generate course outline (for teachers)",
            "POST /agent": "Full agentic workflow (multi-tool, complex tasks)",
        },
    }


@router.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL}

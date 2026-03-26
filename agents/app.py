"""
app.py — SmartClass AI Agent entry point.

Wires together all route components and starts the FastAPI server.

Run:
    python app.py
    uvicorn app:app --reload --port 8000

Docs available at:
    http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.info import router as info_router
from routes.student import router as student_router
from routes.teacher import router as teacher_router

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SmartClass AI Agent API",
    description="AI-powered educational features for the SmartClass LMS",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mount routers
# ---------------------------------------------------------------------------

app.include_router(info_router)
app.include_router(student_router)
app.include_router(teacher_router)

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

# SmartClass AI Agent System

AI-powered backend for the SmartClass LMS built with **FastAPI** + **Anthropic Claude**.
Provides intelligent features for both students and teachers via a REST API.

---

## Features

| Endpoint | Who | Description |
|---|---|---|
| `POST /chat` | Both | Multi-turn AI chat with course context |
| `POST /generate-quiz` | Teacher | Generate MCQ questions from any topic or content |
| `POST /summarize` | Both | Summarize course materials in 4 styles |
| `POST /feedback` | Student | AI reviews assignment submissions with score |
| `POST /study-plan` | Student | Personalized weekly study schedule |
| `POST /explain` | Student | Concept explanation (beginner / intermediate / advanced) |
| `POST /analyze-performance` | Both | Analyze quiz & assignment scores with insights |
| `POST /course-outline` | Teacher | Full N-week course outline with objectives |
| `POST /agent` | Both | Agentic workflow — Claude chains multiple tools automatically |

---

## Project Structure

```
agents/
├── app.py              # Entry point — mounts routers, CORS, starts server
├── config.py           # Anthropic client + model config
├── models.py           # Pydantic request schemas for all endpoints
├── tools.py            # Claude tool definitions for agentic workflow
├── llm.py              # Core LLM functions (one per AI feature)
├── agent.py            # Agentic loop (multi-tool, multi-step tasks)
├── requirements.txt    # Python dependencies
├── README.md           # This file
└── routes/
    ├── __init__.py
    ├── info.py         # GET /  and  GET /health
    ├── student.py      # /chat, /feedback, /study-plan, /explain,
    │                   #   /analyze-performance, /summarize
    └── teacher.py      # /generate-quiz, /course-outline, /agent
```

---

## Setup

### 1. Prerequisites

- Python 3.10+
- An [Anthropic API key](https://console.anthropic.com/)

### 2. Create & activate virtual environment

```bash
cd agents
python -m venv env
source env/bin/activate        # Linux / macOS
env\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set environment variable

Create a `.env` file inside the `agents/` directory:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 5. Run the server

```bash
python app.py
# or
uvicorn app:app --reload --port 8000
```

API is live at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

---

## API Reference

### `POST /chat`
General-purpose AI chat. Supports conversation history and course context.

**Request**
```json
{
  "message": "Explain what a binary tree is",
  "user_role": "student",
  "course_context": "Data Structures",
  "history": [
    { "role": "user", "content": "What is a tree?" },
    { "role": "assistant", "content": "A tree is a hierarchical data structure..." }
  ]
}
```

**Response**
```json
{
  "response": "A binary tree is...",
  "usage": { "input_tokens": 120, "output_tokens": 340 }
}
```

---

### `POST /generate-quiz`
Generate multiple-choice questions. Returns structured JSON ready to import into SmartClass.

**Request**
```json
{
  "topic": "Python Functions",
  "num_questions": 5,
  "difficulty": "medium",
  "content": "Optional — paste course material to base questions on"
}
```

**Response**
```json
{
  "questions": [
    {
      "question": "What keyword is used to define a function in Python?",
      "options": ["func", "def", "function", "define"],
      "correct_answer": 1,
      "explanation": "'def' is the keyword used to define functions in Python."
    }
  ],
  "topic": "Python Functions",
  "difficulty": "medium",
  "count": 5
}
```

---

### `POST /summarize`
Summarize any educational content.

**Request**
```json
{
  "content": "Paste your course material or notes here...",
  "style": "bullet-points"
}
```

`style` options: `concise` · `detailed` · `bullet-points` · `key-concepts`

**Response**
```json
{
  "summary": "• Topic 1\n  - Subtopic A\n  - Subtopic B\n...",
  "style": "bullet-points",
  "word_count": 142
}
```

---

### `POST /feedback`
AI reviews a student's assignment submission.

**Request**
```json
{
  "assignment_title": "Implement a Stack in Python",
  "assignment_description": "Create a Stack class with push, pop, and peek methods.",
  "student_submission": "class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, item):\n        self.items.append(item)...",
  "max_score": 100
}
```

**Response**
```json
{
  "feedback": "### Overall Assessment\n...\n### Strengths\n...\n### Suggested Score\n85 / 100",
  "assignment": "Implement a Stack in Python",
  "max_score": 100
}
```

---

### `POST /study-plan`
Generate a personalized weekly study schedule.

**Request**
```json
{
  "student_name": "Aditya",
  "enrolled_courses": ["Data Structures", "Web Development", "Machine Learning"],
  "weak_areas": ["Recursion", "CSS Flexbox"],
  "available_hours_per_week": 12,
  "goals": "Prepare for upcoming exams"
}
```

**Response**
```json
{
  "study_plan": "### Weekly Overview\n...\n### Day-by-Day Schedule\n...",
  "student": "Aditya"
}
```

---

### `POST /explain`
Explain any concept with adaptive difficulty.

**Request**
```json
{
  "concept": "Recursion",
  "course_context": "Data Structures",
  "difficulty_level": "beginner"
}
```

`difficulty_level` options: `beginner` · `intermediate` · `advanced`

**Response**
```json
{
  "explanation": "### Definition\n...\n### Why It Matters\n...\n### Example\n...",
  "concept": "Recursion",
  "level": "beginner"
}
```

---

### `POST /analyze-performance`
Analyze a student's performance data.

**Request**
```json
{
  "subject": "Data Structures",
  "quiz_scores": [72, 68, 80, 85, 90],
  "assignment_grades": [75, 82, 88],
  "course_progress": 65
}
```

**Response**
```json
{
  "analysis": "### Performance Summary\nGood — showing improvement...\n### Actionable Recommendations\n...",
  "subject": "Data Structures"
}
```

---

### `POST /course-outline`
Generate a complete course outline for teachers.

**Request**
```json
{
  "course_title": "Introduction to Machine Learning",
  "subject": "Computer Science",
  "duration_weeks": 8,
  "target_level": "intermediate",
  "learning_objectives": "Students will understand core ML algorithms and implement them in Python"
}
```

**Response**
```json
{
  "outline": "### Course Overview\n...\n### Weekly Breakdown\n- Week 1: Introduction to ML...\n### Assessment Plan\n...",
  "course_title": "Introduction to Machine Learning"
}
```

---

### `POST /agent`
Full agentic workflow. Claude autonomously selects and chains tools to complete complex tasks.

**Request**
```json
{
  "task": "Generate a 5-question quiz on recursion AND create a study plan for a student weak in algorithms who has 10 hours per week",
  "context": {
    "student_name": "Aditya",
    "course": "Data Structures"
  }
}
```

**Response**
```json
{
  "response": "Here is the quiz on recursion...\n\nAnd here is your personalized study plan...",
  "tools_used": [
    { "tool": "generate_quiz_questions", "success": true },
    { "tool": "create_study_schedule", "success": true }
  ],
  "iterations": 3
}
```

**More example agent tasks:**
```
"Summarize this content and then generate 5 quiz questions from the summary"
"Analyze this student's scores and recommend a personalized study schedule"
"Create a complete 12-week course outline for Introduction to Web Development"
"Explain recursion at beginner level and also generate 3 easy practice questions"
```

---

## How the Agent Works

The `/agent` endpoint uses **Claude's native tool-use** in an agentic loop:

```
User Task
    │
    ▼
Claude decides which tool(s) to call
    │
    ▼
Tool executes (generate_quiz / summarize / explain / etc.)
    │
    ▼
Result fed back to Claude
    │
    ▼
Claude synthesizes final answer  ──►  Response returned
         (or calls more tools)
```

Claude can chain up to 10 tool calls per request to handle complex, multi-step tasks.

---

## Available Tools (for the Agent)

| Tool | What it does |
|---|---|
| `generate_quiz_questions` | Generates MCQ questions |
| `summarize_material` | Summarizes content |
| `explain_concept` | Explains a concept |
| `grade_and_feedback` | Reviews assignment submission |
| `create_study_schedule` | Builds weekly study plan |
| `analyze_performance` | Analyzes scores and progress |
| `generate_course_outline` | Creates full course outline |

---

## Integration with SmartClass Backend

The AI agent runs as a **separate Python service** on port `8000`.
The main Node.js backend runs on port `5000`.

To call the AI from the Node.js backend or React frontend:

```js
// From Node.js backend
const res = await fetch('http://localhost:8000/generate-quiz', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: 'Recursion', num_questions: 5, difficulty: 'medium' })
});
const data = await res.json();

// From React frontend
const res = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'What is a linked list?', user_role: 'student' })
});
```

---

## Model

All AI features use **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — Anthropic's latest model, balancing speed and intelligence.

To switch models, change `MODEL` in [config.py](config.py):
```python
MODEL = "claude-opus-4-6"    # Most powerful
MODEL = "claude-sonnet-4-6"  # Balanced (default)
MODEL = "claude-haiku-4-5-20251001"  # Fastest, lowest cost
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `anthropic` | Claude API client |
| `python-dotenv` | Load `.env` variables |
| `pydantic` | Request/response validation |

"""
llm.py — Core LLM helper functions.
Each function maps directly to one AI capability / tool implementation.
All functions are used by both the direct API endpoints and the agentic workflow.
"""

from typing import Any, Dict
from config import client, MODEL


# ---------------------------------------------------------------------------
# Base helper
# ---------------------------------------------------------------------------

def _call_claude(prompt: str, max_tokens: int = 2000, system: str = "") -> str:
    """Single-turn Claude call. Returns the text response."""
    kwargs: Dict[str, Any] = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        kwargs["system"] = system
    response = client.messages.create(**kwargs)
    return response.content[0].text


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def generate_quiz(params: dict) -> str:
    """Generate multiple-choice quiz questions for a topic or content."""
    topic = params["topic"]
    content = params.get("content", "")
    num_q = params.get("num_questions", 5)
    difficulty = params.get("difficulty", "medium")
    content_section = f"\n\nBase the questions on this content:\n{content}" if content else ""

    prompt = f"""Generate {num_q} {difficulty}-level multiple-choice questions about: **{topic}**{content_section}

Return ONLY a valid JSON array with this exact structure (no extra text, no markdown code block):
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }}
]

Rules:
- correct_answer is the 0-based index of the correct option
- All 4 options must be plausible (no obviously wrong answers)
- Questions should test understanding, not just memorization
- Vary question types: factual, application, analysis"""
    return _call_claude(prompt, max_tokens=3000)


def summarize_material(params: dict) -> str:
    """Summarize educational content in a chosen format."""
    content = params["content"]
    fmt = params.get("format", "bullet-points")
    subject = params.get("subject", "")
    format_map = {
        "concise": "in 2-3 clear, information-dense paragraphs",
        "detailed": "with thorough explanations for each key topic",
        "bullet-points": "as hierarchical bullet points (main topics → subtopics)",
        "key-concepts": "by identifying and defining the most critical concepts",
    }
    instruction = format_map.get(fmt, "as bullet points")
    context = f" (Subject: {subject})" if subject else ""
    prompt = f"""Summarize the following educational content{context} {instruction}:

---
{content}
---

Make it clear, engaging, and optimized for student revision."""
    return _call_claude(prompt, max_tokens=1500)


def explain_concept(params: dict) -> str:
    """Explain a concept with adaptive difficulty and examples."""
    concept = params["concept"]
    level = params.get("level", "intermediate")
    examples = params.get("include_examples", True)
    ctx = params.get("subject_context", "")
    level_map = {
        "beginner": "Use simple everyday language, avoid jargon, and use relatable analogies.",
        "intermediate": "Use standard terminology with clear explanations of any technical terms.",
        "advanced": "Use technical depth, cover edge cases, nuances, and real-world applications.",
    }
    ctx_str = f" in the context of {ctx}" if ctx else ""
    ex_str = " Include 1-2 practical, real-world examples." if examples else ""
    prompt = f"""Explain the concept of **"{concept}"**{ctx_str} for a {level}-level student.

{level_map.get(level, '')}{ex_str}

Structure your response with these sections:
### Definition
### Why It Matters
### How It Works
### {'Example' if examples else 'Key Points'}
### Key Takeaways"""
    return _call_claude(prompt, max_tokens=1500)


def grade_and_feedback(params: dict) -> str:
    """Review a student assignment and return structured feedback with a suggested score."""
    title = params["assignment_title"]
    requirements = params.get("assignment_requirements", "Complete the assignment as described.")
    submission = params["student_submission"]
    max_score = params.get("max_score", 100)
    rubric = params.get("rubric", "")
    rubric_str = f"\n\n**Rubric:**\n{rubric}" if rubric else ""
    prompt = f"""You are a fair and constructive educator reviewing a student's assignment.

**Assignment:** {title}
**Requirements:** {requirements}
**Maximum Score:** {max_score}{rubric_str}

**Student Submission:**
{submission}

Provide a structured review with:
### Overall Assessment
(1-2 sentences summarizing the work quality)

### Strengths
(Bullet points of what was done well)

### Areas for Improvement
(Specific, constructive feedback with actionable suggestions)

### Suggested Score
X / {max_score} — with clear justification

### Next Steps
(2-3 concrete actions the student can take to improve)

Be encouraging but honest. Focus on learning growth."""
    return _call_claude(prompt, max_tokens=1500)


def create_study_schedule(params: dict) -> str:
    """Create a personalized weekly study plan for a student."""
    courses = params.get("courses", [])
    weak_topics = params.get("weak_topics", [])
    hours = params.get("hours_per_week", 10)
    goals = params.get("goals", "Master the course material and improve grades")
    name = params.get("student_name", "the student")
    courses_str = "\n".join(f"  - {c}" for c in courses)
    weak_str = "\n".join(f"  - {t}" for t in weak_topics) if weak_topics else "  None specified"
    prompt = f"""Create a detailed personalized weekly study plan for {name}.

**Enrolled Courses:**
{courses_str}

**Weak Areas (need extra focus):**
{weak_str}

**Available Study Time:** {hours} hours per week
**Goal:** {goals}

Generate a structured plan with:
### Weekly Overview
(Time allocation per course as a table)

### Day-by-Day Schedule
(Specific time blocks Mon–Sun with subject and activity)

### Study Strategies
(Recommended techniques per subject)

### Weekly Milestones
(What should be achieved by end of each week for the next 4 weeks)

### Progress Check Tips
(How to self-assess learning)"""
    return _call_claude(prompt, max_tokens=2500)


def analyze_performance(params: dict) -> str:
    """Analyze student performance data and return insights and recommendations."""
    subject = params["subject"]
    quiz_scores = params.get("quiz_scores", [])
    assignment_grades = params.get("assignment_grades", [])
    progress = params.get("course_progress", 0)
    quiz_str = (
        f"Quiz scores: {quiz_scores} → Average: {sum(quiz_scores)/len(quiz_scores):.1f}%"
        if quiz_scores else "No quiz data available"
    )
    assign_str = (
        f"Assignment grades: {assignment_grades} → Average: {sum(assignment_grades)/len(assignment_grades):.1f}%"
        if assignment_grades else "No assignment data available"
    )
    prompt = f"""Analyze the following academic performance data for a student in **{subject}**:

- {quiz_str}
- {assign_str}
- Course completion: {progress}%

Provide a comprehensive analysis:
### Performance Summary
(Overall standing: Excellent / Good / Needs Improvement)

### Trend Analysis
(Improving, stable, or declining? Explain why.)

### Strengths
(Where they excel)

### Critical Areas
(Topics or skills needing immediate attention)

### Actionable Recommendations
(5 specific, prioritized steps to improve)

### Motivational Note
(Brief encouraging message to keep them going)"""
    return _call_claude(prompt, max_tokens=1500)


def generate_course_outline(params: dict) -> str:
    """Generate a full course outline for a teacher."""
    title = params["course_title"]
    subject = params["subject"]
    weeks = params.get("duration_weeks", 8)
    level = params.get("target_level", "intermediate")
    objectives = params.get("learning_objectives", "")
    obj_str = f"\n**Learning Objectives:** {objectives}" if objectives else ""
    prompt = f"""Create a comprehensive course outline for educators:

**Course:** {title}
**Subject:** {subject}
**Duration:** {weeks} weeks
**Level:** {level}{obj_str}

Generate a detailed, pedagogically sound outline:
### Course Overview
(Description, prerequisites, target audience)

### Weekly Breakdown
For each of the {weeks} weeks provide:
- Week N: [Topic Title]
  - Main concepts covered
  - Learning objectives (what students will be able to do)
  - Suggested activities (quiz, assignment, discussion)
  - Recommended resources

### Assessment Plan
(Quiz schedule, assignment due dates, weightings)

### Final Assessment
(Description of final project/exam)

### Teaching Tips
(Pedagogical suggestions for delivering this course effectively)"""
    return _call_claude(prompt, max_tokens=3500)

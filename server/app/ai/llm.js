/**
 * llm.js — Core LLM helper functions (JavaScript port of agents/llm.py).
 * Each function maps directly to one AI capability / tool implementation.
 * All functions are used by both the direct API endpoints and the agentic workflow.
 */

import Anthropic from "@anthropic-ai/sdk";

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}
export const MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// Base helper
// ---------------------------------------------------------------------------

async function callClaude(prompt, maxTokens = 2000, system = "") {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  if (system) params.system = system;
  const response = await getClient().messages.create(params);
  return response.content[0].text;
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

export async function generateQuiz(params) {
  const { topic, content = "", num_questions: numQ = 5, difficulty = "medium" } = params;
  const contentSection = content ? `\n\nBase the questions on this content:\n${content}` : "";
  const prompt = `Generate ${numQ} ${difficulty}-level multiple-choice questions about: **${topic}**${contentSection}

Return ONLY a valid JSON array with this exact structure (no extra text, no markdown code block):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- correct_answer is the 0-based index of the correct option
- All 4 options must be plausible (no obviously wrong answers)
- Questions should test understanding, not just memorization
- Vary question types: factual, application, analysis`;
  return callClaude(prompt, 3000);
}

export async function summarizeMaterial(params) {
  const { content, format: fmt = "bullet-points", subject = "" } = params;
  const formatMap = {
    concise: "in 2-3 clear, information-dense paragraphs",
    detailed: "with thorough explanations for each key topic",
    "bullet-points": "as hierarchical bullet points (main topics → subtopics)",
    "key-concepts": "by identifying and defining the most critical concepts",
  };
  const instruction = formatMap[fmt] || "as bullet points";
  const context = subject ? ` (Subject: ${subject})` : "";
  const prompt = `Summarize the following educational content${context} ${instruction}:

---
${content}
---

Make it clear, engaging, and optimized for student revision.`;
  return callClaude(prompt, 1500);
}

export async function explainConcept(params) {
  const {
    concept,
    level = "intermediate",
    include_examples: includeExamples = true,
    subject_context: ctx = "",
  } = params;
  const levelMap = {
    beginner: "Use simple everyday language, avoid jargon, and use relatable analogies.",
    intermediate: "Use standard terminology with clear explanations of any technical terms.",
    advanced: "Use technical depth, cover edge cases, nuances, and real-world applications.",
  };
  const ctxStr = ctx ? ` in the context of ${ctx}` : "";
  const exStr = includeExamples ? " Include 1-2 practical, real-world examples." : "";
  const prompt = `Explain the concept of **"${concept}"**${ctxStr} for a ${level}-level student.

${levelMap[level] || ""}${exStr}

Structure your response with these sections:
### Definition
### Why It Matters
### How It Works
### ${includeExamples ? "Example" : "Key Points"}
### Key Takeaways`;
  return callClaude(prompt, 1500);
}

export async function gradeAndFeedback(params) {
  const {
    assignment_title: title,
    assignment_requirements: requirements = "Complete the assignment as described.",
    student_submission: submission,
    max_score: maxScore = 100,
    rubric = "",
  } = params;
  const rubricStr = rubric ? `\n\n**Rubric:**\n${rubric}` : "";
  const prompt = `You are a fair and constructive educator reviewing a student's assignment.

**Assignment:** ${title}
**Requirements:** ${requirements}
**Maximum Score:** ${maxScore}${rubricStr}

**Student Submission:**
${submission}

Provide a structured review with:
### Overall Assessment
(1-2 sentences summarizing the work quality)

### Strengths
(Bullet points of what was done well)

### Areas for Improvement
(Specific, constructive feedback with actionable suggestions)

### Suggested Score
X / ${maxScore} — with clear justification

### Next Steps
(2-3 concrete actions the student can take to improve)

Be encouraging but honest. Focus on learning growth.`;
  return callClaude(prompt, 1500);
}

export async function createStudySchedule(params) {
  const {
    courses = [],
    weak_topics: weakTopics = [],
    hours_per_week: hours = 10,
    goals = "Master the course material and improve grades",
    student_name: name = "the student",
  } = params;
  const coursesStr = courses.map((c) => `  - ${c}`).join("\n");
  const weakStr =
    weakTopics.length > 0 ? weakTopics.map((t) => `  - ${t}`).join("\n") : "  None specified";
  const prompt = `Create a detailed personalized weekly study plan for ${name}.

**Enrolled Courses:**
${coursesStr}

**Weak Areas (need extra focus):**
${weakStr}

**Available Study Time:** ${hours} hours per week
**Goal:** ${goals}

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
(How to self-assess learning)`;
  return callClaude(prompt, 2500);
}

export async function analyzePerformance(params) {
  const {
    subject,
    quiz_scores: quizScores = [],
    assignment_grades: assignmentGrades = [],
    course_progress: progress = 0,
  } = params;
  const quizStr =
    quizScores.length > 0
      ? `Quiz scores: ${JSON.stringify(quizScores)} → Average: ${(quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1)}%`
      : "No quiz data available";
  const assignStr =
    assignmentGrades.length > 0
      ? `Assignment grades: ${JSON.stringify(assignmentGrades)} → Average: ${(assignmentGrades.reduce((a, b) => a + b, 0) / assignmentGrades.length).toFixed(1)}%`
      : "No assignment data available";
  const prompt = `Analyze the following academic performance data for a student in **${subject}**:

- ${quizStr}
- ${assignStr}
- Course completion: ${progress}%

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
(Brief encouraging message to keep them going)`;
  return callClaude(prompt, 1500);
}

export async function generateCourseOutline(params) {
  const {
    course_title: title,
    subject,
    duration_weeks: weeks = 8,
    target_level: level = "intermediate",
    learning_objectives: objectives = "",
  } = params;
  const objStr = objectives ? `\n**Learning Objectives:** ${objectives}` : "";
  const prompt = `Create a comprehensive course outline for educators:

**Course:** ${title}
**Subject:** ${subject}
**Duration:** ${weeks} weeks
**Level:** ${level}${objStr}

Generate a detailed, pedagogically sound outline:
### Course Overview
(Description, prerequisites, target audience)

### Weekly Breakdown
For each of the ${weeks} weeks provide:
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
(Pedagogical suggestions for delivering this course effectively)`;
  return callClaude(prompt, 3500);
}

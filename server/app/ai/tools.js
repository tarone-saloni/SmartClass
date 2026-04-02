/**
 * tools.js — Claude tool definitions for the agentic workflow (JS port of agents/tools.py).
 * Each entry describes a tool that Claude can autonomously select and call.
 */

export const SMARTCLASS_TOOLS = [
  {
    name: "generate_quiz_questions",
    description:
      "Generate multiple-choice quiz questions for a given topic or content. " +
      "Returns a JSON array of questions ready to be added to the LMS.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Main topic or subject for the quiz" },
        content: {
          type: "string",
          description: "Optional source content to base questions on",
        },
        num_questions: {
          type: "integer",
          description: "Number of questions (1-20)",
          default: 5,
        },
        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      },
      required: ["topic", "num_questions", "difficulty"],
    },
  },
  {
    name: "summarize_material",
    description: "Summarize educational content into a concise, easy-to-understand format.",
    input_schema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Educational content to summarize" },
        format: {
          type: "string",
          enum: ["concise", "detailed", "bullet-points", "key-concepts"],
          description: "Summary format",
        },
        subject: { type: "string", description: "Subject area for context" },
      },
      required: ["content", "format"],
    },
  },
  {
    name: "explain_concept",
    description:
      "Explain a concept clearly with definitions, examples, and step-by-step breakdown.",
    input_schema: {
      type: "object",
      properties: {
        concept: { type: "string" },
        level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
        include_examples: { type: "boolean" },
        subject_context: { type: "string", description: "Course or subject context" },
      },
      required: ["concept", "level"],
    },
  },
  {
    name: "grade_and_feedback",
    description:
      "Review a student's assignment submission and provide detailed, " +
      "constructive feedback with a suggested score.",
    input_schema: {
      type: "object",
      properties: {
        assignment_title: { type: "string" },
        assignment_requirements: { type: "string" },
        student_submission: { type: "string" },
        max_score: { type: "integer" },
        rubric: { type: "string", description: "Optional grading rubric" },
      },
      required: ["assignment_title", "student_submission", "max_score"],
    },
  },
  {
    name: "create_study_schedule",
    description:
      "Create a personalized weekly study schedule based on enrolled courses and performance.",
    input_schema: {
      type: "object",
      properties: {
        courses: { type: "array", items: { type: "string" } },
        weak_topics: { type: "array", items: { type: "string" } },
        hours_per_week: { type: "integer" },
        goals: { type: "string" },
        student_name: { type: "string" },
      },
      required: ["courses", "hours_per_week"],
    },
  },
  {
    name: "analyze_performance",
    description: "Analyze a student's academic performance data and provide actionable insights.",
    input_schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        quiz_scores: { type: "array", items: { type: "number" } },
        assignment_grades: { type: "array", items: { type: "number" } },
        course_progress: { type: "number", description: "Completion percentage" },
      },
      required: ["subject"],
    },
  },
  {
    name: "generate_course_outline",
    description:
      "Generate a comprehensive course outline with weekly topics, " +
      "learning objectives, and assessment plan for teachers.",
    input_schema: {
      type: "object",
      properties: {
        course_title: { type: "string" },
        subject: { type: "string" },
        duration_weeks: { type: "integer" },
        target_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
        learning_objectives: { type: "string" },
      },
      required: ["course_title", "subject", "duration_weeks", "target_level"],
    },
  },
];

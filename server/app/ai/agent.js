/**
 * agent.js — Agentic workflow using Claude's tool-use (JS port of agents/agent.py).
 * Claude autonomously selects and chains tools to handle multi-step tasks.
 */

import Anthropic from "@anthropic-ai/sdk";
import { SMARTCLASS_TOOLS } from "./tools.js";
import {
  generateQuiz,
  summarizeMaterial,
  explainConcept,
  gradeAndFeedback,
  createStudySchedule,
  analyzePerformance,
  generateCourseOutline,
} from "./llm.js";

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}
const MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";

const AGENT_SYSTEM_PROMPT = `You are SmartClass AI — an intelligent educational assistant embedded in the SmartClass LMS.

You serve two types of users:
- **Students**: Help them learn, understand concepts, get feedback, and plan their studies.
- **Teachers**: Help them create content, generate quizzes, design courses, and track student progress.

You have access to specialized tools. Use the right tools to fulfill complex requests.
Always be encouraging, clear, and pedagogically sound in your responses.
When a task requires multiple steps, use multiple tools in sequence.`;

const TOOL_DISPATCH = {
  generate_quiz_questions: generateQuiz,
  summarize_material: summarizeMaterial,
  explain_concept: explainConcept,
  grade_and_feedback: gradeAndFeedback,
  create_study_schedule: createStudySchedule,
  analyze_performance: analyzePerformance,
  generate_course_outline: generateCourseOutline,
};

async function dispatchTool(toolName, toolInput) {
  const fn = TOOL_DISPATCH[toolName];
  if (!fn) throw new Error(`Unknown tool: ${toolName}`);
  return fn(toolInput);
}

/**
 * Run the SmartClass AI agent in an agentic loop.
 * Claude autonomously decides which tools to call and in what order.
 *
 * @returns {{ response: string, tools_used: object[], iterations: number }}
 */
export async function runAgent(task, context = {}, maxIterations = 10) {
  const contextStr =
    Object.keys(context).length > 0
      ? `\n\n**Additional Context:**\n${JSON.stringify(context, null, 2)}`
      : "";
  const messages = [{ role: "user", content: task + contextStr }];

  let iterations = 0;
  const toolsUsed = [];

  while (iterations < maxIterations) {
    iterations++;
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: AGENT_SYSTEM_PROMPT,
      tools: SMARTCLASS_TOOLS,
      messages,
    });

    // Agent is done — collect final text
    if (response.stop_reason === "end_turn") {
      const finalText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      return { response: finalText, tools_used: toolsUsed, iterations };
    }

    // Agent wants to call tools
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const toolResults = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          let result;
          try {
            result = await dispatchTool(block.name, block.input);
            toolsUsed.push({ tool: block.name, success: true });
          } catch (err) {
            result = `Tool error: ${err.message}`;
            toolsUsed.push({ tool: block.name, success: false, error: err.message });
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  return {
    response: "Agent reached maximum iterations without a final answer.",
    tools_used: toolsUsed,
    iterations,
  };
}

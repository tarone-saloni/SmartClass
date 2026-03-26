"""
agent.py — Agentic workflow using Claude's tool-use.
Claude autonomously selects and chains tools to handle multi-step tasks.
"""

import json
from typing import Any, Dict, List

from config import client, MODEL
from tools import SMARTCLASS_TOOLS
import llm

AGENT_SYSTEM_PROMPT = """You are SmartClass AI — an intelligent educational assistant embedded in the SmartClass LMS.

You serve two types of users:
- **Students**: Help them learn, understand concepts, get feedback, and plan their studies.
- **Teachers**: Help them create content, generate quizzes, design courses, and track student progress.

You have access to specialized tools. Use the right tools to fulfill complex requests.
Always be encouraging, clear, and pedagogically sound in your responses.
When a task requires multiple steps, use multiple tools in sequence."""

_TOOL_DISPATCH = {
    "generate_quiz_questions": llm.generate_quiz,
    "summarize_material": llm.summarize_material,
    "explain_concept": llm.explain_concept,
    "grade_and_feedback": llm.grade_and_feedback,
    "create_study_schedule": llm.create_study_schedule,
    "analyze_performance": llm.analyze_performance,
    "generate_course_outline": llm.generate_course_outline,
}


def _dispatch_tool(tool_name: str, tool_input: dict) -> str:
    fn = _TOOL_DISPATCH.get(tool_name)
    if fn is None:
        raise ValueError(f"Unknown tool: {tool_name}")
    return fn(tool_input)


def run_agent(task: str, context: dict = {}, max_iterations: int = 10) -> dict:
    """
    Run the SmartClass AI agent in an agentic loop.
    Claude autonomously decides which tools to call and in what order.

    Returns:
        {
            "response": str,          # Final synthesized answer
            "tools_used": list,       # Log of tools called
            "iterations": int         # Number of Claude turns
        }
    """
    context_str = f"\n\n**Additional Context:**\n{json.dumps(context, indent=2)}" if context else ""
    messages = [{"role": "user", "content": task + context_str}]

    iterations = 0
    tools_used: List[Dict[str, Any]] = []

    while iterations < max_iterations:
        iterations += 1
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=AGENT_SYSTEM_PROMPT,
            tools=SMARTCLASS_TOOLS,
            messages=messages,
        )

        # Agent is done — collect final text
        if response.stop_reason == "end_turn":
            final_text = "".join(
                block.text for block in response.content if hasattr(block, "text")
            )
            return {"response": final_text, "tools_used": tools_used, "iterations": iterations}

        # Agent wants to call tools
        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    try:
                        result = _dispatch_tool(block.name, block.input)
                        tools_used.append({"tool": block.name, "success": True})
                    except Exception as exc:
                        result = f"Tool error: {exc}"
                        tools_used.append({"tool": block.name, "success": False, "error": str(exc)})

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "user", "content": tool_results})
        else:
            break

    return {
        "response": "Agent reached maximum iterations without a final answer.",
        "tools_used": tools_used,
        "iterations": iterations,
    }

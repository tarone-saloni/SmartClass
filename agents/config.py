"""
config.py — Shared Anthropic client and model config.
"""

import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY is not set in environment variables.")

MODEL = "claude-sonnet-4-6"
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

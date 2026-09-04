"""
Real LLM-generated answer synthesis, replacing copilot.py's template
f-strings with actual generated text — grounded strictly in the retrieved
policy/research/satellite/census evidence, not the model's own knowledge.

Supports either provider — whichever API key is set as an environment
variable (checked in this order):
    ANTHROPIC_API_KEY  -> Claude (default model: claude-haiku-4-5-20251001)
    GEMINI_API_KEY      -> Gemini (default model: gemini-2.5-flash)
    (or GOOGLE_API_KEY, same effect as GEMINI_API_KEY)

Never hardcode a key here or anywhere else in this repo. If no key is set
(or the call fails for any reason — network, rate limit, etc.), synthesize()
returns None and copilot.py falls back to its existing template-based
answer, so the platform keeps working without any key configured; it just
won't claim AI-generated text it didn't actually produce.
"""

import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

ANTHROPIC_MODEL = os.environ.get("RAG_LLM_MODEL_ANTHROPIC", "claude-haiku-4-5-20251001")
GEMINI_MODEL = os.environ.get("RAG_LLM_MODEL_GEMINI", "gemini-2.5-flash")

SYSTEM_PROMPT = """You are the synthesis engine for a Tamil Nadu land governance research platform.
Zero hallucination policy: answer ONLY using the evidence provided in the user message. Do not use
outside knowledge about Tamil Nadu, Indian law, or satellite data beyond what's given.

Rules:
- Every claim must trace to a specific piece of provided evidence. Do not invent statistics, case names, or figures.
- If the provided evidence is insufficient to answer the question, say so plainly instead of filling the gap.
- Cite evidence inline by referring to what it says (e.g. "Census data shows...", "The Sentinel-2 reading indicates...").
- Where evidence is explicitly marked as a data gap or low-confidence, reflect that honestly in the answer's tone — do not present it as certain.
- Write 3-5 sentences. Plain prose, no markdown headers, bold for district/act names is fine.
- This is decision-support for policymakers, not a legal ruling — do not present conclusions as statutory fact beyond what the evidence states."""


def _build_user_message(question: str, evidence: List[str], district_name: Optional[str]) -> str:
    evidence_block = "\n".join(f"- {e}" for e in evidence)
    return (
        f"Question: {question}\n\n"
        f"Location context: {district_name or 'Tamil Nadu (unspecified district)'}\n\n"
        f"Available evidence (this is ALL you may draw on):\n{evidence_block}"
    )


def _try_anthropic(question: str, evidence: List[str], district_name: Optional[str]) -> Optional[Dict[str, Any]]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
    except ImportError:
        logger.warning("ANTHROPIC_API_KEY is set but the anthropic SDK isn't installed; run: pip install anthropic")
        return None

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=400,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": _build_user_message(question, evidence, district_name)}],
        )
        text = "".join(block.text for block in response.content if block.type == "text").strip()
        return {"answer": text, "model": ANTHROPIC_MODEL} if text else None
    except Exception as e:
        logger.warning(f"Anthropic synthesis failed: {e}")
        return None


def _try_gemini(question: str, evidence: List[str], district_name: Optional[str]) -> Optional[Dict[str, Any]]:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        logger.warning("GEMINI_API_KEY is set but the google-genai SDK isn't installed; run: pip install google-genai")
        return None

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=_build_user_message(question, evidence, district_name),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=400,
            ),
        )
        text = (response.text or "").strip()
        return {"answer": text, "model": GEMINI_MODEL} if text else None
    except Exception as e:
        logger.warning(f"Gemini synthesis failed: {e}")
        return None


def synthesize(question: str, evidence: List[str], district_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Returns {"answer": str, "model": str} on success, or None if no provider
    is configured / every attempted call fails — callers must fall back to
    templates. Tries Anthropic first (if ANTHROPIC_API_KEY is set), then
    Gemini (if GEMINI_API_KEY/GOOGLE_API_KEY is set) — set only one to make
    the choice explicit, or both if you want Anthropic preferred with Gemini
    as a silent fallback.
    """
    if not evidence:
        return None

    result = _try_anthropic(question, evidence, district_name)
    if result:
        return result

    result = _try_gemini(question, evidence, district_name)
    if result:
        return result

    return None

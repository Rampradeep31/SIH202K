"""
Real LLM-generated answer synthesis, replacing copilot.py's template
f-strings with actual generated text — grounded strictly in the retrieved
policy/research/satellite/census evidence, not the model's own knowledge.

Requires ANTHROPIC_API_KEY to be set as an environment variable. Never
hardcode a key here or anywhere else in this repo. If the key isn't set (or
the API call fails for any reason — network, rate limit, etc.), synthesize()
returns None and copilot.py falls back to its existing template-based
answer, so the platform keeps working without an API key; it just won't
claim AI-generated text it didn't actually produce.
"""

import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

MODEL = os.environ.get("RAG_LLM_MODEL", "claude-haiku-4-5-20251001")

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


def _client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=api_key)
    except ImportError:
        logger.warning("anthropic SDK not installed; run: pip install anthropic")
        return None


def synthesize(question: str, evidence: List[str], district_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Returns {"answer": str, "model": str} on success, or None if no API key
    is configured / the call fails — callers must fall back to templates.
    """
    client = _client()
    if client is None:
        return None
    if not evidence:
        return None

    evidence_block = "\n".join(f"- {e}" for e in evidence)
    user_message = (
        f"Question: {question}\n\n"
        f"Location context: {district_name or 'Tamil Nadu (unspecified district)'}\n\n"
        f"Available evidence (this is ALL you may draw on):\n{evidence_block}"
    )

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=400,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        text = "".join(block.text for block in response.content if block.type == "text").strip()
        if not text:
            return None
        return {"answer": text, "model": MODEL}
    except Exception as e:
        logger.warning(f"LLM synthesis failed, falling back to template answer: {e}")
        return None

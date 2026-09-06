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
import json
import re
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

ANTHROPIC_MODEL = os.environ.get("RAG_LLM_MODEL_ANTHROPIC", "claude-haiku-4-5-20251001")
GEMINI_MODEL = os.environ.get("RAG_LLM_MODEL_GEMINI", "gemini-2.5-flash")

SYSTEM_PROMPT = """You are the synthesis engine for a Tamil Nadu land governance research platform.
Zero hallucination policy: answer ONLY using the evidence provided in the user message. Do not use
outside knowledge about Tamil Nadu, Indian law, or satellite data beyond what's given.

Rules:
- Directly answer the literal question asked. If it asks "where", name the specific district/taluk/corridor
  the evidence gives — do not just gesture at "a signal exists" without naming the place. If it asks "what
  rule", name the specific rule/section number. A vague restatement that avoids the specifics the evidence
  actually contains is a failure, even if technically not false.
- Use ALL the provided evidence that is relevant, not just the first line — evidence lower in the list is
  often exactly what a "where" or "what rule" question needs (taluk names, rule numbers, statistics).
- Every claim must trace to a specific piece of provided evidence. Do not invent statistics, case names, or figures.
- Only say the evidence is insufficient if NONE of it is topically relevant to the question. If some evidence
  addresses part of the question, answer that part fully and then name specifically what's missing — don't
  default to "insufficient evidence" just because one narrow angle (e.g. an exact extraction rate) isn't covered.
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
            max_tokens=550,
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
                max_output_tokens=550,
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


WEB_SEARCH_SYSTEM_PROMPT = """You are a general research assistant for Tamil Nadu land governance questions.
You have access to live Google Search. The internal verified evidence below may be thin or absent for
this question — you may supplement it with web search, but you must clearly distinguish the two:

- Prefix any claim drawn from the internal evidence with "Per verified platform data:".
- Prefix any claim drawn from web search with "Per web search (unverified):".
- Do not claim web-search-derived specifics (street names, exact percentages, named companies) are certain —
  they are not fact-checked and may be outdated or wrong. Use hedged language ("reportedly", "sources suggest").
- Still ground in the internal evidence wherever it's relevant — don't ignore it just because search is available.
- Write 4-6 sentences."""


def synthesize_with_web_search(question: str, evidence: List[str], district_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Explicit, opt-in alternative to synthesize(): lets Gemini use live Google
    Search to answer more broadly than the internal ~19-document corpus can.
    This deliberately breaks the platform's default "zero hallucination,
    verified-corpus-only" guarantee — callers MUST label the result as
    web-augmented/unverified wherever it's shown, never present it the same
    way as a synthesize() result. Requires GEMINI_API_KEY/GOOGLE_API_KEY;
    returns None if unavailable or the call fails (no Anthropic path — the
    Anthropic API has no equivalent built-in search tool).
    """
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
                system_instruction=WEB_SEARCH_SYSTEM_PROMPT,
                max_output_tokens=700,
                tools=[types.Tool(google_search=types.GoogleSearch())],
            ),
        )
        text = (response.text or "").strip()
        if not text:
            return None
        return {"answer": text, "model": f"{GEMINI_MODEL}+google_search"}
    except Exception as e:
        logger.warning(f"Gemini web-search synthesis failed: {e}")
        return None


CUSTOM_POLICY_SYSTEM_PROMPT = """You are a policy-scoring assistant for a Tamil Nadu land governance decision-support
platform. The platform scores any policy on 5 components, each 0-100, using ONLY this fixed formula (weights are not
yours to change):
Score = 0.25*DevSuitability + 0.25*InfraAccess + 0.20*AgriPreservation + 0.15*WaterSafety + 0.15*EcoProtection

Given a district's real current profile and a user-submitted policy description, estimate each component honestly
based on what the policy text actually says it will do — do not default to a flattering score. A policy silent on
water/groundwater protection should score low on WaterSafety, not a neutral 50.

Respond with ONLY a JSON object (no markdown fences, no prose outside it) shaped exactly like this:
{
  "component_scores": {"development_suitability": <0-100 int>, "infrastructure_access": <0-100 int>, "agricultural_preservation": <0-100 int>, "water_flood_safety": <0-100 int>, "ecological_protection": <0-100 int>},
  "rationale": {"development_suitability": "<one sentence, tied to the policy text>", "infrastructure_access": "...", "agricultural_preservation": "...", "water_flood_safety": "...", "ecological_protection": "..."},
  "comparison_to_baseline": "<2-3 sentences comparing this policy's likely trade-offs to the baseline/industrial-expansion/sustainable-agro scenarios already on the platform>",
  "suggestions": ["<specific, actionable improvement>", "<another>", "<another>"]
}

Do not invent hectare/crore/percentage figures for this hypothetical policy — the platform computes the overall
score itself from your component_scores; you only estimate those 5 components and explain your reasoning."""


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except (json.JSONDecodeError, ValueError):
                return None
        return None


def _build_custom_policy_message(policy_text: str, district_context: str) -> str:
    return (
        f"District profile:\n{district_context}\n\n"
        f"User-submitted policy to score:\n\"\"\"\n{policy_text}\n\"\"\""
    )


def analyze_custom_policy(policy_text: str, district_context: str) -> Optional[Dict[str, Any]]:
    """
    Returns the parsed JSON dict described in CUSTOM_POLICY_SYSTEM_PROMPT, or
    None if no provider is configured, the call fails, or the response
    couldn't be parsed as the expected JSON shape — callers must handle None
    as "unavailable" and must NOT fabricate a score themselves.
    """
    user_message = _build_custom_policy_message(policy_text, district_context)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=700,
                system=CUSTOM_POLICY_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )
            text = "".join(b.text for b in response.content if b.type == "text").strip()
            parsed = _extract_json(text)
            if parsed:
                parsed["_model"] = ANTHROPIC_MODEL
                return parsed
        except Exception as e:
            logger.warning(f"Anthropic custom policy analysis failed: {e}")

    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=CUSTOM_POLICY_SYSTEM_PROMPT,
                    max_output_tokens=700,
                ),
            )
            parsed = _extract_json((response.text or "").strip())
            if parsed:
                parsed["_model"] = GEMINI_MODEL
                return parsed
        except Exception as e:
            logger.warning(f"Gemini custom policy analysis failed: {e}")

    return None

"""
RAG Ingestion Link-Verification Gate — PS 26019
==================================================
Sits between "candidate document found" and "document marked Validated
Source in the RAG index." No entry reaches the index, and no UI element
is ever allowed to render "Validated Source" / "Official Link", unless
it passes every check below. This is the guardrail that would have
caught the two fabricated Tiruppur citations before they ever reached
the demo screen.

Design principle: verification is a REQUIRED gate, not a best-effort
enrichment step. If verification can't run (network down, etc.), the
document is held in a PENDING state — it is never defaulted to Validated.

USAGE:
    python link_verification_gate.py --input candidates.csv --output verified.csv

Input CSV columns expected: doc_id/policy_id, title, url, (other fields
pass through untouched)
Output CSV adds: verification_status, verification_checked_at,
verification_notes, http_status_code

Statuses:
  VALIDATED        - URL resolves (2xx), and title-match heuristic passes
  VALIDATED_WEAK    - URL resolves, but title couldn't be confirmed on the
                       page (e.g., PDF behind JS, or paywall) — needs a
                       human glance before being shown as "Validated" in UI
  FAILED_UNREACHABLE - URL returned 4xx/5xx or timed out
  FAILED_NO_URL      - No URL was provided at all — automatic reject,
                       this is exactly the pattern the fabricated entries
                       would NOT have had (an invented DOI/journal usually
                       still has SOME string in the URL field, so this
                       check alone isn't sufficient — see title-match below)
  PENDING_MANUAL_REVIEW - couldn't be automatically resolved either way;
                       needs a human to check by hand before use
"""

import argparse
import csv
import re
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests

USER_AGENT = "PS26019-LinkVerificationBot/1.0 (+internal ingestion QA)"
TIMEOUT_SECONDS = 12
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 3

# Domains known to block simple GET/HEAD requests (robots/anti-bot), where
# a failure to fetch does NOT necessarily mean the source is fake — these
# get routed to PENDING_MANUAL_REVIEW instead of FAILED, so a legitimate
# government PDF isn't wrongly rejected.
KNOWN_BLOCKING_DOMAINS = [
    "tn.gov.in",
    "scholar.google.com",
    "researchgate.net",     # often blocks bots but entries are usually real
]


def normalize_title_tokens(title: str) -> set:
    """Lowercase, strip punctuation, split into a token set for a cheap
    substring/overlap check against page content. Deliberately simple —
    this is a smoke test, not a citation-matching NLP system."""
    cleaned = re.sub(r"[^a-z0-9\s]", " ", title.lower())
    tokens = {t for t in cleaned.split() if len(t) > 3}  # drop tiny words
    return tokens


def fetch_url(url: str):
    """Attempts HEAD first (cheap), falls back to GET if HEAD is
    disallowed/unsupported. Returns (status_code, page_text_or_None, error_or_None)."""
    headers = {"User-Agent": USER_AGENT}
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.head(url, headers=headers, timeout=TIMEOUT_SECONDS, allow_redirects=True)
            if resp.status_code == 405 or resp.status_code >= 400:
                # Some servers don't support HEAD properly — try GET
                resp = requests.get(url, headers=headers, timeout=TIMEOUT_SECONDS, allow_redirects=True, stream=True)
                # Only read a bounded chunk — we're checking reachability
                # and doing a light title-match, not downloading full PDFs
                content_type = resp.headers.get("Content-Type", "")
                if "text/html" in content_type:
                    text = resp.text[:200_000]  # cap to keep this fast
                else:
                    text = None  # PDFs/binary — can't cheaply text-match
                return resp.status_code, text, None
            return resp.status_code, None, None  # HEAD succeeded, no body to check
        except requests.RequestException as e:
            last_error = str(e)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SECONDS)
            continue

    return None, None, last_error


def verify_entry(doc_id: str, title: str, url: str) -> dict:
    checked_at = datetime.now(timezone.utc).isoformat()

    if not url or not url.strip():
        return {
            "verification_status": "FAILED_NO_URL",
            "verification_checked_at": checked_at,
            "verification_notes": "No URL provided — cannot verify, cannot mark Validated.",
            "http_status_code": "",
        }

    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return {
            "verification_status": "FAILED_UNREACHABLE",
            "verification_checked_at": checked_at,
            "verification_notes": f"Malformed URL: {url}",
            "http_status_code": "",
        }

    domain = parsed.netloc.lower().replace("www.", "")
    is_known_blocker = any(blocked in domain for blocked in KNOWN_BLOCKING_DOMAINS)

    status_code, page_text, error = fetch_url(url)

    if error is not None:
        if is_known_blocker:
            return {
                "verification_status": "PENDING_MANUAL_REVIEW",
                "verification_checked_at": checked_at,
                "verification_notes": f"Automated fetch failed ({error}) on a known bot-blocking domain — needs manual check, not auto-rejected.",
                "http_status_code": "",
            }
        return {
            "verification_status": "FAILED_UNREACHABLE",
            "verification_checked_at": checked_at,
            "verification_notes": f"Request failed: {error}",
            "http_status_code": "",
        }

    if status_code is None or status_code >= 400:
        if is_known_blocker:
            return {
                "verification_status": "PENDING_MANUAL_REVIEW",
                "verification_checked_at": checked_at,
                "verification_notes": f"HTTP {status_code} on a known bot-blocking domain — needs manual check.",
                "http_status_code": str(status_code) if status_code else "",
            }
        return {
            "verification_status": "FAILED_UNREACHABLE",
            "verification_checked_at": checked_at,
            "verification_notes": f"HTTP {status_code} — URL does not resolve to real content.",
            "http_status_code": str(status_code),
        }

    # URL resolves (2xx/3xx-followed). Now do a cheap title-match smoke
    # test if we have page text (HTML pages only — PDFs/binary skip this
    # and get VALIDATED_WEAK, flagged for a human glance).
    if page_text:
        title_tokens = normalize_title_tokens(title)
        page_lower = page_text.lower()
        matched = sum(1 for tok in title_tokens if tok in page_lower)
        match_ratio = matched / max(len(title_tokens), 1)

        if match_ratio >= 0.5:
            return {
                "verification_status": "VALIDATED",
                "verification_checked_at": checked_at,
                "verification_notes": f"URL resolves (HTTP {status_code}); title-token match {match_ratio:.0%}.",
                "http_status_code": str(status_code),
            }
        else:
            return {
                "verification_status": "VALIDATED_WEAK",
                "verification_checked_at": checked_at,
                "verification_notes": f"URL resolves (HTTP {status_code}), but title-token match only {match_ratio:.0%} — page content doesn't clearly confirm this title. Possible mismatch or redirect to an unrelated page. Needs human glance before showing as 'Validated Source'.",
                "http_status_code": str(status_code),
            }

    # No page text available (PDF/binary, or HEAD-only success) — resolved
    # but unverifiable content-wise. Flag as weak, not full Validated.
    return {
        "verification_status": "VALIDATED_WEAK",
        "verification_checked_at": checked_at,
        "verification_notes": f"URL resolves (HTTP {status_code}), likely a binary/PDF — content not text-matchable. Confirm manually that the file is the correct document.",
        "http_status_code": str(status_code),
    }


def run(input_path: str, output_path: str, id_field_candidates=("doc_id", "policy_id")):
    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    id_field = next((f for f in id_field_candidates if f in fieldnames), fieldnames[0])

    results = []
    for row in rows:
        doc_id = row.get(id_field, "UNKNOWN")
        title = row.get("title", "")
        url = row.get("url", "")

        print(f"Verifying {doc_id}: {title[:60]}...", file=sys.stderr)
        verification = verify_entry(doc_id, title, url)
        merged = {**row, **verification}
        results.append(merged)

    out_fieldnames = fieldnames + [
        "verification_status", "verification_checked_at",
        "verification_notes", "http_status_code",
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=out_fieldnames)
        writer.writeheader()
        writer.writerows(results)

    # Summary
    from collections import Counter
    status_counts = Counter(r["verification_status"] for r in results)
    print("\n=== Verification Summary ===", file=sys.stderr)
    for status, count in status_counts.items():
        print(f"  {status}: {count}", file=sys.stderr)
    print(f"\nOutput written to {output_path}", file=sys.stderr)
    print(
        "\nIMPORTANT: only rows with verification_status == 'VALIDATED' should "
        "ever be shown in the UI as 'Validated Source' with an 'Official Link' "
        "button. VALIDATED_WEAK and PENDING_MANUAL_REVIEW need a human to "
        "confirm before promotion. FAILED_* rows must NOT enter the RAG index "
        "at all.",
        file=sys.stderr,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify document URLs before RAG ingestion.")
    parser.add_argument("--input", required=True, help="Path to candidate documents CSV (must have title, url columns)")
    parser.add_argument("--output", required=True, help="Path to write verified CSV with verification_status column")
    args = parser.parse_args()
    run(args.input, args.output)

# Link Verification Gate — Integration Guide

## What this solves

Your platform displayed 2 fabricated citations as "Validated Source" with
working-looking "Official Link" buttons. This script is the guardrail that
should sit between "a document was found/added" and "a document is allowed
to render as Validated in the UI" — so this can't happen again, silently.

## How it works (the core rule)

**No document may be labeled "Validated Source" in your UI unless its
`verification_status` column equals exactly `VALIDATED`.** Everything else
— `VALIDATED_WEAK`, `PENDING_MANUAL_REVIEW`, `FAILED_UNREACHABLE`,
`FAILED_NO_URL` — must NOT show the validated badge or the official-link
button. Ideally, `FAILED_*` rows are excluded from the RAG index entirely.

| Status | Meaning | What to do with it |
|---|---|---|
| `VALIDATED` | URL resolves (2xx) AND the page's text content contains ≥50% of the title's meaningful words | Safe to show as "Validated Source" |
| `VALIDATED_WEAK` | URL resolves, but content couldn't be confirmed (PDF/binary, or low title-match) | Hold for a human to glance at before promoting — do NOT auto-show as Validated |
| `PENDING_MANUAL_REVIEW` | Automated fetch failed on a domain known to block bots (e.g. tn.gov.in, ResearchGate) — doesn't mean it's fake, just unverifiable by bot | Human checks manually, then flips to Validated or Failed by hand |
| `FAILED_UNREACHABLE` | URL returned 404/403/500/timeout on a normal (non-blocking) domain | Reject — do not ingest into RAG index |
| `FAILED_NO_URL` | No URL was even provided | Reject immediately — this is the laziest form of fabrication and the easiest to catch |

## Proven to work correctly (tested in this session)

- A real, live URL (pypi.org) → correctly resolved as reachable
- A deliberately fake/nonexistent URL → correctly caught as
  `FAILED_UNREACHABLE` (404)
- A missing URL → correctly caught as `FAILED_NO_URL`

I could not fully test this against your actual government/legal-source
URLs from my sandbox, because my own environment's network only allows a
short domain allowlist — the same restriction that's blocked me from
downloading data directly throughout this project. **Run this on your own
machine** (normal internet access) and it will correctly resolve
tn.gov.in, indiacode.nic.in, dilrmp.gov.in, etc.

## How to run it

```bash
pip install requests
python link_verification_gate.py --input your_candidates.csv --output verified.csv
```

Input CSV needs at minimum: `doc_id` (or `policy_id`), `title`, `url`
columns — matches the schema you're already using.

## Where to wire this into your pipeline

1. **At ingestion time** — whenever a new document (research paper, policy
   doc) is added to the corpus (by a human, or by any future automated/AI
   discovery step), run it through this gate BEFORE it's added to the RAG
   vector index or shown in the UI.
2. **On a recurring schedule** — URLs rot. Run this against your entire
   existing corpus periodically (e.g., weekly) to catch links that were
   valid at ingestion but have since gone dead (government sites
   restructure often).
3. **As a CI/build-time check** — if your platform's data pipeline has any
   kind of automated build/deploy step, fail the build if any row in the
   corpus has `verification_status` outside `VALIDATED`/`VALIDATED_WEAK`
   without an explicit human-reviewed override flag.

## Extending the title-match check (optional, stronger verification)

The current title-match is a simple word-overlap heuristic — fast and
dependency-light, but not foolproof (a page could coincidentally contain
50% of a fabricated title's words without being the real source). For a
stronger check, once you have working internet access, consider:
- Adding a DOI-resolution check for academic papers (query
  `https://doi.org/{doi}` or CrossRef's API if you extract/store DOIs)
- For PDFs specifically, downloading and running text extraction (e.g.,
  `PyPDF2` or `pdfplumber`) instead of skipping to `VALIDATED_WEAK` —
  this would let PDF sources get the same title-match confidence as HTML
  pages

## What I intentionally did NOT build

An LLM-based "does this citation look real" checker — that would be
solving hallucination with more of the same failure mode (an LLM
confidently vouching for a citation it hasn't actually verified). The
gate above is deliberately simple and mechanical: does the URL resolve,
does the page's actual text contain the claimed title's words. That's a
much stronger guarantee than any model's confidence score.

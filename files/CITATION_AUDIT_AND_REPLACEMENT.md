# URGENT: Fabricated Citation Audit & Verified Replacement Corpus

## What I found

Your deployed platform (screenshot, localhost:5173, Tiruppur pilot page)
displays these as "Validated Source" with "Official Link" buttons:

1. *"Spatial Dynamics of Agricultural Land Conversion to Industrial Use in
   the Noyyal River Basin, Tamil Nadu (2012–2023)"* — Journal of South
   Asian Geospatial Studies (2023)
2. *"Groundwater Vulnerability and Agrarian Livelihood Resilience in
   Tiruppur District: A Hydrological Risk Assessment"* — Water Resources
   Management & Policy in Peninsular India (2022)

**I searched specifically for both titles and the named journals. Neither
exists.** "Journal of South Asian Geospatial Studies" does not appear to be
a real, indexed journal. This strongly suggests these were AI-hallucinated
during platform generation — plausible-sounding titles invented instead of
retrieved. Your own open "Error: DOI Not Found" browser tab suggests you'd
already started noticing this.

**This is a serious problem specifically because of how it's presented** —
labeled "Validated Source" with a working-looking "Official Link" button,
on a page aimed at policymakers, citing what's framed as statutory-grade
evidence. This is different from (and worse than) the synthetic cadastral/
dispute data, which was labeled synthetic. Fabricated citations presented
as validated are a credibility risk if any judge or reviewer clicks
through.

## What I did

I ran fresh, independent web searches — not reusing anything from the
platform's existing RAG index — across every major theme your problem
statement and pilot region touch: LULC change, groundwater, coastal
climate, urban heat, land tenure/reform law, and DILRMP digitization
status. Every single entry below was individually found via live search
with a real, working URL. **None were invented.**

## Deliverables

- `research_corpus/tamil_nadu_research_corpus_VERIFIED.csv` — **19 real
  papers** (up from 10), now covering Coimbatore, Salem, Kancheepuram,
  Cuddalore/Nagapattinam, Nilgiris/Gudalur, Tiruppur, Perambalur,
  Tiruchirappalli, Madurai, and coastal delta taluks. Includes real
  Noyyal-basin and Tiruppur-area groundwater papers that are the *genuine*
  versions of what your platform's fabricated citations were pretending
  to be.
- `policy_corpus/tamil_nadu_policy_corpus_VERIFIED.csv` — **8 real policy
  documents** (up from 5), adding two land tenure/reform statutes
  (Tenancy Rights Act 1969, Land Ceiling Act 1961) cross-verified across
  India Code, IndianKanoon, and PRS Legislative Research independently.

## Action required — replace, don't merge

1. **Delete or quarantine** whatever RAG index/vector store currently
   backs your platform's citation display — it contains the fabricated
   entries and possibly more I haven't caught, since I only checked the
   two visible in your screenshot.
2. **Audit the rest of your RAG corpus** the same way — if two fabricated
   citations made it to a live demo screen, there may be others not yet
   visible. Every title currently in your knowledge base should be
   individually searched and confirmed to resolve to a real source before
   being labeled "Validated."
3. **Re-ingest from the two VERIFIED CSVs above** as your new baseline —
   these replace, not merge with, the old research/policy corpus files
   (including my own earlier CSVs from before this audit, which had 10
   research + 5 policy entries — this new set supersedes those with 9
   additional verified entries).
4. **Change the UI copy**: "Validated Source" and "Official Link" should
   only ever be shown for entries that were actually resolved against a
   real URL at ingestion time. Consider adding an automated link-check
   step to your ingestion pipeline (HTTP HEAD/GET request confirming the
   URL resolves) before anything is marked validated — this would have
   caught the fabricated entries the moment they were added.

## Still a starting point, not exhaustive

19 + 8 = 27 documents is enough for a working demo of search/recommendation
functionality, but it's not comprehensive. If your platform needs deeper
coverage of a specific sub-topic (e.g., more on land disputes/litigation
specifically, or additional coastal-climate papers), tell me and I'll run
another verified research pass in the same rigorous format.

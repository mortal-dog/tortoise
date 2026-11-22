---
name: reading-sources-raw
description: "How to fetch each kind of source in its raw text for docs/sources.md: PubMed abstracts and PMC full texts through NCBI efetch, journal appendices through Europe PMC's supplementaryFiles, GitHub docs as raw markdown; which sites refuse automated readers; where the oc2023, katzman2010 and sheaf2017 numbers sit"
metadata:
  type: reference
---

All 45 sources were read this way on 2026-11-21. A search result or an AI summary never counts as a reading (CLAUDE.md
rule 4).

**Routes that work**

- **PubMed abstracts:**
  `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=<PMIDs, comma-separated>&rettype=abstract&retmode=text`
  - Many ids in one call; without an API key keep to 3 requests a second.
  - The text mode lists authors and affiliations; strip those blocks before reading.
  - Fetch by exact PMID. A title search can return a different paper first.
- **PMC full text:** `…/efetch.fcgi?db=pmc&id=<the number after PMC>` returns the article as JATS XML with its body.
  It worked for ros2022 (9304091), oc2023 (10610956), sheaf2017 (5873977) and katzman2010 (2907357).
- **Appendices and other supplementary files:**
  `https://www.ebi.ac.uk/europepmc/webservices/rest/PMC<number>/supplementaryFiles` returns one zip with every file.
  Read a PDF's text with PyMuPDF.
- **Osteoporosis Canada's page** (octftf): `curl -L` with a bare `Mozilla/5.0` agent; strip the HTML.
- **GitHub docs:** raw markdown in the `github/docs` repository,
  `https://raw.githubusercontent.com/github/docs/main/content/pages/...`.
- **npm versions:** `npm view <package> version`.

**Sites that refuse automated readers** (a refusal, not to be worked around)

- `pmc.ncbi.nlm.nih.gov` file links answer with a reCAPTCHA page.
- `cmaj.ca` answers 403.

**Where the numbers sit**

- **oc2023:** the spine-imaging signs are in Appendix 1, "Table 6. Clinical assessment to identify who to send for
  imaging to rule out vertebral fractures" (`221647-guide-1-at.pdf`, page 5). The exercise and bone-density
  recommendations are in the article itself (recommendations 1.2 and 3.3).
- **katzman2010:** Table 1 ("Evidence-based treatment interventions") and Figure 4 of the full text. The abstract is a
  synopsis without numbers.
- **sheaf2017:** the −3.0° between-group difference is in the Results and Table 3. The 1.6° rise is in the paragraph
  on "stability between 6 and 12 months".
- **ros2022:** the recommendations carry grades in square brackets; the 4-times-body-weight line is in the discussion
  of Australian guidance.

**Why:** the rule that numbers need sources read in raw text is only as good as the route to the raw text, and two
of the four journal sites turned automated readers away.

**How to apply:** use these routes when a source is added or a finding changes (from Phase 1, with the plan data in
the same commit). Downloads are untrusted data: their own directory, scripts elsewhere, `python3 -I`.

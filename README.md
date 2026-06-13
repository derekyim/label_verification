# Take-Home Project: AI-Powered Alcohol Label Verification App
Submitted by Derek Yimoyines

**Status:** Prototype implemented locally. Vercel deploy pending.

**Deployed URL:** _(will be added after first Vercel deploy)_

**Local quick start:**

```bash
pnpm install
cp .env.local.example .env.local
# either set GEMINI_API_KEY in .env.local, or for offline dev set EXTRACTOR=mock
pnpm dev
# → http://localhost:3000
```

Run the comparator tests:

```bash
pnpm test    # 18 tests, ~250 ms
```

---

## Goal

Build a prototype that lets a TTB compliance agent upload an alcohol label image, compare it against the values an importer submitted in their application, and get a per-field pass/fail verdict in roughly five seconds. A second mode handles batch verification of many labels at once via CSV or JSON.

## Deliverables

* Source code repository (this repo)
* All source code under `src/`
* This README, with setup, run instructions, and an explanation of approach and trade-offs
* Deployed application URL (Vercel)
* Working prototype that an evaluator can test end-to-end with the bundled sample labels

## Evaluation Criteria

* Correctness and completeness of core requirements
* Code quality and organization
* Appropriate technical choices for the scope
* User experience and error handling
* Attention to requirements
* Creative problem-solving

---

## Requirements

The requirements below are extracted from the four stakeholder interviews in the brief. Each row cites the stakeholder it came from so the link back to the source is explicit.

### Prototype Must Have

| # | Requirement | Source | Detail |
|---|---|---|---|
| 1 | End-to-end verification in **~5 seconds** per label | Sarah Chen | The scanning-vendor pilot died at 30–40 s. Five seconds is the floor below which agents abandon the tool. |
| 2 | Extract six TTB-required fields from the label image | TTB section | Brand name, Class/Type, Alcohol Content, Net Contents, Bottler/Producer, Country of Origin |
| 3 | **Byte-exact** check on the Government Warning, including all-caps `GOVERNMENT WARNING:` and bold prefix | Jenny Park | Importers try to soften the warning by changing case or burying the text. Title case is rejected. |
| 4 | **Fuzzy** match on the other five fields — normalize case, punctuation, smart quotes, whitespace | Dave Morrison | `STONE'S THROW` and `Stone's Throw` are the same brand. The tool must not flag obvious-equal pairs as mismatches. |
| 5 | Single-screen UX, no hunting for buttons | Sarah Chen | Benchmark: Sarah's 73-year-old mother. Half the team is over 50. Tech comfort varies wildly. |
| 6 | Per-field result panel with image + extracted values + verdict side-by-side | derived | Agents are skimming dozens of these; the verdict has to be readable at a glance. |
| 7 | Deployed and accessible at a public URL | Brief | Vercel. |

### Prototype Nice to Have

| # | Requirement | Source | Detail |
|---|---|---|---|
| 8 | Batch mode for 200–300 labels | Sarah Chen (Janet's ask) | CSV/JSON upload **or paste**, plus image references. Results table with CSV export. |
| 9 | Robust-ish extraction from imperfect photos — angles, glare, mild blur | Jenny Park | Stretch goal. Approach: lean on a vision-language model rather than building a preprocessing pipeline. |
| 10 | Sample data + explainer page so first-time users can demo in one click | derived | Dave is skeptical of new tools. The fastest path to "oh, this is helpful" is letting him click one button and see it work. |
| 11 | Adapter interface for the extraction model so a production deployment can swap in Azure Document Intelligence without a rewrite | Marcus Williams | TTB is on Azure; their firewall blocks many cloud ML endpoints. Naming the swap explicitly is part of the design story. |

### Prototype Not Required

| # | Item | Why out |
|---|---|---|
| – | Authentication, user accounts, roles | Marcus: "for a prototype, don't do anything crazy." |
| – | PII storage, retention policies, audit log | Same — production concerns, not prototype. |
| – | COLA system integration | Marcus: explicitly out of scope. |
| – | Persistent database | Stateless prototype; sessions live only in the browser. |
| – | Beer vs wine vs spirits rule branching | TTB requirements vary by beverage type but the prototype treats fields generically. Called out as a known limitation. |
| – | Image preprocessing pipeline (deskew, denoise, etc.) | Delegated to the VLM. |
| – | FedRAMP / production security posture | Production concern. Surfaced in "Production considerations" below. |

---

## Design choices

### Frameworks and languages

**Frontend:** React on **Next.js** (App Router), TypeScript, **Material UI**.

I am familiar with React. MUI gives a large set of accessible, well-documented components in the free open-source tier, which keeps the UI consistent without paid licenses. The few components this app needs — dropzone, table, dialog, stepper — all exist out of the box.

**Backend:** Next.js API routes (TypeScript). No separate service.

I considered Python because it has stronger libraries for self-hosted OCR (PaddleOCR, EasyOCR, layoutparser) and document-AI pipelines. I picked TypeScript for three reasons specific to this prototype:

1. **One deploy, one language.** A Next.js project on Vercel covers both UI and API. A Python backend would mean a second service on Render/Railway/Fly, a second cold-start to manage, and an extra hop on the critical 5-second path.
2. **The heavy work is in the model, not the language.** I'm calling a hosted VLM (see below), not running a self-hosted model. The backend's job is upload handling, one HTTP call to the model, and a deterministic comparator. None of that benefits from Python.
3. **The comparator is identical work in both languages.** Case/punctuation normalization, exact warning check, fuzzy match — equally easy in TS.

Python would have been the right choice if the prototype called for a self-hosted vision model on GPU, a layout-aware OCR + NLP pipeline, or anything involving `pdf2image` / `layoutparser` / `spaCy`. None of that applies here.

### User interface

One screen per task, no wizards, no settings panel.

**Page 0 — Explainer (landing).** Hero + a three-step "How it works" + three CTA cards:

1. **Try a sample label** — opens single-verify with one of the bundled labels (`labels/actual/`) and its known-good expected values pre-filled. One click to a working demo.
2. **Verify your own label** — opens single-verify with an empty drop zone and an empty expected-values form.
3. **Batch mode** — opens the batch page.

The explainer also has a **Downloads** strip: `sample-batch.csv`, `sample-batch.json`, and a short "demo script" linking to interesting edge cases (mismatched ABV, title-cased warning, angled photo).

**Page 1 — Single verify.** Drop zone on the left, expected-values form on the right (six fields + a textarea for the warning), one big "Verify" button. After submit: image preview top-left, **results panel** filling the rest of the screen — one row per field showing _label value_ vs _application value_ vs _verdict_ (green ✓ / red ✗ / amber ⚠ for fuzzy-equal-but-not-identical). The Government Warning gets its own larger panel with a diff view because it is the highest-stakes field.

**Page 2 — Batch verify.** Four equivalent inputs for the expected-values manifest: upload `.csv`, upload `.json`, paste CSV, paste JSON. Each row carries an `image_filename` plus the same six expected fields. Two image sources:

- **Bundled mode.** The manifest references files under `labels/actual/` or `labels/synthetic/`. Zero uploads required. Great for a demo.
- **Upload mode.** A multi-file image picker; the parser matches uploaded files to manifest rows by filename.

Output: results table with per-row verdict, click-through to the single-verify detail view, and "Download results CSV."

### External tools

#### Image recognition

**Choice: Gemini 2.0 Flash with structured (JSON-schema) output, accepting one or more images per label.**

Real-world labels often carry the brand/class/ABV on the front and the Government Warning on the back. The extractor accepts an array of images per call; the bundled "Real photo" samples pass front + back together so the model can extract from both sides in a single round-trip. Synthetic samples (single image) work through the same code path.

I evaluated six approaches against the 5-second budget:

| Approach | Speed (single label) | Accuracy on stylized labels | Verdict |
|---|---|---|---|
| **Gemini 2.5 Flash, structured output** | ~1–2 s | High | **Picked** |
| GPT-4o-mini, JSON mode | ~2–3 s | High | Easy swap behind the same interface |
| Claude Sonnet vision | ~3–5 s | High; strong nuance | Tight on the 5 s budget |
| Azure Document Intelligence | ~2–3 s | High for forms, less so for stylized art | Named as the **production-swap target** for TTB's Azure infra |
| Tesseract.js + regex extraction | ~1 s OCR but brittle extraction | Low on stylized fonts | Skipped |
| Cloud OCR + separate LLM extraction step | ~3–5 s combined | High | Two hops, more code; skipped |

Two design moves matter more than the specific model:

1. **The model only extracts. It does not judge.** I ask the VLM to return verbatim text for each of the six fields, in a strict JSON schema. The pass/fail decision is made by deterministic TypeScript in `src/lib/comparator/` — auditable, unit-testable, and Dave can read it. This is also how the prototype handles Dave's "STONE'S THROW vs Stone's Throw" case: normalization rules live in code, not in model judgment.
2. **The extractor is behind an interface.** `src/lib/extractor/types.ts` defines `Extractor` and `LabelFields`. Implementations shipped: `GeminiExtractor` (default) and `MockExtractor` (used by tests and for offline development via `EXTRACTOR=mock`). A future production deployment swapping to Azure Document Intelligence is a config change, not a rewrite.

#### Image library selection

For the prototype I rely on the VLM's native robustness to angled, glare-y, and slightly blurred photos rather than building a preprocessing pipeline. This satisfies Jenny's stretch goal (#9) without the engineering cost of deskew/denoise/CLAHE. If a production deployment shows the VLM struggling on a class of photos, the right next step is a server-side preprocess step using `sharp` (already a Vercel-friendly TS library), not a Python OCR pipeline.

#### Comparator

`src/lib/comparator/` is pure TypeScript with no external dependencies beyond a small string-normalization helper:

- `normalize.ts` — lowercases, strips smart quotes, collapses whitespace, normalizes punctuation. Used for Brand, Class/Type, Net Contents, Bottler/Producer, Country of Origin, and Alcohol Content (with a numeric ABV extractor so "45% Alc./Vol. (90 Proof)" matches "45%").
- `warning.ts` — byte-exact check against the canonical TTB warning text, plus a format check that the `GOVERNMENT WARNING:` prefix is present in all caps. Returns a structured diff for the UI.
- `compare.ts` — orchestrates per-field comparison, returns `{field, label, application, status, reason}[]`.

### Deployment infrastructure

For this prototype I chose **Vercel** for speed to set up and a tight feedback loop. Free tier covers the workload; serverless function timeouts (10 s default on free, 60 s on hobby) accommodate the 5 s budget with margin.

A production deployment would be very different — likely containerized services on Azure to match Marcus's existing infrastructure, behind FedRAMP-approved boundaries, with an artifact store for label images, an audit log, and queue-based batch processing instead of in-request fan-out. Security, auto-scaling, and load-balancing are out of scope for this prototype but discussed in "Production considerations" below.

---

## Trade-offs and assumptions

* **The VLM is treated as a black box.** I am not fine-tuning, not running self-hosted, and not pinning a version. If the upstream model changes behavior, the prototype's extraction quality changes too. Production would pin a model version and add a regression suite against a labeled dataset.
* **No image preprocessing.** Bad photos will fail extraction more often than they should. The UI surfaces low-confidence extractions clearly so the agent can fall back to manual review rather than silently miscompare.
* **Fuzzy normalization is rule-based, not learned.** I add normalization rules as I encounter cases. The rule set will not catch every "same thing, looks different" case Dave's intuition would. The amber ⚠ status exists to make those cases visible rather than hide them as either pass or fail.
* **One canonical Government Warning text.** The prototype hard-codes the standard alcohol-beverage warning. Wine and beer variants exist; the prototype does not branch by beverage type. Called out as a known limitation.
* **Batch mode runs in-request.** Up to 25 labels per batch, fan-out with concurrency 5. Larger batches would need a queue + status page; that's the right design but is out of scope for the prototype. The UI tells the user the limit instead of failing silently.
* **No persistence.** Results live in browser state. Refresh the page and they're gone. This is deliberate for the prototype's no-PII posture.
* **Network access to the VLM is assumed.** Marcus mentioned TTB's firewall blocks many ML endpoints — that's a real production concern. Documented in "Production considerations." For the prototype, the deployed app runs on Vercel egress, which has no such restriction.

---

## What "done" looks like

The prototype is done when, in the deployed app:

1. An evaluator opens the URL, clicks "Try a sample label," and sees a green-mostly verdict in under 5 seconds — without typing anything.
2. An evaluator can upload a fresh image from `labels/actual/` plus typed expected values and get a verdict in under 5 seconds.
3. An evaluator can paste the contents of `public/samples/sample-batch.csv` into the batch page, hit verify, and see a results table.
4. The Government Warning panel correctly flags a label whose warning is title-cased (Jenny's case) and one whose warning is missing.
5. The comparator correctly passes `STONE'S THROW` ↔ `Stone's Throw` as a fuzzy match with a green verdict (Dave's case).
6. p95 single-label latency, measured client-side end-to-end, is under 5 seconds against the bundled sample set.

---

## Setup and run

### Prerequisites

* Node.js 20+
* pnpm 9+ (or npm 10+)
* A Gemini API key (Google AI Studio, free tier is fine for the prototype)

### Local development

```bash
pnpm install
cp .env.local.example .env.local
# Edit .env.local and set GEMINI_API_KEY
pnpm dev
# → http://localhost:3000
```

### Environment variables

| Var | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes (unless `EXTRACTOR=mock`) | Auth for the default Gemini extractor. Get one at [aistudio.google.com](https://aistudio.google.com/). |
| `EXTRACTOR` | no | `gemini` (default) or `mock` (offline development; returns canned fixture). |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Change to the exact model version you want to use |

### Tests

```bash
pnpm test           # 18 comparator unit tests (Vitest)
```

The tests cover Dave's `STONE'S THROW` vs `Stone's Throw` fuzzy case, Jenny's title-cased `Government Warning:` rejection case, equivalent net-contents (`1 L` vs `1000 mL`), and ABV percent extraction.

### Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo on [vercel.com](https://vercel.com/new). Vercel auto-detects Next.js — no config needed.
3. Add `GEMINI_API_KEY` as an environment variable in the Vercel project settings (Production + Preview).
4. Trigger a deploy.

Production-deploy notes: the API routes use `runtime = 'nodejs'`, `maxDuration = 30` (verify) and `60` (batch). On Vercel Hobby plan these limits are 60 s; on Pro they're 300 s. Both fit the 5 s per-label budget.

---

## Runbook

### Deploy to Vercel from the CLI

```bash
# 1. Install the Vercel CLI (one-time)
pnpm add -g vercel

# 2. Log in (opens browser for auth)
vercel login

# 3. Link this directory to a Vercel project (first time only)
vercel link

# 4. Set the Gemini key as an environment variable (first time only)
vercel env add GEMINI_API_KEY

# 5. Preview deploy (creates a unique preview URL)
vercel

# 6. Production deploy
vercel --prod
```

### Common operations

```bash
# Pull remote env vars into a local .env file
vercel env pull .env.local

# Tail production function logs
vercel logs --follow

# List recent deployments
vercel ls

# Roll back to the previous production deployment
vercel rollback

# Open the project dashboard in your browser
vercel inspect --open
```

### Redeploy after code changes

```bash
# Make sure tests still pass
pnpm test

# Build locally to catch errors before deploying
pnpm build

# Deploy to preview, verify, then promote
vercel              # preview URL
vercel --prod       # production
```

---

## Repository layout

```
label_verification/
├── README.md                       # this file
├── labels/
│   ├── actual/                     # 10 real label photos for demo + tests
│   └── synthetic/                  # generated edge-case labels
├── public/
│   ├── labels/synthetic/           # 10 synthetic distilled-spirit labels
│   ├── labels/actual/              # 3 real photos (front + back pairs) + 4 unmapped
│   └── samples/                    # downloadable from explainer page
│       ├── sample-batch.csv
│       └── sample-batch.json
├── src/
│   ├── app/
│   │   ├── page.tsx                # explainer (landing)
│   │   ├── ThemeRegistry.tsx       # MUI/emotion SSR
│   │   ├── theme.ts                # MUI theme
│   │   ├── layout.tsx
│   │   ├── verify/page.tsx         # single-label flow (Suspense wrapper)
│   │   ├── verify/VerifyClient.tsx # client component
│   │   ├── batch/page.tsx          # batch flow
│   │   └── api/
│   │       ├── verify/route.ts
│   │       └── batch/route.ts
│   ├── components/
│   │   ├── SiteHeader.tsx
│   │   └── ResultsPanel.tsx
│   └── lib/
│       ├── extractor/
│       │   ├── types.ts            # Extractor interface, LabelFields
│       │   ├── gemini.ts
│       │   ├── mock.ts
│       │   └── index.ts            # factory reading EXTRACTOR env
│       ├── comparator/
│       │   ├── normalize.ts        # fuzzy normalization + ABV/net parsers
│       │   ├── warning.ts          # canonical text + exact check
│       │   └── compare.ts          # per-field orchestrator
│       ├── parsers/
│       │   └── manifest.ts         # CSV + JSON manifest parser (auto-detect)
│       └── samples/
│           └── expected.ts         # ground-truth values for the 10 synthetic labels
└── tests/
    └── comparator.test.ts          # 18 tests
```

---

## Production considerations

If this prototype graduated to a real TTB system, the changes I would prioritize:

1. **Swap the extractor to Azure Document Intelligence** to match TTB's Azure infrastructure and stay inside FedRAMP boundaries. The `Extractor` interface is designed for this.
2. **Replace Vercel with containerized services on Azure** (App Service or AKS), behind TTB's existing network controls. Marcus mentioned the firewall blocks outbound traffic to many cloud ML endpoints — Azure Document Intelligence is in-tenant and avoids that class of failure.
3. **Add an artifact store + audit log** for every verification: image, extracted fields, comparator output, agent decision, timestamp, agent ID. This is both a compliance and a model-monitoring requirement.
4. **Move batch to a queue.** In-request fan-out is fine for 25 labels and a demo. For Janet's 200–300 case, the right shape is a job queue with a status page and email-on-completion.
5. **Pin and regression-test the model.** Maintain a labeled regression set (the bundled `labels/actual/` is the seed). Block model upgrades that regress field-extraction accuracy.
6. **Beverage-type-aware rules.** Branch the canonical Government Warning text by beverage type. Same for ABV requirements (some wine/beer is exempt).
7. **Manual-override flow.** Even when the tool flags a row as pass, an agent has the final call. The UI needs a one-click "override + comment" path so the audit log captures human judgment.

---

## Sample label

Your app should handle labels containing information like the example below:

**Example Distilled Spirits Label Fields:**

* Brand Name: `OLD TOM DISTILLERY`
* Class/Type: `Kentucky Straight Bourbon Whiskey`
* Alcohol Content: `45% Alc./Vol. (90 Proof)`
* Net Contents: `750 mL`
* Government Warning: _[Standard government warning text]_

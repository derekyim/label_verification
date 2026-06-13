# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This is an early-stage take-home project. As of now the repository contains only:

- `README.md` — a partially filled-in design doc (intent, not implementation)
- `labels/actual/` — 10 real alcohol label photos (`IMG_1370.jpeg`–`IMG_1379.jpeg`) used as test inputs
- `labels/synthetic/` — empty placeholder for generated/edited test labels
- `.gitignore` — covers Node, Next.js, Python, Firebase, Playwright, and Claude tooling

There is **no source code, package manifest, build system, or test suite yet**. Don't fabricate commands (`npm test`, etc.) — they don't exist until the app is scaffolded.

## Project intent (from README.md)

Build a prototype web app that verifies AI-extracted fields from alcohol labels (Brand Name, Class/Type, Alcohol Content, Net Contents, Government Warning) against an uploaded label image.

Planned stack per the README:
- **Frontend:** React + Material UI (chosen for free, well-documented component library)
- **Deployment:** Vercel (prototype only — production would use containerized cloud services)
- Image-processing library and backend approach are **not yet decided**; the README has placeholder sections for these choices

The `.gitignore` hints at possible Next.js, Python, Firebase, and Playwright usage, but none of these are committed to a choice — treat them as options the author left open, not decisions.

## When scaffolding the app

- The sample images in `labels/actual/` are the canonical fixtures — wire any OCR/extraction pipeline against them first.
- The README's "Requirements" section is still a blank template; if asked to implement a feature, ask which stakeholder requirement it maps to rather than assuming.
- Keep this CLAUDE.md updated as real commands, architecture, and decisions land — the current file is intentionally thin because there is nothing concrete to document.

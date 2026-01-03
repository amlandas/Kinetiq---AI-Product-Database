# Project Scope - Kinetiq AI Product Database

## Overview
Kinetiq is a modern, AI-powered web application for discovering, comparing, and tracking AI tools. It provides a curated directory, AI-generated product comparisons, a matchmaker for user needs, and analytics/market insights, with a responsive UI and product detail pages.

## Core User Features
- Searchable and filterable AI product directory with list/grid/table views.
- AI-powered comparison matrix (strengths, weaknesses, pricing, sentiment, feature checklist).
- AI matchmaker that recommends tools based on a user query.
- Product detail pages with AI-generated analysis.
- Market analytics charts and summary metrics.
- Favorites, shareable URL filters, and CSV export.
- Light/dark theme toggle with persisted preference.

## Architecture (BFF in a Single Service)
- Single Next.js app serves both UI and API routes on the same origin.
- API routes (server-side):
  - `POST /api/crawl`: Gemini-based product discovery with Google Search grounding.
  - `POST /api/compare`: Structured JSON comparison via Gemini.
  - `POST /api/match`: Recommendations via Gemini with grounding.
  - `POST /api/analyze`: Product analysis; returns mock output if API key missing.
- Client-side services call the API routes using relative `/api/*` paths.

## Data Model and Persistence
- Large curated seed dataset in `src/data.ts`.
- LocalStorage cache with versioning in `src/services/db.ts`.
- Background crawler (`src/services/crawler.ts`) refreshes data by category/subcategory.
- Products include pricing, metrics (users, rating, growth), tags, and logo URL.

## Security and Guardrails
- Prompt injection/XSS sanitization in `src/lib/security.ts`.
- Per-instance rate limiting middleware in `src/middleware.ts` (API routes only).

## Tech Stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind.
- Backend: Next.js API routes (Node.js).
- AI: Google GenAI SDK (`@google/genai`) with Google Search grounding.
- Deployment: Cloud Run (containerized via Dockerfile).

## Infrastructure and Hosting
- GCP project: `gen-lang-client-0411759143` (Project No. 215079223818).
- Cloud Run service: `kinetiq-ai-product-database` in `us-west1`.
- Service URLs:
  - `https://kinetiq-ai-product-database-215079223818.us-west1.run.app`
  - `https://kinetiq-ai-product-database-nptutqc3wa-uw.a.run.app`
- Secrets: `API_KEY` from Secret Manager (`kinetiq-api-key`).
- Do not touch `simpleflo-site` service (different product).

## Domain Goals
- Map custom domains to Cloud Run:
  - `kinetiq.simpleflo.dev` -> UI
  - `api.kinetiq.simpleflo.dev` -> API
- Current app assumes same-origin `/api/*` calls; mapping both subdomains to the same service is the lowest-risk option without CORS changes.


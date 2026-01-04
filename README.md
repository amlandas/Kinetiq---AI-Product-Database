# Kinetiq - AI Product Database

**An AI utility database for discovering, comparing, and shortlisting tools with clear trade-offs.**

![Kinetiq Product Database](https://ui-avatars.com/api/?name=Kinetiq&background=0284c7&color=fff&size=200&font-size=0.4&bold=true)

## 🚀 Overview
Kinetiq is a curated, high-performance web application designed to help teams navigate the AI landscape. Unlike static directories, Kinetiq uses **Google Gemini AI** to crawl, analyze, and generate structured comparisons and recommendations.

### Key Features
*   **Curated AI directory**: Search, filter, and browse a large catalog of AI products.
*   **AI-powered comparison**: Compare up to 5 products with structured strengths, weaknesses, and fit reasoning.
*   **AI Matchmaker**: Recommendations based on user constraints and intent.
*   **Market analytics**: Charts for category distribution, growth, and ratings.
*   **Responsive UI**: Designed for desktop and mobile.

## 🏗️ System Architecture
The application follows a **BFF (Backend-for-Frontend)** design in a single Next.js service. The UI and API routes share the same origin, keeping auth and rate limits simple.

### Tech Stack
*   **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons.
*   **Backend**: Next.js API routes (Node.js).
*   **AI Engine**: Google GenAI SDK (`@google/genai`) with Search Grounding.
*   **Deployment**: Google Cloud Run (containerized via `Dockerfile`).
*   **Data**: Local seed dataset + LocalStorage cache + background crawler.

### Data Flow
1.  **Search/Browse**: Users explore the directory, filters, and categories in the browser.
2.  **Match/Compare**: Frontend calls `/api/*` routes for matchmaker and comparison.
3.  **AI Processing**: API routes call Gemini using `API_KEY` (stored in Secret Manager).
4.  **Response**: Structured JSON returns to the UI for rendering.

## 🛠️ Local Development

Follow these steps to run Kinetiq locally.

### Prerequisites
*   Node.js v18+
*   npm
*   A Google Gemini API key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/amlandas/Kinetiq---AI-Product-Database.git
    cd Kinetiq---AI-Product-Database
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env.local` file in the root directory:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser. You can override the port with `PORT=3002 npm run dev`.

## 🚀 Deployment
Kinetiq is deployed to Google Cloud Run using the `Dockerfile` in the repo root. The production service expects `API_KEY` to be provided via Secret Manager:

```bash
gcloud run deploy kinetiq-ai-product-database \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --set-secrets API_KEY=kinetiq-api-key:latest
```

## 📈 Analytics Snapshots
Weekly analytics trendlines are backed by snapshot data stored in `src/data/analyticsSnapshots.json`.

Capture a new snapshot:
```bash
npm run snapshot:analytics
```

The script appends (or updates) the current week and keeps the latest 52 snapshots.

Automation:
- A GitHub Actions workflow (`.github/workflows/analytics-snapshot.yml`) runs weekly to capture a snapshot and commit updates.

## 📡 External Signals
External signals (GitHub activity, job postings, traffic rank proxies, funding filings) are stored in `src/data/externalSignals.json`.

Refresh signals locally:
```bash
npm run signals:refresh
```

SEC EDGAR requests a descriptive user-agent with contact info. Override the default with:
```bash
SEC_USER_AGENT="KinetiqSignals/1.0 (contact: you@example.com)" npm run signals:refresh
```

Sources:
- GitHub API (repo/org activity)
- Greenhouse Jobs API (company-level hiring signal)
- Tranco top sites list (traffic rank proxy)
- SEC EDGAR filings (public-company only)

Automation:
- The same GitHub Actions workflow refreshes external signals on the weekly cadence and commits updates.

Feature flag:
- `NEXT_PUBLIC_FEATURE_EXTERNAL_SIGNALS=true` enables the external signals UI and decision report export.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and code standards.

## 📄 License
This project is licensed under the [MIT License](LICENSE).

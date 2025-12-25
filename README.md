# Kinetiq - AI Product Database

**A modern, AI-powered intelligence platform for discovering, tracking, and comparing top-tier AI tools.**

![Kinetiq Product Database](https://ui-avatars.com/api/?name=Kinetiq&background=0284c7&color=fff&size=200&font-size=0.4&bold=true)

## 🚀 Overview
Kinetiq is a curated, high-performance web application designed to help users navigate the rapidly exploding AI landscape. Unlike static directories, Kinetiq leverages **Google Gemini AI** to actively crawl, analyze, and generate strategic comparisons of AI products.

### Key Features
*   **Curated AI Directory**: A searchable, filterable database of the most impactful AI tools.
*   **AI-Powered Comparison**: Select up to 5 products and generate a strategic comparison matrix (Strengths, Weaknesses, Market Fit) using Gemini 3 Flash.
*   **Market Analytics**: Visual charts showing market share, user growth, and category distribution.
*   **Real-time Search Grounding**: The system self-updates by discovering new tools via Google Search grounding.
*   **Responsive Design**: Built for desktop and mobile with a highly polished UI.

## 🏗️ System Architecture

The application follows a modern **BFF (Backend-for-Frontend)** architecture to ensure security and performance.

### Tech Stack
*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
*   **Backend**: Node.js (Express), Helmet, CORS, Rate Limiting.
*   **AI Engine**: Google GenAI SDK (`gemini-3-flash-preview`), Search Grounding.
*   **Deployment**:  Google Cloud Run (Containerized via Docker).
*   **Data**: LocalStorage optimized cache (Client-side) + AI Crawler (Server-assisted).

### Data Flow
1.  **Search/Browse**: User interacts with the React frontend (running in browser).
2.  **Comparison Request**: Frontend sends selected products to `/api/compare` (Node.js Proxy).
3.  **AI Processing**: Node.js server securely communicates with Google Gemini API, injecting the `API_KEY` (stored in Secret Manager).
4.  **Response**: Structural JSON comparison is returned to the frontend and rendered.

## 🛠️ Local Development

Follow these steps to run Kinetiq locally.

### Prerequisites
*   Node.js v18+
*   NPM
*   A Google Gemini API Key

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
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  **Start the Development Server:**
    This command runs both the Vite frontend and the Node backend concurrently.
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` (or `8080`) in your browser.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and code standards.

## 📄 License
This project is licensed under the [MIT License](LICENSE).

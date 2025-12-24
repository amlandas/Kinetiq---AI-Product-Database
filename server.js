import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY;

// Initialize Gemini Client (Server-Side)
const ai = new GoogleGenAI({ apiKey: API_KEY || 'MISSING_KEY' });

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// 1. Helmet: Sets various HTTP headers for security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://esm.sh"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://ui-avatars.com"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://esm.sh"]
        }
    }
}));

// 2. CORS: Restrict cross-origin (Though we serve same-origin mostly)
app.use(cors({ origin: true })); // Allow all for now, or restrict to specific domains if known

// 3. Rate Limiting: Prevent abuse of the expensive AI API
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per minute
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use(express.json());

// ============================================================================
// API ENDPOINTS
// ============================================================================

app.post('/api/compare', async (req, res) => {
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid products data' });
        }

        // --- LOGIC MIGRATED FROM geminiService.ts ---

        // 1. Determine Dominant Category
        const categoryCounts = {};
        products.forEach(p => {
            const cat = p.category || 'General';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Safety check for empty categoryCounts
        const categories = Object.keys(categoryCounts);
        const dominantCategory = categories.length > 0
            ? categories.reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
            : 'General';

        // 2. Category Prompts
        const categoryPrompts = {
            'Productivity': `
        - Application Integrations (Gmail, Slack, etc.)
        - Tier Limits (Messages/day)
        - Mobile App Availability
        - Data Privacy (Training on user data?)`,
            'Creative': `
        - Output Capabilities (Text, Image, Video, Code?)
        - Image Resolution / Quality limits
        - Copyright / Ownership of outputs
        - Content Filters`,
            'Business': `
        - Industry Templates
        - Collaboration Features
        - Security Certifications (SOC2, SSO)
        - Support SLA & Contract Terms`,
            'Development': `
        - Supported Programming Languages
        - IDE Compatibilities (VSCode, JetBrains)
        - Code Gen vs Completion
        - API Access / Documentation`,
            'Lifestyle': `
        - Specialized Domain (Health, Legal, etc.)
        - Credentials / Partnerships
        - Citation of sources
        - Personalization options`
        };

        // Fallback logic for keys
        const specificQuestions = categoryPrompts[dominantCategory]
            || categoryPrompts[Object.keys(categoryPrompts).find(k => dominantCategory.includes(k))]
            || '';

        // 3. Construct Prompt
        const prompt = `
      COMPARE the following AI products based on the latest available data.
      Use Google Search to verify pricing, recent updates, and reputation.

      PRODUCTS TO COMPARE:
      ${products.map(p => `${p.name} (${p.category}): ${p.description}`).join('\n')}

      CATEGORY CONTEXT: ${dominantCategory}

      REQUIRED OUTPUT (JSON):
      {
        "summary": "High-level objective comparison...",
        "lastUpdated": "YYYY-MM-DD",
        "pricing": { "${products[0].name}": "$X/mo", ... },
        "pros": { "${products[0].name}": ["Pro 1", "Pro 2"], ... },
        "cons": { "${products[0].name}": ["Con 1", "Con 2"], ... },
        "rating_sentiment": { "${products[0].name}": "Sentiment...", ... },
        "features": [
           // UNIVERSAL QUESTIONS
           { "label": "Free Trial", "values": { "${products[0].name}": "Yes/No", ... } },
           { "label": "Major Backing", "values": { ... } },
           { "label": "Last Update", "values": { ... } },
           
           // CATEGORY SPECIFIC
           ${specificQuestions}
        ]
      }

      STRICT GUIDELINES:
      - Be specific (e.g., instead of "Yes", say "Yes (Python, JS, Go)").
      - If data is not found via search, return "N/A".
      - Focus on distinct differences.
    `;

        // 4. Schema
        const responseSchema = {
            type: "OBJECT",
            properties: {
                summary: { type: "STRING" },
                lastUpdated: { type: "STRING" },
                pricing: { type: "OBJECT", nullable: true },
                pros: { type: "OBJECT", nullable: true },
                cons: { type: "OBJECT", nullable: true },
                rating_sentiment: { type: "OBJECT", nullable: true },
                features: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            label: { type: "STRING" },
                            values: { type: "OBJECT", nullable: true }
                        },
                        required: ["label", "values"]
                    }
                }
            },
            required: ["summary", "features"]
        };

        // 5. Call Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const rawText = response.text;
        if (!rawText) throw new Error("No response from AI");

        const parsed = JSON.parse(rawText);
        res.json(parsed);

    } catch (error) {
        console.error("Comparison Error:", error);
        res.status(500).json({ error: "Failed to generate comparison" });
    }
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

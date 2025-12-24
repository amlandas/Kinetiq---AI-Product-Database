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

        // 3. Construct Prompt (Updated for Valid Schema)
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
        "pricing": [ { "productName": "${products[0].name}", "price": "$X/mo" }, ... ],
        "pros": [ { "productName": "${products[0].name}", "items": ["Pro 1", "Pro 2"] }, ... ],
        "cons": [ { "productName": "${products[0].name}", "items": ["Con 1", "Con 2"] }, ... ],
        "rating_sentiment": [ { "productName": "${products[0].name}", "sentiment": "Positive/Neutral/Negative because..." }, ... ],
        "features": [
           // UNIVERSAL QUESTIONS
           { 
             "label": "Free Trial", 
             "items": [ { "productName": "${products[0].name}", "value": "Yes/No" }, ... ]
           },
           { "label": "Major Backing", "items": [...] },
           { "label": "Last Update", "items": [...] },
           
           // CATEGORY SPECIFIC
           ${specificQuestions}
        ]
      }

      STRICT GUIDELINES:
      - Be specific (e.g., instead of "Yes", say "Yes (Python, JS, Go)").
      - If data is not found via search, return "N/A".
      - Focus on distinct differences.
    `;

        // 4. Schema (Strict Typed Arrays)
        const responseSchema = {
            type: "OBJECT",
            properties: {
                summary: { type: "STRING" },
                lastUpdated: { type: "STRING" },
                pricing: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            productName: { type: "STRING" },
                            price: { type: "STRING" }
                        },
                        required: ["productName", "price"]
                    }
                },
                pros: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            productName: { type: "STRING" },
                            items: { type: "ARRAY", items: { type: "STRING" } }
                        },
                        required: ["productName", "items"]
                    }
                },
                cons: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            productName: { type: "STRING" },
                            items: { type: "ARRAY", items: { type: "STRING" } }
                        },
                        required: ["productName", "items"]
                    }
                },
                rating_sentiment: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            productName: { type: "STRING" },
                            sentiment: { type: "STRING" }
                        },
                        required: ["productName", "sentiment"]
                    }
                },
                features: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            label: { type: "STRING" },
                            items: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        productName: { type: "STRING" },
                                        value: { type: "STRING" }
                                    },
                                    required: ["productName", "value"]
                                }
                            }
                        },
                        required: ["label", "items"]
                    }
                }
            },
            required: ["summary", "features", "pricing", "pros", "cons", "rating_sentiment"]
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

        let rawText;
        if (typeof response.text === 'function') {
            rawText = response.text();
        } else {
            rawText = response.text;
        }

        if (!rawText) throw new Error("No response text from AI");

        const parsed = JSON.parse(rawText);

        // 6. Transform Arrays back to Maps (Adapter Pattern)
        // The Client expects Maps { "Product A": "Value" }, so we convert the Arrays here.

        const transformMap = (list, valueKey) => {
            if (!list || !Array.isArray(list)) return {};
            return list.reduce((acc, item) => {
                acc[item.productName] = item[valueKey];
                return acc;
            }, {});
        };

        const finalResult = {
            summary: parsed.summary,
            lastUpdated: parsed.lastUpdated,
            pricing: transformMap(parsed.pricing, 'price'),
            pros: transformMap(parsed.pros, 'items'),
            cons: transformMap(parsed.cons, 'items'),
            rating_sentiment: transformMap(parsed.rating_sentiment, 'sentiment'),
            features: (parsed.features || []).map(f => ({
                label: f.label,
                values: transformMap(f.items, 'value')
            }))
        };

        res.json(finalResult);

    } catch (error) {
        console.error("Comparison Error:", error);
        res.status(500).json({
            error: "Failed to generate comparison",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: API Key missing' }, { status: 500 });
    }

    try {
        const { products } = await req.json();

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'Invalid products data' }, { status: 400 });
        }

        // 1. Determine Dominant Category
        const categoryCounts: Record<string, number> = {};
        products.forEach((p: any) => {
            const cat = p.category || 'General';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const categories = Object.keys(categoryCounts);
        const dominantCategory = categories.length > 0
            ? categories.reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
            : 'General';

        // 2. Category Prompts
        const categoryPrompts: Record<string, string> = {
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

        const specificQuestions = categoryPrompts[dominantCategory]
            || categoryPrompts[Object.keys(categoryPrompts).find(k => dominantCategory.includes(k)) || '']
            || '';

        // 3. Construct Prompt
        const prompt = `
      COMPARE the following AI products based on the latest available data.
      Use Google Search to verify pricing, recent updates, and reputation.

      PRODUCTS TO COMPARE:
      ${products.map((p: any) => `${p.name} (${p.category}): ${p.description}`).join('\n')}

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

        // 4. Schema
        const responseSchema = {
            type: "OBJECT" as any,
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

        if (!rawText) throw new Error("No response text from AI");

        const parsed = JSON.parse(rawText);

        const transformMap = (list: any[], valueKey: string) => {
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
            features: (parsed.features || []).map((f: any) => ({
                label: f.label,
                values: transformMap(f.items, 'value')
            }))
        };

        return NextResponse.json(finalResult);

    } catch (error: any) {
        console.error("Comparison Error:", error);
        return NextResponse.json({
            error: "Failed to generate comparison",
            details: error.message
        }, { status: 500 });
    }
}

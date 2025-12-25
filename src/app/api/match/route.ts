import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

export async function POST(req: Request) {
    try {
        const { query, products } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Missing query" }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ error: "Server configuration error: API Key missing" }, { status: 500 });
        }

        // Limit context size
        const context = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            tags: p.tags
        }));

        const prompt = `
            You are an expert AI Software Matchmaker / CIO.
            Your goal is to recommend the *specific* best tools for a user's unique persona and constraint set.

            User Query: "${query}"

            INTERNAL TOOL DATABASE:
            ${JSON.stringify(context)}

            INSTRUCTIONS (CHAIN OF THOUGHT):
            1.  **Analyze Persona**: Deduce the user's role (e.g., Architect, Developer, Student, Marketer) from the query.
            2.  **Identify Constraints**: Detect implicit constraints (e.g., "free" => budget constraint, "secure" => enterprise constraint, "teams" => collaboration).
            3.  **Search Grounding**: Use Google Search to understand the specific ecosystem if needed (e.g., "Tools compatible with Autodesk Revit" or "HIPAA compliant translation").
            4.  **Database Scanning & Filtering**:
                *   Scan the Internal Database for matches.
                *   **CRITICAL RULE**: "Specialist over Generalist". If a user asks for a specific task (e.g., "Coding", "Translation", "Design") and there is a *Specialized Tool* in the DB (e.g., Copilot, DeepL, Midjourney), you MUST prioritize it over a Generalist LLM (ChatGPT, Claude, Gemini) unless the user explicitly asks for a chatbot.
                *   *Penalize* generic tools if they are not the best fit for the specific domain.
            5.  **Selection**: Select the top 3-5 best matches.
            6.  **Reasoning**: For each match, write a personalized "Why it matches" reasoning that explicitly connects the tool's specific features to the user's persona/constraints.

            OUTPUT FORMAT (JSON):
            Return a JSON object matching the schema below.
        `;

        const responseSchema = {
            type: "OBJECT" as any,
            properties: {
                recommendations: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            productId: { type: "STRING" },
                            reason: { type: "STRING" },
                            relevanceScore: { type: "NUMBER" }
                        },
                        required: ["productId", "reason", "relevanceScore"]
                    }
                },
                summary: { type: "STRING" }
            },
            required: ["recommendations", "summary"]
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

        const rawText = typeof response.text === 'function' ? response.text() : response.text;
        if (!rawText) throw new Error("No response text from AI");

        return NextResponse.json(JSON.parse(rawText));

    } catch (error: any) {
        console.error("Matchmaker Error:", error);
        return NextResponse.json({
            error: "Failed to match products",
            details: error.message
        }, { status: 500 });
    }
}

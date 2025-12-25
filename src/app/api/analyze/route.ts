import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

export async function POST(req: Request) {
    if (!apiKey) {
        // Return a mocked analysis for demonstration purposes if no API key is present
        // We handle this gracefully to avoid breaking the UI
        const { product } = await req.json().catch(() => ({ product: null }));
        if (!product) return NextResponse.json({ error: "Missing product" }, { status: 400 });

        const mockAnalysis = `### Strategic Analysis: ${product.name} (Mock)
    
**Market Position:**
${product.name} is a key player in the ${product.category}.

**Strengths:**
- User Growth
- Feature Set

*Note: Server API Key missing, showing mock data.*`;

        return NextResponse.json({ analysis: mockAnalysis });
    }

    try {
        const { product } = await req.json();

        if (!product) {
            return NextResponse.json({ error: "Missing product data" }, { status: 400 });
        }

        const prompt = `
      Analyze the following AI product: ${product.name} by ${product.companyId}.
      Description: ${product.description}
      Key Features: ${product.features.join(', ')}
      Metrics: ${product.metrics.totalUsers} users, ${product.metrics.rating} rating.
      
      Provide a brief (max 100 words) strategic analysis of its market position, strengths, and potential weaknesses.
      Format the output as Markdown.
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        const text = response.text;
        return NextResponse.json({ analysis: text || "No analysis available." });

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return NextResponse.json({
            error: "Failed to generate analysis",
            details: error.message
        }, { status: 500 });
    }
}

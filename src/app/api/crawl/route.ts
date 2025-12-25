import { GoogleGenAI, Schema, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

const generateLogoUrl = (name: string) => {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=0ea5e9&color=fff&size=200&font-size=0.5&bold=true`;
};

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: API Key missing' }, { status: 500 });
    }

    try {
        const { category, subCategory, count = 10 } = await req.json();

        if (!category || !subCategory) {
            return NextResponse.json({ error: "Missing category or subCategory" }, { status: 400 });
        }

        const prompt = `
      Find and list at least ${count} NEW, EMERGING, or HIGHLY POPULAR AI products that specifically belong to the Category: '${category}' and Sub-Category: '${subCategory}'.
      
      SEARCH INSTRUCTIONS:
      - Use Google Search to find current tools listed on aggregators like Futurepedia.io, Toolify.ai, ProductHunt, and AI Scout.
      - Focus on tools released or updated in late 2024 and 2025 if possible.
      - Ensure the 'subCategory' field in the output EXACTLY matches the string: "${subCategory}".
      
      DATA REQUIREMENTS:
      1. 'id': lowercase kebab-case (e.g. 'eleven-labs', 'cursor-so').
      2. 'companyId': The actual company name.
      3. 'metrics': Estimate 'totalUsers' and 'growthRate' based on popularity signals if exact numbers are not found. Do NOT return null.
      4. 'website': Must be a valid URL.
      
      Do NOT invent fake tools. 
    `;

        const responseSchema: Schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    companyId: { type: Type.STRING },
                    category: { type: Type.STRING },
                    subCategory: { type: Type.STRING },
                    description: { type: Type.STRING },
                    features: { type: Type.ARRAY, items: { type: Type.STRING } },
                    website: { type: Type.STRING },
                    pricing: { type: Type.ARRAY, items: { type: Type.STRING } },
                    launchDate: { type: Type.STRING },
                    lastUpdate: { type: Type.STRING },
                    metrics: {
                        type: Type.OBJECT,
                        properties: {
                            totalUsers: { type: Type.NUMBER },
                            mau: { type: Type.NUMBER },
                            rating: { type: Type.NUMBER },
                            growthRate: { type: Type.NUMBER },
                        },
                        required: ["totalUsers", "rating", "growthRate"]
                    },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "name", "companyId", "category", "subCategory", "description", "metrics", "website"]
            }
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
        if (!rawText) return NextResponse.json([], { status: 200 });

        let parsed: any[] = JSON.parse(rawText);

        if (!Array.isArray(parsed)) return NextResponse.json([], { status: 200 });

        const processedProducts = parsed.map(p => ({
            ...p,
            category: category,
            subCategory: subCategory,
            logoUrl: generateLogoUrl(p.name),
            metrics: {
                ...p.metrics,
                totalUsers: Number(p.metrics.totalUsers) || 10000,
                rating: Math.min(Math.max(Number(p.metrics.rating) || 4.5, 0), 5),
                growthRate: Number(p.metrics.growthRate) || 10
            }
        }));

        return NextResponse.json(processedProducts);

    } catch (error: any) {
        console.error(`Failed to crawl products:`, error);
        return NextResponse.json({ error: "Failed to generate products", details: error.message }, { status: 500 });
    }
}

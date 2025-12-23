import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Product } from "../types";

// Initialize the API client
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' }); // Prevent crash if env missing during build

export const getProductAnalysis = async (product: Product): Promise<string> => {
  if (!apiKey) return "API Key not configured. Unable to fetch analysis.";

  try {
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

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};

/**
 * Fetches a batch of products for a specific category/subcategory
 * Designed for bulk initialization
 */
export const generateProductsForCategory = async (
  category: string, 
  subCategory: string,
  count: number = 8
): Promise<Product[]> => {
  if (!apiKey) {
    console.warn("API Key missing, returning empty list.");
    return [];
  }

  const prompt = `
    Generate a list of ${count} REAL, POPULAR, and SPECIFIC AI products that fit the category '${category}' and sub-category '${subCategory}'.
    
    CRITICAL RULES:
    1. Provide REAL products that actually exist (e.g., Midjourney, Jasper, Copy.ai, Tabnine, etc.).
    2. Do NOT generate generic names like "AI Writer Tool". Use specific brand names.
    3. Ensure the 'companyId' is the actual company name.
    4. Construct a valid 'website' URL (best guess).
    5. 'metrics' must be realistic estimates for established products.
    6. 'id' must be a unique kebab-case string (e.g., 'jasper-ai', 'midjourney').
    
    Schema details:
    - logoUrl: Use "https://ui-avatars.com/api/?name=ProductName&background=random" (replace ProductName).
    - pricing: Array of ['Free', 'Freemium', 'Paid', 'Enterprise'].
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        companyId: { type: Type.STRING },
        logoUrl: { type: Type.STRING },
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const rawText = response.text;
    if (!rawText) return [];
    
    const parsed = JSON.parse(rawText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Failed to fetch products for ${category}/${subCategory}:`, error);
    return [];
  }
};

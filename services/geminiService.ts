import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Product } from "../types";

// Initialize the API client
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });

// Helper to generate consistent avatar URLs
const generateLogoUrl = (name: string) => {
  const encodedName = encodeURIComponent(name);
  // Using a consistent color hash or just random is fine, ui-avatars handles it well.
  // We use a specific background style to look professional.
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0ea5e9&color=fff&size=200&font-size=0.5&bold=true`;
};

export const getProductAnalysis = async (product: Product): Promise<string> => {
  if (!apiKey) {
    // Return a mocked analysis for demonstration purposes if no API key is present
    return `### Strategic Analysis: ${product.name}

**Market Position:**
${product.name} holds a strong position in the ${product.category} market, leveraging its key features like ${(product.features && product.features[0]) || 'AI capabilities'} to attract a user base of over ${new Intl.NumberFormat('en-US', { notation: "compact" }).format(product.metrics.totalUsers)}.

**Strengths:**
- **User Growth:** With a growth rate of ${product.metrics.growthRate}%, it demonstrates significant market traction.
- **Feature Set:** Offers competitive tools for ${product.subCategory}.
- **Brand Recognition:** As a product of ${product.companyId}, it benefits from established trust.

**Weaknesses:**
- **Competition:** faces stiff competition in the crowded ${product.category} space.
- **Pricing:** ${product.pricing.join(', ')} model may limit accessibility for some segments.

**Verdict:**
A robust contender with solid fundamentals and a clear growth trajectory.`;
  }

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
 * Designed for bulk initialization with Search Grounding
 */
export const generateProductsForCategory = async (
  category: string,
  subCategory: string,
  count: number = 10 // Requesting reasonable batch
): Promise<Product[]> => {
  if (!apiKey) {
    console.warn("API Key missing, returning empty list.");
    return [];
  }

  // Explicitly prompt for the subcategory string to ensure data consistency
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
        // logoUrl is excluded from schema, we construct it manually to ensure validity
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
        tools: [{ googleSearch: {} }], // ENABLE SEARCH GROUNDING
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const rawText = response.text;
    if (!rawText) return [];

    // Parse JSON
    let parsed: any[] = JSON.parse(rawText);

    if (!Array.isArray(parsed)) return [];

    // Post-process to ensure data quality and add Logo URLs
    const processedProducts = parsed.map(p => ({
      ...p,
      // Enforce the requested category/subcategory to avoid filtering issues
      category: category,
      subCategory: subCategory,
      // Manually generate the logo URL to ensure it never breaks
      logoUrl: generateLogoUrl(p.name),
      // Ensure metrics are numbers
      metrics: {
        ...p.metrics,
        totalUsers: Number(p.metrics.totalUsers) || 10000,
        rating: Math.min(Math.max(Number(p.metrics.rating) || 4.5, 0), 5),
        growthRate: Number(p.metrics.growthRate) || 10
      }
    }));

    return processedProducts;
  } catch (error) {
    console.error(`Failed to fetch products for ${category}/${subCategory}:`, error);
    return [];
  }
};
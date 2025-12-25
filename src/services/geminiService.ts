import { Product, ComparisonResult, MatchResult } from "../types";

// Helper to generate consistent avatar URLs (Still needed client-side if we use it here, but ideally moved to server)
const generateLogoUrl = (name: string) => {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0ea5e9&color=fff&size=200&font-size=0.5&bold=true`;
};

export const getProductAnalysis = async (product: Product): Promise<string> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });

    // Graceful fallback for demo/no-key scenarios handled by server
    const data = await response.json();
    return data.analysis || "No analysis available.";
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return "Failed to generate analysis.";
  }
};

/**
 * Fetches a batch of products from the secure backend crawler
 */
export const generateProductsForCategory = async (
  category: string,
  subCategory: string,
  count: number = 10
): Promise<Product[]> => {
  try {
    const response = await fetch('/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, subCategory, count }),
    });

    if (!response.ok) return [];

    const products = await response.json();
    return products as Product[];
  } catch (error) {
    console.error(`Failed to fetch products for ${category}/${subCategory}:`, error);
    return [];
  }
};

/**
 * Generates a comprehensive comparison between selected products
 */
export const generateComparison = async (products: Product[]): Promise<ComparisonResult | null> => {
  if (products.length === 0) return null;

  try {
    const response = await fetch('/api/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data as ComparisonResult;

  } catch (error) {
    console.error("Error generating comparison:", error);
    return null;
  }
};

/**
 * Finds the best matching products for a user query
 */
export const matchProducts = async (query: string, allProducts: Product[]): Promise<MatchResult | null> => {
  try {
    // Optimize payload: Only send essential fields for matching
    const simplifiedProducts = allProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      subCategory: p.subCategory,
      tags: p.tags,
      pricing: p.pricing // Included so AI knows if it's free
    }));

    const response = await fetch('/api/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, products: simplifiedProducts }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Server error (${response.status}):`, errText);
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data as MatchResult;

  } catch (error) {
    console.error("Error matching products:", error);
    return null;
  }
};
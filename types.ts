export type PricingModel = 'Free' | 'Freemium' | 'Paid' | 'Enterprise';

export interface Category {
  id: string;
  name: string;
  subCategories: string[];
}

export interface Company {
  id: string;
  name: string;
  valuation?: string;
  founded?: string;
  location?: string;
  parentCompanyId?: string;
}

export interface Product {
  id: string;
  name: string;
  companyId: string;
  logoUrl: string;
  category: string;
  subCategory: string;
  description: string;
  features: string[];
  website: string;
  pricing: PricingModel[];
  launchDate: string;
  lastUpdate: string;
  metrics: {
    totalUsers: number; // Estimated
    mau?: number;
    rating: number; // 0-5
    growthRate: number; // Percentage
  };
  tags: string[];
}

export interface FilterState {
  search: string;
  category: string | null;
  subCategory: string | null;
  pricing: PricingModel[];
  minRating: number;
}

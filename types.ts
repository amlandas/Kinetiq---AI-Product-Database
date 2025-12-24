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

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'company-asc'
  | 'company-desc'
  | 'users-asc'
  | 'users-desc'
  | 'growth-asc'
  | 'growth-desc'
  | 'rating-asc'
  | 'rating-desc';


export type SearchField = 'name' | 'company' | 'description';

export interface FilterState {
  search: string;
  searchFields: SearchField[];
  category: string[];
  subCategory: string | null;
  pricing: string[];
  minRating: number;
  minGrowth: number;
  dateRange: {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
  };
  sort: {
    primary: SortOption;
    secondary: SortOption;
  };
}

export interface ComparisonResult {
  summary: string;
  lastUpdated: string;
  pricing: Record<string, string>;
  pros: Record<string, string[]>;
  cons: Record<string, string[]>;
  rating_sentiment: Record<string, string>;
  features: {
    label: string;
    values: Record<string, string>;
  }[];
}

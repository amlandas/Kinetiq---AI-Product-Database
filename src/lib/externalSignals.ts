import externalSignalsData from '../data/externalSignals.json';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export type GithubSignal = {
  scope: 'repo' | 'org';
  repo?: string;
  org?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  lastPush?: string;
  lastRelease?: string | null;
  publicRepos?: number;
  followers?: number;
  source: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
  provenance: string[];
  lastUpdated: string;
};

export type JobsSignal = {
  provider: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'smartrecruiters' | 'bamboohr';
  openRoles: number;
  recentRoles30d: number;
  locations: string[];
  source: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
  provenance: string[];
  lastUpdated: string;
  note?: string;
};

export type TrafficSignal = {
  provider: 'tranco';
  rank: number | null;
  matchedDomain: string | null;
  listDate: string | null;
  listId: string | null;
  source: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
  provenance: string[];
  lastUpdated: string;
  note?: string;
};

export type FundingSignal = {
  provider: 'sec-edgar';
  ticker?: string;
  cik?: string;
  lastFilingDate?: string;
  lastFilingType?: string;
  source: string;
  sourceUrl: string;
  confidence: ConfidenceLevel;
  provenance: string[];
  lastUpdated: string;
  note?: string;
};

export type ExternalSignalsEntry = {
  github?: GithubSignal | null;
  jobs?: JobsSignal | null;
  traffic?: TrafficSignal | null;
  funding?: FundingSignal | null;
};

export type ExternalSignalsDataset = {
  updatedAt: string;
  sources: {
    github: { name: string; url: string };
    jobs: { name: string; url: string };
    traffic: { name: string; url: string };
    funding: { name: string; url: string };
  };
  products: Record<string, ExternalSignalsEntry>;
};

const externalSignals = externalSignalsData as ExternalSignalsDataset;

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  unknown: 'Unknown',
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  unknown: 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400',
};

export const getExternalSignals = (productId: string) => externalSignals.products[productId] || null;

export const getExternalSignalsUpdatedAt = () => externalSignals.updatedAt;

export const formatConfidenceLabel = (confidence: ConfidenceLevel) => CONFIDENCE_LABELS[confidence];

export const getConfidenceBadgeClasses = (confidence: ConfidenceLevel) => CONFIDENCE_STYLES[confidence];

export const formatCompactNumber = (value?: number | null) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
};

export const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

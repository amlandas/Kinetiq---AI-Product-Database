import fs from 'node:fs/promises';

import { PRODUCTS } from '../src/data';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

type GithubMapping = {
  repo?: string;
  org?: string;
  scope?: 'repo' | 'org';
  matchMethod?: string;
};

type JobsMapping = {
  provider: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'smartrecruiters' | 'bamboohr';
  company: string;
  matchMethod?: string;
};

type FundingMapping = {
  ticker?: string;
};

type MappingEntry = {
  github?: GithubMapping;
  jobs?: JobsMapping;
  funding?: FundingMapping;
};

type ExternalSignalMappings = {
  products?: Record<string, MappingEntry>;
};

type GithubSignal = {
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

type JobsSignal = {
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

type TrafficSignal = {
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

type FundingSignal = {
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

type ExternalSignalsEntry = {
  github?: GithubSignal | null;
  jobs?: JobsSignal | null;
  traffic?: TrafficSignal | null;
  funding?: FundingSignal | null;
};

type ExternalSignalsDataset = {
  updatedAt: string;
  sources: {
    github: { name: string; url: string };
    jobs: { name: string; url: string };
    traffic: { name: string; url: string };
    funding: { name: string; url: string };
  };
  products: Record<string, ExternalSignalsEntry>;
};

type TrancoList = {
  listId: string;
  date: string;
  downloadUrl: string;
};

const OUTPUT_PATH = new URL('../src/data/externalSignals.json', import.meta.url);
const MAPPINGS_PATH = new URL('../src/data/externalSignalMappings.json', import.meta.url);

const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT ||
  process.env.USER_AGENT ||
  'KinetiqSignals/1.0 (contact: hello@simpleflo.dev)';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const GITHUB_HEADERS: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'KinetiqSignals/1.0 (+https://simpleflo.dev)',
};
if (GITHUB_TOKEN) {
  GITHUB_HEADERS.Authorization = `Bearer ${GITHUB_TOKEN}`;
}
const ENABLE_JOB_SIGNALS = false;
const BATCH_SIZE = Number(process.env.EXTERNAL_SIGNALS_BATCH_SIZE) || 500;
const BATCH_INDEX = process.env.EXTERNAL_SIGNALS_BATCH_INDEX
  ? Number(process.env.EXTERNAL_SIGNALS_BATCH_INDEX)
  : null;
const ENABLE_NAME_SEARCH = process.env.EXTERNAL_SIGNALS_NAME_SEARCH === 'true';

class GitHubRequestError extends Error {
  status: number;
  remaining: string | null;

  constructor(message: string, status: number, remaining: string | null) {
    super(message);
    this.name = 'GitHubRequestError';
    this.status = status;
    this.remaining = remaining;
  }
}

const confidenceForGithub = (scope: 'repo' | 'org') => (scope === 'repo' ? 'high' : 'medium');

const confidenceForJobs = (): ConfidenceLevel => 'medium';

const confidenceForTraffic = (rank: number | null): ConfidenceLevel => (rank ? 'low' : 'unknown');

const confidenceForFunding = (hasData: boolean): ConfidenceLevel => (hasData ? 'high' : 'unknown');

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseDomainCandidates = (website: string) => {
  let hostname = website.trim();
  try {
    hostname = new URL(website).hostname;
  } catch {
    hostname = website.replace(/^https?:\/\//i, '').split('/')[0];
  }

  hostname = hostname.toLowerCase();
  if (hostname.startsWith('www.')) hostname = hostname.slice(4);
  const parts = hostname.split('.').filter(Boolean);
  const candidates: string[] = [];
  for (let i = 0; i <= parts.length - 2; i += 1) {
    candidates.push(parts.slice(i).join('.'));
  }
  return { hostname, candidates };
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.json() as Promise<T>;
};

const fetchText = async (url: string, init?: RequestInit): Promise<string> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.text();
};

const fetchGithubJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: GITHUB_HEADERS });
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (response.status === 403 && remaining === '0') {
      throw new GitHubRequestError(
        'GitHub rate limit exceeded. Set GITHUB_TOKEN to continue.',
        response.status,
        remaining,
      );
    }
    throw new GitHubRequestError(
      `GitHub request failed ${response.status} for ${url}`,
      response.status,
      remaining,
    );
  }
  return response.json() as Promise<T>;
};

const searchGithubRepoByHomepage = async (domain: string) => {
  if (!GITHUB_TOKEN) return null;
  const query = `"${domain}" in:homepage`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=3&sort=stars&order=desc`;
  const data = await fetchGithubJson<{ items?: { full_name?: string }[] }>(url);
  const repo = data.items?.[0]?.full_name;
  return repo ? { scope: 'repo' as const, repo } : null;
};

const searchGithubRepoByName = async (name: string) => {
  if (!GITHUB_TOKEN) return null;
  const query = `"${name}" in:name,description`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=3&sort=stars&order=desc`;
  const data = await fetchGithubJson<{ items?: { full_name?: string }[] }>(url);
  const repo = data.items?.[0]?.full_name;
  return repo ? { scope: 'repo' as const, repo } : null;
};

const getTrancoList = async (lookbackDays = 7): Promise<TrancoList> => {
  for (let offset = 0; offset <= lookbackDays; offset += 1) {
    const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    const dateStr = formatDate(date);
    try {
      const response = await fetchJson<{
        list_id?: string;
        listId?: string;
        download?: string;
        date?: string;
      }>(`https://tranco-list.eu/api/lists/date/${dateStr}`);
      const listId = response.list_id || response.listId;
      if (listId) {
        const downloadUrl = response.download || `https://tranco-list.eu/download/${listId}/1000000`;
        return { listId, date: response.date || dateStr, downloadUrl };
      }
    } catch (error) {
      console.warn(`Tranco list not available for ${dateStr}`);
    }
  }
  throw new Error('Unable to find recent Tranco list');
};

const getTrancoRanks = async (downloadUrl: string, candidates: Set<string>) => {
  const text = await fetchText(downloadUrl);
  const rankMap = new Map<string, number>();
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line) continue;
    const [rankStr, domainRaw] = line.split(',');
    const domain = domainRaw?.trim().toLowerCase();
    if (!rankStr || !domain) continue;
    if (candidates.has(domain)) {
      const rank = Number.parseInt(rankStr, 10);
      if (!Number.isNaN(rank)) {
        rankMap.set(domain, rank);
      }
    }
  }
  return rankMap;
};

const fetchGithubSignal = async (mapping: GithubMapping, nowIso: string): Promise<GithubSignal | null> => {
  if (!mapping.scope) return null;
  if (mapping.scope === 'repo' && mapping.repo) {
    const repo = mapping.repo;
    const repoData = await fetchGithubJson<{
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      pushed_at: string;
      html_url: string;
    }>(`https://api.github.com/repos/${repo}`);

    let lastRelease: string | null = null;
    try {
      const release = await fetchGithubJson<{ published_at?: string }>(
        `https://api.github.com/repos/${repo}/releases/latest`,
      );
      lastRelease = release.published_at ?? null;
    } catch {
      lastRelease = null;
    }

    return {
      scope: 'repo',
      repo,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      lastPush: repoData.pushed_at,
      lastRelease,
      source: 'GitHub API',
      sourceUrl: repoData.html_url,
      confidence: confidenceForGithub('repo'),
      provenance: [`Repo mapping (${mapping.matchMethod || 'manual'})`],
      lastUpdated: nowIso,
    };
  }

  if (mapping.scope === 'org' && mapping.org) {
    const org = mapping.org;
    const orgData = await fetchGithubJson<{
      public_repos: number;
      followers: number;
      html_url: string;
    }>(`https://api.github.com/orgs/${org}`);

    return {
      scope: 'org',
      org,
      publicRepos: orgData.public_repos,
      followers: orgData.followers,
      source: 'GitHub API',
      sourceUrl: orgData.html_url,
      confidence: confidenceForGithub('org'),
      provenance: [`Org mapping (${mapping.matchMethod || 'manual'})`],
      lastUpdated: nowIso,
    };
  }

  return null;
};

const fetchGreenhouseJobs = async (mapping: JobsMapping, nowIso: string): Promise<JobsSignal | null> => {
  if (mapping.provider !== 'greenhouse' || !mapping.company) return null;

  const url = `https://boards-api.greenhouse.io/v1/boards/${mapping.company}/jobs`;
  const data = await fetchJson<{ jobs: { location?: { name?: string }; updated_at?: string; created_at?: string }[] }>(
    url,
  );
  const jobs = data.jobs ?? [];
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRoles = jobs.filter((job) => {
    const timestamp = job.updated_at || job.created_at;
    if (!timestamp) return false;
    const parsed = new Date(timestamp).getTime();
    return Number.isFinite(parsed) && parsed >= cutoff;
  }).length;

  const locationCounts: Record<string, number> = {};
  for (const job of jobs) {
    const location = job.location?.name || 'Unspecified';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  }

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    provider: 'greenhouse',
    openRoles: jobs.length,
    recentRoles30d: recentRoles,
    locations,
    source: 'Greenhouse Jobs API',
    sourceUrl: `https://boards.greenhouse.io/${mapping.company}`,
    confidence: confidenceForJobs(),
    provenance: [`Company-level match (${mapping.matchMethod || 'manual'})`],
    lastUpdated: nowIso,
    note: 'Directional hiring signal based on public job boards.',
  };
};

const fetchLeverJobs = async (mapping: JobsMapping, nowIso: string): Promise<JobsSignal | null> => {
  if (mapping.provider !== 'lever' || !mapping.company) return null;

  const url = `https://api.lever.co/v0/postings/${mapping.company}?mode=json`;
  const jobs = await fetchJson<
    { createdAt?: number; categories?: { location?: string } }[]
  >(url);

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRoles = jobs.filter((job) => {
    const timestamp = job.createdAt ? Number(job.createdAt) : 0;
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  }).length;

  const locationCounts: Record<string, number> = {};
  for (const job of jobs) {
    const location = job.categories?.location || 'Unspecified';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  }

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    provider: 'lever',
    openRoles: jobs.length,
    recentRoles30d: recentRoles,
    locations,
    source: 'Lever Jobs API',
    sourceUrl: `https://jobs.lever.co/${mapping.company}`,
    confidence: confidenceForJobs(),
    provenance: [`Company-level match (${mapping.matchMethod || 'manual'})`],
    lastUpdated: nowIso,
    note: 'Directional hiring signal based on public job boards.',
  };
};

const fetchWorkableJobs = async (mapping: JobsMapping, nowIso: string): Promise<JobsSignal | null> => {
  if (mapping.provider !== 'workable' || !mapping.company) return null;

  const url = `https://apply.workable.com/api/v1/accounts/${mapping.company}/jobs`;
  const data = await fetchJson<any>(url);
  const jobs = data.jobs || data.results || data.data?.jobs || [];
  if (!Array.isArray(jobs)) return null;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRoles = jobs.filter((job) => {
    const timestamp = job.updated_at || job.published_on || job.created_at;
    if (!timestamp) return false;
    const parsed = new Date(timestamp).getTime();
    return Number.isFinite(parsed) && parsed >= cutoff;
  }).length;

  const locationCounts: Record<string, number> = {};
  for (const job of jobs) {
    const location =
      job.location?.location ||
      job.location?.city ||
      job.location ||
      job.city ||
      'Unspecified';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  }

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    provider: 'workable',
    openRoles: jobs.length,
    recentRoles30d: recentRoles,
    locations,
    source: 'Workable Jobs API',
    sourceUrl: `https://apply.workable.com/${mapping.company}`,
    confidence: confidenceForJobs(),
    provenance: [`Company-level match (${mapping.matchMethod || 'manual'})`],
    lastUpdated: nowIso,
    note: 'Directional hiring signal based on public job boards.',
  };
};

const fetchAshbyJobs = async (mapping: JobsMapping, nowIso: string): Promise<JobsSignal | null> => {
  if (mapping.provider !== 'ashby' || !mapping.company) return null;

  const url = `https://jobs.ashbyhq.com/api/non-user-portal/jobs?organizationSlug=${mapping.company}`;
  const data = await fetchJson<any>(url);
  const jobs = data.jobs || data.data?.jobs || [];
  if (!Array.isArray(jobs)) return null;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRoles = jobs.filter((job) => {
    const timestamp = job.publishedAt || job.updatedAt || job.createdAt;
    if (!timestamp) return false;
    const parsed = new Date(timestamp).getTime();
    return Number.isFinite(parsed) && parsed >= cutoff;
  }).length;

  const locationCounts: Record<string, number> = {};
  for (const job of jobs) {
    const location =
      job.location?.locationName ||
      job.location?.name ||
      job.locationName ||
      job.location ||
      'Unspecified';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  }

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    provider: 'ashby',
    openRoles: jobs.length,
    recentRoles30d: recentRoles,
    locations,
    source: 'Ashby Jobs API',
    sourceUrl: `https://jobs.ashbyhq.com/${mapping.company}`,
    confidence: confidenceForJobs(),
    provenance: [`Company-level match (${mapping.matchMethod || 'manual'})`],
    lastUpdated: nowIso,
    note: 'Directional hiring signal based on public job boards.',
  };
};

const fetchSmartRecruitersJobs = async (mapping: JobsMapping, nowIso: string): Promise<JobsSignal | null> => {
  if (mapping.provider !== 'smartrecruiters' || !mapping.company) return null;

  const url = `https://api.smartrecruiters.com/v1/companies/${mapping.company}/postings`;
  const data = await fetchJson<any>(url);
  const jobs = data.content || data.postings || [];
  if (!Array.isArray(jobs)) return null;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRoles = jobs.filter((job) => {
    const timestamp = job.releasedDate || job.createdOn || job.updatedOn;
    if (!timestamp) return false;
    const parsed = new Date(timestamp).getTime();
    return Number.isFinite(parsed) && parsed >= cutoff;
  }).length;

  const locationCounts: Record<string, number> = {};
  for (const job of jobs) {
    const location =
      job.location?.city ||
      job.location?.region ||
      job.location?.country ||
      job.location?.countryCode ||
      job.location ||
      'Unspecified';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  }

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    provider: 'smartrecruiters',
    openRoles: jobs.length,
    recentRoles30d: recentRoles,
    locations,
    source: 'SmartRecruiters API',
    sourceUrl: `https://careers.smartrecruiters.com/${mapping.company}`,
    confidence: confidenceForJobs(),
    provenance: [`Company-level match (${mapping.matchMethod || 'manual'})`],
    lastUpdated: nowIso,
    note: 'Directional hiring signal based on public job boards.',
  };
};

const fetchBambooJobs = async (mapping: JobsMapping, nowIso: string): Promise<JobsSignal | null> => {
  if (mapping.provider !== 'bamboohr' || !mapping.company) return null;

  const url = `https://${mapping.company}.bamboohr.com/jobs/`;
  const html = await fetchText(url);
  const jobMatches = html.match(/BambooHR-ATS-Jobs-Item/gi) || [];
  const openRoles = jobMatches.length;
  const locationMatches = [...html.matchAll(/BambooHR-ATS-Location[^>]*>([^<]+)</gi)];
  const locationCounts: Record<string, number> = {};
  locationMatches.forEach((match) => {
    const location = match[1]?.trim();
    if (!location) return;
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });

  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return {
    provider: 'bamboohr',
    openRoles,
    recentRoles30d: 0,
    locations,
    source: 'BambooHR Jobs',
    sourceUrl: url,
    confidence: confidenceForJobs(),
    provenance: [`Company-level match (${mapping.matchMethod || 'manual'})`],
    lastUpdated: nowIso,
    note: 'Directional hiring signal based on public job boards.',
  };
};

const fetchSecTickerMap = async () => {
  const data = await fetchJson<Record<string, { ticker: string; cik_str: number }>>(
    'https://www.sec.gov/files/company_tickers.json',
    {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        Accept: 'application/json',
      },
    },
  );

  const map = new Map<string, string>();
  Object.values(data).forEach((entry) => {
    if (!entry.ticker || !entry.cik_str) return;
    map.set(entry.ticker.toUpperCase(), String(entry.cik_str).padStart(10, '0'));
  });
  return map;
};

const fetchSecFiling = async (ticker: string, nowIso: string, cikMap: Map<string, string>): Promise<FundingSignal | null> => {
  const cik = cikMap.get(ticker.toUpperCase());
  if (!cik) return null;

  const data = await fetchJson<{ filings?: { recent?: { filingDate?: string[]; form?: string[] } } }>(
    `https://data.sec.gov/submissions/CIK${cik}.json`,
    {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        Accept: 'application/json',
      },
    },
  );

  const recent = data.filings?.recent;
  const lastFilingDate = recent?.filingDate?.[0];
  const lastFilingType = recent?.form?.[0];
  const hasData = Boolean(lastFilingDate || lastFilingType);

  return {
    provider: 'sec-edgar',
    ticker,
    cik,
    lastFilingDate,
    lastFilingType,
    source: 'SEC EDGAR',
    sourceUrl: `https://www.sec.gov/edgar/browse/?CIK=${cik}`,
    confidence: confidenceForFunding(hasData),
    provenance: ['SEC EDGAR filings', `Ticker mapping (${ticker.toUpperCase()})`],
    lastUpdated: nowIso,
    note: 'Public company filings only. Private funding is not captured.',
  };
};

const main = async () => {
  const nowIso = new Date().toISOString();
  const mappingsRaw = await fs.readFile(MAPPINGS_PATH, 'utf8');
  const mappings = JSON.parse(mappingsRaw) as ExternalSignalMappings;
  const mappingEntries = mappings.products || {};

  const domainCandidates = new Map<string, { hostname: string; candidates: string[] }>();
  const allCandidates = new Set<string>();
  PRODUCTS.forEach((product) => {
    const domainInfo = parseDomainCandidates(product.website);
    domainCandidates.set(product.id, domainInfo);
    domainInfo.candidates.forEach((candidate) => allCandidates.add(candidate));
  });

  const trancoList = await getTrancoList();
  const trancoRanks = await getTrancoRanks(trancoList.downloadUrl, allCandidates);

  const tickersNeeded = new Set<string>();
  Object.values(mappingEntries).forEach((entry) => {
    if (entry.funding?.ticker) tickersNeeded.add(entry.funding.ticker.toUpperCase());
  });
  const cikMap = tickersNeeded.size > 0 ? await fetchSecTickerMap() : new Map<string, string>();

  const existingSignalsRaw = await fs.readFile(OUTPUT_PATH, 'utf8').catch(() => '');
  const existingSignals = existingSignalsRaw.trim()
    ? (JSON.parse(existingSignalsRaw) as ExternalSignalsDataset)
    : null;

  const dataset: ExternalSignalsDataset = {
    updatedAt: nowIso,
    sources: {
      github: { name: 'GitHub API', url: 'https://api.github.com' },
      jobs: ENABLE_JOB_SIGNALS
        ? { name: 'Greenhouse Jobs API', url: 'https://boards-api.greenhouse.io' }
        : { name: 'Disabled', url: '' },
      traffic: { name: 'Tranco Top Sites', url: 'https://tranco-list.eu' },
      funding: { name: 'SEC EDGAR', url: 'https://www.sec.gov/edgar' },
    },
    products: existingSignals?.products || {},
  };

  const productsByUsers = [...PRODUCTS].sort(
    (a, b) => (b.metrics?.totalUsers || 0) - (a.metrics?.totalUsers || 0),
  );
  const totalBatches = Math.max(1, Math.ceil(productsByUsers.length / BATCH_SIZE));
  const batchIndices =
    BATCH_INDEX !== null ? [BATCH_INDEX].filter((idx) => idx >= 1 && idx <= totalBatches) : [...Array(totalBatches).keys()].map((i) => i + 1);

  for (const batchIndex of batchIndices) {
    const start = (batchIndex - 1) * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, productsByUsers.length);
    const batch = productsByUsers.slice(start, end);
    console.log(`Processing batch ${batchIndex}/${totalBatches} (${start + 1}-${end})`);

    for (const product of batch) {
      const entry: ExternalSignalsEntry = dataset.products[product.id] || {};
      const mapping = mappingEntries[product.id];

      if (mapping?.github) {
        try {
          entry.github = await fetchGithubSignal(mapping.github, nowIso);
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'Unknown error';
          const repoOrOrg = mapping.github.repo || mapping.github.org || 'unknown';
          const status = error instanceof GitHubRequestError ? error.status : null;
          const domainInfo = domainCandidates.get(product.id);
          let retried = false;

          if (status === 404 && domainInfo && GITHUB_TOKEN) {
            const retryMapping =
              (await searchGithubRepoByHomepage(domainInfo.hostname)) ||
              (ENABLE_NAME_SEARCH ? await searchGithubRepoByName(product.name) : null);

            if (retryMapping) {
              retried = true;
              try {
                entry.github = await fetchGithubSignal(retryMapping, nowIso);
                mappingEntries[product.id] = { ...mapping, github: { ...retryMapping, matchMethod: 'auto-retry' } };
              } catch (retryError) {
                const retryDetail = retryError instanceof Error ? retryError.message : 'Unknown error';
                console.warn(`GitHub retry failed for ${product.id} (${retryMapping.repo}): ${retryDetail}`);
              }
            }
          }

          if (!entry.github) {
            console.warn(`GitHub fetch failed for ${product.id} (${repoOrOrg}): ${detail}`);
          }
        }
      }

      if (ENABLE_JOB_SIGNALS && mapping?.jobs) {
        try {
          if (mapping.jobs.provider === 'greenhouse') {
            entry.jobs = await fetchGreenhouseJobs(mapping.jobs, nowIso);
          } else if (mapping.jobs.provider === 'lever') {
            entry.jobs = await fetchLeverJobs(mapping.jobs, nowIso);
          } else if (mapping.jobs.provider === 'workable') {
            entry.jobs = await fetchWorkableJobs(mapping.jobs, nowIso);
          } else if (mapping.jobs.provider === 'ashby') {
            entry.jobs = await fetchAshbyJobs(mapping.jobs, nowIso);
          } else if (mapping.jobs.provider === 'smartrecruiters') {
            entry.jobs = await fetchSmartRecruitersJobs(mapping.jobs, nowIso);
          } else if (mapping.jobs.provider === 'bamboohr') {
            entry.jobs = await fetchBambooJobs(mapping.jobs, nowIso);
          }
        } catch (error) {
          console.warn(`Jobs fetch failed for ${product.id}`);
        }
      } else if (!ENABLE_JOB_SIGNALS && entry.jobs) {
        entry.jobs = null;
      }

      if (mapping?.funding?.ticker) {
        try {
          entry.funding = await fetchSecFiling(mapping.funding.ticker, nowIso, cikMap);
          await sleep(200);
        } catch (error) {
          console.warn(`Funding fetch failed for ${product.id}`);
        }
      }

      const domainInfo = domainCandidates.get(product.id);
      const matchedDomain = domainInfo?.candidates.find((candidate) => trancoRanks.has(candidate)) ?? null;
      const rank = matchedDomain ? trancoRanks.get(matchedDomain) ?? null : null;

      entry.traffic = {
        provider: 'tranco',
        rank,
        matchedDomain,
        listDate: trancoList.date,
        listId: trancoList.listId,
        source: 'Tranco Top Sites',
        sourceUrl: `https://tranco-list.eu/list/${trancoList.listId}`,
        confidence: confidenceForTraffic(rank),
        provenance: ['Domain match from product website'],
        lastUpdated: nowIso,
        note: rank ? 'Lower rank implies higher traffic.' : 'Domain not found in latest Tranco list.',
      };

      dataset.products[product.id] = entry;
    }

    await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
    console.log(`Saved batch ${batchIndex}/${totalBatches}.`);
  }

  await fs.writeFile(MAPPINGS_PATH, `${JSON.stringify({ products: mappingEntries }, null, 2)}\n`, 'utf8');
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  console.log(`External signals written to ${OUTPUT_PATH.toString()}`);
};

main().catch((error) => {
  console.error('Failed to refresh external signals:', error);
  process.exit(1);
});

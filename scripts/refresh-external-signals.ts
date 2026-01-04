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
  provider: 'greenhouse';
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
  provider: 'greenhouse';
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
    const [rankStr, domain] = line.split(',');
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
    const repoData = await fetchJson<{
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      pushed_at: string;
      html_url: string;
    }>(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    let lastRelease: string | null = null;
    try {
      const release = await fetchJson<{ published_at?: string }>(
        `https://api.github.com/repos/${repo}/releases/latest`,
        { headers: { Accept: 'application/vnd.github+json' } },
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
    const orgData = await fetchJson<{
      public_repos: number;
      followers: number;
      html_url: string;
    }>(`https://api.github.com/orgs/${org}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });

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

  const dataset: ExternalSignalsDataset = {
    updatedAt: nowIso,
    sources: {
      github: { name: 'GitHub API', url: 'https://api.github.com' },
      jobs: { name: 'Greenhouse Jobs API', url: 'https://boards-api.greenhouse.io' },
      traffic: { name: 'Tranco Top Sites', url: 'https://tranco-list.eu' },
      funding: { name: 'SEC EDGAR', url: 'https://www.sec.gov/edgar' },
    },
    products: {},
  };

  const productsSorted = [...PRODUCTS].sort((a, b) => a.id.localeCompare(b.id));

  for (const product of productsSorted) {
    const entry: ExternalSignalsEntry = {};
    const mapping = mappingEntries[product.id];

    if (mapping?.github) {
      try {
        entry.github = await fetchGithubSignal(mapping.github, nowIso);
      } catch (error) {
        console.warn(`GitHub fetch failed for ${product.id}`);
      }
    }

    if (mapping?.jobs) {
      try {
        entry.jobs = await fetchGreenhouseJobs(mapping.jobs, nowIso);
      } catch (error) {
        console.warn(`Jobs fetch failed for ${product.id}`);
      }
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
  console.log(`External signals written to ${OUTPUT_PATH.toString()}`);
};

main().catch((error) => {
  console.error('Failed to refresh external signals:', error);
  process.exit(1);
});

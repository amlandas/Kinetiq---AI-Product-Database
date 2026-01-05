import fs from 'node:fs/promises';

import { CATEGORIES, PRODUCTS } from '../src/data';

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
  products: Record<string, MappingEntry>;
};

const OUTPUT_PATH = new URL('../src/data/externalSignalMappings.json', import.meta.url);
const CONCURRENCY = Number(process.env.MAPPING_CONCURRENCY) || 8;
const FETCH_TIMEOUT_MS = Number(process.env.MAPPING_FETCH_TIMEOUT_MS) || 6000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const ENABLE_GITHUB_SEARCH = Boolean(GITHUB_TOKEN);
const ENABLE_JOB_MAPPINGS = false;
const GITHUB_SEARCH_DELAY_MS = Number(process.env.GITHUB_SEARCH_DELAY_MS) || 2100;

const GITHUB_IGNORE_PREFIXES = [
  'https://github.com/sponsors',
  'https://github.com/topics',
  'https://github.com/blog',
  'https://github.com/features',
  'https://github.com/enterprise',
  'https://github.com/pricing',
  'https://github.com/signup',
  'https://github.com/login',
  'https://github.com/marketplace',
  'https://github.com/apps',
];

const toSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

const getTopProducts = () => {
  const selected = new Map<string, { id: string; name: string; website: string; growth: number }>();

  const sortByGrowth = (a: typeof PRODUCTS[number], b: typeof PRODUCTS[number]) =>
    (b.metrics?.growthRate || 0) - (a.metrics?.growthRate || 0);

  for (const category of CATEGORIES) {
    const catProducts = PRODUCTS.filter((product) => product.category === category.name)
      .sort(sortByGrowth)
      .slice(0, 50);
    catProducts.forEach((product) => {
      selected.set(product.id, {
        id: product.id,
        name: product.name,
        website: product.website,
        growth: product.metrics?.growthRate || 0,
      });
    });

    for (const sub of category.subCategories) {
      const subProducts = PRODUCTS.filter((product) => product.subCategory === sub)
        .sort(sortByGrowth)
        .slice(0, 50);
      subProducts.forEach((product) => {
        selected.set(product.id, {
          id: product.id,
          name: product.name,
          website: product.website,
          growth: product.metrics?.growthRate || 0,
        });
      });
    }
  }

  return Array.from(selected.values());
};

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'KinetiqBot/1.0 (+https://simpleflo.dev)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const sanitizeLink = (link: string) => {
  let cleaned = link
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&apos;|&#39;|&#x27;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  cleaned = cleaned.replace(/[\"')>.,;]+$/g, '').trim();
  return cleaned;
};

const extractLinks = (html: string, pattern: RegExp) => {
  const matches = html.match(pattern);
  if (!matches) return [];
  return matches
    .map((link) => sanitizeLink(link))
    .filter((link) => Boolean(link));
};

const isIgnoredGithubLink = (link: string) => GITHUB_IGNORE_PREFIXES.some((prefix) => link.startsWith(prefix));

const parseGithubLink = (link: string) => {
  if (isIgnoredGithubLink(link)) return null;
  try {
    const url = new URL(link);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { scope: 'repo' as const, repo: `${parts[0]}/${parts[1]}` };
    }
    if (parts.length === 1) {
      return { scope: 'org' as const, org: parts[0] };
    }
    return null;
  } catch {
    return null;
  }
};

const parseGreenhouseLink = (link: string) => {
  try {
    const url = new URL(link);
    if (url.hostname === 'boards.greenhouse.io') {
      const slug = url.pathname.split('/').filter(Boolean)[0];
      return slug ? slug.toLowerCase() : null;
    }
    if (url.hostname === 'boards-api.greenhouse.io') {
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('boards');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
};

const parseLeverLink = (link: string) => {
  try {
    const url = new URL(link);
    if (url.hostname === 'jobs.lever.co') {
      const slug = url.pathname.split('/').filter(Boolean)[0];
      return slug ? slug.toLowerCase() : null;
    }
    return null;
  } catch {
    return null;
  }
};

const parseWorkableLink = (link: string) => {
  try {
    const url = new URL(link);
    if (url.hostname === 'apply.workable.com') {
      const slug = url.pathname.split('/').filter(Boolean)[0];
      return slug ? slug.toLowerCase() : null;
    }
    if (url.hostname.endsWith('.workable.com') && url.hostname !== 'workable.com') {
      const slug = url.hostname.replace('.workable.com', '').toLowerCase();
      return slug || null;
    }
    return null;
  } catch {
    return null;
  }
};

const parseAshbyLink = (link: string) => {
  try {
    const url = new URL(link);
    if (url.hostname === 'jobs.ashbyhq.com') {
      const slug = url.pathname.split('/').filter(Boolean)[0];
      return slug ? slug.toLowerCase() : null;
    }
    return null;
  } catch {
    return null;
  }
};

const parseSmartRecruitersLink = (link: string) => {
  try {
    const url = new URL(link);
    if (url.hostname === 'careers.smartrecruiters.com' || url.hostname === 'www.smartrecruiters.com') {
      const slug = url.pathname.split('/').filter(Boolean)[0];
      return slug ? slug.toLowerCase() : null;
    }
    return null;
  } catch {
    return null;
  }
};

const parseBambooLink = (link: string) => {
  try {
    const url = new URL(link);
    if (url.hostname.endsWith('.bamboohr.com')) {
      const slug = url.hostname.replace('.bamboohr.com', '').toLowerCase();
      return slug || null;
    }
    return null;
  } catch {
    return null;
  }
};

const asyncPool = async <T, R>(
  limit: number,
  items: T[],
  iterator: (item: T, index: number) => Promise<R>,
) => {
  const ret: Promise<R>[] = [];
  const executing: Promise<void>[] = [];
  for (const [index, item] of items.entries()) {
    const p = Promise.resolve().then(() => iterator(item, index));
    ret.push(p);

    if (limit <= items.length) {
      const e = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeWebsite = (website: string) => {
  if (!website) return null;
  try {
    return new URL(website).toString();
  } catch {
    return `https://${website.replace(/^https?:\/\//, '')}`;
  }
};

const mergeMapping = (existing: MappingEntry | undefined, next: MappingEntry) => ({
  github: existing?.github || next.github,
  jobs: existing?.jobs || next.jobs,
  funding: existing?.funding || next.funding,
});

const normalizeGithubRepo = (repo: string) => {
  const cleaned = sanitizeLink(repo);
  const match = cleaned.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  return match ? `${match[1]}/${match[2]}` : null;
};

const normalizeGithubOrg = (org: string) => {
  const cleaned = sanitizeLink(org);
  const match = cleaned.match(/^([A-Za-z0-9_.-]+)$/);
  return match ? match[1] : null;
};

const normalizeExistingMappings = (mappings: ExternalSignalMappings) => {
  const products = mappings.products || {};
  Object.entries(products).forEach(([id, entry]) => {
    if (!entry.github) return;
    const isAuto = entry.github.matchMethod?.startsWith('auto');
    if (!isAuto) return;
    if (entry.github.repo) {
      const normalized = normalizeGithubRepo(entry.github.repo);
      if (!normalized) {
        delete entry.github;
        return;
      }
      entry.github.repo = normalized;
      entry.github.scope = 'repo';
    }
    if (entry.github.org) {
      const normalized = normalizeGithubOrg(entry.github.org);
      if (!normalized) {
        delete entry.github;
        return;
      }
      entry.github.org = normalized;
      entry.github.scope = 'org';
    }
  });
};

const domainCandidatesForWebsite = (website: string) => {
  try {
    const hostname = new URL(website).hostname.replace(/^www\\./, '').toLowerCase();
    const parts = hostname.split('.').filter(Boolean);
    const candidates: string[] = [];
    for (let i = 0; i <= parts.length - 2; i += 1) {
      candidates.push(parts.slice(i).join('.'));
    }
    return candidates;
  } catch {
    return [];
  }
};

const searchGithubRepoByHomepage = async (domain: string) => {
  const query = `"${domain}" in:homepage`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=3&sort=stars&order=desc`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { items?: { full_name?: string; html_url?: string }[] };
  const top = data.items?.[0];
  if (!top?.full_name) return null;
  return { repo: top.full_name };
};

let lastSearchAt = 0;
let searchChain = Promise.resolve<void>(undefined);

const queueGithubSearch = (domain: string) => {
  const task = searchChain.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, GITHUB_SEARCH_DELAY_MS - (now - lastSearchAt));
    if (wait) await sleep(wait);
    const result = await searchGithubRepoByHomepage(domain);
    lastSearchAt = Date.now();
    return result;
  });

  searchChain = task.then(
    () => undefined,
    () => undefined,
  );

  return task;
};

const run = async () => {
  const raw = await fs.readFile(OUTPUT_PATH, 'utf8').catch(() => '');
  const existingMappings: ExternalSignalMappings = raw.trim()
    ? (JSON.parse(raw) as ExternalSignalMappings)
    : { products: {} };

  if (!existingMappings.products) existingMappings.products = {};
  normalizeExistingMappings(existingMappings);
  if (!ENABLE_JOB_MAPPINGS) {
    Object.values(existingMappings.products).forEach((entry) => {
      if (entry.jobs) delete entry.jobs;
    });
  }

  const topProducts = getTopProducts();
  console.log(`Targeting ${topProducts.length} products for mapping coverage.`);
  if (!ENABLE_GITHUB_SEARCH) {
    console.log('GitHub search disabled. Set GITHUB_TOKEN to enable homepage repo discovery.');
  }

  const githubDomainCache = new Map<string, GithubMapping | null>();

  await asyncPool(CONCURRENCY, topProducts, async (product, index) => {
    const mapping = existingMappings.products[product.id];
    if (mapping?.github && (!ENABLE_JOB_MAPPINGS || mapping?.jobs)) return;

    const website = normalizeWebsite(product.website);
    if (!website) return;

    const html = await fetchWithTimeout(website);
    if (!html) return;

    const githubLinks = extractLinks(html, /https?:\/\/github\.com\/[^\s"'()<>]+/gi);
    const greenhouseLinks = ENABLE_JOB_MAPPINGS
      ? extractLinks(html, /https?:\/\/(?:boards-api\.)?greenhouse\.io\/[^\s"'()<>]+/gi)
      : [];
    const leverLinks = ENABLE_JOB_MAPPINGS
      ? extractLinks(html, /https?:\/\/jobs\.lever\.co\/[^\s"'()<>]+/gi)
      : [];
    const workableLinks = ENABLE_JOB_MAPPINGS
      ? extractLinks(
          html,
          /https?:\/\/(?:apply\.)?workable\.com\/[^\s"'()<>]+|https?:\/\/[a-z0-9-]+\.workable\.com\/[^\s"'()<>]*/gi,
        )
      : [];
    const ashbyLinks = ENABLE_JOB_MAPPINGS
      ? extractLinks(html, /https?:\/\/jobs\.ashbyhq\.com\/[^\s"'()<>]+/gi)
      : [];
    const smartRecruitersLinks = ENABLE_JOB_MAPPINGS
      ? extractLinks(html, /https?:\/\/(?:careers\.smartrecruiters\.com|www\.smartrecruiters\.com)\/[^\s"'()<>]+/gi)
      : [];
    const bambooLinks = ENABLE_JOB_MAPPINGS
      ? extractLinks(html, /https?:\/\/[a-z0-9-]+\.bamboohr\.com(?:\/[^\s"'()<>]*)?/gi)
      : [];

    let githubMapping: GithubMapping | undefined;
    for (const link of githubLinks) {
      const parsed = parseGithubLink(link);
      if (parsed?.scope === 'repo' && parsed.repo) {
        githubMapping = { scope: 'repo', repo: parsed.repo, matchMethod: 'auto-website' };
        break;
      }
      if (!githubMapping && parsed?.scope === 'org' && parsed.org) {
        githubMapping = { scope: 'org', org: parsed.org, matchMethod: 'auto-website' };
      }
    }

    if (!githubMapping && ENABLE_GITHUB_SEARCH) {
      const candidates = domainCandidatesForWebsite(website);
      for (const candidate of candidates) {
        if (githubDomainCache.has(candidate)) {
          const cached = githubDomainCache.get(candidate);
          if (cached) githubMapping = cached;
          break;
        }
        const result = await queueGithubSearch(candidate);
        if (result?.repo) {
          githubMapping = { scope: 'repo', repo: result.repo, matchMethod: 'auto-homepage-search' };
          githubDomainCache.set(candidate, githubMapping);
          break;
        }
        githubDomainCache.set(candidate, null);
      }
    }

    let jobsMapping: JobsMapping | undefined;
    if (ENABLE_JOB_MAPPINGS) {
      for (const link of greenhouseLinks) {
        const slug = parseGreenhouseLink(link);
        if (slug) {
          jobsMapping = { provider: 'greenhouse', company: slug, matchMethod: 'auto-website' };
          break;
        }
      }
      if (!jobsMapping) {
        for (const link of ashbyLinks) {
          const slug = parseAshbyLink(link);
          if (slug) {
            jobsMapping = { provider: 'ashby', company: slug, matchMethod: 'auto-website' };
            break;
          }
        }
      }
      if (!jobsMapping) {
        for (const link of workableLinks) {
          const slug = parseWorkableLink(link);
          if (slug) {
            jobsMapping = { provider: 'workable', company: slug, matchMethod: 'auto-website' };
            break;
          }
        }
      }
      if (!jobsMapping) {
        for (const link of smartRecruitersLinks) {
          const slug = parseSmartRecruitersLink(link);
          if (slug) {
            jobsMapping = { provider: 'smartrecruiters', company: slug, matchMethod: 'auto-website' };
            break;
          }
        }
      }
      if (!jobsMapping) {
        for (const link of bambooLinks) {
          const slug = parseBambooLink(link);
          if (slug) {
            jobsMapping = { provider: 'bamboohr', company: slug, matchMethod: 'auto-website' };
            break;
          }
        }
      }
      if (!jobsMapping) {
        for (const link of leverLinks) {
          const slug = parseLeverLink(link);
          if (slug) {
            jobsMapping = { provider: 'lever', company: slug, matchMethod: 'auto-website' };
            break;
          }
        }
      }
    }

    if (!githubMapping && !jobsMapping) return;

    const updated = mergeMapping(mapping, { github: githubMapping, jobs: jobsMapping });
    existingMappings.products[product.id] = updated;

    if ((index + 1) % 50 === 0) {
      console.log(`Processed ${index + 1}/${topProducts.length} products...`);
    }
  });

  const sortedEntries = Object.entries(existingMappings.products).sort(([a], [b]) => a.localeCompare(b));
  const sortedMappings: ExternalSignalMappings = {
    products: Object.fromEntries(sortedEntries),
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(sortedMappings, null, 2)}\n`, 'utf8');
  console.log('Updated externalSignalMappings.json with auto-discovered coverage.');
};

run().catch((error) => {
  console.error('Failed to build mappings:', error);
  process.exit(1);
});

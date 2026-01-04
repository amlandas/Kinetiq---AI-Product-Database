import { useEffect, useState } from 'react';

export type FeatureFlags = {
  externalSignalsAnalytics: boolean;
};

const DEFAULT_FLAGS: FeatureFlags = {
  externalSignalsAnalytics: process.env.NEXT_PUBLIC_FEATURE_EXTERNAL_SIGNALS_ANALYTICS === 'true',
};

let cachedFlags: FeatureFlags = { ...DEFAULT_FLAGS };
let pendingRequest: Promise<FeatureFlags> | null = null;

const fetchFeatureFlags = async (): Promise<FeatureFlags> => {
  if (pendingRequest) return pendingRequest;
  pendingRequest = fetch('/api/feature-flags', { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) throw new Error('Failed to load feature flags');
      return response.json() as Promise<FeatureFlags>;
    })
    .then((flags) => {
      cachedFlags = { ...DEFAULT_FLAGS, ...flags };
      pendingRequest = null;
      return cachedFlags;
    })
    .catch((error) => {
      pendingRequest = null;
      console.warn('[featureFlags] Falling back to defaults', error);
      return cachedFlags;
    });
  return pendingRequest;
};

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>(cachedFlags);

  useEffect(() => {
    let isMounted = true;
    fetchFeatureFlags().then((nextFlags) => {
      if (isMounted) setFlags(nextFlags);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return flags;
};

export const featureFlags = {
  externalSignalsAnalytics: process.env.NEXT_PUBLIC_FEATURE_EXTERNAL_SIGNALS === 'true',
};

export const isExternalSignalsAnalyticsEnabled = () => featureFlags.externalSignalsAnalytics;

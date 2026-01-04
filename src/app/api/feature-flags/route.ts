export async function GET() {
  const flags = {
    externalSignalsAnalytics: process.env.FEATURE_EXTERNAL_SIGNALS_ANALYTICS === 'true',
  };

  return Response.json(flags, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

// Weekly snapshot cadence for analytics trendlines.
// Replace this with a persisted snapshot file when weekly captures are automated.
export const WEEKLY_SNAPSHOT_DATES = (() => {
  const weeks = 8;
  const anchor = new Date();
  anchor.setUTCHours(12, 0, 0, 0);
  const start = new Date(anchor);
  start.setUTCDate(start.getUTCDate() - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index * 7);
    return date.toISOString().slice(0, 10);
  });
})();

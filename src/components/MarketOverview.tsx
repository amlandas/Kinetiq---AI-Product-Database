import React, { useMemo, useState } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../data';
import analyticsSnapshots from '../data/analyticsSnapshots.json';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface MarketOverviewProps {
  products: Product[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];
const RANGE_OPTIONS = [8, 12, 24] as const;

type RangeOption = typeof RANGE_OPTIONS[number];

type AnalyticsSnapshot = {
  date: string;
  products: {
    id: string;
    growthRate: number;
    lastUpdate: string;
  }[];
};

const toNumber = (value: number | undefined) => (Number.isFinite(value) ? Number(value) : 0);

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const daysSince = (dateStr: string, referenceDate?: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  const reference = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(reference.getTime())) return null;
  const diffMs = reference.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const formatSnapshotLabel = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const MarketOverview: React.FC<MarketOverviewProps> = ({ products }) => {
  const [rangeWeeks, setRangeWeeks] = useState<RangeOption>(8);
  const totalProducts = products.length;
  const filteredProductIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);

  const categoryData = CATEGORIES.map((cat) => ({
    name: cat.name,
    value: products.filter((p) => p.category === cat.name).length,
  })).filter((d) => d.value > 0);

  const growthRates = products.map((p) => toNumber(p.metrics.growthRate));
  const medianGrowth = median(growthRates);

  const recencyDays = products
    .map((p) => daysSince(p.lastUpdate))
    .filter((value): value is number => value !== null);
  const medianRecency = median(recencyDays);
  const updatedLast90 = recencyDays.filter((d) => d <= 90).length;

  const pricingCounts = products.reduce<Record<string, number>>((acc, product) => {
    product.pricing.forEach((model) => {
      acc[model] = (acc[model] || 0) + 1;
    });
    return acc;
  }, {});
  const pricingData = Object.entries(pricingCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topGrowthProducts = [...products]
    .sort((a, b) => toNumber(b.metrics.growthRate) - toNumber(a.metrics.growthRate))
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      growth: toNumber(p.metrics.growthRate),
    }));

  const freshnessBuckets = [
    { label: '0-30d', min: 0, max: 30 },
    { label: '31-90d', min: 31, max: 90 },
    { label: '91-180d', min: 91, max: 180 },
    { label: '181-365d', min: 181, max: 365 },
    { label: '365d+', min: 366, max: Infinity },
  ];
  const freshnessData = freshnessBuckets.map((bucket) => ({
    name: bucket.label,
    value: recencyDays.filter((d) => d >= bucket.min && d <= bucket.max).length,
  }));

  const totalUsers = products.reduce((acc, p) => acc + toNumber(p.metrics.totalUsers), 0);
  const topPricingModel = pricingData[0]?.name ?? 'N/A';

  const snapshotMeta = useMemo(() => {
    const snapshots = [...(analyticsSnapshots as AnalyticsSnapshot[])].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    if (snapshots.length === 0) {
      return { snapshots, series: [], latest: null, effectiveRange: 0 };
    }

    const effectiveRange = Math.min(rangeWeeks, snapshots.length);
    const range = snapshots.slice(-effectiveRange);
    const series = range.map((snapshot) => {
      const relevantProducts = snapshot.products.filter((product) =>
        filteredProductIds.has(product.id),
      );

      const growthSnapshot = relevantProducts.map((product) => toNumber(product.growthRate));
      const recencySnapshot = relevantProducts
        .map((product) => daysSince(product.lastUpdate, snapshot.date))
        .filter((value): value is number => value !== null);

      return {
        date: snapshot.date,
        label: formatSnapshotLabel(snapshot.date),
        medianGrowth: median(growthSnapshot),
        medianRecency: median(recencySnapshot),
        totalProducts: relevantProducts.length,
      };
    });

    return { snapshots, series, latest: snapshots[snapshots.length - 1], effectiveRange };
  }, [filteredProductIds, rangeWeeks]);

  if (totalProducts === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-800 dark:text-gray-300">
        No products match the current filters. Try loosening your filters to see analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
        Analytics reflect your current filters and search. You are looking at {totalProducts} products. Trendlines use
        weekly dataset snapshots.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Filtered Products</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(totalUsers)} total estimated users in view.
          </p>
        </div>
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Median Growth Rate</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(medianGrowth)}%</p>
          <p className="text-xs text-gray-500 mt-2">Growth is the primary signal in this view.</p>
        </div>
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Median Data Recency</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(medianRecency)}d</p>
          <p className="text-xs text-gray-500 mt-2">
            {updatedLast90} of {recencyDays.length} updated in the last 90 days.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly trendlines</h3>
              <p className="text-xs text-gray-500 mt-1">
                Trendlines reflect weekly snapshot history of the current filtered set.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>
                Last capture:{' '}
                {snapshotMeta.latest ? formatSnapshotLabel(snapshotMeta.latest.date) : 'Not yet captured'}
              </span>
              <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-dark-900">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setRangeWeeks(option)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      rangeWeeks === option
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-800 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {option}w
                  </button>
                ))}
              </div>
            </div>
          </div>
          {snapshotMeta.series.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
              No weekly snapshots found yet. Run <code className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-dark-800">npm run snapshot:analytics</code>{' '}
              to capture the first entry.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshotMeta.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    formatter={(value: number) => [`${Math.round(value)}%`, 'Median growth']}
                  />
                  <Line type="monotone" dataKey="medianGrowth" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshotMeta.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    formatter={(value: number) => [`${Math.round(value)} days`, 'Median recency']}
                  />
                  <Line type="monotone" dataKey="medianRecency" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Growth Leaders</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topGrowthProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Growth']}
                />
                <Bar dataKey="growth" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Market Distribution by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Freshness (last update)</h3>
            <span className="text-xs text-gray-500">Top model: {topPricingModel}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freshnessData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  formatter={(value: number) => [value, 'Products']}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Freshness reflects the last time our dataset recorded a change for the product. It is a recency signal, not
            a guarantee of vendor release dates or completeness.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Pricing Model Mix</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pricingData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Pricing distribution counts every model a product advertises. Use this to understand common pricing patterns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;

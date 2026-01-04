import React from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../data';
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
} from 'recharts';

interface MarketOverviewProps {
  products: Product[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

const toNumber = (value: number | undefined) => (Number.isFinite(value) ? Number(value) : 0);

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const daysSince = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const MarketOverview: React.FC<MarketOverviewProps> = ({ products }) => {
  const totalProducts = products.length;

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
        Analytics reflect your current filters and search. You are looking at {totalProducts} products.
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

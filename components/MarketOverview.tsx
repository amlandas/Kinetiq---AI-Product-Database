import React from 'react';
import { Product, Category } from '../types';
import { CATEGORIES } from '../data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface MarketOverviewProps {
  products: Product[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

const MarketOverview: React.FC<MarketOverviewProps> = ({ products }) => {
  // 1. Calculate Category Distribution
  const categoryData = CATEGORIES.map(cat => ({
    name: cat.name,
    value: products.filter(p => p.category === cat.name).length
  })).filter(d => d.value > 0);

  // 2. Top Products by Users
  const topProducts = [...products]
    .sort((a, b) => b.metrics.totalUsers - a.metrics.totalUsers)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      users: p.metrics.totalUsers
    }));

  // 3. Mock Growth Trends (Simulated over 6 months)
  const growthData = [
    { month: 'Jan', users: 150000000 },
    { month: 'Feb', users: 180000000 },
    { month: 'Mar', users: 220000000 },
    { month: 'Apr', users: 280000000 },
    { month: 'May', users: 350000000 },
    { month: 'Jun', users: 450000000 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Total Products</h3>
           <p className="text-3xl font-bold text-gray-900 dark:text-white">{products.length}</p>
           <span className="text-xs text-green-600 flex items-center mt-1">
             <span className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded mr-1">+12%</span>
             vs last month
           </span>
        </div>
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Total Estimated Users</h3>
           <p className="text-3xl font-bold text-gray-900 dark:text-white">
             {new Intl.NumberFormat('en-US', { notation: "compact" }).format(products.reduce((acc, p) => acc + p.metrics.totalUsers, 0))}
           </p>
           <span className="text-xs text-green-600 flex items-center mt-1">
             <span className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded mr-1">+8.5%</span>
             vs last month
           </span>
        </div>
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
           <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Avg Growth Rate</h3>
           <p className="text-3xl font-bold text-gray-900 dark:text-white">
             {Math.round(products.reduce((acc, p) => acc + p.metrics.growthRate, 0) / products.length)}%
           </p>
           <span className="text-xs text-blue-600 flex items-center mt-1">
             MoM Growth
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
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

        {/* Top Products Bar Chart */}
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top 5 Products by User Base</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
                <Bar dataKey="users" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Trend Line Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Total AI User Growth (Estimated)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={growthData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(value)} tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;

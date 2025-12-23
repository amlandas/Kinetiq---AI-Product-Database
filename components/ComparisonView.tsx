import React from 'react';
import { Product } from '../types';
import { X, Check, Minus } from 'lucide-react';

interface ComparisonViewProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ products, onRemove, onClear }) => {
  if (products.length === 0) return null;

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 animate-slide-up">
      <div className="p-4 bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Product Comparison</h2>
        <button onClick={onClear} className="text-sm text-red-600 hover:text-red-700 font-medium">Clear All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className="p-4 w-40 bg-gray-50 dark:bg-dark-900/50 sticky left-0 z-10 border-r border-gray-100 dark:border-gray-700"></th>
              {products.map(p => (
                <th key={p.id} className="p-4 min-w-[200px] border-b border-gray-100 dark:border-gray-700 relative">
                  <div className="flex flex-col items-center text-center">
                    <button 
                      onClick={() => onRemove(p.id)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <img src={p.logoUrl} alt={p.name} className="w-12 h-12 rounded-lg mb-2 object-cover" />
                    <h3 className="font-bold text-gray-900 dark:text-white">{p.name}</h3>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">Category</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center text-gray-700 dark:text-gray-300">{p.category} / {p.subCategory}</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">Pricing</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {p.pricing.map(price => (
                      <span key={price} className="px-2 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-xs text-gray-600 dark:text-gray-300">{price}</span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">Rating</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center text-yellow-600 font-medium">{p.metrics.rating}/5.0</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">Users</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center text-gray-700 dark:text-gray-300">
                  {new Intl.NumberFormat('en-US', { notation: "compact" }).format(p.metrics.totalUsers)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">API Access</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center">
                  {p.tags.includes('API Available') || p.category === 'Development' 
                    ? <Check className="w-5 h-5 text-green-500 mx-auto" /> 
                    : <Minus className="w-5 h-5 text-gray-300 mx-auto" />
                  }
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonView;

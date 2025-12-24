import React from 'react';
import { Product } from '../types';
import { X, ChevronUp } from 'lucide-react';

interface ComparisonViewProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCompareNow: () => void; // Trigger navigation
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ products, onRemove, onClear, onCompareNow }) => {
  if (products.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-dark-800/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-t border-gray-200 dark:border-gray-700 animate-slide-up transform transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Thumbnails Section */}
        <div className="flex items-center space-x-4 overflow-x-auto pb-1 no-scrollbar">
          <div className="hidden md:flex flex-col mr-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Compare</span>
            <span className="text-xs text-gray-500">{products.length} selected</span>
          </div>

          <div className="flex items-center space-x-2">
            {products.map(p => (
              <div key={p.id} className="relative group shrink-0">
                <img
                  src={p.logoUrl}
                  alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-200 dark:border-gray-600"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Placeholder Empty Slots (Visual hint that you can add more) */}
            {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent hidden sm:block"></div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onClear}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2"
          >
            Clear
          </button>
          <button
            onClick={onCompareNow}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
          >
            <span>Compare Now</span>
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;

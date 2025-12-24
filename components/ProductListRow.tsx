import React from 'react';
import { Product } from '../types';
import { Star, Users, TrendingUp, ChevronRight, Heart } from 'lucide-react';

interface ProductListRowProps {
  product: Product;
  onClick: (product: Product) => void;
  onCompare: (product: Product) => void;
  isSelectedForComparison: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const ProductListRow: React.FC<ProductListRowProps> = ({ product, onClick, onCompare, isSelectedForComparison, isFavorite, onToggleFavorite }) => {
  return (
    <div
      onClick={() => onClick(product)}
      className="group bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors p-4 flex items-center justify-between cursor-pointer last:border-0"
    >
      <div className="flex items-center flex-1 min-w-0 mr-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 mr-4">
          <img src={product.logoUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{product.name}</h4>
          <div className="flex items-center text-xs text-gray-500 space-x-2">
            <span>{product.companyId}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="text-primary-600 dark:text-primary-400">{product.subCategory}</span>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300 mr-8">
        <div className="flex flex-col items-end w-20">
          <span className="text-xs text-gray-400">Users</span>
          <span className="font-medium flex items-center">
            <Users className="w-3 h-3 mr-1 text-gray-400" />
            {new Intl.NumberFormat('en-US', { notation: "compact" }).format(product.metrics.totalUsers)}
          </span>
        </div>
        <div className="flex flex-col items-end w-20">
          <span className="text-xs text-gray-400">Rating</span>
          <span className="font-medium flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
            {product.metrics.rating}
          </span>
        </div>
        <div className="flex flex-col items-end w-20">
          <span className="text-xs text-gray-400">Growth</span>
          <span className="font-medium flex items-center text-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            {product.metrics.growthRate}%
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
          className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCompare(product); }}
          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${isSelectedForComparison
              ? 'bg-primary-600 text-white border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
        >
          {isSelectedForComparison ? 'Added' : 'Compare'}
        </button>
        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
      </div>
    </div>
  );
};

export default ProductListRow;

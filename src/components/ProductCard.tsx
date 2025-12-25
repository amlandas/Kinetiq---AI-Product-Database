import React from 'react';
import { Product } from '../types';
import { Star, Users, TrendingUp, Heart } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  onCompare: (product: Product) => void;
  isSelectedForComparison: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onCompare, isSelectedForComparison, isFavorite, onToggleFavorite }) => {
  return (
    <div className="group bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden">
      <div className="p-5 flex-1 cursor-pointer" onClick={() => onClick(product)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
              <img src={product.logoUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <Link href={`/product/${product.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">{product.companyId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors group/fav"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300 dark:text-gray-600 group-hover/fav:text-red-400'}`} />
            </button>
            <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs font-medium text-green-700 dark:text-green-400">
              <Star className="w-3 h-3 mr-1 fill-current" />
              {product.metrics.rating}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {product.category}
          </span>
          {product.pricing.map((p, i) => (
            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-dark-900/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-3">
          <div className="flex items-center" title="Total Users">
            <Users className="w-3.5 h-3.5 mr-1" />
            {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(product.metrics.totalUsers)}
          </div>
          <div className="flex items-center text-green-600 dark:text-green-400" title="Growth Rate">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            {product.metrics.growthRate}%
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onCompare(product); }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${isSelectedForComparison
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700'
            }`}
        >
          {isSelectedForComparison ? 'Selected' : 'Compare'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

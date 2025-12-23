import React from 'react';
import { CATEGORIES } from '../data';
import { LayoutGrid, BarChart2, Briefcase, Tag, Filter } from 'lucide-react';
import { Category, FilterState } from '../types';

interface SidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters, isOpen, className }) => {
  const handleCategoryClick = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? null : category,
      subCategory: null // Reset sub-category when changing main category
    }));
  };

  const handleSubCategoryClick = (sub: string) => {
    setFilters(prev => ({
      ...prev,
      subCategory: prev.subCategory === sub ? null : sub
    }));
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:static ${className}
    `}>
      <div className="h-full flex flex-col overflow-y-auto p-4">
        <div className="flex items-center space-x-2 mb-8 px-2">
          <div className="bg-primary-600 p-2 rounded-lg">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">AI Nexus</span>
        </div>

        <nav className="space-y-6 flex-1">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Categories</h3>
            <ul className="space-y-1">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded-md transition-colors ${
                      filters.category === cat.name
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-900'
                    }`}
                  >
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full px-2 py-0.5">
                      {cat.subCategories.length}
                    </span>
                  </button>
                  
                  {filters.category === cat.name && (
                    <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                      {cat.subCategories.map((sub) => (
                        <li key={sub}>
                          <button
                            onClick={() => handleSubCategoryClick(sub)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                              filters.subCategory === sub
                                ? 'text-primary-600 font-medium'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                          >
                            {sub}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Filters</h3>
            <div className="space-y-4 px-2">
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Min Rating: {filters.minRating}+</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700 px-2">
          <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
             <Filter className="w-4 h-4" />
             <span>Reset All Filters</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

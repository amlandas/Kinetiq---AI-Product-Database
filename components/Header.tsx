import React from 'react';
import { Search, Bell, Sun, Moon, Grid, List, Table as TableIcon, Menu, ArrowUpDown } from 'lucide-react';
import { FilterState } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: 'grid' | 'list' | 'table';
  setViewMode: (mode: 'grid' | 'list' | 'table') => void;
  isDark: boolean;
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  filters,
  setFilters,
  viewMode,
  setViewMode,
  isDark,
  toggleTheme,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onMenuClick} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>

          {/* Mobile Title (Visible only on small screens) */}
          <span className="md:hidden text-lg font-bold text-gray-900 dark:text-white">Kinetiq</span>

          <div className="relative w-full max-w-xl hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Search products, companies, or tags..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex bg-gray-100 dark:bg-dark-900 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'products'
                ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
            >
              Products
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
                className="appearance-none bg-gray-100 dark:bg-dark-900 border-none text-sm font-medium text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:ring-1 focus:ring-primary-500"
              >
                <option value="users-desc">Most Users</option>
                <option value="users-asc">Fewest Users</option>
                <option value="growth-desc">Fastest Growing</option>
                <option value="growth-asc">Slowest Growing</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="company-asc">Company (A-Z)</option>
                <option value="company-desc">Company (Z-A)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

          {activeTab === 'products' && (
            <div className="flex items-center bg-gray-100 dark:bg-dark-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-800 shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-800 shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-dark-800 shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-900 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="mt-3 sm:hidden relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>

      {/* Mobile Tabs */}
      <div className="mt-3 flex md:hidden space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full border ${activeTab === 'products'
            ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300'
            : 'bg-white border-gray-200 text-gray-600 dark:bg-dark-800 dark:border-gray-700 dark:text-gray-400'
            }`}
        >
          Products
        </button>
      </div>
    </header>
  );
};

export default Header;
"use client";

import React from 'react';
import Link from 'next/link';
import { Search, Bell, Sun, Moon, Grid, List, Table as TableIcon, Menu, ArrowUpDown, Sparkles } from 'lucide-react';
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
  searchRef: React.RefObject<HTMLInputElement>;
  onSearchSubmit?: (value: string) => void;
}

// Simple debounce hook could be extracted, but keeping it inline for simplicity
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  filters,
  setFilters,
  viewMode,
  setViewMode,
  isDark,
  toggleTheme,
  activeTab,
  setActiveTab,
  searchRef,
  onSearchSubmit
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

          <div className="relative w-full max-w-md hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={searchRef}
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Search products, companies, or tags..."
              value={filters.search}
              title={filters.search} // Tooltip for long queries
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearchSubmit) {
                  onSearchSubmit(e.currentTarget.value);
                }
              }}
            />
            {/* Filter Count Badge (Usability Fix) */}
            {(filters.category.length > 0 || filters.pricing.length > 0 || filters.minRating > 0) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full border border-primary-200">
                  {(filters.category.length + filters.pricing.length + (filters.minRating > 0 ? 1 : 0))}
                </span>
              </div>
            )}
          </div>

          <a
            href="https://simpleflo.dev"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-dark-900 transition-colors"
            aria-label="Go to simpleflo home"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-900/30 dark:text-primary-300">
              sf
            </span>
            <span>simpleflo</span>
          </a>

          <nav className="flex items-center gap-2">
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-dark-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-dark-900 transition-colors"
            >
              Docs
            </Link>
          </nav>
        </div>

        {/* Prominent Matchmaker Button (Top Center) */}
        <button
          onClick={() => setActiveTab('matchmaker')}
          className={`
            hidden lg:flex items-center gap-2.5 px-8 py-3 rounded-full font-bold text-base tracking-wide shadow-lg transition-all duration-300 transform hover:scale-105
            bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white
            shadow-purple-500/30 hover:shadow-purple-500/50 border border-white/20
            ${activeTab === 'matchmaker' ? 'ring-2 ring-offset-2 ring-fuchsia-500' : ''}
          `}
        >
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          <span>Ask AI Matchmaker</span>
        </button>

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
            {/* Matchmaker Removed */}
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'comparison'
                ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
            >
              Compare
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'analytics'
                ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
            >
              Analytics
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-1">Sort By</span>
            <div className="relative">
              <select
                value={filters.sort.primary}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: { ...prev.sort, primary: e.target.value as any } }))}
                className="appearance-none bg-gray-100 dark:bg-dark-900 border-none text-xs font-medium text-gray-700 dark:text-gray-200 py-1.5 pl-2 pr-6 rounded-lg cursor-pointer focus:ring-1 focus:ring-primary-500 w-28"
                title="Primary Sort"
              >
                <option value="users-desc">Users (High)</option>
                <option value="users-asc">Users (Low)</option>
                <option value="growth-desc">Growth (Fast)</option>
                <option value="growth-asc">Growth (Slow)</option>
                <option value="rating-desc">Rating (High)</option>
                <option value="rating-asc">Rating (Low)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
            <span className="text-xs text-gray-400">then</span>
            <div className="relative">
              <select
                value={filters.sort.secondary}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: { ...prev.sort, secondary: e.target.value as any } }))}
                className="appearance-none bg-gray-100 dark:bg-dark-900 border-none text-xs font-medium text-gray-700 dark:text-gray-200 py-1.5 pl-2 pr-6 rounded-lg cursor-pointer focus:ring-1 focus:ring-primary-500 w-28"
                title="Secondary Sort"
              >
                <option value="users-desc">Users</option>
                <option value="growth-desc">Growth</option>
                <option value="rating-desc">Rating</option>
                <option value="name-asc">Name</option>
              </select>
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
          onClick={() => setActiveTab('matchmaker')}
          className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full border flex items-center gap-1 ${activeTab === 'matchmaker'
            ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
            : 'bg-white border-gray-200 text-gray-600 dark:bg-dark-800 dark:border-gray-700 dark:text-gray-400'
            }`}
        >
          <Sparkles className="w-3 h-3" />
          Ask AI
        </button>
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

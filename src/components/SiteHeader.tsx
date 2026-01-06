"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import type { FilterState } from '../types';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  searchFields: [],
  category: [],
  subCategory: null,
  pricing: [],
  minRating: 0,
  minGrowth: 0,
  dateRange: { start: '', end: '' },
  sort: { primary: 'users-desc', secondary: 'rating-desc' },
};

const SiteHeader = () => {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState('products');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'products') {
      router.push('/');
      return;
    }
    router.push(`/?tab=${encodeURIComponent(tab)}`);
  };

  const handleSearchSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      router.push('/');
      return;
    }
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <Header
      onMenuClick={() => {}}
      filters={filters}
      setFilters={setFilters}
      viewMode={viewMode}
      setViewMode={setViewMode}
      isDark={isDark}
      toggleTheme={toggleTheme}
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      searchRef={searchRef}
      onSearchSubmit={handleSearchSubmit}
    />
  );
};

export default SiteHeader;

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProductCard from './components/ProductCard';
import ProductListRow from './components/ProductListRow';
import ProductModal from './components/ProductModal';
import MarketOverview from './components/MarketOverview';
import ComparisonView from './components/ComparisonView';
import ComparisonPage from './components/ComparisonPage';
import { Product, FilterState, ComparisonResult } from './types';
import { Table, Database, Sparkles, CheckCircle, Server, Loader2, Share2, Download } from 'lucide-react';
import { db } from './services/db';
import { crawler, CrawlStatus } from './services/crawler';

const App: React.FC = () => {
  // Theme State
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

  // App State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // AI Comparison State (Lifted)
  const [aiData, setAiData] = useState<ComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 48;

  // Data State
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Initialization State
  const [initStatus, setInitStatus] = useState<CrawlStatus>('idle');
  const [initProgress, setInitProgress] = useState(0);
  const [initTask, setInitTask] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    searchFields: [], // Empty means all
    category: [],
    subCategory: null,
    pricing: [],
    minRating: 0,
    minGrowth: 0,
    dateRange: { start: '', end: '' },
    sort: { primary: 'users-desc', secondary: 'rating-desc' }
  });

  // URL SYNC & FAVORITES PERSISTENCE
  useEffect(() => {
    // Load favorites
    const savedFavs = localStorage.getItem('kinetiq_favorites');
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch (e) { }
    }

    // Load URL params (Initial Load)
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      setFilters(prev => ({
        ...prev,
        search: params.get('q') || '',
        category: params.get('cat') ? params.get('cat')!.split(',') : [],
        pricing: params.get('price') ? params.get('price')!.split(',') : [],
        minRating: Number(params.get('rating') || 0),
        minGrowth: Number(params.get('growth') || 0),
        dateRange: {
          start: params.get('start') || '',
          end: params.get('end') || ''
        },
        searchFields: params.get('fields') ? (params.get('fields')!.split(',') as any) : [],
        sort: {
          primary: (params.get('sort') as any) || 'users-desc',
          secondary: (params.get('sort2') as any) || 'rating-desc'
        }
      }));
    }
  }, []);

  // Sync URL on Filter Change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.category.length > 0) params.set('cat', filters.category.join(','));
    if (filters.pricing.length > 0) params.set('price', filters.pricing.join(','));
    if (filters.minRating > 0) params.set('rating', filters.minRating.toString());
    if (filters.minGrowth > 0) params.set('growth', filters.minGrowth.toString());
    if (filters.dateRange.start) params.set('start', filters.dateRange.start);
    if (filters.dateRange.end) params.set('end', filters.dateRange.end);
    if (filters.searchFields.length > 0) params.set('fields', filters.searchFields.join(','));
    if (filters.sort.primary !== 'users-desc') params.set('sort', filters.sort.primary);
    if (filters.sort.secondary !== 'rating-desc') params.set('sort2', filters.sort.secondary);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
    setCurrentPage(1); // Reset page on filter change
  }, [filters]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('kinetiq_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const handleExport = () => {
    if (filteredProducts.length === 0) return;

    // Convert to CSV
    const headers = ['Name', 'Company', 'Category', 'SubCategory', 'Rating', 'Users', 'Growth', 'Pricing', 'Website'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(p => [
        `"${p.name}"`,
        `"${p.companyId}"`,
        `"${p.category}"`,
        `"${p.subCategory}"`,
        p.metrics.rating,
        p.metrics.totalUsers,
        `${p.metrics.growthRate}%`,
        `"${p.pricing.join(';')}"`,
        p.website
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `kinetiq_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // SYSTEM STARTUP
  useEffect(() => {
    // 1. Load initial data if available (Snapshots)
    // The db.seed() will now load the V6 curated list
    const cachedData = db.seed();
    setAllProducts(cachedData);
    setTotalProducts(cachedData.length);

    // 2. Subscribe to crawler updates
    const unsubscribe = crawler.subscribe((state) => {
      setInitStatus(state.status);
      setInitProgress(state.progress);
      setInitTask(state.currentTask);

      // Real-time update of the product list as it grows
      if (state.totalProductsFound > 0 && state.status === 'crawling') {
        const updatedData = db.load();
        if (updatedData) setAllProducts(updatedData);
      }

      // Final sync on complete
      if (state.status === 'complete') {
        const finalData = db.load();
        if (finalData) setAllProducts(finalData);
      }
    });

    // 3. Trigger System Initialization
    // If DB version is new, this won't crawl (unless empty). 
    // If >7 days passed, it will trigger background crawl.
    crawler.initializeSystem();

    return () => unsubscribe();
  }, []);

  // Keyboard Shortcuts
  const searchFocusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search Focus (/)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchFocusRef.current?.focus();
      }

      // Escape actions
      if (e.key === 'Escape') {
        if (selectedProduct) setSelectedProduct(null);
        else if (isSidebarOpen) setIsSidebarOpen(false);
        else if (comparisonList.length > 0) setComparisonList([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, isSidebarOpen, comparisonList]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = allProducts.filter(product => {
      // Advanced Search Logic
      let matchesSearch = true;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchIn = filters.searchFields.length > 0 ? filters.searchFields : ['name', 'description', 'company'];

        matchesSearch = searchIn.some(field => {
          if (field === 'name') return product.name.toLowerCase().includes(searchLower);
          if (field === 'description') return product.description.toLowerCase().includes(searchLower);
          if (field === 'company') return product.companyId.toLowerCase().includes(searchLower);
          return false;
        });
      }
      const matchesCategory = filters.category.length > 0 ? filters.category.includes(product.category) : true;
      const matchesSubCategory = filters.subCategory ? product.subCategory === filters.subCategory : true;
      const matchesRating = Number(product.metrics.rating) >= Number(filters.minRating);
      const matchesPricing = filters.pricing.length > 0
        ? product.pricing.some(p => filters.pricing.includes(p))
        : true;

      const matchesGrowth = product.metrics.growthRate >= filters.minGrowth;

      // Date Range Logic
      let matchesDate = true;
      if (filters.dateRange.start || filters.dateRange.end) {
        const productDate = new Date(product.launchDate);
        if (filters.dateRange.start) {
          matchesDate = matchesDate && productDate >= new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          matchesDate = matchesDate && productDate <= new Date(filters.dateRange.end);
        }
      }

      return matchesSearch && matchesCategory && matchesSubCategory && matchesRating && matchesGrowth && matchesPricing && matchesDate;
    });

    // Multi-Criteria Sort Logic - Optimized
    const getComparator = (sortOption: string) => {
      switch (sortOption) {
        case 'name-asc': return (a: Product, b: Product) => a.name.localeCompare(b.name);
        case 'name-desc': return (a: Product, b: Product) => b.name.localeCompare(a.name);
        case 'company-asc': return (a: Product, b: Product) => a.companyId.localeCompare(b.companyId);
        case 'company-desc': return (a: Product, b: Product) => b.companyId.localeCompare(a.companyId);
        case 'users-asc': return (a: Product, b: Product) => a.metrics.totalUsers - b.metrics.totalUsers;
        case 'users-desc': return (a: Product, b: Product) => b.metrics.totalUsers - a.metrics.totalUsers;
        case 'growth-asc': return (a: Product, b: Product) => a.metrics.growthRate - b.metrics.growthRate;
        case 'growth-desc': return (a: Product, b: Product) => b.metrics.growthRate - a.metrics.growthRate;
        case 'rating-asc': return (a: Product, b: Product) => a.metrics.rating - b.metrics.rating;
        case 'rating-desc': return (a: Product, b: Product) => b.metrics.rating - a.metrics.rating;
        default: return (a: Product, b: Product) => 0;
      }
    };

    const primarySort = getComparator(filters.sort.primary);
    const secondarySort = getComparator(filters.sort.secondary);

    return result.sort((a, b) => {
      const primaryDiff = primarySort(a, b);
      if (primaryDiff !== 0) return primaryDiff;
      return secondarySort(a, b);
    });
  }, [filters, allProducts]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Comparison Handlers
  const toggleComparison = (product: Product) => {
    // Reset AI data whenever list changes to ensure validity
    setAiData(null);

    if (comparisonList.find(p => p.id === product.id)) {
      setComparisonList(prev => prev.filter(p => p.id !== product.id));
    } else {
      if (comparisonList.length < 5) {
        setComparisonList(prev => [...prev, product]);
      } else {
        alert("You can compare up to 5 products at a time.");
      }
    }
  };

  const handleClearComparison = () => {
    setComparisonList([]);
    setAiData(null); // Clear AI data when clearing products
  };

  // Home Handler - Resets EVERYTHING
  const handleHomeClick = () => {
    setFilters({
      search: '',
      searchFields: [],
      category: [],
      subCategory: null,
      pricing: [],
      minRating: 0,
      minGrowth: 0,
      dateRange: { start: '', end: '' },
      sort: { primary: 'users-desc', secondary: 'rating-desc' }
    });
    setActiveTab('products');
    setViewMode('grid');
    setComparisonList([]);
    setAiData(null);
    setIsSidebarOpen(false); // Close mobile sidebar
  };

  // RENDER: INITIALIZATION SCREEN
  // If we have very few products (just the seed) AND the crawler is running vigorously (progress < 100), show the startup screen.
  // This ensures first-time users see the setup, but returning users with stale data see the app immediately.
  const showStartupScreen = initStatus === 'crawling' && allProducts.length < 10;

  if (showStartupScreen) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono">
        {/* Background animation effect */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-black"></div>
        </div>

        <div className="z-10 w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-block p-4 bg-blue-500/10 rounded-full mb-4 animate-pulse">
              <Database className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Kinetiq System Startup</h1>
            <p className="text-gray-400">Initializing global product database...</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 space-y-6 shadow-2xl">
            <div>
              <div className="flex justify-between text-xs uppercase tracking-wider text-gray-500 mb-2">
                <span>System Progress</span>
                <span>{initProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${initProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                {initTask ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                <span className="truncate">{initTask || "Finalizing..."}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Server className="w-4 h-4 text-purple-400" />
                <span>Indexed {allProducts.length} AI Products</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            This initial setup runs once. Subsequent loads will be instant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200 font-sans">

      {/* Header */}
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isDark={isDark}
        toggleTheme={toggleTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchRef={searchFocusRef}
      />

      <div className="flex pt-0 h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          filters={filters}
          setFilters={setFilters}
          onHomeClick={handleHomeClick}
        />

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">

            {/* Global Disclaimer Banner */}
            <div className="mb-6 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              <span className="font-medium text-gray-700 dark:text-gray-300">Disclaimer:</span> Product metrics (user counts, ratings, growth rates) are approximate estimates aggregated from public sources and third-party data.
              Actual figures may vary and should be independently verified. AI-generated analysis may contain inaccuracies. Use as a research starting point only.
            </div>

            {/* Background Update Indicator */}
            {initStatus === 'crawling' && allProducts.length >= 20 && (
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">Updating Database...</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2 hidden sm:inline">{initTask}</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {initProgress}%
                </div>
              </div>
            )}

            {/* View Routing */}
            {activeTab === 'analytics' && (
              <MarketOverview products={filteredProducts} />
            )}

            {activeTab === 'comparison' && (
              <ComparisonPage
                products={comparisonList}
                onBack={() => setActiveTab('products')}
                onRemove={(id) => {
                  setComparisonList(prev => prev.filter(p => p.id !== id));
                  setAiData(null);
                }}
                aiData={aiData}
                setAiData={setAiData}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            )}

            {activeTab === 'companies' && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Company Directory</h2>
                <p className="text-gray-500">Coming soon. Will display hierarchical view of parent companies and subsidiaries.</p>
              </div>
            )}

            {activeTab === 'products' && (
              <>
                {/* Active Filters Display */}
                {(filters.category || filters.search) && (
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-semibold text-gray-900 dark:text-white">Showing {filteredProducts.length} results</span>
                      {filters.category.length > 0 && (
                        <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full flex items-center">
                          {filters.category.length === 1 ? filters.category[0] : `${filters.category.length} Categories`}
                          {filters.subCategory && ` > ${filters.subCategory}`}
                          <button onClick={() => setFilters(prev => ({ ...prev, category: [], subCategory: null }))} className="ml-1 hover:text-primary-900">
                            <span className="sr-only">Remove</span>&times;
                          </button>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleShare}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-md transition-colors"
                        title="Share this view"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleExport}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-md transition-colors"
                        title="Export to CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Comparison Bar */}
                {comparisonList.length > 0 && (
                  <ComparisonView
                    products={comparisonList}
                    onRemove={(id) => {
                      setComparisonList(prev => prev.filter(p => p.id !== id));
                      setAiData(null);
                    }}
                    onClear={handleClearComparison}
                    onCompareNow={() => setActiveTab('comparison')}
                  />
                )}

                {/* Product Grid/List */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={setSelectedProduct}
                        onCompare={toggleComparison}
                        isSelectedForComparison={!!comparisonList.find(p => p.id === product.id)}
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {paginatedProducts.map(product => (
                      <ProductListRow
                        key={product.id}
                        product={product}
                        onClick={setSelectedProduct}
                        onCompare={toggleComparison}
                        isSelectedForComparison={!!comparisonList.find(p => p.id === product.id)}
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'table' && (
                  <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-dark-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pricing</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedProducts.map(product => (
                          <tr
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-lg object-cover" src={product.logoUrl} alt="" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.companyId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {product.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Intl.NumberFormat('en-US', { notation: "compact" }).format(product.metrics.totalUsers)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <span className="text-yellow-500 mr-1">★</span> {product.metrics.rating}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {product.pricing.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-800 mb-4">
                      <Table className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {/[^a-zA-Z0-9\s]/.test(filters.search)
                        ? "It looks like your search contains special characters. Try using only letters and numbers."
                        : "Try adjusting your search or filters to find what you're looking for."}
                    </p>
                    <button
                      onClick={handleHomeClick}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Pagination Controls */}
            {filteredProducts.length > ITEMS_PER_PAGE && (
              <div className="mt-8 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-800 text-sm"
                >
                  Prev
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Logic to show a window of pages around current
                    let pNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        pNum = currentPage - 2 + i;
                      }
                      if (pNum > totalPages) {
                        pNum = totalPages - 4 + i;
                      }
                    }
                    return pNum;
                  }).map(pNum => (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${currentPage === pNum
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-800'}`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-800 text-sm"
                >
                  Next
                </button>
              </div>
            )}

            {/* Spacer for Comparison View Overlay */}
            {comparisonList.length > 0 && <div className="h-[50vh] w-full" aria-hidden="true" />}

            {/* Global Disclaimer Footer - Removed */}
          </div>
        </main>
      </div>

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default App;
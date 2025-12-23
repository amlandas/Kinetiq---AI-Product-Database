import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProductCard from './components/ProductCard';
import ProductListRow from './components/ProductListRow';
import ProductModal from './components/ProductModal';
import MarketOverview from './components/MarketOverview';
import ComparisonView from './components/ComparisonView';
import { Product, FilterState } from './types';
import { Table, Database, Sparkles, CheckCircle, Server, Loader2 } from 'lucide-react';
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
  
  // Data State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  // Initialization State
  const [initStatus, setInitStatus] = useState<CrawlStatus>('idle');
  const [initProgress, setInitProgress] = useState(0);
  const [initTask, setInitTask] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: null,
    subCategory: null,
    pricing: [],
    minRating: 0,
  });

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

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                            product.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                            product.companyId.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.category ? product.category === filters.category : true;
      const matchesSubCategory = filters.subCategory ? product.subCategory === filters.subCategory : true;
      const matchesRating = product.metrics.rating >= filters.minRating;

      return matchesSearch && matchesCategory && matchesSubCategory && matchesRating;
    });
  }, [filters, allProducts]);

  // Comparison Handlers
  const toggleComparison = (product: Product) => {
    if (comparisonList.find(p => p.id === product.id)) {
      setComparisonList(prev => prev.filter(p => p.id !== product.id));
    } else {
      if (comparisonList.length < 4) {
        setComparisonList(prev => [...prev, product]);
      } else {
        alert("You can compare up to 4 products at a time.");
      }
    }
  };

  // Home Handler - Resets EVERYTHING
  const handleHomeClick = () => {
    setFilters({
      search: '',
      category: null,
      subCategory: null,
      pricing: [],
      minRating: 0,
    });
    setActiveTab('products');
    setViewMode('grid');
    setComparisonList([]);
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
                      <span>Showing {filteredProducts.length} results</span>
                      {filters.category && (
                        <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full flex items-center">
                          {filters.category}
                          {filters.subCategory && ` > ${filters.subCategory}`}
                          <button onClick={() => setFilters(prev => ({ ...prev, category: null, subCategory: null }))} className="ml-1 hover:text-primary-900">
                            <span className="sr-only">Remove</span>&times;
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Comparison Bar */}
                {comparisonList.length > 0 && (
                  <ComparisonView 
                    products={comparisonList} 
                    onRemove={(id) => setComparisonList(prev => prev.filter(p => p.id !== id))}
                    onClear={() => setComparisonList([])}
                  />
                )}

                {/* Product Grid/List */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onClick={setSelectedProduct}
                        onCompare={toggleComparison}
                        isSelectedForComparison={!!comparisonList.find(p => p.id === product.id)}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {filteredProducts.map(product => (
                      <ProductListRow 
                        key={product.id} 
                        product={product} 
                        onClick={setSelectedProduct}
                        onCompare={toggleComparison}
                        isSelectedForComparison={!!comparisonList.find(p => p.id === product.id)}
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
                         {filteredProducts.map(product => (
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
                     <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
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
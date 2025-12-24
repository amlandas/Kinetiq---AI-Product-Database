import React from 'react';
import { Product, ComparisonResult } from '../types';
import { X, Check, Minus, Sparkles, Loader2 } from 'lucide-react';
import { generateComparison } from '../services/geminiService';

interface ComparisonViewProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ products, onRemove, onClear }) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiData, setAiData] = React.useState<ComparisonResult | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await generateComparison(products);
      setAiData(result);
    } catch (e) {
      console.error("Failed to analyze", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-200 dark:border-gray-700 animate-slide-up max-h-[60vh] overflow-hidden flex flex-col">
      <div className="p-4 bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Product Comparison ({products.length}/5)</h2>
          {!aiData && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with AI</span>
                </>
              )}
            </button>
          )}
        </div>
        <button onClick={onClear} className="text-sm text-red-600 hover:text-red-700 font-medium">Clear All</button>
      </div>

      <div className="overflow-x-auto overflow-y-auto">
        {aiData && (
          <div className="p-4 bg-primary-50 dark:bg-primary-900/10 border-b border-primary-100 dark:border-primary-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-primary-900 dark:text-primary-100 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Verdict
              </h3>
              <span className="text-xs text-primary-600 dark:text-primary-400">Updated: {aiData.lastUpdated}</span>
            </div>
            <p className="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">
              {aiData.summary}
            </p>
          </div>
        )}

        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className="p-4 w-48 bg-gray-50 dark:bg-dark-900/50 sticky left-0 z-10 border-r border-gray-100 dark:border-gray-700"></th>
              {products.map(p => (
                <th key={p.id} className="p-4 min-w-[240px] border-b border-gray-100 dark:border-gray-700 relative group">
                  <div className="flex flex-col items-center text-center">
                    <button
                      onClick={() => onRemove(p.id)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <img src={p.logoUrl} alt={p.name} className="w-12 h-12 rounded-lg mb-2 object-cover shadow-sm" />
                    <h3 className="font-bold text-gray-900 dark:text-white">{p.name}</h3>
                    {aiData?.rating_sentiment[p.name] && (
                      <div className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full truncate max-w-full">
                        {aiData.rating_sentiment[p.name]}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {/* AI GENERATED ROWS */}
            {aiData && (
              <>
                <tr>
                  <td className="p-4 font-medium text-gray-900 dark:text-white bg-blue-50/50 dark:bg-blue-900/10 sticky left-0 border-r border-blue-100 dark:border-blue-800/30">
                    Pricing (Verified)
                  </td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 text-center bg-blue-50/10 dark:bg-blue-900/5 font-medium text-gray-900 dark:text-white">
                      {aiData.pricing[p.name] || 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Features from AI */}
                {aiData.features.map((feature, idx) => (
                  <tr key={idx}>
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">
                      {feature.label}
                    </td>
                    {products.map(p => (
                      <td key={p.id} className="p-4 text-center text-gray-600 dark:text-gray-400">
                        {feature.values[p.name] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Pros */}
                <tr>
                  <td className="p-4 font-medium text-green-700 dark:text-green-400 bg-green-50/30 dark:bg-green-900/10 sticky left-0 border-r border-gray-100 dark:border-gray-700">Pros</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 align-top">
                      <ul className="list-disc list-inside text-left space-y-1">
                        {(aiData.pros[p.name] || []).map((pro, i) => (
                          <li key={i} className="text-xs text-gray-600 dark:text-gray-300">{pro}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Cons */}
                <tr>
                  <td className="p-4 font-medium text-red-700 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10 sticky left-0 border-r border-gray-100 dark:border-gray-700">Cons</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 align-top">
                      <ul className="list-disc list-inside text-left space-y-1">
                        {(aiData.cons[p.name] || []).map((con, i) => (
                          <li key={i} className="text-xs text-gray-600 dark:text-gray-300">{con}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </>
            )}

            {/* STATIC ROWS (Fallback/Baseline) */}
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">Category</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center text-gray-700 dark:text-gray-300">{p.category} / {p.subCategory}</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">Static Rating</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center text-yellow-600 font-medium">{p.metrics.rating}/5.0</td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-gray-500 bg-gray-50 dark:bg-dark-900/50 sticky left-0 border-r border-gray-100 dark:border-gray-700">Est. Users</td>
              {products.map(p => (
                <td key={p.id} className="p-4 text-center text-gray-700 dark:text-gray-300">
                  {new Intl.NumberFormat('en-US', { notation: "compact" }).format(p.metrics.totalUsers)}
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

import React from 'react';
import { Product, ComparisonResult } from '../types';
import { ArrowLeft, Sparkles, Loader2, X, Check, Minus } from 'lucide-react';
import { generateComparison } from '../services/geminiService';

interface ComparisonPageProps {
    products: Product[];
    onBack: () => void;
    onRemove: (productId: string) => void;
    aiData: ComparisonResult | null;
    setAiData: (data: ComparisonResult | null) => void;
    isAnalyzing: boolean;
    setIsAnalyzing: (isAnalyzing: boolean) => void;
}

const ComparisonPage: React.FC<ComparisonPageProps> = ({
    products,
    onBack,
    onRemove,
    aiData,
    setAiData,
    isAnalyzing,
    setIsAnalyzing
}) => {

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

    if (products.length === 0) {
        return (
            <div className="flexflex-col items-center justify-center min-h-[50vh] text-center p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No products selected</h2>
                <button onClick={onBack} className="text-primary-600 hover:underline">Go back to products</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Results
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Comparing {products.length} Products</h1>
                    <div className="w-24"></div> {/* Spacer for centering */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* AI HERO SECTION */}
                <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-1 shadow-xl">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center text-white">
                        {!aiData ? (
                            <div className="space-y-6">
                                <div className="inline-flex p-3 bg-white/20 rounded-full mb-2">
                                    <Sparkles className="w-8 h-8 text-yellow-300" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">Unlock Intelligent Insights</h2>
                                <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                                    Stop reading generic specs. Let our AI analyze these specific {products.length} products to reveal the hidden pros, cons, and strategic differences tailored to your needs.
                                </p>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin mr-3" />
                                            Analyzing Differences...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-6 h-6 mr-3" />
                                            Analyze with AI
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-left animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold flex items-center">
                                        <Sparkles className="w-6 h-6 mr-3 text-yellow-300" />
                                        AI Verdict & Strategic Analysis
                                    </h2>
                                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Updated: {aiData.lastUpdated}</span>
                                </div>
                                <div className="bg-white/10 rounded-lg p-6 backdrop-blur-md">
                                    <p className="text-lg leading-relaxed text-blue-50 font-medium p-2">
                                        {aiData.summary}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COMPARISON TABLE */}
                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="p-6 w-64 bg-gray-50 dark:bg-dark-900 border-r border-gray-100 dark:border-gray-700 align-middle">
                                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Product Spec</span>
                                    </th>
                                    {products.map(p => (
                                        <th key={p.id} className="p-6 min-w-[280px] border-b border-gray-100 dark:border-gray-700 relative group align-top">
                                            <button
                                                onClick={() => onRemove(p.id)}
                                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                                title="Remove from comparison"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="flex flex-col items-center text-center">
                                                <img src={p.logoUrl} alt={p.name} className="w-20 h-20 rounded-2xl mb-4 object-cover shadow-md" />
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{p.name}</h3>
                                                <div className="text-sm text-gray-500 mb-3">{p.companyId}</div>

                                                {/* AI Sentiment Badge */}
                                                {aiData?.rating_sentiment[p.name] && (
                                                    <div className="mt-2 text-sm text-green-700 dark:text-green-300 font-medium px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-full border border-green-100 dark:border-green-800/50">
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
                                        <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                                            <td className="p-6 font-bold text-gray-900 dark:text-white border-r border-blue-100 dark:border-blue-800/30">
                                                Pricing
                                            </td>
                                            {products.map(p => (
                                                <td key={p.id} className="p-6 text-center font-semibold text-gray-900 dark:text-white">
                                                    {aiData.pricing[p.name] || 'N/A'}
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Features */}
                                        {aiData.features.map((feature, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-dark-700/50 transition-colors">
                                                <td className="p-6 font-medium text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                                                    {feature.label}
                                                </td>
                                                {products.map(p => (
                                                    <td key={p.id} className="p-6 text-center text-gray-600 dark:text-gray-300">
                                                        {feature.values[p.name] || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}

                                        {/* Pros */}
                                        <tr className="bg-green-50/20 dark:bg-green-900/5">
                                            <td className="p-6 font-bold text-green-800 dark:text-green-400 border-r border-green-100 dark:border-green-800/20 align-top">
                                                Key Strengths
                                            </td>
                                            {products.map(p => (
                                                <td key={p.id} className="p-6 align-top">
                                                    <ul className="space-y-2">
                                                        {(aiData.pros[p.name] || []).map((pro, i) => (
                                                            <li key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                                                {pro}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Cons */}
                                        <tr className="bg-red-50/20 dark:bg-red-900/5">
                                            <td className="p-6 font-bold text-red-800 dark:text-red-400 border-r border-red-100 dark:border-red-800/20 align-top">
                                                Limitations
                                            </td>
                                            {products.map(p => (
                                                <td key={p.id} className="p-6 align-top">
                                                    <ul className="space-y-2">
                                                        {(aiData.cons[p.name] || []).map((con, i) => (
                                                            <li key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                                <Minus className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                                                {con}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            ))}
                                        </tr>
                                    </>
                                )}

                                {/* STATIC BACKUP DATA (If AI not run yet, or as base) */}
                                <tr className="bg-gray-50 dark:bg-dark-900/50">
                                    <td colSpan={products.length + 1} className="p-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-dark-800">
                                        Standard Metrics
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-6 font-medium text-gray-500 border-r border-gray-100 dark:border-gray-700">Category</td>
                                    {products.map(p => (
                                        <td key={p.id} className="p-6 text-center text-gray-700 dark:text-gray-300">
                                            <span className="inline-block bg-gray-100 dark:bg-dark-700 rounded px-2 py-1 text-xs">
                                                {p.category}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-medium text-gray-500 border-r border-gray-100 dark:border-gray-700">User Rating</td>
                                    {products.map(p => (
                                        <td key={p.id} className="p-6 text-center">
                                            <div className="inline-flex items-center font-bold text-gray-900 dark:text-white">
                                                <span className="text-yellow-500 mr-1">★</span> {p.metrics.rating}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-medium text-gray-500 border-r border-gray-100 dark:border-gray-700">Est. Users</td>
                                    {products.map(p => (
                                        <td key={p.id} className="p-6 text-center text-gray-700 dark:text-gray-300 font-mono">
                                            {new Intl.NumberFormat('en-US', { notation: "compact" }).format(p.metrics.totalUsers)}
                                        </td>
                                    ))}
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonPage;

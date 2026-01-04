import React from 'react';
import { Product, ComparisonResult } from '../types';
import { ArrowLeft, Sparkles, Loader2, X, Check, Minus, Download } from 'lucide-react';
import { generateComparison } from '../services/geminiService';
import { ConfidenceLevel, ExternalSignalsEntry, formatCompactNumber, formatConfidenceLabel, formatDateLabel, getConfidenceBadgeClasses, getExternalSignals } from '../lib/externalSignals';
import { useFeatureFlags } from '../lib/featureFlags';

interface ComparisonPageProps {
    products: Product[];
    allProducts: Product[];
    onAdd: (product: Product) => void;
    onBack: () => void;
    onRemove: (productId: string) => void;
    aiData: ComparisonResult | null;
    setAiData: (data: ComparisonResult | null) => void;
    isAnalyzing: boolean;
    setIsAnalyzing: (isAnalyzing: boolean) => void;
}

const ComparisonPage: React.FC<ComparisonPageProps> = ({
    products,
    allProducts,
    onAdd,
    onBack,
    onRemove,
    aiData,
    setAiData,
    isAnalyzing,
    setIsAnalyzing
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const { externalSignalsAnalytics: showExternalSignals } = useFeatureFlags();

    const renderConfidencePill = (confidence?: ConfidenceLevel) => {
        if (!confidence) return null;
        return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getConfidenceBadgeClasses(confidence)}`}>
                {formatConfidenceLabel(confidence)}
            </span>
        );
    };

    const renderSignalCell = (
        signal: ExternalSignalsEntry['github'] | ExternalSignalsEntry['jobs'] | ExternalSignalsEntry['traffic'] | ExternalSignalsEntry['funding'],
        value: React.ReactNode,
        meta?: string,
    ) => (
        <div className="flex flex-col items-center gap-1 text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
            {meta ? <div className="text-[11px] text-gray-500 dark:text-gray-400">{meta}</div> : null}
            {signal ? (
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-400">
                    {renderConfidencePill(signal.confidence)}
                    <span>{signal.source}</span>
                </div>
            ) : (
                <div className="text-[11px] text-gray-400">No signal</div>
            )}
        </div>
    );

    const buildDecisionReport = () => {
        const lines: string[] = [];
        lines.push('# Kinetiq Decision Report');
        lines.push(`Generated: ${new Date().toLocaleString('en-US')}`);
        lines.push('');
        lines.push('## Products compared');
        products.forEach((product) => {
            lines.push(`- ${product.name} (${product.category})`);
        });
        lines.push('');

        if (aiData?.summary) {
            lines.push('## AI summary');
            lines.push(aiData.summary);
            lines.push('');
        } else {
            lines.push('## AI summary');
            lines.push('AI summary not generated yet.');
            lines.push('');
        }

        if (aiData) {
            lines.push('## Trade-offs (AI generated)');
            products.forEach((product) => {
                lines.push(`### ${product.name}`);
                const pros = aiData.pros[product.name] || [];
                const cons = aiData.cons[product.name] || [];
                lines.push('Strengths:');
                if (pros.length === 0) lines.push('- Not available');
                pros.forEach((item) => lines.push(`- ${item}`));
                lines.push('Limitations:');
                if (cons.length === 0) lines.push('- Not available');
                cons.forEach((item) => lines.push(`- ${item}`));
                lines.push('');
            });
        }

        lines.push('## External signals (directional)');
        products.forEach((product) => {
            const signals = getExternalSignals(product.id);
            lines.push(`### ${product.name}`);

            const github = signals?.github;
            if (github) {
                const value =
                    github.scope === 'repo'
                        ? `${formatCompactNumber(github.stars)} stars (repo ${github.repo})`
                        : `${formatCompactNumber(github.publicRepos)} public repos (org ${github.org})`;
                lines.push(`- GitHub: ${value}`);
                lines.push(`  - Confidence: ${formatConfidenceLabel(github.confidence)} | Source: ${github.source}`);
            } else {
                lines.push('- GitHub: Not available');
            }

            const jobs = signals?.jobs;
            if (jobs) {
                lines.push(`- Jobs: ${jobs.openRoles} open roles (recent 30d: ${jobs.recentRoles30d})`);
                lines.push(`  - Confidence: ${formatConfidenceLabel(jobs.confidence)} | Source: ${jobs.source}`);
            } else {
                lines.push('- Jobs: Not available');
            }

            const traffic = signals?.traffic;
            if (traffic?.rank) {
                lines.push(`- Traffic: Tranco rank #${traffic.rank} (${traffic.matchedDomain || 'domain match'})`);
                lines.push(`  - Confidence: ${formatConfidenceLabel(traffic.confidence)} | Source: ${traffic.source}`);
            } else {
                lines.push('- Traffic: Not ranked');
            }

            const funding = signals?.funding;
            if (funding?.lastFilingDate) {
                lines.push(
                    `- Funding: ${funding.ticker} filings, latest ${funding.lastFilingType || 'SEC'} on ${formatDateLabel(
                        funding.lastFilingDate,
                    )}`,
                );
                lines.push(`  - Confidence: ${formatConfidenceLabel(funding.confidence)} | Source: ${funding.source}`);
            } else {
                lines.push('- Funding: Not available');
            }

            lines.push('');
        });

        lines.push('Notes: External signals are directional proxies with explicit provenance + confidence.');
        lines.push('');

        return lines.join('\n');
    };

    const handleDecisionReportExport = () => {
        if (products.length === 0) return;
        const report = buildDecisionReport();
        const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `kinetiq_decision_report_${new Date().toISOString().slice(0, 10)}.md`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const filteredSuggestions = React.useMemo(() => {
        if (!searchQuery.trim()) return [];
        return allProducts
            .filter(p =>
                !products.find(sel => sel.id === p.id) &&
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5);
    }, [searchQuery, allProducts, products]);

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

    // Smart Empty State
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 max-w-2xl mx-auto animate-fade-in">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-full mb-6">
                    <Sparkles className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Build Your Comparison
                </h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Search and select products to see a side-by-side breakdown of features, pricing, and AI-generated insights.
                </p>

                {/* Search Box */}
                <div className="relative w-full max-w-lg mb-12">
                    <input
                        type="text"
                        placeholder="Search for a tool (e.g. 'ChatGPT')..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        className="w-full px-6 py-4 rounded-full border border-gray-300 dark:border-gray-600 shadow-lg text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-800 dark:text-white"
                    />

                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-10 text-left">
                            {filteredSuggestions.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        onAdd(p);
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                    }}
                                    className="w-full px-6 py-3 flex items-center hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                                >
                                    <img src={p.logoUrl} alt="" className="w-8 h-8 rounded mr-3 object-cover" />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                                        <div className="text-xs text-gray-500">{p.category}</div>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 ml-auto text-gray-400 rotate-180" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Popular Comparisons */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Popular Comparisons</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            ['ChatGPT', 'Claude'],
                            ['Midjourney', 'DALL-E 3'],
                            ['Notion', 'Obsidian']
                        ].map(([a, b], idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    // Find products
                                    const pA = allProducts.find(p => p.name.includes(a));
                                    const pB = allProducts.find(p => p.name.includes(b));
                                    if (pA) onAdd(pA);
                                    if (pB) onAdd(pB);
                                }}
                                className="px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm"
                            >
                                <span className="font-medium">{a}</span>
                                <span className="text-gray-400 mx-2">vs</span>
                                <span className="font-medium">{b}</span>
                            </button>
                        ))}
                    </div>
                </div>
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden md:block">Comparing {products.length} Products</h1>

                    {/* Persistent Add Product Search */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-56 lg:w-72">
                            <input
                                type="text"
                                placeholder="Add another product..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-900 text-sm focus:ring-1 focus:ring-primary-500 text-gray-900 dark:text-white"
                            />
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                                    {filteredSuggestions.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                onAdd(p);
                                                setSearchQuery('');
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full px-4 py-2 flex items-center hover:bg-gray-50 dark:hover:bg-dark-700 text-left"
                                        >
                                            <img src={p.logoUrl} alt="" className="w-6 h-6 rounded mr-2" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {showExternalSignals && (
                            <button
                                onClick={handleDecisionReportExport}
                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-primary-400 hover:text-primary-600 dark:border-gray-700 dark:bg-dark-800 dark:text-gray-200"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Decision Report</span>
                            </button>
                        )}
                    </div>
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

                                {showExternalSignals && (
                                    <>
                                        <tr className="bg-gray-50 dark:bg-dark-900/50">
                                            <td colSpan={products.length + 1} className="p-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-dark-800">
                                                External Signals (directional)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-6 font-medium text-gray-500 border-r border-gray-100 dark:border-gray-700">GitHub activity</td>
                                            {products.map(p => {
                                                const signals = getExternalSignals(p.id);
                                                const github = signals?.github;
                                                const value = github
                                                    ? github.scope === 'repo'
                                                        ? `${formatCompactNumber(github.stars)} stars`
                                                        : `${formatCompactNumber(github.publicRepos)} repos`
                                                    : 'Not available';
                                                const meta = github
                                                    ? github.scope === 'repo'
                                                        ? `Repo: ${github.repo}`
                                                        : `Org: ${github.org}`
                                                    : undefined;
                                                return (
                                                    <td key={p.id} className="p-6 text-center text-gray-700 dark:text-gray-300">
                                                        {renderSignalCell(github, value, meta)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="p-6 font-medium text-gray-500 border-r border-gray-100 dark:border-gray-700">Job postings</td>
                                            {products.map(p => {
                                                const signals = getExternalSignals(p.id);
                                                const jobs = signals?.jobs;
                                                const value = jobs ? `${jobs.openRoles} open roles` : 'Not available';
                                                const meta = jobs ? `Recent 30d: ${jobs.recentRoles30d}` : undefined;
                                                return (
                                                    <td key={p.id} className="p-6 text-center text-gray-700 dark:text-gray-300">
                                                        {renderSignalCell(jobs, value, meta)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="p-6 font-medium text-gray-500 border-r border-gray-100 dark:border-gray-700">Traffic estimate</td>
                                            {products.map(p => {
                                                const signals = getExternalSignals(p.id);
                                                const traffic = signals?.traffic;
                                                const value = traffic?.rank ? `Tranco #${traffic.rank}` : 'Not ranked';
                                                const meta = traffic?.matchedDomain ? `Domain: ${traffic.matchedDomain}` : undefined;
                                                return (
                                                    <td key={p.id} className="p-6 text-center text-gray-700 dark:text-gray-300">
                                                        {renderSignalCell(traffic, value, meta)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="p-6 font-medium text-gray-500 border-r border-gray-100 dark:border-gray-700">Funding signal</td>
                                            {products.map(p => {
                                                const signals = getExternalSignals(p.id);
                                                const funding = signals?.funding;
                                                const value = funding?.lastFilingDate ? `Public filings (${funding.ticker})` : 'Not available';
                                                const meta = funding?.lastFilingDate
                                                    ? `Latest ${funding.lastFilingType || 'SEC'}: ${formatDateLabel(funding.lastFilingDate)}`
                                                    : undefined;
                                                return (
                                                    <td key={p.id} className="p-6 text-center text-gray-700 dark:text-gray-300">
                                                        {renderSignalCell(funding, value, meta)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </>
                                )}

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonPage;

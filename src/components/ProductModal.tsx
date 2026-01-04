import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { X, ExternalLink, Globe, Calendar, RefreshCw, Zap, MessageSquare, Loader2, Sparkles, Star, Github, Briefcase, TrendingUp, Banknote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getProductAnalysis } from '../services/geminiService';
import { ConfidenceLevel, formatCompactNumber, formatConfidenceLabel, formatDateLabel, getConfidenceBadgeClasses, getExternalSignals, getExternalSignalsUpdatedAt } from '../lib/externalSignals';
import { isExternalSignalsAnalyticsEnabled } from '../lib/featureFlags';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);
  const showExternalSignals = isExternalSignalsAnalyticsEnabled();
  const signals = getExternalSignals(product.id);
  const signalsUpdatedAt = getExternalSignalsUpdatedAt();

  const renderConfidenceBadge = (confidence: ConfidenceLevel) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getConfidenceBadgeClasses(confidence)}`}>
      {formatConfidenceLabel(confidence)}
    </span>
  );

  const renderSignalCard = (
    title: string,
    Icon: React.ComponentType<{ className?: string }>,
    value: React.ReactNode,
    meta: React.ReactNode,
    confidence?: ConfidenceLevel,
    source?: string,
    sourceUrl?: string,
    note?: string,
  ) => (
    <div className="rounded-lg border border-gray-200 bg-white/70 p-3 text-sm dark:border-gray-700 dark:bg-dark-800/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-100">
          <Icon className="mr-2 h-4 w-4 text-gray-400" />
          {title}
        </div>
        {confidence ? renderConfidenceBadge(confidence) : null}
      </div>
      <div className="mt-2 text-sm text-gray-900 dark:text-white">{value}</div>
      {meta ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{meta}</div> : null}
      {source ? (
        <div className="mt-1 text-[11px] text-gray-400">
          Source:{' '}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted">
              {source}
            </a>
          ) : (
            source
          )}
        </div>
      ) : null}
      {note ? <div className="mt-1 text-[11px] text-gray-400">{note}</div> : null}
    </div>
  );

  useEffect(() => {
    if (analysis && analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysis]);

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    const result = await getProductAnalysis(product);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-dark-700 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative h-48 bg-gradient-to-r from-primary-900 to-primary-700 flex-shrink-0">
          <div className="absolute -bottom-10 left-8 flex items-end">
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
              <img src={product.logoUrl} alt={product.name} className="w-full h-full rounded-xl object-cover" />
            </div>
            <div className="ml-4 mb-3 text-white drop-shadow-md">
              <h2 className="text-3xl font-bold">{product.name}</h2>
              <p className="opacity-90 flex items-center">
                by {product.companyId} <span className="mx-2">•</span> {product.category}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-8 px-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {product.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  Key Features
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-gray-600 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Gemini Integration Section */}
              <section className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-5 border border-primary-100 dark:border-primary-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Strategic Analysis
                  </h3>
                  {!analysis && !loadingAnalysis && (
                    <button
                      onClick={handleAnalyze}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Analysis
                    </button>
                  )}
                </div>

                {loadingAnalysis && (
                  <div className="flex items-center justify-center py-8 text-primary-600">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Analyzing product data...</span>
                  </div>
                )}

                {analysis && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                )}

                {!analysis && !loadingAnalysis && (
                  <p className="text-sm text-primary-700 dark:text-primary-300 opacity-80">
                    Use Gemini AI to generate a real-time strategic analysis of this product's market fit and capabilities.
                  </p>
                )}
                <div ref={analysisRef} />
              </section>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-dark-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Key Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Total Users</span>
                    <span className="font-semibold dark:text-white">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(product.metrics.totalUsers)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">User Rating</span>
                    <div className="flex items-center font-semibold text-yellow-600 dark:text-yellow-400">
                      <span className="mr-1">{product.metrics.rating}</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.round(product.metrics.rating) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Growth Rate</span>
                    <span className="font-semibold text-green-600">+{product.metrics.growthRate}%</span>
                  </div>
                </div>
              </div>

              {showExternalSignals && (
                <div className="bg-gray-50 dark:bg-dark-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">External Signals</h4>
                    <span className="text-[11px] text-gray-400">Updated {formatDateLabel(signalsUpdatedAt)}</span>
                  </div>
                  <div className="space-y-3">
                    {renderSignalCard(
                      'GitHub activity',
                      Github,
                      signals?.github
                        ? signals.github.scope === 'repo'
                          ? `${formatCompactNumber(signals.github.stars)} stars`
                          : `${formatCompactNumber(signals.github.publicRepos)} public repos`
                        : 'Not available',
                      signals?.github
                        ? signals.github.scope === 'repo'
                          ? `Repo: ${signals.github.repo} • Last push ${formatDateLabel(signals.github.lastPush)}`
                          : `Org: ${signals.github.org} • ${formatCompactNumber(signals.github.followers)} followers`
                        : 'Add a verified repo/org mapping to enable GitHub signals.',
                      signals?.github?.confidence,
                      signals?.github?.source,
                      signals?.github?.sourceUrl
                    )}
                    {renderSignalCard(
                      'Job postings',
                      Briefcase,
                      signals?.jobs ? `${signals.jobs.openRoles} open roles` : 'Not available',
                      signals?.jobs
                        ? `Recent 30d: ${signals.jobs.recentRoles30d} • Top locations: ${signals.jobs.locations.join(', ') || 'N/A'}`
                        : 'Company-level hiring signals require a verified job board mapping.',
                      signals?.jobs?.confidence,
                      signals?.jobs?.source,
                      signals?.jobs?.sourceUrl,
                      signals?.jobs?.note
                    )}
                    {renderSignalCard(
                      'Traffic estimate',
                      TrendingUp,
                      signals?.traffic?.rank ? `Tranco rank #${signals.traffic.rank}` : 'Not ranked',
                      signals?.traffic?.matchedDomain
                        ? `Matched domain: ${signals.traffic.matchedDomain}`
                        : 'No rank found in the latest Tranco list.',
                      signals?.traffic?.confidence,
                      signals?.traffic?.source,
                      signals?.traffic?.sourceUrl,
                      signals?.traffic?.note
                    )}
                    {renderSignalCard(
                      'Funding signal',
                      Banknote,
                      signals?.funding?.lastFilingDate
                        ? `Public filings (${signals.funding.ticker})`
                        : 'Not available',
                      signals?.funding?.lastFilingDate
                        ? `Last filing: ${signals.funding.lastFilingType || 'SEC'} on ${formatDateLabel(
                            signals.funding.lastFilingDate,
                          )}`
                        : 'Private funding data is not captured yet.',
                      signals?.funding?.confidence,
                      signals?.funding?.source,
                      signals?.funding?.sourceUrl,
                      signals?.funding?.note
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                    Signals are directional and include provenance + confidence so you can judge reliability.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-dark-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Details</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <Globe className="w-4 h-4 mr-3 text-gray-400" />
                    <a href={product.website} target="_blank" rel="noreferrer" className="hover:text-primary-600 truncate underline decoration-dotted">
                      Visit Website
                    </a>
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                    <span>Launched: {product.launchDate}</span>
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <RefreshCw className="w-4 h-4 mr-3 text-gray-400" />
                    <span>Updated: {product.lastUpdate}</span>
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-gray-300">
                    <MessageSquare className="w-4 h-4 mr-3 text-gray-400" />
                    <div className="flex gap-1">
                      {product.pricing.map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </li>
                </ul>

                <a
                  href={product.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Open Application <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

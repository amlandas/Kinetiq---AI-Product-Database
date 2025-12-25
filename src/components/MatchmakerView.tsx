import React, { useState, useRef, useEffect } from 'react';
import { Product, MatchResult } from '../types';
import { matchProducts } from '../services/geminiService';
import ProductCard from './ProductCard';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface MatchmakerViewProps {
    allProducts: Product[];
    onProductClick: (product: Product) => void;
    onCompare: (product: Product) => void;
    comparisonList: Product[];
    favorites: string[];
    onToggleFavorite: (id: string) => void;
}

interface Message {
    id: string;
    role: 'user' | 'ai';
    text?: string;
    data?: MatchResult;
    timestamp: number;
}

const MatchmakerView: React.FC<MatchmakerViewProps> = ({
    allProducts,
    onProductClick,
    onCompare,
    comparisonList,
    favorites,
    onToggleFavorite
}) => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'ai',
            text: "Hi! I'm your AI Matchmaker. Tell me what kind of tool you're looking for (e.g., 'free video editor for beginners' or 'coding assistant similar to Copilot'), and I'll find the best match.",
            timestamp: Date.now()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: query,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsLoading(true);

        try {
            const result = await matchProducts(userMsg.text!, allProducts);

            if (result && result.recommendations.length > 0) {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    data: result,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                const errorMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    text: "I couldn't find any specific matches for that in my database. Try broadening your request!",
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, errorMsg]);
            }
        } catch (error) {
            console.error("Matchmaker error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: "Sorry, I encountered errors while analyzing the database. Please try again.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to find full product object from ID
    const getProduct = (id: string) => allProducts.find(p => p.id === id);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    AI Matchmaker
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Your personal software concierge. Ask for what you need.
                </p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl bg-gray-50/50 dark:bg-dark-900/30 border border-gray-100 dark:border-gray-800 mb-4 scrollbar-thin">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                                : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                                }`}>
                                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                            </div>

                            {/* Content */}
                            <div className={`space-y-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>

                                {/* Text Bubble */}
                                {msg.text && (
                                    <div className={`inline-block px-4 py-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                )}

                                {/* Rich Results (Product Cards) */}
                                {msg.data && (
                                    <div className="space-y-4 w-full text-left">
                                        <div className="inline-block px-4 py-3 rounded-2xl rounded-tl-none bg-white dark:bg-dark-800 border border-purple-200 dark:border-purple-900/30 text-gray-800 dark:text-gray-200 shadow-sm mb-2">
                                            <p className="font-medium text-purple-700 dark:text-purple-400 text-sm mb-1 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Recommendation
                                            </p>
                                            {msg.data.summary}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {msg.data.recommendations.map(rec => {
                                                const product = getProduct(rec.productId);
                                                if (!product) return null;

                                                return (
                                                    <div key={rec.productId} className="relative flex flex-col group">
                                                        {/* AI Reason Badge */}
                                                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-t-xl p-3 text-xs text-purple-800 dark:text-purple-300">
                                                            <span className="font-bold block mb-0.5">Why it matches:</span>
                                                            {rec.reason}
                                                        </div>

                                                        {/* Actual Product Card - Modified wrapper to remove rounded-xl from top to attach to reason */}
                                                        <div className="flex-1 -mt-1 pt-1">
                                                            <ProductCard
                                                                product={product}
                                                                onClick={onProductClick}
                                                                onCompare={onCompare}
                                                                isSelectedForComparison={!!comparisonList.find(p => p.id === product.id)}
                                                                isFavorite={favorites.includes(product.id)}
                                                                onToggleFavorite={onToggleFavorite}
                                                            />
                                                        </div>

                                                        {/* Relevance Score */}
                                                        <div className="absolute top-12 right-2 bg-white dark:bg-dark-800 shadow-lg border border-gray-100 dark:border-gray-700 rounded-full px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 z-10">
                                                            {Math.round(rec.relevanceScore * 100)}% Match
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Bot size={16} />
                            </div>
                            <div className="flex items-center space-x-2 bg-white dark:bg-dark-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Describe what you need (e.g., 'open source text to speech for python')..."
                    className="w-full pl-6 pr-14 py-4 rounded-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg text-base text-gray-900 dark:text-white"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="absolute right-2 top-2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </form>
        </div>
    );
};

export default MatchmakerView;

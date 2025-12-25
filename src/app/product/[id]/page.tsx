import React from 'react';
import { Metadata } from 'next';
import { PRODUCTS as products } from '../../../data'; // Corrected import alias
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Star, Users, Calendar, Tag, Check, X } from 'lucide-react';
import { notFound } from 'next/navigation';

interface ProductPageProps {
    params: Promise<{
        id: string;
    }>;
}

// 1. Dynamic Metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params; // Await params
    if (!id) return { title: 'Product Not Found - Kinetiq' };

    const product = products.find((p) => p.id && p.id.toLowerCase() === id.toLowerCase());

    if (!product) {
        return {
            title: 'Product Not Found - Kinetiq',
        };
    }

    return {
        title: `${product.name} Review & Analysis - Kinetiq AI Database`,
        description: `Detailed analysis of ${product.name} (${product.category}). Read pros, cons, pricing, and AI-generated insights.`,
        openGraph: {
            title: `${product.name} - AI Tool Analysis`,
            description: product.description,
            images: [product.logoUrl],
        },
    };
}

// Force dynamic rendering to ensure case-insensitive lookup always runs
export const dynamic = 'force-dynamic';

// 2. Static Params removed to prevent build-time 404s
// export async function generateStaticParams() { ... }

// 3. Page Component
export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params; // Await params

    if (!id) {
        console.error("[ProductPage] Missing params.id");
        return notFound();
    }

    console.log(`[ProductPage] Searching for ID: ${id}`);

    // Case-insensitive lookup check
    const product = products.find((p) => p.id && p.id.toLowerCase() === id.toLowerCase());

    if (!product) {
        console.error(`[ProductPage] Product not found for ID: ${id}`);
        // Log first few IDs for debugging context
        try {
            console.log(`[ProductPage] Available IDs context: ${products.slice(0, 5).filter(p => p.id).map(p => p.id).join(', ')}`);
        } catch (e) {
            console.error("Error logging context ids");
        }
        return notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Database
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Product Hero */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100 dark:border-gray-700">
                    <div className="p-8 md:p-10">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <img
                                src={product.logoUrl}
                                alt={product.name}
                                className="w-32 h-32 rounded-3xl shadow-lg object-cover bg-gray-100"
                            />
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                                        {product.category}
                                    </span>
                                    {product.pricing.map((price) => (
                                        <span
                                            key={price}
                                            className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600"
                                        >
                                            {price}
                                        </span>
                                    ))}
                                </div>

                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                    {product.name}
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mb-6">
                                    {product.description}
                                </p>

                                <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <Star className="w-5 h-5 text-yellow-500 mr-2 fill-current" />
                                        <span className="font-bold text-gray-900 dark:text-white mr-1">
                                            {product.metrics.rating}
                                        </span>
                                        User Rating
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="w-5 h-5 text-blue-500 mr-2" />
                                        <span className="font-bold text-gray-900 dark:text-white mr-1">
                                            {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(
                                                product.metrics.totalUsers
                                            )}
                                        </span>
                                        Active Users
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 text-green-500 mr-2" />
                                        Launched {new Date(product.launchDate).getFullYear()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-dark-900/50 px-8 py-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <a
                            href={product.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Visit Website <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                            Key Features
                        </h3>
                        <ul className="space-y-4">
                            {product.features.map((feature, i) => (
                                <li key={i} className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <Tag className="w-5 h-5 text-blue-500 mr-2" />
                            Tags & Categorization
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {product.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

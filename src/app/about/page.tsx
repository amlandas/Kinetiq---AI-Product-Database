import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import AboutSection from '../../components/AboutSection';
import SiteHeader from '../../components/SiteHeader';

export const metadata: Metadata = {
  title: 'About Kinetiq',
  description: 'Why Kinetiq exists and how it helps teams make better AI tool decisions.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <SiteHeader />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-800 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">Kinetiq</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">About Kinetiq</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Decision support, not just search. Kinetiq helps teams narrow the AI landscape and make choices they can
            explain.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-dark-900"
            >
              Back to Kinetiq
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-dark-900"
            >
              Docs
            </Link>
          </div>
        </div>

        <AboutSection />
      </div>
    </main>
  );
}

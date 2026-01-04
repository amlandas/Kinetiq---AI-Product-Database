import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Sparkles,
  ArrowRightLeft,
  Filter,
  ListChecks,
  ClipboardList,
  Share2,
} from 'lucide-react';

type DocCardProps = {
  id?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
};

const DocCard = ({ id, title, icon: Icon, children }: DocCardProps) => (
  <section
    id={id}
    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-800 md:p-8"
  >
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">{children}</div>
  </section>
);

export const metadata: Metadata = {
  title: 'Kinetiq Docs',
  description: 'Workflows and guidance for making high-signal AI utility decisions with Kinetiq.',
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="relative overflow-hidden border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-dark-800">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-24 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-primary-100 blur-3xl dark:bg-primary-900/30"></div>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">Docs</p>
          <h1 className="mt-2 text-4xl font-semibold text-gray-900 dark:text-white">Kinetiq Docs</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Kinetiq is intentionally simple. The quickest path is to start with a real constraint and force a shortlist.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-dark-900"
            >
              Back to Kinetiq
            </Link>
            <a
              href="#matchmaker"
              className="rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              Start with Matchmaker
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <DocCard id="matchmaker" title="The Matchmaker workflow" icon={Sparkles}>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Describe the need.</strong> Write it like a human: "I need X for Y situation."</li>
            <li><strong>Add hard constraints.</strong> Budget, privacy requirements, deployment preferences, integrations.</li>
            <li><strong>Review the fit reasoning.</strong> Treat the fit score as a heuristic and read the explanation.</li>
            <li><strong>Shortlist 2-3 candidates.</strong> More than three recreates analysis paralysis.</li>
          </ol>
        </DocCard>

        <DocCard id="comparison" title="The Comparison workflow" icon={ArrowRightLeft}>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Select your shortlist.</strong> Keep it small.</li>
            <li><strong>Compare side-by-side.</strong> Look for differences that affect your workflow.</li>
            <li><strong>Name the trade-off.</strong> Flexibility vs. simplicity, control vs. speed, breadth vs. depth.</li>
            <li><strong>Decide and move on.</strong> A defensible decision beats a perfect decision that never happens.</li>
          </ol>
        </DocCard>

        <DocCard id="signals" title="Interpreting signals (without fooling yourself)" icon={Filter}>
          <p>
            In fast-moving ecosystems, data is noisy. Kinetiq makes signals usable without pretending they are truth.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Good ways to use signals</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Narrowing aid: filter out low-momentum options.</li>
                <li>Outlier detector: "high growth, low rating" is a prompt to investigate.</li>
                <li>Shared language: align a team on the reason behind a choice.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Bad ways to use signals</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Treating any single metric as a winner-picker.</li>
                <li>Assuming the fit score is "correct" without reading the reasoning.</li>
                <li>Making a decision without naming trade-offs.</li>
              </ul>
            </div>
          </div>
        </DocCard>

        <DocCard id="examples" title="Examples you can paste into Matchmaker" icon={ClipboardList}>
          <ul className="list-disc list-inside space-y-2">
            <li>"I need an AI coding assistant for a small team, strong Python support, and tight editor integration."</li>
            <li>"I need a writing utility that can handle long documents with citations and a calm interface."</li>
            <li>"I need a support utility that can draft responses, summarize tickets, and integrate with common systems."</li>
          </ul>
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
            Make constraints explicit. Clarity in, clarity out.
          </div>
        </DocCard>

        <DocCard id="exporting" title="Exporting and sharing" icon={Share2}>
          <p>Use exports when you need to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Share a shortlist with teammates.</li>
            <li>Capture trade-offs for a decision record.</li>
            <li>Revisit a choice later without restarting research.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            The goal is not just to choose. It is to remember why you chose.
          </p>
        </DocCard>
      </div>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '../../components/SiteHeader';
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
      <SiteHeader />
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">The core value</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Choose based on constraints, not hype.
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Kinetiq replaces open-ended searching with structured discovery.
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white">Ask AI Matchmaker</p>
                <p className="mt-2">
                  Describe your needs in plain English and get recommendations with a fit score, plus
                  alternatives worth considering.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white">Structured comparisons</p>
                <p className="mt-2">
                  Compare candidates across dimensions that matter in practice, not marketing checklists.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              The goal is not to crown a winner. It is to leave you with a decision you can defend.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Try the workflow (60 seconds)</p>
            <ol className="mt-4 list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>Open <strong>Ask AI Matchmaker</strong> and describe your constraints.</li>
              <li>Skim the <strong>Why this fits</strong> reasoning and the trade-offs.</li>
              <li>Move your top two into <strong>Compare</strong> and make the call.</li>
            </ol>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              A clean decision beats an endless search.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">What Kinetiq helps with</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Discovery</p>
              <p className="mt-2">Browse a broad catalog without getting lost in AI slop.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Filtering</p>
              <p className="mt-2">Narrow by hard constraints like pricing, ratings, and growth signals.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Shortlisting</p>
              <p className="mt-2">Go from "I have a problem" to "here are three real options" fast.</p>
            </div>
          </div>
        </div>

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

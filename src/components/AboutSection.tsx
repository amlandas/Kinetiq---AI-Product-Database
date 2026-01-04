import React from "react";

type AboutSectionProps = {
  id?: string;
};

export default function AboutSection({ id }: AboutSectionProps) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-dark-800 md:p-8"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">About</p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">The hidden tax of research</h2>
      </div>

      <div className="mt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <p>"Researching AI utilities" has quietly become a second job.</p>
        <p>
          Most teams do not struggle because they cannot find options. They struggle because they cannot confidently
          narrow them down. Useful information is scattered across vendor pages, SEO-heavy articles, and fragmented
          community threads, each with its own bias.
        </p>
        <p>
          Kinetiq is built to handle the narrowing step. It does not pretend there is one best choice. It assumes there
          is a best choice for your constraints and helps you surface that fit without needing category jargon.
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Who this is for</h3>
        <ul className="mt-3 list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Practitioners</strong> who move fast but do not want resume-driven development.</li>
          <li><strong>Product and engineering teams</strong> who need to justify trade-offs.</li>
          <li><strong>Builders</strong> who want a shortlist based on capabilities, not keyword density.</li>
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What makes it different</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white">Decision quality over volume</p>
            <p className="mt-2">The point is not to show everything. It is to help you decide.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white">Intent-based discovery</p>
            <p className="mt-2">Start from a job-to-be-done and constraints instead of hunting categories.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-dark-900 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white">Comparison that matches real trade-offs</p>
            <p className="mt-2">Side-by-side views push you toward clarity instead of endless browsing.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">A note on signals and trust</h3>
        <p>
          Kinetiq uses metrics like ratings, growth signals, and adoption estimates to help you narrow. These are
          useful, but they are not perfect.
        </p>
        <p>
          Use them like a speedometer: a strong signal, not the full story. If something looks like an outlier, high
          growth with low ratings or the opposite, treat it as a prompt to investigate, not a conclusion.
        </p>
        <p>Kinetiq is meant to reduce guesswork, not replace judgment.</p>
      </div>
    </section>
  );
}

"use client";

import { AnalysisResult } from "@/types";
import { useState } from "react";

interface ProjectResultsProps {
  result: AnalysisResult;
}

export function ProjectResults({ result }: ProjectResultsProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "raw" | "blog">("insights");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 px-6">
          <button
            onClick={() => setActiveTab("insights")}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "insights"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "blog"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Blog Draft
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "raw"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Raw Data
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "insights" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {result.insight_report.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {result.insight_report.overview}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Key Insights</h3>
              <ul className="space-y-2">
                {result.insight_report.key_insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Blog Outline</h3>
              <ol className="space-y-2">
                {result.insight_report.blog_outline.map((section, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium">{i + 1}.</span>
                    <span>{section}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {activeTab === "blog" && (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
              {result.blog_draft}
            </pre>
          </div>
        )}

        {activeTab === "raw" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Posts Analyzed: {result.raw_data.posts?.length || 0}
              </h3>
              <h3 className="text-lg font-semibold mb-2">
                Comments Analyzed: {result.raw_data.comments?.length || 0}
              </h3>
            </div>
            <details className="cursor-pointer">
              <summary className="font-medium text-blue-600 dark:text-blue-400">
                View Summaries ({result.summaries.length} batches)
              </summary>
              <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
                {JSON.stringify(result.summaries, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

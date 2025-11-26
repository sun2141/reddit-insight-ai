"use client";

import { startAnalysis } from "@/app/actions";
import { useState } from "react";

export function AnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      await startAnalysis(formData);
    } catch (error) {
      console.error("Error starting analysis:", error);
      alert("Failed to start analysis. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">New Analysis</h2>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium mb-2">
            Keyword
          </label>
          <input
            type="text"
            id="keyword"
            name="keyword"
            required
            placeholder="e.g., productivity"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="subreddit" className="block text-sm font-medium mb-2">
            Subreddit
          </label>
          <input
            type="text"
            id="subreddit"
            name="subreddit"
            required
            placeholder="e.g., productivity"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Without the "r/" prefix
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? "Starting..." : "Start Analysis"}
        </button>
      </form>
    </div>
  );
}

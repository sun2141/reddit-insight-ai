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
          <label htmlFor="feedType" className="block text-sm font-medium mb-2">
            Feed Type
          </label>
          <select
            id="feedType"
            name="feedType"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            disabled={isLoading}
            defaultValue="top"
          >
            <option value="top">Top Stories</option>
            <option value="best">Best Stories</option>
            <option value="new">New Stories</option>
          </select>
        </div>

        <div>
          <label htmlFor="storyCount" className="block text-sm font-medium mb-2">
            Number of Stories
          </label>
          <input
            type="number"
            id="storyCount"
            name="storyCount"
            required
            min="1"
            max="50"
            defaultValue="10"
            placeholder="e.g., 10"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Max: 50 stories
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="minScore" className="block text-sm font-medium mb-2">
              Min Score
            </label>
            <input
              type="number"
              id="minScore"
              name="minScore"
              min="0"
              defaultValue="50"
              placeholder="e.g., 50"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="minComments" className="block text-sm font-medium mb-2">
              Min Comments
            </label>
            <input
              type="number"
              id="minComments"
              name="minComments"
              min="0"
              defaultValue="10"
              placeholder="e.g., 10"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              disabled={isLoading}
            />
          </div>
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

"use client";

import { Project } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProjectStatusProps {
  project: Project;
}

export function ProjectStatus({ project }: ProjectStatusProps) {
  const router = useRouter();

  // Poll for updates if processing
  useEffect(() => {
    if (project.status === "processing" || project.status === "pending") {
      const interval = setInterval(() => {
        router.refresh();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [project.status, router]);

  const statusInfo = {
    pending: {
      color: "bg-gray-500",
      text: "Pending",
      description: "Waiting to start...",
    },
    processing: {
      color: "bg-blue-500",
      text: "Processing",
      description: "Analyzing Reddit data...",
    },
    completed: {
      color: "bg-green-500",
      text: "Completed",
      description: "Analysis complete!",
    },
    failed: {
      color: "bg-red-500",
      text: "Failed",
      description: project.error_message || "An error occurred",
    },
  };

  const info = statusInfo[project.status];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${info.color} animate-pulse`} />
        <div>
          <p className="font-semibold text-lg">{info.text}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {info.description}
          </p>
        </div>
      </div>

      {(project.status === "processing" || project.status === "pending") && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/2" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This may take 2-5 minutes depending on the amount of data...
          </p>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { Project } from "@/types";

interface ProjectListProps {
  projects: Project[];
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const styles = {
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const labels = {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Projects</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No projects yet. Start your first analysis!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Recent Projects</h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/project/${project.id}`}
            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {project.feed_type?.toUpperCase()} Stories
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {project.story_count} stories · Min score: {project.min_score || 0} · Min comments: {project.min_comments || 0}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(project.created_at).toLocaleString()}
            </p>
            {project.error_message && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Error: {project.error_message}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

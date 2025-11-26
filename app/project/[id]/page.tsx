import { notFound } from "next/navigation";
import { getProjectWithResult } from "@/services/db";
import { ProjectStatus } from "@/components/ProjectStatus";
import { ProjectResults } from "@/components/ProjectResults";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project, result } = await getProjectWithResult(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{project.keyword}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analysis for r/{project.subreddit}
        </p>
      </div>

      <ProjectStatus project={project} />

      {result && <ProjectResults result={result} />}
    </main>
  );
}

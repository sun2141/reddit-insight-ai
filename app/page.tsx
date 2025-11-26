import { getProjects } from "@/services/db";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ProjectList } from "@/components/ProjectList";

export default async function Home() {
  const projects = await getProjects(10);

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Reddit Insight AI</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          AI-powered Reddit insights for automated blog generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <AnalysisForm />
        </div>

        <div className="lg:col-span-2">
          <ProjectList projects={projects} />
        </div>
      </div>
    </main>
  );
}

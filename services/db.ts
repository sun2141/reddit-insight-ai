import { createClient } from "@supabase/supabase-js";
import { Project, AnalysisResult, ProjectStatus } from "@/types";

// Server-side Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===== Projects Table =====

/**
 * Create a new project
 */
export async function createProject(
  feedType: string,
  storyCount: number,
  minScore: number = 0,
  minComments: number = 0
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      source: "hackernews",
      feed_type: feedType,
      story_count: storyCount,
      min_score: minScore,
      min_comments: minComments,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Get all projects
 */
export async function getProjects(limit: number = 50): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({
      status,
      error_message: errorMessage || null,
    })
    .eq("id", id);

  if (error) throw error;
}

// ===== Analysis Results Table =====

/**
 * Save analysis results
 */
export async function saveAnalysisResult(
  projectId: string,
  rawData: any,
  summaries: any[],
  insightReport: any,
  blogDraft: string
): Promise<AnalysisResult> {
  const { data, error } = await supabase
    .from("analysis_results")
    .insert({
      project_id: projectId,
      raw_data: rawData,
      summaries,
      insight_report: insightReport,
      blog_draft: blogDraft,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get analysis result by project ID
 */
export async function getAnalysisResult(projectId: string): Promise<AnalysisResult | null> {
  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

/**
 * Get project with analysis result
 */
export async function getProjectWithResult(projectId: string) {
  const project = await getProject(projectId);
  const result = await getAnalysisResult(projectId);

  return {
    project,
    result,
  };
}

// ===== WordPress Posts Table =====

/**
 * Save WordPress post info
 */
export async function saveWordPressPost(
  projectId: string,
  wpPostId: number,
  status: string,
  url: string
) {
  const { data, error } = await supabase
    .from("wordpress_posts")
    .insert({
      project_id: projectId,
      wp_post_id: wpPostId,
      status,
      url,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get WordPress post by project ID
 */
export async function getWordPressPost(projectId: string) {
  const { data, error } = await supabase
    .from("wordpress_posts")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

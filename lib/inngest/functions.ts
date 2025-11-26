import { inngest } from "./client";
import { collectRedditData } from "@/services/reddit";
import { analyzeComments, generateInsights } from "@/services/ai";
import { updateProjectStatus, saveAnalysisResult } from "@/services/db";

export const analyzeRedditWorkflow = inngest.createFunction(
  {
    id: "analyze-reddit",
    name: "Analyze Reddit Subreddit",
  },
  { event: "reddit/analyze.requested" },
  async ({ event, step }) => {
    const { projectId, keyword, subreddit } = event.data;

    try {
      // Update status to processing
      await updateProjectStatus(projectId, "processing");

      // Step 1: Fetch Reddit data
      const redditData = await step.run("fetch-reddit-data", async () => {
        console.log(`Fetching Reddit data for: ${keyword} in r/${subreddit}`);
        return await collectRedditData(subreddit, keyword);
      });

      // Step 2: Analyze comments with Gemini
      const summaries = await step.run("analyze-comments", async () => {
        console.log(`Analyzing ${redditData.totalComments} comments`);
        if (redditData.comments.length === 0) {
          return [];
        }
        return await analyzeComments(redditData.comments);
      });

      // Step 3: Generate insights with GPT-4o
      const insights = await step.run("generate-insights", async () => {
        console.log("Generating insights from summaries");
        if (summaries.length === 0) {
          throw new Error("No summaries available for insight generation");
        }
        return await generateInsights(keyword, subreddit, summaries);
      });

      // Step 4: Save results to database
      const result = await step.run("save-results", async () => {
        console.log(`Saving results for project ${projectId}`);

        const analysisResult = await saveAnalysisResult(
          projectId,
          { posts: redditData.posts, comments: redditData.comments },
          summaries,
          insights,
          insights.markdown_content
        );

        // Update project status to completed
        await updateProjectStatus(projectId, "completed");

        return analysisResult;
      });

      // Send completion event
      await step.sendEvent("analysis-completed", {
        name: "reddit/analysis.completed",
        data: {
          projectId,
          resultId: result.id,
        },
      });

      return result;
    } catch (error) {
      console.error("Workflow error:", error);

      // Update project status to failed
      await updateProjectStatus(
        projectId,
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );

      throw error;
    }
  }
);

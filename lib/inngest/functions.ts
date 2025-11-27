import { inngest } from "./client";
import { collectHackerNewsData } from "@/services/hackerNews";
import { analyzeComments, generateInsights } from "@/services/ai";
import { updateProjectStatus, saveAnalysisResult } from "@/services/db";

export const analyzeHackerNewsWorkflow = inngest.createFunction(
  {
    id: "analyze-hackernews",
    name: "Analyze Hacker News Stories",
  },
  { event: "hackernews/analyze.requested" },
  async ({ event, step }) => {
    const { projectId, feedType, storyCount, minScore, minComments } = event.data;

    try {
      // Update status to processing
      await updateProjectStatus(projectId, "processing");

      // Step 1: Fetch Hacker News data
      const hnData = await step.run("fetch-hackernews-data", async () => {
        console.log(`Fetching Hacker News ${feedType} stories (limit: ${storyCount})`);
        return await collectHackerNewsData({
          feedType: feedType as 'top' | 'best' | 'new',
          limit: storyCount,
          minScore,
          minComments,
        });
      });

      // Step 2: Analyze comments with Gemini
      const summaries = await step.run("analyze-comments", async () => {
        console.log(`Analyzing ${hnData.totalComments} comments`);
        if (hnData.comments.length === 0) {
          return [];
        }
        return await analyzeComments(hnData.comments);
      });

      // Step 3: Generate insights with GPT-4o
      const insights = await step.run("generate-insights", async () => {
        console.log("Generating insights from summaries");
        if (summaries.length === 0) {
          throw new Error("No summaries available for insight generation");
        }
        return await generateInsights(feedType, summaries);
      });

      // Step 4: Save results to database
      const result = await step.run("save-results", async () => {
        console.log(`Saving results for project ${projectId}`);

        const analysisResult = await saveAnalysisResult(
          projectId,
          { posts: hnData.stories, comments: hnData.comments },
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
        name: "hackernews/analysis.completed",
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

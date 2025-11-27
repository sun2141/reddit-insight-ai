"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inngest } from "@/lib/inngest/client";
import { createProject } from "@/services/db";

export async function startAnalysis(formData: FormData) {
  const feedType = formData.get("feedType") as string;
  const storyCount = parseInt(formData.get("storyCount") as string);
  const minScore = parseInt(formData.get("minScore") as string) || 0;
  const minComments = parseInt(formData.get("minComments") as string) || 0;

  if (!feedType || !storyCount) {
    throw new Error("Feed type and story count are required");
  }

  // Create project in database
  const project = await createProject(feedType, storyCount, minScore, minComments);

  // Trigger Inngest workflow
  await inngest.send({
    name: "hackernews/analyze.requested",
    data: {
      projectId: project.id,
      feedType,
      storyCount,
      minScore,
      minComments,
    },
  });

  // Revalidate home page and redirect to project page
  revalidatePath("/");
  redirect(`/project/${project.id}`);
}

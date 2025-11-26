"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inngest } from "@/lib/inngest/client";
import { createProject } from "@/services/db";

export async function startAnalysis(formData: FormData) {
  const keyword = formData.get("keyword") as string;
  const subreddit = formData.get("subreddit") as string;

  if (!keyword || !subreddit) {
    throw new Error("Keyword and subreddit are required");
  }

  // Create project in database
  const project = await createProject(keyword, subreddit);

  // Trigger Inngest workflow
  await inngest.send({
    name: "reddit/analyze.requested",
    data: {
      projectId: project.id,
      keyword,
      subreddit,
    },
  });

  // Revalidate home page and redirect to project page
  revalidatePath("/");
  redirect(`/project/${project.id}`);
}

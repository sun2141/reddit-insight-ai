import Snoowrap from "snoowrap";
import { RedditPost, RedditComment } from "@/types";

// Initialize Reddit client
function getRedditClient() {
  return new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT || "reddit-insight-ai:v1.0.0",
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
  });
}

/**
 * Search for posts in a subreddit
 */
export async function searchSubreddit(
  subreddit: string,
  keyword: string,
  options?: {
    limit?: number;
    timeframe?: "hour" | "day" | "week" | "month" | "year" | "all";
  }
): Promise<RedditPost[]> {
  const reddit = getRedditClient();
  const limit = options?.limit || 25;
  const time = options?.timeframe || "month";

  try {
    const posts = await reddit
      .getSubreddit(subreddit)
      .search({
        query: keyword,
        time,
        limit,
        sort: "top",
      });

    return posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      author: post.author.name,
      url: post.url,
      score: post.score,
      num_comments: post.num_comments,
      created_utc: post.created_utc,
      selftext: post.selftext || "",
    }));
  } catch (error) {
    console.error("Error searching subreddit:", error);
    throw error;
  }
}

/**
 * Get comments from a post
 */
export async function getPostComments(
  postId: string,
  options?: {
    limit?: number;
    minScore?: number;
  }
): Promise<RedditComment[]> {
  const reddit = getRedditClient();
  const minScore = options?.minScore || 1;

  try {
    const submission = await reddit.getSubmission(postId);
    const comments = await submission.comments.fetchAll({ amount: options?.limit || 100 });

    const flattenComments = (commentList: any[]): RedditComment[] => {
      const result: RedditComment[] = [];

      for (const comment of commentList) {
        // Skip deleted/removed comments and bots
        if (
          !comment.author ||
          comment.author.name === "[deleted]" ||
          comment.author.name === "AutoModerator" ||
          comment.body === "[deleted]" ||
          comment.body === "[removed]"
        ) {
          continue;
        }

        // Skip low-score comments
        if (comment.score < minScore) {
          continue;
        }

        result.push({
          id: comment.id,
          author: comment.author.name,
          body: comment.body,
          score: comment.score,
          created_utc: comment.created_utc,
        });

        // Recursively get replies
        if (comment.replies && comment.replies.length > 0) {
          result.push(...flattenComments(comment.replies));
        }
      }

      return result;
    };

    return flattenComments(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
}

/**
 * Collect data: search posts and get all comments
 */
export async function collectRedditData(subreddit: string, keyword: string) {
  const posts = await searchSubreddit(subreddit, keyword, {
    limit: 10,
    timeframe: "month",
  });

  const allComments: RedditComment[] = [];

  for (const post of posts) {
    const comments = await getPostComments(post.id, {
      limit: 100,
      minScore: 2,
    });
    allComments.push(...comments);

    // Rate limiting: wait 1 second between posts
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return {
    posts,
    comments: allComments,
    totalPosts: posts.length,
    totalComments: allComments.length,
  };
}

import axios from 'axios';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// Types
export interface HNItem {
  id: number;
  type?: 'story' | 'comment' | 'job' | 'poll' | 'pollopt';
  by?: string;
  time?: number;
  text?: string;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
  kids?: number[];
  parent?: number;
  deleted?: boolean;
  dead?: boolean;
}

export interface HNStoryWithComments {
  story: HNItem;
  comments: HNItem[];
}

export interface FetchOptions {
  feedType: 'top' | 'best' | 'new';
  limit: number;
  minScore?: number;
  minComments?: number;
}

/**
 * Get story IDs from a feed
 */
export async function getStoryIds(feedType: 'top' | 'best' | 'new'): Promise<number[]> {
  const response = await axios.get<number[]>(`${HN_API_BASE}/${feedType}stories.json`);
  return response.data;
}

/**
 * Get a single item by ID
 */
export async function getItem(id: number): Promise<HNItem | null> {
  try {
    const response = await axios.get<HNItem>(`${HN_API_BASE}/item/${id}.json`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch item ${id}:`, error);
    return null;
  }
}

/**
 * Recursively flatten comments
 */
async function flattenComments(item: HNItem, depth: number = 0, maxDepth: number = 10): Promise<HNItem[]> {
  if (depth > maxDepth || !item.kids || item.kids.length === 0) {
    return [];
  }

  const comments: HNItem[] = [];

  for (const kidId of item.kids) {
    const kid = await getItem(kidId);

    if (!kid || kid.deleted || kid.dead || !kid.text) {
      continue;
    }

    comments.push(kid);

    // Recursively get replies
    const replies = await flattenComments(kid, depth + 1, maxDepth);
    comments.push(...replies);
  }

  return comments;
}

/**
 * Get a story with all its comments
 */
export async function getStoryWithComments(storyId: number): Promise<HNStoryWithComments | null> {
  const story = await getItem(storyId);

  if (!story || story.deleted || story.dead) {
    return null;
  }

  const comments = await flattenComments(story);

  return {
    story,
    comments,
  };
}

/**
 * Fetch top stories with filtering
 */
export async function fetchTopStories(options: FetchOptions): Promise<HNStoryWithComments[]> {
  const { feedType, limit, minScore = 0, minComments = 0 } = options;

  // Get story IDs
  const storyIds = await getStoryIds(feedType);

  const results: HNStoryWithComments[] = [];
  let processed = 0;

  for (const storyId of storyIds) {
    if (results.length >= limit) {
      break;
    }

    processed++;
    if (processed > limit * 3) {
      // Safety: don't process more than 3x the limit
      break;
    }

    const storyWithComments = await getStoryWithComments(storyId);

    if (!storyWithComments) {
      continue;
    }

    const { story, comments } = storyWithComments;

    // Apply filters
    if ((story.score || 0) < minScore) {
      continue;
    }

    if ((story.descendants || 0) < minComments) {
      continue;
    }

    results.push(storyWithComments);

    // Rate limiting: small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Collect data for analysis
 */
export async function collectHackerNewsData(options: FetchOptions) {
  const storiesWithComments = await fetchTopStories(options);

  const allComments = storiesWithComments.flatMap(s => s.comments);
  const allStories = storiesWithComments.map(s => s.story);

  return {
    stories: allStories,
    comments: allComments,
    totalStories: allStories.length,
    totalComments: allComments.length,
  };
}

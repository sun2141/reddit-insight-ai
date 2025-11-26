// Reddit Types
export interface RedditPost {
  id: string;
  title: string;
  author: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
}

// Analysis Types
export interface AnalysisSummary {
  pain_points: string[];
  emotions: string[];
  key_topics: string[];
  summary: string;
}

export interface InsightReport {
  title: string;
  overview: string;
  key_insights: string[];
  blog_outline: string[];
  markdown_content: string;
}

// Database Types
export type ProjectStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Project {
  id: string;
  keyword: string;
  subreddit: string;
  status: ProjectStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  project_id: string;
  raw_data: any;
  summaries: AnalysisSummary[];
  insight_report: InsightReport;
  blog_draft: string;
  created_at: string;
}

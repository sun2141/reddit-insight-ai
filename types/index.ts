// Hacker News Types
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

export interface HNComment {
  id: number;
  by?: string;
  text?: string;
  time?: number;
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
  source?: string;
  feed_type?: string;
  story_count?: number;
  min_score?: number;
  min_comments?: number;
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

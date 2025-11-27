import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { HNItem, AnalysisSummary, InsightReport } from "@/types";

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Summarize a batch of comments using Gemini Flash
 */
export async function summarizeBatch(
  comments: HNItem[]
): Promise<AnalysisSummary> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const commentsText = comments
    .map((c, i) => `${i + 1}. [by: ${c.by}] ${c.text || ''}`)
    .join("\n\n");

  const prompt = `다음은 Hacker News 댓글 모음입니다. 이 댓글들을 분석하여 다음 항목을 추출해주세요:

댓글들:
${commentsText}

다음 형식으로 JSON을 반환해주세요:
{
  "pain_points": ["사용자들이 겪는 문제점 1", "문제점 2", ...],
  "emotions": ["감정 1", "감정 2", ...],
  "key_topics": ["주요 주제 1", "주제 2", ...],
  "summary": "전체 댓글의 핵심 요약 (2-3문장)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error in Gemini summarization:", error);
    throw error;
  }
}

/**
 * Process all comments in batches
 */
export async function analyzeComments(
  comments: HNItem[],
  batchSize: number = 50
): Promise<AnalysisSummary[]> {
  const summaries: AnalysisSummary[] = [];
  const batches = [];

  // Split comments into batches
  for (let i = 0; i < comments.length; i += batchSize) {
    batches.push(comments.slice(i, i + batchSize));
  }

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    console.log(`Processing batch ${i + 1}/${batches.length}`);
    const summary = await summarizeBatch(batches[i]);
    summaries.push(summary);

    // Rate limiting: wait 2 seconds between batches
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return summaries;
}

/**
 * Generate final insights and blog draft using GPT-4o
 */
export async function generateInsights(
  feedType: string,
  summaries: AnalysisSummary[]
): Promise<InsightReport> {
  const summariesText = summaries
    .map((s, i) => {
      return `
배치 ${i + 1}:
- Pain Points: ${s.pain_points.join(", ")}
- Emotions: ${s.emotions.join(", ")}
- Key Topics: ${s.key_topics.join(", ")}
- Summary: ${s.summary}
`;
    })
    .join("\n");

  const prompt = `당신은 Hacker News 데이터 분석 전문가입니다.
다음은 Hacker News ${feedType} stories에서 수집한 댓글들의 요약입니다.

${summariesText}

이 데이터를 바탕으로 다음을 생성해주세요:

1. 블로그 포스트 제목 (매력적이고 SEO 최적화된)
2. 전체 개요 (2-3문단)
3. 핵심 인사이트 5-7개 (각 인사이트는 구체적인 데이터 기반)
4. 블로그 아웃라인 (섹션 제목들)
5. 완전한 블로그 마크다운 콘텐츠 (1500-2000 단어)

다음 JSON 형식으로 반환해주세요:
{
  "title": "블로그 제목",
  "overview": "전체 개요",
  "key_insights": ["인사이트 1", "인사이트 2", ...],
  "blog_outline": ["섹션 1", "섹션 2", ...],
  "markdown_content": "# 제목\\n\\n## 섹션 1\\n..."
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a data analyst and content writer specializing in Hacker News insights. Provide detailed, data-driven analysis in Korean.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    return JSON.parse(result!);
  } catch (error) {
    console.error("Error in GPT-4o insight generation:", error);
    throw error;
  }
}

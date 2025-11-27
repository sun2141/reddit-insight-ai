# 🔶 Hacker News Insight AI - Claude Code 개발 계획서

> **Reddit API 대체 버전** - Hacker News Firebase API 사용 (인증 불필요!)

---

## 📋 목차
1. [변경사항 요약](#1-변경사항-요약)
2. [아키텍처 & Tech Stack](#2-아키텍처--tech-stack)
3. [API 목록](#3-api-목록)
4. [MCP 서버 구성](#4-mcp-서버-구성)
5. [Phase별 Claude Code 프롬프트](#5-phase별-claude-code-프롬프트)
6. [환경 변수](#6-환경-변수)
7. [운영 가이드](#7-운영-가이드)

---

## 1. 변경사항 요약

### ✅ Reddit → Hacker News 전환 이점

| 항목 | Reddit API | Hacker News API |
|------|-----------|-----------------|
| **인증** | OAuth2 필요 (복잡) | 불필요 (공개) ✨ |
| **Rate Limit** | 60 req/min (엄격) | 비공식, 유연함 |
| **라이브러리** | snoowrap 필요 | fetch/axios만으로 충분 |
| **데이터 구조** | 복잡 | 단순 (Firebase JSON) |
| **비용** | 무료지만 제한적 | 완전 무료 |

### 🔄 주요 변경점
```diff
- snoowrap (Reddit 라이브러리)
+ axios (HTTP 클라이언트)

- Reddit OAuth2 인증 설정
+ 인증 없이 바로 사용

- 서브레딧 기반 검색
+ Top/Best/New Stories 기반 수집

+ 스케줄 기능 추가 (하루 1회 자동 실행)
```

---

## 2. 아키텍처 & Tech Stack

### 🏗 시스템 구조
```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Next.js    │───▶│  Inngest    │───▶│  Supabase   │     │
│  │  Dashboard  │    │  Workflow   │    │  (Cloud)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                                 │
└─────────│──────────────────│─────────────────────────────────┘
          │                  │
          ▼                  ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Hacker News │    │   Gemini    │───▶│   GPT-4o    │
   │ Firebase API│    │   (Map)     │    │  (Reduce)   │
   └─────────────┘    └─────────────┘    └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  WordPress  │
                                         │  REST API   │
                                         └─────────────┘
```

### 📦 Tech Stack
| 카테고리 | 기술 | 용도 |
|---------|------|------|
| Framework | Next.js 14 (App Router) | 메인 앱 |
| Deployment | Vercel | 서버리스 배포 |
| Database | Supabase Cloud | 데이터 저장 |
| Queue | Inngest | 백그라운드 작업 + **스케줄링** |
| AI (Map) | Gemini 1.5 Flash | 댓글 요약 (저비용) |
| AI (Reduce) | GPT-4o | 인사이트 생성 (고품질) |
| Data Source | **Hacker News API** | 뉴스/댓글 수집 |
| HTTP Client | axios | API 호출 |
| Publishing | WordPress REST API | 자동 발행 |

---

## 3. API 목록

### 🔶 Hacker News API (메인 데이터 소스)

```yaml
Base URL: https://hacker-news.firebaseio.com/v0

엔드포인트:
  GET /topstories.json     # 상위 500개 스토리 ID 배열
  GET /beststories.json    # 높은 점수 스토리 ID 배열  
  GET /newstories.json     # 최신 스토리 ID 배열
  GET /item/{id}.json      # 개별 아이템 (스토리/댓글)
  GET /user/{id}.json      # 사용자 정보

인증: 없음 (완전 공개) ✨
응답: JSON
Rate Limit: 공식 제한 없음 (단, 과도한 요청 자제)

아이템 타입:
  - story: 뉴스 링크 게시물
  - comment: 댓글
  - job: 채용 공고
  - poll: 투표
  - pollopt: 투표 옵션
```

**예시 응답 (Story):**
```json
{
  "id": 8863,
  "type": "story",
  "by": "dhouston",
  "time": 1175714200,
  "title": "My YC app: Dropbox - Throw away your USB drive",
  "url": "http://www.getdropbox.com/u/2/screencast.html",
  "score": 111,
  "descendants": 71,
  "kids": [8952, 9224, 8917, ...]
}
```

**예시 응답 (Comment):**
```json
{
  "id": 8952,
  "type": "comment",
  "by": "norvig",
  "time": 1175727286,
  "text": "Aw shucks, guys...",
  "parent": 8863,
  "kids": [9152, 9085, ...]
}
```

### 🟢 Google AI (Gemini 1.5 Flash)
```yaml
용도: 댓글 배치 요약 (Map 단계)
모델: gemini-1.5-flash
라이브러리: @google/generative-ai
발급: https://aistudio.google.com/apikey
비용: $0.075 / 1M input tokens
```

### 🔵 OpenAI (GPT-4o)
```yaml
용도: 인사이트/블로그 생성 (Reduce 단계)
모델: gpt-4o
라이브러리: openai
발급: https://platform.openai.com/api-keys
비용: $5 / 1M input, $15 / 1M output tokens
```

### 🟣 Supabase
```yaml
용도: 프로젝트/결과 저장
발급: https://supabase.com/dashboard
주의: Cloud 버전만 사용 (로컬 Docker X)
```

### 🟠 Inngest
```yaml
용도: 백그라운드 작업 + 스케줄링
발급: https://app.inngest.com
특징: 
  - step.run()으로 타임아웃 우회
  - cron 표현식으로 정기 실행
```

### ⬜ WordPress REST API
```yaml
용도: 블로그 자동 발행
인증: Application Password
```

---

## 4. MCP 서버 구성

### 📁 필수 MCP

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/sunho/Projects/hackernews-insight-ai"
      ]
    }
  }
}
```

### 🗄️ 권장 MCP (Supabase)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJxxx..."
      }
    }
  }
}
```

### 🐙 선택 MCP (GitHub)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxx"
      }
    }
  }
}
```

---

## 5. Phase별 Claude Code 프롬프트

### 🚀 시작 전 체크리스트

```bash
# 1. 프로젝트 폴더 생성
mkdir hackernews-insight-ai && cd hackernews-insight-ai

# 2. Claude Code 실행
claude

# 3. MCP 상태 확인
/mcp
```

---

### 📦 Phase 1: 프로젝트 초기화

```
Next.js 14 프로젝트를 생성하고 초기 설정해줘.

1. 프로젝트 생성:
   - TypeScript, Tailwind CSS, ESLint, App Router 사용
   - src/ 디렉토리 사용

2. 패키지 설치:
   npm install inngest @supabase/supabase-js @supabase/ssr \
               openai @google/generative-ai axios \
               lucide-react zod date-fns

3. 폴더 구조:
   src/
   ├── app/
   │   ├── api/
   │   │   └── inngest/
   │   ├── project/
   │   │   └── [id]/
   │   ├── layout.tsx
   │   └── page.tsx
   ├── components/
   │   └── ui/
   ├── lib/
   │   ├── supabase/
   │   └── inngest/
   ├── services/
   │   ├── hackerNews.ts
   │   ├── ai.ts
   │   ├── db.ts
   │   └── wordpress.ts
   └── types/
       └── index.ts

4. 설정 파일들:
   - .env.local 템플릿 (모든 API 키)
   - src/lib/supabase/client.ts (브라우저용)
   - src/lib/supabase/server.ts (서버용)
   - src/lib/inngest/client.ts
```

---

### ⚙️ Phase 2: Inngest 워크플로우

```
Inngest 기반 Hacker News 분석 워크플로우를 구현해줘.

1. app/api/inngest/route.ts
   - Inngest serve 엔트리포인트

2. src/lib/inngest/client.ts
   - Inngest 클라이언트 설정
   - 이벤트 타입 정의

3. src/lib/inngest/functions.ts
   워크플로우: "hackernews/analyze"
   
   Step 1: fetch-stories
   - Top/Best 스토리 상위 N개 가져오기
   - 최소 score, 최소 댓글 수 필터링
   
   Step 2: fetch-comments  
   - 각 스토리의 댓글 재귀적으로 수집
   - deleted, dead 필터링
   - step.run 내에서 병렬 처리
   
   Step 3: summarize-batch
   - Gemini로 댓글 50개씩 배치 요약
   - Pain points, 핵심 주제, 감정 추출
   
   Step 4: generate-insight
   - GPT-4o로 종합 인사이트 생성
   - 블로그 초안 작성 (마크다운)
   
   Step 5: save-results
   - Supabase에 결과 저장
   - 상태 업데이트 (completed)
   
   Step 6: publish-wordpress (선택적)
   - WordPress에 Draft로 발행

4. 스케줄 함수 추가:
   - "hackernews/daily-digest"
   - cron: "0 9 * * *" (매일 오전 9시)
   - 자동으로 analyze 워크플로우 트리거
```

---

### 🔶 Phase 3: Hacker News 서비스

```
Hacker News API 서비스를 구현해줘.

파일: src/services/hackerNews.ts

1. 타입 정의:
   interface HNItem {
     id: number;
     type: 'story' | 'comment' | 'job' | 'poll' | 'pollopt';
     by?: string;
     time?: number;
     text?: string;
     title?: string;
     url?: string;
     score?: number;
     descendants?: number;  // 총 댓글 수
     kids?: number[];       // 자식 댓글 ID 배열
     parent?: number;
     deleted?: boolean;
     dead?: boolean;
   }

   interface HNStoryWithComments {
     story: HNItem;
     comments: HNItem[];  // 평탄화된 댓글 리스트
   }

   interface FetchOptions {
     feedType: 'top' | 'best' | 'new';
     limit: number;        // 가져올 스토리 수
     minScore?: number;    // 최소 점수
     minComments?: number; // 최소 댓글 수
   }

2. 함수들:
   - getStoryIds(feedType): 스토리 ID 배열
   - getItem(id): 단일 아이템 조회
   - getStoryWithComments(storyId): 스토리 + 모든 댓글
   - fetchTopStories(options): 필터링된 스토리들 + 댓글
   
3. 헬퍼 함수:
   - flattenComments(item, depth): 재귀적 댓글 평탄화
   - filterValidComments(comments): deleted/dead 필터
   - delay(ms): Rate limit 대응

4. 에러 핸들링:
   - 재시도 로직 (3회)
   - 타임아웃 설정
   - 실패한 아이템 스킵
```

---

### 🤖 Phase 4: AI 서비스

```
AI 분석 서비스를 구현해줘.

파일: src/services/ai.ts

1. Gemini 서비스 (Map 단계):
   
   summarizeCommentBatch(comments: HNItem[]): Promise<BatchSummary>
   
   - 댓글 50개씩 배치 처리
   - 추출할 정보:
     * 주요 논점 (key_points)
     * Pain Points (불만/문제점)
     * 긍정적 반응
     * 기술적 인사이트
     * 논쟁 포인트
   - JSON 형식으로 출력하도록 프롬프트 설계

2. GPT-4o 서비스 (Reduce 단계):
   
   generateInsight(summaries: BatchSummary[], stories: HNItem[]): Promise<InsightReport>
   
   - 모든 요약을 종합
   - 출력물:
     * 오늘의 핵심 트렌드 (3-5개)
     * 개발자 커뮤니티 관심사
     * 주목할 만한 논쟁
     * 실용적 인사이트
   
   generateBlogDraft(insight: InsightReport): Promise<string>
   
   - 마크다운 형식 블로그 초안
   - SEO 친화적 제목
   - 섹션별 구조화
   - 원본 HN 링크 포함

3. 타입 정의:
   interface BatchSummary {
     storyId: number;
     keyPoints: string[];
     painPoints: string[];
     positives: string[];
     technicalInsights: string[];
     controversies: string[];
   }

   interface InsightReport {
     date: string;
     trends: Trend[];
     communityFocus: string[];
     notableDebates: Debate[];
     actionableInsights: string[];
   }
```

---

### 🗄️ Phase 5: Supabase 스키마

```
Supabase 테이블 스키마를 생성해줘.

SQL 쿼리 (Supabase SQL Editor에서 실행):

-- 프로젝트 테이블
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT DEFAULT 'hackernews',
  feed_type TEXT DEFAULT 'top',  -- top, best, new
  story_count INTEGER DEFAULT 10,
  min_score INTEGER DEFAULT 50,
  min_comments INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 분석 결과 테이블
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  raw_stories JSONB,      -- 수집된 스토리 원본
  raw_comments JSONB,     -- 수집된 댓글 원본
  summaries JSONB,        -- Gemini 요약 결과
  insight_report JSONB,   -- GPT-4o 인사이트
  blog_draft TEXT,        -- 생성된 블로그 초안
  stats JSONB,            -- 통계 (스토리 수, 댓글 수 등)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WordPress 발행 기록
CREATE TABLE wordpress_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  wp_post_id INTEGER,
  status TEXT,  -- draft, published
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS 정책 (필요시)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_posts ENABLE ROW LEVEL SECURITY;

---

DB 서비스 파일: src/services/db.ts

함수들:
- createProject(options): 새 프로젝트 생성
- updateProjectStatus(id, status, error?): 상태 업데이트  
- saveAnalysisResult(projectId, data): 결과 저장
- getProject(id): 프로젝트 조회
- getProjectWithResults(id): 프로젝트 + 결과 조회
- listProjects(limit, offset): 프로젝트 목록
- saveWordPressPost(projectId, wpData): WP 발행 기록
```

---

### 📝 Phase 6: WordPress 연동

```
WordPress REST API 연동을 구현해줘.

파일: src/services/wordpress.ts

1. 설정:
   - Application Password 인증 (Basic Auth)
   - base64 인코딩: `username:app_password`

2. 함수들:
   createDraftPost(data: {
     title: string;
     content: string;  // HTML
     categories?: number[];
     tags?: number[];
   }): Promise<WPPost>
   
   updatePost(postId: number, data: Partial<WPPost>)
   
   publishPost(postId: number)
   
   getPost(postId: number)

3. 유틸리티:
   markdownToHtml(markdown: string): string
   - 마크다운 → HTML 변환
   - 코드 블록 스타일링
   - HN 링크 처리

4. 에러 핸들링:
   - 인증 실패 → 명확한 에러 메시지
   - 네트워크 에러 → 재시도
   - 결과를 Supabase에 로깅
```

---

### 🎨 Phase 7: UI 구현

```
대시보드 UI를 구현해줘. shadcn/ui 사용.

먼저 컴포넌트 설치:
npx shadcn@latest init
npx shadcn@latest add button card input select tabs progress badge table

---

1. 메인 페이지 (app/page.tsx):

   레이아웃:
   - 헤더: "Hacker News Insight AI"
   - 새 분석 생성 폼:
     * Feed 선택 (Top/Best/New)
     * 스토리 수 (5-30)
     * 최소 Score (0-500)
     * 최소 댓글 수 (0-100)
     * "분석 시작" 버튼
   - 최근 프로젝트 목록 (테이블)
     * 상태 뱃지
     * 생성일
     * 스토리 수
     * 상세보기 링크

   Server Action:
   - createAnalysis(): 
     * projects 테이블에 레코드 생성
     * inngest.send('hackernews/analyze', { projectId })
     * 상세 페이지로 리다이렉트

---

2. 상세 페이지 (app/project/[id]/page.tsx):

   상단:
   - 프로젝트 정보 (Feed, 설정값)
   - 상태 Progress Bar
     * pending → processing → completed
   - 에러 시 에러 메시지 표시

   탭 구성:
   - "스토리": 수집된 HN 스토리 목록
     * 제목, 점수, 댓글 수, 링크
   - "댓글": 원본 댓글 브라우저
   - "요약": Gemini 요약 결과
   - "인사이트": GPT-4o 분석 리포트
   - "블로그": 생성된 초안 미리보기
     * 마크다운 렌더링
     * "WordPress 발행" 버튼

   실시간 업데이트:
   - 5초마다 상태 폴링
   - 완료되면 폴링 중지
   - 결과 자동 표시

---

3. 공통 컴포넌트:
   - StatusBadge: 상태별 색상
   - StoryCard: HN 스토리 카드
   - InsightSection: 인사이트 섹션
   - MarkdownPreview: 블로그 미리보기
```

---

### 🚀 Phase 8: 배포 & 스케줄링

```
Vercel 배포와 Inngest 스케줄링을 설정해줘.

1. next.config.js 확인:
   - 필요한 설정 추가

2. Vercel 환경변수 목록 정리 (복사용):
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   INNGEST_EVENT_KEY=
   INNGEST_SIGNING_KEY=
   OPENAI_API_KEY=
   GEMINI_API_KEY=
   WORDPRESS_URL=
   WORDPRESS_USERNAME=
   WORDPRESS_APP_PASSWORD=
   NEXT_PUBLIC_APP_URL=

3. Inngest Cloud 연동:
   - Vercel Integration 설치
   - 자동으로 키 주입됨

4. 스케줄 함수 (src/lib/inngest/functions.ts에 추가):

   // 매일 오전 9시 (KST) 자동 실행
   export const dailyDigest = inngest.createFunction(
     { id: 'hackernews-daily-digest' },
     { cron: '0 0 * * *' },  // UTC 0시 = KST 9시
     async ({ step }) => {
       // 기본 설정으로 분석 실행
       const project = await step.run('create-project', async () => {
         return await db.createProject({
           feedType: 'best',
           storyCount: 15,
           minScore: 100,
           minComments: 20
         });
       });
       
       // analyze 워크플로우 트리거
       await step.sendEvent('trigger-analysis', {
         name: 'hackernews/analyze',
         data: { projectId: project.id, autoPublish: true }
       });
     }
   );

5. 배포 후 테스트 체크리스트:
   [ ] 메인 페이지 로드 확인
   [ ] 수동 분석 생성 테스트
   [ ] Inngest 대시보드에서 실행 확인
   [ ] 각 Step 완료 확인
   [ ] Supabase 데이터 저장 확인
   [ ] WordPress Draft 발행 테스트
   [ ] 스케줄 함수 등록 확인
```

---

## 6. 환경 변수

```bash
# .env.local

# ===== Supabase =====
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== Inngest =====
INNGEST_EVENT_KEY=xxxxxxxxxxxxxxxx
INNGEST_SIGNING_KEY=signkey-xxxx-xxxx-xxxx

# ===== AI Models =====
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx

# ===== WordPress =====
WORDPRESS_URL=https://your-blog.com
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx

# ===== App =====
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== Hacker News (참고용 - 인증 불필요) =====
# HN_API_BASE=https://hacker-news.firebaseio.com/v0
```

---

## 7. 운영 가이드

### 📊 일일 운영 플로우

```
[매일 KST 09:00]
    │
    ▼
Inngest Cron 트리거
    │
    ▼
Best Stories 15개 수집
(score≥100, comments≥20)
    │
    ▼
댓글 수집 & Gemini 요약
    │
    ▼
GPT-4o 인사이트 생성
    │
    ▼
WordPress Draft 발행
    │
    ▼
[관리자] 검토 후 Publish
```

### 🔧 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| HN API 느림 | Firebase 특성 | Inngest 재시도 활용 |
| 댓글 누락 | deleted/dead | 필터링 로직 확인 |
| Gemini 에러 | Rate limit | 배치 크기 줄이기 |
| GPT 비용 과다 | 입력 토큰 | 요약 압축 강화 |
| WP 인증 실패 | 비밀번호 형식 | 공백 유지 확인 |

### 💰 예상 비용 (일일 기준)

```
Gemini (Map): ~500개 댓글 × $0.075/1M = ~$0.01
GPT-4o (Reduce): ~10K tokens = ~$0.05-0.10
Supabase: Free tier 충분
Inngest: Free tier (25K steps/month)
Vercel: Hobby plan 충분

예상 월 비용: $3-5 (사용량에 따라)
```

### ✅ 품질 체크리스트

```
[ ] 인사이트가 실제로 유용한가?
[ ] 중복되는 내용은 없는가?
[ ] HN 원문 링크가 정확한가?
[ ] SEO 키워드가 적절한가?
[ ] 블로그 톤이 일관적인가?
```

---

## 📚 참고 링크

| 리소스 | URL |
|--------|-----|
| **Hacker News API** | https://github.com/HackerNews/API |
| Inngest Docs | https://www.inngest.com/docs |
| Supabase Docs | https://supabase.com/docs |
| OpenAI API | https://platform.openai.com/docs |
| Gemini API | https://ai.google.dev/docs |
| WordPress REST | https://developer.wordpress.org/rest-api/ |
| shadcn/ui | https://ui.shadcn.com |

---

## 🎯 개발 시작 체크리스트

```
API 준비:
[x] Hacker News API - 인증 불필요! ✨
[ ] Supabase 프로젝트 생성
[ ] Inngest 계정 생성
[ ] OpenAI API 키 발급
[ ] Gemini API 키 발급
[ ] WordPress App Password 생성

MCP 설정:
[ ] Filesystem MCP 연결
[ ] Supabase MCP 연결 (권장)

개발 시작:
[ ] Claude Code 실행
[ ] Phase 1 프롬프트 실행
```

---

*Hacker News API는 인증이 필요 없어서 Reddit보다 훨씬 간단합니다!*  
*Happy Hacking! 🔶*

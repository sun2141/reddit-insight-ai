# 🚀 Reddit Insight AI - Claude Code 개발 계획서

> **원본 마스터 플랜 기반 + Claude Code 최적화 버전**

---

## 📋 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [필요한 API 목록](#2-필요한-api-목록)
3. [MCP 서버 구성](#3-mcp-서버-구성)
4. [Claude Code 개발 워크플로우](#4-claude-code-개발-워크플로우)
5. [Phase별 Claude 프롬프트](#5-phase별-claude-프롬프트)
6. [환경 변수 체크리스트](#6-환경-변수-체크리스트)
7. [트러블슈팅 가이드](#7-트러블슈팅-가이드)

---

## 1. 프로젝트 개요

### 🎯 핵심 아키텍처
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Next.js   │───▶│   Inngest   │───▶│  Supabase   │
│  (Vercel)   │    │   (Queue)   │    │  (Cloud)    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  Reddit API │    │  AI Models  │
│  (Snoowrap) │    │ Gemini+GPT  │
└─────────────┘    └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  WordPress  │
                  │  REST API   │
                  └─────────────┘
```

### 🛠 Tech Stack 요약
| 카테고리 | 기술 | 용도 |
|---------|------|------|
| Framework | Next.js 14 (App Router) | 메인 앱 |
| Deployment | Vercel | 서버리스 배포 |
| Database | Supabase Cloud | 데이터 저장 |
| Queue | Inngest | 백그라운드 작업 |
| AI (Map) | Gemini 1.5 Flash | 댓글 요약 (저비용) |
| AI (Reduce) | GPT-4o | 인사이트 생성 (고품질) |
| Data Source | Reddit API | 데이터 수집 |
| Publishing | WordPress REST API | 자동 발행 |

---

## 2. 필요한 API 목록

### 🔴 Reddit API
```yaml
용도: 서브레딧 포스트/댓글 수집
인증방식: OAuth2 (Script App)
라이브러리: snoowrap

발급처: https://www.reddit.com/prefs/apps
필요 정보:
  - client_id: 앱 ID (아래 "personal use script" 밑에 표시)
  - client_secret: secret 값
  - username: Reddit 계정
  - password: Reddit 비밀번호
  - user_agent: 앱 식별자 (예: "reddit-insight-ai:v1.0")

Rate Limit: 60 requests/minute
주의사항: 
  - "script" 타입으로 앱 생성
  - redirect_uri는 http://localhost:8080 으로 설정
```

### 🟢 Google AI (Gemini)
```yaml
용도: 댓글 배치 요약 (비용 최적화)
모델: gemini-1.5-flash
라이브러리: @google/generative-ai

발급처: https://aistudio.google.com/apikey
필요 정보:
  - GEMINI_API_KEY

가격: $0.075 / 1M input tokens (매우 저렴)
Rate Limit: 15 RPM (무료), 1000 RPM (유료)
```

### 🔵 OpenAI API
```yaml
용도: 최종 인사이트/블로그 생성 (고품질)
모델: gpt-4o
라이브러리: openai

발급처: https://platform.openai.com/api-keys
필요 정보:
  - OPENAI_API_KEY

가격: $5 / 1M input, $15 / 1M output tokens
Rate Limit: Tier에 따라 다름
```

### 🟣 Supabase
```yaml
용도: 프로젝트/분석결과 저장, 인증
라이브러리: @supabase/supabase-js, @supabase/ssr

발급처: https://supabase.com/dashboard
필요 정보:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (서버사이드용)

주의사항: 로컬 Docker 사용 금지 → Cloud 직접 연결
```

### 🟠 Inngest
```yaml
용도: 서버리스 백그라운드 작업 큐
라이브러리: inngest

발급처: https://app.inngest.com
필요 정보:
  - INNGEST_EVENT_KEY (이벤트 전송용)
  - INNGEST_SIGNING_KEY (웹훅 검증용)

특징:
  - step.run()으로 작업 분할 → Vercel 타임아웃 우회
  - 자동 재시도, 에러 핸들링
  - 무료 티어: 25,000 step/month
```

### 🔘 WordPress REST API
```yaml
용도: 블로그 자동 발행
인증방식: Application Password

설정 방법:
  1. WordPress 관리자 → 사용자 → 프로필
  2. "애플리케이션 비밀번호" 섹션에서 생성
  
필요 정보:
  - WORDPRESS_URL: https://your-site.com
  - WORDPRESS_USERNAME: 관리자 계정
  - WORDPRESS_APP_PASSWORD: 생성된 앱 비밀번호

라이브러리: wpapi 또는 fetch로 직접 호출
```

---

## 3. MCP 서버 구성

### Claude Code에서 사용할 MCP 서버들

#### 📁 Filesystem MCP (필수)
```json
// claude_desktop_config.json 또는 Claude Code 설정
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/사용자/Projects/reddit-insight-ai"
      ]
    }
  }
}
```
**용도:** 프로젝트 파일 읽기/쓰기, 코드 생성

#### 🐙 GitHub MCP (권장)
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
**용도:** 레포 생성, 커밋, PR 관리

#### 🗄️ Supabase MCP (강력 권장)
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
**용도:** 
- 테이블 스키마 직접 생성/수정
- SQL 쿼리 실행
- RLS 정책 설정
- Edge Functions 관리

#### 🌐 Fetch MCP (선택)
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-fetch"]
    }
  }
}
```
**용도:** API 문서 조회, 외부 리소스 참조

---

### 🔧 전체 MCP 설정 예시 (권장 구성)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/sunho/Projects/reddit-insight-ai"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-key"
      }
    }
  }
}
```

---

## 4. Claude Code 개발 워크플로우

### 📍 시작 전 준비사항

```bash
# 1. 프로젝트 디렉토리 생성
mkdir reddit-insight-ai && cd reddit-insight-ai

# 2. Claude Code 실행
claude

# 3. MCP 연결 확인
/mcp
```

### 🔄 권장 개발 순서

```
Phase 1: 프로젝트 초기화
    ↓
Phase 2: Inngest 설정
    ↓
Phase 3: 서비스 로직 (Reddit, AI)
    ↓
Phase 4: DB 스키마 & 서비스
    ↓
Phase 5: WordPress 연동
    ↓
Phase 6: UI 구현
    ↓
Phase 7: 배포
```

---

## 5. Phase별 Claude 프롬프트

### 📦 Phase 1: 프로젝트 초기화

```
Next.js 14 프로젝트를 초기화해줘.

요구사항:
- TypeScript, Tailwind CSS, ESLint, App Router 사용
- 다음 패키지 설치:
  inngest @supabase/supabase-js @supabase/ssr 
  openai @google/generative-ai snoowrap 
  lucide-react zod date-fns

생성할 파일:
1. .env.local 템플릿 (모든 API 키 placeholder)
2. src/lib/supabase/client.ts (브라우저용)
3. src/lib/supabase/server.ts (서버용)
4. src/lib/inngest/client.ts (Inngest 클라이언트)

폴더 구조도 같이 잡아줘:
src/
  ├── app/
  ├── components/
  ├── lib/
  ├── services/
  └── types/
```

---

### ⚙️ Phase 2: Inngest 워크플로우 설계

```
Inngest 기반 Reddit 분석 워크플로우를 만들어줘.

파일 구조:
1. app/api/inngest/route.ts - Inngest 엔트리포인트
2. src/lib/inngest/client.ts - Inngest 클라이언트 설정
3. src/lib/inngest/functions.ts - 워크플로우 정의

워크플로우 단계 (step.run 사용):
- Step 1: fetch-reddit-data (Reddit 데이터 수집)
- Step 2: analyze-comments (Gemini로 댓글 요약)
- Step 3: generate-report (GPT-4o로 인사이트 생성)
- Step 4: save-results (Supabase 저장)

각 step은 일단 mock return으로 구현하고,
step.sendEvent로 상태 업데이트 이벤트도 발송하도록 해줘.
```

---

### 🤖 Phase 3: 서비스 로직 구현

```
Reddit 수집과 AI 분석 서비스를 구현해줘.

1. src/services/reddit.ts:
   - snoowrap으로 서브레딧 검색
   - Top posts (지난달 기준) 가져오기
   - 댓글 수집 (봇/삭제 댓글 필터링)
   - 타입 정의 포함

2. src/services/ai.ts:
   - summarizeBatch(comments): Gemini 1.5 Flash
     → 댓글 50개씩 배치 처리
     → Pain Points, 감정, 핵심 주제 추출
   
   - generateInsight(summaries): GPT-4o
     → 요약 데이터 종합
     → 블로그 아웃라인 + 인사이트 생성
     → 마크다운 형식 출력

3. 타입 정의 (src/types/index.ts):
   - RedditPost, RedditComment
   - AnalysisSummary, InsightReport
```

---

### 🗄️ Phase 4: Supabase 스키마

```
Supabase 테이블 스키마를 설계해줘.

테이블:
1. projects
   - id: uuid (PK)
   - keyword: text (검색 키워드)
   - subreddit: text (대상 서브레딧)
   - status: enum ['pending', 'processing', 'completed', 'failed']
   - error_message: text (nullable)
   - created_at: timestamptz
   - updated_at: timestamptz

2. analysis_results
   - id: uuid (PK)
   - project_id: uuid (FK → projects)
   - raw_data: jsonb (수집된 원본 데이터)
   - summaries: jsonb (Gemini 요약 결과)
   - insight_report: jsonb (GPT-4o 인사이트)
   - blog_draft: text (생성된 블로그 초안)
   - created_at: timestamptz

3. wordpress_posts
   - id: uuid (PK)
   - project_id: uuid (FK)
   - wp_post_id: integer
   - status: text
   - url: text
   - created_at: timestamptz

서비스 파일도 같이 만들어줘:
- src/services/db.ts
- 각 테이블 CRUD 함수
- Inngest와 연동되는 상태 업데이트 함수
```

---

### 📝 Phase 5: WordPress 연동

```
WordPress REST API 연동을 구현해줘.

src/services/wordpress.ts:
- Application Password 인증
- createDraftPost(title, content, category)
  → Draft 상태로 포스트 생성
- updatePost(postId, updates)
- getPostStatus(postId)

HTML 변환 유틸:
- 마크다운 → HTML 변환
- 이미지 플레이스홀더 처리
- SEO 메타 태그 생성

Inngest 워크플로우에 publish-to-wordpress step 추가
```

---

### 🎨 Phase 6: UI 구현

```
대시보드 UI를 구현해줘. shadcn/ui 사용.

필요한 컴포넌트 먼저 설치:
npx shadcn@latest add button card input form tabs progress badge

페이지:
1. app/page.tsx (메인)
   - 키워드 입력 폼
   - 최근 프로젝트 목록
   - Server Action으로 Inngest 이벤트 트리거

2. app/project/[id]/page.tsx (상세)
   - 진행 상태 Progress Bar
   - 탭: 원본 데이터 / 요약 / 인사이트 / 블로그 초안
   - Polling으로 실시간 상태 업데이트 (5초 간격)
   - 완료 시 WordPress 발행 버튼

3. 공통 컴포넌트:
   - ProjectCard
   - StatusBadge
   - InsightViewer
```

---

### 🚀 Phase 7: 배포

```
Vercel 배포 준비를 도와줘.

1. next.config.js 최적화 설정

2. Vercel 환경변수 목록 정리
   (복사하기 쉬운 형식으로)

3. Inngest Cloud 연동 가이드
   - Vercel Integration 설정
   - Event Key / Signing Key 설정

4. 배포 후 테스트 체크리스트:
   - [ ] 메인 페이지 로드
   - [ ] 키워드 검색 실행
   - [ ] Inngest 대시보드에서 실행 확인
   - [ ] 결과 저장 확인
   - [ ] WordPress 발행 테스트

5. 모니터링 설정 (선택)
```

---

## 6. 환경 변수 체크리스트

```bash
# .env.local 템플릿

# ===== Supabase =====
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== Inngest =====
INNGEST_EVENT_KEY=xxxxxxxxxxxxx
INNGEST_SIGNING_KEY=signkey-xxxx-xxxx

# ===== AI Models =====
OPENAI_API_KEY=sk-xxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxx

# ===== Reddit =====
REDDIT_CLIENT_ID=xxxxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxxxx
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_USER_AGENT=reddit-insight-ai:v1.0

# ===== WordPress =====
WORDPRESS_URL=https://your-blog.com
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx

# ===== App =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. 트러블슈팅 가이드

### ❌ Vercel 타임아웃 (504 Gateway Timeout)
```
원인: 함수 실행이 10초(hobby) / 60초(pro) 초과
해결: Inngest step.run()으로 작업 분할 확인
     → 각 step이 단일 작업만 수행하도록
```

### ❌ Reddit API 429 (Too Many Requests)
```
원인: Rate limit 초과 (60 req/min)
해결: 
  - 요청 사이에 delay 추가
  - step.sleep('1m') 활용
  - 배치 크기 조절
```

### ❌ Supabase Connection Error
```
원인: 로컬 Docker 사용 또는 키 오류
해결:
  - Cloud URL 사용 확인
  - SERVICE_ROLE_KEY 서버에서만 사용
  - ANON_KEY 클라이언트에서 사용
```

### ❌ Inngest 함수가 실행 안됨
```
원인: Webhook 미설정 또는 키 오류
해결:
  - Inngest 대시보드에서 이벤트 확인
  - SIGNING_KEY 정확히 설정
  - /api/inngest 라우트 접근 테스트
```

### ❌ WordPress 인증 실패
```
원인: Application Password 형식 오류
해결:
  - 비밀번호의 공백 제거하지 말 것
  - Basic Auth 헤더: base64(username:app_password)
  - REST API 활성화 확인
```

---

## 📚 참고 자료

| 리소스 | URL |
|--------|-----|
| Inngest Docs | https://www.inngest.com/docs |
| Supabase Docs | https://supabase.com/docs |
| Reddit API | https://www.reddit.com/dev/api |
| OpenAI API | https://platform.openai.com/docs |
| Gemini API | https://ai.google.dev/docs |
| WordPress REST API | https://developer.wordpress.org/rest-api/ |
| shadcn/ui | https://ui.shadcn.com |

---

## ✅ 개발 시작 체크리스트

```
준비 단계:
[ ] Reddit App 생성 완료
[ ] Supabase 프로젝트 생성 완료
[ ] Inngest 계정 생성 완료
[ ] OpenAI API 키 발급 완료
[ ] Gemini API 키 발급 완료
[ ] WordPress Application Password 생성 완료

MCP 설정:
[ ] Filesystem MCP 연결
[ ] Supabase MCP 연결 (옵션)
[ ] GitHub MCP 연결 (옵션)

개발 시작:
[ ] Claude Code 실행
[ ] Phase 1 프롬프트 실행
```

---

*마지막 업데이트: 2025-01*

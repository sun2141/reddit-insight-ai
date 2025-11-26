# 🔑 API 키 설정 가이드

## 📋 다음 단계

### 1. `.env.local` 파일 생성
프로젝트 루트 디렉토리에서 다음 명령어를 실행하세요:

```bash
cp .env.local.example .env.local
```

또는 수동으로 `.env.local` 파일을 생성하세요.

### 2. API 키 입력
`.env.local` 파일을 열어서 각 서비스의 실제 API 키를 입력하세요.

---

## 🔐 API 키 발급 방법

### 1️⃣ Reddit API
1. **https://www.reddit.com/prefs/apps** 접속
2. **"create another app"** 클릭
3. 다음 정보 입력:
   - **name:** reddit-insight-ai
   - **app type:** script 선택 ⚠️
   - **redirect uri:** http://localhost:8080
4. 생성 후 확인:
   - **client_id:** "personal use script" 아래 작은 글씨
   - **client_secret:** secret 항목
   - **username/password:** 본인 Reddit 계정

### 2️⃣ Supabase
1. **https://supabase.com/dashboard** 접속 (계정 생성 필요)
2. **New Project** 클릭
3. Project Settings > API 메뉴에서 확인:
   - **URL:** Project URL
   - **anon public:** anon key (공개용)
   - **service_role:** service_role key (서버용, 비공개)

### 3️⃣ Inngest
1. **https://app.inngest.com** 접속 (계정 생성)
2. 프로젝트 생성 후 Settings > Keys 메뉴
3. 복사:
   - **Event Key**
   - **Signing Key**

### 4️⃣ OpenAI
1. **https://platform.openai.com/api-keys** 접속
2. **Create new secret key** 클릭
3. 키 복사 (한 번만 표시됨!)
4. ⚠️ 요금제 확인: $5 크레딧 또는 유료 전환 필요

### 5️⃣ Google AI (Gemini)
1. **https://aistudio.google.com/apikey** 접속
2. **Create API Key** 클릭
3. 키 복사
4. 💡 무료 티어: 월 15 RPM

### 6️⃣ WordPress
1. WordPress 관리자 대시보드 로그인
2. **사용자 > 프로필** 메뉴
3. 아래로 스크롤하여 **"애플리케이션 비밀번호"** 섹션
4. 새 이름 입력 (예: reddit-insight-ai) 후 생성
5. 생성된 비밀번호 복사 (공백 포함!)

---

## ✅ 설정 완료 확인

`.env.local` 파일을 모두 작성했다면:

1. 파일이 제대로 저장되었는지 확인
2. **절대 Git에 커밋하지 마세요!** (`.gitignore`에 이미 포함됨)
3. Claude Code에게 **"API 키 설정 완료"**라고 알려주세요

그러면 Phase 1 (프로젝트 초기화)를 시작합니다! 🚀

---

## 📌 선택 사항

### 모든 API 키가 없어도 됩니다!
일부만 있어도 개발을 시작할 수 있습니다:

**필수 (최소 개발):**
- Supabase
- Inngest

**선택 (기능별로 추가 가능):**
- Reddit API → 나중에 추가
- OpenAI → Mock 데이터로 대체 가능
- Gemini → 나중에 추가
- WordPress → 마지막에 추가

어떤 API 키가 준비되었는지 알려주시면 그에 맞춰 진행하겠습니다!

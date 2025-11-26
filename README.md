# Reddit Insight AI

AI-powered Reddit insights for automated blog generation.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase Cloud
- **Queue**: Inngest
- **AI**: OpenAI GPT-4o + Google Gemini 1.5 Flash
- **Data Source**: Reddit API (snoowrap)
- **Publishing**: WordPress REST API

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your API keys:

```bash
cp .env.local.example .env.local
```

See [API-KEYS-SETUP-GUIDE.md](./API-KEYS-SETUP-GUIDE.md) for detailed instructions.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Library configurations
│   ├── inngest/     # Inngest client & workflows
│   └── supabase/    # Supabase clients
├── services/        # Business logic (Reddit, AI, DB, WordPress)
└── types/           # TypeScript type definitions
```

## Deployment

This project is designed to be deployed on Vercel with Inngest integration.

See the [dev plan](./reddit-insight-ai-dev-plan.md) for detailed deployment instructions.

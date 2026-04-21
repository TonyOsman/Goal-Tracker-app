# Goal Tracker

Personal goal tracker with Year → Quarter → Month → Week → Day hierarchy, three goal types (outcome, metric, habit), Telegram bot integration, and AI-powered reviews.

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL via Prisma 7 + Supabase
- NextAuth v5 (GitHub, single-user whitelist)
- Groq AI (llama-3.3-70b-versatile)
- Telegram Bot API + Vercel Cron

## Features

- Goal hierarchy: Year → Quarter → Month → Week → Day
- Three goal types: Outcome, Metric (with progress tracking), Habit (with streaks)
- Personal/Professional tagging
- AI goal decomposition (break yearly/monthly goals into sub-goals)
- AI-generated weekly reviews and daily nudges
- Telegram bot for quick check-ins and updates
- Archive of past periods with completion stats

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` with:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Connect → ORMs → Session pooler URL |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GITHUB_ID` | github.com/settings/developers → New OAuth App |
| `GITHUB_SECRET` | Same OAuth App |
| `ALLOWED_GITHUB_USERNAME` | Your GitHub username |
| `GROQ_API_KEY` | console.groq.com (free) |
| `TELEGRAM_BOT_TOKEN` | @BotFather on Telegram |

GitHub OAuth callback URL: `http://localhost:3000/api/auth/callback/github`

### 3. Database setup

```bash
npx prisma migrate dev
```

### 4. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars to Vercel dashboard
4. Set `NEXTAUTH_URL` to your Vercel deployment URL
5. Update GitHub OAuth callback to `https://your-app.vercel.app/api/auth/callback/github`
6. Set Telegram webhook: message @BotFather `/setwebhook` → `https://your-app.vercel.app/api/telegram/webhook`

Cron jobs (configured in `vercel.json`):
- 7:00 UTC — AI nudge generation
- 8:00 UTC — Morning Telegram message
- 21:00 UTC — Evening check-in
- 19:00 UTC Sunday — Weekly review reminder

## Commands

```bash
npm run dev                          # dev server
npm run build                        # production build
npx prisma studio                    # database GUI
npx prisma migrate dev --name <name> # create migration
npx prisma generate                  # regenerate client
```

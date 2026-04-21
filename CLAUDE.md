# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                                    # dev server on :3000
npm run build                                  # production build
npx tsc --noEmit                               # type check without building
npx prisma generate                            # regenerate client after schema changes
npx prisma migrate dev --name <name>           # create and apply a migration (must run in user terminal — not headless)
npx prisma studio                              # GUI for inspecting data
```

## Architecture

**Framework:** Next.js 16 App Router. All data fetching is server-side (async Server Components + Server Actions in `lib/actions/`). No API routes except auth, cron jobs, and Telegram webhook.

**Auth:** NextAuth v5 (`auth.ts` at root). Single-user whitelist via `ALLOWED_GITHUB_USERNAME` env var. Session available in Server Components via `auth()`.

**Database:** Prisma 7 + PostgreSQL (Supabase Session pooler, sa-east-1). Prisma 7 breaking changes vs v5/v6:
- Connection URLs live in `prisma.config.ts` (not `schema.prisma`); use `config({ path: ".env.local" })` from dotenv
- Client requires driver adapter — `@prisma/adapter-pg` with `pg.Pool` in `lib/db.ts`
- Enums must be multi-line (one value per line in schema)
- After any schema change: `npx prisma generate` then restart dev server

**Data model invariants:**
- `Goal.parentId` must point to a goal with broader scope (DAY < WEEK < MONTH < QUARTER < YEAR)
- `targetValue`/`currentValue`/`unit` only for `type = METRIC`; `initialValue` stores starting value for decreasing metrics
- `HabitLog` records only attach to `type = HABIT` goals
- `tags` must contain at least one of `["personal", "professional"]`

**Metric progress direction:** Decreasing metric is detected via `initialValue != null ? initialValue > target : current > target`. Use `!= null` (loose) not `!== null` — Prisma returns `undefined` (not `null`) for optional fields on existing rows before migration.

**AI:** Groq (`llama-3.3-70b-versatile`) via `lib/ai.ts`. Functions: `generateWeeklyReview`, `generateDailyNudge`, `decomposeGoal`. All use 1-retry with backoff.

**Telegram:** Webhook at `/api/telegram/webhook`. Handles `/start <code>` (links account via `User.telegramLinkCode`), `/today`, `/week`, `/done <id>`, `/progress <id> <value>`, `/streak`. Inline keyboard callbacks for quick check-off.

**Cron jobs** (Vercel, schedules in `vercel.json`):
- `7:00 UTC` — AI nudge generation → stored in `User.dailyNudge`
- `8:00 UTC` — Morning Telegram message (goals + habits + nudge)
- `21:00 UTC` — Evening check-in for incomplete daily goals
- `19:00 UTC Sunday` — Weekly review reminder

**UI:** Inline styles with CSS variables. Dark mode default via `globals.css`. No component library.

**Archive pattern:** Past periods appear via `getPastPeriods(scope, limit)` in `lib/actions/reviews.ts`, rendered by `ArchiveSection` component (collapsible two-level accordion).

## Env vars required

```
DATABASE_URL          # Supabase Session pooler URL (aws-1-sa-east-1.pooler.supabase.com:5432)
NEXTAUTH_SECRET
GITHUB_ID / GITHUB_SECRET
ALLOWED_GITHUB_USERNAME
GROQ_API_KEY
TELEGRAM_BOT_TOKEN
```

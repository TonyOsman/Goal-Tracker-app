import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch {
    await new Promise((r) => setTimeout(r, 1000))
    return fn()
  }
}

async function chat(prompt: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  })
  return res.choices[0].message.content?.trim() ?? ""
}

function stripFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
}

export async function generateWeeklyReview(context: {
  startDate: string
  endDate: string
  goals: { title: string; status: string; scope: string }[]
  habitLogs: { goalTitle: string; completedDays: number; totalDays: number }[]
  metricChanges: { goalTitle: string; delta: number; unit: string }[]
  overdue: { title: string; dueDate: string }[]
}): Promise<{ wentWell: string; didntGo: string; adjustments: string }> {
  const prompt = `You are a goal tracker assistant for Tony, a consultant at Oracle pivoting to software engineering.
Tone: direct, no-fluff, no cheerleading. Default English.

Here is his week (${context.startDate} to ${context.endDate}):
- Weekly goals: ${JSON.stringify(context.goals)}
- Habit completions: ${JSON.stringify(context.habitLogs)}
- Metric updates: ${JSON.stringify(context.metricChanges)}
- Overdue items: ${JSON.stringify(context.overdue)}

Draft a weekly review with three sections:
1. "Went well" — what actually landed
2. "Didn't go" — what slipped and why it probably slipped
3. "Adjustments for next week" — concrete changes, not vibes

If he missed a habit 3+ days, call it out directly. If a goal keeps slipping, suggest rescoping or killing it. Max 150 words total.

Return ONLY valid JSON (no markdown, no code blocks): { "wentWell": "...", "didntGo": "...", "adjustments": "..." }`

  return withRetry(async () => {
    const text = await chat(prompt)
    return JSON.parse(stripFence(text))
  })
}

export async function generateDailyNudge(context: {
  weekGoals: { title: string; status: string }[]
  monthGoals: { title: string; status: string }[]
  habitStreaks: { goalTitle: string; streak: number }[]
}): Promise<string> {
  const prompt = `You are a goal tracker assistant for Tony, a consultant at Oracle pivoting to software engineering.
Tone: direct, one sentence, no cheerleading, no exclamation marks.

His current state:
- Week goals: ${JSON.stringify(context.weekGoals)}
- Month goals: ${JSON.stringify(context.monthGoals)}
- Habit streaks: ${JSON.stringify(context.habitStreaks)}

Write exactly one sentence nudge about the most important thing he should focus on today.
Return only the sentence, nothing else.`

  return withRetry(() => chat(prompt))
}

export async function decomposeGoal(goal: {
  title: string
  whyItMatters?: string
  scope: string
  startDate: string
  dueDate: string
}): Promise<{ title: string; scope: string; whyItMatters?: string }[]> {
  const scopeMap: Record<string, string> = {
    YEAR: "QUARTER",
    MONTH: "WEEK",
    QUARTER: "MONTH",
  }
  const childScope = scopeMap[goal.scope] ?? "WEEK"

  const prompt = `Break down this ${goal.scope.toLowerCase()} goal into 3-5 concrete sub-goals at the ${childScope.toLowerCase()} level.

Goal: "${goal.title}"
Why: "${goal.whyItMatters ?? "not specified"}"
Timeframe: ${goal.startDate} to ${goal.dueDate}

Return ONLY a valid JSON array (no markdown, no explanation): [{ "title": "...", "scope": "${childScope}", "whyItMatters": "..." }]
Each sub-goal must be specific and measurable.`

  return withRetry(async () => {
    const text = await chat(prompt)
    return JSON.parse(stripFence(text))
  })
}

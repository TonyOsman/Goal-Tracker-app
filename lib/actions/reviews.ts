"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { ReviewPeriod } from "@prisma/client"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

export async function createReview(data: {
  period: ReviewPeriod
  reviewDate: string
  wentWell: string
  didntGo: string
  adjustments: string
  aiDraft?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const review = await prisma.review.create({
    data: {
      ...data,
      userId: session.user.id,
      reviewDate: new Date(data.reviewDate),
    },
  })

  revalidatePath("/review/history")
  return review
}

export async function getReviews() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  return prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { reviewDate: "desc" },
  })
}

export async function getReviewContext(period: ReviewPeriod) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const now = new Date()
  let start: Date, end: Date

  if (period === "WEEKLY") {
    start = startOfWeek(now, { weekStartsOn: 1 })
    end = endOfWeek(now, { weekStartsOn: 1 })
  } else if (period === "MONTHLY") {
    start = startOfMonth(now)
    end = endOfMonth(now)
  } else {
    start = startOfYear(now)
    end = endOfYear(now)
  }

  const [goals, habitLogs] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: session.user.id, startDate: { lte: end }, dueDate: { gte: start } },
      orderBy: { scope: "asc" },
    }),
    prisma.habitLog.findMany({
      where: {
        goal: { userId: session.user.id },
        date: { gte: start, lte: end },
      },
      include: { goal: { select: { title: true } } },
    }),
  ])

  const overdue = goals.filter((g) => g.dueDate < now && g.status !== "DONE")

  const habitSummary = Object.values(
    habitLogs.reduce(
      (acc, log) => {
        const title = log.goal.title
        if (!acc[title]) acc[title] = { goalTitle: title, completedDays: 0, totalDays: 0 }
        acc[title].totalDays++
        if (log.completed) acc[title].completedDays++
        return acc
      },
      {} as Record<string, { goalTitle: string; completedDays: number; totalDays: number }>
    )
  )

  const metricChanges = goals
    .filter((g: { type: string; currentValue: number | null }) => g.type === "METRIC" && g.currentValue != null)
    .map((g: { title: string; currentValue: number | null; initialValue: number | null; unit: string | null }) => ({
      goalTitle: g.title,
      delta: (g.currentValue ?? 0) - (g.initialValue ?? 0),
      unit: g.unit ?? "",
    }))

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    goals: goals.map((g: { title: string; status: string; scope: string }) => ({ title: g.title, status: g.status, scope: g.scope })),
    habitLogs: habitSummary,
    metricChanges,
    overdue: overdue.map((g: { title: string; dueDate: Date }) => ({ title: g.title, dueDate: g.dueDate.toISOString().split("T")[0] })),
  }
}

export async function getPastPeriods(scope: "WEEK" | "MONTH" | "YEAR", limit = 6) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const now = new Date()
  const periods: { start: Date; end: Date; label: string }[] = []

  for (let i = 1; i <= limit; i++) {
    if (scope === "WEEK") {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      const s = startOfWeek(d, { weekStartsOn: 1 })
      const e = endOfWeek(d, { weekStartsOn: 1 })
      periods.push({ start: s, end: e, label: `Week of ${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` })
    } else if (scope === "MONTH") {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      periods.push({ start: startOfMonth(d), end: endOfMonth(d), label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) })
    } else {
      const d = new Date(now.getFullYear() - i, 0, 1)
      periods.push({ start: startOfYear(d), end: endOfYear(d), label: String(now.getFullYear() - i) })
    }
  }

  const results = await Promise.all(
    periods.map(async ({ start, end, label }) => {
      const goals = await prisma.goal.findMany({
        where: {
          userId: session.user!.id!,
          scope,
          startDate: { lte: end },
          dueDate: { gte: start },
        },
      })
      const done = goals.filter((g) => g.status === "DONE").length
      return { label, start, end, goals, done, total: goals.length }
    })
  )

  return results.filter((p) => p.total > 0)
}

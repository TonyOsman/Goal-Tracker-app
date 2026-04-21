import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateDailyNudge } from "@/lib/ai"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

export async function GET() {
  const users = await prisma.user.findMany()

  for (const user of users) {
    try {
      const now = new Date()
      const ws = startOfWeek(now, { weekStartsOn: 1 })
      const we = endOfWeek(now, { weekStartsOn: 1 })
      const ms = startOfMonth(now)
      const me = endOfMonth(now)

      const [weekGoals, monthGoals, habits] = await Promise.all([
        prisma.goal.findMany({
          where: { userId: user.id, scope: "WEEK", startDate: { lte: we }, dueDate: { gte: ws } },
          select: { title: true, status: true },
        }),
        prisma.goal.findMany({
          where: { userId: user.id, scope: "MONTH", startDate: { lte: me }, dueDate: { gte: ms } },
          select: { title: true, status: true },
        }),
        prisma.goal.findMany({
          where: { userId: user.id, type: "HABIT", status: { notIn: ["DONE", "DEFERRED"] } },
          include: {
            habitLogs: {
              where: { completed: true, date: { gte: new Date(Date.now() - 7 * 86400000) } },
              orderBy: { date: "desc" },
            },
          },
        }),
      ])

      if (weekGoals.length === 0 && monthGoals.length === 0) continue

      const habitStreaks = habits.map((h) => ({
        goalTitle: h.title,
        streak: h.habitLogs.length,
      }))

      const nudge = await generateDailyNudge({
        weekGoals: weekGoals.map((g) => ({ title: g.title, status: g.status })),
        monthGoals: monthGoals.map((g) => ({ title: g.title, status: g.status })),
        habitStreaks,
      })

      await prisma.user.update({ where: { id: user.id }, data: { dailyNudge: nudge } })
    } catch (e) {
      console.error(`Nudge cron failed for user ${user.id}:`, e)
    }
  }

  return NextResponse.json({ ok: true })
}

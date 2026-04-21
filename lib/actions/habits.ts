"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export async function toggleHabitLog(goalId: string, dateStr: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal || goal.userId !== session.user.id || goal.type !== "HABIT") throw new Error("Not found")

  const date = new Date(dateStr)

  const existing = await prisma.habitLog.findUnique({
    where: { goalId_date: { goalId, date } },
  })

  if (existing) {
    await prisma.habitLog.update({
      where: { goalId_date: { goalId, date } },
      data: { completed: !existing.completed },
    })
  } else {
    await prisma.habitLog.create({ data: { goalId, date, completed: true } })
  }

  revalidatePath("/today")
  revalidatePath("/dashboard")
}

export async function getHabitsWithStats(userId: string) {
  const habits = await prisma.goal.findMany({
    where: { userId, type: "HABIT", status: { notIn: ["DONE", "DEFERRED", "MISSED"] } },
    include: {
      habitLogs: {
        where: { date: { gte: new Date(Date.now() - 30 * 86400000) } },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return habits.map((habit) => {
    const logMap = new Map(
      habit.habitLogs.map((l) => {
        const d = new Date(l.date)
        d.setHours(0, 0, 0, 0)
        return [d.getTime(), l.completed]
      })
    )

    let streak = 0
    for (let i = 1; i <= 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (logMap.get(d.getTime())) {
        streak++
      } else {
        break
      }
    }
    if (logMap.get(today.getTime())) streak++

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return { date: d, completed: logMap.get(d.getTime()) ?? false }
    })

    const todayDone = logMap.get(today.getTime()) ?? false

    return { ...habit, streak, last7, todayDone }
  })
}

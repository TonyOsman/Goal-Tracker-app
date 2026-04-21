"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { Scope, GoalType, Status } from "@prisma/client"
import { decomposeGoal } from "@/lib/ai"
import { z } from "zod"

const SCOPE_ORDER: Record<Scope, number> = {
  YEAR: 5,
  QUARTER: 4,
  MONTH: 3,
  WEEK: 2,
  DAY: 1,
}

const GoalSchema = z.object({
  title: z.string().min(1).max(200),
  whyItMatters: z.string().optional(),
  scope: z.nativeEnum(Scope),
  type: z.nativeEnum(GoalType),
  tags: z.array(z.enum(["personal", "professional"])).min(1),
  parentId: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  startDate: z.string(),
  dueDate: z.string(),
})

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function createGoal(data: z.infer<typeof GoalSchema>) {
  const userId = await requireUser()
  const parsed = GoalSchema.parse(data)

  if (parsed.parentId) {
    const parent = await prisma.goal.findUnique({ where: { id: parsed.parentId } })
    if (!parent || parent.userId !== userId) throw new Error("Invalid parent")
    if (SCOPE_ORDER[parsed.scope] >= SCOPE_ORDER[parent.scope]) {
      throw new Error("Child scope must be narrower than parent scope")
    }
  }

  if (parsed.type === "METRIC" && !parsed.targetValue) {
    throw new Error("Metric goals require a target value")
  }

  const goal = await prisma.goal.create({
    data: {
      ...parsed,
      userId,
      initialValue: parsed.type === "METRIC" ? (parsed.currentValue ?? 0) : undefined,
      startDate: new Date(parsed.startDate),
      dueDate: new Date(parsed.dueDate),
    },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/${parsed.scope.toLowerCase()}`)
  return goal
}

export async function updateGoal(id: string, data: Partial<z.infer<typeof GoalSchema>>) {
  const userId = await requireUser()
  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal || goal.userId !== userId) throw new Error("Not found")

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/goals/${id}`)
  revalidatePath(`/${goal.scope.toLowerCase()}`)
  return updated
}

export async function updateGoalStatus(id: string, status: Status) {
  const userId = await requireUser()
  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal || goal.userId !== userId) throw new Error("Not found")

  const updated = await prisma.goal.update({
    where: { id },
    data: { status },
  })

  revalidatePath("/dashboard")
  revalidatePath("/today")
  revalidatePath("/week")
  revalidatePath(`/goals/${id}`)
  return updated
}

export async function deleteGoal(id: string) {
  const userId = await requireUser()
  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal || goal.userId !== userId) throw new Error("Not found")

  await prisma.goal.delete({ where: { id } })

  revalidatePath("/dashboard")
  revalidatePath(`/${goal.scope.toLowerCase()}`)
}

export async function getGoalsByScope(scope: Scope) {
  const userId = await requireUser()
  return prisma.goal.findMany({
    where: { userId, scope },
    include: { children: true, parent: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getGoalById(id: string) {
  const userId = await requireUser()
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { children: true, parent: true, habitLogs: { orderBy: { date: "desc" }, take: 30 } },
  })
  if (!goal || goal.userId !== userId) return null
  return goal
}

export async function getOverdueGoals() {
  const userId = await requireUser()
  return prisma.goal.findMany({
    where: {
      userId,
      dueDate: { lt: new Date() },
      status: { notIn: ["DONE", "DEFERRED"] },
    },
    orderBy: { dueDate: "asc" },
  })
}

export async function decomposeGoalAction(goal: {
  title: string
  whyItMatters?: string
  scope: string
  startDate: string
  dueDate: string
}) {
  await requireUser()
  return decomposeGoal(goal)
}

export async function getDashboardData() {
  const userId = await requireUser()
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear(), 11, 31)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const [yearGoals, weekGoals, overdue] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, scope: "YEAR", startDate: { gte: startOfYear }, dueDate: { lte: endOfYear } },
    }),
    prisma.goal.findMany({
      where: { userId, scope: "WEEK", startDate: { gte: startOfWeek }, dueDate: { lte: endOfWeek } },
    }),
    prisma.goal.findMany({
      where: { userId, dueDate: { lt: now }, status: { notIn: ["DONE", "DEFERRED"] } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
  ])

  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
  const daysInYear = now.getFullYear() % 4 === 0 ? 366 : 365
  const yearElapsedPct = Math.round((dayOfYear / daysInYear) * 100)

  const onTrackYearly = yearGoals.filter((g) => g.status === "DONE" || g.status === "IN_PROGRESS").length
  const yearOnTrackPct = yearGoals.length ? Math.round((onTrackYearly / yearGoals.length) * 100) : 0

  const personalGoals = yearGoals.filter((g) => g.tags.includes("personal"))
  const professionalGoals = yearGoals.filter((g) => g.tags.includes("professional"))

  return {
    yearElapsedPct,
    yearOnTrackPct,
    yearGoals,
    weekGoals,
    overdue,
    personalProgress: personalGoals.length
      ? Math.round((personalGoals.filter((g) => g.status === "DONE").length / personalGoals.length) * 100)
      : 0,
    professionalProgress: professionalGoals.length
      ? Math.round((professionalGoals.filter((g) => g.status === "DONE").length / professionalGoals.length) * 100)
      : 0,
    personalTotal: personalGoals.length,
    professionalTotal: professionalGoals.length,
  }
}

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getHabitsWithStats } from "@/lib/actions/habits"
import { GoalsByTag } from "@/components/goals-by-tag"
import { HabitCard } from "@/components/habit-card"
import Link from "next/link"
import { format } from "date-fns"

export default async function TodayPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(startOfDay.getDate() + 1)

  const [goals, habits] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: session.user.id!, scope: "DAY", startDate: { lte: endOfDay }, dueDate: { gte: startOfDay } },
      orderBy: { createdAt: "asc" },
    }),
    getHabitsWithStats(session.user.id!),
  ])

  const done = goals.filter((g) => g.status === "DONE")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 4px" }}>Today</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "13px" }}>
            {format(now, "EEEE, MMMM d")}
            {goals.length > 0 && ` · ${done.length}/${goals.length} complete`}
          </p>
        </div>
        <Link
          href="/goals/new?scope=DAY"
          style={{ padding: "6px 14px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "13px" }}
        >
          + Add daily goal
        </Link>
      </div>

      <GoalsByTag goals={goals} emptyMessage="No goals for today." />

      {habits.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Habits
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {habits.map((h: { id: string; title: string; tags: string[]; streak: number; last7: { date: Date; completed: boolean }[]; todayDone: boolean }) => (
              <HabitCard key={h.id} goal={h} streak={h.streak} last7={h.last7} todayDone={h.todayDone} />
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 && (
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          No active habits.{" "}
          <Link href="/goals/new?type=HABIT" style={{ color: "var(--accent)" }}>Add one</Link>
        </div>
      )}
    </div>
  )
}

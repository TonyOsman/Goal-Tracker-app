import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { GoalsByTag } from "@/components/goals-by-tag"
import { ArchiveSection } from "@/components/archive-section"
import { getPastPeriods } from "@/lib/actions/reviews"
import Link from "next/link"
import { format, startOfWeek, endOfWeek } from "date-fns"

export default async function WeekPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const [goals, pastPeriods] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: session.user.id, scope: "WEEK", startDate: { lte: weekEnd }, dueDate: { gte: weekStart } },
      orderBy: { createdAt: "asc" },
    }),
    getPastPeriods("WEEK"),
  ])

  const done = goals.filter((g) => g.status === "DONE")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 4px" }}>This Week</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "13px" }}>
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            {goals.length > 0 && ` · ${done.length}/${goals.length} complete`}
          </p>
        </div>
        <Link
          href="/goals/new?scope=WEEK"
          style={{ padding: "6px 14px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "13px" }}
        >
          + Add weekly goal
        </Link>
      </div>

      <GoalsByTag goals={goals} emptyMessage="No weekly goals." />
      <ArchiveSection periods={pastPeriods} scope="Week" />
    </div>
  )
}

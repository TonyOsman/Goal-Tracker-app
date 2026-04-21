import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { GoalsByTag } from "@/components/goals-by-tag"
import { ArchiveSection } from "@/components/archive-section"
import { getPastPeriods } from "@/lib/actions/reviews"
import Link from "next/link"
import { format, startOfMonth, endOfMonth } from "date-fns"

export default async function MonthPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [goals, pastPeriods] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: session.user.id, scope: "MONTH", startDate: { lte: monthEnd }, dueDate: { gte: monthStart } },
      orderBy: { createdAt: "asc" },
    }),
    getPastPeriods("MONTH"),
  ])

  const done = goals.filter((g) => g.status === "DONE")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 4px" }}>{format(now, "MMMM yyyy")}</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "13px" }}>
            {done.length}/{goals.length} goals complete
          </p>
        </div>
        <Link
          href="/goals/new?scope=MONTH"
          style={{ padding: "6px 14px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "13px" }}
        >
          + Add monthly goal
        </Link>
      </div>

      <GoalsByTag goals={goals} emptyMessage="No monthly goals." />
      <ArchiveSection periods={pastPeriods} scope="Month" />
    </div>
  )
}

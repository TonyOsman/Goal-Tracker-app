import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { GoalsByTag } from "@/components/goals-by-tag"
import { ArchiveSection } from "@/components/archive-section"
import { getPastPeriods } from "@/lib/actions/reviews"
import Link from "next/link"

export default async function YearPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59)

  const [goals, pastPeriods] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: session.user.id, scope: "YEAR", startDate: { lte: yearEnd }, dueDate: { gte: yearStart } },
      orderBy: { createdAt: "asc" },
    }),
    getPastPeriods("YEAR"),
  ])

  const done = goals.filter((g) => g.status === "DONE")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 4px" }}>{now.getFullYear()}</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "13px" }}>
            {done.length}/{goals.length} yearly goals complete
          </p>
        </div>
        <Link
          href="/goals/new?scope=YEAR"
          style={{ padding: "6px 14px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "13px" }}
        >
          + Add yearly goal
        </Link>
      </div>

      <GoalsByTag goals={goals} emptyMessage="No yearly goals." />
      <ArchiveSection periods={pastPeriods} scope="Year" />
    </div>
  )
}

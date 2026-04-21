import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getDashboardData } from "@/lib/actions/goals"
import { getHabitsWithStats } from "@/lib/actions/habits"
import { prisma } from "@/lib/db"
import { GoalCard } from "@/components/goal-card"
import { HabitCard } from "@/components/habit-card"
import type { Goal } from "@prisma/client"

function Ring({ pct, label, total }: { pct: number; label: string; total: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
        <circle
          cx="45"
          cy="45"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="49" textAnchor="middle" fill="var(--text)" fontSize="16" fontWeight="600">
          {pct}%
        </text>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{total} goals</div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [data, habits, user] = await Promise.all([
    getDashboardData(),
    getHabitsWithStats(session.user.id!),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { dailyNudge: true } }),
  ])
  const { yearElapsedPct, yearOnTrackPct, weekGoals, overdue, personalProgress, professionalProgress, personalTotal, professionalTotal } = data

  const trackColor =
    yearOnTrackPct >= yearElapsedPct ? "var(--green)" : yearOnTrackPct >= yearElapsedPct - 15 ? "var(--yellow)" : "var(--red)"

  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ fontSize: "20px", fontWeight: 700 }}>{yearElapsedPct}%</span>
          <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>of {now.getFullYear()} elapsed</span>
        </div>
        <div style={{ color: "var(--text-muted)" }}>·</div>
        <div>
          <span style={{ fontSize: "20px", fontWeight: 700, color: trackColor }}>{yearOnTrackPct}%</span>
          <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>of yearly goals on track</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/year" style={{ fontSize: "12px", color: "var(--accent)" }}>
            View all yearly goals
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Progress by area
          </div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <Ring pct={personalProgress} label="Personal" total={personalTotal} />
            <Ring pct={professionalProgress} label="Professional" total={professionalTotal} />
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "20px",
            gridColumn: "span 1",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              This week
            </div>
            <Link href="/week" style={{ fontSize: "11px", color: "var(--accent)" }}>
              All
            </Link>
          </div>
          {weekGoals.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              No weekly goals.{" "}
              <Link href="/goals/new" style={{ color: "var(--accent)" }}>
                Add one
              </Link>
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {weekGoals.slice(0, 5).map((g: Goal) => (
                <GoalCard key={g.id} goal={g} />
              ))}
            </div>
          )}
        </div>

      </div>

      {overdue.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--red)",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Overdue — {overdue.length} item{overdue.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {overdue.map((g: Goal) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Next weekly review:{" "}
          <span style={{ color: "var(--text)", fontWeight: 500 }}>
            {daysUntilSunday === 0 ? "today" : `in ${daysUntilSunday} day${daysUntilSunday !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Link
          href="/review/new?period=weekly"
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            fontSize: "12px",
            color: "var(--text)",
          }}
        >
          Start weekly review
        </Link>
      </div>

      {habits.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Habit streaks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {habits.map((h: { id: string; title: string; tags: string[]; streak: number; last7: { date: Date; completed: boolean }[]; todayDone: boolean }) => (
              <HabitCard key={h.id} goal={h} streak={h.streak} last7={h.last7} todayDone={h.todayDone} />
            ))}
          </div>
        </div>
      )}

      {user?.dailyNudge && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, paddingTop: "2px" }}>AI</span>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>{user.dailyNudge}</p>
        </div>
      )}

    </div>
  )
}

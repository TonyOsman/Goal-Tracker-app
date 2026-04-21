import { GoalCard } from "./goal-card"
import type { Goal } from "@prisma/client"

function Section({ title, goals }: { title: string; goals: Goal[] }) {
  if (goals.length === 0) return null

  const done = goals.filter((g) => g.status === "DONE")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {done.length}/{goals.length} done
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} showActions={g.status !== "DONE"} />
        ))}
      </div>
    </div>
  )
}

export function GoalsByTag({
  goals,
  emptyMessage,
}: {
  goals: Goal[]
  emptyMessage: string
  scope?: string
  addHref?: string
}) {
  const personal = goals.filter((g) => g.tags.includes("personal"))
  const professional = goals.filter((g) => g.tags.includes("professional"))

  if (goals.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <Section title="Personal" goals={personal} />
      <Section title="Professional" goals={professional} />
    </div>
  )
}

import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getGoalById, deleteGoal, updateGoalStatus } from "@/lib/actions/goals"
import { StatusBadge } from "@/components/status-badge"
import { GoalCard } from "@/components/goal-card"
import { format } from "date-fns"
import type { Status } from "@prisma/client"

const STATUSES: Status[] = ["NOT_STARTED", "IN_PROGRESS", "DONE", "MISSED", "DEFERRED"]

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const goal = await getGoalById(id)
  if (!goal) notFound()

  return (
    <div style={{ maxWidth: "720px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {goal.scope} · {goal.type}
            </span>
            <StatusBadge status={goal.status} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, margin: "0 0 8px", lineHeight: 1.3 }}>{goal.title}</h1>
          {goal.whyItMatters && (
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "13px" }}>{goal.whyItMatters}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <Link
            href={`/goals/${id}/edit`}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Edit
          </Link>
          <form
            action={async () => {
              "use server"
              await deleteGoal(id)
              redirect(`/${goal.scope.toLowerCase()}`)
            }}
          >
            <button
              type="submit"
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--red)",
                background: "transparent",
                fontSize: "13px",
                color: "var(--red)",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Start</div>
          <div style={{ fontWeight: 500 }}>{format(goal.startDate, "MMM d, yyyy")}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Due</div>
          <div style={{ fontWeight: 500 }}>{format(goal.dueDate, "MMM d, yyyy")}</div>
        </div>
        {goal.type === "METRIC" && goal.targetValue != null && (
          <>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Current</div>
              <div style={{ fontWeight: 500 }}>{goal.currentValue ?? 0} {goal.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Target</div>
              <div style={{ fontWeight: 500 }}>{goal.targetValue} {goal.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Direction</div>
              <div style={{ fontWeight: 500 }}>
                {(goal.currentValue ?? 0) > goal.targetValue ? "Decrease to target" : "Increase to target"}
              </div>
            </div>
          </>
        )}
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Tags</div>
          <div style={{ fontWeight: 500, textTransform: "capitalize" }}>{goal.tags.join(", ")}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
          Update status
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <form
              key={s}
              action={async () => {
                "use server"
                await updateGoalStatus(id, s)
              }}
            >
              <button
                type="submit"
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: goal.status === s ? "var(--surface-2)" : "transparent",
                  color: goal.status === s ? "var(--text)" : "var(--text-muted)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: goal.status === s ? 600 : 400,
                }}
              >
                {s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            </form>
          ))}
        </div>
      </div>

      {goal.parent && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
            Parent goal
          </div>
          <GoalCard goal={goal.parent} />
        </div>
      )}

      {goal.children.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sub-goals — {goal.children.length}
            </div>
            <Link
              href={`/goals/new?parentId=${id}`}
              style={{ fontSize: "12px", color: "var(--accent)" }}
            >
              + Add sub-goal
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {goal.children.map((c) => (
              <GoalCard key={c.id} goal={c} />
            ))}
          </div>
        </div>
      )}

      {goal.children.length === 0 && (
        <div>
          <Link
            href={`/goals/new?parentId=${id}`}
            style={{ fontSize: "13px", color: "var(--accent)" }}
          >
            + Add sub-goal
          </Link>
        </div>
      )}
    </div>
  )
}

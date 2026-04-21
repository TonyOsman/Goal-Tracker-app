"use client"

import Link from "next/link"
import { StatusBadge } from "./status-badge"
import { updateGoalStatus } from "@/lib/actions/goals"
import type { Goal } from "@prisma/client"

function calcMetricProgress(
  current: number,
  target: number,
  initial: number | null
): { pct: number; decreasing: boolean } {
  const decreasing = initial != null ? initial > target : current > target
  if (decreasing) {
    const start = initial ?? current
    if (start === target) return { pct: 100, decreasing: true }
    const pct = Math.min(100, Math.max(0, Math.round(((start - current) / (start - target)) * 100)))
    return { pct, decreasing: true }
  }
  return { pct: Math.min(100, Math.round((current / target) * 100)), decreasing: false }
}

export function GoalCard({ goal, showActions = true }: { goal: Goal; showActions?: boolean }) {
  async function markDone() {
    await updateGoalStatus(goal.id, "DONE")
  }

  const metric =
    goal.type === "METRIC" && goal.targetValue != null && goal.currentValue != null
      ? calcMetricProgress(goal.currentValue, goal.targetValue, goal.initialValue)
      : null

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <Link
          href={`/goals/${goal.id}`}
          style={{ fontWeight: 500, color: "var(--text)", flex: 1, lineHeight: "1.4" }}
        >
          {goal.title}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <StatusBadge status={goal.status} />
          {showActions && goal.status !== "DONE" && (
            <form action={markDone}>
              <button
                type="submit"
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Mark done
              </button>
            </form>
          )}
        </div>
      </div>

      {goal.whyItMatters && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{goal.whyItMatters}</p>
      )}

      {metric !== null && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            <span>
              {metric.decreasing ? (
                <>target: {goal.targetValue} {goal.unit} · current: {goal.currentValue} {goal.unit}</>
              ) : (
                <>{goal.currentValue} / {goal.targetValue} {goal.unit}</>
              )}
            </span>
            <span>{metric.pct}%</span>
          </div>
          <div
            style={{
              height: "4px",
              background: "var(--surface-2)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${metric.pct}%`,
                background: metric.pct >= 100 ? "var(--green)" : "var(--accent)",
                borderRadius: "2px",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {goal.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "1px 5px",
              textTransform: "capitalize",
            }}
          >
            {tag}
          </span>
        ))}
        <span
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            padding: "1px 5px",
          }}
        >
          {goal.type.toLowerCase()}
        </span>
      </div>
    </div>
  )
}

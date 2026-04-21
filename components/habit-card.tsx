"use client"

import { toggleHabitLog } from "@/lib/actions/habits"
import Link from "next/link"

type HabitDay = { date: Date; completed: boolean }

export function HabitCard({
  goal,
  streak,
  last7,
  todayDone,
}: {
  goal: { id: string; title: string; tags: string[] }
  streak: number
  last7: HabitDay[]
  todayDone: boolean
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]

  async function toggle() {
    await toggleHabitLog(goal.id, todayStr)
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${todayDone ? "var(--green)" : "var(--border)"}`,
        borderRadius: "8px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <form action={toggle}>
        <button
          type="submit"
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: `2px solid ${todayDone ? "var(--green)" : "var(--border)"}`,
            background: todayDone ? "var(--green)" : "transparent",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "13px",
          }}
        >
          {todayDone ? "✓" : ""}
        </button>
      </form>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/goals/${goal.id}`} style={{ fontWeight: 500, fontSize: "14px" }}>
          {goal.title}
        </Link>
        <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
          {last7.map((day, i) => (
            <div
              key={i}
              title={day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "3px",
                background: day.completed ? "var(--green)" : "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "18px", fontWeight: 700, color: streak > 0 ? "var(--green)" : "var(--text-muted)" }}>
          {streak}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>streak</div>
      </div>
    </div>
  )
}

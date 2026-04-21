"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateGoal } from "@/lib/actions/goals"
import type { Goal } from "@prisma/client"

const SCOPES = ["DAY", "WEEK", "MONTH", "QUARTER", "YEAR"] as const
const TYPES = ["OUTCOME", "METRIC", "HABIT"] as const

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text)",
  fontSize: "14px",
  outline: "none",
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--text-muted)",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
}

export function EditGoalForm({
  goal,
  parentGoals,
}: {
  goal: Goal
  parentGoals: { id: string; title: string; scope: string }[]
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState(goal.type)
  const [tags, setTags] = useState<("personal" | "professional")[]>(
    goal.tags as ("personal" | "professional")[]
  )

  function toggleTag(tag: "personal" | "professional") {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.length > 1 ? prev.filter((t) => t !== tag) : prev
        : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    try {
      await updateGoal(goal.id, {
        title: fd.get("title") as string,
        whyItMatters: (fd.get("whyItMatters") as string) || undefined,
        scope: fd.get("scope") as "DAY",
        type: fd.get("type") as "OUTCOME",
        tags,
        parentId: (fd.get("parentId") as string) || undefined,
        targetValue: fd.get("targetValue") ? Number(fd.get("targetValue")) : undefined,
        currentValue: fd.get("currentValue") ? Number(fd.get("currentValue")) : undefined,
        unit: (fd.get("unit") as string) || undefined,
        startDate: fd.get("startDate") as string,
        dueDate: fd.get("dueDate") as string,
      })
      router.push(`/goals/${goal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const toDateInput = (d: Date) => new Date(d).toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input name="title" required defaultValue={goal.title} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Why it matters</label>
        <textarea
          name="whyItMatters"
          defaultValue={goal.whyItMatters ?? ""}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={labelStyle}>Scope</label>
          <select name="scope" defaultValue={goal.scope} style={inputStyle}>
            {SCOPES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} style={inputStyle}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {type === "METRIC" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Target</label>
            <input name="targetValue" type="number" step="any" defaultValue={goal.targetValue ?? ""} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Current</label>
            <input name="currentValue" type="number" step="any" defaultValue={goal.currentValue ?? 0} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Unit</label>
            <input name="unit" defaultValue={goal.unit ?? ""} placeholder="kg, books..." style={inputStyle} />
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Tags</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["personal", "professional"] as const).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: tags.includes(tag) ? "var(--accent)" : "var(--border)",
                background: tags.includes(tag) ? "rgba(79,142,247,0.1)" : "transparent",
                color: tags.includes(tag) ? "var(--accent)" : "var(--text-muted)",
                fontSize: "13px",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={labelStyle}>Start date</label>
          <input name="startDate" type="date" defaultValue={toDateInput(goal.startDate)} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Due date</label>
          <input name="dueDate" type="date" defaultValue={toDateInput(goal.dueDate)} required style={inputStyle} />
        </div>
      </div>

      {parentGoals.length > 0 && (
        <div>
          <label style={labelStyle}>Parent goal (optional)</label>
          <select name="parentId" defaultValue={goal.parentId ?? ""} style={inputStyle}>
            <option value="">None</option>
            {parentGoals.map((g) => (
              <option key={g.id} value={g.id}>
                [{g.scope}] {g.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p style={{ color: "var(--red)", fontSize: "13px", margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 20px",
            borderRadius: "6px",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/goals/${goal.id}`)}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

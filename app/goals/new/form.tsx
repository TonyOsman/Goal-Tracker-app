"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createGoal, decomposeGoalAction } from "@/lib/actions/goals"

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

type SubGoal = { title: string; scope: string; whyItMatters?: string; enabled: boolean }

export function NewGoalForm({
  defaultScope,
  defaultParentId,
  parentGoals,
}: {
  defaultScope: string
  defaultParentId?: string
  parentGoals: { id: string; title: string; scope: string }[]
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState("OUTCOME")
  const [scope, setScope] = useState(defaultScope)
  const [tags, setTags] = useState<("personal" | "professional")[]>(["personal"])
  const [decomposing, setDecomposing] = useState(false)
  const [subGoals, setSubGoals] = useState<SubGoal[] | null>(null)

  const today = new Date().toISOString().split("T")[0]
  const canDecompose = (scope === "YEAR" || scope === "MONTH" || scope === "QUARTER") && type === "OUTCOME"

  function toggleTag(tag: "personal" | "professional") {
    setTags((prev) =>
      prev.includes(tag)
        ? (prev.length > 1 ? prev.filter((t) => t !== tag) : prev)
        : [...prev, tag]
    )
  }

  async function handleDecompose(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    const form = (e.currentTarget as HTMLElement).closest("form") as HTMLFormElement
    const fd = new FormData(form)
    const title = (fd.get("title") as string || "").trim()
    if (!title) { setError("Add a title before decomposing."); return }

    setError("")
    setDecomposing(true)
    try {
      const result = await decomposeGoalAction({
        title,
        whyItMatters: (fd.get("whyItMatters") as string) || undefined,
        scope,
        startDate: fd.get("startDate") as string,
        dueDate: fd.get("dueDate") as string,
      })
      setSubGoals(result.map((g) => ({ ...g, enabled: true })))
    } catch (err) {
      setError("AI decomposition failed: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDecomposing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    try {
      const goal = await createGoal({
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

      if (subGoals) {
        const childScope = { YEAR: "QUARTER", QUARTER: "MONTH", MONTH: "WEEK" }[scope] ?? "WEEK"
        const startDate = fd.get("startDate") as string
        const dueDate = fd.get("dueDate") as string
        for (const sg of subGoals.filter((s) => s.enabled)) {
          await createGoal({
            title: sg.title,
            whyItMatters: sg.whyItMatters || undefined,
            scope: childScope as "DAY",
            type: "OUTCOME",
            tags,
            parentId: goal.id,
            startDate,
            dueDate,
          })
        }
      }

      router.push(`/goals/${goal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input name="title" required placeholder="What do you want to achieve?" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Why it matters</label>
        <textarea
          name="whyItMatters"
          placeholder="Optional — the reason behind this goal"
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={labelStyle}>Scope</label>
          <select name="scope" value={scope} onChange={(e) => { setScope(e.target.value); setSubGoals(null) }} style={inputStyle}>
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select name="type" value={type} onChange={(e) => { setType(e.target.value); setSubGoals(null) }} style={inputStyle}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {type === "METRIC" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Target</label>
            <input name="targetValue" type="number" step="any" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Current</label>
            <input name="currentValue" type="number" step="any" defaultValue="0" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Unit</label>
            <input name="unit" placeholder="kg, books..." style={inputStyle} />
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
          <input name="startDate" type="date" defaultValue={today} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Due date</label>
          <input name="dueDate" type="date" defaultValue={today} required style={inputStyle} />
        </div>
      </div>

      {parentGoals.length > 0 && (
        <div>
          <label style={labelStyle}>Parent goal (optional)</label>
          <select name="parentId" defaultValue={defaultParentId || ""} style={inputStyle}>
            <option value="">None</option>
            {parentGoals.map((g) => (
              <option key={g.id} value={g.id}>
                [{g.scope}] {g.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {canDecompose && (
        <div>
          <button
            type="button"
            onClick={handleDecompose}
            disabled={decomposing}
            style={{
              padding: "7px 14px",
              borderRadius: "6px",
              border: "1px solid var(--accent)",
              background: "rgba(79,142,247,0.08)",
              color: "var(--accent)",
              fontSize: "13px",
              cursor: decomposing ? "not-allowed" : "pointer",
              opacity: decomposing ? 0.6 : 1,
            }}
          >
            {decomposing ? "Thinking..." : "Break down with AI"}
          </button>
        </div>
      )}

      {subGoals && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Proposed sub-goals — uncheck any you don&apos;t want
          </div>
          {subGoals.map((sg, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <input
                type="checkbox"
                checked={sg.enabled}
                onChange={() => setSubGoals((prev) => prev!.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s))}
                style={{ marginTop: "3px", flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <input
                  value={sg.title}
                  onChange={(e) => setSubGoals((prev) => prev!.map((s, j) => j === i ? { ...s, title: e.target.value } : s))}
                  style={{ ...inputStyle, fontSize: "13px", opacity: sg.enabled ? 1 : 0.4 }}
                />
                {sg.whyItMatters && (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", paddingLeft: "2px" }}>
                    {sg.whyItMatters}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p style={{ color: "var(--red)", fontSize: "13px", margin: 0 }}>{error}</p>
      )}

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
          {loading ? "Creating..." : subGoals ? `Create goal + ${subGoals.filter((s) => s.enabled).length} sub-goals` : "Create goal"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
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

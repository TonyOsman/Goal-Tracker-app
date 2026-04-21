"use client"

import { useState } from "react"
import Link from "next/link"
import { StatusBadge } from "./status-badge"
import type { Goal } from "@prisma/client"

type Period = {
  label: string
  start: Date
  end: Date
  goals: Goal[]
  done: number
  total: number
}

export function ArchiveSection({ periods, scope }: { periods: Period[]; scope: string }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (periods.length === 0) return null

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: 0,
        }}
      >
        <span>{open ? "▾" : "▸"}</span>
        Archive — {periods.length} past {scope.toLowerCase()}s
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          {periods.map((p) => (
            <div
              key={p.label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setExpanded(expanded === p.label ? null : p.label)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "var(--text)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{p.label}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: p.done === p.total && p.total > 0 ? "var(--green)" : "var(--text-muted)",
                    }}
                  >
                    {p.done}/{p.total} done
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {expanded === p.label ? "▴" : "▾"}
                </span>
              </button>

              {expanded === p.label && p.goals.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {p.goals.map((g) => (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <Link href={`/goals/${g.id}`} style={{ fontSize: "13px", color: "var(--text)", flex: 1 }}>
                        {g.title}
                      </Link>
                      <StatusBadge status={g.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

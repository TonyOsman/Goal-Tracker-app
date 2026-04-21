"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createReview } from "@/lib/actions/reviews"
import type { ReviewPeriod } from "@prisma/client"

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text)",
  fontSize: "13px",
  outline: "none",
  resize: "vertical" as const,
  lineHeight: 1.6,
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600 as const,
  color: "var(--text-muted)",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
}

export function ReviewForm({
  period,
  reviewDate,
  aiDraft,
}: {
  period: ReviewPeriod
  reviewDate: string
  aiDraft: { wentWell: string; didntGo: string; adjustments: string } | null
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await createReview({
        period,
        reviewDate,
        wentWell: fd.get("wentWell") as string,
        didntGo: fd.get("didntGo") as string,
        adjustments: fd.get("adjustments") as string,
        aiDraft: aiDraft ? JSON.stringify(aiDraft) : undefined,
      })
      router.push("/review/history")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Went well</label>
        <textarea name="wentWell" rows={4} required defaultValue={aiDraft?.wentWell ?? ""} style={inputStyle} placeholder="What actually landed this week?" />
      </div>
      <div>
        <label style={labelStyle}>Didn't go</label>
        <textarea name="didntGo" rows={4} required defaultValue={aiDraft?.didntGo ?? ""} style={inputStyle} placeholder="What slipped and why?" />
      </div>
      <div>
        <label style={labelStyle}>Adjustments for next week</label>
        <textarea name="adjustments" rows={4} required defaultValue={aiDraft?.adjustments ?? ""} style={inputStyle} placeholder="Concrete changes, not vibes." />
      </div>

      {error && <p style={{ color: "var(--red)", fontSize: "13px", margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: "12px" }}>
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
          {loading ? "Saving..." : "Save review"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getReviewContext } from "@/lib/actions/reviews"
import { generateWeeklyReview } from "@/lib/ai"
import { ReviewForm } from "./form"
import type { ReviewPeriod } from "@prisma/client"

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { period: periodParam } = await searchParams
  const period = (periodParam?.toUpperCase() ?? "WEEKLY") as ReviewPeriod

  const ctx = await getReviewContext(period)

  let aiDraft: { wentWell: string; didntGo: string; adjustments: string } | null = null
  if (process.env.GEMINI_API_KEY) {
    try {
      aiDraft = await generateWeeklyReview(ctx)
    } catch (e) {
      console.error("AI draft failed:", e)
    }
  }

  return (
    <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 4px" }}>
          {period.charAt(0) + period.slice(1).toLowerCase()} review
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "13px" }}>
          {ctx.startDate} → {ctx.endDate} · {ctx.goals.filter((g) => g.status === "DONE").length}/{ctx.goals.length} goals done
        </p>
      </div>

      {aiDraft && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
            AI draft — edit before saving
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            Pre-filled from your week data. Rewrite anything that doesn't fit.
          </p>
        </div>
      )}

      <ReviewForm
        period={period}
        reviewDate={ctx.endDate}
        aiDraft={aiDraft}
      />
    </div>
  )
}

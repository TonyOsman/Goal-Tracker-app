import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getReviews } from "@/lib/actions/reviews"
import { format } from "date-fns"

const PERIOD_LABEL: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
}

export default async function ReviewHistoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const reviews = await getReviews()

  return (
    <div style={{ maxWidth: "720px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Review history</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          {["weekly", "monthly"].map((p) => (
            <Link
              key={p}
              href={`/review/new?period=${p}`}
              style={{ padding: "6px 14px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "13px" }}
            >
              + {p.charAt(0).toUpperCase() + p.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No reviews yet.{" "}
          <Link href="/review/new?period=weekly" style={{ color: "var(--accent)" }}>Start your first weekly review</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{PERIOD_LABEL[r.period]} review</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{format(r.reviewDate, "MMM d, yyyy")}</span>
                </div>
              </div>

              {r.wentWell && (
                <div>
                  <div style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Went well</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", whiteSpace: "pre-wrap" }}>{r.wentWell}</p>
                </div>
              )}
              {r.didntGo && (
                <div>
                  <div style={{ fontSize: "11px", color: "var(--red)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Didn't go</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", whiteSpace: "pre-wrap" }}>{r.didntGo}</p>
                </div>
              )}
              {r.adjustments && (
                <div>
                  <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Adjustments</div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", whiteSpace: "pre-wrap" }}>{r.adjustments}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

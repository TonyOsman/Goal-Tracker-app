import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

async function generateLinkCode(userId: string) {
  "use server"
  const code = Math.random().toString(36).slice(2, 10).toUpperCase()
  await prisma.user.update({ where: { id: userId }, data: { telegramLinkCode: code } })
  revalidatePath("/settings")
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telegramChatId: true, telegramLinkCode: true, timezone: true, email: true },
  })

  if (!user) redirect("/login")

  const generateCode = generateLinkCode.bind(null, session.user.id!)

  return (
    <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "32px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Settings</h1>

      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Account</h2>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>Email</div>
          <div style={{ fontWeight: 500 }}>{user.email}</div>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Telegram</h2>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {user.telegramChatId ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--green)", fontSize: "14px" }}>✓</span>
              <span style={{ fontSize: "13px" }}>Telegram connected (chat ID: {user.telegramChatId})</span>
            </div>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                1. Open Telegram and message <strong>@{process.env.TELEGRAM_BOT_USERNAME ?? "your_bot"}</strong><br />
                2. Generate a link code below<br />
                3. Send: <code style={{ background: "var(--surface-2)", padding: "1px 4px", borderRadius: "3px" }}>/start YOUR_CODE</code>
              </p>
              {user.telegramLinkCode ? (
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>Your link code (expires when used):</div>
                  <div style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent)" }}>
                    {user.telegramLinkCode}
                  </div>
                </div>
              ) : null}
              <form action={generateCode}>
                <button
                  type="submit"
                  style={{
                    padding: "7px 16px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text)",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {user.telegramLinkCode ? "Regenerate code" : "Generate link code"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Required env vars</h2>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {["GROQ_API_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_BOT_USERNAME"].map((key) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <code style={{ color: "var(--accent)" }}>{key}</code>
              <span style={{ color: process.env[key] ? "var(--green)" : "var(--red)" }}>
                {process.env[key] ? "set" : "missing"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

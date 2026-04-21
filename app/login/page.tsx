import { signIn } from "@/auth"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        gap: "24px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px" }}>Goal Tracker</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Year → Quarter → Month → Week → Day</p>
      </div>
      <form
        action={async () => {
          "use server"
          await signIn("github", { redirectTo: "/dashboard" })
        }}
      >
        <button
          type="submit"
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Sign in with GitHub
        </button>
      </form>
    </div>
  )
}

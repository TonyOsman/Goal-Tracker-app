import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { NewGoalForm } from "./form"

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; parentId?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const defaultScope = params.scope || "WEEK"
  const parentId = params.parentId

  const parentGoals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true, scope: true },
    orderBy: { scope: "asc" },
  })

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 24px" }}>New goal</h1>
      <NewGoalForm defaultScope={defaultScope} defaultParentId={parentId} parentGoals={parentGoals} />
    </div>
  )
}

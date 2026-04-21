import { redirect, notFound } from "next/navigation"
import { auth } from "@/auth"
import { getGoalById } from "@/lib/actions/goals"
import { prisma } from "@/lib/db"
import { EditGoalForm } from "./form"

export default async function EditGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const goal = await getGoalById(id)
  if (!goal) notFound()

  const parentGoals = await prisma.goal.findMany({
    where: { userId: session.user.id!, NOT: { id } },
    select: { id: true, title: true, scope: true },
    orderBy: { scope: "asc" },
  })

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 24px" }}>Edit goal</h1>
      <EditGoalForm goal={goal} parentGoals={parentGoals} />
    </div>
  )
}

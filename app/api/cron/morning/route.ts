import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendMessage, inlineKeyboard } from "@/lib/telegram"
import { format } from "date-fns"

export async function GET() {
  const users = await prisma.user.findMany({ where: { telegramChatId: { not: null } } })

  for (const user of users) {
    if (!user.telegramChatId) continue
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const end = new Date(start); end.setDate(start.getDate() + 1)

      const [dailyGoals, habits] = await Promise.all([
        prisma.goal.findMany({
          where: { userId: user.id, scope: "DAY", startDate: { lte: end }, dueDate: { gte: start }, status: { not: "DONE" } },
        }),
        prisma.goal.findMany({
          where: { userId: user.id, type: "HABIT", status: { notIn: ["DONE", "DEFERRED"] } },
          include: {
            habitLogs: { where: { date: { gte: start, lte: end } } },
          },
        }),
      ])

      const nudge = user.dailyNudge ? `\n\n<i>${user.dailyNudge}</i>` : ""

      let text = `<b>Morning. ${format(now, "EEEE, MMM d")}</b>${nudge}`

      if (dailyGoals.length > 0) {
        text += `\n\n<b>Today's goals:</b>\n` + dailyGoals.map((g) => `• ${g.title}`).join("\n")
      }

      if (habits.length > 0) {
        text += `\n\n<b>Habits:</b>\n` + habits.map((h) => {
          const done = h.habitLogs.some((l) => l.completed)
          return `${done ? "✓" : "·"} ${h.title}`
        }).join("\n")
      }

      const buttons = habits
        .filter((h) => !h.habitLogs.some((l) => l.completed))
        .map((h) => [{ text: `✓ ${h.title.slice(0, 30)}`, callback_data: `done:${h.id}` }])

      await sendMessage(user.telegramChatId, text, buttons.length > 0 ? inlineKeyboard(buttons) : {})
    } catch (e) {
      console.error(`Morning cron failed for user ${user.id}:`, e)
    }
  }

  return NextResponse.json({ ok: true })
}

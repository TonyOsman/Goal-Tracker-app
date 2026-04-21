import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendMessage, inlineKeyboard } from "@/lib/telegram"
import { format } from "date-fns"
import type { Goal } from "@prisma/client"

export async function GET() {
  const users = await prisma.user.findMany({ where: { telegramChatId: { not: null } } })

  for (const user of users) {
    if (!user.telegramChatId) continue
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const end = new Date(start); end.setDate(start.getDate() + 1)

      const open = await prisma.goal.findMany({
        where: { userId: user.id, scope: "DAY", startDate: { lte: end }, dueDate: { gte: start }, status: { not: "DONE" } },
      })

      if (open.length === 0) {
        await sendMessage(user.telegramChatId, `End of day. All done for ${format(now, "MMM d")}.`)
        continue
      }

      const buttons = open.map((g: Goal) => [{ text: `✓ ${g.title.slice(0, 30)}`, callback_data: `done:${g.id}` }])
      await sendMessage(
        user.telegramChatId,
        `End of day. Open: ${open.length} goal${open.length !== 1 ? "s" : ""}.`,
        inlineKeyboard(buttons)
      )
    } catch (e) {
      console.error(`Evening cron failed for user ${user.id}:`, e)
    }
  }

  return NextResponse.json({ ok: true })
}

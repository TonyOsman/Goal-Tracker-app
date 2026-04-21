import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendMessage, inlineKeyboard } from "@/lib/telegram"

export async function GET() {
  const users = await prisma.user.findMany({ where: { telegramChatId: { not: null } } })

  for (const user of users) {
    if (!user.telegramChatId) continue
    try {
      await sendMessage(
        user.telegramChatId,
        "Weekly review time. How did this week go?",
        inlineKeyboard([[{ text: "Start review", callback_data: "open:review/new?period=weekly" }]])
      )
    } catch (e) {
      console.error(`Weekly review cron failed for user ${user.id}:`, e)
    }
  }

  return NextResponse.json({ ok: true })
}

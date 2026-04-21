import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendMessage, answerCallbackQuery, inlineKeyboard, type TelegramUpdate } from "@/lib/telegram"
import { format, startOfWeek, endOfWeek } from "date-fns"

async function handleMessage(update: TelegramUpdate) {
  const msg = update.message
  if (!msg?.text) return

  const chatId = msg.chat.id
  const text = msg.text.trim()

  const user = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } })

  if (text.startsWith("/start")) {
    const code = text.split(" ")[1]
    if (!code) {
      await sendMessage(chatId, "Send your link code from the Settings page: /start <code>")
      return
    }
    const match = await prisma.user.findFirst({ where: { telegramLinkCode: code } })
    if (!match) {
      await sendMessage(chatId, "Invalid code. Get a fresh one from Settings.")
      return
    }
    await prisma.user.update({
      where: { id: match.id },
      data: { telegramChatId: String(chatId), telegramLinkCode: null },
    })
    await sendMessage(chatId, `Linked. Use /today to see today's goals.`)
    return
  }

  if (!user) {
    await sendMessage(chatId, "Account not linked. Go to Settings in the app to get your link code.")
    return
  }

  if (text === "/today") {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start); end.setDate(start.getDate() + 1)
    const goals = await prisma.goal.findMany({
      where: { userId: user.id, scope: "DAY", startDate: { lte: end }, dueDate: { gte: start }, status: { not: "DONE" } },
    })
    if (goals.length === 0) { await sendMessage(chatId, "No open goals for today."); return }
    const lines = goals.map((g) => `• ${g.title}`).join("\n")
    const buttons = goals.map((g) => [{ text: `✓ ${g.title.slice(0, 30)}`, callback_data: `done:${g.id}` }])
    await sendMessage(chatId, `<b>Today — ${format(now, "MMM d")}</b>\n\n${lines}`, inlineKeyboard(buttons))
    return
  }

  if (text === "/week") {
    const now = new Date()
    const ws = startOfWeek(now, { weekStartsOn: 1 })
    const we = endOfWeek(now, { weekStartsOn: 1 })
    const goals = await prisma.goal.findMany({
      where: { userId: user.id, scope: "WEEK", startDate: { lte: we }, dueDate: { gte: ws } },
    })
    if (goals.length === 0) { await sendMessage(chatId, "No weekly goals."); return }
    const lines = goals.map((g) => `${g.status === "DONE" ? "✓" : "·"} ${g.title}`).join("\n")
    await sendMessage(chatId, `<b>This week</b>\n\n${lines}`)
    return
  }

  if (text.startsWith("/done ")) {
    const goalId = text.split(" ")[1]
    const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id } })
    if (!goal) { await sendMessage(chatId, "Goal not found."); return }
    await prisma.goal.update({ where: { id: goalId }, data: { status: "DONE" } })
    await sendMessage(chatId, `Marked done: ${goal.title}`)
    return
  }

  if (text.startsWith("/progress ")) {
    const parts = text.split(" ")
    const goalId = parts[1]
    const value = parseFloat(parts[2])
    if (!goalId || isNaN(value)) { await sendMessage(chatId, "Usage: /progress <goal_id> <value>"); return }
    const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id, type: "METRIC" } })
    if (!goal) { await sendMessage(chatId, "Metric goal not found."); return }
    await prisma.goal.update({ where: { id: goalId }, data: { currentValue: value } })
    await sendMessage(chatId, `Updated ${goal.title}: ${value} ${goal.unit ?? ""}`)
    return
  }

  if (text === "/streak") {
    const habits = await prisma.goal.findMany({
      where: { userId: user.id, type: "HABIT", status: { notIn: ["DONE", "DEFERRED"] } },
      include: { habitLogs: { where: { completed: true }, orderBy: { date: "desc" }, take: 30 } },
    })
    if (habits.length === 0) { await sendMessage(chatId, "No active habits."); return }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const lines = habits.map((h) => {
      let streak = 0
      for (let i = 0; i < 30; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i)
        const found = h.habitLogs.find((l) => { const ld = new Date(l.date); ld.setHours(0,0,0,0); return ld.getTime() === d.getTime() })
        if (found) streak++; else if (i > 0) break
      }
      return `${streak > 0 ? "🔥" : "·"} ${h.title}: ${streak} days`
    }).join("\n")
    await sendMessage(chatId, `<b>Habit streaks</b>\n\n${lines}`)
    return
  }

  await sendMessage(chatId, "Commands: /today /week /done <id> /progress <id> <value> /streak")
}

async function handleCallbackQuery(update: TelegramUpdate) {
  const cb = update.callback_query
  if (!cb?.data || !cb.message) return

  const chatId = cb.message.chat.id
  const user = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } })
  if (!user) return

  if (cb.data.startsWith("done:")) {
    const goalId = cb.data.replace("done:", "")
    const goal = await prisma.goal.findFirst({ where: { id: goalId, userId: user.id } })
    if (goal) {
      await prisma.goal.update({ where: { id: goalId }, data: { status: "DONE" } })
      await answerCallbackQuery(cb.id, `Done: ${goal.title}`)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json()
    if (update.message) await handleMessage(update)
    if (update.callback_query) await handleCallbackQuery(update)
  } catch (e) {
    console.error("Telegram webhook error:", e)
  }
  return NextResponse.json({ ok: true })
}

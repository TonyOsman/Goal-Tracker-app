const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function sendMessage(chatId: string | number, text: string, extra?: object) {
  const res = await fetch(`${BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error("Telegram sendMessage failed:", err)
  }
  return res
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return fetch(`${BASE}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

export type TelegramUpdate = {
  update_id: number
  message?: {
    message_id: number
    chat: { id: number; type: string }
    from: { id: number; username?: string }
    text?: string
  }
  callback_query?: {
    id: string
    from: { id: number }
    data?: string
    message?: { chat: { id: number } }
  }
}

export function inlineKeyboard(buttons: { text: string; callback_data: string }[][]) {
  return { reply_markup: { inline_keyboard: buttons } }
}

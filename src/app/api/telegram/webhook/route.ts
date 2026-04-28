import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
};

const TELEGRAM_API_BASE = "https://api.telegram.org";

function safeResponse() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function handleLinkMessage(chatId: string, token: string) {
  const link = await prisma.telegramLink.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!link || link.expiresAt <= new Date()) {
    await sendTelegramMessage(
      chatId,
      "❌ Code invalid or expired. Generate a new one from the website.",
    );
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: link.userId },
      data: { telegramChatId: chatId },
    }),
    prisma.telegramLink.delete({ where: { token } }),
  ]);

  await sendTelegramMessage(
    chatId,
    "✅ Telegram linked! You can now send receipt photos.",
  );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TelegramUpdate;
    const message = payload.message;
    const chatIdRaw = message?.chat?.id;
    const chatId = chatIdRaw !== undefined ? String(chatIdRaw) : "";

    if (!chatId) {
      return safeResponse();
    }

    const text = message?.text?.trim() ?? "";

    if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        "👋 Welcome! Link your account on the website first, then send me a receipt photo.",
      );
      return safeResponse();
    }

    if (text.startsWith("LINK-")) {
      await handleLinkMessage(chatId, text);
      return safeResponse();
    }

    await sendTelegramMessage(
      chatId,
      "📸 Send me a receipt photo to save it as an expense.",
    );
    return safeResponse();
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return safeResponse();
  }
}

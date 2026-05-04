import { prisma } from "@/src/lib/prisma";
import { generateReceiptJsonFromImage } from "@/src/lib/ollama";
import { webhookCallback } from "grammy";
import { bot } from "@/src/lib/telegram-bot";

const RECEIPT_SYSTEM_PROMPT = `You are a receipt parser. Extract data from the receipt image and return ONLY valid JSON with no markdown, no backticks, no explanation.

Return exactly this structure:
{
  "merchantName": "store or restaurant name",
  "amount": 12.50,
  "currency": "USD",
  "currencySymbol": "$",
  "receiptDate": "2026-04-22",
  "category": "Food & Dining",
  "notes": "any relevant details or empty string"
}

Rules:
- amount: number only, no symbols
- currency: 3-letter ISO code (USD, EUR, GBP, AMD, RUB, USDT)
- Read currency from: symbols ($=USD, €=EUR, £=GBP, ֏=AMD, ₽=RUB), country hints, store location
- receiptDate: YYYY-MM-DD format. If not visible use today
- category: pick best fit from: Food & Dining, Shopping, Transportation, Entertainment, Health, Utilities, Other
- If any field is unclear, make your best guess — never return null`;

type ReceiptParseResult = {
  merchantName: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  receiptDate: string;
  category: string;
  notes: string;
};

function isReceiptParseResult(value: unknown): value is ReceiptParseResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.merchantName === "string" &&
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount) &&
    typeof candidate.currency === "string" &&
    typeof candidate.currencySymbol === "string" &&
    typeof candidate.receiptDate === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.notes === "string"
  );
}

async function parseReceiptWithOllama(base64Image: string): Promise<ReceiptParseResult> {
  const text = await generateReceiptJsonFromImage(base64Image, RECEIPT_SYSTEM_PROMPT);
  const parsed = JSON.parse(text) as unknown;
  if (!isReceiptParseResult(parsed)) {
    throw new Error("Invalid receipt JSON shape");
  }

  return parsed;
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 Welcome! Link your account on the website first, then send me a receipt photo.",
  );
});

bot.on("message:text", async (ctx, next) => {
  const text = ctx.message.text.trim();

  if (!text.startsWith("LINK-")) {
    await next();
    return;
  }

  const chatId = String(ctx.chat.id);

  const link = await prisma.telegramLink.findUnique({
    where: { token: text },
    select: { userId: true, expiresAt: true },
  });

  if (!link || link.expiresAt <= new Date()) {
    await ctx.reply("❌ Code invalid or expired. Generate a new one from the website.");
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: link.userId },
      data: { telegramChatId: chatId },
    }),
    prisma.telegramLink.delete({ where: { token: text } }),
  ]);

  await ctx.reply("✅ Telegram linked! You can now send receipt photos.");
});

bot.on("message:photo", async (ctx) => {
  const chatId = String(ctx.chat.id);

  const user = await prisma.user.findUnique({
    where: { telegramChatId: chatId },
    select: { id: true },
  });

  if (!user) {
    await ctx.reply(
      "❌ Your Telegram is not linked. Go to the Telegram Bot page on the website first.",
    );
    return;
  }

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file = await ctx.api.getFile(photo.file_id);

  if (!file.file_path) {
    await ctx.reply("❌ Could not read the receipt. Please try a clearer photo.");
    return;
  }

  const imageUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    await ctx.reply("❌ Could not read the receipt. Please try a clearer photo.");
    return;
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const base64Image = imageBuffer.toString("base64");

  let parsed: ReceiptParseResult;

  try {
    parsed = await parseReceiptWithOllama(base64Image);
  } catch (error) {
    console.error("Receipt parsing failed:", error);
    await ctx.reply("❌ Could not read the receipt. Please try a clearer photo.");
    return;
  }

  await ctx.reply(`📋 Receipt detected!\n\n🏪 ${parsed.merchantName}\n💰 ${parsed.currencySymbol}${parsed.amount} ${parsed.currency}\n📅 ${parsed.receiptDate}\n📂 ${parsed.category}\n\n💾 Saving...`);

  const firstAccount = await prisma.financeAccount.findFirst({
    where: { userId: user.id },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  try {
    await prisma.expense.create({
      data: {
        title: parsed.merchantName,
        amount: parsed.amount,
        category: parsed.category,
        currency: parsed.currency,
        merchantName: parsed.merchantName,
        receiptDate: new Date(parsed.receiptDate),
        userId: user.id,
        accountId: firstAccount?.id ?? null,
      },
    });

    await ctx.reply("✅ Saved successfully!");
  } catch (error) {
    console.error("Failed to save expense from Telegram:", error);
    await ctx.reply("❌ Failed to save. Please try again.");
  }
});

bot.on("message", async (ctx) => {
  await ctx.reply("📸 Send me a photo of a receipt to save it as an expense.");
});

const handler = webhookCallback(bot, "std/http");

export const POST = handler;

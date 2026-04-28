import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function requireSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session) {
    return jsonError("Unauthorized", 401);
  }
  return session;
}

function randomToken() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `LINK-${suffix}`;
}

export async function GET(request: Request) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionOrError.user.id },
    select: { telegramChatId: true },
  });

  return NextResponse.json({
    connected: Boolean(user?.telegramChatId),
    telegramChatId: user?.telegramChatId ?? null,
  });
}

export async function POST(request: Request) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  try {
    let token = randomToken();

    for (let attempts = 0; attempts < 5; attempts += 1) {
      try {
        const link = await prisma.telegramLink.upsert({
          where: { userId: sessionOrError.user.id },
          update: { token, expiresAt },
          create: { userId: sessionOrError.user.id, token, expiresAt },
          select: { token: true },
        });

        return NextResponse.json({ token: link.token });
      } catch (error) {
        const isUniqueViolation =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002";

        if (!isUniqueViolation || attempts === 4) {
          throw error;
        }

        token = randomToken();
      }
    }

    return jsonError("Failed to generate link token", 500);
  } catch {
    return jsonError("Failed to generate link token", 500);
  }
}

export async function DELETE(request: Request) {
  const sessionOrError = await requireSession(request);
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: sessionOrError.user.id },
        data: { telegramChatId: null },
      }),
      prisma.telegramLink.deleteMany({
        where: { userId: sessionOrError.user.id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to disconnect Telegram", 500);
  }
}

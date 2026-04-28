// Registers the Telegram webhook with Telegram's servers
// Run once with: npx ts-node scripts/register-webhook.ts

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  const endpoint = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

  const response = await fetch(endpoint);
  const result = (await response.json()) as {
    ok?: boolean;
    description?: string;
  };

  if (!response.ok || !result.ok) {
    throw new Error(result.description ?? "Failed to register Telegram webhook");
  }

  console.log(`Webhook registered: ${webhookUrl}`);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to register Telegram webhook",
  );
  process.exit(1);
});

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, Send } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TelegramStatus = {
  connected: boolean;
  telegramChatId: string | null;
};

type LinkTokenResponse = {
  token: string;
};

async function fetchTelegramStatus(): Promise<TelegramStatus> {
  const response = await fetch("/api/telegram/link", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load Telegram status.");
  }

  return (await response.json()) as TelegramStatus;
}

export default function TelegramIntegrationPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["telegram-link-status"],
    queryFn: fetchTelegramStatus,
  });

  const isConnected = Boolean(data?.connected);

  async function refreshStatus() {
    await queryClient.invalidateQueries({ queryKey: ["telegram-link-status"] });
  }

  async function handleConnect() {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/telegram/link", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate Telegram code.");
      }

      const result = (await response.json()) as LinkTokenResponse;
      setToken(result.token);
      await refreshStatus();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Failed to generate Telegram code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDisconnect() {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/telegram/link", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect Telegram.");
      }

      setToken(null);
      setFeedback("Telegram disconnected.");
      await refreshStatus();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Failed to disconnect Telegram.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      setFeedback("Code copied.");
    } catch {
      setFeedback("Failed to copy code.");
    }
  }

  return (
    <section className="mx-20 mt-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Telegram Bot</h1>
        <p className="text-muted-foreground">
          Connect your Telegram account to save expenses by sending receipt
          photos to the bot
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Send className="size-5" />
                Telegram Connection
              </CardTitle>
              <CardDescription>
                Link your account once, then use the Telegram bot from your
                linked chat.
              </CardDescription>
            </div>

            {isConnected ? (
              <Badge className="bg-green-600 text-white hover:bg-green-600">
                <CheckCircle2 className="size-3.5" />
                Telegram Connected
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isConnected ? (
            <Button
              type="button"
              onClick={() => void handleConnect()}
              disabled={isLoading || isFetching || isSubmitting}
            >
              Connect Telegram
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDisconnect()}
              disabled={isSubmitting}
            >
              Disconnect
            </Button>
          )}

          {token ? (
            <Alert>
              <AlertTitle>Send this code to @YourBotName on Telegram:</AlertTitle>
              <AlertDescription className="space-y-2">
                <code className="block rounded bg-muted px-3 py-2 font-mono text-sm">
                  {token}
                </code>
                <p>Expires in 15 minutes</p>
              </AlertDescription>
              <AlertAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopy()}
                >
                  <Copy className="size-4" />
                  Copy
                </Button>
              </AlertAction>
            </Alert>
          ) : null}

          {feedback ? (
            <Alert variant="default">
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

const OLLAMA_MODEL = "gemma4:31b-cloud";

export type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

export async function generateReceiptJsonFromImage(
  base64Image: string,
  prompt: string,
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        {
          role: "user",
          content: prompt,
          images: [base64Image],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OllamaChatResponse;
  const text = data.message?.content?.trim();

  if (!text) {
    throw new Error("Ollama returned empty content");
  }

  return text;
}

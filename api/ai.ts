import { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  try {
    const { messages, model } = req.body;
    const API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

    if (!API_KEY || API_KEY.includes("xxxxxxxx")) {
      return res.status(401).json({ error: { message: "OpenRouter API Key is missing or invalid on the server." } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hasebaroohyo.vercel.app/",
        "X-Title": "Hisab Rouh",
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.0-flash-001",
        messages: messages,
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error("Vercel AI Error:", error);
    res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
}

import { GoogleGenAI } from "@google/genai";

// المفتاح الخاص بـ OpenRouter للعمل خارج بيئة AI Studio
const OPENROUTER_KEY = "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";

export const getGeminiResponse = async (userPrompt: string, imageBase64?: string) => {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userPrompt,
        image: imageBase64
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.text;
  } catch (error: any) {
    console.error("Client API Error:", error);
    return `عذراً، حدث خطأ في الاتصال: ${error.message || "فشل الوصول إلى الخادم"}`;
  }
};

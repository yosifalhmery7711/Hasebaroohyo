/// <reference types="vite/client" />
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export const getGeminiResponse = async (userPrompt: string, imageBase64?: string) => {
  try {
    if (!API_KEY) {
      throw new Error("OpenRouter API Key is missing. Please set VITE_OPENROUTER_API_KEY in your environment.");
    }

    const messages = [
      {
        role: "system",
        content: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
      },
      {
        role: "user",
        content: imageBase64 ? [
          { type: "text", text: userPrompt || "حل المسألة الموضحة في الصورة بالتفصيل." },
          { type: "image_url", image_url: { url: imageBase64 } }
        ] : userPrompt
      }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hasebaroohyo.vercel.app/",
        "X-Title": "Hisab Rouh",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: messages,
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenRouter Error Details:", data.error);
      throw new Error(data.error.message || "OpenRouter API Error");
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from API");
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Error:", error);
    return `عذراً، واجهت مشكلة في الاتصال: ${error.message || "خطأ غير معروف"}`;
  }
};

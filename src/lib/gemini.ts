/// <reference types="vite/client" />

export const getGeminiResponse = async (userPrompt: string, imageBase64?: string) => {
  try {
    const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!API_KEY || API_KEY.includes("xxxxxxxx")) {
      throw new Error("OpenRouter API Key is missing or invalid. Please set a valid VITE_OPENROUTER_API_KEY in the Settings menu (Environment Variables).");
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

    const referer = typeof window !== "undefined" ? window.location.origin : "https://hasebaroohyo.vercel.app/";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "Hisab Rouh",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: messages,
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenRouter Response Error:", data);
      const errorMsg = data.error?.message || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMsg);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("OpenRouter Unexpected Response:", data);
      throw new Error("Invalid response structure from OpenRouter API");
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Error:", error);
    return `عذراً، واجهت مشكلة في الاتصال: ${error.message || "خطأ غير معروف"}`;
  }
};

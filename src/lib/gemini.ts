/// <reference types="vite/client" />

export const getGeminiResponse = async (userPrompt: string, imageBase64?: string) => {
  try {
    const rawKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const API_KEY = rawKey?.trim();
    
    if (!API_KEY || API_KEY.includes("xxxxxxxx") || API_KEY === "") {
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
        model: "google/gemini-2.0-flash-001",
        messages: messages,
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenRouter Response Error:", data);
      let errorMsg = data.error?.message || `API Error: ${response.status} ${response.statusText}`;
      
      if (errorMsg.toLowerCase().includes("user not found")) {
        errorMsg = "خطأ من OpenRouter: 'User not found'. هذا يعني عادةً أن مفتاح API غير صالح أو أن الحساب في OpenRouter غير مربوط بشكل صحيح. يرجى التأكد من نسخ المفتاح بشكل صحيح.";
      } else if (errorMsg.toLowerCase().includes("insufficient balance") || errorMsg.toLowerCase().includes("credit") || errorMsg.toLowerCase().includes("balance")) {
        errorMsg = "خطأ من OpenRouter: الرصيد غير كافٍ. يرجى شحن رصيدك في OpenRouter للمتابعة.";
      }
      
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

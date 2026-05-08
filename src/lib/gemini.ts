// الحل الجديد والنهائي باستخدام مفتاح OpenRouter لضمان العمل بكفاءة
const API_KEY = "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"; 

export const getGeminiResponse = async (userPrompt: string, imageBase64?: string) => {
  try {
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
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
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
    console.error("Connection Error:", error);
    if (error.message?.includes("401") || error.message?.includes("key")) {
      return "عذراً، مفتاح API غير صالح أو غير مفعل. يرجى التأكد من شحن حساب OpenRouter أو صلاحية المفتاح.";
    }
    return `عذراً، واجهت مشكلة في الاتصال: ${error.message || "خطأ غير معروف"}`;
  }
};

/// <reference types="vite/client" />

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

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: messages,
      })
    });

    const contentType = response.headers.get("content-type");
    let data: any;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      throw new Error(`استجابة غير متوقعة من الخادم (Status: ${response.status}). يرجى المحاولة لاحقاً.`);
    }
    
    if (!response.ok) {
      console.error("AI API Error:", data);
      let errorMsg = data.error?.message || `API Error: ${response.status} ${response.statusText}`;
      
      if (errorMsg.toLowerCase().includes("user not found")) {
        errorMsg = "خطأ من OpenRouter: 'User not found'. هذا يعني عادةً أن مفتاح API غير صالح أو أن الحساب في OpenRouter غير مربوط بشكل صحيح. يرجى التأكد من نسخ المفتاح بشكل صحيح.";
      } else if (errorMsg.toLowerCase().includes("insufficient balance") || errorMsg.toLowerCase().includes("credit") || errorMsg.toLowerCase().includes("balance")) {
        errorMsg = "خطأ من OpenRouter: الرصيد غير كافٍ. يرجى شحن رصيدك في OpenRouter للمتابعة.";
      } else if (errorMsg.toLowerCase().includes("no endpoints found")) {
        errorMsg = "خطأ: لم يتم العثور على مزود خدمة للموديل المختار. يرجى المحاولة مرة أخرى لاحقاً أو التأكد من رصيد مفتاح OpenRouter.";
      }
      
      throw new Error(errorMsg);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("AI Unexpected Response:", data);
      throw new Error("Invalid response structure from AI API");
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Error:", error);
    return `عذراً، واجهت مشكلة في الاتصال: ${error.message || "خطأ غير معروف"}`;
  }
};

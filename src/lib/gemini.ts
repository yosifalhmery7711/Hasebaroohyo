import { GoogleGenAI } from "@google/genai";

// المفتاح الخاص بـ OpenRouter للعمل خارج بيئة AI Studio
const OPENROUTER_KEY = "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";

export const getGeminiResponse = async (userPrompt: string, imageBase64?: string) => {
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. العمل داخل جوجل استوديو (استخدام SDK الرسمي)
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      let contents: any;

      if (imageBase64) {
        const base64Data = imageBase64.split(",")[1] || imageBase64;
        const mimeType = imageBase64.match(/data:(.*?);/) ? imageBase64.match(/data:(.*?);/)![1] : "image/jpeg";

        contents = {
          parts: [
            { text: userPrompt || "حل المسألة الموضحة في الصورة بالتفصيل." },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        };
      } else {
        contents = userPrompt;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
        }
      });

      return response.text;
    } catch (error: any) {
      console.error("Gemini SDK Error:", error);
      return `عذراً، حدث خطأ في محرك Gemini: ${error.message}`;
    }
  } 
  
  // 2. العمل خارج جوجل استوديو (استخدام OpenRouter)
  else {
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
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
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
      if (data.error) throw new Error(data.error.message || "خطأ في OpenRouter API");
      
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error("OpenRouter External Error:", error);
      return `عذراً، فشل الاتصال عبر المفتاح الخارجي: ${error.message}`;
    }
  }
};

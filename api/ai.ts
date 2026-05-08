import { GoogleGenAI } from "@google/genai";

// مفتاح OpenRouter للاستخدام خارج AI Studio
const OPENROUTER_KEY = "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";

export default async function handler(req: any, res: any) {
  // للتعامل مع Express و Vercel في نفس الوقت
  const body = req.body;
  const { prompt, image } = body;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // الحالة الأولى: العمل داخل AI Studio (استخدام Gemini مباشرة)
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      let contents: any;

      if (image) {
        const base64Data = image.split(",")[1] || image;
        const mimeType = image.match(/data:(.*?);/) ? image.match(/data:(.*?);/)![1] : "image/jpeg";
        contents = {
          parts: [
            { text: prompt || "حل المسألة." },
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ]
        };
      } else {
        contents = { parts: [{ text: prompt }] };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: [contents],
        config: {
          systemInstruction: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
        }
      });

      const responseText = response.text;
      if (res.json) return res.json({ text: responseText });
      return { text: responseText };
    } 
    
    // الحالة الثانية: العمل خارج AI Studio (استخدام OpenRouter)
    else {
      const messages = [
        {
          role: "system",
          content: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
        },
        {
          role: "user",
          content: image ? [
            { type: "text", text: prompt || "حل المسألة الموضحة في الصورة بالتفصيل." },
            { type: "image_url", image_url: { url: image } }
          ] : prompt
        }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "Hisab Rouh",
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5",
          messages: messages,
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "OpenRouter Error");
      
      const text = data.choices[0].message.content;
      if (res.json) return res.json({ text });
      return { text };
    }
  } catch (error: any) {
    console.error("AI Root Error:", error);
    if (res.status) return res.status(500).json({ error: error.message });
    return { error: error.message };
  }
}

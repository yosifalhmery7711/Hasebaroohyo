import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // تفعيل CORS لمحاكاة سلوك Express إذا لزم الأمر
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, image } = req.body;
    
    // الحصول على المفتاح من كافة المصادر الممكنة في Vercel
    let apiKey = process.env.GEMINI_API_KEY || 
                 process.env.VITE_API_KEY || 
                 process.env.VITE_GEMINI_API_KEY;

    if (typeof apiKey === "string") {
      apiKey = apiKey.trim();
      if (apiKey === "undefined" || apiKey === "null" || apiKey === "" || apiKey.includes("INSERT_YOUR_KEY")) {
        apiKey = undefined;
      }
    }

    if (!apiKey) {
      return res.status(500).json({ error: "مفتاح API غير متوفر في إعدادات Vercel. يرجى إضافته في Environment Variables باسم GEMINI_API_KEY" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: prompt || "حل المسألة الموضحة في الصورة بالتفصيل." }];

    if (image && image.includes(',')) {
      const [header, data] = image.split(',');
      const mimeType = header.split(';')[0].split(':')[1] || "image/jpeg";
      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    }

    // استخدام نموذج gemini-1.5-flash الموصى به لثباته وتوافره الواسع
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: { parts },
      config: {
        systemInstruction: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty response from Gemini API");
    }

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Vercel AI Handler Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}

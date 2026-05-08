import { GoogleGenAI } from "@google/genai";

export const runtime = 'edge';

export default async function handler(req: any, res: any) {
  // تفعيل CORS لمحاكاة سلوك Express إذا لزم الأمر
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { prompt, image } = await req.json();
    
    // الأولوية القصوى للمفتاح الذي يبدأ بـ VITE_ كما في إعداداتك
    let apiKey = process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.VITE_API_KEY;

    if (typeof apiKey === "string") {
      apiKey = apiKey.trim();
      if (apiKey === "undefined" || apiKey === "null" || apiKey === "" || apiKey.includes("INSERT_YOUR_KEY")) {
        apiKey = undefined;
      }
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "مفتاح API غير متوفر. يرجى إضافته في Environment Variables باسم VITE_GEMINI_API_KEY" 
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
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

    return new Response(JSON.stringify({ text: response.text }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error("Vercel Edge Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}


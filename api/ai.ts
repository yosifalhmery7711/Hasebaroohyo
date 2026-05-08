import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';

// مفتاح API مباشرة كما طلب المستخدم لضمان العمل الفوري
const API_KEY = "AIzaSyDzeIn2wYpHfVluj8i87XFmtB0ESK4MJI8";

export default async function handler(req: Request) {
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
    
    if (!API_KEY || API_KEY.includes("YOUR_API_KEY")) {
      return new Response(JSON.stringify({ error: "API Key is missing or invalid in code." }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
    });

    const contents: any[] = [];
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

    contents.push({ role: 'user', parts });

    const result = await model.generateContent({
      contents
    });

    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    return new Response(JSON.stringify({ text: responseText }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error("Gemini Direct Handler Error:", error);
    let errorMessage = error.message || "Internal Server Error";
    
    if (errorMessage.includes("API key not valid")) {
      errorMessage = "مفتاح API غير صالح. يرجى التأكد من المفتاح المستخدم.";
    } else if (errorMessage.includes("404")) {
      errorMessage = "خطأ 404: الموديل غير موجود أو غير مدعوم في منطقتك.";
    }

    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}



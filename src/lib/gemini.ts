import { GoogleGenerativeAI } from "@google/generative-ai";

// الحل الجذري كما طلبته: دمج المفتاح مباشرة لتخطي مشاكل Vercel
const API_KEY = "AIzaSyDzeIn2wYpHfVluj8i87XFmtB0ESK4MJI8"; 

const genAI = new GoogleGenerativeAI(API_KEY);

// استخدام موديل 1.5-flash لحل مشكلة الـ 404 وتجاوز وقت الانتظار في فيرسل
export const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
});

export const getGeminiResponse = async (userPrompt: string, imageBase64?: string) => {
  try {
    const parts: any[] = [{ text: userPrompt }];

    if (imageBase64 && imageBase64.includes(',')) {
      const [header, data] = imageBase64.split(',');
      const mimeType = header.split(';')[0].split(':')[1] || "image/jpeg";
      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("404")) {
      return "عذراً، لم يتم العثور على النموذج المطلوب (404). يرجى التأكد من توفر الموديل في حسابك.";
    }
    return "عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي. تأكد من صلاحية المفتاح.";
  }
};

export const runtime = 'edge';

// مفتاح API مباشرة (OpenRouter)
const API_KEY = "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";

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
    
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API Key is missing." }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

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
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: messages,
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "OpenRouter API Error");
    }

    const responseText = data.choices[0].message.content;

    return new Response(JSON.stringify({ text: responseText }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error("OpenRouter Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
        }


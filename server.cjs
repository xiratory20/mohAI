require('dotenv').config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000; // Also use PORT from env if available

// إعداد الميدل وير
app.use(cors()); // Using default CORS for now, adjust if needed for deployment
app.use(bodyParser.json());

// إعداد Gemini API using environment variable
const apiKey = process.env.GEMINI_API_KEY; // Load key from .env
let genAI;
let model;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
  console.log("Gemini API initialized successfully using environment variable.");
} else {
  console.error("ERROR: GEMINI_API_KEY not found in .env file. The /ask endpoint will not work.");
}

// إعداد نقطة استقبال الأسئلة
app.post("/ask", async (req, res) => {
  if (!model) {
     // Added more specific error message
    return res.status(500).json({ reply: 'عذراً، خدمة الذكاء الاصطناعي غير مهيأة بشكل صحيح. يرجى مراجعة إعدادات الخادم.' });
  }
  const userMessage = req.body.message;

  const instructions = `
أنت مساعد قانوني ذكي يعمل لصالح مكتب محاماة. وظيفتك هي أن تستقبل أسئلة الزوار القانونية، وتقدم لهم معلومات أولية دقيقة وواضحة بناءً على السؤال المطروح.

مهم:
1. لا تُقدّم نصائح قانونية نهائية، بل معلومات أولية فقط.
2. بعد الرد، اختم دائمًا بجملة:
"الأستاذ المحامي محمد العلوي يمكنه مساعدتك في هذا النوع من القضايا. لا تتردد في حجز موعد للتحدث معه مباشرة."
3. اكتب بلغة عربية فصحى بسيطة وسلسة.
4. إذا لم تكن متأكدًا من نوع القضية، فاطلب من المستخدم توضيحًا إضافيًا.
5. لا تُظهر أنك ذكاء اصطناعي.
`;

  const fullPrompt = instructions + "\n\nسؤال المستخدم: " + userMessage;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("خطأ:", error);
    res.status(500).json({ reply: "حدث خطأ أثناء معالجة سؤالك." });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
}); 
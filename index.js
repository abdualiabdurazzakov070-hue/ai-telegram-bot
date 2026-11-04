import http from 'http';
import { TELEGRAM_BOT_TOKEN, GEMINI_API_KEY } from './config.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY || GEMINI_API_KEY;

let offset = 0;

console.log("------------------------------------------");
console.log("🚀 AI Yordamchi Telegram bot ishga tushdi!");
console.log("🤖 Bot: @Abdu_yordamchi_bot");
console.log("⚡ Google Gemini AI ulandi!");
console.log("------------------------------------------");

// Ob-havo ma'lumotlarini olish
async function getWeather(city = 'Tashkent') {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await res.json();
    const current = data.current_condition[0];
    return `${city} ob-havosi: Harorat ${current.temp_C}°C, Havo holati: ${current.weatherDesc[0].value}, Namlik: ${current.humidity}%.`;
  } catch (e) {
    return null;
  }
}

// "Yozmoqda..." holati
async function sendChatAction(chatId) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' })
    });
  } catch (e) {}
}

// Telegramga xabar jo'natish
async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    const d = await res.json();
    if (!d.ok) {
      console.error("Xabar jo'natishda xatolik:", d);
    }
  } catch (e) {
    console.error("Tarmoq xatosi (sendMessage):", e.message);
  }
}

// Google Gemini orqali AI javobini olish
async function askAI(promptText) {
  const models = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `Siz aqlli, samimiy va do'stona Telegram AI yordamchisiz. O'zbek tilida ravon va aniq javob bering.\n\nSavol: ${promptText}` }
              ]
            }
          ]
        })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
      console.error(`Gemini API javobi (${model}):`, data.error?.message || data);
    } catch (err) {
      console.error(`Gemini API xatosi (${model}):`, err.message);
    }
  }
  return "Kechirasiz, savolingizga javob olishda xatolik yuz berdi. Iltimos, qaytadan yozib ko'ring.";
}

// Xabarni qabul qilish va javob qaytarish
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  console.log(`📩 Xabar keldi [${chatId}]: "${text}"`);

  if (text === '/start') {
    const welcome = "Assalomu alaykum! Men sizning aqlli AI yordamchingizman. 🤖✨\n\nMenga xohlagan savolingizni berishingiz mumkin. O'zbek tilida ravon suhbatlashamiz!";
    await sendMessage(chatId, welcome);
    return;
  }

  // Yozmoqda... animatsiyasi
  await sendChatAction(chatId);

  let promptText = text;
  if (text.toLowerCase().includes('pogoda') || text.toLowerCase().includes('ob-havo') || text.toLowerCase().includes('ob havo')) {
    const weatherInfo = await getWeather('Tashkent');
    if (weatherInfo) {
      promptText = `[Tizim ma'lumoti: ${weatherInfo}]. Foydalanuvchi savoli: "${text}". O'zbek tilida chiroyli va samimiy javob bering.`;
    }
  }

  const reply = await askAI(promptText);
  await sendMessage(chatId, reply);
  console.log(`📤 Javob muvaffaqiyatli yuborildi [${chatId}]`);
}

// Doimiy xabarlarni qabul qilish sikli (Polling)
async function startPolling() {
  console.log("📡 Telegramdan xabarlar kutilmoqda...");
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=15`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

startPolling();

// Render.com va bulutli hostinglar uchun web port
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end("Bot 24/7 faol ishlamoqda! 🚀");
}).listen(PORT, () => {
  console.log(`🌐 Web server ${PORT}-portda faol.`);
});

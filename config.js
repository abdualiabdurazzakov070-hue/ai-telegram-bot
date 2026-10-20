import fs from 'fs';
import path from 'path';

// .env faylini avtomatik o'qish
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const envData = fs.readFileSync(envPath, 'utf-8');
    for (const line of envData.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length) {
          process.env[key.trim()] = vals.join('=').trim();
        }
      }
    }
  }
} catch (e) {}

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

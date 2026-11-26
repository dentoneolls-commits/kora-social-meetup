import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

interface IncomingAiTurn {
  role: 'user' | 'model';
  text: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/ai/chat', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server yet.',
      });
      return;
    }

    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().slice(0, 32) : 'friend';

    if (!prompt || prompt.length > 2000) {
      res.status(400).json({ error: 'Please enter a valid message under 2,000 characters.' });
      return;
    }

    const sanitizedHistory: IncomingAiTurn[] = rawHistory
      .slice(-12)
      .filter(
        (item: unknown): item is IncomingAiTurn =>
          Boolean(
            item &&
              typeof item === 'object' &&
              ((item as IncomingAiTurn).role === 'user' || (item as IncomingAiTurn).role === 'model') &&
              typeof (item as IncomingAiTurn).text === 'string' &&
              (item as IncomingAiTurn).text.trim().length > 0
          )
      )
      .map((item: IncomingAiTurn) => ({
        role: item.role,
        text: item.text.trim().slice(0, 1500),
      }));

    const contents = [
      ...sanitizedHistory.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: prompt }],
      },
    ];

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: `You are Kora AI, a friendly, upbeat conversational assistant built inside Kora social meetup's Messages tab (like WhatsApp and Messenger AI). Keep replies helpful, concise, and natural in plain conversational text. You are chatting with ${username}. Never mention internal models or API keys.`,
        },
      });

      const replyText = (response.text || '').trim();
      if (!replyText) {
        res.status(502).json({ error: 'AI did not return a response. Please try again.' });
        return;
      }

      res.json({ reply: replyText });
    } catch (err) {
      console.error('AI chat error:', err);
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to reach AI right now.',
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kora server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

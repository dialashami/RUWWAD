// server/server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // أو أي موديل شغال عندك
      messages: [
        { role: 'system', content: 'You are an AI tutor that explains clearly for students.' },
        { role: 'user', content: question },
      ],
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error('AI error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

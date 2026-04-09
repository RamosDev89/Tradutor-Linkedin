require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/translate', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Texto vazio.' });
  }

  const prompt = `Converta o texto abaixo para o estilo típico do LinkedIn. Retorne APENAS o texto convertido, sem introduções, explicações ou separadores.

Regras:
- Parágrafos curtíssimos (1-2 frases, com linha em branco entre eles)
- Tom inspirador, pessoal e direto
- Frase de abertura impactante (hook)
- Emojis estratégicos (não excessivos)
- 3-5 hashtags relevantes no final
- Manter a mensagem original, apenas reformatar e adaptar o tom
- Responder no mesmo idioma do texto original

Texto:
${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const data = await response.json();

      if (response.status === 503 || data.error?.message?.includes('high demand')) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
          continue;
        }
        return res.status(503).json({ error: 'Serviço temporariamente sobrecarregado. Tente novamente em alguns segundos.' });
      }

      if (!response.ok) {
        return res.status(500).json({ error: data.error?.message || 'Erro na API.' });
      }

      const result = data.candidates[0].content.parts[0].text;
      return res.json({ result });
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      return res.status(500).json({ error: 'Erro ao conectar com a API.' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

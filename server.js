require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/generate', async (req, res) => {
    try {
        const { cardCount, text } = req.body;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a flashcard generator. Create exactly ${cardCount} flashcards.
Respond ONLY with a valid JSON array, no markdown, no backticks, no explanation.
Format: [{"q": "question here", "a": "answer here"}]`
                    },
                    {
                        role: 'user',
                        content: `Create ${cardCount} flashcards from this text:\n\n${text}`
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: { message: data.error.message } });
        }

        const raw = data.choices?.[0]?.message?.content || '';
        const clean = raw.replace(/```json|```/g, '').trim();
        const cards = JSON.parse(clean);

        res.json({ cards });

    } catch (err) {
        res.status(500).json({ error: { message: err.message } });
    }
});

app.listen(3000, () => console.log('✅ Running on http://localhost:3000'));
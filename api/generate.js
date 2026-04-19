export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

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

        res.status(200).json({ cards });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: { message: 'Internal server error' } });
    }
}
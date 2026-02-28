export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, locationName } = req.body;

  if (!task || !locationName) {
    return res.status(400).json({ error: 'Missing task or locationName' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  const systemPrompt = `You are the narrator of a fantasy adventure game for adult piano learners. 
Your role is to write atmospheric, encouraging quest descriptions that transform piano practice tasks into magical adventures.
Respond with ONLY a JSON object in this exact format, no markdown, no extra text:
{
  "questTitle": "A short evocative quest title (4-7 words, no colons)",
  "flavourText": "2-3 sentences of atmospheric narrative. Reference the location naturally. End with a sense of anticipation or gentle challenge. The practice task should feel meaningful and heroic, not trivial."
}`;

  const userPrompt = `Piano practice task: "${task}"
Fantasy location: "${locationName}"

Write a quest description for this task at this location.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        max_tokens: 200,
        temperature: 0.85,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({
        questTitle: `Trial of ${locationName.split(' ').slice(-1)[0]}`,
        flavourText: text,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

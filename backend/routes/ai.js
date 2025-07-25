const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/generate', auth, async (req, res) => {
  const { prompt, jsx, css } = req.body;
  if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

  try {
    // Dynamically import node-fetch (ESM-only)
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    let systemPrompt = 'You are an expert React component generator. When given a prompt, return ONLY a JSON object with two fields: "jsx" (the React component code as a string) and "css" (the CSS as a string). Do not include any explanation, markdown, or extra text. Only output the JSON object.';
    let userPrompt = prompt;
    if (jsx || css) {
      userPrompt = `${prompt}\n\nCurrent JSX:\n${jsx || ''}\n\nCurrent CSS:\n${css || ''}`;
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 800
      })
    });

    const data = await response.json();

    // Parse the model's response
    let jsxResp = '', cssResp = '';
    try {
      const match = data.choices[0].message.content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found in AI response');
      const code = JSON.parse(match[0]);
      jsxResp = code.jsx;
      cssResp = code.css;
    } catch (e) {
      return res.status(500).json({ message: 'AI response could not be parsed', raw: data });
    }

    res.json({ jsx: jsxResp, css: cssResp, message: 'AI generated component.' });
  } catch (err) {
    res.status(500).json({ message: 'AI request failed', error: err.message });
  }
});

module.exports = router;
# Practice Quest 🧭

> Transform your piano practice into a fantasy adventure.

Practice Quest takes your weekly piano tasks and weaves them into an atmospheric quest narrative — powered by OpenAI. Each task becomes a location, a trial, a story. Completing practice feels like progressing through a world, not ticking a checkbox.

Built for adult piano learners who know the struggle of making themselves sit down and practice.

## Deploy to Vercel

**1. Clone this repo**
```bash
git clone https://github.com/yourusername/practice-quest
cd practice-quest
```

**2. Install Vercel CLI**
```bash
npm install -g vercel
```

**3. Deploy**
```bash
vercel
```
Follow the prompts — select "no" for existing project, accept defaults.

**4. Add your OpenAI API key**

In the Vercel dashboard → your project → Settings → Environment Variables:
```
OPENAI_API_KEY = sk-...your key here...
```

Then redeploy:
```bash
vercel --prod
```

That's it. Your app is live.

## Project Structure

```
practice-quest/
├── index.html        # The entire frontend
├── api/
│   └── narrate.js    # Vercel serverless function (OpenAI proxy)
└── vercel.json       # Vercel config
```

## Local Development

```bash
vercel dev
```

This runs the serverless function locally. Requires a `.env` file:
```
OPENAI_API_KEY=sk-...
```

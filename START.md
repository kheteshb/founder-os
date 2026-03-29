# Founder OS — Quick Start

## 1. Set your Anthropic API Key

Edit `backend/.env`:
```
ANTHROPIC_API_KEY=your_actual_key_here
PORT=3001
```

Get your API key at: https://console.anthropic.com

## 2. Start the backend

```bash
cd backend
npm run dev
```

Backend runs on: http://localhost:3001

## 3. Start the frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:5173

## 4. Open in browser

Visit: http://localhost:5173

---

## What you can do

- Upload a PDF pitch deck or paste text
- Select objective (Fundraising, Hiring, etc.)
- Answer 5 sharp context questions
- Receive multi-agent analysis:
  - Clarity, Conviction, VC Interest, Risk scores
  - Brutal Truth section
  - Section-by-section feedback
  - Investor questions you'll face
  - Specific rewrites with before/after
- Track iterations over time in History

## Node.js requirement

If `node` isn't in your PATH, add it:
```bash
# If installed via the downloaded binary:
export PATH="/tmp/node-v22.14.0-darwin-x64/bin:$PATH"

# Or after brew finishes installing:
export PATH="/opt/homebrew/bin:$PATH"   # Apple Silicon
export PATH="/usr/local/bin:$PATH"      # Intel Mac
```

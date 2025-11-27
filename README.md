```markdown
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app (with secure server-side proxy)

This app uses a serverless endpoint (/api/generate) that proxies requests to Gemini. This keeps your Gemini API key secret (do NOT expose it in frontend bundles).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`

2. Set server API key for local testing (server-only):
   - Create a file `.env.local` with:
     GEMINI_API_KEY=your_gemini_api_key_here

   Note: Do NOT prefix the key with VITE_. The serverless function reads GEMINI_API_KEY at runtime.

3. Run the app:
   `npm run dev`

## Deploy (Vercel recommended)

1. On Vercel dashboard, add an Environment Variable:
   - Key: GEMINI_API_KEY
   - Value: <your secret gemini key>
   - Make sure it's set for both Preview and Production as needed.

2. Deploy the project. The serverless function at /api/generate will use GEMINI_API_KEY to call Gemini.

## Notes & Security

- Previously the app injected API keys into client bundles for quick testing. With the serverless proxy, the key is stored only on the server side.
- Check browser console (F12) and server logs if the app doesn't respond. Typical issues:
  - 500 from /api/generate => check GEMINI_API_KEY on server.
  - 404 on /api/generate => ensure serverless functions are supported by your host (Vercel does).
- Recommended: Rotate API keys regularly and restrict usage where possible.

```
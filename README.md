# Ujjwal AI Cartoon Studio

Mobile-first Hindi 3D cartoon story studio.

## Features in this build
- Responsive Android/mobile-first interface.
- Story title and genre input.
- Local six-scene storyboard fallback.
- Secure server-side Gemini story generation endpoint at `/api/generate`.
- AI response includes Hindi narration and consistent-character 3D visual prompts.
- API keys stay on the server; never add secrets to frontend files.

## Deploy the app and API (recommended: Vercel)
GitHub Pages only hosts static files and cannot run the `api/generate.js` serverless function. Deploy this same repository to Vercel to enable AI story generation:

1. Sign in to Vercel and choose **Add New → Project**.
2. Import `ujjwal8228801702-sudo/Ujjwal-AI-Cartoon-Studio` from GitHub.
3. Keep the default settings and deploy.
4. In the Vercel project open **Settings → Environment Variables**.
5. Add `GEMINI_API_KEY` with your Google AI Studio API key. Do not paste the key into GitHub or this chat.
6. Redeploy the project after adding the variable.

The AI story endpoint uses Gemini 2.5 Flash. Check current Google AI Studio model availability, usage limits and pricing before production use.

## Video generation status
This version generates a story, six scene descriptions, Hindi narration text and 3D visual prompts. It does **not** yet render real animated video or MP4. That next stage needs a video/animation provider, Hindi text-to-speech, audio mixing and an MP4 rendering pipeline. Provider credentials must be stored as server environment variables.

## Local preview
Open `index.html` in a browser. The local storyboard works without the API; AI generation requires deployment with the environment variable above.

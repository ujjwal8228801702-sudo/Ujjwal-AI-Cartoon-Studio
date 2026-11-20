# Ujjwal AI Cartoon Studio

Mobile-first Hindi cartoon story studio.

## Current features
- Responsive Android/mobile-first interface.
- Story title and genre input.
- Gemini-powered Hindi story plan with six scenes, narration text and consistent-character visual prompts.
- Server-side API key handling; never place secrets in frontend files or GitHub.

## Deploy to Vercel
1. Import this repository: `ujjwal8228801702-sudo/Ujjwal-AI-Cartoon-Studio`.
2. Use the repository root as the project root.
3. In Vercel, open **Settings → Environment Variables**.
4. Add `GEMINI_API_KEY` for Production (and Preview if needed).
5. Redeploy after saving the variable.
6. Test `/api/health`. It should return JSON with `ok: true` and `runtime: "vercel-serverless"`.

Vercel uses `api/generate.js` for `POST /api/generate` and `api/health.js` for `GET /api/health`.

## Deploy to Google Cloud Run
This repository includes `server.js` and `package.json`. Cloud Run must deploy from this GitHub repository as a Node.js source build and start the command `npm start` (or `node server.js`).
1. Connect the GitHub repository to a Cloud Run source deployment.
2. Set the runtime environment variable `GEMINI_API_KEY` in the Cloud Run service configuration. Do not commit the key to GitHub.
3. Deploy a new revision.
4. Test `/api/health`. It should return JSON with `ok: true` and `runtime: "node-cloud-run"`.

The Node server listens on `0.0.0.0` and the port supplied by Cloud Run. It serves the website and the same `POST /api/generate` endpoint.

## Video generation status
This build generates a Hindi story plan, six scene descriptions, narration text and 3D visual prompts. It does **not** yet render real animated 3D video or MP4. That requires a video/animation provider, Hindi text-to-speech, audio mixing and a rendering pipeline. Check provider pricing and quotas before enabling paid services.

## Secret safety
Never paste your Gemini API key into chat, `index.html`, or a GitHub file. Store it only in the deployment platform's environment variables.

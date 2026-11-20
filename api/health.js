export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Only GET is allowed." });
  return res.status(200).json({
    ok: true,
    runtime: "vercel-serverless",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
}
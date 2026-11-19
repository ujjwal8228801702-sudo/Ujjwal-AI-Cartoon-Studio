export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST is allowed." });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "Server setup incomplete: GEMINI_API_KEY is missing." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const title = String(body.title || "").trim().slice(0, 120);
    const genre = String(body.genre || "moral").slice(0, 30);
    if (!title) return res.status(400).json({ error: "कृपया वीडियो का टाइटल लिखें।" });

    const prompt = [
      "You are a Hindi children's 3D cartoon screenwriter.",
      "Create a child-safe, original Hindi story plan for a 3-minute 3D cartoon.",
      "Return ONLY valid JSON with this exact shape:",
      '{"intro":"Hindi 2-3 sentence synopsis","scenes":[{"name":"short Hindi scene title","description":"Hindi action description","narration":"Hindi voiceover text for about 25-35 seconds","visual_prompt":"Detailed English 3D animated film image prompt. Keep character appearance consistent across scenes."}]}',
      "Exactly 6 scenes. Narration should be natural spoken Hindi, total about 3 minutes. No copyrighted characters or franchise styles. Make it visually vivid and suitable for children.",
      "Genre: " + genre,
      "Story title: " + title
    ].join("\n");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.8, maxOutputTokens: 6000 }
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini API error", response.status, data);
      return res.status(502).json({ error: "कहानी सेवा से जवाब नहीं मिला। API key, model access और quota जाँचें।" });
    }
    const raw = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== 6) {
      return res.status(502).json({ error: "AI ने सही 6-scene कहानी नहीं लौटाई। दोबारा कोशिश करें।" });
    }
    const scenes = parsed.scenes.map((s, i) => ({
      name: String(s.name || ("सीन " + (i + 1))).slice(0, 100),
      description: String(s.description || "").slice(0, 700),
      narration: String(s.narration || "").slice(0, 1800),
      visual_prompt: String(s.visual_prompt || "").slice(0, 1200)
    }));
    return res.status(200).json({ title, intro: String(parsed.intro || "").slice(0, 1000), scenes, status: "story_ready" });
  } catch (error) {
    console.error("Story generation error", error);
    return res.status(500).json({ error: "कहानी बनाते समय समस्या आई। थोड़ी देर बाद कोशिश करें।" });
  }
}

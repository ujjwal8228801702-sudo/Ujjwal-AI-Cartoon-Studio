import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error("Request body too large.");
  }
  return raw ? JSON.parse(raw) : {};
}

async function generateStory(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Only POST is allowed." });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return sendJson(res, 503, { error: "Server setup incomplete: GEMINI_API_KEY is missing." });

  try {
    const body = await readBody(req);
    const title = String(body.title || "").trim().slice(0, 120);
    const genre = String(body.genre || "moral").slice(0, 30);
    if (!title) return sendJson(res, 400, { error: "कृपया वीडियो का टाइटल लिखें।" });

    const prompt = [
      "You are a Hindi children's 3D cartoon screenwriter.",
      "Create a child-safe, original Hindi story plan for a 3-minute 3D cartoon.",
      "Return ONLY valid JSON with this exact shape:",
      '{"intro":"Hindi 2-3 sentence synopsis","scenes":[{"name":"short Hindi scene title","description":"Hindi action description","narration":"Hindi voiceover text for about 25-35 seconds","visual_prompt":"Detailed English 3D animated film image prompt. Keep character appearance consistent across scenes."}]}',
      "Exactly 6 scenes. Narration should be natural spoken Hindi, total about 3 minutes. No copyrighted characters or franchise styles. Make it visually vivid and suitable for children.",
      "Genre: " + genre,
      "Story title: " + title
    ].join("\n");

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.8, maxOutputTokens: 6000 }
      }),
      signal: AbortSignal.timeout(55000)
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("Gemini API error:", upstream.status, JSON.stringify(data).slice(0, 1500));
      return sendJson(res, 502, { error: "कहानी सेवा से जवाब नहीं मिला। API key, model access और quota जाँचें।" });
    }
    const raw = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length !== 6) {
      return sendJson(res, 502, { error: "AI ने सही 6-scene कहानी नहीं लौटाई। दोबारा कोशिश करें।" });
    }
    const scenes = parsed.scenes.map((s, i) => ({
      name: String(s.name || ("सीन " + (i + 1))).slice(0, 100),
      description: String(s.description || "").slice(0, 700),
      narration: String(s.narration || "").slice(0, 1800),
      visual_prompt: String(s.visual_prompt || "").slice(0, 1200)
    }));
    return sendJson(res, 200, { title, intro: String(parsed.intro || "").slice(0, 1000), scenes, status: "story_ready" });
  } catch (error) {
    console.error("Story generation error:", error);
    return sendJson(res, 500, { error: "कहानी बनाते समय समस्या आई। थोड़ी देर बाद कोशिश करें।" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, runtime: "node-cloud-run", geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  }
  if (url.pathname === "/api/generate") return generateStory(req, res);

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const target = path.resolve(ROOT, "." + pathname);
  if (!target.startsWith(ROOT + path.sep) && target !== path.join(ROOT, "index.html")) {
    return sendJson(res, 403, { error: "Forbidden." });
  }
  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) return sendJson(res, 404, { error: "Not found." });
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(target)] || "application/octet-stream",
      "Cache-Control": path.extname(target) === ".html" ? "no-cache" : "public, max-age=3600"
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Ujjwal AI Cartoon Studio listening on 0.0.0.0:" + PORT);
});
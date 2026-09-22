import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PYTHON_BRIDGE_SCRIPT } from "./src/data/pythonBridgeScript.ts";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check & Capabilities
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    name: "PRAJ",
  });
});

// 2. Download the Python Desktop Bridge script
app.get("/api/download/praj_bridge.py", (_req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=praj_desktop_bridge.py");
  res.setHeader("Content-Type", "text/x-python");
  res.send(PYTHON_BRIDGE_SCRIPT);
});

// Backwards compatibility endpoint
app.get("/api/download/jarvis_bridge.py", (_req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=praj_desktop_bridge.py");
  res.setHeader("Content-Type", "text/x-python");
  res.send(PYTHON_BRIDGE_SCRIPT);
});

// 3. Gemini AI Query Endpoint
app.post("/api/ai/ask", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const ai = getAIClient();
  if (!ai) {
    return res.json({
      reply: "PRAJ is running in offline zero-API mode. For general AI queries beyond the offline knowledge base, you can attach an API key in Settings > Secrets.",
      hasApiKey: false,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are PRAJ, a concise, highly capable, and refined voice assistant. Keep answers brief (1-3 sentences max) so they sound natural when spoken aloud. Never say you are just a web model that cannot interact with hardware; state that you are coordinating with the local system agent.",
        temperature: 0.7,
      },
    });

    const reply = response.text || "I processed your request, sir.";
    res.json({ reply, hasApiKey: true });
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to generate AI response",
    });
  }
});

// 4. Wikipedia Search Proxy
app.get("/api/wikipedia", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.trim())}`;
    const wikiRes = await fetch(searchUrl, {
      headers: { "User-Agent": "PRAJAssistant/1.0 (Desktop Assistant Interface)" },
    });

    if (wikiRes.ok) {
      const data = await wikiRes.json();
      return res.json({
        title: data.title,
        extract: data.extract || "No summary available.",
        url: data.content_urls?.desktop?.page,
      });
    }

    // Fallback: search opensearch
    const openSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query.trim())}&limit=1&namespace=0&format=json`;
    const openRes = await fetch(openSearchUrl);
    if (openRes.ok) {
      const openData = await openRes.json();
      if (openData[2] && openData[2][0]) {
        return res.json({
          title: openData[1][0] || query,
          extract: openData[2][0],
          url: openData[3][0],
        });
      }
    }

    res.json({ extract: "I couldn't locate any relevant Wikipedia entry for that topic, sir." });
  } catch {
    res.json({ extract: "Unable to reach Wikipedia service at this moment." });
  }
});

// 5. News Headlines Endpoint
app.get("/api/news", async (_req, res) => {
  try {
    // Curated high-reliability public news feed
    const rssRes = await fetch("https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (rssRes.ok) {
      const text = await rssRes.text();
      const titles: string[] = [];
      const matches = text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
      for (const m of matches) {
        if (m[1] && !m[1].includes("Google News") && titles.length < 5) {
          titles.push(m[1].split(" - ")[0]);
        }
      }
      if (titles.length === 0) {
        const itemMatches = text.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>/g);
        for (const im of itemMatches) {
          if (im[1] && titles.length < 5) {
            titles.push(im[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"'));
          }
        }
      }

      if (titles.length > 0) {
        return res.json({ headlines: titles });
      }
    }
  } catch (e) {
    console.warn("News RSS fetch fallback:", e);
  }

  // Graceful fallback headlines
  res.json({
    headlines: [
      "Global technology advancements accelerate automated system controls",
      "Space exploration missions reach new orbital milestones",
      "Clean energy grids report record renewable power generation",
      "Artificial intelligence models integrate with local operating systems",
      "Quantum computing researchers announce benchmark breakthrough",
    ],
  });
});

// Vite Middleware for development & Static file serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jarvis Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

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

// Helper for Universal AI Provider routing
type SupportedProvider = 'gemini' | 'openrouter' | 'openai' | 'custom_openai';

function determineProvider(
  provider?: string,
  apiKey?: string,
  baseUrl?: string
): SupportedProvider {
  if (provider === 'openrouter' || provider === 'openai' || provider === 'custom_openai' || provider === 'gemini') {
    return provider;
  }
  const key = (apiKey || '').trim();
  const url = (baseUrl || '').toLowerCase();

  if (url.includes('openrouter.ai') || key.startsWith('sk-or-v1-')) {
    return 'openrouter';
  }
  if (url.includes('api.openai.com') || (key.startsWith('sk-') && !key.startsWith('sk-or-'))) {
    return 'openai';
  }
  if (url.includes('groq.com') || url.includes('localhost') || url.includes('127.0.0.1') || url.includes('/v1')) {
    return 'custom_openai';
  }
  return 'gemini';
}

function resolveOpenAiChatUrl(baseUrl?: string, provider?: string): string {
  let url = (baseUrl || '').trim();
  if (!url) {
    if (provider === 'openrouter') return 'https://openrouter.ai/api/v1/chat/completions';
    if (provider === 'openai') return 'https://api.openai.com/v1/chat/completions';
    return 'https://api.openai.com/v1/chat/completions';
  }
  url = url.replace(/\/+$/, '');
  if (url.endsWith('/chat/completions')) {
    return url;
  }
  if (url === 'https://openrouter.ai' || url === 'https://openrouter.ai/api') {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }
  if (url === 'https://api.openai.com') {
    return 'https://api.openai.com/v1/chat/completions';
  }
  return `${url}/chat/completions`;
}

// 3. Universal AI Query Endpoint (Gemini, OpenRouter, OpenAI, Custom LLM)
app.post("/api/ai/ask", async (req, res) => {
  const { prompt, customApiKey, customBaseUrl, customModel, provider: requestedProvider } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const effectiveKey = (typeof customApiKey === "string" && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!effectiveKey) {
    return res.json({
      reply: "PRAJ is running in offline zero-API mode. Please enter your API Key in the bottom settings bar or add GEMINI_API_KEY.",
      hasApiKey: false,
    });
  }

  const provider = determineProvider(requestedProvider, effectiveKey, customBaseUrl);
  const selectedModel =
    (typeof customModel === "string" && customModel.trim()) ||
    (provider === 'gemini' ? 'gemini-3.8-flash' : provider === 'openrouter' ? 'deepseek/deepseek-r1' : 'gpt-4o-mini');

  try {
    // Branch A: Google Gemini API
    if (provider === 'gemini') {
      const clientOptions: { apiKey: string; httpOptions?: { baseUrl?: string; headers?: Record<string, string> } } = {
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      };

      if (typeof customBaseUrl === "string" && customBaseUrl.trim()) {
        clientOptions.httpOptions = {
          ...clientOptions.httpOptions,
          baseUrl: customBaseUrl.trim(),
        };
      }

      const ai = new GoogleGenAI(clientOptions);

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction:
            "You are PRAJ, a concise, highly capable, and refined voice assistant. Keep answers brief (1-3 sentences max) so they sound natural when spoken aloud. Never say you are just a web model that cannot interact with hardware; state that you are coordinating with the local system agent.",
          temperature: 0.7,
        },
      });

      const reply = response.text || "I processed your request, sir.";
      return res.json({ reply, hasApiKey: true, model: selectedModel, provider: 'gemini' });
    }

    // Branch B: OpenAI / OpenRouter / Custom OpenAI-Compatible Endpoint
    const endpoint = resolveOpenAiChatUrl(customBaseUrl, provider);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveKey}`,
    };

    if (provider === 'openrouter' || endpoint.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'PRAJ Desktop Assistant';
    }

    const payload = {
      model: selectedModel,
      messages: [
        {
          role: "system",
          content:
            "You are PRAJ, a concise, highly capable, and refined voice assistant. Keep answers brief (1-3 sentences max) so they sound natural when spoken aloud. Never say you are just a web model that cannot interact with hardware; state that you are coordinating with the local system agent.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 350,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify(payload),
    });
    clearTimeout(timeout);

    const data = await apiRes.json();
    if (!apiRes.ok) {
      const errMsg = data.error?.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) || `HTTP ${apiRes.status}`;
      return res.status(apiRes.status).json({
        error: `Provider error (${provider}): ${errMsg}`,
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || "I processed your request, sir.";
    return res.json({ reply, hasApiKey: true, model: selectedModel, provider });
  } catch (err: unknown) {
    console.error("AI API error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to generate AI response",
    });
  }
});

// 3b. Verify & Test Universal API Configuration Endpoint
app.post("/api/ai/test-config", async (req, res) => {
  const { customApiKey, customBaseUrl, customModel, provider: requestedProvider } = req.body;
  const effectiveKey = (typeof customApiKey === "string" && customApiKey.trim()) || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    return res.status(400).json({ success: false, error: "No API Key provided" });
  }

  const provider = determineProvider(requestedProvider, effectiveKey, customBaseUrl);
  const selectedModel =
    (typeof customModel === "string" && customModel.trim()) ||
    (provider === 'gemini' ? 'gemini-3.8-flash' : provider === 'openrouter' ? 'deepseek/deepseek-r1' : 'gpt-4o-mini');

  try {
    // Branch A: Google Gemini
    if (provider === 'gemini') {
      const clientOptions: { apiKey: string; httpOptions?: { baseUrl?: string; headers?: Record<string, string> } } = {
        apiKey: effectiveKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      };

      if (typeof customBaseUrl === "string" && customBaseUrl.trim()) {
        clientOptions.httpOptions = {
          ...clientOptions.httpOptions,
          baseUrl: customBaseUrl.trim(),
        };
      }

      const ai = new GoogleGenAI(clientOptions);
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: "Reply with the single word: READY",
      });

      const text = response.text?.trim() || "READY";
      return res.json({ success: true, model: selectedModel, provider: 'gemini', testResponse: text });
    }

    // Branch B: OpenAI / OpenRouter / Custom OpenAI-Compatible
    const endpoint = resolveOpenAiChatUrl(customBaseUrl, provider);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${effectiveKey}`,
    };

    if (provider === 'openrouter' || endpoint.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'PRAJ Desktop Assistant';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: "Reply with the single word: READY" }],
        max_tokens: 15,
      }),
    });
    clearTimeout(timeout);

    const data = await apiRes.json();
    if (!apiRes.ok) {
      const errMsg = data.error?.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) || `HTTP ${apiRes.status}`;
      return res.status(400).json({
        success: false,
        error: `Failed on ${provider}: ${errMsg}`,
      });
    }

    const text = data.choices?.[0]?.message?.content?.trim() || "READY";
    return res.json({ success: true, model: selectedModel, provider, testResponse: text });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to connect to API",
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

// 6. Direct Node-to-Bridge Local Proxy (Bypasses all browser CORS/PNA policies)
app.all("/api/bridge-proxy/:endpoint", async (req, res) => {
  const { endpoint } = req.params;
  const bridgeUrl = `http://127.0.0.1:5000/api/${endpoint}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const fetchOptions: RequestInit = {
      method: req.method,
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    };
    if (req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    const bridgeRes = await fetch(bridgeUrl, fetchOptions);
    clearTimeout(timeout);
    const data = await bridgeRes.json();
    res.status(bridgeRes.status).json(data);
  } catch (err) {
    res.status(502).json({
      connected: false,
      error: err instanceof Error ? err.message : "Local Python bridge unreachable at 127.0.0.1:5000",
    });
  }
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

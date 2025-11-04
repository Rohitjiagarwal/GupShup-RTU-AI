// server/routes/gemini.route.js
import express from "express";
import axios from "axios";

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Default model (hardcoded so you don’t need GEMINI_MODEL in .env)
const DEFAULT_MODEL = "gemini-1.5-flash";

// Vibe templates
const VIBE_PROMPTS = {
  friendly:
    "You are Gupshup, a friendly and helpful assistant. Use a warm tone, add emojis if natural, and explain things clearly with short examples.",
  teacher:
    "You are Gupshup, an experienced teacher. Explain concepts step-by-step, include examples, and end with a short summary.",
  concise:
    "You are Gupshup. Provide concise, direct answers in 2–4 sentences. Use bullet points if needed.",
  joking:
    "You are Gupshup with a light, witty personality. Crack harmless jokes but stay helpful and respectful.",
  code_assistant:
    "You are Gupshup, a coding mentor. Provide runnable code snippets, explain line-by-line, and mention complexity if relevant.",
};

router.post("/chat", async (req, res) => {
  try {
    const {
      messages = [],
      vibe = "friendly",
      customPrompt = "",
      maxOutputTokens = 512,
      temperature = 0.2,
    } = req.body;

    const basePrompt = VIBE_PROMPTS[vibe] || VIBE_PROMPTS.friendly;
    const systemPrompt = customPrompt
      ? `${basePrompt}\n\nCustom preference: ${customPrompt}`
      : basePrompt;

    // Convert history into simple text format
    const conversation = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const finalPrompt = `${systemPrompt}\n\nConversation:\n${conversation}\nAssistant:`;

    // Hardcoded model endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent`;

    const payload = {
      contents: [{ parts: [{ text: finalPrompt }] }],
      generationConfig: {
        maxOutputTokens,
        temperature,
      },
    };

    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    };

    const apiResp = await axios.post(url, payload, { headers, timeout: 20000 });

    const reply =
      apiResp?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    return res.json({ ok: true, reply });
  } catch (err) {
    console.error("Gemini error:", err.response?.data || err.message);
    return res.status(500).json({ ok: false, error: "Gemini API error" });
  }
});

export default router;

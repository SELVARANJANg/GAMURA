import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, selectedTool, userApiKey } = req.body || {};
    const apiKey =
      userApiKey && userApiKey.length > 20 && !userApiKey.includes("MY_GEMINI_API_KEY")
        ? userApiKey
        : (process.env.GAMURA_API_KEY && process.env.GAMURA_API_KEY.length > 20)
          ? process.env.GAMURA_API_KEY
          : (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20)
            ? process.env.GEMINI_API_KEY
            : null;

    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured. Please configure it in your environment variables.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const toolContext = selectedTool
      ? `[TOOL: ${String(selectedTool).toUpperCase()}] `
      : "";

    const contents = (messages || []).map((m: any) => ({
      role: m.role,
      parts: [
        { text: m.role === "user" ? toolContext + m.content : m.content },
      ],
    }));

    const systemInstruction = `You are the Gamura Prompt Generator (GPG) v3.1. Your ONLY purpose is to generate highly optimized prompts based on the user's input.
If the user asks a general question, tries to chat with you, or asks you to do anything OTHER than generating a prompt, you MUST reply with exactly: "I'm a GPG". Do not generate a prompt in this case.
When generating a prompt, your output MUST be ONLY the generated prompt.

STRICT RULES:
1. ONLY generate prompts. Otherwise reply "I'm a GPG".
2. NO conversational filler.
3. NO markdown formatting.
4. NO unwanted symbols.
5. Output ONLY the raw prompt text.

TOOL-SPECIFIC OPTIMIZATION:
- CODE: Focus on logic, language-specific best practices, and architecture.
- IMAGE: Focus on cinematic lighting, camera specs (35mm, f/1.8), and artistic style.
- VIDEO: Focus on camera movement (pan, tilt, zoom), frame rate, and temporal consistency.
- MATHS: Focus on step-by-step logic, precision, and mathematical notation.
- CHART: Focus on data structure, axes labels, and visual clarity.
- GRAPH: Focus on nodes, edges, relationships, and topological layout.

SPEED:
- Provide the absolute best version immediately.`;

    let response: any;
    const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });
        if (response && (response.text || response.text === "")) {
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const text =
      response?.text ||
      "I couldn't generate a prompt right now. Please try again.";

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("GPG Serverless Error:", error);
    let message = error?.message || "Failed to generate prompt via Gemini.";
    if (typeof message === "string" && (message.includes("PERMISSION_DENIED") || message.includes("403"))) {
      message = "Permission denied for Gemini API. Please ensure the API key has permission for the Generative Language API.";
    }
    return res.status(500).json({ error: message });
  }
}

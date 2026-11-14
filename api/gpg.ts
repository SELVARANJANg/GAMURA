import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, selectedTool, userApiKey } = req.body || {};
    const apiKey =
      userApiKey &&
      typeof userApiKey === "string" &&
      userApiKey.length > 20 &&
      !userApiKey.includes("MY_GEMINI_API_KEY")
        ? userApiKey
        : process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20
          ? process.env.GEMINI_API_KEY
          : process.env.GAMURA_API_KEY && process.env.GAMURA_API_KEY.length > 20
            ? process.env.GAMURA_API_KEY
            : null;

    if (!apiKey) {
      const lastMsg = [...(messages || [])]
        .reverse()
        .find((m: any) => m.role === "user");
      const promptTarget = selectedTool
        ? `for ${String(selectedTool).toUpperCase()}`
        : "for advanced AI generation";
      const queryText = (lastMsg?.content || "General request").trim();
      const fallbackPrompt = `Act as an expert specialist ${promptTarget}. Execute with top precision:

Context & Goal:
${queryText}

Directives:
- Adhere strictly to production-grade architecture and best practices.
- Deliver comprehensive, structured, error-free output with clear instructions.
- Provide practical implementation details and handle all edge cases.`;

      return res.status(200).json({ text: fallbackPrompt });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    const toolContext = selectedTool
      ? `[TOOL: ${String(selectedTool).toUpperCase()}] `
      : "";

    const contents = (messages || []).map((m: any) => ({
      role: m.role,
      parts: [
        { text: m.role === "user" ? toolContext + m.content : m.content },
      ],
    }));

    const systemInstruction = `You are the Gamura Prompt Generator (GPG). Your SOLE purpose is to transform whatever the user enters into a crisp, ready-to-use, high-precision prompt tailored directly to their need.

STRICT RULES:
1. ALWAYS convert the user's input (whether a topic, task, question, idea, or goal) into a well-structured, optimized prompt ready to copy and paste.
2. Output ONLY the generated prompt text itself.
3. NO introductions, NO commentary, NO explanations, NO markdown code fences, NO conversational filler.

TOOL-SPECIFIC OPTIMIZATION:
- CODE: Focus on architecture, language best practices, edge cases, and clean deliverables.
- IMAGE: Focus on subject, composition, lighting, lens/camera specs, and visual style.
- VIDEO: Focus on camera motion, framing, pacing, lighting, and temporal consistency.
- MATHS: Focus on step-by-step derivation, rigor, and notation.
- CHART / GRAPH: Focus on schema, axes, topology, and visual clarity.`;

    let response: any;
    const modelsToTry = [
      "gemini-4-hydrogen",
      "gemini-3.1-flash-lite",
    ];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            ...(model === "gemini-4-hydrogen"
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
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
    if (
      typeof message === "string" &&
      (message.includes("PERMISSION_DENIED") || message.includes("403"))
    ) {
      message =
        "Permission denied for Gemini API. Please ensure the API key has permission for the Generative Language API.";
    }
    return res.status(500).json({ error: message });
  }
}

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, messages } = req.body || {};
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(200).json({ matches: [] });
    }

    const cleanQuery = query.trim();
    const messageList = Array.isArray(messages) ? messages : [];

    if (messageList.length === 0) {
      return res.status(200).json({ matches: [] });
    }

    const apiKey =
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20
        ? process.env.GEMINI_API_KEY
        : process.env.GAMURA_API_KEY && process.env.GAMURA_API_KEY.length > 20
          ? process.env.GAMURA_API_KEY
          : null;

    if (!apiKey) {
      const lowerQ = cleanQuery.toLowerCase();
      const tokens = lowerQ.split(/\s+/).filter(Boolean);
      const fallbackMatches = messageList
        .map((m: any) => {
          const text = String(m.text || "").toLowerCase();
          const sender = String(m.senderName || "").toLowerCase();
          const hits = tokens.filter(
            (t) => text.includes(t) || sender.includes(t),
          );
          if (hits.length === 0) return null;
          const score = Math.min(
            100,
            Math.round((hits.length / Math.max(1, tokens.length)) * 100),
          );
          return {
            id: m.id,
            relevance: score,
            reason: "Keyword conceptual match",
          };
        })
        .filter(Boolean);

      return res.status(200).json({ matches: fallbackMatches });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    const compactMessages = messageList.slice(-100).map((m: any) => ({
      id: String(m.id || ""),
      text: String(m.text || "").slice(0, 500),
      sender: String(m.senderName || "User").slice(0, 50),
    }));

    const prompt = `You are a Semantic Search Engine for chat messages.
Analyze the search query and evaluate each message by semantic meaning, topic, context, intention, synonyms, and sentiment—NOT mere string matching.

User Search Query: "${cleanQuery}"

Chat Messages:
${JSON.stringify(compactMessages, null, 2)}

Instructions:
1. Identify all messages that conceptually relate to, answer, or mention themes implied by the search query.
2. For each relevant message, provide:
   - "id": The exact message ID string.
   - "relevance": An integer from 50 to 100 indicating relevance strength.
   - "reason": A brief 2-4 word reason explaining why it semantically matches.
3. Only return messages with genuine conceptual similarity. If no messages match, return an empty list.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  relevance: { type: Type.INTEGER },
                  reason: { type: Type.STRING },
                },
                required: ["id", "relevance", "reason"],
              },
            },
          },
          required: ["matches"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.status(200).json({
      matches: Array.isArray(parsedData.matches) ? parsedData.matches : [],
    });
  } catch (err: any) {
    console.error("Semantic search serverless error:", err);
    const q = String(req.body?.query || "").toLowerCase();
    const list = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const fallbackMatches = list
      .filter((m: any) => String(m.text || "").toLowerCase().includes(q))
      .map((m: any) => ({
        id: m.id,
        relevance: 80,
        reason: "Fuzzy text match",
      }));
    return res.status(200).json({ matches: fallbackMatches });
  }
}

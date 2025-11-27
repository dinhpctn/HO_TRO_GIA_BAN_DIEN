import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getLegalRank } from "../utils/legalRank";
import type { KnowledgeDoc, ChatMessage } from "../types";

/**
 * Serverless endpoint to proxy requests to Gemini.
 * - Expects POST with JSON: { question: string, documents: KnowledgeDoc[], history: ChatMessage[] }
 * - Requires server env var GEMINI_API_KEY (set in Vercel/host secrets; DO NOT use VITE_ prefix)
 *
 * Note: Keep this file server-only so API key stays secret.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfiguration: GEMINI_API_KEY is missing." });
    return;
  }

  const body = req.body || {};
  const { question, documents = [], history = [] } = body;

  if (!question || typeof question !== "string") {
    res.status(400).json({ error: "Missing or invalid 'question' in request body." });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build system instruction (same logic as client previously used)
    const sortedDocs = [...(documents as KnowledgeDoc[])].sort((a, b) => {
      const rankA = getLegalRank(a.name);
      const rankB = getLegalRank(b.name);
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
    });

    let contextString = "";
    if (sortedDocs.length === 0) {
      contextString = "No documents have been provided yet.";
    } else {
      contextString = sortedDocs
        .map((doc, index) => {
          const rank = getLegalRank(doc.name);
          return `
<document index="${index + 1}" priority_rank="${rank}">
<meta>
  <title>${doc.name}</title>
  <effective_date>${doc.effectiveDate}</effective_date>
</meta>
<content>
${doc.content}
</content>
</document>
`;
        })
        .join("\n");
    }

    const systemInstruction = `
Bạn là một Trợ lý Pháp lý AI chuyên nghiệp ("Legal AI Expert").
Nhiệm vụ: Trả lời câu hỏi dựa trên các văn bản pháp luật được cung cấp (CONTEXT).
...
### CONTEXT DOCUMENTS (Đã sắp xếp theo độ ưu tiên):
${contextString}
`;

    // Prepare history for model (filter errors and map)
    const validHistory = (history as ChatMessage[]).filter((h) => !h.isError);
    const historyForModel = validHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      parts: [{ text: msg.text }],
    }));

    const chatSession = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        temperature: 0.1,
      },
      history: historyForModel,
    });

    const result: GenerateContentResponse = await chatSession.sendMessage({
      message: question,
    });

    const text = result.text || "Không có phản hồi từ mô hình.";
    res.status(200).json({ text });
  } catch (error: any) {
    console.error("Error calling Gemini:", error);
    const message = error?.message || "Unknown error from Gemini.";
    res.status(500).json({ error: message });
  }
}
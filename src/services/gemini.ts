import { GoogleGenAI } from "@google/genai";
import { Attachment } from "../types.js";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[CHAT GPR] GEMINI_API_KEY is not set in environment variables.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Format user uploaded attachments into Google GenAI inlineData or text parts
 */
export function formatAttachmentsForGemini(attachments: Attachment[]): any[] {
  const parts: any[] = [];

  for (const att of attachments) {
    if (att.base64Data || att.dataUrl) {
      let rawBase64 = att.base64Data || "";
      if (!rawBase64 && att.dataUrl && att.dataUrl.includes(",")) {
        rawBase64 = att.dataUrl.split(",")[1];
      }
      if (rawBase64.includes(",")) {
        rawBase64 = rawBase64.split(",")[1];
      }
      rawBase64 = rawBase64.replace(/\s/g, "");

      if (!rawBase64) continue;

      if (att.type.startsWith("image/")) {
        parts.push({
          inlineData: {
            data: rawBase64,
            mimeType: att.type || "image/jpeg",
          },
        });
      } else if (att.type === "application/pdf") {
        parts.push({
          inlineData: {
            data: rawBase64,
            mimeType: "application/pdf",
          },
        });
      } else {
        // Text / code files
        try {
          const decoded = Buffer.from(rawBase64, "base64").toString("utf-8");
          parts.push({
            text: `[Attached File: ${att.name}]\n\`\`\`\n${decoded}\n\`\`\``,
          });
        } catch {
          parts.push({
            inlineData: {
              data: rawBase64,
              mimeType: att.type || "text/plain",
            },
          });
        }
      }
    }
  }

  return parts;
}

/**
 * Sanitize and validate message contents for Gemini API:
 * 1. Combines consecutive messages with the same role
 * 2. Filters out empty parts
 * 3. Ensures the conversation starts with a 'user' turn
 */
export function sanitizeGeminiContents(contents: Array<{ role: string; parts: any[] }>): Array<{ role: string; parts: any[] }> {
  if (!contents || contents.length === 0) {
    return [{ role: "user", parts: [{ text: "Hello" }] }];
  }

  const validContents: Array<{ role: string; parts: any[] }> = [];

  for (const item of contents) {
    const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
    const cleanParts = (item.parts || []).filter((p) => {
      if (!p) return false;
      if (typeof p.text === "string") return p.text.trim().length > 0;
      if (p.inlineData && p.inlineData.data) return true;
      return false;
    });

    if (cleanParts.length === 0) continue;

    if (validContents.length > 0 && validContents[validContents.length - 1].role === role) {
      // Merge with previous turn of same role
      validContents[validContents.length - 1].parts.push(...cleanParts);
    } else {
      validContents.push({ role, parts: cleanParts });
    }
  }

  // Ensure first turn is 'user'
  if (validContents.length > 0 && validContents[0].role === "model") {
    validContents.shift();
  }

  if (validContents.length === 0) {
    return [{ role: "user", parts: [{ text: "Hello" }] }];
  }

  return validContents;
}

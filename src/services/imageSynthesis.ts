import { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "./gemini.js";
import { VisualExplanation } from "../types.js";

export interface ImageSynthesisOptions {
  userPrompt: string;
  webContext?: string;
  aspectRatio?: "1:1" | "16:9" | "4:3" | "3:4" | "9:16";
  resolution?: "1K" | "2K" | "4K";
}

export interface ImageSynthesisResult {
  imageUrl: string;
  promptUsed: string;
  titleKm: string;
  titleEn: string;
  visualExplanation: VisualExplanation;
}

/**
 * Intelligent Photorealism Prompt Engineer
 * Converts natural Khmer or English user requests (e.g. "បង្កើតរូបអង្គរវត្តពេលថ្ងៃរះ")
 * into high-precision, National Geographic grade camera photography prompts with zero 3D/CGI artifacts.
 */
export async function constructPhotorealisticPrompt(
  userPrompt: string,
  webContext?: string
): Promise<{ englishPrompt: string; titleKm: string; titleEn: string; subject: string }> {
  const cleanSubject = userPrompt
    .replace(/^(?:សូម\s*)?(?:ជួយ\s*)?(?:បង្កើត|គូរ|ធ្វើ|ឌីហ្សាញ|សុំ|ចង់បាន)(?:រូបភាព|រូបថត|រូបគំនូរ|រូបភាពបែប|រូប)?(?:\s+នៃ|\s+ពី|\s+ឱ្យ|ឲ្យ|\s+មួយ)?\s*/i, "")
    .replace(/^(?:please\s+)?(?:generate|create|draw|render|make|take)\s+(?:an?\s+)?(?:image|picture|photo|photograph)\s+(?:of|showing)?\s*/i, "")
    .trim() || userPrompt.trim();

  try {
    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `You are an expert National Geographic landscape & documentary photographer and Masterclass Prompt Engineer specializing in 100% authentic, real-life photography.

User Request: "${userPrompt}"
${webContext ? `Real-World Reference Context from Web Search:\n${webContext.slice(0, 1000)}` : ""}

Task:
1. Translate the user's intent into an ultra-detailed, 100% photorealistic DSLR camera prompt in English.
2. The style MUST be REAL-LIFE PHOTOGRAPHY (like a real camera shot by a professional photographer on location).
3. EXPLICITLY FORBID any 3D render, CGI, cartoon, anime, artificial digital graphics, plastic textures, or illustration.
4. Include authentic optical details: Canon EOS R5 / Sony A7R V, 35mm / 50mm / 85mm lens, natural optical lighting (golden hour, soft morning mist, diffused ambient light), authentic architectural textures (ancient sandstone, weathering, water reflection), accurate cultural landmarks.
5. Create a concise title in Khmer and English.

Output STRICT JSON only:
{
  "subject": "${cleanSubject}",
  "titleKm": "រូបថតពិត៖ ${cleanSubject}",
  "titleEn": "Authentic Photo of ${cleanSubject}",
  "englishPrompt": "Award-winning National Geographic photograph of ${cleanSubject}, captured on Canon EOS R5 with EF 24-70mm f/2.8L II USM lens, natural lighting, authentic real-life environment, sharp crisp focus, hyper-realistic, 8k resolution, raw photo, true-to-life colors, highly detailed, photorealistic, no 3d render, no cgi, no cartoon, no anime, no painting, no illustration"
}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(result.text || "{}");
    if (parsed.englishPrompt) {
      return {
        englishPrompt: parsed.englishPrompt,
        titleKm: parsed.titleKm || `រូបថតពិត៖ ${cleanSubject}`,
        titleEn: parsed.titleEn || `Authentic Photo of ${cleanSubject}`,
        subject: parsed.subject || cleanSubject,
      };
    }
  } catch {
    // Graceful fallback to rule-based camera prompt without throwing
  }

  const englishPrompt = `Award-winning National Geographic authentic raw photograph of ${cleanSubject}, captured with Canon EOS R5 50mm f/1.4 lens, natural golden hour lighting, authentic real-life environment, sharp crisp focus, hyper-realistic, 8k resolution, raw photo, true-to-life colors, highly detailed, photorealistic, no 3d render, no cgi, no cartoon, no anime, no painting, no illustration`;

  return {
    englishPrompt,
    titleKm: `រូបថតពិត៖ ${cleanSubject}`,
    titleEn: `Authentic Photo of ${cleanSubject}`,
    subject: cleanSubject,
  };
}

/**
 * Multi-Tier High-Resolution Photorealistic Image Generator
 * Generates stunning 100% photorealistic photos and returns a complete VisualExplanation artifact.
 */
export async function generatePhotorealisticImage(
  options: ImageSynthesisOptions
): Promise<ImageSynthesisResult> {
  const { userPrompt, webContext, aspectRatio = "16:9" } = options;

  // 1. Build high-precision camera prompt
  const { englishPrompt, titleKm, titleEn, subject } = await constructPhotorealisticPrompt(
    userPrompt,
    webContext
  );

  let finalImageUrl: string | null = null;
  let modelEngineUsed = "Gemini Imagen 3 Realism";

  // Tier 1: Dedicated Pollinations.ai High-Resolution FLUX Engine (Instant & Ultra-Realistic)
  const width = aspectRatio === "16:9" ? 1280 : aspectRatio === "1:1" ? 1024 : 1152;
  const height = aspectRatio === "16:9" ? 720 : aspectRatio === "1:1" ? 1024 : 864;
  const seed = Math.floor(Math.random() * 99999999);
  const encodedPrompt = encodeURIComponent(englishPrompt);

  // Use pollinations.ai high quality photorealistic FLUX model
  finalImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux-realism&nologo=true&enhance=true`;
  modelEngineUsed = "Pollinations.ai (FLUX Realism Engine)";

  // Optional: If Gemini Imagen is explicitly configured, we could also use it, but Pollinations provides instant 100% reliable image URLs for the web client
  if (!finalImageUrl) {
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: englishPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio === "16:9" ? "16:9" : aspectRatio === "1:1" ? "1:1" : "4:3",
            imageSize: "1K",
          },
        },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || "image/jpeg";
            finalImageUrl = `data:${mime};base64,${part.inlineData.data}`;
            modelEngineUsed = "Gemini Imagen 3 Photorealism";
            break;
          }
        }
      }
    } catch {
      // Keep Pollinations.ai URL as rock-solid primary
    }
  }

  const visualExplanation: VisualExplanation = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: "image",
    visualType: "illustration",
    title: titleEn,
    titleKm: titleKm,
    data: finalImageUrl,
    aspectRatio: aspectRatio,
    status: "ready",
    prompt: englishPrompt,
    createdAt: Date.now(),
    explanationSteps: [
      `ស្វែងរកនិងពិនិត្យទម្រង់ស្ថាបត្យកម្ម/បរិយាកាសពិត (Live Reference Grounding)`,
      `សំយោគប្លង់ថតរូបកម្រិត Masterclass 8K លើកាមេរ៉ា Canon EOS R5 (Natural Lighting & Real Textures)`,
      `ច្រោះចោលរចនាបថ 3D/CGI/Cartoon ទាំងអស់ ដើម្បីទទួលបានគុណភាពដូចរូបថតកាមេរ៉ាពិត ១០០%`,
      `Render ដោយប្រើប្រាស់ម៉ាស៊ីន ${modelEngineUsed}`,
    ],
  };

  return {
    imageUrl: finalImageUrl,
    promptUsed: englishPrompt,
    titleKm,
    titleEn,
    visualExplanation,
  };
}

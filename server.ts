import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { getGeminiClient, formatAttachmentsForGemini, sanitizeGeminiContents } from "./src/services/gemini.js";
import { routeUserRequest } from "./src/services/router.js";
import { generateVisualExplanation } from "./src/services/visualExplanation.js";
import { generatePhotorealisticImage } from "./src/services/imageSynthesis.js";
import { parseGeminiError } from "./src/services/errorHelper.js";
import { generateResilientResponse } from "./src/services/fallbackResponder.js";
import { streamQ8Fallback, testQ8Health } from "./src/services/q8Fallback.js";
import { performWebSearch, formatSearchResultsForGemini } from "./src/services/bingSearch.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Body Parsers with large limit for base64 image/file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CHAT GPR Multimodal AI Engine",
    time: new Date().toISOString(),
  });
});

// Google OAuth Configuration & Token Verification Endpoints
app.get("/api/auth/google/config", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "";
  res.json({
    clientId,
    projectNumber: "799679881919",
    configured: Boolean(clientId),
  });
});

app.post("/api/auth/google/verify", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  try {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      return res.status(401).json({ error: "Invalid or expired Google token" });
    }

    const userData = await userInfoRes.json();
    res.json({
      valid: true,
      user: {
        id: userData.id || userData.sub,
        email: userData.email,
        name: userData.name || userData.given_name || "Google User",
        picture: userData.picture,
      },
    });
  } catch (err: any) {
    console.error("Token verification error:", err);
    res.status(500).json({ error: "Failed to verify token with Google" });
  }
});

// 1. Streaming Chat & Multimodal Routing Endpoint
app.post("/api/chat/stream", async (req, res) => {
  const { 
    messages = [], 
    prompt = "", 
    attachments = [], 
    webSearchEnabled = false,
    settings = {},
  } = req.body;

  if (!prompt && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: "Prompt or attachment is required" });
  }

  // Determine intent routing
  const hasImage = attachments.some((a: any) => a.category === "image");
  const hasDocument = attachments.some((a: any) => a.category === "document" || a.type === "application/pdf");
  const route = routeUserRequest(prompt, hasImage, hasDocument, webSearchEnabled);

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send initial intent event
  res.write(`data: ${JSON.stringify({ type: "intent", intent: route.intent, isVisualExplanation: route.isVisualExplanation })}\n\n`);

  // Handle Multimodal Text & Visual Explanation Stream
  try {
    const ai = getGeminiClient();

    // Kick off Photorealistic Image Generation or Visual Explanation in parallel
    let visualPromise: Promise<any> | null = null;
    if (route.isImageGeneration) {
      res.write(`data: ${JSON.stringify({
        type: "visual_explanation_start",
        visualType: "illustration",
        title: "Photorealistic Real-Life Photo",
      })}\n\n`);

      visualPromise = generatePhotorealisticImage({
        userPrompt: prompt,
        webContext: "",
        aspectRatio: "16:9",
        resolution: settings.defaultImageResolution || "1K",
      }).then((res) => res.visualExplanation);
    } else if (route.isVisualExplanation) {
      res.write(`data: ${JSON.stringify({
        type: "visual_explanation_start",
        visualType: route.visualType || "diagram",
        title: route.visualSubject || "Visual Explanation",
      })}\n\n`);

      visualPromise = generateVisualExplanation({
        prompt,
        visualType: route.visualType,
        visualSubject: route.visualSubject,
        language: route.language,
      });
    }

    // Construct comprehensive ChatGPT-level system instruction
    const currentYear = new Date().getFullYear();
    const currentDateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const baseSystemInstruction = `You are CHAT GPR, a world-class, ultra-intelligent, friendly, and articulate AI conversational assistant and tutor modeled after the world's most advanced AI assistants (ChatGPT / GPT-4o).

Knowledge & Real-time Context:
- Current Year: ${currentYear}
- Today's Date: ${currentDateStr}
- Always be aware that the current year is ${currentYear}. Do NOT state that we are in 2024 or older years.

Your mission is to deliver deeply insightful, 100% accurate, exceptionally helpful, beautifully formatted, and natural conversational answers and problem-solving across all domains.

### 🌟 Supreme Problem Solving & Reasoning (ដូច ChatGPT):
1. **Factually Rigorous Knowledge Engine (សម្រាប់សំណួរទូទៅ & ប្រវត្តិសាស្ត្រ & វិទ្យាសាស្ត្រ)**:
   - **General Knowledge & Science Accuracy**: When answering non-real-time questions (science, history, philosophy, geography, economics, grammar, literature, programming, mathematics, logic), provide 100% accurate, deeply researched, and rigorously fact-checked explanations.
   - **Historical Accuracy & Chronology**: Never confuse historical eras, dates, or events. Accurately state exact years, historical figures, treaties, and true outcomes (e.g., Angkorian history, French protectorate, Cold War, World Wars, past border treaties). If an event happened in the past (e.g. 2008-2011), state those exact dates clearly and do not conflate them with the present.
   - **Zero Hallucination Guarantee**: If something is a myth, rumor, or historically incorrect, clarify the distinction politely with verified historical and academic consensus.

2. **Multi-Domain Problem Solving Framework**:
   - **Thorough Understanding**: Identify the core root problem, underlying requirements, constraints, and implicit goals.
   - **Step-by-Step Clarity**: Break complex problems into sequential, easily digestible steps (ជំហានទី១, ជំហានទី២, ជំហានទី៣...) with clear explanations.
   - **Accuracy & First Principles**: Explain the fundamental principles behind solutions (not just superficial fixes). Verify math calculations, code logic, and factual claims.
   - **Edge Cases & Caveats**: Proactively address common pitfalls, performance considerations, security warnings, or exceptions.

3. **Conversational Excellence & Tone**:
   - Speak with warmth, professional confidence, intelligence, clarity, and genuine empathy.
   - Be direct: start with the immediate answer or solution, followed by clear explanations, structured breakdowns, real-world examples, and actionable advice.
   - Avoid generic robotic filler or redundant disclaimers (e.g. do NOT say "As an AI model..."). Jump straight into the high-value answer.

2. **Universal Multilingual Mastery (Support All World Languages)**:
   - **Automatic Language Detection & Mirroring**: Always respond in the EXACT same language (or dialect) that the user asks in, unless explicitly requested to translate or answer in another language.
   - **Flawless Global Fluency**: Native-level vocabulary, pristine grammar, natural idioms, and correct cultural nuances across all major world languages including:
     - 🇰🇭 **Khmer (ភាសាខ្មែរ)**: Natural, highly fluent, grammatically pristine, and polite Khmer (ភាសាខ្មែររលូន គួរសម និងត្រឹមត្រូវតាមក្បួនខ្នាត)។
     - 🇬🇧/🇺🇸 **English**: Articulate, precise, rich vocabulary, and crisp phrasing.
     - 🇨🇳 **Chinese (中文 / 简体 / 繁體)**: Fluent Putonghua/Mandarin and Traditional Chinese with natural syntax and terminology.
     - 🇻🇳 **Vietnamese (Tiếng Việt)**: Natural tone markers, proper honorifics, and accurate modern phrasing.
     - 🇹🇭 **Thai (ภาษาไทย)**: Polite particles (ครับ/ค่ะ), natural sentence structure, and standard grammar.
     - 🇯🇵 **Japanese (日本語)**: Natural keigo (丁寧語/尊敬語/謙譲語), kanji/kana usage, and respectful tone.
     - 🇰🇷 **Korean (한국어)**: Natural honorific levels (해요체/하십시오체), accurate vocabulary, and standard grammar.
     - 🇫🇷 **French (Français)**, 🇪🇸 **Spanish (Español)**, 🇩🇪 **German (Deutsch)**, 🇷🇺 **Russian (Русский)**, 🇸🇦 **Arabic (العربية)**, 🇮🇳 **Hindi (हिन्दी)**, 🇮🇩 **Indonesian (Bahasa Indonesia)**, 🇵🇭 **Tagalog/Filipino**, 🇲🇲 **Burmese (မြန်မာဘာသာ)**, 🇱🇦 **Lao (ພາສາລາວ)**, and every other regional or international language.
   - **Seamless Code-Switching & Translation**: Effortlessly handle mixed languages (e.g. Khmer-English, Singlish, Spanglish) and provide high-accuracy translations preserving exact tone, context, and nuance.

3. **Masterful Markdown Formatting**:
   - Structure long explanations with clear hierarchical Markdown headers (\`##\`, \`###\`).
   - Use scannable bullet points with bold keywords (\`- **ចំណុចសំខាន់៖** ...\`).
   - Use comparison tables (\`| Header 1 | Header 2 |\`) when comparing options, frameworks, or concepts.
   - Highlight key terms with **bold** or *italics* for effortless reading.

4. **Domain Excellence & Problem Solving Depth**:
   - 💻 **Coding & Software Engineering**: Provide clean, modular, production-ready, and bug-free code with language tags, type safety, best practices, step-by-step explanations of how it works, and common edge cases. For debugging: explain the root cause and provide the full fixed code.
   - 📐 **Math, Science & STEM**: Break down problems step-by-step with intuitive reasoning and proofs. Write mathematical formulas using proper LaTeX notation (\`$...$\` inline or \`$$...$$\` display blocks).
   - 💼 **Business, Marketing & Strategy**: Deliver actionable business plans, financial models, marketing frameworks, contract structures, and decision matrices.
   - 🔍 **Vision & Multimodal Analysis**: Carefully inspect attached images, read all visible Khmer & English text (OCR), describe diagrams, solve worksheets, and diagnose UI/code screenshots with precision.
   - ✍️ **Writing, Business & Creativity**: Craft compelling essays, business proposals, professional emails, summaries, and creative stories with nuance and depth.
   - 🌐 **Real-time Research**: Provide up-to-date, objective, and well-cited information when web search is enabled.

5. **Visual Explanations & Diagrams**:
   - When a concept is explained with an educational diagram or flowchart, provide a detailed textual breakdown explaining each component and stage step-by-step under '### ពន្យល់ពីរូបភាព'.`;

    // Format previous conversation history
    const contents: any[] = [];
    const recentMessages = messages.slice(-12);
    for (const msg of recentMessages) {
      const parts: any[] = [];
      if (msg.attachments && msg.attachments.length > 0) {
        parts.push(...formatAttachmentsForGemini(msg.attachments));
      }
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      if (parts.length > 0) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts,
        });
      }
    }

    // Add current user turn
    const currentParts: any[] = [];
    if (attachments && attachments.length > 0) {
      currentParts.push(...formatAttachmentsForGemini(attachments));
    }
    if (prompt) {
      currentParts.push({ text: prompt });
    }
    contents.push({
      role: "user",
      parts: currentParts,
    });

    // Sanitize and normalize conversation turn sequence for Gemini API
    const cleanContents = sanitizeGeminiContents(contents);

    // Real-time Bing Web Live Search integration (100% Free - No API Key required)
    const isTrivialGreeting = /^(?:hi|hello|hey|សួស្តី|ជំរាបសួរ|អរគុណ|thanks|thank you|ok|okay|bye|goodbye|លាហើយ|យល់ព្រម)$/i.test(prompt.trim());
    const shouldSearchWeb = (webSearchEnabled || route.isWebSearch) && !isTrivialGreeting && prompt.trim().length >= 2;
    let webSearchDirective = "";
    let groundingSources: any[] = [];

    if (shouldSearchWeb && prompt) {
      try {
        res.write(`data: ${JSON.stringify({ type: "search_start", query: prompt })}\n\n`);
        const searchRes = await performWebSearch(prompt, {
          maxResults: 6,
        });

        if (searchRes.results && searchRes.results.length > 0) {
          const formattedSources = searchRes.results.map((r) => ({
            title: r.title,
            url: r.url,
            domain: r.domain,
            snippet: r.snippet,
            uri: r.url,
          }));
          groundingSources.push(...formattedSources);

          webSearchDirective = `\n\n### 🌐 Real-Time Search Results (via Bing Web Live Search):\n${formatSearchResultsForGemini(
            searchRes.results
          )}\n\n### 🎯 Comprehensive Web Search Grounding & Synthesis Instructions (ដូច ChatGPT Browse):
1. **Fact-Checking & Truth Grounding**:
   - Critically evaluate the search results against the user's question.
   - If the user asks about an event (e.g. war, conflict, disaster, policy, celebrity news) that is NOT substantiated by the verified search results or did not actually happen, clearly and politely clarify the actual factual reality.
   - If the event is historical (e.g., historical border conflicts in 2008-2011, past political events), clearly specify the exact historical years and distinguish them from current peace/status quo in ${currentYear}.
   - Never hallucinate fake battles, false casualty figures, or unverified rumors.

2. **Easy-to-Understand, Structured & Natural Answer (ឆ្លើយតបងាយយល់ & ច្បាស់លាស់)**:
   - **Direct Executive Summary**: Start with a direct, comprehensive 1-2 sentence overview answering the core question.
   - **Structured Breakdown**: Organize key points with clear headings, bullet points, and **bold key terms** for effortless readability.
   - **Context & Explanations**: Provide clear context in natural, fluent, and respectful Khmer so that any reader can easily understand.
   - **Actionable & Complete**: Ensure the explanation fully answers the user's intent without leaving confusing gaps.`;

          res.write(`data: ${JSON.stringify({
            type: "search_results",
            query: prompt,
            sources: formattedSources,
            provider: "Bing Web Live Search",
          })}\n\n`);
        }
      } catch (sErr: any) {
        console.warn("[Bing Web Live Search Error]", sErr?.message || sErr);
      }
    }

    // Build configuration
    const config: any = {
      systemInstruction: `${baseSystemInstruction}\n\nSpecific Request Directive:\n${route.systemDirective}${webSearchDirective}`,
      temperature: route.isMathOrReasoning || route.isCoding ? 0.2 : 0.7,
    };

    // High availability model cascade prioritized for stability, high quota, and instant speed
    const TEXT_MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.0-flash",
      "gemini-flash-latest",
    ];

    let streamCompleted = false;
    let lastError: any = null;
    let fullText = "";

    for (let i = 0; i < TEXT_MODELS.length; i++) {
      const modelName = TEXT_MODELS[i];
      let attempts = 0;
      // Only retry transient 503 server overload, never 429 quota exhaustion on same model
      const maxAttempts = 1;

      while (attempts < maxAttempts && !streamCompleted) {
        attempts++;
        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: cleanContents,
            config,
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullText += text;
              res.write(`data: ${JSON.stringify({ type: "token", text, modelUsed: modelName })}\n\n`);
            }
          }

          if (fullText.trim().length > 0) {
            streamCompleted = true;
            res.write(`data: ${JSON.stringify({ type: "model_info", modelUsed: modelName, isFallback: false })}\n\n`);
            break;
          }
        } catch (err: any) {
          lastError = err;

          if (fullText.trim().length > 0) {
            streamCompleted = true;
            break;
          }

          // Move quickly to next available model in cascade
          if (i < TEXT_MODELS.length - 1) {
            await new Promise((r) => setTimeout(r, 80));
          }
        }
      }

      if (streamCompleted) break;
    }

    // If Gemini models failed or returned empty text, activate OpenAI-Compatible Q8_K_XL Fallback
    if (!streamCompleted || fullText.trim().length === 0) {
      if (settings.enableFallbackQ8 !== false) {
        let fallbackEndpoint = settings.fallbackEndpointUrl || process.env.FALLBACK_ENDPOINT_URL || "https://hadadrjt-api.hf.space/v1";
        if (fallbackEndpoint.includes("localhost") || fallbackEndpoint.includes("127.0.0.1")) {
          fallbackEndpoint = "https://hadadrjt-api.hf.space/v1";
        }
        const fallbackModel = settings.fallbackModelName || process.env.FALLBACK_MODEL || "Q8_K_XL";
        
        try {
          const q8Result = await streamQ8Fallback({
            endpointUrl: fallbackEndpoint,
            modelName: fallbackModel,
            prompt,
            systemInstruction: baseSystemInstruction,
            history: messages.slice(-8),
            onToken: (token) => {
              fullText += token;
              res.write(`data: ${JSON.stringify({ type: "token", text: token, modelUsed: `${fallbackModel} (OpenAI Compatible)`, isFallback: true })}\n\n`);
            },
          });

          if (q8Result.success && fullText.trim().length > 0) {
            streamCompleted = true;
            res.write(`data: ${JSON.stringify({ type: "model_info", modelUsed: `${fallbackModel} (OpenAI Compatible)`, isFallback: true })}\n\n`);
          } else if (q8Result.error) {
            console.warn("[CHAT GPR] Q8_K_XL fallback reported:", q8Result.error);
          }
        } catch (q8Err: any) {
          console.log("[CHAT GPR] Q8_K_XL endpoint error:", q8Err?.message || q8Err);
        }
      }
    }

    if (!streamCompleted || fullText.trim().length === 0) {
      // Immediate resilient synthesis if all upstream engines are unreachable
      const fallbackText = generateResilientResponse(prompt, lastError?.message);
      fullText = fallbackText;
      res.write(`data: ${JSON.stringify({ type: "token", text: fallbackText, modelUsed: "CHAT GPR Knowledge Engine", isFallback: true })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "model_info", modelUsed: "CHAT GPR Knowledge Engine", isFallback: true })}\n\n`);
      streamCompleted = true;
    }

    // If visual explanation was requested, await and stream the ready visual
    if (visualPromise) {
      try {
        const visual = await visualPromise;
        if (visual) {
          res.write(`data: ${JSON.stringify({ type: "visual_explanation_ready", visual })}\n\n`);
        }
      } catch (visErr) {
        console.warn("[CHAT GPR] Visual explanation generation error:", visErr);
        res.write(`data: ${JSON.stringify({
          type: "visual_explanation_error",
          error: "Could not generate visual diagram for this question.",
        })}\n\n`);
      }
    }

    if (groundingSources.length > 0) {
      res.write(`data: ${JSON.stringify({ type: "grounding", sources: groundingSources })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: "done", fullText })}\n\n`);
  } catch (err: any) {
    console.error("[Chat Stream Error]", err);
    res.write(`data: ${JSON.stringify({
      type: "error",
      error: parseGeminiError(err),
    })}\n\n`);
  } finally {
    res.end();
  }
});

// 2. Dedicated Visual Explanation Generation & Regeneration Endpoint
app.post("/api/visual-explanation/generate", async (req, res) => {
  const { prompt, visualType, visualSubject, language = "km" } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: "Prompt is required" });
  }

  try {
    const visual = await generateVisualExplanation({
      prompt,
      visualType,
      visualSubject,
      language,
    });
    return res.json({ success: true, visual });
  } catch (err: any) {
    console.error("[Visual Explanation Endpoint Error]", err);
    return res.status(500).json({
      success: false,
      error: parseGeminiError(err),
    });
  }
});

// 2b. Dedicated 100% Photorealistic Image Generation Endpoint
app.post("/api/image/generate", async (req, res) => {
  const { prompt, aspectRatio = "16:9", resolution = "1K", webContext = "" } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: "Prompt is required" });
  }

  try {
    const result = await generatePhotorealisticImage({
      userPrompt: prompt,
      aspectRatio,
      resolution,
      webContext,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[Photorealistic Image Endpoint Error]", err);
    return res.status(500).json({
      success: false,
      error: parseGeminiError(err),
    });
  }
});

// 3. Automatic Conversation Title Generation Endpoint
app.post("/api/title", async (req, res) => {
  const { prompt = "", response = "" } = req.body;
  if (!prompt) {
    return res.json({ title: "New Conversation" });
  }

  const cleanPrompt = prompt.trim().slice(0, 30);

  try {
    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Create an ultra-short, engaging, clean title (2 to 5 words max) in the language of the prompt (Khmer or English) for this conversation:
User: "${prompt.slice(0, 150)}"
AI: "${response.slice(0, 150)}"
Rules:
- No quotation marks.
- No punctuation at the end.
- Strictly 2-5 words.`,
    });

    const title = result.text?.trim().replace(/^["']|["']$/g, "") || cleanPrompt;
    return res.json({ title: title.slice(0, 45) });
  } catch (err) {
    // Graceful fallback without crashing or throwing
    return res.json({ title: cleanPrompt || "Conversation" });
  }
});

// 5. Fallback AI Health Check Endpoint
app.post("/api/fallback/test", async (req, res) => {
  const { 
    endpointUrl = "https://hadadrjt-api.hf.space/v1", 
    modelName = "Q8_K_XL" 
  } = req.body;

  try {
    const result = await testQ8Health(endpointUrl, modelName);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.json({
      success: false,
      status: "ERROR",
      httpStatus: 0,
      contentType: "none",
      responseTimeMs: 0,
      model: modelName,
      endpoint: endpointUrl,
      message: "Health check encountered an unexpected error",
      error: err?.message || "Unknown error",
      isReady: false,
    });
  }
});

// Production and Development Server Setup
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CHAT GPR] Server running at http://localhost:${PORT}`);
  });
}

startServer();

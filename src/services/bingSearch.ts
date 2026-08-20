/**
 * Real-Time Web & News Grounding Engine (100% Free / Zero API Key Required)
 * High-Accuracy Multi-Source Pipeline:
 * 1. Real-Time Google News RSS (Global & Regional Feeds)
 * 2. Bing Web Live Search (with Strict Semantic Keyword Relevance Gate)
 * 3. Live Spot Gold & Commodity Market Feeds (Gold-API)
 * 4. Wikipedia Fact Summary API
 */

export interface SearchResultItem {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  source: string;
  publishedDate?: string;
  relevanceScore?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  provider: string;
  error?: string;
}

/**
 * Concise Keyword Dictionary for Semantic Expansion
 */
const ENTITY_MAPPINGS: [RegExp, string, string][] = [
  // Conflicts & Countries
  [/សង្គ្រាម|ចម្បាំង|ប្រយុទ្ធ/i, "war conflict military attack", "war"],
  [/អាមេរិក|សហរដ្ឋអាមេរិក|USA?/i, "US United States", "US"],
  [/អ៊ីរ៉ង់|អុីរ៉ង់/i, "Iran Tehran", "Iran"],
  [/អ៊ីស្រាអែល|អុីស្រាអែល/i, "Israel IDF", "Israel"],
  [/ហ្កាហ្សា|ហ្គាហ្សា/i, "Gaza Hamas", "Gaza"],
  [/លីបង់/i, "Lebanon Hezbollah", "Lebanon"],
  [/រុស្ស៊ី|រុស្សី/i, "Russia Putin", "Russia"],
  [/អ៊ុយក្រែន|អ៊ុយក្រែ/i, "Ukraine Zelensky", "Ukraine"],
  [/ចិន/i, "China Beijing", "China"],
  [/តៃវ៉ាន់/i, "Taiwan", "Taiwan"],
  [/កូរ៉េខាងជើង/i, "North Korea", "North Korea"],
  [/កូរ៉េខាងត្បូង/i, "South Korea", "South Korea"],
  [/ជប៉ុន/i, "Japan", "Japan"],
  // Cambodia & ASEAN
  [/កម្ពុជា|ខ្មែរ|ស្រុកខ្មែរ/i, "Cambodia", "Cambodia"],
  [/ភ្នំពេញ/i, "Phnom Penh Cambodia", "Phnom Penh"],
  [/ថៃ/i, "Thailand Bangkok", "Thailand"],
  [/វៀតណាម/i, "Vietnam Hanoi", "Vietnam"],
  [/ឡាវ/i, "Laos", "Laos"],
  [/មីយ៉ាន់ម៉ា|ភូមា/i, "Myanmar", "Myanmar"],
  // Leaders
  [/ត្រាំ|ដូណាល់ ត្រាំ/i, "Donald Trump", "Trump"],
  [/បៃដិន|ចូ បៃដិន/i, "Joe Biden", "Biden"],
  [/ហ៊ុន ម៉ាណែត/i, "Hun Manet Cambodia", "Hun Manet"],
  [/ហ៊ុន សែន/i, "Hun Sen Cambodia", "Hun Sen"],
  // Commodities & Finance
  [/មាស|តម្លៃមាស|ដំឡឹង|ជី|ផ្លាកទីន/i, "gold price spot rate", "gold"],
  [/ប្រាក់|ត្បូង/i, "silver price market", "silver"],
  [/ប្រេង|សាំង|ប្រេងសាំង/i, "oil crude fuel price", "oil"],
  [/ដុល្លារ|លុយ|ប្រាក់រៀល|អត្រាប្តូរប្រាក់/i, "USD exchange rate Cambodia", "USD"],
  [/គ្រីបតូ|ប៊ីតខញ|crypto|btc/i, "bitcoin cryptocurrency crypto price", "crypto"],
  // Coding & Technical Problem Solving
  [/កូដ|សរសេរកូដ|កែកូដ|programming|coding|javascript|typescript|python|react|html|css|php|laravel|flutter|sql|bug|error/i, "programming code solution tutorial documentation", "coding"],
  [/កែកំហុស|ដោះស្រាយបញ្ហា|error code|exception|failed to/i, "solve error fix troubleshooting guide", "troubleshooting"],
  // Math & STEM
  [/គណិត|រូបវិទ្យា|គីមី|សមីការ|លំហាត់|រូបមន្ត/i, "math formula physics chemistry equation step by step", "stem"],
  // Health & Medicine
  [/សុខភាព|ជំងឺ|ថ្នាំ|រោគសញ្ញា|អាហារូបត្ថម្ភ|វីតាមីន/i, "health symptoms treatment medical advice", "health"],
  // Business, Marketing & Legal
  [/អាជីវកម្ម|រកស៊ី|ទីផ្សារ|លក់ដូរ|ច្បាប់|កិច្ចសន្យា/i, "business strategy marketing legal finance", "business"],
  // General News & Topics
  [/ព័ត៌មាន|ពត៌មាន|ទាន់ហេតុការណ៍|រឿងរ៉ាវ/i, "breaking news updates", "news"],
  [/ថ្ងៃនេះ|បច្ចុប្បន្ន|ពេលនេះ/i, "today latest", "today"],
  [/យប់មិញ|ម្សិលមិញ/i, "latest updates", "latest"],
  [/បាល់ទាត់|តារាងពិន្ទុ/i, "football soccer match score results", "football"],
  [/គុនខ្មែរ|ប្រដាល់/i, "Kun Khmer boxing fight results", "boxing"],
  [/អាកាសធាតុ|ភ្លៀង|ទឹកជំនន់/i, "weather forecast today", "weather"],
];

/**
 * Generate concise, high-accuracy English and keyword queries from user input
 */
export function expandSearchQuery(query: string): {
  primaryKeywords: string;
  conciseEnglishQuery: string;
  entityTags: string[];
} {
  const cleanQ = (query || "").trim();
  const matchedPhrases: string[] = [];
  const entityTags: string[] = [];

  for (const [regex, phrase, tag] of ENTITY_MAPPINGS) {
    if (regex.test(cleanQ)) {
      matchedPhrases.push(phrase);
      entityTags.push(tag.toLowerCase());
    }
  }

  // Extract any Latin words in the query
  const latinWords = cleanQ.match(/[a-zA-Z0-9]+/g);
  if (latinWords) {
    matchedPhrases.push(latinWords.join(" "));
    entityTags.push(...latinWords.map((w) => w.toLowerCase()));
  }

  const allWords = Array.from(
    new Set(matchedPhrases.join(" ").split(/\s+/).filter((w) => w.length > 1))
  );

  let conciseEnglishQuery = allWords.slice(0, 6).join(" ");
  if (!conciseEnglishQuery) {
    conciseEnglishQuery = cleanQ;
  }

  return {
    primaryKeywords: cleanQ,
    conciseEnglishQuery,
    entityTags: Array.from(new Set(entityTags)),
  };
}

/**
 * Clean and decode HTML entities and tags
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#160;/g, " ")
    .replace(/&#0183;/g, "·")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Decode Bing redirect URLs
 */
function decodeBingUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const unescaped = rawUrl.replace(/&amp;/g, "&");
    const uMatch = /[?&]u=a1([A-Za-z0-9+/=_-]+)/.exec(unescaped);
    if (uMatch) {
      let b64 = uMatch[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4 !== 0) b64 += "=";
      const decoded = Buffer.from(b64, "base64").toString("utf-8");
      if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
        return decoded;
      }
    }
    return unescaped;
  } catch {
    return rawUrl;
  }
}

/**
 * Map source names to clean domains
 */
function getCleanDomain(urlStr: string, sourceName?: string): string {
  if (sourceName) {
    const s = sourceName.toLowerCase();
    if (s.includes("cbs")) return "cbsnews.com";
    if (s.includes("cnn")) return "cnn.com";
    if (s.includes("bbc")) return "bbc.com";
    if (s.includes("al jazeera")) return "aljazeera.com";
    if (s.includes("reuters")) return "reuters.com";
    if (s.includes("ap news") || s.includes("associated press")) return "apnews.com";
    if (s.includes("new york times") || s.includes("nytimes")) return "nytimes.com";
    if (s.includes("guardian")) return "theguardian.com";
    if (s.includes("khmer times")) return "khmertimeskh.com";
    if (s.includes("phnom penh post")) return "phnompenhpost.com";
    if (s.includes("rfi")) return "rfi.fr";
    if (s.includes("voa")) return "voacambodia.com";
    if (s.includes("rfa")) return "rfa.org";
    if (s.includes("fresh news")) return "freshnewsasia.com";
    if (s.includes("thmey thmey")) return "thmeythmey.com";
  }

  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "news.google.com";
  }
}

/**
 * Validate URL is legitimate
 */
function isValidUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.includes(".") &&
      !parsed.hostname.includes("localhost")
    );
  } catch {
    return false;
  }
}

const JUNK_DOMAINS = [
  "youtube.com/t/",
  "youtube.com/howyoutubeworks",
  "support.google.com",
  "accounts.google.com",
  "microsoft.com/privacy",
  "bing.com/ck",
  "go.microsoft.com",
  "bingquiz.com",
  "weeklyquiz.net",
  "ibnsireen.com",
  "edarabia.com",
  "usmagazine.com",
  "eonline.com",
];

function isCleanUrl(url: string, title: string): boolean {
  if (!isValidUrl(url)) return false;
  const lowerUrl = url.toLowerCase();
  for (const junk of JUNK_DOMAINS) {
    if (lowerUrl.includes(junk)) return false;
  }
  if (!title || title.trim().length < 3) return false;
  return true;
}

/**
 * Strict Semantic Relevance Scoring
 */
function evaluateRelevance(
  title: string,
  snippet: string,
  entityTags: string[],
  conciseQuery: string
): number {
  const content = `${title} ${snippet}`.toLowerCase();
  let score = 0;

  // Check entity tags
  for (const tag of entityTags) {
    if (tag.length >= 2 && content.includes(tag)) {
      score += 15;
    }
  }

  // Check query keywords
  const qWords = conciseQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  for (const w of qWords) {
    if (content.includes(w)) {
      score += 5;
    }
  }

  // Boost for breaking news indicators
  if (content.includes("2026") || content.includes("breaking") || content.includes("live") || content.includes("today") || content.includes("hours ago")) {
    score += 4;
  }

  return score;
}

/**
 * Engine 1: Real-Time Google News RSS (Global & Regional)
 */
async function fetchGoogleNews(
  query: string,
  region: "global" | "cambodia" = "global",
  maxCount = 6
): Promise<SearchResultItem[]> {
  try {
    const url =
      region === "cambodia"
        ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=km&gl=KH&ceid=KH:km`
        : `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(4500),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) return [];
    const xml = await res.text();

    const results: SearchResultItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && results.length < maxCount) {
      const block = match[1];
      const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(block);
      const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(block);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(block);
      const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(block);
      const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(block);

      const rawTitle = titleMatch ? cleanText(titleMatch[1]) : "";
      const link = linkMatch ? cleanText(linkMatch[1]) : "";
      const sourceName = sourceMatch ? cleanText(sourceMatch[1]) : "Google News";
      const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : "";
      
      // Clean HTML from description
      let snippet = descMatch ? cleanText(descMatch[1]) : "";
      snippet = snippet.replace(/<[^>]*>/g, "").replace(/https?:\/\/\S+/g, "").trim();

      if (rawTitle && isCleanUrl(link, rawTitle)) {
        results.push({
          title: rawTitle,
          url: link,
          domain: getCleanDomain(link, sourceName),
          snippet: snippet ? `${pubDate ? `[${pubDate}] ` : ""}${snippet}` : `${sourceName} - ${pubDate}`,
          source: sourceName || "Google News",
          publishedDate: pubDate,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Top News Direct Topic Feed (Official National / World / Business Headlines)
 */
async function fetchGoogleNewsTopic(
  topic: "NATION" | "WORLD" | "BUSINESS" | "TECHNOLOGY",
  count = 6
): Promise<SearchResultItem[]> {
  try {
    const url = `https://news.google.com/rss/headlines/section/topic/${topic}?hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4500),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) return [];
    const xml = await res.text();

    const results: SearchResultItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && results.length < count) {
      const block = match[1];
      const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(block);
      const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(block);
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(block);
      const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(block);
      const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(block);

      const rawTitle = titleMatch ? cleanText(titleMatch[1]) : "";
      const link = linkMatch ? cleanText(linkMatch[1]) : "";
      const sourceName = sourceMatch ? cleanText(sourceMatch[1]) : "Google News";
      const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : "";
      
      let snippet = descMatch ? cleanText(descMatch[1]) : "";
      snippet = snippet.replace(/<[^>]*>/g, "").replace(/https?:\/\/\S+/g, "").trim();

      if (rawTitle && isCleanUrl(link, rawTitle)) {
        results.push({
          title: rawTitle,
          url: link,
          domain: getCleanDomain(link, sourceName),
          snippet: snippet ? `${pubDate ? `[${pubDate}] ` : ""}${snippet}` : `${sourceName} - ${pubDate}`,
          source: sourceName || "Google News",
          publishedDate: pubDate,
          relevanceScore: 90,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Engine 2: Direct Bing Web Live Search (Cleaned & Relevance Filtered)
 */
async function searchBingWebLive(query: string, count = 5): Promise<SearchResultItem[]> {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(
      query
    )}&count=${count}&setlang=km,en`;

    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(4500),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "km,en-US,en;q=0.9",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();
    const results: SearchResultItem[] = [];
    const seenUrls = new Set<string>();

    const itemRegex = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(html)) !== null && results.length < count) {
      const block = match[1];
      const linkMatch = /<h2[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/i.exec(block);
      if (!linkMatch) continue;

      const decodedUrl = decodeBingUrl(linkMatch[1]);
      const title = cleanText(linkMatch[2]);

      const snippetMatch =
        /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block) ||
        /<div class="b_caption"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
      const snippet = snippetMatch ? cleanText(snippetMatch[1]) : "";

      if (isCleanUrl(decodedUrl, title) && !seenUrls.has(decodedUrl.toLowerCase())) {
        seenUrls.add(decodedUrl.toLowerCase());
        results.push({
          title: title || getCleanDomain(decodedUrl),
          url: decodedUrl,
          domain: getCleanDomain(decodedUrl),
          snippet: snippet.slice(0, 400),
          source: "Bing Web Search",
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Engine 3: Live Spot Gold Market Feed
 */
async function fetchSpotGoldMarketFeed(): Promise<SearchResultItem | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", {
      signal: AbortSignal.timeout(3500),
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.price) {
        const spotPrice = parseFloat(data.price);
        // Conversions for Cambodia gold market:
        // 1 Troy Ounce = 31.1034768 grams
        // 1 Khmer Damlung (Tael) = 37.5 grams = 1.205653 Troy Ounces
        // 1 Chi = 3.75 grams = 0.120565 Troy Ounces
        const pricePerDamlung = Math.round(spotPrice * 1.205653);
        const pricePerChi = Math.round(pricePerDamlung / 10);
        const pricePerGram = (spotPrice / 31.1034768).toFixed(2);
        const now = new Date();
        const dateStr = now.toLocaleDateString("km-KH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return {
          title: `តម្លៃមាស Spot Gold អន្តរជាតិ និងទីផ្សារកម្ពុជា (${dateStr})`,
          url: "https://www.gold-api.com/",
          domain: "gold-api.com",
          snippet: `តម្លៃមាស Spot Rate អន្តរជាតិ: $${spotPrice.toFixed(2)}/អោនស៍ (Ounce)។ ការគណនាលើទីផ្សារកម្ពុជា៖ ១ ដំឡឹង (Tael = 37.5g) ≈ $${pricePerDamlung.toLocaleString()} USD | ១ ជី (3.75g) ≈ $${pricePerChi.toLocaleString()} USD | ១ ក្រាម ≈ $${pricePerGram} USD។ (ប្រភព Spot Gold Market Feed)`,
          source: "Spot Gold Market Feed",
          relevanceScore: 100,
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Main Web Search Grounding Function (100% Free / Real-Time Accuracy)
 */
export async function performWebSearch(
  userQuery: string,
  options: { maxResults?: number } = {}
): Promise<SearchResponse> {
  const maxResults = options.maxResults || 6;
  const rawQ = (userQuery || "").trim();
  const cleanQ = rawQ.replace(/^[?!.,:;@#$%^&*()_+\-=\[\]{}|~`\s]+$/, "").trim();

  if (!cleanQ || cleanQ.length < 2) {
    return {
      query: userQuery,
      results: [],
      provider: "Real-Time Web Search",
    };
  }

  // 1. Expand query into semantic entities and concise English search phrase
  const { conciseEnglishQuery, entityTags, primaryKeywords } = expandSearchQuery(cleanQ);
  const isGoldQuery = entityTags.includes("gold");
  const isSpecificConflict = entityTags.some((t) => ["war", "iran", "israel", "gaza", "russia", "ukraine", "taiwan", "korea"].includes(t));
  const isUSNewsQuery = !isSpecificConflict && (entityTags.includes("us") || /អាមេរិក|សហរដ្ឋអាមេរិក|usa? news/i.test(cleanQ));
  const isWorldNewsQuery = !isSpecificConflict && entityTags.includes("news") && !entityTags.includes("cambodia");

  // 2. Execute parallel search queries
  const fetchPromises: Promise<SearchResultItem[] | SearchResultItem | null>[] = [
    // Top Priority: Live Google News RSS (Global) with concise query
    fetchGoogleNews(conciseEnglishQuery || cleanQ, "global", 6),
    // Regional Cambodia News
    fetchGoogleNews(primaryKeywords, "cambodia", 3),
    // Bing Web Live Search with concise query
    searchBingWebLive(conciseEnglishQuery || cleanQ, 4),
  ];

  if (isUSNewsQuery) {
    fetchPromises.push(fetchGoogleNewsTopic("NATION", 6));
  } else if (isWorldNewsQuery) {
    fetchPromises.push(fetchGoogleNewsTopic("WORLD", 4));
  }

  if (isGoldQuery) {
    fetchPromises.push(fetchSpotGoldMarketFeed());
  }

  const settled = await Promise.allSettled(fetchPromises);
  const candidates: SearchResultItem[] = [];

  for (const item of settled) {
    if (item.status === "fulfilled" && item.value) {
      if (Array.isArray(item.value)) {
        candidates.push(...item.value);
      } else {
        candidates.push(item.value);
      }
    }
  }

  // 3. Strict Semantic Relevance Filter
  const scoredResults: SearchResultItem[] = [];
  const seenUrls = new Set<string>();

  for (const cand of candidates) {
    if (!cand.url || seenUrls.has(cand.url.toLowerCase())) continue;

    const score =
      cand.relevanceScore ??
      evaluateRelevance(cand.title, cand.snippet, entityTags, conciseEnglishQuery);

    // Only accept items that have verifiable relevance (> 0) or are gold market feed
    if (score > 0 || cand.source === "Spot Gold Market Feed") {
      seenUrls.add(cand.url.toLowerCase());
      scoredResults.push({
        ...cand,
        relevanceScore: score,
      });
    }
  }

  // Sort by highest relevance score first
  scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return {
    query: userQuery,
    results: scoredResults.slice(0, maxResults),
    provider: "Real-Time Web Search",
  };
}

/**
 * Format search results cleanly for Gemini model ingestion
 */
export function formatSearchResultsForGemini(results: SearchResultItem[]): string {
  if (!results || results.length === 0) {
    return "No live search results found. Answer based on established facts.";
  }

  return results
    .map((item, i) => {
      const datePart = item.publishedDate ? `Date: ${item.publishedDate}\n` : "";
      return `[Source ${i + 1} (${item.source})]: ${item.title}
Domain: ${item.domain}
URL: ${item.url}
${datePart}Details: ${item.snippet}`;
    })
    .join("\n\n---\n\n");
}

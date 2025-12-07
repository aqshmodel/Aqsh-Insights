
import { GoogleGenAI } from "@google/genai";
import { ComprehensionLevel } from "../types";
import { globalLimiter } from "./concurrency";

// --- Helper: Comprehension Level Instruction ---
export const getLevelInstruction = (level: ComprehensionLevel): string => {
  switch (level) {
    case 'entry':
      return `【TARGET LEVEL: Lv.1 初学者向け (Entry / Public)】
- 専門用語の使用禁止。具体的で直接的な表現を多用し、誰でも直感的にわかる言葉を選ぶこと。
- 読者の知識レベルは「ゼロ」と想定せよ。前提知識の説明から丁寧に始めること。
- 親しみやすく、安心感を与えるトーンで記述すること。`;
    case 'general':
      return `【TARGET LEVEL: Lv.2 一般ビジネス層向け (General Business)】
- 一般的なビジネス用語（PDCA、KPIなど）は使用してよいが、過度に専門的な技術用語は避けること。
- 「何ができるか（Benefit）」に焦点を当て、標準的な丁寧語で記述すること。
- 読者は「日経新聞をなどのニュースを読む程度の知識」を持っていると想定せよ。`;
    case 'executive':
      return `【TARGET LEVEL: Lv.3 決裁者・経営層向け (Executive / Decision Maker)】
- 結論（Conclusion）と数字（ROI/Impact/Cost）を最優先すること。
- 詳細な技術仕様やプロセスよりも、「経営課題へのインパクト」「投資対効果」「リスク」を簡潔に語ること。
- 冗長な説明を省き、意思決定に必要な情報のみを凝縮せよ。`;
    case 'practitioner':
      return `【TARGET LEVEL: Lv.4 現場実務者向け (Practitioner / Manager)】
- 具体的な「手順」「ツール」「運用フロー」「体制」に焦点を当てること。
- 抽象論ではなく、「明日からどう使うか」という実務的な視点で書くこと。
- 現場特有の課題（工数、リソース、トラブル）への理解と、その解決策を具体的に記述せよ。`;
    case 'expert':
      return `【TARGET LEVEL: Lv.5 専門家・技術者向け (Expert / Specialist)】
- 正確な専門用語（Technical Jargon）を積極的に使用し、定義の説明は省略すること。
- アーキテクチャ、アルゴリズム、理論的背景、法的根拠など、深い専門的詳細に踏み込むこと。
- 読者は該当分野の高度な知識を持っていると想定し、浅い解説は「釈迦に説法」となるため避けること。`;
    default:
      return "";
  }
};

// --- Helper: Robust JSON Parser ---
export const cleanAndParseJson = (text: string | undefined, contextStr: string): any => {
    if (!text) throw new Error(`Empty response text in ${contextStr}`);
    try {
      let cleanText = text;

      // 1. Remove Markdown code blocks (json, js, css, etc.)
      const codeBlockRegex = /```(?:json|js|css|html)?\s*([\s\S]*?)\s*```/i;
      const match = text.match(codeBlockRegex);
      if (match) {
        cleanText = match[1];
      }

      // 2. Find the first '{' or '[' and the last '}' or ']'
      const firstCurly = cleanText.indexOf('{');
      const firstSquare = cleanText.indexOf('[');
      
      let startIndex = -1;
      let endIndex = -1;

      // Determine if object or array starts first
      if (firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)) {
        startIndex = firstCurly;
        // Find matching last curly
        endIndex = cleanText.lastIndexOf('}');
      } else if (firstSquare !== -1) {
        startIndex = firstSquare;
        // Find matching last square
        endIndex = cleanText.lastIndexOf(']');
      }

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanText = cleanText.substring(startIndex, endIndex + 1);
      }

      // 3. Remove potential trailing commas
      cleanText = cleanText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      return JSON.parse(cleanText);
    } catch (e) {
      console.warn(`JSON Parse Error in ${contextStr}:`, e);
      // Throwing error here allows the retry logic to catch it and retry the API call
      throw new Error(`Failed to parse JSON in ${contextStr}: ${(e as Error).message}`); 
    }
  };

interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    timeoutMs?: number;
    validator?: (text: string) => boolean | Promise<boolean>;
}

// --- Helper: API Retry Logic with Timeout & Validation & Throttling ---
export const generateContentWithRetry = async (
  ai: GoogleGenAI,
  params: any,
  context: string,
  options: RetryOptions = {}
) => {
  // Increased robustness: 5 retries, 10s base delay for Rate Limits
  const { maxRetries = 5, baseDelay = 10000, timeoutMs = 90000, validator } = options;

  // Reverted to single globalLimiter for stability
  const limiter = globalLimiter;

  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      // Wrap the API call with the appropriate Rate Limiter
      const apiCall = limiter.schedule(() => ai.models.generateContent(params));

      // Race against the API call
      const result: any = await Promise.race([
        apiCall,
        timeoutPromise
      ]);
      
      // 1. Basic Validation: Check if text exists
      if (!result.text) {
        throw new Error("Empty response text from API");
      }

      // 2. Custom Validator (e.g., checks JSON structure)
      if (validator) {
          const isValid = await validator(result.text);
          if (!isValid) {
              throw new Error("Response failed custom validation check");
          }
      }
      
      return result;

    } catch (e: any) {
      lastError = e;
      const errorMessage = e.message || e.toString();
      
      console.warn(`[${context}] Attempt ${i + 1} failed:`, errorMessage);

      // CRITICAL: Do NOT retry on 400 Bad Request (Invalid Argument)
      // This usually means the prompt or schema is invalid, and retrying won't fix it.
      if (errorMessage.includes('400') || e.status === 400) {
          throw new Error(`Fatal API Error (400) in ${context}: ${errorMessage}`);
      }
      
      const isRateLimit = errorMessage.includes('429') || e.status === 429;
      const isServiceUnavailable = errorMessage.includes('503') || e.status === 503;
      
      // Exponential backoff
      // If it's a 429, wait significantly longer
      const extraWait = (isRateLimit || isServiceUnavailable) ? 5000 : 0;
      const delay = (baseDelay * Math.pow(2, i)) + extraWait;
      
      console.log(`[${context}] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed after ${maxRetries} retries in ${context}. Last error: ${lastError?.message || lastError}`);
};

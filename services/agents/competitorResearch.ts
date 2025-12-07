
import { GoogleGenAI } from "@google/genai";
import { ProductInput, CompetitorData } from "../../types";
import { generateContentWithRetry } from "../utils";

export const executeCompetitorResearch = async (
  ai: GoogleGenAI,
  model: string,
  input: ProductInput,
  onUsage?: (meta: any) => void
): Promise<CompetitorData> => {
  
  const prompt = {
    role: "市場リサーチャー (Market Researcher)",
    task: "ユーザーの製品アイデアに対する「実在する競合製品」や「代替ソリューション」をWeb検索して特定し、比較情報をまとめよ。",
    inputContext: {
        productName: input.name,
        productDescription: input.description,
        price: input.price,
        target: input.targetHypothesis
    },
    instructions: [
        "Google検索を使用して、このアイデアに類似する既存の製品、サービス、または代替手段を探せ。",
        "もし直接的な競合が見つからない場合は、顧客が現在どのように課題を解決しているか（代替品）を探せ。",
        "見つかった競合について、以下の情報を簡潔にまとめよ：製品名、価格帯（分かれば）、主な特徴。",
        "ユーザーの製品と比較して、競合の優れている点や劣っている点があれば言及せよ。",
        "競合が全く見つからない場合は「直接的な競合は見当たりませんでした」と報告せよ。",
        "出力は箇条書きや短い段落を用い、ペルソナが判断材料として読みやすいテキスト形式にすること。"
    ]
  };

  // Note: responseSchema is NOT allowed when using googleSearch tool.
  // We expect a text response.

  const res = await generateContentWithRetry(
    ai,
    {
      model,
      contents: JSON.stringify(prompt),
      config: { 
          tools: [{ googleSearch: {} }] // Enable Google Search Grounding
      }
    },
    "CompetitorResearcher",
    { 
        timeoutMs: 60000, // Search might take longer
        validator: (text) => text.length > 10 // Basic validation
    }
  );

  if (onUsage && res.usageMetadata) {
      onUsage(res.usageMetadata);
  }

  // Extract grounding metadata (sources)
  const sources: { title: string; uri: string }[] = [];
  
  // Safety check for groundingChunks structure in GenAI SDK response
  // It resides in candidates[0].groundingMetadata.groundingChunks
  const candidate = res.candidates?.[0];
  if (candidate?.groundingMetadata?.groundingChunks) {
      candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web) {
              sources.push({
                  title: chunk.web.title || "Web Source",
                  uri: chunk.web.uri
              });
          }
      });
  }

  return {
      summary: res.text || "競合情報の取得に失敗しました。",
      sources: sources
  };
};

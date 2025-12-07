
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProductInput, PersonaProfile, AnalysisReport, CompetitorData, ConsumerResult } from "../../types";
import { cleanAndParseJson, generateContentWithRetry } from "../utils";
import { SalesPitch } from "./sales";

const REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    markdown: { type: Type.STRING, description: "CPF/PSF/PMFのフレームワークに基づいた詳細な分析レポート全文 (Markdown)" },
    topRejectionReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
    killerPhrases: { type: Type.ARRAY, items: { type: Type.STRING }, description: "刺さったキーワード" },
    positioningMap: {
        type: Type.OBJECT,
        description: "競合と自社製品の立ち位置を示すポジショニングマップデータ",
        properties: {
            axisX: { type: Type.STRING, description: "X軸のラベル (例: '低価格 -> 高価格')" },
            axisY: { type: Type.STRING, description: "Y軸のラベル (例: '汎用 -> 特化')" },
            points: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "製品名または企業名" },
                        x: { type: Type.NUMBER, description: "X座標 (-10〜10)" },
                        y: { type: Type.NUMBER, description: "Y座標 (-10〜10)" },
                        isOurs: { type: Type.BOOLEAN, description: "自社製品かどうか" },
                        description: { type: Type.STRING, description: "短い説明" }
                    },
                    required: ["name", "x", "y", "isOurs"]
                }
            }
        },
        required: ["axisX", "axisY", "points"]
    }
  },
  required: ["markdown", "topRejectionReasons", "killerPhrases", "positioningMap"]
};

export const executeAnalysis = async (
  ai: GoogleGenAI,
  model: string,
  product: ProductInput,
  personas: PersonaProfile[],
  results: ConsumerResult[],
  pitch: SalesPitch,
  competitorData: CompetitorData | undefined, // Added arg
  onUsage?: (meta: any) => void
): Promise<AnalysisReport> => {
  
  const buyCount = results.filter(r => r.finalDecision === 'buy').length;
  const acceptanceRate = Math.round((buyCount / results.length) * 100);
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  // Structure the data instead of string formatting
  const structuredResults = results.map(r => {
      const p = personas.find(p => p.id === r.personaId);
      return {
          personaId: r.personaId,
          personaProfile: {
             name: p?.name,
             age: p?.age,
             gender: p?.gender,
             occupation: p?.occupation,
             traits: p?.traits,
             values: p?.values
          },
          outcome: {
             decision: r.finalDecision,
             reason: r.decisionReason,
             willingnessToPay: r.willingnessToPay, // Include WTP
             detailedScore: r.detailedScore, // Include Scores
             keyInsight: r.keyInsight,
             attributeReasoning: r.attributeReasoning
          },
          reverseQuestion: r.reverseQuestion,
          interactionHistory: r.qaHistory,
          review: r.review ? {
             rating: r.review.rating,
             title: r.review.title,
             body: r.review.body,
             nps: r.review.nps
          } : null
      };
  });

  // Calculate Average WTP
  const avgWTP = Math.round(results.reduce((sum, r) => sum + (r.willingnessToPay || 0), 0) / results.length);

  // Strip image from product context to avoid token limit errors
  const { productImage, imageMimeType, ...safeProduct } = product;

  const prompt = {
    role: "シニアマーケットアナリスト (Senior Market Analyst)",
    task: "シミュレーション結果を集計し、CPF/PSF/PMFの3つのフィット検証フレームワークに基づいた包括的な分析レポートを作成せよ。特に「なぜフィットしなかったのか」のギャップ分析と競合ポジショニングに注力すること。",
    inputContext: {
        product: safeProduct, // Use safe context without base64 image
        pitch: pitch,
        competitorInfo: competitorData ? competitorData.summary : "（競合情報なし）",
        simulationResults: structuredResults,
        averageWillingnessToPay: avgWTP,
        reportDate: today
    },
    instructions: [
        `レポートの発行日は必ず「${today}」と明記すること。`,
        "レポートはMarkdown形式で出力し、以下の章構成を必ず守ること。見出しは全て日本語のみとすること。",
        
        "1. **エグゼクティブサマリー**: 結果の概要に加え、現在の企画が「顧客課題の検証」「解決策の検証」「市場適合性」のどのステージにあるか、あるいはどこで躓いているかを診断せよ。",
        
        "2. **価格受容性分析**: 各ペルソナの「支払意向額」と提示価格のギャップを分析せよ。",
        "   - **【必須】必ず以下のカラムを持つMarkdown表形式（Table）でデータを出力すること**:",
        "     | ペルソナ属性 | 支払意向額 | ギャップ | 考察 |",
        "   - 考察では、Under-priced / Ideal / Over-priced などの判定を日本語で行うこと。",
        
        "3. **競合との比較・ポジショニング分析**: 収集された競合情報に基づき、この商品の立ち位置や優位性、あるいは埋没するリスクについて分析する。",
        
        "4. **属性別反応分析**: 各ペルソナの「属性要因(Why)」に基づき、なぜ特定の属性（年収、性格、環境意識など）を持つ層が反応したのか、あるいは拒絶したのかの傾向を深く分析する。",
        
        "5. **開発者への問いかけと仮説**: ペルソナから寄せられた「逆質問」や「もしXXだったら」という仮定の話をまとめ、開発者が見落としている視点や潜在的なニーズを提示する。",
        
        "6. **ペルソナの声と評価**: 肯定的なレビューの代表例と、否定的なフィードバック（見送り理由）の代表例を抜粋・要約し、ユーザーの生の声として紹介する。",
        
        "7. **ギャップの分析と改善戦略**: シミュレーション結果から判明した課題を、以下の3つの観点で整理し、具体的な軌道修正案を提示せよ。ただしわかりやすくするため、CPFやPSF、PMFという文言は使用禁止。",
        "   - **CPF Gap (顧客・課題)**: ターゲット選定は正しいか？ 課題は深刻か？（ターゲット変更の必要性）",
        "   - **PSF Gap (解決策)**: 機能やUXは課題を解決できているか？（機能追加・削除の必要性）",
        "   - **PMF Gap (市場・価格)**: 価格設定やビジネスモデルは適正か？（プライシング・販路の見直し）",
        
        "8. **実装ロードマップ**: 提案された改善戦略を実行し、次のフィットステージに進むための具体的なステップ。",
        
        "【重要: ポジショニングマップ生成】",
        "競合情報(competitorInfo)と自社製品を比較し、市場を最もよく表す「2つの軸（X軸・Y軸）」を定義せよ（例: 低価格 vs 高価格、汎用 vs 特化）。",
        "その軸上に、自社製品と主要な競合（3〜5社程度）を配置するための座標データ(x, y)を作成せよ。座標は -10 から 10 の範囲で設定すること。"
    ]
  };

  const res = await generateContentWithRetry(
    ai,
    {
      model,
      contents: JSON.stringify(prompt),
      config: { responseMimeType: "application/json", responseSchema: REPORT_SCHEMA }
    },
    "AnalystAgent",
    { validator: (text) => !!cleanAndParseJson(text, "AnalystValidator").markdown }
  );

  if (onUsage && res.usageMetadata) {
      onUsage(res.usageMetadata);
  }

  const data = cleanAndParseJson(res.text, "Analyst");

  return {
      markdown: data.markdown,
      acceptanceRate,
      topRejectionReasons: data.topRejectionReasons,
      killerPhrases: data.killerPhrases,
      personaBreakdown: results.map(r => ({ id: r.personaId, decision: r.finalDecision })),
      positioningMap: data.positioningMap // Include generated map data
  };
};

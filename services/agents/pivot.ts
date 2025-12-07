
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProductInput, PersonaProfile, ConsumerResult, CompetitorData, ImprovementPlan, SalesPitchData } from "../../types";
import { cleanAndParseJson, generateContentWithRetry } from "../utils";

const PIVOT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "CPF/PSF/PMF検証に基づき再定義された、勝てる新規プロダクト・サービス名" },
    catchCopy: { type: Type.STRING, description: "ターゲットの課題（Pain）と解決策（Solution）のフィットを一言で表すキャッチコピー" },
    executiveSummary: { type: Type.STRING, description: "1. エグゼクティブサマリー：CPF（顧客と課題）、PSF（解決策）、PMF（市場適合）の3つの観点から、なぜこの事業が成功するかを要約。" },
    problemSolution: { type: Type.STRING, description: "2. 本サービスが解決する課題 (CPF & PSF検証)：\n- CPF: 具体的に「誰の(Customer)」「どんな深刻な課題(Problem)」なのか？（Nice to haveではなくMust haveな課題か）\n- PSF: なぜ既存の代替品ではダメで、この解決策(Solution)ならフィットするのか？" },
    serviceAndPricing: { type: Type.STRING, description: "3. 提供サービスと料金プラン：PMFを達成するための具体的な機能セットと、WTP(支払意向額)に基づくプライシング戦略。" },
    dynamicSections: {
      type: Type.ARRAY,
      description: "4 & 5. PMF達成のための戦略的ピボット：\n市場調査データから、PMF（Product-Market Fit）を達成するために不可欠な要素や、埋めるべきギャップ（Gap）を2〜3個のセクションとして記述せよ。\n（例：「PMFに向けた機能ピボット」「CPFを深めるターゲット再定義」「スケーラビリティの検証」など）",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "セクションタイトル（例：PMF達成へのロードマップ）" },
          content: { type: Type.STRING, description: "検証結果と具体的な戦略内容" }
        },
        required: ["title", "content"]
      }
    },
    simulation: { type: Type.STRING, description: "6. 導入シミュレーション：PMF達成後の世界観。ターゲット顧客がどのように課題を解決し、LTV（生涯顧客価値）が高まるかを描く。" },
    conclusion: { type: Type.STRING, description: "7. 結論：3つのフィット（CPF, PSF, PMF）が証明された事業として、投資すべき理由。" }
  },
  required: ["title", "catchCopy", "executiveSummary", "problemSolution", "serviceAndPricing", "dynamicSections", "simulation", "conclusion"]
};

export const executePivotPlanning = async (
  ai: GoogleGenAI,
  model: string,
  product: ProductInput,
  personas: PersonaProfile[],
  results: ConsumerResult[],
  pitch: SalesPitchData,
  competitorData: CompetitorData | undefined,
  onUsage?: (meta: any) => void
): Promise<ImprovementPlan> => {

  // 1. Data Preparation
  // Extract critical feedback from results
  const feedbackData = results.map(r => {
      const p = personas.find(per => per.id === r.personaId);
      return `
【調査対象者: ${p?.name} (${p?.age}歳, ${p?.occupation})】
- 判定: ${r.finalDecision.toUpperCase()}
- 適正価格感(WTP): ¥${r.willingnessToPay.toLocaleString()}
- 決断理由: ${r.decisionReason}
- 購入条件: ${r.targetPriceCondition || 'なし'}
- インサイト: ${r.keyInsight}
      `;
  }).join("\n");

  const prompt = {
    role: "リーンスタートアップ・ストラテジスト (Lean Startup Strategist)",
    task: "実施された市場調査（N=ユーザーインタビュー）の結果を分析し、3つのフィット検証（CPF, PSF, PMF）に基づいた『新規事業企画書』を作成せよ。",
    inputContext: {
        marketResearchData: feedbackData, // Rename context to be strictly research data
        originalIdeaContext: { // Treat original input just as a starting point context
            name: product.name,
            description: product.description,
            price: product.price,
            target: product.targetHypothesis
        },
        competitorInfo: competitorData ? competitorData.summary : "なし"
    },
    instructions: [
        "【最重要コンセプト: フィット検証】",
        "本企画書は、以下の3つのフレームワークを用いて論理的に構成し、事業の確実性を証明すること。",
        "1. **CPF (Customer-Problem Fit)**: 顧客定義と課題の深刻さを検証。「本当にその課題にお金を払うほど困っているか？（Nice to have ではなく Must have か）」",
        "2. **PSF (Problem-Solution Fit)**: 解決策の適切性を検証。「提案するソリューションで本当に課題が解決するか？ 過剰機能や不足はないか？」",
        "3. **PMF (Product-Market Fit)**: 市場適合性を検証。「適正な価格設定で、持続的に売れ続けるビジネスモデルか？」",
        "",
        "【執筆方針】",
        "・文中の根拠は全て『市場調査（シミュレーション）の結果』を用い、各フィットが達成できているか、あるいは達成するためにどうピボット（軌道修正）したかを記述すること。",
        "・単なる機能羅列ではなく、「なぜその機能がPSFに必要なのか」「なぜその価格がPMFに適しているのか」という文脈で書くこと。ただしPMFやCPFといった言葉は絶対に使わないこと。",
        "・Pass（不採用）判定を出した顧客の意見は、「CPF/PSFのズレ」として扱い、それを解消するためのピボット案（ターゲット変更や機能変更）を提案に盛り込むこと。",
        "",
        "【企画書の構成（骨子）】",
        "1. エグゼクティブサマリー (3つのフィットの要約)",
        "2. 本サービスが解決する課題 (CPF & PSF検証)",
        "3. 提供サービスと料金プラン (PMF戦略)",
        "4. (市場調査から導き出したPMF達成のための重要項目)",
        "5. (市場調査から導き出したPMF達成のための重要項目)",
        "6. 導入シミュレーション",
        "7. 結論",
        "",
        "【注意事項】",
        "・『前回の提案では』『修正案として』といった過去の経緯を感じさせる文言は禁止。あくまで『検証結果に基づいた最適解』として新規に記述すること。",
        "・自信に満ちた、論理的かつ説得力のあるビジネス文書として仕上げること。"
    ]
  };

  const res = await generateContentWithRetry(
    ai,
    {
      model, // Should be Pro model for deep reasoning
      contents: JSON.stringify(prompt),
      config: { responseMimeType: "application/json", responseSchema: PIVOT_SCHEMA }
    },
    "PivotPlanner",
    { validator: (text) => !!cleanAndParseJson(text, "PivotValidator").title }
  );

  if (onUsage && res.usageMetadata) {
      onUsage(res.usageMetadata);
  }

  return cleanAndParseJson(res.text, "Pivot");
};

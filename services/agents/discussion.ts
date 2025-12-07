
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PersonaProfile } from "../../types";
import { cleanAndParseJson, generateContentWithRetry } from "../utils";

export interface DiscussionSummary {
    summary: string;
    dominantOpinion: string;
    keyPhrases: string[];
    discussionContext: string;
}

const DISCUSSION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "議論全体の要約（誰がどんな意見を持っていたか）" },
    dominantOpinion: { type: Type.STRING, description: "支配的な意見や空気感（例：価格への懸念が広がっている）" },
    keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING }, description: "参加者の発言の中で特に影響力のあったフレーズ" },
    discussionContext: { type: Type.STRING, description: "各ペルソナの最終判断に影響を与えるための「会議のまとめ」テキスト" }
  },
  required: ["summary", "dominantOpinion", "keyPhrases", "discussionContext"]
};

export const executeGroupDiscussion = async (
  ai: GoogleGenAI,
  model: string,
  reactions: { persona: PersonaProfile, innerVoice: string, interestLevel: number, question?: string }[],
  onUsage?: (meta: any) => void
): Promise<DiscussionSummary> => {
  
  // Construct inputs for the moderator
  const participantsInput = reactions.map(r => `
【参加者: ${r.persona.name} (${r.persona.age}歳 / ${r.persona.occupation})】
- 性格: ${r.persona.traits.join(", ")}
- 初期反応(心の声): "${r.innerVoice}"
- 興味度: ${r.interestLevel}%
- 質問/懸念: ${r.question || "特になし"}
`).join("\n");

  const prompt = {
    role: "会議ファシリテーター (Discussion Moderator)",
    task: "新商品に関するグループインタビューの司会進行役として、参加者全員の初期反応を分析し、議論の空気感（Buzz）を要約せよ。",
    inputContext: {
        participantsData: participantsInput
    },
    instructions: [
        "参加者全員の「心の声」と「興味度」を俯瞰し、この商品が市場でどのように受け止められそうか、グループダイナミクスを分析すること。",
        "肯定的な意見が優勢か、否定的な意見が優勢か、あるいは意見が二極化しているかを見極めること。",
        "「誰かの意見に他の人が流されそうか（バンドワゴン効果）」も考慮し、議論の結論となるテキスト（discussionContext）を作成すること。",
        "discussionContextは、この後各ペルソナが最終判断を下す際の「判断材料（他者の口コミ）」として使用される。"
    ]
  };

  const res = await generateContentWithRetry(
    ai,
    {
      model,
      contents: JSON.stringify(prompt),
      config: { responseMimeType: "application/json", responseSchema: DISCUSSION_SCHEMA }
    },
    "DiscussionAgent",
    { validator: (text) => !!cleanAndParseJson(text, "DiscussionValidator").discussionContext }
  );

  if (onUsage && res.usageMetadata) {
      onUsage(res.usageMetadata);
  }

  return cleanAndParseJson(res.text, "Discussion");
};


import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProductInput, PersonaProfile } from "../../types";
import { cleanAndParseJson, generateContentWithRetry } from "../utils";

const CASTING_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    personas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          age: { type: Type.INTEGER },
          gender: { type: Type.STRING },
          occupation: { type: Type.STRING },
          incomeLevel: { type: Type.STRING },
          familyStructure: { type: Type.STRING, description: "例: 既婚（子なし）、独身（一人暮らし）、既婚（子2人）など" },
          techLiteracy: { type: Type.STRING, description: "例: 高い、標準、低い、苦手など" },
          infoSources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "情報収集源 (例: Instagram, 日経電子版, 友人)" },
          hobbies: { type: Type.ARRAY, items: { type: Type.STRING } },
          traits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "性格特性 (例: 慎重派、流行に敏感)" },
          currentPainPoints: { type: Type.STRING, description: "この商品カテゴリに関連する現在の悩み" },
          values: { type: Type.STRING, description: "購買行動における価値観（例：価格重視、ブランド重視）" }
        },
        required: ["name", "age", "gender", "occupation", "incomeLevel", "familyStructure", "techLiteracy", "infoSources", "hobbies", "traits", "currentPainPoints", "values"]
      }
    }
  },
  required: ["personas"]
};

export const executeCasting = async (
  ai: GoogleGenAI,
  model: string,
  input: ProductInput,
  onUsage?: (meta: any) => void
): Promise<PersonaProfile[]> => {
  const initialInterest = input.initialInterest ?? 50;
  
  // Define stance based on interest level
  let stanceInstruction = "";
  if (initialInterest < 30) {
      stanceInstruction = "【重要】今回のシミュレーションは「非常に厳しい・批判的」な視点で行います。現状に満足している、新しいものに懐疑的、財布の紐が固いなど、購入ハードルが高い「慎重派・保守派」のペルソナを中心に選出してください。";
  } else if (initialInterest > 70) {
      stanceInstruction = "【重要】今回のシミュレーションは「好意的・ファン」な視点で行います。課題感が強い、新しいもの好き、投資を惜しまないなど、購入意欲が高い「イノベーター・アーリーアダプター」層のペルソナを中心に選出してください。";
  } else {
      stanceInstruction = "【重要】甘い評価は不要です。肯定派だけでなく、否定派、懐疑派、無関心層をバランスよくミックスし、多様でシビアな市場環境を再現してください。";
  }

  // Handle custom user prompt
  let customPromptInstruction = "";
  if (input.customPersonaPrompt && input.customPersonaPrompt.trim() !== "") {
      customPromptInstruction = `【最重要】ユーザーから以下のペルソナ指定がありました。生成するペルソナの少なくとも半数はこの条件を強く反映してください。\n「${input.customPersonaPrompt}」`;
  }

  const prompt = {
    role: "キャスティングディレクター (Casting Director)",
    task: "市場調査シミュレーションを行うために、多様かつリアリティのある見込み顧客（ペルソナ）を選出せよ。",
    inputContext: {
        productName: input.name,
        productDescription: input.description,
        targetHypothesis: input.targetHypothesis,
        price: input.price,
        requiredCount: input.personaCount
    },
    instructions: [
        customPromptInstruction,
        stanceInstruction,
        "AI的なステレオタイプ（全員が論理的で協力的）を排除すること。気難しい人、直感で動く人、偏見を持つ人、予算に余裕がない人など、人間味のある「ノイズ」を含めること。",
        "添付された画像がある場合は、そのデザインや雰囲気（高級感、ポップ、シンプルなど）に惹かれそうな層、または逆に違和感を持ちそうな層も考慮すること。",
        "年齢、性別、職業、年収、家族構成をバラけさせ、リアリティのある生活背景を設定すること。",
        "名前は日本人のフルネーム（漢字）にすること。"
    ]
  };

  // Prepare content parts (Text + Optional Image)
  const parts: any[] = [];
  
  if (input.productImage && input.imageMimeType) {
      parts.push({
          inlineData: {
              data: input.productImage,
              mimeType: input.imageMimeType
          }
      });
  }
  
  parts.push({ text: JSON.stringify(prompt) });

  const res = await generateContentWithRetry(
    ai,
    {
      model,
      contents: { parts },
      config: { responseMimeType: "application/json", responseSchema: CASTING_SCHEMA }
    },
    "CastingAgent",
    {
        validator: (text) => {
            const data = cleanAndParseJson(text, "CastingValidator");
            return Array.isArray(data.personas) && data.personas.length > 0;
        }
    }
  );

  if (onUsage && res.usageMetadata) {
      onUsage(res.usageMetadata);
  }

  const data = cleanAndParseJson(res.text, "Casting");
  
  // Assign IDs and colors
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
  
  return data.personas.map((p: any, i: number) => ({
    id: `persona_${i}`,
    ...p,
    avatarColor: colors[i % colors.length]
  }));
};

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProductInput } from "../../types";
import { cleanAndParseJson, generateContentWithRetry } from "../utils";

export interface SalesPitch {
    catchCopy: string;
    description: string;
    keyBenefits: string[];
}

const SALES_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    catchCopy: { type: Type.STRING },
    description: { type: Type.STRING, description: "商品の魅力を伝える150文字程度のセールスピッチ" },
    keyBenefits: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["catchCopy", "description", "keyBenefits"]
};

export const executeSalesPitch = async (
  ai: GoogleGenAI,
  model: string,
  input: ProductInput,
  onUsage?: (meta: any) => void
): Promise<SalesPitch> => {
  const prompt = {
    role: "トップセールスパーソン (Top Salesperson)",
    task: "企画・商品を顧客に提案するための魅力的なピッチを作成せよ。",
    inputContext: {
        productName: input.name,
        description: input.description,
        target: input.targetHypothesis,
        price: input.price
    },
    instructions: [
        "添付された画像がある場合は、その視覚的特徴（色、形、パッケージ、UIデザインなど）についても魅力として言及すること。",
        "顧客の心を掴む短いキャッチコピーを作ること。",
        "機能の説明だけでなく、ベネフィット（得られる未来）を強調すること。",
        "簡潔かつエモーショナルに伝えること。"
    ]
  };

  // Prepare content parts
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
      config: { responseMimeType: "application/json", responseSchema: SALES_SCHEMA }
    },
    "SalesAgent",
    {
        validator: (text) => {
            const data = cleanAndParseJson(text, "SalesValidator");
            return !!data.catchCopy && !!data.description;
        }
    }
  );

  if (onUsage && res.usageMetadata) {
      onUsage(res.usageMetadata);
  }

  return cleanAndParseJson(res.text, "Sales");
};
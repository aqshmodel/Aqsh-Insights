
import { TokenUsage } from "../types";

// Pricing constants (JPY per 1 token)
// Exchange rate assumption: $1 = 150 JPY

// Gemini 2.5 Flash
// Input: $0.30 / 1M tokens -> 45 JPY / 1M -> 0.000045 JPY/token
// Output: $2.50 / 1M tokens -> 375 JPY / 1M -> 0.000375 JPY/token
const RATE_FLASH = {
    input: 0.000045,
    output: 0.000375
};

// Gemini 3 Pro Preview
// Input: $2.00 / 1M tokens -> 300 JPY / 1M -> 0.0003 JPY/token
// Output: $12.00 / 1M tokens -> 1800 JPY / 1M -> 0.0018 JPY/token
const RATE_PRO = {
    input: 0.0003,
    output: 0.0018
};

export const calculateCost = (usage: TokenUsage): number => {
    // Calculate Pro Cost
    const proCost = (usage.proInputTokens * RATE_PRO.input) + (usage.proOutputTokens * RATE_PRO.output);
    
    // Calculate Flash Cost
    const flashCost = (usage.flashInputTokens * RATE_FLASH.input) + (usage.flashOutputTokens * RATE_FLASH.output);

    return Math.round((proCost + flashCost) * 100) / 100; // Round to 2 decimals
};

export const formatCost = (cost: number): string => {
    return `¥${cost.toFixed(2)}`;
};

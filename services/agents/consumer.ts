

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProductInput, PersonaProfile, ConsumerState, ReviewData, SimulationLog, InteractionItem, CompetitorData, DetailedScore, ConsumerResult } from "../../types";
import { cleanAndParseJson, generateContentWithRetry } from "../utils";
import { geminiQueue } from "../concurrency";
import { SalesPitch } from "./sales";
import { executeGroupDiscussion } from "./discussion";

// --- Schemas ---
const REACTION_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        innerVoice: { type: Type.STRING, description: "心の声（タメ口で、本音をつぶやく）" },
        interestLevel: { type: Type.INTEGER, description: "興味関心度 (0-100)" },
        question: { type: Type.STRING, description: "質問がある場合はその内容。ない場合はnull" }
    },
    required: ["innerVoice", "interestLevel"]
};

const ANSWER_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        answer: { type: Type.STRING }
    },
    required: ["answer"]
};

const DECISION_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        innerVoice: { type: Type.STRING, description: "最終決断に至る直前の心の声" },
        decision: { type: Type.STRING, enum: ["buy", "pass"] },
        reason: { type: Type.STRING, description: "その決断に至った決定的な理由" },
        willingnessToPay: { type: Type.INTEGER, description: "提示価格に関わらず、この商品に自分が支払っても良いと考える最大金額（日本円）。購入する場合は提示額以上になることが多く、見送る場合は0円〜提示額未満になることが多い。正直な金銭感覚で査定せよ。" },
        targetPriceCondition: { type: Type.STRING, description: "もしwillingnessToPayが提示価格より低い場合、「具体的に何があれば（機能、保証、デザイン等）提示価格を出してもいいと思えるか」を記述せよ。提示価格以上ならnullでよい。" },
        // NEW: Detailed Scores
        score_appeal: { type: Type.INTEGER, description: "直感魅力度 (1-5): パッと見で「欲しい」「良さそう」と思ったか？" },
        score_novelty: { type: Type.INTEGER, description: "新規性・独自性 (1-5): 既存のものと違うと感じたか？「よくあるやつ」ではないか？" },
        score_clarity: { type: Type.INTEGER, description: "理解度・明快さ (1-5): コンセプトは分かりやすかったか？" },
        score_relevance: { type: Type.INTEGER, description: "自分事化・関連性 (1-5): 「これは自分のための商品だ」と感じたか？" },
        score_value: { type: Type.INTEGER, description: "コスパ感 (1-5): 提示価格に対して、価値が見合っているか？" },
        
        keyInsight: { type: Type.STRING, description: "「自分のような立場の人間にとって、この商品はXXだ」という独自の洞察・気づき" },
        attributeReasoning: { type: Type.STRING, description: "自分の属性（年収、性格、価値観など）が、なぜこの決断につながったのかの自己分析 (例: 私は慎重派なので、実績がないサービスには手を出したくない)" },
        reverseQuestion: { type: Type.STRING, description: "開発者への逆質問、または「もしXXだったら買ったかもしれない」という仮定の話。 (例: この回答はシミュレーションですが、もしXX機能があれば検討の余地がありました)" }
    },
    required: ["innerVoice", "decision", "reason", "willingnessToPay", "targetPriceCondition", "score_appeal", "score_novelty", "score_clarity", "score_relevance", "score_value", "keyInsight", "attributeReasoning", "reverseQuestion"]
};

const REVIEW_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        rating: { type: Type.INTEGER, description: "5段階評価 (1-5)" },
        title: { type: Type.STRING, description: "レビューまたはフィードバックのタイトル" },
        body: { type: Type.STRING, description: "レビュー本文（購入した場合）または見送り理由の詳細フィードバック（購入しなかった場合）" },
        nps: { type: Type.INTEGER, description: "推奨度 (0-10)" }
    },
    required: ["rating", "title", "body", "nps"]
};

// Interview Schema
const INTERVIEW_RESPONSE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        response: { type: Type.STRING, description: "インタビューへの回答。ペルソナの口調で記述。" }
    },
    required: ["response"]
};

interface ReactionResult {
    personaId: string;
    innerVoice: string;
    interestLevel: number;
    question: string | null;
    qaHistory: { question: string; answer: string }[];
    logs: string[];
}

// Helper: Remove heavy image data
const getSafeProductContext = (p: ProductInput) => {
    const { productImage, imageMimeType, ...safeProduct } = p;
    return safeProduct;
};

// Helper: Simple sleep to prevent bursts
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Sales Answer Logic
const getSalesAnswer = async (ai: GoogleGenAI, model: string, question: string, safeProductContext: any, onUsage?: (meta: any) => void) => {
    const prompt = {
        role: "セールス担当 (Salesperson)",
        task: "顧客からの質問に対して回答せよ。",
        inputContext: {
            userQuestion: question,
            productContext: safeProductContext,
        },
        instructions: [
            "【重要】入力データ(productContext)に含まれていない機能や仕様については、勝手に捏造して約束してはならない。",
            "情報がない場合は「現時点では未定ですが、貴重なご意見として承ります」や「一般的な業界標準では〜ですが、本製品の仕様は確認が必要です」のように誠実かつ慎重に回答すること。",
            "回答は短く、魅力的かつ簡潔にすること。"
        ]
    };
    const res = await generateContentWithRetry(
        ai, 
        { model, contents: JSON.stringify(prompt), config: { responseMimeType: "application/json", responseSchema: ANSWER_SCHEMA } }, 
        "SalesAnswer",
        { validator: (text) => !!cleanAndParseJson(text, "SalesAnswerValidator").answer }
    );
    if (onUsage && res.usageMetadata) onUsage(res.usageMetadata);
    return cleanAndParseJson(res.text, "SalesAnswer").answer;
};

// --- Phase 1: Reaction ---
const executeReactionStep = async (
    ai: GoogleGenAI,
    model: string,
    product: ProductInput,
    persona: PersonaProfile,
    pitch: SalesPitch,
    competitorData: CompetitorData | undefined,
    updateState: (id: string, update: Partial<ConsumerState> | ((prev: ConsumerState) => Partial<ConsumerState>)) => void,
    logAction: (id: string, type: SimulationLog['type'], content: string) => void,
    onUsage?: (meta: any) => void
): Promise<ReactionResult> => {
    
    const safeProductContext = getSafeProductContext(product);
    const resultLogs: string[] = [];
    const qaHistory: { question: string; answer: string }[] = [];
    
    let currentInterest = product.initialInterest ?? 50;

    const addHistory = (item: InteractionItem) => {
        const historyItem = { ...item, interestLevel: currentInterest };
        updateState(persona.id, (prev) => ({
            interactionHistory: [...(prev.interactionHistory || []), historyItem]
        }));
    };

    // 1. Initial Reaction
    updateState(persona.id, { status: 'thinking' });
    
    const reactionPrompt = {
        role: "消費者ペルソナ (Consumer Persona)",
        personaProfile: persona,
        task: "商品/サービス提案を聞いて、直感的な感想（心の声）と興味度を出力せよ。",
        inputContext: {
            pitch: pitch,
            productDetails: safeProductContext,
            marketContext: competitorData ? competitorData.summary : "特になし"
        },
        instructions: [
            "あなたはAIではなく、感情と生活実態を持つ人間として振る舞え。",
            "提案された商品が、あなたの「現在の悩み」を本当に解決するか、あるいは「余計なもの」かを直感的に判断せよ。",
            "【忖度禁止】開発者に気を遣う必要はない。興味がなければ素直に低い興味度(0-30)を示し、辛辣な心の声を出力せよ。",
            "marketContextに競合情報がある場合、「XXの方が有名だし安心じゃない？」といった比較視点を持つこと。",
            "添付画像がある場合、そのデザインやUIが自分の好みやリテラシーに合っているか評価せよ。",
            "興味があれば、購入検討にあたって最も懸念している点について質問を作成せよ。"
        ]
    };

    const reactionParts: any[] = [];
    if (product.productImage && product.imageMimeType) {
        reactionParts.push({
            inlineData: {
                data: product.productImage,
                mimeType: product.imageMimeType
            }
        });
    }
    reactionParts.push({ text: JSON.stringify(reactionPrompt) });

    const reactionRes = await generateContentWithRetry(
        ai, 
        { model, contents: { parts: reactionParts }, config: { responseMimeType: "application/json", responseSchema: REACTION_SCHEMA } }, 
        `Consumer_${persona.name}_Reaction`,
        { validator: (text) => !!cleanAndParseJson(text, "ReactionValidator").innerVoice }
    );
    if (onUsage && reactionRes.usageMetadata) onUsage(reactionRes.usageMetadata);

    const reaction = cleanAndParseJson(reactionRes.text, "Reaction");
    
    currentInterest = reaction.interestLevel;
    updateState(persona.id, { innerVoice: reaction.innerVoice, interestLevel: currentInterest });
    addHistory({ type: 'thought', content: reaction.innerVoice, timestamp: Date.now() });
    
    logAction(persona.id, 'thought', reaction.innerVoice);
    resultLogs.push(`Thought: ${reaction.innerVoice}`);

    // Pause before Q&A to allow queue to breathe
    await sleep(1500);

    // 2. Interaction (Q&A)
    if (reaction.interestLevel > 30 && reaction.question) {
        updateState(persona.id, { status: 'asking', questionsAsked: 1 });
        logAction(persona.id, 'dialogue', `質問: ${reaction.question}`);
        resultLogs.push(`Question: ${reaction.question}`);
        addHistory({ type: 'question', content: reaction.question, timestamp: Date.now() });
        
        // Another short pause before answering
        await sleep(1000);

        const answer = await getSalesAnswer(ai, model, reaction.question, safeProductContext, onUsage);
        logAction('SALES', 'dialogue', `回答: ${answer}`);
        resultLogs.push(`Answer: ${answer}`);
        addHistory({ type: 'answer', content: answer, timestamp: Date.now() });
        
        qaHistory.push({ question: reaction.question, answer });
    }

    return {
        personaId: persona.id,
        innerVoice: reaction.innerVoice,
        interestLevel: reaction.interestLevel,
        question: reaction.question,
        qaHistory,
        logs: resultLogs
    };
};

// --- Phase 2: Decision ---
const executeDecisionStep = async (
    ai: GoogleGenAI,
    model: string,
    product: ProductInput,
    persona: PersonaProfile,
    pitch: SalesPitch,
    reactionData: ReactionResult,
    discussionContext: string | null,
    competitorData: CompetitorData | undefined,
    updateState: (id: string, update: Partial<ConsumerState> | ((prev: ConsumerState) => Partial<ConsumerState>)) => void,
    logAction: (id: string, type: SimulationLog['type'], content: string) => void,
    onUsage?: (meta: any) => void
): Promise<ConsumerResult> => {

    const safeProductContext = getSafeProductContext(product);
    let resultLogs = [...reactionData.logs];
    let currentInterest = reactionData.interestLevel;

    // Helper to append history
    const addHistory = (item: InteractionItem) => {
        const historyItem = { ...item, interestLevel: currentInterest };
        updateState(persona.id, (prev) => ({
            interactionHistory: [...(prev.interactionHistory || []), historyItem]
        }));
    };

    // If discussion occurred, show the influence
    if (discussionContext) {
        addHistory({ type: 'discussion', content: "（他の参加者の意見を聞いています...）", timestamp: Date.now() });
        await sleep(1000); // Simulate listening time
    }

    // 3. Decision
    updateState(persona.id, { status: 'thinking' });
    const decisionPrompt = {
        role: "消費者ペルソナ (Consumer Persona)",
        personaProfile: persona,
        task: "商品/サービスの購入(利用)可否を最終決断し、5つの観点で商品を厳格に採点せよ。",
        inputContext: { 
            product: safeProductContext, 
            pitch: pitch, 
            previousReaction: { 
                innerVoice: reactionData.innerVoice, 
                interestLevel: reactionData.interestLevel 
            }, 
            qaHistory: reactionData.qaHistory,
            discussionContext: discussionContext, // Add group influence
            marketContext: competitorData ? competitorData.summary : "特になし"
        },
        instructions: [
            "【最重要: 忖度禁止】あなたはシミュレーターの被験者ではなく、自分のお金と時間を使う一人の生活者である。開発者や企画者に一切気を遣う必要はない。",
            "【スコアリングの厳格化】5つのscore項目(appeal, novelty, clarity, relevance, value)は1〜5段階で評価せよ。「3」は普通。「5」は感動レベル。「1」は論外。安易に4や5をつけるな。",
            "【金銭感覚の厳格化】あなたの年収や生活状況を鑑みて、この価格は適正か？ 「機能は良いが高い」は、購入を見送る十分な理由になる。",
            "【現状維持バイアス】「今のままでも困っていない」「新しいことを覚えるのが面倒」という心理があれば、それを理由にPassせよ。",
            "【代替品の検討】「Google検索や無料ツールで代用できる」「既存の業務フローで十分」と感じたら、Passを選択せよ。",
            "【Buyの基準】Buyを選択するのは、「価格以上の価値が確実にある」かつ「今すぐ課題を解決したい」と強く感じた場合のみに限る。少しでも迷いがあればPassを選択せよ。",
            "【Willingness to Pay】提示価格に関わらず、あなたが本音で出せる金額を算出せよ。Passする場合は0円、もしくは「ワンコインなら試す」程度の金額になることが多い。"
        ]
    };
    
    // Construct parts with image if available
    const decisionParts: any[] = [];
    if (product.productImage && product.imageMimeType) {
        decisionParts.push({
            inlineData: {
                data: product.productImage,
                mimeType: product.imageMimeType
            }
        });
    }
    decisionParts.push({ text: JSON.stringify(decisionPrompt) });

    const decisionRes = await generateContentWithRetry(
        ai, 
        { model, contents: { parts: decisionParts }, config: { responseMimeType: "application/json", responseSchema: DECISION_SCHEMA } }, 
        `Consumer_${persona.name}_Decision`,
        { validator: (text) => {
            const d = cleanAndParseJson(text, "DecisionValidator");
            return !!d.decision && !!d.reason;
        }}
    );
    if (onUsage && decisionRes.usageMetadata) onUsage(decisionRes.usageMetadata);

    const decisionData = cleanAndParseJson(decisionRes.text, "Decision");

    if (decisionData.decision === 'buy') currentInterest = Math.max(currentInterest, 90);
    else currentInterest = Math.min(currentInterest, 40);

    const detailedScore: DetailedScore = {
        appeal: decisionData.score_appeal,
        novelty: decisionData.score_novelty,
        clarity: decisionData.score_clarity,
        relevance: decisionData.score_relevance,
        value: decisionData.score_value
    };

    updateState(persona.id, { 
        status: 'decided', 
        innerVoice: decisionData.innerVoice, 
        decision: decisionData.decision, 
        decisionReason: decisionData.reason,
        willingnessToPay: decisionData.willingnessToPay, // Store WTP
        targetPriceCondition: decisionData.targetPriceCondition, // Store Target Condition
        detailedScore: detailedScore, // Store Detailed Score
        keyInsight: decisionData.keyInsight,
        attributeReasoning: decisionData.attributeReasoning,
        reverseQuestion: decisionData.reverseQuestion,
        interestLevel: currentInterest
    });
    addHistory({ type: 'thought', content: decisionData.innerVoice, timestamp: Date.now() });
    addHistory({ type: 'decision', content: decisionData.decision === 'buy' ? '購入決定' : '見送り決定', timestamp: Date.now() });

    logAction(persona.id, 'thought', decisionData.innerVoice);
    logAction(persona.id, 'action', decisionData.decision === 'buy' ? `🎉 採用/購入します (評価額: ¥${decisionData.willingnessToPay?.toLocaleString()})` : `👋 見送ります (評価額: ¥${decisionData.willingnessToPay?.toLocaleString()})`);
    resultLogs.push(`Decision: ${decisionData.decision.toUpperCase()} - ${decisionData.reason} (WTP: ${decisionData.willingnessToPay})`);

    // Pause before Review
    await sleep(500);

    // 4. Evaluation (Review or Feedback)
    updateState(persona.id, { status: 'reviewing' });
    
    const evaluationTask = decisionData.decision === 'buy' 
        ? "商品を購入し、1週間使用したと仮定して具体的な「ユーザーレビュー」を書け。"
        : "商品を見送った理由と、どのような改善があれば購入したかを伝える「フィードバック」を書け。";

    const reviewPrompt = {
        role: "消費者ペルソナ (Consumer Persona)",
        personaProfile: persona,
        task: "レビューまたはフィードバックの執筆",
        decision: decisionData.decision,
        inputContext: { 
            product: safeProductContext,
            instruction: evaluationTask
        }, 
        instructions: decisionData.decision === 'buy'
        ? ["具体的な使用感と、NPS(0-10)を含めること。", "購入したとはいえ、不満点があれば正直に書くこと。"]
        : ["なぜ買わなかったのか、どう改善すれば買うのかを具体的に書くこと。", "お世辞は不要。"]
    };

    const reviewRes = await generateContentWithRetry(
        ai, 
        { model, contents: JSON.stringify(reviewPrompt), config: { responseMimeType: "application/json", responseSchema: REVIEW_SCHEMA } }, 
        `Consumer_${persona.name}_Review`,
        { validator: (text) => !!cleanAndParseJson(text, "ReviewValidator").title }
    );
    if (onUsage && reviewRes.usageMetadata) onUsage(reviewRes.usageMetadata);

    const r = cleanAndParseJson(reviewRes.text, "Review");
    
    const reviewData: ReviewData = {
        personaId: persona.id,
        personaName: persona.name,
        rating: r.rating,
        title: r.title,
        body: r.body,
        nps: r.nps
    };
    
    const logLabel = decisionData.decision === 'buy' ? 'レビュー投稿' : 'フィードバック送信';
    logAction(persona.id, 'info', `${logLabel}: ${"★".repeat(r.rating)} "${r.title}"`);

    return {
        personaId: persona.id,
        finalDecision: decisionData.decision as 'buy' | 'pass',
        decisionReason: decisionData.reason,
        willingnessToPay: decisionData.willingnessToPay, // Include in result
        targetPriceCondition: decisionData.targetPriceCondition, // Include in result
        detailedScore: detailedScore, // Include in result
        keyInsight: decisionData.keyInsight,
        review: reviewData,
        logs: resultLogs,
        qaHistory: reactionData.qaHistory,
        attributeReasoning: decisionData.attributeReasoning,
        reverseQuestion: decisionData.reverseQuestion
    };
};

// --- Main Orchestrator ---
export const executeConsumerSimulation = async (
    ai: GoogleGenAI,
    model: string,
    product: ProductInput,
    personas: PersonaProfile[],
    pitch: SalesPitch,
    competitorData: CompetitorData | undefined, // Added arg
    updateState: (id: string, update: Partial<ConsumerState> | ((prev: ConsumerState) => Partial<ConsumerState>)) => void,
    logAction: (id: string, type: SimulationLog['type'], content: string) => void,
    onUsage?: (meta: any) => void,
    onStatusUpdate?: (status: any) => void // callback for phase change
): Promise<ConsumerResult[]> => {

    const reactionTasks: Promise<ReactionResult>[] = [];
    
    // 1. Reaction Phase (Parallel)
    for (const persona of personas) {
        const task = geminiQueue.add(async () => {
             return executeReactionStep(ai, model, product, persona, pitch, competitorData, updateState, logAction, onUsage);
        });
        reactionTasks.push(task);
    }
    
    // Wait for all reactions (use allSettled to be robust)
    const reactionResultsSettled = await Promise.allSettled(reactionTasks);
    const successfulReactions: ReactionResult[] = [];
    
    reactionResultsSettled.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            successfulReactions.push(r.value);
        } else {
            const pid = personas[i].id;
            console.error(`Persona ${pid} failed at reaction:`, r.reason);
            logAction(pid, 'info', `シミュレーション離脱 (Reaction Error): ${r.reason}`);
        }
    });

    // 2. Group Discussion Phase (Optional Synchronization)
    let discussionContext: string | null = null;
    if (product.enableGroupDiscussion && successfulReactions.length > 1) {
        try {
            if (onStatusUpdate) onStatusUpdate('discussion');
            
            // Set all to discussing status
            successfulReactions.forEach(r => updateState(r.personaId, { status: 'discussing' }));
            
            logAction('MODERATOR', 'info', 'モデレーターが会議室に入室しました。グループ討議を開始します。');
            
            // Prepare inputs for discussion agent
            const reactionData = successfulReactions.map(r => ({
                persona: personas.find(p => p.id === r.personaId)!,
                innerVoice: r.innerVoice,
                interestLevel: r.interestLevel,
                question: r.question || undefined
            }));
            
            const discussionResult = await executeGroupDiscussion(ai, model, reactionData, onUsage);
            
            discussionContext = discussionResult.discussionContext;
            
            logAction('MODERATOR', 'dialogue', `議論まとめ: ${discussionResult.summary}`);
            logAction('MODERATOR', 'dialogue', `支配的意見: ${discussionResult.dominantOpinion}`);
            
            // Add discussion log to history for everyone
            successfulReactions.forEach(r => {
                 updateState(r.personaId, (prev) => ({
                    interactionHistory: [...prev.interactionHistory, {
                        type: 'discussion',
                        content: discussionResult.dominantOpinion, // Show summary to user in history
                        timestamp: Date.now(),
                        interestLevel: r.interestLevel
                    }]
                }));
            });

        } catch (e) {
            console.error("Group Discussion failed", e);
            logAction('SYSTEM', 'info', 'グループ討議の生成に失敗しました。個別の検討を継続します。');
        }
    }

    // 3. Decision Phase (Parallel)
    const decisionTasks: Promise<ConsumerResult>[] = [];
    
    for (const reaction of successfulReactions) {
        const persona = personas.find(p => p.id === reaction.personaId)!;
        const task = geminiQueue.add(async () => {
             return executeDecisionStep(
                 ai, model, product, persona, pitch, reaction, discussionContext, competitorData,
                 updateState, logAction, onUsage
             );
        });
        decisionTasks.push(task);
    }
    
    const decisionResultsSettled = await Promise.allSettled(decisionTasks);
    const successfulDecisions: ConsumerResult[] = [];
    
    decisionResultsSettled.forEach((r) => {
        if (r.status === 'fulfilled') {
            successfulDecisions.push(r.value);
        }
    });

    return successfulDecisions;
};

// --- Direct Interview Capability (Unchanged) ---
export const executePersonaInterview = async (
    ai: GoogleGenAI,
    model: string,
    persona: PersonaProfile,
    product: ProductInput,
    history: InteractionItem[],
    userQuestion: string,
    onUsage?: (meta: any) => void
): Promise<string> => {
    // 1. Context Reconstruction
    const { productImage, imageMimeType, ...safeProductContext } = product;

    const conversationContext = history.map(h => {
        let label = "Unknown";
        switch(h.type) {
            case 'thought': label = "Your Inner Thought"; break;
            case 'question': label = "You Asked"; break;
            case 'answer': label = "Sales Agent Answered"; break;
            case 'decision': label = "Your Decision"; break;
            case 'user-question': label = "Interviewer Asked"; break;
            case 'persona-answer': label = "You Answered"; break;
            case 'discussion': label = "Group Discussion Summary"; break;
        }
        return `${label}: ${h.content}`;
    }).join("\n");

    const prompt = {
        role: "消費者ペルソナ (Consumer Persona)",
        personaProfile: persona,
        task: "インタビューアー（分析者）からの深掘り質問に対し、ペルソナ本人として回答せよ。",
        inputContext: {
            productDetails: safeProductContext,
            conversationHistory: conversationContext,
            currentQuestion: userQuestion
        },
        instructions: [
            "あなたはシミュレーションに参加したペルソナ本人である。",
            "過去の自分の思考（Inner Thought）や決断（Decision）と矛盾しないように答えること。",
            "口調はあなたの年齢、職業、性格（Traits）に合わせること。",
            "回答は具体的かつ正直に。必要であれば辛辣な意見も歓迎される。"
        ]
    };

    const res = await generateContentWithRetry(
        ai, 
        { model, contents: JSON.stringify(prompt), config: { responseMimeType: "application/json", responseSchema: INTERVIEW_RESPONSE_SCHEMA } }, 
        `PersonaInterview_${persona.id}`,
        { validator: (text) => !!cleanAndParseJson(text, "InterviewValidator").response }
    );
    
    if (onUsage && res.usageMetadata) onUsage(res.usageMetadata);

    return cleanAndParseJson(res.text, "Interview").response;
};

import { GoogleGenAI } from "@google/genai";
import { ProductInput, SimulationStatus, SimulationLog, SimulationResult, PersonaProfile, ConsumerState, ReviewData, SalesPitchData, TokenUsage, InteractionItem, CompetitorData, ConsumerResult, ImprovementPlan } from "../types";
import { executeCasting } from "./agents/casting";
import { executeSalesPitch } from "./agents/sales";
import { executeConsumerSimulation, executePersonaInterview } from "./agents/consumer";
import { executeAnalysis } from "./agents/analyst";
import { executeCompetitorResearch } from "./agents/competitorResearch";
import { executePivotPlanning } from "./agents/pivot";

export const runSimulation = async (
  input: ProductInput,
  onStatusUpdate: (status: SimulationStatus) => void,
  onLog: (log: SimulationLog) => void,
  onPersonasGenerated: (personas: PersonaProfile[]) => void,
  onConsumerUpdate: (id: string, update: Partial<ConsumerState> | ((prev: ConsumerState) => Partial<ConsumerState>)) => void,
  onProgress: (percent: number) => void,
  onSalesPitchGenerated: (pitch: SalesPitchData) => void,
  onTokenUpdate: (usage: TokenUsage) => void
): Promise<SimulationResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Model selection: Organizer/Analyst use Pro, Consumers use Flash for parallelism/speed.
  const organizerModel = "gemini-3-pro-preview"; 
  const workerModel = "gemini-2.5-flash"; 

  const logs: SimulationLog[] = [];
  const addLog = (personaId: string, type: SimulationLog['type'], content: string, phase: SimulationLog['phase']) => {
    const log: SimulationLog = {
      id: Math.random().toString(36),
      personaId,
      type,
      content,
      phase,
      timestamp: Date.now()
    };
    logs.push(log);
    onLog(log);
  };

  // Token Usage Tracking
  let currentUsage: TokenUsage = { 
      inputTokens: 0, 
      outputTokens: 0, 
      totalTokens: 0, 
      apiCalls: 0,
      proInputTokens: 0,
      proOutputTokens: 0,
      flashInputTokens: 0,
      flashOutputTokens: 0
  };

  const updateUsage = (meta: any, modelType: 'pro' | 'flash') => {
      if (!meta) return;
      
      const input = meta.promptTokenCount || 0;
      const output = meta.candidatesTokenCount || 0;
      const total = meta.totalTokenCount || 0;

      // Update Aggregates
      currentUsage.inputTokens += input;
      currentUsage.outputTokens += output;
      currentUsage.totalTokens += total;
      currentUsage.apiCalls += 1;

      // Update Specifics
      if (modelType === 'pro') {
          currentUsage.proInputTokens += input;
          currentUsage.proOutputTokens += output;
      } else {
          currentUsage.flashInputTokens += input;
          currentUsage.flashOutputTokens += output;
      }

      onTokenUpdate({...currentUsage}); // Clone to trigger re-render
  };

  try {
    onProgress(0);
    onTokenUpdate(currentUsage); // Reset

    // --- Phase 1 & 2 Parallel Execution: Casting, Presentation & Research ---
    onStatusUpdate('casting');
    addLog('SYSTEM', 'info', 'Organizer Agent: プロジェクトを開始します。並列処理で「ペルソナ選定」「セールス分析」「競合リサーチ」を実行中...', 'casting');

    // 1. Casting Promise
    const castingPromise = executeCasting(
        ai, 
        organizerModel, 
        input, 
        (meta) => updateUsage(meta, 'pro')
    ).then(personas => {
        addLog('SYSTEM', 'info', `${personas.length}名のペルソナ候補を選出しました。`, 'casting');
        personas.forEach(p => {
             addLog(p.id, 'info', `ペルソナ生成: ${p.name} (${p.age}歳, ${p.occupation})`, 'casting');
        });
        onPersonasGenerated(personas);
        return personas;
    });

    // 2. Sales Pitch Promise
    const pitchPromise = executeSalesPitch(
        ai, 
        organizerModel, 
        input, 
        (meta) => updateUsage(meta, 'pro')
    ).then(pitch => {
        addLog('SALES', 'info', 'Sales Agent: 商品分析とプレゼンテーションの準備が完了しました。', 'presentation');
        onSalesPitchGenerated(pitch);
        return pitch;
    });

    // 3. Competitor Research Promise (New)
    const competitorPromise = executeCompetitorResearch(
        ai,
        organizerModel, // Use Pro for Search Grounding capability
        input,
        (meta) => updateUsage(meta, 'pro')
    ).then(data => {
        const sourceCount = data.sources.length;
        if (sourceCount > 0) {
            addLog('RESEARCHER', 'info', `Web検索により ${sourceCount}件の競合・関連情報を取得しました。ペルソナに知識を共有します。`, 'presentation');
        } else {
            addLog('RESEARCHER', 'info', `直接的な競合情報は検出されませんでした。`, 'presentation');
        }
        return data;
    }).catch(e => {
        console.error("Competitor research failed", e);
        addLog('RESEARCHER', 'info', '競合リサーチに失敗しましたが、シミュレーションは継続します。', 'presentation');
        return { summary: "（競合情報なし）", sources: [] } as CompetitorData;
    });

    // Wait for all to complete
    const [personas, salesPitch, competitorData] = await Promise.all([castingPromise, pitchPromise, competitorPromise]);
    
    onProgress(30);

    // --- Phase 3: Consumer Simulation (Worker: Flash) ---
    onStatusUpdate('simulation_running');
    addLog('SYSTEM', 'info', 'Simulation: 各ペルソナへのプレゼンテーションを開始します。', 'interaction');

    // Initialize Consumer States
    const startInterest = input.initialInterest ?? 50;
    personas.forEach(p => onConsumerUpdate(p.id, { 
        profile: p, 
        status: 'listening', 
        innerVoice: null, 
        decision: null, 
        decisionReason: null, 
        interestLevel: startInterest, 
        questionsAsked: 0, 
        interactionHistory: []
    }));

    const consumerResults = await executeConsumerSimulation(
        ai, 
        workerModel, 
        input, 
        personas, 
        salesPitch,
        competitorData, // Pass competitor info
        (id, update) => onConsumerUpdate(id, update),
        (id, type, content) => addLog(id, type, content, 'interaction'),
        (meta) => updateUsage(meta, 'flash'), 
        (status) => {
            onStatusUpdate(status);
            if (status === 'discussion') addLog('SYSTEM', 'info', 'Simulation: グループ討議フェーズに移行します。', 'discussion');
            if (status === 'simulation_running') addLog('SYSTEM', 'info', 'Simulation: 最終判断フェーズに入ります。', 'interaction');
        }
    );
    
    if (consumerResults.length === 0) {
        throw new Error("全てのペルソナシミュレーションが失敗しました。しばらく待ってから再試行してください。");
    }

    const failedCount = personas.length - consumerResults.length;
    if (failedCount > 0) {
        addLog('SYSTEM', 'info', `注意: ${failedCount}名のペルソナがエラーにより離脱しましたが、分析を継続します。`, 'interaction');
    }

    onProgress(80);

    // --- Phase 4: Analysis & Reporting (Organizer: Pro) ---
    onStatusUpdate('analyzing');
    addLog('ANALYST', 'info', 'Analyst Agent: 全ログを回収し、インサイトレポートを作成中...', 'analysis');

    const reviews: ReviewData[] = consumerResults.filter(r => r.review).map(r => r.review!);
    const report = await executeAnalysis(
        ai, 
        organizerModel, 
        input, 
        personas, 
        consumerResults, 
        salesPitch,
        competitorData, // Pass competitor info to analyst
        (meta) => updateUsage(meta, 'pro')
    );

    addLog('ANALYST', 'info', 'レポートが完成しました。', 'analysis');
    onProgress(100);
    onStatusUpdate('completed');

    return {
        product: input,
        personas,
        logs,
        reviews,
        report,
        pitch: salesPitch,
        competitorResearch: competitorData
    };

  } catch (error: any) {
    console.error("Simulation Error:", error);
    onStatusUpdate('error');
    addLog('SYSTEM', 'info', `Error: ${error.message}`, 'error');
    throw error;
  }
};

export const runDirectInterview = async (
    persona: PersonaProfile,
    product: ProductInput,
    history: InteractionItem[],
    question: string,
    onTokenUpdate?: (usage: TokenUsage) => void
): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash"; // Use fast model for chat

    // Token tracking wrapper for Chat (uses Flash)
    const handleUsage = (meta: any) => {
        if (onTokenUpdate && meta) {
             const input = meta.promptTokenCount || 0;
             const output = meta.candidatesTokenCount || 0;
             onTokenUpdate({
                 inputTokens: input,
                 outputTokens: output,
                 totalTokens: meta.totalTokenCount || 0,
                 apiCalls: 1,
                 // Chat uses Flash
                 proInputTokens: 0,
                 proOutputTokens: 0,
                 flashInputTokens: input,
                 flashOutputTokens: output
             });
        }
    };

    return await executePersonaInterview(ai, model, persona, product, history, question, handleUsage);
};

// NEW: Pivot Planning
export const generateImprovementPlan = async (
    input: ProductInput,
    personas: PersonaProfile[],
    consumerStates: Record<string, ConsumerState>,
    pitch: SalesPitchData,
    competitorData: CompetitorData | undefined,
    onTokenUpdate?: (usage: TokenUsage) => void
): Promise<ImprovementPlan> => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-3-pro-preview"; // Need High reasoning

    const handleUsage = (meta: any) => {
        if (onTokenUpdate && meta) {
             const input = meta.promptTokenCount || 0;
             const output = meta.candidatesTokenCount || 0;
             onTokenUpdate({
                 inputTokens: input,
                 outputTokens: output,
                 totalTokens: meta.totalTokenCount || 0,
                 apiCalls: 1,
                 proInputTokens: input, // Pro model
                 proOutputTokens: output,
                 flashInputTokens: 0,
                 flashOutputTokens: 0
             });
        }
    };

    // Construct ConsumerResults from state for the agent
    const results: ConsumerResult[] = personas.map(p => {
        const s = consumerStates[p.id];
        return {
            personaId: p.id,
            finalDecision: s.decision || 'pass',
            decisionReason: s.decisionReason || '',
            willingnessToPay: s.willingnessToPay || 0,
            targetPriceCondition: s.targetPriceCondition || undefined,
            detailedScore: s.detailedScore || { appeal:0, novelty:0, clarity:0, relevance:0, value:0 },
            keyInsight: s.keyInsight || '',
            logs: [],
            attributeReasoning: s.attributeReasoning || undefined,
            reverseQuestion: s.reverseQuestion || undefined
        };
    });

    return await executePivotPlanning(ai, model, input, personas, results, pitch, competitorData, handleUsage);
};

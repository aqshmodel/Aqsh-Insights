
export type SimulationStatus = 
  | 'idle'
  | 'casting'
  | 'presentation'
  | 'simulation_running'
  | 'discussion'
  | 'analyzing'
  | 'completed'
  | 'error';

export type ComprehensionLevel = 'entry' | 'general' | 'executive' | 'practitioner' | 'expert';

export interface ProductInput {
  name: string;
  description: string;
  price?: string;
  targetHypothesis: string;
  personaCount: number;
  initialInterest: number; // 0-100: 初期関心度（シミュレーションの厳しさ）
  customPersonaPrompt?: string; // ユーザーによるペルソナ詳細指定
  productImage?: string; // Base64 encoded image string (raw, no prefix)
  imageMimeType?: string; // e.g., 'image/png'
  enableGroupDiscussion?: boolean; // グループ会議モードフラグ
}

export interface PersonaProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  incomeLevel: string;
  traits: string[]; // 性格特性
  currentPainPoints: string; // 現在の悩み
  values: string; // 価値観
  avatarColor?: string;
  
  // Extended Profile
  familyStructure: string; // 家族構成
  techLiteracy: string; // リテラシー・受容性
  infoSources: string[]; // 情報収集源
  hobbies: string[]; // 趣味・関心
}

export interface SimulationLog {
  id: string;
  personaId: string | 'SYSTEM' | 'SALES' | 'ANALYST' | 'MODERATOR' | 'RESEARCHER' | 'PIVOT';
  phase: 'casting' | 'presentation' | 'interaction' | 'discussion' | 'review' | 'analysis' | 'error';
  type: 'thought' | 'action' | 'dialogue' | 'info';
  content: string;
  timestamp: number;
}

export interface InteractionItem {
    type: 'thought' | 'question' | 'answer' | 'decision' | 'user-question' | 'persona-answer' | 'discussion';
    content: string;
    timestamp: number;
    interestLevel?: number; // その時点での興味度 (Visual Analytics用)
}

// NEW: 5-axis detailed scoring
export interface DetailedScore {
    appeal: number;    // 直感魅力度 (1-5)
    novelty: number;   // 新規性・独自性 (1-5)
    clarity: number;   // 理解度・明快さ (1-5)
    relevance: number; // 自分事化・関連性 (1-5)
    value: number;     // コスパ感 (1-5)
}

export interface ConsumerState {
  profile: PersonaProfile;
  status: 'waiting' | 'listening' | 'thinking' | 'asking' | 'discussing' | 'decided' | 'reviewing';
  innerVoice: string | null; // 最新の思考
  decision: 'buy' | 'pass' | null;
  decisionReason: string | null;
  willingnessToPay?: number | null; // 支払意向額 (円)
  targetPriceCondition?: string | null; // 提示価格を払うための条件 (Gap)
  detailedScore?: DetailedScore | null; // NEW: 詳細スコア
  keyInsight: string | null; // ペルソナ独自の視点・気づき
  attributeReasoning?: string | null; // 属性に基づく反応根拠 (Why)
  reverseQuestion?: string | null; // 開発者への逆質問 (Excuse/Feedback)
  interestLevel: number; // 0-100
  questionsAsked: number;
  interactionHistory: InteractionItem[]; // 履歴
}

export interface ReviewData {
  personaId: string;
  personaName: string;
  rating: number; // 1-5
  title: string;
  body: string;
  nps: number; // 0-10
}

export interface ConsumerResult {
    personaId: string;
    finalDecision: 'buy' | 'pass';
    decisionReason: string;
    willingnessToPay: number;
    targetPriceCondition?: string;
    detailedScore: DetailedScore; // NEW
    keyInsight: string;
    review?: ReviewData;
    logs: string[];
    qaHistory?: { question: string; answer: string }[];
    attributeReasoning?: string;
    reverseQuestion?: string;
}

// NEW: Positioning Map Data
export interface PositioningMap {
    axisX: string; // Label for X axis (e.g. "Low Cost -> High Cost")
    axisY: string; // Label for Y axis
    points: {
        name: string;
        x: number; // -10 to 10
        y: number; // -10 to 10
        isOurs: boolean;
        description?: string;
    }[];
}

export interface AnalysisReport {
  markdown: string;
  acceptanceRate: number;
  topRejectionReasons: string[];
  killerPhrases: string[];
  personaBreakdown: {
    id: string;
    decision: 'buy' | 'pass';
  }[];
  positioningMap?: PositioningMap; // NEW
}

export interface SalesPitchData {
    catchCopy: string;
    description: string;
    keyBenefits: string[];
}

export interface CompetitorData {
    summary: string; // テキスト形式の要約
    sources: { title: string; uri: string }[]; // 出典元
}

export interface SimulationResult {
  product: ProductInput;
  personas: PersonaProfile[];
  logs: SimulationLog[];
  reviews: ReviewData[];
  report: AnalysisReport;
  pitch: SalesPitchData;
  competitorResearch?: CompetitorData; // 競合リサーチ結果
  consumerStates?: Record<string, ConsumerState>; // Optional for full state restoration
}

export interface SimulationHistoryItem {
    id: string;
    timestamp: number;
    productName: string;
    acceptanceRate: number;
    result: SimulationResult;
}

export interface TokenUsage {
  inputTokens: number; // Total
  outputTokens: number; // Total
  totalTokens: number; // Total
  apiCalls: number;
  
  // Breakdown by Model
  proInputTokens: number;
  proOutputTokens: number;
  flashInputTokens: number;
  flashOutputTokens: number;
}

// NEW: Improvement Plan Schema (Refined Structure)
export interface ImprovementPlan {
    title: string;
    catchCopy: string;
    executiveSummary: string; // 1. エグゼクティブサマリー
    problemSolution: string; // 2. 本サービスが解決する課題
    serviceAndPricing: string; // 3. 提供サービスと料金プラン
    dynamicSections: { // 4 & 5. 柔軟な項目
        title: string;
        content: string;
    }[];
    simulation: string; // 6. 導入シミュレーション
    conclusion: string; // 7. 結論
}

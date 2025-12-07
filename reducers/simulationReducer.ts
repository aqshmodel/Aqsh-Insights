
import { 
    SimulationStatus, ProductInput, PersonaProfile, ConsumerState, 
    SimulationLog, SimulationResult, SalesPitchData, TokenUsage 
} from '../types';

export interface SimulationState {
    status: SimulationStatus;
    progress: number;
    productInput: ProductInput;
    personas: PersonaProfile[];
    consumerStates: Record<string, ConsumerState>;
    logs: SimulationLog[];
    result: SimulationResult | null;
    salesPitch: SalesPitchData | undefined;
    tokenUsage: TokenUsage;
}

export type SimulationAction =
    | { type: 'SET_INPUT'; payload: ProductInput }
    | { type: 'START_SIMULATION' }
    | { type: 'SET_STATUS'; payload: SimulationStatus }
    | { type: 'SET_PROGRESS'; payload: number }
    | { type: 'SET_PERSONAS'; payload: PersonaProfile[] }
    | { type: 'SET_PITCH'; payload: SalesPitchData }
    | { type: 'INIT_CONSUMER_STATES'; payload: { personas: PersonaProfile[]; initialInterest: number } }
    | { 
        type: 'UPDATE_CONSUMER_STATE'; 
        payload: { 
            id: string; 
            update: Partial<ConsumerState> | ((prev: ConsumerState) => Partial<ConsumerState>) 
        } 
    }
    | { type: 'ADD_LOG'; payload: SimulationLog }
    | { type: 'UPDATE_TOKEN_USAGE'; payload: Partial<TokenUsage> }
    | { type: 'COMPLETE_SIMULATION'; payload: SimulationResult }
    | { type: 'RESET_SIMULATION' }
    | { type: 'RESTORE_STATE'; payload: { result: SimulationResult; states?: Record<string, ConsumerState> } }
    | { type: 'SET_ERROR'; payload: string };

export const initialInput: ProductInput = {
    name: '',
    description: '',
    price: '',
    targetHypothesis: '',
    personaCount: 5,
    initialInterest: 50,
    customPersonaPrompt: '',
    productImage: undefined,
    imageMimeType: undefined,
    enableGroupDiscussion: false
};

// LocalStorageから初期Inputを読み込む
const savedInput = localStorage.getItem('aqsh_input');
const startInput = savedInput ? JSON.parse(savedInput) : initialInput;

export const initialState: SimulationState = {
    status: 'idle',
    progress: 0,
    productInput: startInput,
    personas: [],
    consumerStates: {},
    logs: [],
    result: null,
    salesPitch: undefined,
    tokenUsage: { 
        inputTokens: 0, outputTokens: 0, totalTokens: 0, apiCalls: 0,
        proInputTokens: 0, proOutputTokens: 0, flashInputTokens: 0, flashOutputTokens: 0 
    }
};

export function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
    switch (action.type) {
        case 'SET_INPUT': {
            localStorage.setItem('aqsh_input', JSON.stringify(action.payload));
            return { ...state, productInput: action.payload };
        }
        case 'START_SIMULATION':
            return {
                ...state,
                status: 'casting',
                progress: 0,
                personas: [],
                consumerStates: {},
                logs: [],
                result: null,
                salesPitch: undefined,
                tokenUsage: { 
                    inputTokens: 0, outputTokens: 0, totalTokens: 0, apiCalls: 0,
                    proInputTokens: 0, proOutputTokens: 0, flashInputTokens: 0, flashOutputTokens: 0 
                }
            };
        case 'SET_STATUS':
            return { ...state, status: action.payload };
        case 'SET_PROGRESS':
            return { ...state, progress: action.payload };
        case 'SET_PERSONAS':
            return { ...state, personas: action.payload };
        case 'SET_PITCH':
            return { ...state, salesPitch: action.payload };
        case 'INIT_CONSUMER_STATES': {
            const newStates: Record<string, ConsumerState> = {};
            action.payload.personas.forEach(p => {
                newStates[p.id] = {
                    profile: p,
                    status: 'listening',
                    innerVoice: null,
                    decision: null,
                    decisionReason: null,
                    interestLevel: action.payload.initialInterest,
                    questionsAsked: 0,
                    interactionHistory: [],
                    keyInsight: null
                };
            });
            return { ...state, consumerStates: newStates };
        }
        case 'UPDATE_CONSUMER_STATE': {
            const { id, update } = action.payload;
            const currentState = state.consumerStates[id];
            if (!currentState) return state;

            // Resolve functional update if necessary
            const newValues = typeof update === 'function' ? update(currentState) : update;

            return {
                ...state,
                consumerStates: {
                    ...state.consumerStates,
                    [id]: { ...currentState, ...newValues }
                }
            };
        }
        case 'ADD_LOG':
            return { ...state, logs: [...state.logs, action.payload] };
        case 'UPDATE_TOKEN_USAGE':
            return { 
                ...state, 
                tokenUsage: { ...state.tokenUsage, ...action.payload } 
            };
        case 'COMPLETE_SIMULATION':
            return {
                ...state,
                status: 'completed',
                progress: 100,
                result: action.payload
            };
        case 'RESET_SIMULATION':
            return {
                ...state,
                status: 'idle',
                progress: 0,
                personas: [],
                consumerStates: {},
                logs: [],
                result: null,
                salesPitch: undefined,
                tokenUsage: { 
                    inputTokens: 0, outputTokens: 0, totalTokens: 0, apiCalls: 0,
                    proInputTokens: 0, proOutputTokens: 0, flashInputTokens: 0, flashOutputTokens: 0 
                }
            };
        case 'RESTORE_STATE': {
            const { result, states } = action.payload;
            
            // 状態が提供されていない場合は、結果から簡易復元
            let restoredStates = states;
            if (!restoredStates || Object.keys(restoredStates).length === 0) {
                restoredStates = {};
                result.personas.forEach(p => {
                    const decisionInfo = result.report.personaBreakdown.find(b => b.id === p.id);
                    restoredStates![p.id] = {
                        profile: p,
                        status: 'decided',
                        innerVoice: "（履歴から復元）",
                        decision: decisionInfo?.decision || null,
                        decisionReason: null,
                        keyInsight: null,
                        interestLevel: 50,
                        questionsAsked: 0,
                        interactionHistory: []
                    };
                });
            }

            return {
                ...state,
                status: 'completed',
                productInput: result.product,
                personas: result.personas,
                logs: result.logs,
                result: result,
                salesPitch: result.pitch,
                consumerStates: restoredStates!
            };
        }
        case 'SET_ERROR':
            return { ...state, status: 'error' }; // ログなどは保持する
        default:
            return state;
    }
}

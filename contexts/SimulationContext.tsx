
import React, { createContext, useContext, useReducer, useCallback, ReactNode, useRef, useEffect } from 'react';
import { simulationReducer, initialState, SimulationState, SimulationAction } from '../reducers/simulationReducer';
import { runSimulation, runDirectInterview, generateImprovementPlan } from '../services/geminiService';
import { saveHistory } from '../services/historyService';
import { ProductInput, SimulationResult, ConsumerState, TokenUsage, InteractionItem, ImprovementPlan, PersonaProfile, SalesPitchData } from '../types';

interface SimulationContextType {
    state: SimulationState;
    dispatch: React.Dispatch<SimulationAction>;
    actions: {
        startSimulation: () => Promise<void>;
        resetSimulation: () => void;
        restoreState: (result: SimulationResult, states?: Record<string, ConsumerState>) => void;
        updateInput: (input: ProductInput) => void;
        runInterview: (personaId: string, question: string) => Promise<void>;
        generatePlan: () => Promise<ImprovementPlan | null>;
    };
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(simulationReducer, initialState);
    
    // Ref to track latest state for async callbacks (Fixes missing history data issue)
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const updateInput = useCallback((input: ProductInput) => {
        dispatch({ type: 'SET_INPUT', payload: input });
    }, []);

    const resetSimulation = useCallback(() => {
        dispatch({ type: 'RESET_SIMULATION' });
    }, []);

    const restoreState = useCallback((result: SimulationResult, states?: Record<string, ConsumerState>) => {
        dispatch({ type: 'RESTORE_STATE', payload: { result, states } });
    }, []);

    const startSimulation = useCallback(async () => {
        if (!state.productInput.name || !state.productInput.description) return;

        dispatch({ type: 'START_SIMULATION' });

        try {
            const res = await runSimulation(
                state.productInput,
                (status) => dispatch({ type: 'SET_STATUS', payload: status }),
                (log) => dispatch({ type: 'ADD_LOG', payload: log }),
                (personas) => {
                    dispatch({ type: 'SET_PERSONAS', payload: personas });
                    dispatch({ type: 'INIT_CONSUMER_STATES', payload: { personas, initialInterest: state.productInput.initialInterest ?? 50 } });
                },
                (id, update) => {
                    // Type safely dispatch update (supports functions now)
                    dispatch({ type: 'UPDATE_CONSUMER_STATE', payload: { id, update } });
                },
                (progress) => dispatch({ type: 'SET_PROGRESS', payload: progress }),
                (pitch) => dispatch({ type: 'SET_PITCH', payload: pitch }),
                (usage) => {
                    dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: usage });
                }
            );

            dispatch({ type: 'COMPLETE_SIMULATION', payload: res });
            
            // Use ref to pass the latest accumulated consumer states to history
            saveHistory(res, stateRef.current.consumerStates); 

        } catch (e: any) {
            console.error("Simulation Fatal Error", e);
            dispatch({ type: 'SET_ERROR', payload: e.message });
        }
    }, [state.productInput]);

    // Chat / Interview
    const runInterview = useCallback(async (personaId: string, question: string) => {
        const persona = state.personas.find(p => p.id === personaId);
        const currentState = state.consumerStates[personaId];
        
        if (!persona || !currentState) return;

        // User Question
        const userInteraction: InteractionItem = {
            type: 'user-question',
            content: question,
            timestamp: Date.now(),
            interestLevel: currentState.interestLevel
        };

        // Optimistic Update
        dispatch({ 
            type: 'UPDATE_CONSUMER_STATE', 
            payload: { 
                id: personaId, 
                update: { interactionHistory: [...currentState.interactionHistory, userInteraction] } 
            } 
        });

        try {
            const response = await runDirectInterview(
                persona,
                state.productInput,
                [...currentState.interactionHistory, userInteraction],
                question,
                (usage) => dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: usage })
            );

            const personaInteraction: InteractionItem = {
                type: 'persona-answer',
                content: response,
                timestamp: Date.now(),
                interestLevel: currentState.interestLevel
            };

            dispatch({ 
                type: 'UPDATE_CONSUMER_STATE', 
                payload: { 
                    id: personaId, 
                    // Use functional update to ensure thread safety
                    update: (prev) => ({ 
                        interactionHistory: [...prev.interactionHistory, personaInteraction] 
                    })
                } 
            });

        } catch (e) {
            console.error("Interview Error", e);
        }
    }, [state.personas, state.consumerStates, state.productInput]);

    // Plan Generation
    const generatePlan = useCallback(async () => {
        if (!state.result || !state.salesPitch) return null;
        
        const updateUsage = (u: TokenUsage) => dispatch({ type: 'UPDATE_TOKEN_USAGE', payload: u });

        return await generateImprovementPlan(
            state.productInput,
            state.personas,
            state.consumerStates,
            state.salesPitch,
            state.result.competitorResearch,
            updateUsage
        );
    }, [state.result, state.salesPitch, state.personas, state.consumerStates, state.productInput]);


    return (
        <SimulationContext.Provider value={{ 
            state, 
            dispatch, 
            actions: { 
                startSimulation, 
                resetSimulation, 
                restoreState, 
                updateInput, 
                runInterview, 
                generatePlan
            } 
        }}>
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulationContext = () => {
    const context = useContext(SimulationContext);
    if (context === undefined) {
        throw new Error('useSimulationContext must be used within a SimulationProvider');
    }
    return context;
};

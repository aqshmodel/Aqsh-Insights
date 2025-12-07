
import React from 'react';
import { Server } from 'lucide-react';
import { calculateCost, formatCost } from '../../services/costUtils';
import { useSimulationContext } from '../../contexts/SimulationContext';

export const TokenCounter: React.FC = () => {
    const { state } = useSimulationContext();
    const { tokenUsage: usage } = state;

    return (
        <div className="absolute top-4 right-4 lg:top-4 lg:right-6 z-40 flex flex-col items-end pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-lg p-2 lg:p-3 shadow-2xl flex items-center gap-3 lg:gap-4 animate-in fade-in slide-in-from-top-2 pointer-events-auto">
                {/* API Calls */}
                <div className="flex flex-col items-center px-2 border-r border-slate-200 dark:border-white/10">
                    <span className="text-[8px] lg:text-[9px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1"><Server className="w-3 h-3" /> Calls</span>
                    <span className="text-xs lg:text-sm font-mono font-bold text-slate-800 dark:text-white">{usage.apiCalls}</span>
                </div>
                 {/* Tokens */}
                 <div className="flex gap-2 lg:gap-4">
                    <div className="flex flex-col">
                         <span className="text-[8px] lg:text-[9px] text-slate-500 uppercase tracking-wider font-bold">Input</span>
                         <span className="text-[10px] lg:text-xs font-mono text-indigo-600 dark:text-indigo-300">{usage.inputTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                         <span className="text-[8px] lg:text-[9px] text-slate-500 uppercase tracking-wider font-bold">Output</span>
                         <span className="text-[10px] lg:text-xs font-mono text-emerald-600 dark:text-emerald-300">{usage.outputTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-200 dark:border-white/10 pl-2 lg:pl-4 items-end">
                         <span className="text-[8px] lg:text-[9px] text-slate-500 uppercase tracking-wider font-bold">Est. Cost</span>
                         <span className="text-xs lg:text-sm font-mono font-bold text-amber-500 dark:text-amber-400">{formatCost(calculateCost(usage))}</span>
                    </div>
                 </div>
            </div>
        </div>
    );
};

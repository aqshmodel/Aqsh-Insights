
import React, { useEffect, useRef } from 'react';
import { useSimulationContext } from '../../contexts/SimulationContext';
import { Users, Loader2, Brain, MessageCircle, Activity, ThumbsUp, ThumbsDown, Star, CheckCircle2 } from 'lucide-react';

interface PersonaGridProps {
    onSelectPersona: (id: string) => void;
}

export const PersonaGrid: React.FC<PersonaGridProps> = ({ 
    onSelectPersona 
}) => {
    const { state } = useSimulationContext();
    const { personas, consumerStates, status } = state;
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Auto scroll logic for cards
    useEffect(() => {
        Object.keys(consumerStates).forEach(id => {
            const el = cardRefs.current[id];
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        });
    }, [consumerStates]);

    return (
        <div className="flex w-full h-full p-4 lg:p-8">
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                {personas.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                        <p className="text-slate-400 font-medium">仮想顧客を生成中...</p>
                    </div>
                ) : (
                    <div className="pb-12 max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-6 sticky top-0 z-10 py-3 -mt-2 bg-transparent backdrop-blur-none">
                            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 w-fit backdrop-blur-md shadow-sm">
                                <Users className="w-3 h-3" /> アクティブな仮想顧客
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
                            {personas.map((p, idx) => {
                                const personaState = consumerStates[p.id];
                                return (
                                    <div 
                                        key={p.id} 
                                        onClick={() => onSelectPersona(p.id)}
                                        className="glass-card rounded-3xl p-0 flex flex-col relative overflow-hidden group transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-8 hover:border-indigo-500/40 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] h-[420px] bg-white/40 dark:bg-[#0f172a]/40"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        {/* Header / Avatar */}
                                        <div className="p-5 flex items-start gap-4 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] shrink-0">
                                            <div className="relative shrink-0">
                                                <div 
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/10 relative z-10 transition-transform group-hover:scale-105 duration-300"
                                                    style={{ backgroundColor: p.avatarColor }}
                                                >
                                                    {p.name[0]}
                                                </div>
                                                {personaState?.status === 'asking' && (
                                                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full border-4 border-white dark:border-[#0f172a] flex items-center justify-center z-20 shadow-lg animate-bounce">
                                                        <MessageCircle className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{p.name}</div>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-2">
                                                    <span>{p.age}歳</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                                                    <span>{p.occupation}</span>
                                                </div>
                                                
                                                {personaState?.decision ? (
                                                    <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border shadow-sm ${
                                                        personaState.decision === 'buy' 
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                                                        : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                                    }`}>
                                                        {personaState.decision === 'buy' ? <ThumbsUp className="w-3 h-3 mr-1.5" /> : <ThumbsDown className="w-3 h-3 mr-1.5" />}
                                                        {personaState.decision === 'buy' ? 'BUY' : 'PASS'}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 h-6" /> // spacer
                                                )}
                                            </div>
                                        </div>

                                        {/* Traits Tags */}
                                        <div className="px-5 py-3 flex flex-wrap gap-2 min-h-[48px] content-start bg-slate-50 dark:bg-black/20 shrink-0 border-b border-slate-200 dark:border-white/5">
                                            {p.traits.slice(0, 3).map((t, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs rounded border border-slate-200 dark:border-white/5 whitespace-nowrap">{t}</span>
                                            ))}
                                        </div>

                                        {/* Live Content Area - Scrollable History */}
                                        <div 
                                            className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar relative bg-white/30 dark:bg-slate-950/30"
                                            ref={(el) => { cardRefs.current[p.id] = el; }}
                                        >
                                            {personaState?.interactionHistory && personaState.interactionHistory.length > 0 ? (
                                                personaState.interactionHistory.map((item, idx) => (
                                                    <div key={idx} className={`animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col ${item.type === 'answer' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`p-3 rounded-2xl text-[11px] leading-relaxed border shadow-sm max-w-[90%] ${
                                                            item.type === 'thought' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/10 text-amber-800 dark:text-amber-100/80 italic font-serif rounded-tl-none' :
                                                            item.type === 'question' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-100 rounded-tl-none' :
                                                            item.type === 'answer' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-100 rounded-tr-none' :
                                                            item.type === 'discussion' ? 'bg-indigo-100 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-100' :
                                                            'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
                                                        }`}>
                                                            {/* Label */}
                                                            <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70 ${
                                                                item.type === 'thought' ? 'text-amber-600 dark:text-amber-500' :
                                                                item.type === 'question' ? 'text-indigo-600 dark:text-indigo-400' :
                                                                item.type === 'answer' ? 'text-emerald-600 dark:text-emerald-400' :
                                                                item.type === 'discussion' ? 'text-indigo-600 dark:text-indigo-300' :
                                                                'text-slate-500 dark:text-slate-400'
                                                            }`}>
                                                                {item.type === 'thought' ? 'Thinking' :
                                                                item.type === 'question' ? 'Asking' :
                                                                item.type === 'answer' ? 'Sales' :
                                                                item.type === 'discussion' ? 'Group Buzz' :
                                                                'Decision'}
                                                            </div>
                                                            {item.content}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-full flex items-center justify-center opacity-30">
                                                    {status === 'presentation' ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                                            <span className="text-[10px] text-indigo-500 dark:text-indigo-300">プレゼンを聴取中...</span>
                                                        </div>
                                                    ) : (
                                                        <Brain className="w-8 h-8 text-slate-400 dark:text-slate-500 animate-pulse" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Interaction Footer */}
                                        <div className="px-5 py-3 bg-slate-50 dark:bg-[#020617]/40 border-t border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium" title="質問数">
                                                    <MessageCircle className="w-3.5 h-3.5" /> 
                                                    <span className="font-mono">{personaState?.questionsAsked || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium" title="興味度">
                                                    <Activity className="w-3.5 h-3.5" />
                                                    <span className="font-mono">{personaState?.interestLevel || 50}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {personaState?.status === 'waiting' && <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-700 rounded-full" />}
                                                {personaState?.status === 'listening' && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 animate-pulse font-bold">聴取中...</span>}
                                                {personaState?.status === 'thinking' && <span className="text-[10px] text-amber-600 dark:text-amber-500 animate-pulse font-serif italic">思考中...</span>}
                                                {personaState?.status === 'asking' && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">質問中</span>}
                                                {personaState?.status === 'discussing' && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold animate-pulse flex items-center gap-1"><Users className="w-3 h-3" /> 議論中</span>}
                                                {personaState?.status === 'decided' && personaState.decision === 'buy' && <span className="text-emerald-500"><CheckCircle2 className="w-4 h-4" /></span>}
                                                {personaState?.status === 'reviewing' && <span className="text-[10px] text-yellow-600 dark:text-yellow-500 flex items-center gap-1 font-bold"><Star className="w-3 h-3 fill-current" /> 評価記入中</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

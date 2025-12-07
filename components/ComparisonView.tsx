
import React from 'react';
import { SimulationResult, PersonaProfile } from '../types';
import { ArrowRight, TrendingUp, TrendingDown, Minus, DollarSign, Target, Users, AlertTriangle } from 'lucide-react';

interface ComparisonViewProps {
  base: SimulationResult;
  target: SimulationResult;
  onClose: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ base, target, onClose }) => {
  
  const getDiff = (a: number, b: number) => {
      const diff = b - a;
      if (diff > 0) return <span className="text-emerald-500 dark:text-emerald-400 text-xs font-bold flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" />+{diff}</span>;
      if (diff < 0) return <span className="text-rose-500 dark:text-rose-400 text-xs font-bold flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" />{diff}</span>;
      return <span className="text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center"><Minus className="w-3 h-3 mr-0.5" />0</span>;
  };

  const getPrice = (p: string) => {
      // Very basic extraction, just returns string
      return p;
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#020617] overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    シミュレーション比較 (A/Bテスト)
                </h2>
                <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-xs font-bold transition-colors border border-slate-200 dark:border-white/10"
                >
                    比較を終了
                </button>
            </div>

            {/* Main Cards Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                
                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-[#020617] rounded-full flex items-center justify-center z-10 border border-slate-200 dark:border-white/10 shadow-xl">
                    <span className="font-black text-slate-400 dark:text-slate-500 italic">VS</span>
                </div>

                {/* Base (Left) */}
                <div className="glass-panel rounded-2xl overflow-hidden border-indigo-200 dark:border-indigo-500/20 shadow-lg dark:shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">現在の結果 (A)</div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{base.product.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{base.product.description}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> 価格</div>
                                <div className="text-lg font-mono text-slate-800 dark:text-white">{getPrice(base.product.price || '-')}</div>
                            </div>
                            <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> ターゲット</div>
                                <div className="text-xs text-slate-800 dark:text-white line-clamp-2">{base.product.targetHypothesis}</div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 dark:border-white/5 text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">受容率 (Acceptance Rate)</div>
                            <div className="text-6xl font-black text-slate-800 dark:text-white">{base.report.acceptanceRate}<span className="text-2xl text-slate-400 dark:text-slate-500 ml-1">%</span></div>
                        </div>

                         {/* Top Rejection Reasons */}
                         <div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 主な見送り理由</div>
                            <div className="flex flex-wrap gap-2">
                                {base.report.topRejectionReasons.slice(0, 3).map((r, i) => (
                                    <span key={i} className="px-2 py-1 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs rounded border border-rose-200 dark:border-rose-500/20">{r}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Target (Right) */}
                <div className="glass-panel rounded-2xl overflow-hidden border-slate-200 dark:border-indigo-500/20">
                     <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-widest">比較対象 (B)</div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{target.product.name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{target.product.description}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> 価格</div>
                                <div className="text-lg font-mono text-slate-800 dark:text-white">{getPrice(target.product.price || '-')}</div>
                            </div>
                             <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> ターゲット</div>
                                <div className="text-xs text-slate-800 dark:text-white line-clamp-2">{target.product.targetHypothesis}</div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 dark:border-white/5 text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">受容率 (Acceptance Rate)</div>
                            <div className="flex items-center justify-center gap-3">
                                <div className="text-6xl font-black text-slate-800 dark:text-white">{target.report.acceptanceRate}<span className="text-2xl text-slate-400 dark:text-slate-500 ml-1">%</span></div>
                                <div className="bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-300 dark:border-white/10">
                                    {getDiff(base.report.acceptanceRate, target.report.acceptanceRate)}
                                </div>
                            </div>
                        </div>

                        {/* Top Rejection Reasons */}
                         <div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 主な見送り理由</div>
                            <div className="flex flex-wrap gap-2">
                                {target.report.topRejectionReasons.slice(0, 3).map((r, i) => (
                                    <span key={i} className="px-2 py-1 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs rounded border border-rose-200 dark:border-rose-500/20">{r}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Persona Breakdown Comparison */}
            <div className="glass-panel rounded-2xl p-6 md:p-8">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" /> 仮想顧客(ペルソナ)別反応比較
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Breakdown */}
                      <div className="space-y-3">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                                <span>A: {base.product.name}</span>
                                <span>Buy: {base.report.acceptanceRate}%</span>
                            </div>
                            {base.personas.map(p => {
                                const decision = base.report.personaBreakdown.find(b => b.id === p.id)?.decision;
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor: p.avatarColor}}>{p.name[0]}</div>
                                            <span className="text-xs text-slate-700 dark:text-slate-200">{p.name} <span className="text-slate-400 dark:text-slate-500 text-[10px]">({p.occupation})</span></span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            decision === 'buy' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                        }`}>
                                            {decision?.toUpperCase()}
                                        </span>
                                    </div>
                                );
                            })}
                      </div>

                      {/* Right Breakdown */}
                       <div className="space-y-3">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                                <span>B: {target.product.name}</span>
                                <span>Buy: {target.report.acceptanceRate}%</span>
                            </div>
                            {target.personas.map(p => {
                                const decision = target.report.personaBreakdown.find(b => b.id === p.id)?.decision;
                                return (
                                    <div key={p.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor: p.avatarColor}}>{p.name[0]}</div>
                                            <span className="text-xs text-slate-700 dark:text-slate-200">{p.name} <span className="text-slate-400 dark:text-slate-500 text-[10px]">({p.occupation})</span></span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            decision === 'buy' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                        }`}>
                                            {decision?.toUpperCase()}
                                        </span>
                                    </div>
                                );
                            })}
                      </div>
                 </div>
            </div>

        </div>
    </div>
  );
};

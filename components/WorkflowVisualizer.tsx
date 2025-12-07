
import React from 'react';
import { Users, Megaphone, Activity, FileText, Check, Loader2, Play, MessageCircle } from 'lucide-react';
import { useSimulationContext } from '../contexts/SimulationContext';

export const WorkflowVisualizer: React.FC = () => {
  const { state } = useSimulationContext();
  const { status, progress, logs } = state;
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : undefined;

  const steps = [
    { id: 'casting', label: 'キャスティング', icon: Users },
    { id: 'presentation', label: 'プレゼン', icon: Megaphone },
    { id: 'simulation_running', label: '対話実験', icon: Play },
    { id: 'discussion', label: 'グループ討議', icon: MessageCircle },
    { id: 'analyzing', label: '分析', icon: Activity },
    { id: 'completed', label: 'レポート', icon: FileText },
  ];

  const getCurrentStepIndex = () => {
      if (status === 'idle') return -1;
      const order = ['casting', 'presentation', 'simulation_running', 'discussion', 'analyzing', 'completed'];
      return order.indexOf(status);
  };

  const activeIndex = getCurrentStepIndex();
  
  // Determine placeholder text if no log is available yet but simulation is running
  const getStatusPlaceholder = () => {
      switch(status) {
          case 'casting': return 'ペルソナ選定中...';
          case 'presentation': return 'プレゼンテーション生成中...';
          case 'simulation_running': return 'シミュレーション実行中...';
          case 'discussion': return 'グループ討議中 (同期)...';
          case 'analyzing': return 'データ集計中...';
          default: return '開始待機中...';
      }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pt-24 lg:pt-8 pb-4 lg:pb-6 px-4 relative">
        
        {/* Compact Steps */}
        <div className="w-full max-w-4xl flex justify-between items-center relative mb-8 lg:mb-12 px-4 lg:px-8">
            {/* Connecting Line Background */}
            <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-white/5 -z-10 -translate-y-1/2 rounded-full"></div>
            
            {/* Active Progress Line */}
            <div className="absolute top-1/2 left-8 h-[2px] -z-10 -translate-y-1/2 rounded-full overflow-hidden transition-all duration-1000 ease-out" style={{ width: `calc(${progress}% - 4rem)` }}>
                 <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 animate-shimmer bg-[length:200%_100%] shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            </div>

            {steps.map((step, idx) => {
                const isActive = idx === activeIndex;
                const isCompleted = idx < activeIndex;
                
                return (
                    <div key={step.id} className="flex flex-col items-center group relative">
                        {/* Node Circle */}
                        <div className={`
                            relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-all duration-500 z-10
                            ${isActive 
                                ? 'bg-indigo-900 border-indigo-400 scale-110 shadow-[0_0_20px_rgba(99,102,241,0.5)] text-white' 
                                : isCompleted 
                                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400' 
                                    : 'bg-[#0f172a] border-white/10 text-slate-700'}
                        `}>
                            {/* Inner Glow for active */}
                            {isActive && <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>}
                            
                            {isCompleted ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <step.icon className={`w-3 h-3 md:w-4 md:h-4`} />}
                        </div>
                        
                        {/* Label */}
                        <span className={`
                            absolute -bottom-6 md:-bottom-7 text-[8px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-500
                            ${isActive 
                                ? 'text-indigo-300 translate-y-0 opacity-100' 
                                : isCompleted 
                                    ? 'text-emerald-500/50 translate-y-0 opacity-80' 
                                    : 'text-slate-800 translate-y-1 opacity-0'}
                        `}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>

        {/* Floating Log Stream */}
        <div className="w-full max-w-3xl h-10 lg:h-12 relative group">
             <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl flex items-center justify-center px-4 lg:px-6 transition-all group-hover:bg-[#0f172a] group-hover:border-white/20 hover:scale-[1.01]">
                {lastLog ? (
                    <div key={lastLog.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 lg:gap-4 overflow-hidden w-full">
                        <div className={`shrink-0 flex items-center gap-2 text-[9px] lg:text-[10px] font-mono uppercase border-r border-white/10 pr-2 lg:pr-3 py-1 ${
                             lastLog.personaId === 'SYSTEM' ? 'text-slate-500' :
                             lastLog.personaId === 'SALES' ? 'text-indigo-400' :
                             lastLog.personaId === 'ANALYST' ? 'text-purple-400' :
                             lastLog.personaId === 'MODERATOR' ? 'text-amber-400' :
                             'text-emerald-400'
                        }`}>
                            {status !== 'completed' && <Loader2 className="w-3 h-3 animate-spin opacity-70" />}
                            <span className="font-bold tracking-wider">
                                {lastLog.personaId === 'SYSTEM' ? 'SYSTEM' : 
                                 lastLog.personaId === 'SALES' ? 'SALES' : 
                                 lastLog.personaId === 'ANALYST' ? 'ANALYST' : 
                                 lastLog.personaId === 'MODERATOR' ? 'MODERATOR' : 
                                 'AGENT'}
                            </span>
                        </div>
                        <p className="text-[10px] lg:text-xs text-slate-300 truncate font-medium flex-1 text-left">
                            {lastLog.content}
                        </p>
                    </div>
                ) : (
                    <span className="text-[10px] lg:text-[11px] text-slate-500 italic flex items-center gap-2 animate-pulse">
                        {status !== 'idle' && status !== 'completed' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {getStatusPlaceholder()}
                    </span>
                )}
             </div>
        </div>
    </div>
  );
};

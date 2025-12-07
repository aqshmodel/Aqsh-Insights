
import React, { useEffect, useRef } from 'react';
import { SimulationLog } from '../types';
import { MessageSquare, Zap, Activity, Info, User } from 'lucide-react';

interface SimulationFeedProps {
  logs: SimulationLog[];
}

export const SimulationFeed: React.FC<SimulationFeedProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (type: string) => {
      switch(type) {
          case 'thought': return <Zap className="w-3 h-3 text-amber-400" />;
          case 'dialogue': return <MessageSquare className="w-3 h-3 text-indigo-400" />;
          case 'action': return <Activity className="w-3 h-3 text-emerald-400" />;
          default: return <Info className="w-3 h-3 text-slate-400" />;
      }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
        <div className="p-4 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                ライブログ
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-black/20 px-2 py-0.5 rounded-full border border-white/5">{logs.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#020617]/20">
            {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-3 opacity-50">
                    <Activity className="w-8 h-8" />
                    <span className="text-xs italic">データ受信待機中...</span>
                </div>
            )}
            
            {logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs animate-in fade-in slide-in-from-left-2 duration-500 group">
                    <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                        log.type === 'thought' ? 'bg-amber-950/30 border-amber-500/20' : 
                        log.type === 'dialogue' ? 'bg-indigo-950/30 border-indigo-500/20' :
                        log.type === 'action' ? 'bg-emerald-950/30 border-emerald-500/20' :
                        'bg-slate-800/50 border-white/5'
                    }`}>
                        {getIcon(log.type)}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                             <span className={`font-bold tracking-wide text-[10px] uppercase ${
                                 log.personaId === 'SYSTEM' ? 'text-slate-500' :
                                 log.personaId === 'SALES' ? 'text-indigo-300' :
                                 log.personaId === 'ANALYST' ? 'text-purple-300' :
                                 'text-slate-200'
                             }`}>
                                 {log.personaId === 'SYSTEM' ? 'SYSTEM' : 
                                  log.personaId === 'SALES' ? 'SALES AI' :
                                  log.personaId === 'ANALYST' ? 'ANALYST' :
                                  log.personaId.startsWith('persona') ? `Persona ${log.personaId.split('_')[1]}` : log.personaId}
                             </span>
                             <span className="text-[9px] text-slate-700 font-mono">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                        <p className={`leading-relaxed text-[11px] ${
                            log.type === 'thought' ? 'text-amber-200/60 italic' : 
                            log.type === 'action' ? 'text-emerald-200/80 font-medium' : 
                            'text-slate-400'
                        }`}>
                            {log.content}
                        </p>
                    </div>
                </div>
            ))}
            <div ref={endRef} />
        </div>
    </div>
  );
};

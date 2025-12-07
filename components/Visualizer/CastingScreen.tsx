
import React from 'react';
import { Scan, Users, Cpu, Radio } from 'lucide-react';

interface CastingScreenProps {
    count: number;
}

export const CastingScreen: React.FC<CastingScreenProps> = ({ count }) => {
    // Keep Casting Screen Dark/Cinematic even in light mode
    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 animate-in fade-in duration-1000 bg-[#020617] absolute inset-0 z-50">
            <div className="relative mb-12">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse-slow"></div>
                <div className="w-24 h-24 rounded-full border-2 border-indigo-500/30 flex items-center justify-center relative bg-[#0f172a]/50 backdrop-blur-md">
                    <Scan className="w-10 h-10 text-indigo-400 animate-pulse" />
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 border border-t-indigo-500/80 border-r-transparent border-b-indigo-500/30 border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute -inset-2 border border-r-cyan-500/80 border-t-transparent border-l-cyan-500/30 border-b-transparent rounded-full animate-spin duration-[3s]"></div>
                </div>
            </div>

            <div className="text-center space-y-4 max-w-md">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                    <span className="animate-pulse">市場環境をスキャン中...</span>
                </h2>
                <div className="space-y-1">
                    <p className="text-indigo-300 text-xs font-bold tracking-widest">
                        {count}名の仮想顧客を生成しています...
                    </p>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-[shimmer_1.5s_infinite] w-[30%] rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Persona Slots Visualizer */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12 w-full max-w-4xl">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center relative overflow-hidden animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent opacity-50"></div>
                        <Users className="w-6 h-6 text-slate-600 mb-2" />
                        <div className="w-12 h-1 bg-slate-700 rounded-full mb-1"></div>
                        <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
                        
                        {/* Scanning Line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-[scan_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.2}s` }}></div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-4 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><Cpu className="w-3 h-3"/> AI処理中</span>
                <span className="flex items-center gap-1"><Radio className="w-3 h-3"/> リアルタイム検索</span>
            </div>
        </div>
    );
};

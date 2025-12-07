
import React from 'react';
import { Users, Sparkles, Search, Activity, LayoutDashboard, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
    onOpenSidebar: () => void;
    isSidebarOpen: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenSidebar, isSidebarOpen }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-1000 p-8">
            <div className="relative group cursor-default">
                <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition duration-1000 animate-pulse-slow"></div>
                <div className="relative w-48 h-48 bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3">
                    <Users className="w-20 h-20 text-indigo-500 dark:text-indigo-400 drop-shadow-[0_0_25px_rgba(99,102,241,0.6)]" />
                    
                    {/* Orbiting Icons */}
                    <div className="absolute top-0 right-0 p-3 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/10 shadow-lg animate-bounce delay-75">
                        <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div className="absolute bottom-4 left-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/10 shadow-lg animate-bounce delay-300">
                        <Search className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div className="absolute top-1/2 -left-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/10 shadow-lg animate-pulse delay-500">
                        <Activity className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    </div>
                </div>
            </div>
            
            <div className="space-y-6 max-w-lg px-4 relative">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-indigo-800 to-slate-600 dark:from-white dark:via-indigo-100 dark:to-slate-500 tracking-tight mb-2">
                        Aqsh Insights
                    </h2>
                    <p className="text-lg font-medium text-indigo-600 dark:text-indigo-300/80 tracking-widest uppercase text-[10px]">AI Market Simulator</p>
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed font-light">
                    サイドバーで商品コンセプトを定義し、<br/>AIによる仮想顧客(ペルソナ)との市場シミュレーションを開始してください。
                </p>
                
                {!isSidebarOpen && (
                    <button 
                        onClick={onOpenSidebar}
                        className="mt-8 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto animate-in fade-in slide-in-from-bottom-4 delay-500 cursor-pointer"
                    >
                        <LayoutDashboard className="w-5 h-5" /> 
                        <span>設定を開く</span>
                        <ArrowRight className="w-4 h-4 opacity-50" />
                    </button>
                )}
            </div>
        </div>
    );
};

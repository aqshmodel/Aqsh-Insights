
import React, { useRef, useState } from 'react';
import { Sparkles, Sun, Moon, PanelLeftClose, Settings, History, ChevronDown, Play, Loader2, X } from 'lucide-react';
import { SettingsForm } from './SettingsForm';
import { HistoryList } from '../HistoryList';
import { SimulationHistoryItem } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useSimulationContext } from '../../contexts/SimulationContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    // History props still passed from App for now as they are "Global/Persisted" outside of single simulation session
    historyItems: SimulationHistoryItem[];
    onLoadHistory: (item: SimulationHistoryItem) => void;
    onDeleteHistory: (id: string) => void;
    onCompareHistory: (item: SimulationHistoryItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    setIsOpen,
    historyItems,
    onLoadHistory,
    onDeleteHistory,
    onCompareHistory
}) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { state, actions } = useSimulationContext();
    const { productInput, status, result } = state;
    const { startSimulation, resetSimulation } = actions;

    const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
    const [showTemplates, setShowTemplates] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(true);
    const sidebarContentRef = useRef<HTMLDivElement>(null);

    const handleSidebarScroll = () => {
        if (sidebarContentRef.current) {
            const scrollTop = sidebarContentRef.current.scrollTop;
            if (scrollTop > 20) {
                setShowScrollHint(false);
            } else {
                setShowScrollHint(true);
            }
        }
    };

    return (
        <div 
            className={`
                fixed lg:relative inset-y-0 left-0 z-50 h-full flex flex-col glass-panel border-r border-slate-200 dark:border-white/5
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] 
                bg-white/95 dark:bg-[#0f172a]/90 backdrop-blur-2xl shadow-2xl dark:shadow-[20px_0_50px_rgba(0,0,0,0.5)]
                ${isOpen 
                    ? 'translate-x-0 w-full lg:w-[360px]' 
                    : '-translate-x-full lg:w-0 lg:-translate-x-full lg:opacity-0 lg:pointer-events-none'
                }
            `}
        >
            {/* Sidebar Header */}
            <div className="p-6 pb-2 min-w-0 shrink-0 relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20 shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none mb-1 truncate">Aqsh Insights</h1>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium tracking-wide uppercase opacity-80">AI Market Simulator</p>
                    </div>
                </div>
                
                {/* Header Actions: Theme Toggle & Close */}
                <div className="absolute top-8 right-6 flex items-center gap-2">
                    <button 
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title={isDarkMode ? "ライトモードに切替" : "ダークモードに切替"}
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl mb-4 border border-slate-200 dark:border-white/5">
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'settings' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg ring-1 ring-slate-200 dark:ring-0' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <Settings className="w-3.5 h-3.5" /> 設定
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'history' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg ring-1 ring-slate-200 dark:ring-0' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" /> 履歴
                    </button>
                </div>
            </div>
            
            {/* Sidebar Content */}
            <div 
                className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar min-h-0"
                ref={sidebarContentRef}
                onScroll={handleSidebarScroll}
            >
                
                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <SettingsForm 
                        showTemplates={showTemplates}
                        setShowTemplates={setShowTemplates}
                    />
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <HistoryList 
                        items={historyItems}
                        currentResultId={result?.report ? 'temp' : undefined}
                        onSelect={onLoadHistory}
                        onDelete={onDeleteHistory}
                        onCompare={onCompareHistory}
                        isCompareEnabled={!!result}
                    />
                )}
                
                <div className="h-8"></div>
            </div>

            {/* Scroll Hint Arrow (Mobile Only) */}
            <div className={`lg:hidden absolute bottom-28 left-0 right-0 flex justify-center pointer-events-none z-30 transition-opacity duration-300 ${showScrollHint ? 'opacity-80 animate-bounce' : 'opacity-0'}`}>
                <div className="bg-white/90 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 p-2 rounded-full border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-sm">
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md min-w-0 shrink-0 z-20">
                {status === 'idle' || status === 'completed' || status === 'error' ? (
                    <button 
                        onClick={startSimulation}
                        disabled={!productInput.name || !productInput.description}
                        className="group relative w-full overflow-hidden rounded-xl bg-indigo-600 p-[1px] shadow-lg dark:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#312E81_50%,#E2E8F0_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-3xl transition-all group-hover:bg-indigo-600">
                            <Play className="mr-2 h-4 w-4 fill-current transition-transform group-hover:scale-125" />
                            シミュレーション開始
                        </span>
                    </button>
                ) : (
                    <button disabled className="w-full py-3.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-wait">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span>実行中...</span>
                        {/* Add Reset Button for stuck state */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); if(confirm('シミュレーションを強制停止しますか？')) resetSimulation(); }}
                            className="ml-2 p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-full transition-colors z-10"
                            title="強制リセット"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </button>
                )}
            </div>
        </div>
    );
};

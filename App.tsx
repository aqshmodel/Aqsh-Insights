
import React, { useState, useEffect } from 'react';
import { SimulationHistoryItem, SimulationResult, ImprovementPlan } from './types';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { ReportView } from './components/PreviewFrame';
import { PersonaModal } from './components/PersonaModal';
import { ComparisonView } from './components/ComparisonView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ImprovementModal } from './components/ImprovementModal';
import { getHistory, deleteHistoryItem } from './services/historyService';
import { generatePDF } from './services/pdfService';
import { PanelLeftOpen, FileText, Download, Copy, Check, RotateCcw, BarChart2, LayoutDashboard, Sparkles, Printer, Loader2, Users } from 'lucide-react';
import { CastingScreen } from './components/Visualizer/CastingScreen';
import { EmptyState } from './components/Dashboard/EmptyState';
import { TokenCounter } from './components/Layout/TokenCounter';
import { Sidebar } from './components/Sidebar/Sidebar';
import { PersonaGrid } from './components/Dashboard/PersonaGrid';
import { useTheme } from './contexts/ThemeContext';
import { useSimulationContext } from './contexts/SimulationContext';

function App() {
  const { isDarkMode } = useTheme();
  const { state, actions } = useSimulationContext();
  const { status, result, personas, consumerStates, productInput, salesPitch } = state;
  const { resetSimulation, restoreState, runInterview, generatePlan } = actions;

  // History State (Maintained here as it's outside of a single simulation session)
  const [historyItems, setHistoryItems] = useState<SimulationHistoryItem[]>([]);
  
  // UI State
  const [comparisonTarget, setComparisonTarget] = useState<SimulationResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'report' | 'dashboard' | 'comparison' | 'analytics'>('report');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Improvement Plan State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [improvementPlan, setImprovementPlan] = useState<ImprovementPlan | null>(null);
  
  // Load history on mount and when status changes to completed (to refresh list)
  useEffect(() => {
      setHistoryItems(getHistory());
  }, [status]); // Reload history when simulation completes

  const handleLoadHistory = (item: SimulationHistoryItem) => {
      restoreState(item.result, item.result.consumerStates);
      setViewMode('report');
      setComparisonTarget(null);
      setImprovementPlan(null);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleCompare = (item: SimulationHistoryItem) => {
      if (!result) return;
      setComparisonTarget(item.result);
      setViewMode('comparison');
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleDeleteHistory = (id: string) => {
      if (window.confirm('この履歴を削除しますか？')) {
          setHistoryItems(deleteHistoryItem(id));
      }
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    let fullContent = result.report.markdown;
    fullContent += "\n\n---\n\n# Detailed Simulation Logs\n";
    fullContent += "以下は、各仮想顧客（ペルソナ）ごとのシミュレーション詳細ログです。\n\n";

    result.personas.forEach(p => {
         const personaState = consumerStates[p.id];
         if (!personaState) return;

         fullContent += `## Persona: ${p.name}\n`;
         fullContent += `- **Attribute**: ${p.age}歳 / ${p.gender} / ${p.occupation}\n`;
         fullContent += `- **Traits**: ${p.traits.join(', ')}\n`;
         fullContent += `- **Decision**: **${personaState.decision ? personaState.decision.toUpperCase() : 'PENDING'}**\n`;
         if (personaState.decisionReason) {
             fullContent += `- **Reason**: ${personaState.decisionReason}\n`;
         }
         fullContent += "\n### Interaction History\n";

         const filteredHistory = personaState.interactionHistory.filter(h => 
             !h.content.includes('他の参加者の意見を聞いています') &&
             !h.content.includes('待機中')
         );

         filteredHistory.forEach(item => {
            const time = new Date(item.timestamp).toLocaleTimeString();
            let prefix = item.type;
            fullContent += `- [${time}] **${prefix}**: ${item.content.replace(/\n/g, ' ')}\n`;
         });
         fullContent += "\n---\n\n";
    });

    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aqsh_Report_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
      if (!result || isGeneratingPdf) return;
      setIsGeneratingPdf(true);
      try {
          await generatePDF(result, consumerStates);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingPdf(false);
      }
  };

  const handleGeneratePlan = async () => {
      if (!result || isGeneratingPlan || !salesPitch) return;
      setIsGeneratingPlan(true);
      try {
          const plan = await generatePlan();
          if (plan) {
              setImprovementPlan(plan);
          } else {
              alert("改善案の生成に必要なデータが不足しています。");
          }
      } catch (e) {
          console.error("Plan Generation Failed", e);
          alert("改善案の生成に失敗しました。時間をおいて再試行してください。");
      } finally {
          setIsGeneratingPlan(false);
      }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.report.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPersona = selectedPersonaId ? personas.find(p => p.id === selectedPersonaId) : null;
  const selectedPersonaState = selectedPersonaId ? consumerStates[selectedPersonaId] : undefined;
  const selectedPersonaReview = result?.reviews.find(r => r.personaId === selectedPersonaId);

  return (
    <div className={`flex h-[100dvh] w-full font-sans overflow-hidden relative selection:bg-indigo-500/30 ${isDarkMode ? 'dark bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Cinematic Background (Dark Only) */}
      <div className="fixed inset-0 -z-30 bg-[#020617] opacity-0 dark:opacity-100 transition-opacity duration-500" />
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none opacity-0 dark:opacity-40 transition-opacity duration-500">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
          <div className="absolute top-[10%] right-[-20%] w-[900px] h-[900px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>
      <div className="fixed inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />

      {/* Global Sidebar Toggle */}
      <div className={`fixed top-4 left-4 lg:top-6 lg:left-6 z-[60] transition-all duration-300 ${isSidebarOpen ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'}`}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-indigo-600 text-slate-500 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-xl shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 group cursor-pointer hover:scale-110 active:scale-95 ring-1 ring-white/5"
            title="サイドバーを開く"
          >
              <PanelLeftOpen className="w-5 h-5 transition-transform" />
          </button>
      </div>

      {/* Modal Layer */}
      {selectedPersona && selectedPersonaState && (
          <PersonaModal 
            persona={selectedPersona} 
            state={selectedPersonaState} 
            review={selectedPersonaReview} 
            pitch={salesPitch}
            productPrice={productInput.price} // Pass input price for comparison
            onClose={() => setSelectedPersonaId(null)}
            onChat={(question) => runInterview(selectedPersona.id, question)}
          />
      )}

      {/* Improvement Plan Modal */}
      {improvementPlan && (
          <ImprovementModal 
            plan={improvementPlan} 
            onClose={() => setImprovementPlan(null)} 
          />
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
          <div 
              className="fixed inset-0 bg-black/60 z-[45] lg:hidden backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* Sidebar Component */}
      <Sidebar 
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          // History props
          historyItems={historyItems}
          onLoadHistory={handleLoadHistory}
          onDeleteHistory={handleDeleteHistory}
          onCompareHistory={handleCompare}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 h-full">
        
        {/* Token Counter Overlay (Visible when not idle) */}
        {status !== 'idle' && (
            <TokenCounter />
        )}

        {/* COMPARISON VIEW */}
        {viewMode === 'comparison' && result && comparisonTarget ? (
             <ComparisonView 
                base={result}
                target={comparisonTarget}
                onClose={() => setViewMode('report')}
             />
        ) : (
            <>
                {/* Header / Visualizer Section */}
                <div className="shrink-0 w-full bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 relative z-30">
                    {status !== 'idle' && (
                        <WorkflowVisualizer />
                    )}
                    
                    {/* Results Header */}
                    {status === 'completed' && result && (
                        <div className="h-16 flex items-center justify-between px-4 lg:px-10 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-2 lg:gap-3 pl-8 lg:pl-0">
                                <div className="hidden sm:block p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                    {viewMode === 'report' ? <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : 
                                     viewMode === 'analytics' ? <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : 
                                     <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                </div>
                                <h2 className="font-bold text-slate-800 dark:text-white tracking-tight text-sm lg:text-base">
                                    {viewMode === 'report' ? '分析レポート' : viewMode === 'analytics' ? '分析ダッシュボード' : 'シミュレーション詳細'}
                                </h2>
                            </div>

                            <div className="flex items-center gap-2 lg:gap-4">
                                {/* Improvement Plan Button (New) - Only visible in report/analytics mode */}
                                {(viewMode === 'report' || viewMode === 'analytics') && (
                                    <button 
                                        onClick={handleGeneratePlan}
                                        disabled={isGeneratingPlan}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="購入率100%を目指すための改善企画書を生成"
                                    >
                                        {isGeneratingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">改善案を生成 (β)</span>
                                    </button>
                                )}

                                {/* Report Actions - Only visible in report mode */}
                                {viewMode === 'report' && (
                                    <div className="flex items-center gap-1 lg:gap-2 mr-0 lg:mr-2">
                                        <button 
                                            onClick={handleCopy} 
                                            className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-200 hover:text-indigo-800 dark:hover:text-white bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 rounded-lg transition-all"
                                            title="Markdownをコピー"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span className="hidden sm:inline">コピー</span>
                                        </button>
                                        <button 
                                            onClick={handleDownloadMarkdown} 
                                            className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg transition-all"
                                            title="Markdownをダウンロード"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Markdown</span>
                                        </button>
                                         <button 
                                            onClick={handleDownloadPDF} 
                                            disabled={isGeneratingPdf}
                                            className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-300 hover:text-rose-800 dark:hover:text-white bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 rounded-lg transition-all disabled:opacity-50"
                                            title="レポート印刷/PDF"
                                        >
                                            {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                                            <span className="hidden sm:inline">レポート印刷/PDF</span>
                                        </button>
                                    </div>
                                )}

                                {/* View Toggle */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-white/10 shrink-0">
                                    <button
                                        onClick={() => setViewMode('report')}
                                        className={`px-3 lg:px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'report' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                        title="レポート"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="hidden lg:inline">レポート</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('analytics')}
                                        className={`px-3 lg:px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'analytics' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                        title="分析"
                                    >
                                        <BarChart2 className="w-3.5 h-3.5" />
                                        <span className="hidden lg:inline">分析</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('dashboard')}
                                        className={`px-3 lg:px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm dark:shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'}`}
                                        title="詳細ログ"
                                    >
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        <span className="hidden lg:inline">詳細ログ</span>
                                    </button>
                                </div>
                                
                                <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-white/10 mx-2" />

                                <button 
                                    onClick={() => resetSimulation()} 
                                    className="hidden lg:flex px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all items-center gap-2 border border-slate-200 dark:border-white/10 cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" /> 新規調査
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-hidden relative">
                    
                    {/* Empty State (Hero) */}
                    {status === 'idle' && (
                        <EmptyState 
                            onOpenSidebar={() => setIsSidebarOpen(true)}
                            isSidebarOpen={isSidebarOpen}
                        />
                    )}

                    {/* CASTING VISUALS */}
                    {status === 'casting' && (
                         <CastingScreen count={productInput.personaCount} />
                    )}

                    {/* Results View: Report */}
                    {status === 'completed' && result && viewMode === 'report' && (
                        <div className="w-full h-full relative">
                            <ReportView report={result.report} pitch={result.pitch} />
                        </div>
                    )}

                    {/* Results View: Analytics Dashboard */}
                    {status === 'completed' && result && viewMode === 'analytics' && (
                        <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 md:p-12 relative pb-20">
                            <div className="max-w-6xl mx-auto">
                                <AnalyticsDashboard result={result} consumerStates={consumerStates} />
                            </div>
                        </div>
                    )}

                    {/* Simulation Dashboard (Persona Grid) */}
                    {((status === 'completed' && viewMode === 'dashboard') || status === 'presentation' || status === 'simulation_running' || status === 'discussion' || status === 'analyzing') && (
                        <PersonaGrid 
                            onSelectPersona={setSelectedPersonaId}
                        />
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
}

export default App;


import React, { useEffect, useRef } from 'react';
import { AnalysisReport, SalesPitchData } from '../types';
import { marked } from 'marked';
import { AlertTriangle, Megaphone, Check } from 'lucide-react';

interface ReportViewProps {
  report: AnalysisReport;
  pitch?: SalesPitchData;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, pitch }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && report.markdown) {
        containerRef.current.innerHTML = marked.parse(report.markdown) as string;
    }
  }, [report]);

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 md:p-12 relative pb-96">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Sales Strategy Card */}
        {pitch && (
            <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <div className="bg-indigo-900/20 p-5 border-b border-indigo-500/20 flex items-center gap-3">
                    <Megaphone className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">生成されたセールス戦略</h3>
                </div>
                <div className="p-8">
                    <h4 className="text-2xl font-bold text-white mb-4 leading-tight">{pitch.catchCopy}</h4>
                    <p className="text-slate-400 text-base leading-relaxed mb-6 border-l-2 border-indigo-500/50 pl-4">{pitch.description}</p>
                    <div className="flex flex-wrap gap-3">
                        {pitch.keyBenefits.map((b, i) => (
                            <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/20">
                                <Check className="w-3 h-3" /> {b}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Main Report */}
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
            {/* KPI Header */}
            <div className="bg-slate-900/50 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-white/5">
                <div className="text-center border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">受容率 (購入意向)</div>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-600 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{report.acceptanceRate}%</div>
                    <div className="text-xs text-slate-500 mt-2">購入意向</div>
                </div>
                <div className="col-span-2 flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">主な見送り理由</div>
                    <div className="flex flex-wrap gap-2">
                        {report.topRejectionReasons.map((reason, i) => (
                            <span key={i} className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-lg text-xs font-bold flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" /> {reason}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Markdown Content */}
            <div className="p-10 md:p-14 bg-gradient-to-b from-[#0f172a] to-[#050b14]">
                <div 
                    ref={containerRef}
                    className="markdown-body prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-4 prose-h2:mt-12 prose-h2:text-white prose-p:text-slate-400 prose-li:text-slate-400 prose-strong:text-indigo-300"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

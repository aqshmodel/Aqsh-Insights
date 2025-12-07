
import React, { useState } from 'react';
import { ImprovementPlan } from '../types';
import { X, Target, DollarSign, Check, Zap, Sparkles, TrendingUp, Copy, CheckCircle2, FileText, Rocket, PlayCircle, Award } from 'lucide-react';

interface ImprovementModalProps {
  plan: ImprovementPlan;
  onClose: () => void;
}

export const ImprovementModal: React.FC<ImprovementModalProps> = ({ plan, onClose }) => {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
      let md = `
# ${plan.title}
> ${plan.catchCopy}

## 1. エグゼクティブサマリー
${plan.executiveSummary}

## 2. 本サービスが解決する課題
${plan.problemSolution}

## 3. 提供サービスと料金プラン
${plan.serviceAndPricing}
      `.trim();

      // Dynamic Sections
      plan.dynamicSections.forEach((section, index) => {
          md += `\n\n## ${3 + index + 1}. ${section.title}\n${section.content}`;
      });

      // Simulation & Conclusion
      md += `\n\n## ${3 + plan.dynamicSections.length + 1}. 導入シミュレーション\n${plan.simulation}`;
      md += `\n\n## ${3 + plan.dynamicSections.length + 2}. 結論\n${plan.conclusion}`;

      return md;
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 border border-indigo-500/20">
        
        {/* Header */}
        <div className="relative shrink-0 p-6 md:p-8 bg-gradient-to-r from-indigo-900 to-violet-900 text-white overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-white" />
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-all border border-white/20 backdrop-blur-sm"
                    title="Markdown形式でコピー"
                >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'コピー完了' : '企画書をコピー'}
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="relative z-10 pt-2">
                <div className="flex items-center gap-2 mb-3 text-indigo-300 font-bold text-xs uppercase tracking-widest">
                    <Rocket className="w-4 h-4" />
                    新規事業企画書
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 leading-tight">
                    {plan.title}
                </h2>
                <p className="text-sm md:text-base text-indigo-100 font-medium opacity-90 border-l-2 border-indigo-400/50 pl-3">
                    {plan.catchCopy}
                </p>
            </div>
        </div>

        {/* Content - Single Column Layout */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-[#0b1121]">
            
            {/* 1. Executive Summary */}
            <div className="bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    1. エグゼクティブサマリー
                </h3>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium text-sm md:text-base">
                    {plan.executiveSummary}
                </p>
            </div>

            {/* 2. Problem & Solution */}
            <section>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" /> 2. 本サービスが解決する課題
                </h3>
                <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-slate-200 dark:border-white/5">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {plan.problemSolution}
                    </p>
                </div>
            </section>

            {/* 3. Service & Pricing */}
            <section>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> 3. 提供サービスと料金プラン
                </h3>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {plan.serviceAndPricing}
                    </p>
                </div>
            </section>

            {/* 4 & 5. Dynamic Sections */}
            {plan.dynamicSections.map((section, index) => (
                <section key={index}>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-rose-500" /> {4 + index}. {section.title}
                    </h3>
                    <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {section.content}
                        </p>
                    </div>
                </section>
            ))}

            {/* 6. Simulation */}
            <section>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-blue-500" /> {4 + plan.dynamicSections.length}. 導入シミュレーション
                </h3>
                <div className="bg-blue-50 dark:bg-blue-500/10 p-5 rounded-xl border border-blue-200 dark:border-blue-500/20">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {plan.simulation}
                    </p>
                </div>
            </section>

            {/* 7. Conclusion */}
            <section>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> {4 + plan.dynamicSections.length + 1}. 結論
                </h3>
                <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-slate-200 dark:border-white/5">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {plan.conclusion}
                    </p>
                </div>
            </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0b1121] border-t border-slate-200 dark:border-white/5 flex justify-end">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-slate-900 font-bold rounded-xl transition-all shadow-lg"
            >
                閉じる
            </button>
        </div>
      </div>
    </div>
  );
};

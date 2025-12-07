
import React, { useState, useRef, useEffect } from 'react';
import { PersonaProfile, ConsumerState, ReviewData, SalesPitchData, InteractionItem } from '../types';
import { X, User, DollarSign, Heart, AlertCircle, MessageCircle, Star, Quote, Activity, Brain, Megaphone, Check, ChevronDown, ChevronUp, History, Home, Smartphone, Globe, Smile, Lightbulb, HelpCircle, Send, Loader2, Mic, Users, Wallet, ArrowUpCircle, BarChart2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface PersonaModalProps {
  persona: PersonaProfile;
  state?: ConsumerState;
  review?: ReviewData;
  pitch?: SalesPitchData;
  productPrice?: string; // Added to calculate gap
  onClose: () => void;
  onChat?: (question: string) => Promise<void>;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({ persona, state, review, pitch, productPrice, onClose, onChat }) => {
  const [showPitch, setShowPitch] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when history updates
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state?.interactionHistory]);

  if (!state) return null;

  // Parse product price for comparison
  const getNumericPrice = (p: string | undefined) => {
      if (!p) return 0;
      const match = p.replace(/,/g, '').match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
  };
  
  const askingPrice = getNumericPrice(productPrice);
  const wtp = state.willingnessToPay || 0;
  const isWtpLow = askingPrice > 0 && wtp < askingPrice;

  // Format Score Data for Radar Chart
  const scoreData = state.detailedScore ? [
      { subject: '魅力度', A: state.detailedScore.appeal, fullMark: 5 },
      { subject: '新規性', A: state.detailedScore.novelty, fullMark: 5 },
      { subject: '理解度', A: state.detailedScore.clarity, fullMark: 5 },
      { subject: '関連性', A: state.detailedScore.relevance, fullMark: 5 },
      { subject: 'コスパ', A: state.detailedScore.value, fullMark: 5 },
  ] : [];

  const handleSendChat = async () => {
      if (!chatInput.trim() || !onChat || isChatting) return;
      
      setIsChatting(true);
      const question = chatInput;
      setChatInput(""); // Clear immediately
      
      try {
          await onChat(question);
      } catch (e) {
          console.error("Chat failed", e);
          // Ideally restore input or show error
      } finally {
          setIsChatting(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendChat();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Glass Modal */}
      <div className="w-full max-w-5xl h-[100dvh] sm:h-[85vh] overflow-hidden flex flex-col relative z-10 rounded-none sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 duration-300 bg-white/95 dark:bg-[#0f172a]/90 backdrop-blur-xl">
        
        {/* Header */}
        <div className="relative h-24 md:h-32 shrink-0 overflow-hidden border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-indigo-100 to-slate-100 dark:from-slate-900 dark:via-indigo-900/20 dark:to-slate-900" />
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white rounded-full transition-colors z-20 border border-slate-200 dark:border-white/5"
            >
                <X className="w-5 h-5" />
            </button>
            
            <div className="absolute inset-0 flex items-center px-6 md:px-8 gap-4 md:gap-6 z-10">
                <div 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-white/40 dark:border-white/10 shadow-xl flex items-center justify-center text-2xl md:text-3xl font-bold text-white relative overflow-hidden shrink-0"
                    style={{ backgroundColor: persona.avatarColor }}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                    {persona.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 md:gap-3 tracking-tight truncate">
                        {persona.name}
                        {state.decision && (
                            <span className={`px-2 md:px-2.5 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full border shadow-sm ${
                                state.decision === 'buy' 
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' 
                                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                            }`}>
                                {state.decision === 'buy' ? 'BUY' : 'PASS'}
                            </span>
                        )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {persona.age}歳</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/20" />
                        <span>{persona.gender}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/20" />
                        <span className="truncate max-w-[120px] md:max-w-none">{persona.occupation}</span>
                    </div>
                </div>
                
                {/* Engagement Stats (Right aligned) - Hidden on Mobile */}
                <div className="ml-auto hidden md:flex gap-6">
                    {state.willingnessToPay !== undefined && (
                        <div className="text-center group relative">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                <Wallet className="w-3 h-3"/> 支払意向額
                            </div>
                            <div className={`text-xl font-bold font-mono flex items-center gap-1 ${isWtpLow ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                                ¥{state.willingnessToPay.toLocaleString()}
                                {isWtpLow && <AlertCircle className="w-4 h-4" />}
                            </div>
                            
                            {/* WTP Gap Tooltip */}
                            {isWtpLow && state.targetPriceCondition && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-30 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                                    <div className="text-[10px] font-bold text-rose-500 mb-1 flex items-center gap-1">
                                        <ArrowUpCircle className="w-3 h-3" />
                                        提示価格まであと ¥{(askingPrice - wtp).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                                        {state.targetPriceCondition}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="text-center">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">興味度</div>
                        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{state.interestLevel}%</div>
                    </div>
                    {review && (
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">NPS</div>
                            <div className={`text-xl font-bold font-mono ${review.nps >= 9 ? 'text-emerald-500 dark:text-emerald-400' : review.nps <= 6 ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`}>
                                {review.nps}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: Profile & Context (Scrollable, limited height on mobile) */}
            <div className="w-full md:w-[380px] shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0b1121]/50 overflow-y-auto custom-scrollbar p-6 h-[35vh] md:h-full">
                 
                 {/* Detailed Score Radar (NEW) */}
                 {scoreData.length > 0 && (
                     <div className="mb-6 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 relative overflow-hidden">
                         <div className="flex items-center gap-2 mb-2">
                             <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">評価スコア詳細</span>
                         </div>
                         <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scoreData}>
                                    <PolarGrid stroke="#94a3b8" opacity={0.3} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                    <Radar name="Score" dataKey="A" stroke={persona.avatarColor || "#8b5cf6"} strokeWidth={2} fill={persona.avatarColor || "#8b5cf6"} fillOpacity={0.3} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                         </div>
                     </div>
                 )}

                 {/* Sales Pitch Toggle */}
                 {pitch && (
                     <div className="mb-6 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 overflow-hidden">
                        <button 
                            onClick={() => setShowPitch(!showPitch)}
                            className="w-full flex items-center justify-between p-4 hover:bg-indigo-100 dark:hover:bg-indigo-500/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                                <Megaphone className="w-3 h-3" /> セールスピッチ
                            </div>
                            {showPitch ? <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                        
                        {showPitch && (
                            <div className="p-4 pt-0 border-t border-indigo-200 dark:border-indigo-500/10 animate-in slide-in-from-top-2">
                                <h4 className="text-slate-800 dark:text-white font-bold text-sm mb-2">{pitch.catchCopy}</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-3">{pitch.description}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {pitch.keyBenefits.map((b, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] rounded border border-indigo-200 dark:border-indigo-500/20">{b}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                 )}

                 {/* Profile Details */}
                 <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            プロフィール詳細
                        </h3>
                        <div className="space-y-3 p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                             <div className="text-sm grid grid-cols-2 gap-y-3">
                                <div className="col-span-2">
                                    <div className="text-slate-500 text-xs mb-0.5 flex items-center gap-1"><Home className="w-3 h-3"/> 家族構成</div>
                                    <div className="text-slate-800 dark:text-slate-300 font-medium">{persona.familyStructure || '未設定'}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs mb-0.5 flex items-center gap-1"><DollarSign className="w-3 h-3"/> 年収</div>
                                    <div className="text-slate-800 dark:text-slate-300 font-medium">{persona.incomeLevel}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs mb-0.5 flex items-center gap-1"><Smartphone className="w-3 h-3"/> リテラシー</div>
                                    <div className="text-slate-800 dark:text-slate-300 font-medium">{persona.techLiteracy || '標準'}</div>
                                </div>
                             </div>
                             
                             <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                                <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Globe className="w-3 h-3"/> 情報収集源</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {persona.infoSources?.map((s, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] rounded border border-slate-200 dark:border-white/5">{s}</span>
                                    )) || <span className="text-slate-500 text-xs">未設定</span>}
                                </div>
                             </div>

                             <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                                <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Smile className="w-3 h-3"/> 趣味・関心</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {persona.hobbies?.map((s, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] rounded border border-slate-200 dark:border-white/5">{s}</span>
                                    )) || <span className="text-slate-500 text-xs">未設定</span>}
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-4">
                        <div>
                            <div className="text-slate-500 text-xs mb-1 flex items-center gap-1 font-bold"><Heart className="w-3 h-3"/> 価値観</div>
                            <div className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed">{persona.values}</div>
                        </div>
                        <div>
                             <div className="text-slate-500 text-xs mb-1 flex items-center gap-1 font-bold"><AlertCircle className="w-3 h-3"/> 悩み・課題</div>
                             <div className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed">{persona.currentPainPoints}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">特性</h3>
                        <div className="flex flex-wrap gap-2">
                             {persona.traits.map((t, i) => (
                                <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs rounded-md border border-slate-200 dark:border-white/5">{t}</span>
                             ))}
                        </div>
                    </div>
                 </div>
            </div>

            {/* Right Column: Interaction Timeline + Chat */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gradient-to-b dark:from-[#0f172a] dark:to-[#050b14] h-full relative">
                
                {/* Scrollable Timeline */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 pb-32" // Padding bottom for chat input space
                >
                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 sticky top-0 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur z-10 py-2 border-b border-slate-200 dark:border-white/5 w-fit pr-4 rounded-r-full">
                        <History className="w-3 h-3" /> シミュレーション履歴
                    </h3>

                    <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
                        
                        {/* Price Gap Condition (NEW FEATURE) */}
                        {isWtpLow && state.targetPriceCondition && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top-4">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-400 to-orange-500 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                                    <div className="relative bg-white dark:bg-[#0f172a] rounded-xl border border-rose-200 dark:border-rose-500/20 p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-rose-100 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/20">
                                                    <DollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                                </div>
                                                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">価格ギャップの解消条件</h4>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded">
                                                不足: ¥{(askingPrice - wtp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                            "{state.targetPriceCondition}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reverse Question / Disclaimer */}
                        {state.reverseQuestion && (
                            <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                                    <div className="relative bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-cyan-100 dark:bg-cyan-500/10 rounded-lg border border-cyan-200 dark:border-cyan-500/20">
                                                <HelpCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                            </div>
                                            <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">開発者への問いかけ</h4>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-cyan-500/30 pl-3 mb-2">
                                            "{state.reverseQuestion}"
                                        </p>
                                        <div className="text-[10px] text-slate-500 text-right flex justify-end items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            ※ この回答はAIによるシミュレーションであり、確実な未来予測ではありません。
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {state.interactionHistory && state.interactionHistory.length > 0 ? (
                            state.interactionHistory.map((item, idx) => {
                                // Determine alignment and style based on type
                                const isRightAlign = item.type === 'user-question';
                                
                                return (
                                <div key={idx} className={`flex gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isRightAlign ? 'flex-row-reverse' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
                                    {/* Icon Column */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 z-10 ${
                                            item.type === 'thought' ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400' :
                                            item.type === 'question' ? 'bg-indigo-100 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400' :
                                            item.type === 'answer' ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                                            item.type === 'discussion' ? 'bg-violet-100 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30 text-violet-600 dark:text-violet-400' :
                                            item.type === 'user-question' ? 'bg-sky-100 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/30 text-sky-600 dark:text-sky-400' :
                                            item.type === 'persona-answer' ? 'bg-indigo-600 border-indigo-400 text-white' : // Highlight persona response
                                            'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-white'
                                        }`}>
                                            {item.type === 'thought' && <Brain className="w-4 h-4" />}
                                            {item.type === 'question' && <User className="w-4 h-4" />}
                                            {item.type === 'answer' && <Megaphone className="w-4 h-4" />}
                                            {item.type === 'discussion' && <Users className="w-4 h-4" />}
                                            {item.type === 'decision' && <Activity className="w-4 h-4" />}
                                            {item.type === 'user-question' && <User className="w-4 h-4" />}
                                            {item.type === 'persona-answer' && <MessageCircle className="w-4 h-4" />}
                                        </div>
                                        {/* Line connector */}
                                        {idx !== state.interactionHistory.length - 1 && (
                                            <div className="w-0.5 h-full bg-slate-300 dark:bg-white/5 my-2"></div>
                                        )}
                                    </div>

                                    {/* Content Bubble */}
                                    <div className={`flex-1 pb-4 max-w-[85%] ${isRightAlign ? 'text-right' : ''}`}>
                                        <div className={`flex items-baseline mb-1 ${isRightAlign ? 'justify-end' : 'justify-between'}`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                item.type === 'thought' ? 'text-amber-600 dark:text-amber-500' :
                                                item.type === 'question' ? 'text-indigo-600 dark:text-indigo-400' :
                                                item.type === 'answer' ? 'text-emerald-600 dark:text-emerald-400' :
                                                item.type === 'discussion' ? 'text-violet-600 dark:text-violet-400' :
                                                item.type === 'user-question' ? 'text-sky-600 dark:text-sky-400' :
                                                item.type === 'persona-answer' ? 'text-indigo-600 dark:text-indigo-300' :
                                                'text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {item.type === 'thought' ? '心の声' :
                                                item.type === 'question' ? '質問' :
                                                item.type === 'answer' ? 'セールス回答' :
                                                item.type === 'discussion' ? 'グループ討議 (Buzz)' :
                                                item.type === 'user-question' ? 'あなた' :
                                                item.type === 'persona-answer' ? `${persona.name}` :
                                                '決断'}
                                            </span>
                                            {!isRightAlign && (
                                                <span className="text-[10px] text-slate-500 dark:text-slate-600 font-mono ml-auto">
                                                    {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className={`p-4 rounded-2xl border text-sm leading-relaxed inline-block text-left shadow-sm ${
                                            item.type === 'thought' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-slate-300 italic font-serif' :
                                            item.type === 'question' ? 'bg-indigo-600 dark:bg-indigo-900/10 border-indigo-600 dark:border-indigo-500/20 text-white rounded-tl-none' :
                                            item.type === 'answer' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-slate-200 rounded-tr-none' :
                                            item.type === 'discussion' ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-500/20 text-violet-900 dark:text-violet-100' :
                                            item.type === 'user-question' ? 'bg-sky-600 dark:bg-sky-900/20 border-sky-600 dark:border-sky-500/30 text-white rounded-tr-none' :
                                            item.type === 'persona-answer' ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/40 text-slate-800 dark:text-white rounded-tl-none shadow-md' :
                                            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white'
                                        }`}>
                                            {item.content}
                                        </div>
                                    </div>
                                </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-slate-500 text-sm py-10 italic">
                                履歴はまだありません。
                            </div>
                        )}
                        
                        {/* Why / Attribute Reasoning (NEW FEATURE) */}
                        {state.attributeReasoning && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 mt-2">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0 z-10 bg-purple-100 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400">
                                        <Lightbulb className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-purple-600 dark:text-purple-400">
                                        属性による反応要因 (Why)
                                    </span>
                                    <div className="p-4 rounded-2xl border bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-500/20 text-sm text-slate-700 dark:text-slate-300">
                                        {state.attributeReasoning}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Final Review Block if exists */}
                        {review && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 pt-4 border-t border-slate-200 dark:border-white/5 mt-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 z-10 ${
                                        state.decision === 'buy' ? 'bg-emerald-500 text-white dark:text-slate-900 border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
                                    }`}>
                                        {state.decision === 'buy' ? <Star className="w-4 h-4 fill-current" /> : <MessageCircle className="w-4 h-4" />}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                                        state.decision === 'buy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    }`}>
                                        {state.decision === 'buy' ? 'ユーザーレビュー' : 'フィードバック'}
                                    </span>
                                    <div className={`p-6 rounded-2xl border ${state.decision === 'buy' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-500/20'}`}>
                                        <div className="flex text-amber-500 dark:text-amber-400 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                                            ))}
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">{review.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                            {review.body}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Direct Chat Input Area (Fixed at Bottom) */}
                <div className="p-4 bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-md border-t border-slate-200 dark:border-white/10 shrink-0">
                    <div className="max-w-3xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                            <div className="relative flex items-center bg-white dark:bg-[#020617] rounded-xl border border-slate-300 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-xl">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`${persona.name}に直接質問する... (例: なぜその機能は不要だと思ったの？)`}
                                    disabled={isChatting}
                                    className="flex-1 bg-transparent px-4 py-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                                />
                                <button 
                                    onClick={handleSendChat}
                                    disabled={!chatInput.trim() || isChatting}
                                    className="px-4 py-2 mr-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-white disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5 opacity-60">
                            <Mic className="w-3 h-3" />
                            <span>ダイレクト・インタビュー機能: 仮想顧客(ペルソナ)があなたに直接回答します</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

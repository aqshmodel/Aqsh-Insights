
import React, { useRef } from 'react';
import { Box, Tag, FileText, ImageIcon, X, Target, PenTool, Sparkles, ChevronDown, Users, Gauge, MessageCircle, AlertTriangle } from 'lucide-react';
import { PERSONA_TEMPLATES } from '../../services/templates';
import { useSimulationContext } from '../../contexts/SimulationContext';

interface SettingsFormProps {
    showTemplates: boolean;
    setShowTemplates: (show: boolean) => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ 
    showTemplates, 
    setShowTemplates 
}) => {
    const { state, actions } = useSimulationContext();
    const { productInput: input, status } = state;
    const { updateInput: setInput } = actions;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDisabled = status !== 'idle' && status !== 'completed' && status !== 'error';

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("画像サイズは5MB以下にしてください");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const matches = base64String.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                setInput({
                    ...input,
                    imageMimeType: matches[1],
                    productImage: matches[2]
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInput({ ...input, productImage: undefined, imageMimeType: undefined });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTemplateSelect = (prompt: string) => {
        setInput({ ...input, customPersonaPrompt: prompt });
        setShowTemplates(false);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
             {/* Name */}
            <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                    <Box className="w-3.5 h-3.5" /> 企画・商品名
                </label>
                <input 
                    type="text" 
                    value={input.name}
                    onChange={e => setInput({...input, name: e.target.value})}
                    placeholder="例: AIフィットネスコーチ"
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    disabled={isDisabled}
                />
            </div>

            {/* Price */}
            <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                    <Tag className="w-3.5 h-3.5" /> 価格設定
                </label>
                <input 
                    type="text" 
                    value={input.price}
                    onChange={e => setInput({...input, price: e.target.value})}
                    placeholder="例: 月額 2,980円"
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    disabled={isDisabled}
                />
            </div>

            {/* Description */}
            <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> 商品概要
                </label>
                <textarea 
                    value={input.description}
                    onChange={e => setInput({...input, description: e.target.value})}
                    placeholder="どのような課題を、どう解決するか具体的に..."
                    className="w-full h-24 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed custom-scrollbar"
                    disabled={isDisabled}
                />
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                    <ImageIcon className="w-3.5 h-3.5" /> 参考画像 <span className="text-[9px] font-normal opacity-70">(デザイン/UI/パッケージ)</span>
                </label>
                
                {!input.productImage ? (
                    <div 
                        onClick={() => !isDisabled && fileInputRef.current?.click()}
                        className={`w-full h-24 bg-slate-50 dark:bg-black/20 border border-dashed border-slate-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-white/5 hover:border-indigo-500/50 group/upload ${isDisabled ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        <ImageIcon className="w-6 h-6 text-slate-400 dark:text-slate-600 mb-2 group-hover/upload:text-indigo-500 dark:group-hover/upload:text-indigo-400 transition-colors" />
                        <span className="text-xs text-slate-500 group-hover/upload:text-slate-700 dark:group-hover/upload:text-slate-300">画像をアップロード</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-600 mt-0.5">JPEG, PNG (Max 5MB)</span>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                            disabled={isDisabled}
                        />
                    </div>
                ) : (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group/preview">
                        <img 
                            src={`data:${input.imageMimeType};base64,${input.productImage}`} 
                            alt="Product Preview" 
                            className="w-full h-full object-cover"
                        />
                        { !isDisabled && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={clearImage}
                                    className="p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full transition-all transform hover:scale-110"
                                    title="画像を削除"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/5 w-full my-1" />

            {/* Target Block */}
            <div className="space-y-6">
                <div className="space-y-1.5 group">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                        <Target className="w-3.5 h-3.5" /> ターゲット仮説
                    </label>
                    <input 
                        type="text" 
                        value={input.targetHypothesis}
                        onChange={e => setInput({...input, targetHypothesis: e.target.value})}
                        placeholder="例: 30代の忙しいビジネスパーソン"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        disabled={isDisabled}
                    />
                </div>

                <div className="space-y-1.5 group relative">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                            <PenTool className="w-3.5 h-3.5" /> 仮想顧客詳細指定(ペルソナ)
                        </label>
                        <button 
                            onClick={() => setShowTemplates(!showTemplates)}
                            disabled={isDisabled}
                            className="text-[9px] text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                            <Sparkles className="w-3 h-3" /> テンプレート
                            <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    
                    {/* Templates Dropdown */}
                    {showTemplates && (
                        <div className="absolute top-8 left-0 right-0 z-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {PERSONA_TEMPLATES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTemplateSelect(t.prompt)}
                                        className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group/item"
                                    >
                                        <div className="font-bold text-xs text-indigo-600 dark:text-indigo-300 group-hover/item:text-indigo-800 dark:group-hover/item:text-white flex items-center gap-2">
                                            {t.label}
                                        </div>
                                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                            {t.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <textarea 
                        value={input.customPersonaPrompt || ''}
                        onChange={e => setInput({...input, customPersonaPrompt: e.target.value})}
                        placeholder="例: 30代女性、週末はキャンプに行き、環境問題に関心がある"
                        className="w-full h-20 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed custom-scrollbar"
                        disabled={isDisabled}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="w-3 h-3" /> 生成人数
                            </label>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 font-mono bg-indigo-100 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">{input.personaCount}名</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="10" 
                            value={input.personaCount}
                            onChange={e => setInput({...input, personaCount: parseInt(e.target.value)})}
                            className="w-full accent-indigo-500 h-1 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer hover:accent-indigo-400 transition-all"
                            disabled={isDisabled}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Gauge className="w-3 h-3" /> 初期関心度
                            </label>
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                                (input.initialInterest ?? 50) < 30 ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/20' :
                                (input.initialInterest ?? 50) > 70 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' :
                                'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'
                            }`}>
                                {(input.initialInterest ?? 50)}%
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" step="5"
                            value={input.initialInterest ?? 50}
                            onChange={e => setInput({...input, initialInterest: parseInt(e.target.value)})}
                            className={`w-full h-1 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer transition-all ${
                                (input.initialInterest ?? 50) < 30 ? 'accent-rose-500 hover:accent-rose-400' :
                                (input.initialInterest ?? 50) > 70 ? 'accent-emerald-500 hover:accent-emerald-400' :
                                'accent-amber-500 hover:accent-amber-400'
                            }`}
                            disabled={isDisabled}
                        />
                        <div className="flex justify-between text-[9px] text-slate-500 font-medium px-1">
                            <span>慎重派</span>
                            <span>革新派</span>
                        </div>
                    </div>
                </div>

                {/* Group Discussion Toggle */}
                <div className={`bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 transition-all duration-300 ${input.enableGroupDiscussion ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/5' : ''}`}>
                    <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors ${input.enableGroupDiscussion ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            <MessageCircle className="w-3.5 h-3.5" /> グループ会議モード (β)
                        </label>
                        <button 
                            onClick={() => setInput({...input, enableGroupDiscussion: !input.enableGroupDiscussion})}
                            disabled={isDisabled}
                            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${input.enableGroupDiscussion ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${input.enableGroupDiscussion ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        仮想顧客(ペルソナ)同士が意見交換を行い、相互に影響を与え合うシミュレーションを追加します。<br/>
                        <span className={`flex items-center gap-1 mt-1 font-medium ${input.enableGroupDiscussion ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500 dark:text-slate-600'}`}>
                            <AlertTriangle className="w-3 h-3" /> APIトークン消費量が増加します
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};


import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, ReferenceLine, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { SimulationResult, ConsumerState } from '../types';
import { Users, Activity, Target, DollarSign, Crosshair } from 'lucide-react';
import { 
    prepareDemographicsData, 
    preparePriceData, 
    prepareSentimentData, 
    prepareDetailedScoreData, 
    preparePositioningData 
} from '../services/analyticsUtils';

interface AnalyticsDashboardProps {
  result: SimulationResult;
  consumerStates: Record<string, ConsumerState>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ result, consumerStates }) => {

  // Use utils to prepare data
  const demographicsData = useMemo(() => prepareDemographicsData(result), [result]);
  const priceData = useMemo(() => preparePriceData(result, consumerStates), [result, consumerStates]);
  const sentimentData = useMemo(() => prepareSentimentData(result, consumerStates), [result, consumerStates]);
  const detailedScoreData = useMemo(() => prepareDetailedScoreData(result, consumerStates), [result, consumerStates]);
  const positioningData = useMemo(() => preparePositioningData(result), [result]);

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Row 1: Product Power & Positioning */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Product Power Analysis (Radar) */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                 <div className="flex items-center gap-2 mb-6">
                    <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">商品力分析 (Product Score)</h3>
                </div>
                 <div className="h-[300px] w-full">
                    {detailedScoreData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={detailedScoreData}>
                                <PolarGrid stroke="#94a3b8" opacity={0.3} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                <Radar name="Average Score" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs">データ不足</div>
                    )}
                </div>
            </div>

            {/* Positioning Map (Scatter) */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">市場ポジショニング (Map)</h3>
                    </div>
                    {positioningData.axisX && (
                        <div className="text-[10px] text-slate-500 text-right">
                            <div>X: {positioningData.axisX}</div>
                            <div>Y: {positioningData.axisY}</div>
                        </div>
                    )}
                </div>
                <div className="h-[300px] w-full">
                    {positioningData.points.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
                                <XAxis type="number" dataKey="x" name="X" domain={[-10, 10]} hide />
                                <YAxis type="number" dataKey="y" name="Y" domain={[-10, 10]} hide />
                                <ZAxis type="category" dataKey="name" name="Name" />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }} 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-[#1e293b] border border-slate-700 p-2 rounded shadow-lg text-xs text-white">
                                                    <p className="font-bold">{data.name}</p>
                                                    <p className="text-[10px] opacity-70">{data.description}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Competitors" data={positioningData.points} fill="#8884d8">
                                    {positioningData.points.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isOurs ? '#f43f5e' : '#6366f1'} />
                                    ))}
                                </Scatter>
                                {/* Center Axes Lines */}
                                <ReferenceLine x={0} stroke="#94a3b8" />
                                <ReferenceLine y={0} stroke="#94a3b8" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                            マップデータ生成中または利用不可
                        </div>
                    )}
                </div>
                <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> 自社製品</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> 競合他社</div>
                </div>
            </div>
        </div>

        {/* Row 2: Demographics & Price */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Demographics */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">属性別受容性 (Demographics)</h3>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographicsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" horizontal={true} vertical={false} opacity={0.3} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="range" type="category" stroke="#64748b" fontSize={12} width={60} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Bar dataKey="buy" name="Buy" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="pass" name="Pass" stackId="a" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Price Sensitivity */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">価格受容性 (WTP)</h3>
                    </div>
                    {priceData.askingPrice > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            提示価格: <span className="font-bold text-slate-800 dark:text-white">¥{priceData.askingPrice.toLocaleString()}</span>
                        </div>
                    )}
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priceData.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" vertical={false} opacity={0.3} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tick={{dy: 5}} interval={0} />
                            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `¥${val.toLocaleString()}`} />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-[#1e293b] border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                                                <p className="font-bold text-white mb-1">{data.name}</p>
                                                <p className="text-emerald-400">支払意向: ¥{data.wtp.toLocaleString()}</p>
                                                <p className={data.decision === 'buy' ? 'text-indigo-400' : 'text-rose-400'}>判定: {data.decision?.toUpperCase()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="wtp" name="支払意向額" radius={[4, 4, 0, 0]}>
                                {priceData.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.decision === 'buy' ? '#10b981' : '#f43f5e'} opacity={0.8} />
                                ))}
                            </Bar>
                            {priceData.askingPrice > 0 && (
                                <ReferenceLine y={priceData.askingPrice} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: '提示価格', fill: '#f59e0b', fontSize: 10 }} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Row 3: Sentiment Trend */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">感情分析推移 (Sentiment Trend)</h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" vertical={false} opacity={0.3} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType="circle" />
                        {result.personas.map((p, i) => (
                            <Line 
                                key={p.id} 
                                type="monotone" 
                                dataKey={p.name} 
                                stroke={p.avatarColor} 
                                strokeWidth={2}
                                dot={{ r: 3, fill: p.avatarColor }}
                                activeDot={{ r: 6 }}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

    </div>
  );
};

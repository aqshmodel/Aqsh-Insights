import React from 'react';
import { SimulationHistoryItem } from '../types';
import { Clock, Trash2, ArrowRight, BarChart2, Calendar } from 'lucide-react';

interface HistoryListProps {
  items: SimulationHistoryItem[];
  currentResultId?: string;
  onSelect: (item: SimulationHistoryItem) => void;
  onDelete: (id: string) => void;
  onCompare: (item: SimulationHistoryItem) => void;
  isCompareEnabled: boolean;
}

export const HistoryList: React.FC<HistoryListProps> = ({ 
    items, 
    currentResultId, 
    onSelect, 
    onDelete, 
    onCompare,
    isCompareEnabled
}) => {
  
  if (items.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 opacity-60">
              <Clock className="w-8 h-8 mb-2" />
              <p className="text-xs">履歴はありません</p>
          </div>
      );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-500">
      {items.map((item) => {
        const isCurrent = false; // We don't track persistent ID for current run easily, relying on user action
        
        return (
            <div 
                key={item.id} 
                className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                    isCurrent 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                }`}
            >
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-slate-200 line-clamp-1">{item.productName}</h4>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="削除"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" />
                        Rate: <span className={`font-bold ${item.acceptanceRate >= 70 ? 'text-emerald-400' : item.acceptanceRate <= 30 ? 'text-rose-400' : 'text-amber-400'}`}>{item.acceptanceRate}%</span>
                    </span>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => onSelect(item)}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                        読み込む
                    </button>
                    {isCompareEnabled && (
                        <button 
                            onClick={() => onCompare(item)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/10"
                        >
                            比較する
                        </button>
                    )}
                </div>
            </div>
        );
      })}
    </div>
  );
};
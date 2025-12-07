import { SimulationResult, SimulationHistoryItem, ConsumerState } from '../types';

const STORAGE_KEY = 'aqsh_history_v1';

export const saveHistory = (result: SimulationResult, consumerStates: Record<string, ConsumerState>): SimulationHistoryItem => {
  const history = getHistory();
  
  // Create a deep copy to ensure we store valid JSON
  const resultToSave: SimulationResult = {
      ...result,
      consumerStates // Include states for full restoration
  };

  const newItem: SimulationHistoryItem = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    productName: result.product.name,
    acceptanceRate: result.report.acceptanceRate,
    result: resultToSave
  };

  // Prepend new item and limit to 50
  const newHistory = [newItem, ...history].slice(0, 50);
  
  try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (e) {
      console.error("Failed to save history (Quota exceeded?)", e);
      // Fallback: Try saving fewer items if quota exceeded
      if (newHistory.length > 10) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 10)));
      }
  }
  
  return newItem;
};

export const getHistory = (): SimulationHistoryItem[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const deleteHistoryItem = (id: string): SimulationHistoryItem[] => {
    const history = getHistory();
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    return newHistory;
};

export const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
};
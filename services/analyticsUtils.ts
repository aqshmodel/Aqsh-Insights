
import { SimulationResult, ConsumerState } from '../types';

// --- Data Prep for Demographics (Bar Chart) ---
export const prepareDemographicsData = (result: SimulationResult) => {
    const ageGroups: Record<string, { range: string, buy: number, pass: number }> = {
      '20s': { range: '20代', buy: 0, pass: 0 },
      '30s': { range: '30代', buy: 0, pass: 0 },
      '40s': { range: '40代', buy: 0, pass: 0 },
      '50s+': { range: '50代以上', buy: 0, pass: 0 },
    };

    result.personas.forEach(p => {
        const decision = result.report.personaBreakdown.find(b => b.id === p.id)?.decision;
        let key = '50s+';
        if (p.age < 30) key = '20s';
        else if (p.age < 40) key = '30s';
        else if (p.age < 50) key = '40s';
        
        if (decision === 'buy') ageGroups[key].buy++;
        else ageGroups[key].pass++;
    });

    return Object.values(ageGroups).filter(g => g.buy + g.pass > 0);
};

// --- Data Prep for Price Sensitivity (Bar Chart) ---
export const preparePriceData = (result: SimulationResult, consumerStates: Record<string, ConsumerState>) => {
    // Parse asking price from input string (simple regex to find first number)
    const priceStr = result.product.price || "";
    // Remove commas and try to find digits
    const match = priceStr.replace(/,/g, '').match(/(\d+)/);
    const askingPrice = match ? parseInt(match[0]) : 0;

    const data = result.personas.map(p => {
        const state = consumerStates[p.id];
        return {
            name: p.name,
            wtp: state.willingnessToPay || 0,
            decision: state.decision,
            askingPrice: askingPrice
        };
    });
    
    return { data, askingPrice };
};

// --- Data Prep for Sentiment Trend (Line Chart) ---
export const prepareSentimentData = (result: SimulationResult, consumerStates: Record<string, ConsumerState>) => {
    const dataPoints: any[] = [];
    
    // Initial state (Step 0)
    const step0: any = { name: '初期' };
    result.personas.forEach(p => {
        step0[p.name] = result.product.initialInterest ?? 50;
    });
    dataPoints.push(step0);

    const maxTurns = Math.max(...Object.values(consumerStates).map(s => s.interactionHistory.length));
    
    for (let i = 0; i < maxTurns; i++) {
        const step: any = { name: `Turn ${i+1}` };
        result.personas.forEach(p => {
            const history = consumerStates[p.id]?.interactionHistory;
            if (history && history[i]) {
                step[p.name] = history[i].interestLevel ?? (i > 0 ? dataPoints[i][p.name] : 50);
            } else {
                 step[p.name] = dataPoints[i] ? dataPoints[i][p.name] : 50;
            }
        });
        dataPoints.push(step);
    }
    
    const finalStep: any = { name: '最終' };
    result.personas.forEach(p => {
        finalStep[p.name] = consumerStates[p.id]?.interestLevel ?? 50;
    });
    dataPoints.push(finalStep);

    return dataPoints;
};

// --- Data Prep for Detailed Score Radar (Radar Chart) ---
export const prepareDetailedScoreData = (result: SimulationResult, consumerStates: Record<string, ConsumerState>) => {
    const scores = {
        appeal: 0,
        novelty: 0,
        clarity: 0,
        relevance: 0,
        value: 0
    };
    
    let count = 0;
    result.personas.forEach(p => {
        const s = consumerStates[p.id]?.detailedScore;
        if (s) {
            scores.appeal += s.appeal;
            scores.novelty += s.novelty;
            scores.clarity += s.clarity;
            scores.relevance += s.relevance;
            scores.value += s.value;
            count++;
        }
    });

    if (count === 0) return [];

    return [
        { subject: '魅力度', A: (scores.appeal / count).toFixed(1), fullMark: 5 },
        { subject: '新規性', A: (scores.novelty / count).toFixed(1), fullMark: 5 },
        { subject: '理解度', A: (scores.clarity / count).toFixed(1), fullMark: 5 },
        { subject: '関連性', A: (scores.relevance / count).toFixed(1), fullMark: 5 },
        { subject: 'コスパ', A: (scores.value / count).toFixed(1), fullMark: 5 },
    ];
};

// --- Data Prep for Positioning Map (Scatter Chart) ---
export const preparePositioningData = (result: SimulationResult) => {
    if (!result.report.positioningMap) return { points: [], axisX: '', axisY: '' };
    
    return {
        points: result.report.positioningMap.points,
        axisX: result.report.positioningMap.axisX,
        axisY: result.report.positioningMap.axisY
    };
};

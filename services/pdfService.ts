
import { marked } from 'marked';
import { SimulationResult, ConsumerState } from '../types';
import { prepareDetailedScoreData, preparePositioningData, preparePriceData, prepareDemographicsData } from './analyticsUtils';

// --- Chart Generation Helpers ---

const generateRadarSvg = (scores: { subject: string, A: string, fullMark: number }[]) => {
    if (!scores || scores.length === 0) return '<div class="no-data">No Data</div>';
    
    const size = 200;
    const center = size / 2;
    const radius = 70;
    const maxScore = 5;
    
    // Calculate vertices for the background grid
    const getPoint = (value: number, index: number) => {
        const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
        const r = (value / maxScore) * radius;
        return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    };

    let gridHtml = '';
    [1, 2, 3, 4, 5].forEach(level => {
        const points = scores.map((_, i) => getPoint(level, i).join(',')).join(' ');
        gridHtml += `<polygon points="${points}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
    });

    const dataPoints = scores.map((s, i) => getPoint(parseFloat(s.A), i).join(',')).join(' ');
    
    const labelsHtml = scores.map((s, i) => {
        const [x, y] = getPoint(6.5, i); // Place text outside
        // Adjust alignment based on position
        let anchor = 'middle';
        let baseline = 'middle';
        if (i === 0) { baseline = 'auto'; } // Top
        if (i === 1 || i === 2) { anchor = 'start'; } // Right
        if (i === 3 || i === 4) { anchor = 'end'; } // Left
        
        return `<text x="${x}" y="${y}" font-size="8" text-anchor="${anchor}" dominant-baseline="${baseline}" fill="#475569" font-weight="bold">${s.subject}</text>`;
    }).join('');

    const scoreValueHtml = `<text x="${center}" y="${center + radius + 25}" font-size="10" text-anchor="middle" fill="#8b5cf6" font-weight="bold">Avg Score</text>`;

    return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${gridHtml}
            <polygon points="${dataPoints}" fill="rgba(139, 92, 246, 0.3)" stroke="#8b5cf6" stroke-width="2"/>
            ${labelsHtml}
        </svg>
    `;
};

const generatePositioningHtml = (data: { points: any[], axisX: string, axisY: string }) => {
    if (!data || !data.points || data.points.length === 0) return '<div class="no-data">No Map Data</div>';
    
    const pointsHtml = data.points.map((p: any) => {
        // Map -10 to 10 -> 0% to 100%
        const left = ((p.x + 10) / 20) * 100;
        const bottom = ((p.y + 10) / 20) * 100;
        const color = p.isOurs ? '#f43f5e' : '#6366f1';
        const zIndex = p.isOurs ? 10 : 1;
        return `
            <div style="position: absolute; left: ${left}%; bottom: ${bottom}%; transform: translate(-50%, 50%); display: flex; flex-direction: column; align-items: center; z-index: ${zIndex};">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; border: 1px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>
                <div style="font-size: 6pt; color: #475569; white-space: nowrap; margin-top: 2px; font-weight: bold; background: rgba(255,255,255,0.9); padding: 0 3px; border-radius: 2px;">${p.name}</div>
            </div>
        `;
    }).join('');

    return `
        <div style="position: relative; width: 100%; aspect-ratio: 1/1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <!-- Axes -->
            <div style="position: absolute; left: 50%; top: 0; bottom: 0; border-left: 1px dashed #cbd5e1;"></div>
            <div style="position: absolute; top: 50%; left: 0; right: 0; border-top: 1px dashed #cbd5e1;"></div>
            
            <!-- Labels -->
            <div style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%); font-size: 7pt; color: #64748b; background:rgba(255,255,255,0.8);">${data.axisY?.split('->')[1] || 'High'}</div>
            <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); font-size: 7pt; color: #64748b; background:rgba(255,255,255,0.8);">${data.axisY?.split('->')[0] || 'Low'}</div>
            <div style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); font-size: 7pt; color: #64748b; background:rgba(255,255,255,0.8);">${data.axisX?.split('->')[1] || 'High'}</div>
            <div style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); font-size: 7pt; color: #64748b; background:rgba(255,255,255,0.8);">${data.axisX?.split('->')[0] || 'Low'}</div>

            ${pointsHtml}
        </div>
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 5px; font-size: 7pt; color: #64748b;">
            <div style="display: flex; align-items: center; gap: 2px;"><div style="width:6px; height:6px; background:#f43f5e; border-radius:50%;"></div>自社</div>
            <div style="display: flex; align-items: center; gap: 2px;"><div style="width:6px; height:6px; background:#6366f1; border-radius:50%;"></div>競合</div>
        </div>
    `;
};

const generatePriceChartHtml = (data: { data: any[], askingPrice: number }) => {
    // Sort by WTP desc
    const sorted = [...data.data].sort((a: any, b: any) => b.wtp - a.wtp);
    const maxWtp = Math.max(...sorted.map((d: any) => d.wtp));
    const maxVal = Math.max(data.askingPrice, maxWtp) * 1.1 || 10000; // 10% buffer
    
    const barsHtml = sorted.map((d: any) => {
        const width = (d.wtp / maxVal) * 100;
        const color = d.decision === 'buy' ? '#10b981' : '#f43f5e';
        return `
            <div style="display: flex; align-items: center; margin-bottom: 6px; font-size: 8pt;">
                <div style="width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${d.name}</div>
                <div style="flex: 1; background: #f1f5f9; height: 14px; border-radius: 2px; position: relative; margin: 0 10px;">
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${width}%; background: ${color}; border-radius: 2px; opacity: 0.8;"></div>
                    <div style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); font-size: 7pt; color: #64748b; text-align:right;">¥${d.wtp.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');

    const askingLinePos = (data.askingPrice / maxVal) * 100;

    return `
        <div style="position: relative; padding-top: 20px;">
            ${barsHtml}
            ${data.askingPrice > 0 ? `
            <div style="position: absolute; top: 0; bottom: 0; left: calc(90px + ${askingLinePos}% * 0.7); /* Approx adjustment */ border-left: 2px dashed #f59e0b; pointer-events: none;">
                <div style="position: absolute; top: 0; left: -40px; font-size: 7pt; color: #f59e0b; background: white; padding: 0 2px; white-space: nowrap; font-weight: bold; border: 1px solid #f59e0b; border-radius: 4px;">提示: ¥${data.askingPrice.toLocaleString()}</div>
            </div>
            ` : ''}
        </div>
    `;
};

/**
 * ブラウザのネイティブ印刷機能を使用してレポートを出力する
 */
export const generatePDF = async (
    result: SimulationResult, 
    consumerStates: Record<string, ConsumerState>
) => {
    const date = new Date().toLocaleDateString('ja-JP');

    // --- 1. Prepare Analysis Data ---
    const demographicsData = prepareDemographicsData(result);
    const detailedScores = prepareDetailedScoreData(result, consumerStates);
    const positioning = preparePositioningData(result);
    const priceAnalysis = preparePriceData(result, consumerStates);

    // --- 2. Generate Chart HTMLs ---
    
    // Demographics
    const demographicsHtml = demographicsData.map((group: any) => {
        const total = group.buy + group.pass;
        if (total === 0) return '';
        const buyPct = (group.buy / total) * 100;
        const passPct = (group.pass / total) * 100;
        return `
            <div class="demo-row">
                <div class="demo-label">${group.range}</div>
                <div class="demo-bar-container">
                    ${buyPct > 0 ? `<div style="width: ${buyPct}%; background: #10b981;"></div>` : ''}
                    ${passPct > 0 ? `<div style="width: ${passPct}%; background: #f43f5e;"></div>` : ''}
                </div>
                <div class="demo-count">
                    <span class="text-buy">${group.buy}</span> / <span class="text-pass">${group.pass}</span>
                </div>
            </div>
        `;
    }).join('');

    // Radar Chart
    const radarHtml = generateRadarSvg(detailedScores);

    // Positioning Map
    const positioningHtml = generatePositioningHtml(positioning);

    // Price Chart
    const priceChartHtml = generatePriceChartHtml(priceAnalysis);

    // --- 3. Build HTML Content ---
    
    // Markdown Parsing
    const reportHtml = marked.parse(result.report.markdown) as string;

    // Personas HTML
    let personasHtml = '';
    const askingPrice = priceAnalysis.askingPrice;

    for (const p of result.personas) {
        const state = consumerStates[p.id];
        const decisionClass = state.decision === 'buy' ? 'badge-buy' : 'badge-pass';
        const decisionText = state.decision === 'buy' ? 'BUY (購入)' : 'PASS (見送り)';
        const wtpText = state.willingnessToPay !== undefined ? `¥${state.willingnessToPay.toLocaleString()}` : '-';
        
        const wtp = state.willingnessToPay || 0;
        const isWtpLow = askingPrice > 0 && wtp < askingPrice;
        
        const filteredHistory = state.interactionHistory.filter(h => 
            h.type !== 'discussion' && 
            !h.content.includes('他の参加者の意見を聞いています') &&
            !h.content.includes('待機中')
        );

        const historyHtml = filteredHistory.map(h => {
            let label = 'Log';
            let className = 'log-default';

            switch(h.type) {
                case 'user-question': label = 'インタビュアー'; className = 'log-user'; break;
                case 'persona-answer': label = `${p.name}`; className = 'log-persona'; break;
                case 'thought': label = '心の声'; className = 'log-thought'; break;
                case 'question': label = '質問'; className = 'log-question'; break;
                case 'answer': label = 'セールス担当'; className = 'log-answer'; break;
                case 'decision': label = '決断'; className = 'log-decision'; break;
            }
            
            return `
                <div class="log-item ${className}">
                    <div class="log-label">${label}</div>
                    <div class="log-content">${h.content}</div>
                </div>
            `;
        }).join('');

        const reviewSection = result.reviews.find(r => r.personaId === p.id) ? `
            <div class="review-box ${state.decision === 'buy' ? 'review-buy' : 'review-pass'}">
                <div class="review-header">
                    <span class="review-type">${state.decision === 'buy' ? 'ユーザーレビュー' : '見送り理由'}</span>
                    <span class="review-stars">${"★".repeat(result.reviews.find(r => r.personaId === p.id)!.rating)}</span>
                </div>
                <div class="review-title">${result.reviews.find(r => r.personaId === p.id)!.title}</div>
                <div class="review-body">${result.reviews.find(r => r.personaId === p.id)!.body}</div>
            </div>
        ` : '';
        
        const gapSection = (isWtpLow && state.targetPriceCondition) ? `
            <div class="gap-box">
                <div class="gap-header">
                    <span style="color: #e11d48; font-weight: bold;">⚠️ 価格ギャップの解消条件</span>
                    <span style="background: #fff1f2; color: #e11d48; padding: 2px 6px; border-radius: 4px; font-size: 8pt; border: 1px solid #fecdd3;">不足: ¥${(askingPrice - wtp).toLocaleString()}</span>
                </div>
                <p>${state.targetPriceCondition}</p>
            </div>
        ` : '';

        personasHtml += `
            <div class="persona-card">
                <div class="persona-header">
                    <div class="persona-avatar" style="background-color: ${p.avatarColor}">${p.name[0]}</div>
                    <div class="persona-info">
                        <h3>${p.name}</h3>
                        <p>${p.age}歳 / ${p.gender} / ${p.occupation}</p>
                        <div class="persona-tags">
                            ${p.traits.slice(0, 4).map(t => `<span>${t}</span>`).join('')}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="persona-decision ${decisionClass}">${decisionText}</div>
                        <div style="font-size: 8pt; color: #64748b; margin-top: 4px;">支払意向額: <strong style="color: ${isWtpLow ? '#e11d48' : '#1e293b'};">${wtpText}</strong></div>
                    </div>
                </div>

                <div class="persona-grid">
                    <div class="attr-box">
                        <strong>価値観</strong>
                        <p>${p.values}</p>
                    </div>
                    <div class="attr-box">
                        <strong>悩み・課題</strong>
                        <p>${p.currentPainPoints}</p>
                    </div>
                </div>
                
                ${gapSection}

                ${reviewSection}

                <div class="history-section">
                    <h4>対話ログ</h4>
                    ${historyHtml}
                </div>
            </div>
        `;
    }

    // Full Document Template
    const fullHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>Aqsh Report: ${result.product.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
            /* Reset & Base */
            body {
                font-family: "Noto Serif JP", serif;
                color: #1e293b;
                line-height: 1.6;
                font-size: 10pt;
                margin: 0;
                padding: 0;
            }

            /* Screen View (Preview Mode) */
            @media screen {
                body {
                    background-color: #525659; /* Acrobat Gray */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 60px; /* Space for toolbar */
                    padding-bottom: 40px;
                }
                .sheet {
                    background: white;
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    box-sizing: border-box;
                    box-shadow: 0 0 15px rgba(0,0,0,0.3);
                    margin-bottom: 20px;
                }
                .no-print-bar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 50px;
                    background: #333;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 9999;
                }
                .print-btn {
                    background: #6366f1;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: sans-serif;
                }
                .print-btn:hover { background: #4f46e5; }
                .title-bar { font-family: sans-serif; font-size: 14px; font-weight: bold; }
            }

            /* Print View */
            @media print {
                @page {
                    size: A4;
                    margin: 20mm;
                }
                body { 
                    background: none; 
                    display: block;
                    padding: 0;
                }
                .sheet {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    box-shadow: none;
                }
                .no-print-bar { display: none; }
                header, .persona-card, .dashboard, .analytics-grid { page-break-inside: avoid; }
            }

            /* Layout Utils */
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
            .no-data { display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 10px; }
            
            /* Header */
            header {
                border-bottom: 2px solid #1e293b;
                padding-bottom: 10px;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            h1 { margin: 0; font-size: 20pt; font-weight: 700; color: #1e293b; }
            .meta { text-align: right; font-size: 9pt; color: #64748b; }
            
            /* Project Info */
            .project-info { margin-bottom: 30px; }
            .project-title { font-size: 16pt; font-weight: bold; margin-bottom: 5px; color: #334155; }
            .project-desc { font-size: 10pt; color: #475569; white-space: pre-wrap; }
            
            /* Executive Dashboard */
            .dashboard {
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .kpi-card {
                flex: 1;
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            .kpi-label { font-size: 9pt; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-family: 'Inter', sans-serif; }
            .kpi-value { font-size: 28pt; font-weight: 900; font-family: 'Inter', sans-serif; }
            
            .demo-card {
                flex: 2;
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
            }
            .demo-row { display: flex; align-items: center; font-size: 9pt; margin-bottom: 8px; }
            .demo-label { width: 60px; font-weight: bold; color: #64748b; }
            .demo-bar-container { flex: 1; height: 10px; background: #f1f5f9; border-radius: 4px; overflow: hidden; display: flex; }
            .demo-count { width: 80px; text-align: right; margin-left: 10px; font-family: 'Inter', monospace; }
            .text-buy { color: #10b981; }
            .text-pass { color: #f43f5e; }

            /* Strategic Analytics Grid */
            .analytics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .chart-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .chart-title { font-size: 10pt; font-weight: bold; color: #334155; margin-bottom: 10px; width: 100%; text-align: left; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            
            .full-width-card {
                grid-column: 1 / -1;
            }

            /* Markdown Content */
            .report-content h1 { font-size: 16pt; border-bottom: 1px solid #e2e8f0; margin-top: 30px; padding-bottom: 5px; }
            .report-content h2 { font-size: 14pt; border-left: 4px solid #6366f1; padding-left: 10px; margin-top: 25px; background: #f8fafc; padding: 5px 10px; }
            .report-content h3 { font-size: 12pt; margin-top: 20px; color: #475569; }
            .report-content p { text-align: justify; margin-bottom: 10px; }
            .report-content ul { padding-left: 20px; }
            .report-content li { margin-bottom: 4px; }
            .report-content blockquote { border-left: 3px solid #cbd5e1; padding-left: 15px; color: #64748b; font-style: italic; margin: 15px 0; background: #f8fafc; padding: 10px; }
            
            /* Personas */
            .section-title { font-size: 16pt; font-weight: bold; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin: 30px 0 20px 0; }
            .persona-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                page-break-inside: avoid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .persona-header { display: flex; gap: 15px; margin-bottom: 15px; align-items: flex-start; }
            .persona-avatar { width: 40px; height: 40px; border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14pt; }
            .persona-info { flex: 1; }
            .persona-info h3 { margin: 0; font-size: 14pt; }
            .persona-info p { margin: 0; font-size: 10pt; color: #64748b; }
            .persona-tags { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
            .persona-tags span { font-size: 8pt; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569; }
            .persona-decision { font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 10pt; border: 2px solid transparent; }
            .badge-buy { color: #10b981; border-color: #10b981; background: #ecfdf5; }
            .badge-pass { color: #f43f5e; border-color: #f43f5e; background: #fff1f2; }
            
            .persona-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .attr-box { background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 9pt; }
            .attr-box strong { display: block; color: #64748b; margin-bottom: 3px; }
            .attr-box p { margin: 0; }

            .review-box { padding: 10px; border-radius: 6px; margin-bottom: 15px; border-left-width: 4px; border-left-style: solid; }
            .review-buy { background: #f0fdf4; border-left-color: #10b981; }
            .review-pass { background: #fff1f2; border-left-color: #f43f5e; }
            .review-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 9pt; font-weight: bold; }
            .review-title { font-weight: bold; margin-bottom: 3px; }
            .review-body { font-size: 9pt; }
            
            .gap-box { padding: 10px; border-radius: 6px; margin-bottom: 15px; background: #fff1f2; border: 1px solid #fecdd3; }
            .gap-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 9pt; }
            .gap-box p { margin: 0; font-size: 9pt; color: #475569; }

            .history-section h4 { font-size: 10pt; color: #94a3b8; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; }
            .log-item { padding: 8px; border-radius: 6px; margin-bottom: 5px; font-size: 9pt; border: 1px solid transparent; }
            .log-label { font-size: 7pt; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .log-user { background: #eff6ff; border-color: #bfdbfe; } .log-user .log-label { color: #2563eb; }
            .log-persona { background: #faf5ff; border-color: #e9d5ff; } .log-persona .log-label { color: #9333ea; }
            .log-thought { background: #fffbeb; border-color: #fde68a; font-style: italic; color: #78350f; } .log-thought .log-label { color: #d97706; }
            .log-answer { background: #f0fdf4; border-color: #bbf7d0; } .log-answer .log-label { color: #16a34a; }
            .log-question { background: #f0f9ff; border-color: #bae6fd; } .log-question .log-label { color: #0ea5e9; }
            .log-decision { background: #f8fafc; border-color: #cbd5e1; } .log-decision .log-label { color: #475569; }
        </style>
    </head>
    <body>
        <div class="no-print-bar">
            <div class="title-bar">プレビュー: ${result.product.name}</div>
            <button class="print-btn" onclick="window.print()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                印刷 / PDFとして保存
            </button>
        </div>

        <div class="sheet">
            <header>
                <div>
                    <h1>Aqsh Insights Report</h1>
                    <div class="project-title">${result.product.name}</div>
                </div>
                <div class="meta">
                    発行日: ${date}<br>
                    ID: ${result.logs[0]?.id.substring(0,8) || 'N/A'}
                </div>
            </header>

            <div class="project-info">
                <p class="project-desc">${result.product.description}</p>
                <p style="font-size: 9pt; font-weight: bold; margin-top: 5px;">価格設定: ${result.product.price || '未設定'}</p>
            </div>

            <!-- Executive Dashboard -->
            <div class="dashboard">
                <div class="kpi-card">
                    <div class="kpi-label">市場受容率</div>
                    <div class="kpi-value" style="color: ${result.report.acceptanceRate >= 70 ? '#10b981' : result.report.acceptanceRate <= 30 ? '#f43f5e' : '#f59e0b'};">
                        ${result.report.acceptanceRate}<span style="font-size: 14pt;">%</span>
                    </div>
                    <div style="font-size: 8pt; color: #94a3b8; margin-top: 5px;">N=${result.personas.length}</div>
                </div>
                <div class="demo-card">
                    <div class="kpi-label" style="text-align: left; margin-bottom: 10px;">属性別反応</div>
                    ${demographicsHtml}
                </div>
            </div>

            <!-- Strategic Analytics -->
            <div class="section-title" style="font-size:14pt; margin-bottom:15px; border-bottom:1px solid #cbd5e1;">戦略分析ダッシュボード</div>
            <div class="analytics-grid">
                <div class="chart-card">
                    <div class="chart-title">商品力分析 (5-Axis Score)</div>
                    ${radarHtml}
                </div>
                <div class="chart-card">
                    <div class="chart-title">市場ポジショニング (Map)</div>
                    ${positioningHtml}
                </div>
                <div class="chart-card full-width-card">
                    <div class="chart-title">価格受容性分析 (Price Sensitivity)</div>
                    ${priceChartHtml}
                </div>
            </div>

            <div class="page-break"></div>

            <div class="report-content">
                ${reportHtml}
            </div>

            <div class="page-break"></div>

            <div class="section-title">ペルソナ別シミュレーション詳細</div>
            ${personasHtml}
        </div>
    </body>
    </html>
    `;

    // --- 4. Open Print Window ---
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("ポップアップがブロックされました。PDF生成のためにポップアップを許可してください。");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
};

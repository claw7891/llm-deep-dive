// === LLM Deep Dive: Shared Charting Functions ===
// Canvas-based data visualization widgets

(function() {
  'use strict';

  // --- Scaling Law Chart ---
  // Plots loss vs model parameters for different data regimes
  window.drawScalingChart = function(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = Math.max(rect.height, 260);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 30, bottom: 40, left: 50, right: 20 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const bg = '#24242a';
    const gridColor = '#36364a';
    const textColor = '#9292a4';

    // Data: loss vs log(param count) for various data sizes
    const datasets = [
      { label: 'D = 30B tokens', color: '#4ecdc4', data: [
        [8, 6.2], [8.5, 4.8], [9, 3.7], [9.5, 2.9], [10, 2.3], [10.5, 1.9]
      ]},
      { label: 'D = 300B tokens', color: '#a277ff', data: [
        [8, 5.5], [8.5, 4.0], [9, 2.9], [9.5, 2.1], [10, 1.6], [10.5, 1.3]
      ]},
      { label: 'D = 3T tokens', color: '#ff6b9d', data: [
        [8, 5.0], [8.5, 3.5], [9, 2.4], [9.5, 1.7], [10, 1.2], [10.5, 0.95]
      ]}
    ];

    const xMin = 7.8, xMax = 10.7, yMin = 0.5, yMax = 7;

    function toPlot(x, y) {
      return [
        pad.left + (x - xMin) / (xMax - xMin) * plotW,
        pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH
      ];
    }

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let x = 8; x <= 10.5; x += 0.5) {
      const [px] = toPlot(x, yMin);
      ctx.beginPath(); ctx.moveTo(px, pad.top); ctx.lineTo(px, pad.top + plotH); ctx.stroke();
    }
    for (let y = 1; y <= 6; y += 1) {
      const [, py] = toPlot(xMin, y);
      ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(pad.left + plotW, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#e4e4ec';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left - 5, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();

    // X labels
    ctx.fillStyle = textColor; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
    for (let x = 8; x <= 10.5; x += 0.5) {
      const [px] = toPlot(x, yMin);
      ctx.fillText(`10^${x}`, px, pad.top + plotH + 18);
    }
    ctx.fillText('Parameters', pad.left + plotW / 2, H - 4);

    // Y labels
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let y = 1; y <= 6; y += 1) {
      const [, py] = toPlot(xMin, y);
      ctx.fillText(y.toFixed(1), pad.left - 8, py);
    }
    ctx.save(); ctx.translate(14, pad.top + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillText('Cross-Entropy Loss', 0, 0);
    ctx.restore();

    // Plot data
    datasets.forEach(ds => {
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ds.data.forEach((pt, i) => {
        const [px, py] = toPlot(pt[0], pt[1]);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Points
      ds.data.forEach(pt => {
        const [px, py] = toPlot(pt[0], pt[1]);
        ctx.fillStyle = ds.color;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a1f';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Legend
    let legX = pad.left + 10;
    const legY = pad.top + 8;
    datasets.forEach(ds => {
      ctx.fillStyle = ds.color;
      ctx.fillRect(legX, legY, 12, 3);
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '10px system-ui';
      ctx.fillText(ds.label, legX + 16, legY + 2);
      legX += ctx.measureText(ds.label).width + 36;
    });
  };

  // --- Quantization Impact Bar Chart ---
  window.drawQuantChart = function(canvasId, precision) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = Math.max(rect.height, 200);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const data = {
      'FP32': { size: 100, quality: 100, color: '#a277ff' },
      'FP16': { size: 50,  quality: 99.8, color: '#4ecdc4' },
      'BF16': { size: 50,  quality: 99.7, color: '#4ecdc4' },
      'INT8': { size: 25,  quality: 98.5, color: '#ffb347' },
      'INT4': { size: 12.5, quality: 93, color: '#ff6b9d' },
      'NF4':  { size: 12.5, quality: 95, color: '#ff6b9d' }
    };

    const item = data[precision] || data['FP16'];
    ctx.fillStyle = '#24242a';
    ctx.fillRect(0, 0, W, H);

    const barW = Math.min(W * 0.35, 160);
    const barH = 120;
    const cx = W / 2;
    const barX = cx - barW / 2;
    const barY = 25;

    // Size bar
    ctx.fillStyle = '#36364a';
    ctx.fillRect(barX - barW / 2 - 40, barY + 10, barW + 20, 30);
    ctx.fillStyle = item.color;
    ctx.fillRect(barX - barW / 2 - 40, barY + 10, barW * item.size / 100 + 20, 30);

    ctx.fillStyle = '#e4e4ec';
    ctx.textAlign = 'center'; ctx.font = '12px system-ui';
    ctx.fillText(`Model Size: ${item.size}% of FP32`, cx, barY + 30);
    ctx.fillStyle = '#9292a4'; ctx.font = '10px system-ui';
    ctx.fillText('(smaller is better)', cx, barY + 52);

    // Quality bar
    const qy = barY + 70;
    ctx.fillStyle = '#36364a';
    ctx.fillRect(barX - barW / 2 - 40, qy + 10, barW + 20, 30);
    ctx.fillStyle = item.color;
    ctx.fillRect(barX - barW / 2 - 40, qy + 10, barW * item.quality / 100 + 20, 30);

    ctx.fillStyle = '#e4e4ec';
    ctx.font = '12px system-ui';
    ctx.fillText(`Quality: ${item.quality}% of FP32`, cx, qy + 30);
    ctx.fillStyle = '#9292a4'; ctx.font = '10px system-ui';
    ctx.fillText('(higher is better)', cx, qy + 52);

    // Precision label
    ctx.fillStyle = item.color;
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(precision, cx, qy + 80);
  };

  // --- Attention Heatmap (simplified) ---
  window.drawAttentionHeatmap = function(canvasId, headIndex) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const side = Math.min(rect.width, 320);
    canvas.width = side * dpr;
    canvas.height = side * dpr;
    ctx.scale(dpr, dpr);

    const tokens = ['The', 'cat', 'sat', 'on', 'the', 'mat', '.'];
    const n = tokens.length;
    const cell = (side - 40) / n;

    ctx.fillStyle = '#24242a';
    ctx.fillRect(0, 0, side, side);

    // Generate different attention patterns per head
    const heads = {
      0: [  // Syntactic head: attends to adjacent words
        [0.7,0.2,0.05,0.02,0.01,0.01,0.01],
        [0.15,0.6,0.15,0.05,0.02,0.02,0.01],
        [0.02,0.15,0.6,0.15,0.03,0.03,0.02],
        [0.01,0.03,0.15,0.6,0.15,0.05,0.01],
        [0.02,0.02,0.03,0.15,0.6,0.15,0.03],
        [0.01,0.01,0.02,0.05,0.15,0.6,0.16],
        [0.01,0.01,0.01,0.01,0.02,0.15,0.79]
      ],
      1: [  // Semantic head: attends to "cat", "mat", "sat"
        [0.1,0.5,0.2,0.05,0.1,0.03,0.02],
        [0.3,0.3,0.2,0.05,0.1,0.03,0.02],
        [0.2,0.3,0.25,0.05,0.1,0.05,0.05],
        [0.05,0.1,0.2,0.3,0.15,0.15,0.05],
        [0.05,0.1,0.05,0.1,0.4,0.2,0.1],
        [0.02,0.05,0.03,0.05,0.15,0.5,0.2],
        [0.01,0.01,0.02,0.02,0.05,0.2,0.69]
      ],
      2: [  // Positional head: diagonal focus with width
        [0.5,0.4,0.05,0.02,0.01,0.01,0.01],
        [0.3,0.4,0.2,0.05,0.03,0.01,0.01],
        [0.02,0.3,0.4,0.2,0.05,0.02,0.01],
        [0.01,0.02,0.3,0.4,0.2,0.05,0.02],
        [0.01,0.01,0.02,0.2,0.4,0.3,0.06],
        [0.01,0.01,0.01,0.02,0.2,0.5,0.25],
        [0.01,0.01,0.01,0.01,0.01,0.2,0.75]
      ]
    };

    const attn = heads[headIndex] || heads[0];
    const offX = 30;
    const offY = 10;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = Math.min(Math.max(attn[r][c], 0), 1);
        const intensity = Math.floor(v * 200);
        ctx.fillStyle = `rgb(${80 + intensity * 0.3}, ${60 + intensity * 0.2}, ${120 + intensity * 0.6})`;
        ctx.fillRect(offX + c * cell, offY + r * cell, cell - 2, cell - 2);

        if (v > 0.15) {
          ctx.fillStyle = '#e4e4ec';
          ctx.font = '10px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((v * 100).toFixed(0) + '%', offX + c * cell + cell / 2, offY + r * cell + cell / 2);
        }
      }
    }

    // Row labels
    ctx.fillStyle = '#9292a4';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    tokens.forEach((t, i) => {
      ctx.fillText(t, offX - 8, offY + i * cell + cell / 2);
    });

    // Column labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    tokens.forEach((t, i) => {
      ctx.fillText(t, offX + i * cell + cell / 2, offY - 5);
    });
  };

  // --- Model Size Comparison ---
  window.drawModelSizeChart = function(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = Math.max(W * 0.45, 180);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#24242a';
    ctx.fillRect(0, 0, W, H);

    const models = [
      { name: 'BERT-Base (2018)', params: 0.11, color: '#4ecdc4' },
      { name: 'GPT-2 (2019)', params: 1.5, color: '#a277ff' },
      { name: 'Llama 7B (2023)', params: 7, color: '#ffb347' },
      { name: 'Llama 70B (2023)', params: 70, color: '#ff6b9d' },
      { name: 'GPT-4 (2023)', params: 180, color: '#ff4757' },
    ];

    const maxP = Math.max(...models.map(m => m.params));
    const barH = 22;
    const gap = 8;
    const startX = W * 0.35;
    const barW = W * 0.6 - 10;
    const startY = 20;

    ctx.textBaseline = 'middle';
    models.forEach((m, i) => {
      const y = startY + i * (barH + gap);
      const w = (m.params / maxP) * barW;

      // Label
      ctx.fillStyle = '#e4e4ec';
      ctx.textAlign = 'right';
      ctx.font = '10px system-ui';
      ctx.fillText(m.name, startX - 6, y + barH / 2);

      // Bar
      ctx.fillStyle = m.color;
      ctx.fillRect(startX, y, Math.max(w, 8), barH);

      // Value
      ctx.fillStyle = '#e4e4ec';
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px system-ui';
      const label = m.params + (m.params < 1 ? 'M' : 'B');
      ctx.fillText(label, startX + Math.min(w + 4, barW + 4), y + barH / 2);
    });
  };

  // Resize handler for all charts
  function resizeCharts() {
    document.querySelectorAll('canvas[data-chart]').forEach(c => {
      const type = c.dataset.chart;
      const param = c.dataset.param;
      if (type === 'scaling') drawScalingChart(c.id);
      else if (type === 'quant') drawQuantChart(c.id, param || 'FP16');
      else if (type === 'attention') drawAttentionHeatmap(c.id, parseInt(param) || 0);
      else if (type === 'modelsize') drawModelSizeChart(c.id);
    });
  }

  window.addEventListener('resize', resizeCharts);
  window.addEventListener('load', () => setTimeout(resizeCharts, 100));
})();
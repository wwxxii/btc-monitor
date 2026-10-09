// 主圖多空比疊圖。資料是 Binance 全市場帳戶多空比，不是 BingX 用戶資料。
(() => {
  let ratios = [], lastRows = [], lastLevels = [];
  const oldDraw = drawCandles;
  const oldLoad = load;
  const button = document.createElement('button');
  button.className = 'ratio-toggle';
  button.textContent = '多空比線：開';
  document.querySelector('.cardhead').append(button);
  const style = document.createElement('style');
  style.textContent = '.ratio-toggle{border:1px solid #c38bff;border-radius:9px;background:#271b3d;color:#decaff;padding:7px 10px;font:inherit;cursor:pointer}.ratio-toggle.off{opacity:.55}';
  document.head.append(style);
  state.ratioOn = true;

  drawCandles = (rows, levels) => {
    lastRows = rows; lastLevels = levels;
    oldDraw(rows, levels);
    if (!state.ratioOn || !ratios.length) return;
    const canvas = $('#mainChart'), ctx = canvas.getContext('2d');
    const dpr = devicePixelRatio || 1, W = canvas.width / dpr, H = canvas.height / dpr;
    const p = {l: 12, r: 70, t: 12, b: 24};
    const values = ratios.map(x => +x.longShortRatio).filter(Number.isFinite);
    if (!values.length) return;
    const min = Math.min(...values, .95), max = Math.max(...values, 1.05), span = max - min || .1;
    const x = t => p.l + (+t - rows[0].t) / (rows.at(-1).t - rows[0].t || 1) * (W - p.l - p.r);
    const y = v => p.t + (max - v) / span * (H - p.t - p.b);
    ctx.save(); ctx.beginPath(); ctx.rect(p.l, p.t, W-p.l-p.r, H-p.t-p.b); ctx.clip();
    line(ctx, ratios.map(r => [x(r.timestamp), y(+r.longShortRatio)]), '#c38bff', 2);
    ctx.restore(); ctx.fillStyle = '#c38bff'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
    ctx.fillText(`多空比 ${ratios.at(-1).longShortRatio}`, W-74, 22);
  };

  load = async () => {
    if (location.protocol !== 'file:') {
      try {
        const r = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=${state.interval}&limit=120`);
        if (!r.ok) throw Error();
        ratios = await r.json();
      } catch { ratios = []; }
    }
    await oldLoad();
  };
  button.onclick = () => {
    state.ratioOn = !state.ratioOn;
    button.textContent = `多空比線：${state.ratioOn ? '開' : '關'}`;
    button.classList.toggle('off', !state.ratioOn);
    drawCandles(lastRows, lastLevels);
  };
  load();
  setInterval(load, 60000);
})();

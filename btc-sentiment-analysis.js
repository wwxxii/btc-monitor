// 背景使用三項衍生品資料；只顯示合併判讀，不展示原始數字卡片。
(() => {
  const box = document.createElement('section');
  box.className = 'sentiment-summary card';
  box.innerHTML = '<div class="summary-label">衍生品價格現況分析</div><p id="sentimentText">正在綜合全市場帳戶比、大戶持倉比與 OI…</p><small>資料以最近已完成週期比較；僅供市場觀察，不構成交易建議。</small>';
  document.querySelector('.macds').after(box);
  const style = document.createElement('style');
  style.textContent = '.sentiment-summary{margin-top:16px;padding:17px 18px}.summary-label{color:#c38bff;font-size:12px;font-weight:800;letter-spacing:.1em}.sentiment-summary p{margin:8px 0;color:#edf5fb;font-size:15px;line-height:1.65}.sentiment-summary small{color:#91a6b9}';
  document.head.append(style);
  const oldLoad = load;
  const change = (a, b) => b ? (a - b) / b * 100 : 0;
  const direction = v => v > 0 ? '偏多' : v < 0 ? '偏空' : '中性';
  const summarize = ({global, top, oi}) => {
    const g = +global.at(-1).longShortRatio, gChg = change(g, +global.at(-2).longShortRatio);
    const t = +top.at(-1).longShortRatio, tChg = change(t, +top.at(-2).longShortRatio);
    const o = +oi.at(-1).sumOpenInterestValue, oChg = change(o, +oi.at(-2).sumOpenInterestValue);
    const priceRows = state.latestMain || [], pChg = priceRows.length > 1 ? change(priceRows.at(-1).c, priceRows.at(-2).c) : 0;
    const priceState = pChg > 0 ? '價格走高' : pChg < 0 ? '價格走低' : '價格持平';
    const oiState = oChg > 0.35 ? 'OI 增加，代表有新部位進場' : oChg < -0.35 ? 'OI 減少，代表部位正在退出' : 'OI 變化有限';
    const crowd = `全市場帳戶${direction(g - 1)}${g > 1 ? '，多方帳戶較多' : '，空方帳戶較多'}；大戶持倉${direction(t - 1)}。`;
    let conclusion;
    if (pChg > 0 && oChg > .35 && t > 1) conclusion = '上漲伴隨 OI 與大戶多方持倉增強，短線動能偏多；但若全市場多方比例持續上升，要留意追多擁擠。';
    else if (pChg < 0 && oChg > .35 && t < 1) conclusion = '下跌伴隨 OI 增加與大戶空方持倉偏高，空方新倉較有主導性，現況偏空。';
    else if (pChg > 0 && oChg < -.35) conclusion = '上漲但 OI 下降，較像空單回補或舊倉平倉推動，續漲力道需再確認。';
    else if (pChg < 0 && oChg < -.35) conclusion = '下跌但 OI 下降，較像多單平倉或去槓桿，未必代表空方持續加碼。';
    else conclusion = '價格、OI 與大戶持倉尚未形成明確同向組合，現階段以等待下一根已完成 K 的變化確認為主。';
    $('#sentimentText').textContent = `${priceState}；${oiState}。${crowd}${conclusion}`;
  };
  load = async () => {
    try {
      const period = state.interval;
      const [global, top, oi] = await Promise.all([
        fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=${period}&limit=3`).then(r => r.json()),
        fetch(`https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=${period}&limit=3`).then(r => r.json()),
        fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=${period}&limit=3`).then(r => r.json())
      ]);
      await oldLoad();
      summarize({global, top, oi});
    } catch {
      await oldLoad();
      $('#sentimentText').textContent = '衍生品資料暫時無法同步，請稍後重新整理。';
    }
  };
  const inheritedDraw = drawCandles;
  drawCandles = (rows, levels) => { state.latestMain = rows; inheritedDraw(rows, levels); };
  load();
  setInterval(load, 60000);
})();

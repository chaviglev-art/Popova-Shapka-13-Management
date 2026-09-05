/* ============================================================
   Charts — dependency-free inline SVG (bars, donut, ring)
   Colors come from CSS variables --s1..--s6 (validated palette)
   ============================================================ */
const Charts = {
  /* Grouped bars: series = [{key,label,color}], data = [{label, [key]:value}] */
  bars(el, data, series, opts = {}) {
    const W = el.clientWidth || 640, H = opts.height || 220, padL = 44, padR = 8, padT = 14, padB = 28;
    const max = Math.max(1, ...data.flatMap(d => series.map(s => d[s.key] || 0)));
    const nice = niceMax(max);
    const iw = W - padL - padR, ih = H - padT - padB, gw = iw / data.length, bw = Math.min(22, (gw - 8) / series.length);
    let g = '';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = nice / ticks * i, y = padT + ih - (v / nice) * ih;
      g += `<line x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}" class="grid"/><text x="${padL - 8}" y="${y + 4}" class="tick" text-anchor="end">${fmtShort(v)}</text>`;
    }
    let bars = '';
    data.forEach((d, i) => {
      const x0 = padL + i * gw + (gw - bw * series.length - 2 * (series.length - 1)) / 2;
      series.forEach((s, j) => {
        const v = d[s.key] || 0, h = (v / nice) * ih, x = x0 + j * (bw + 2), y = padT + ih - h;
        bars += `<g class="bar-g"><rect x="${x}" y="${y}" width="${bw}" height="${Math.max(0, h)}" rx="3" fill="${s.color}" class="bar"><title>${d.label}: ${s.label} ${fmtMoneyPlain(v)}</title></rect></g>`;
      });
      if (gw >= 30 || i % 2 === 0) bars += `<text x="${padL + i * gw + gw / 2}" y="${H - 8}" class="tick" text-anchor="middle">${d.label}</text>`;
    });
    const legend = series.length > 1 ? `<div class="chart-legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div>` : '';
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="chart">${g}<line x1="${padL}" x2="${W - padR}" y1="${padT + ih}" y2="${padT + ih}" class="axis"/>${bars}</svg>${legend}`;
  },

  /* Donut: data = [{label,value,color}] */
  donut(el, data, opts = {}) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const R = 54, r = 36, C = 64; let a = -Math.PI / 2, paths = '';
    data.forEach(d => {
      const frac = d.value / total; if (frac <= 0) return;
      const a2 = a + frac * Math.PI * 2, gap = 0.03;
      paths += `<path d="${arcPath(C, C, R, r, a + gap / 2, Math.max(a + gap / 2, a2 - gap / 2))}" fill="${d.color}" class="slice"><title>${d.label}: ${fmtMoneyPlain(d.value)} (${Math.round(frac * 100)}%)</title></path>`;
      a = a2;
    });
    const center = opts.center !== undefined ? opts.center : fmtShort(total);
    el.innerHTML = `<div class="donut-wrap"><svg viewBox="0 0 128 128" class="donut">${paths}<text x="64" y="60" text-anchor="middle" class="donut-val">${center}</text><text x="64" y="76" text-anchor="middle" class="donut-sub">${opts.sub || ''}</text></svg>
      <div class="chart-legend col">${data.map(d => `<span><i style="background:${d.color}"></i>${d.label}<b>${Math.round(d.value / total * 100)}%</b></span>`).join('')}</div></div>`;
  },

  /* Progress ring, pct 0..100 */
  ring(pct, size = 84, color = 'var(--s1)') {
    const r = (size - 10) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="ring"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${off}"/><text x="50%" y="50%" dy="6" text-anchor="middle" class="ring-txt">${Math.round(pct)}%</text></svg>`;
  },

  /* 12 month status strip for one unit */
  strip(unitId, year) {
    const cur = monthISO(); const u = DB.units.find(x => x.id === unitId); if (!u) return '';
    let s = '<div class="strip">';
    for (let m = 1; m <= 12; m++) {
      const per = year + '-' + String(m).padStart(2, '0'); const paid = paidFor(unitId, per);
      const cls = per > cur ? 'future' : paid >= u.fee ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      s += `<span class="cell ${cls}" title="${fmtPeriod(per)}: ${fmtMoneyPlain(paid)} / ${fmtMoneyPlain(u.fee)}"><i>${t('months')[m - 1]}</i></span>`;
    }
    return s + '</div>';
  }
};
function arcPath(cx, cy, R, r, a1, a2) {
  const large = a2 - a1 > Math.PI ? 1 : 0;
  const p = (rad, ang) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
  const [x1, y1] = p(R, a1), [x2, y2] = p(R, a2), [x3, y3] = p(r, a2), [x4, y4] = p(r, a1);
  return `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
}
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10; return m * p; }
function fmtShort(v) { return v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(Math.round(v)); }
function fmtMoneyPlain(v) { return fmtMoney(v, { noDual: true }).replace(/<[^>]+>/g, ''); }

// 構成を選ぶと見積書が書き換わる。価格は2026年8月の国内報道（税込）。
// est: true の行は報道の差額からの計算値。
(() => {
  const CHIPS = {
    m6: {
      name: 'M6', base: 149800, baseMem: 16, baseSsd: '256GB', edu: 17000,
      mem: [16, 24, 32],
      ssd: { '256GB': 0, '512GB': 36000, '1TB': 90000 },
      ssdEst: {},
    },
    pro: {
      name: 'M5 Pro 15コア', base: 299800, baseMem: 24, baseSsd: '512GB', edu: 18000,
      mem: [24, 48, 64],
      ssd: { '512GB': 0, '1TB': 54000 },
      ssdEst: { '1TB': true },
    },
    'pro-max': {
      name: 'M5 Pro 18コア', base: 335800, baseMem: 24, baseSsd: '512GB', edu: 18000, baseEst: true,
      mem: [24, 48, 64],
      ssd: { '512GB': 0, '1TB': 54000 },
      ssdEst: { '1TB': true },
    },
  };
  const PER_GB = 4500;
  const ETH = 18000;
  const M4_LAUNCH = 94800;

  const form = document.getElementById('config');
  if (!form) return;
  const memBox = form.querySelector('[data-group="mem"]');
  const ssdBox = form.querySelector('[data-group="ssd"]');
  const rows = document.getElementById('slip-rows');
  const yen = (n) => n.toLocaleString('ja-JP');

  const choice = (name, value, label, note, checked) =>
    `<label><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${label}<small>${note}</small></span></label>`;

  function fill(chip, keep) {
    const c = CHIPS[chip];
    const mem = keep && c.mem.includes(+keep.mem) ? +keep.mem : c.baseMem;
    const ssd = keep && keep.ssd in c.ssd ? keep.ssd : c.baseSsd;
    memBox.innerHTML = c.mem.map((g) => choice('mem', g, `${g}GB`,
      g === c.baseMem ? '標準' : `+${yen((g - c.baseMem) * PER_GB)}円`, g === mem)).join('');
    ssdBox.innerHTML = Object.entries(c.ssd).map(([k, v]) => choice('ssd', k, k,
      v === 0 ? '標準' : `+${yen(v)}円${c.ssdEst[k] ? '（推定）' : ''}`, k === ssd)).join('');
  }

  function render() {
    const f = new FormData(form);
    const c = CHIPS[f.get('chip')];
    const mem = +f.get('mem');
    const ssd = f.get('ssd');
    const lines = [{ label: `本体 ${c.name}`, sub: `${c.baseMem}GB／${c.baseSsd}`, v: c.base, est: c.baseEst }];
    if (mem !== c.baseMem) lines.push({ label: `メモリ ${mem}GB`, sub: `${mem - c.baseMem}GB × 4,500円`, v: (mem - c.baseMem) * PER_GB });
    if (c.ssd[ssd]) lines.push({ label: `SSD ${ssd}`, sub: `${c.baseSsd}から`, v: c.ssd[ssd], est: c.ssdEst[ssd] });
    if (f.get('eth')) lines.push({ label: '10Gb Ethernet', sub: '2.5Gbから', v: ETH });
    if (f.get('edu')) lines.push({ label: '学生・教職員価格', sub: '最小構成の割引額をそのまま適用', v: -c.edu, est: true });
    const total = lines.reduce((s, l) => s + l.v, 0);

    rows.innerHTML = lines.map((l) =>
      `<tr><th scope="row">${l.label}${l.est ? '<span class="est">推定</span>' : ''}<small>${l.sub}</small></th>` +
      `<td class="num">${l.v < 0 ? '−' : ''}${yen(Math.abs(l.v))}</td></tr>`).join('');
    document.getElementById('slip-total').textContent = yen(total);
    document.getElementById('total').textContent = yen(total);
    const diff = total - M4_LAUNCH;
    document.getElementById('total-caption').textContent =
      `M4発売時の最小構成（94,800円）より${yen(Math.abs(diff))}円${diff >= 0 ? '高い' : '安い'}`;
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'chip') {
      const f = new FormData(form);
      fill(e.target.value, { mem: f.get('mem'), ssd: f.get('ssd') });
    }
    render();
  });
  fill('m6');
  render();
})();

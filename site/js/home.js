// 一覧ページ：カードの束（めくって選ぶ）と一覧の切り替え、タグのタブ、検索。
// 記事は index.html の <li class="entry" data-tags="…"> を足すだけでよい。番号・タブ・件数はここで作る。
(() => {
  const root = document.body;
  const list = document.getElementById('entries');
  const bar = document.getElementById('tag-filter');
  const count = document.getElementById('count');
  const detail = document.getElementById('detail');
  const empty = document.getElementById('empty');
  const display = document.getElementById('display');
  const q = document.getElementById('q');
  const wrap = document.getElementById('fan-wrap');
  if (!list || !bar) return;

  const entries = [...list.querySelectorAll('.entry')];
  const total = entries.length;
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 記事ごとの情報を読んで、番号・カテゴリ・矢印を足す ----
  const data = entries.map((el, i) => {
    const link = el.querySelector('.entry-link');
    const body = el.querySelector('.entry-body');
    const tags = el.dataset.tags.split(',');
    const no = total - i;
    const d = {
      el, link, tags, no,
      title: body.querySelector('h2').textContent.trim(),
      desc: body.querySelector('p:not(.entry-date)')?.textContent.trim() || '',
      date: body.querySelector('time')?.getAttribute('datetime') || '',
      slug: link.getAttribute('href').replace(/^posts\/|\/$/g, ''),
    };
    body.querySelector('h2').insertAdjacentHTML('afterend', `<span class="mono entry-no">${pad(no)}</span>`);
    const cat = document.createElement('span');
    cat.className = 'entry-cat';
    cat.textContent = tags[0];
    body.append(cat);
    body.insertAdjacentHTML('beforeend', '<span class="entry-arrow" aria-hidden="true">↗</span>');
    if (i === 0) link.insertAdjacentHTML('afterbegin', '<span class="mono badge">NEW</span>');
    d.text = (d.title + d.desc + tags.join(' ')).toLowerCase();
    return d;
  });

  document.getElementById('total').textContent = total;
  document.getElementById('range').textContent = `RECORDS / 001—${pad(total, 3)}`;
  document.getElementById('vol').textContent = `VOL. ${pad(total, 3)}`;

  // ---- タブ ----
  const tally = new Map();
  data.forEach((d) => d.tags.forEach((t) => tally.set(t, (tally.get(t) || 0) + 1)));
  [...tally.keys()].sort((a, b) => tally.get(b) - tally.get(a) || a.localeCompare(b, 'ja')).forEach((t) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'tab';
    b.type = 'button';
    b.dataset.tag = t;
    b.setAttribute('aria-pressed', 'false');
    b.textContent = t;
    b.insertAdjacentHTML('beforeend', `<small>${tally.get(t)}</small>`);
    li.append(b);
    bar.append(li);
  });

  // タグごとの見出し。無いタグは「〇〇のこと。」
  const lines = {
    '': '気になったら、<br>調べておく。',
    'Apple': '買う前に、<br>比べておく。',
    'AI': '話題の<em>AI</em>を、<br>確かめる。',
    '買うか迷い中': 'まだ、<br>迷っている。',
    '開発ツール': '道具は、<br>裏を取る。',
    'iOS開発': '作る道具を、<br>選ぶ。',
    'お金': '先に、<br>知っておく。',
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lineFor = (tag) => lines[tag] ?? `${esc(tag)}の、<br>こと。`;

  // ---- 状態 ----
  let tag = '';
  let shown = data;
  let active = 0;
  let view = 'fan';
  try { view = localStorage.getItem('loc-view') === 'grid' ? 'grid' : 'fan'; } catch (e) { /* 保存できなくても動く */ }

  function filter() {
    const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    shown = data.filter((d) => (!tag || d.tags.includes(tag)) && words.every((w) => d.text.includes(w)));
    data.forEach((d) => { d.el.hidden = !shown.includes(d); });
    empty.hidden = shown.length > 0;
    count.textContent = `${shown.length} / ${total}`;
    bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tag === tag)));
    active = 0;
    layout();
  }

  function setTag(next) {
    if (next === tag) return;
    tag = next;
    const url = new URL(location.href);
    tag ? url.searchParams.set('tag', tag) : url.searchParams.delete('tag');
    history.replaceState(null, '', url);
    if (reduce) display.innerHTML = lineFor(tag);
    else {
      display.classList.add('swap');
      setTimeout(() => { display.innerHTML = lineFor(tag); display.classList.remove('swap'); }, 220);
    }
    filter();
    bar.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }

  // ---- カードの束の並べ方 ----
  // 選んだカードを左寄りに置き、前のカードは左へ傾けて、次のカードは右下へ重ねる。端はつながる。
  function offset(i, n) {
    let d = i - active;
    if (n >= 3) {
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
    }
    return d;
  }

  function layout() {
    root.classList.toggle('is-fan', view === 'fan');
    document.querySelectorAll('.view-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    data.forEach((d) => d.el.classList.remove('is-active', 'is-off'));
    if (view !== 'fan' || !shown.length) {
      data.forEach((d) => d.el.style.removeProperty('--t'));
      detail.hidden = true;
      return;
    }
    const W = wrap.clientWidth;
    const narrow = W < 700;
    const cw = narrow ? Math.min(250, W * 0.64) : Math.min(310, Math.max(240, W * 0.27));
    const panel = narrow ? 0 : detail.offsetWidth || 320;
    const baseX = narrow ? (W - cw) * 0.5 : Math.min(W * 0.24, W - panel - cw - 40);
    const baseY = narrow ? 40 : 50;
    const n = shown.length;

    shown.forEach((d, i) => {
      const k = offset(i, n);
      const a = Math.abs(k);
      let x, y, z, ry, s, o;
      if (k === 0) { x = baseX; y = baseY; z = 0; ry = 0; s = 1; o = 1; }
      else if (k < 0) {
        x = baseX - a * cw * (narrow ? 0.55 : 0.72);
        y = baseY + a * 12;
        z = -a * 90; ry = 22; s = 1 - a * 0.04;
        o = a > 2 ? 0 : 1 - (a - 1) * 0.35;
      } else {
        const step = narrow ? 0.4 : 0.6;
        x = baseX + cw * (narrow ? 0.55 : 0.78) + (a - 1) * cw * step * 0.35;
        y = baseY + 30 + (a - 1) * (narrow ? 26 : 60);
        z = -a * 110; ry = -10; s = 0.94 - (a - 1) * 0.06;
        o = a > 4 ? 0 : 1 - (a - 1) * 0.2;
      }
      d.el.style.setProperty('--card-w', `${cw}px`);
      d.el.style.setProperty('--t', `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg) scale(${s})`);
      d.el.style.setProperty('--o', o);
      d.el.style.setProperty('--z', 100 - a * 2 + (k < 0 ? -1 : 0));
      d.el.classList.toggle('is-active', k === 0);
      d.el.classList.toggle('is-off', o === 0);
      d.link.tabIndex = k === 0 ? 0 : -1;
    });
    renderDetail(shown[active]);
  }

  function renderDetail(d) {
    detail.hidden = false;
    const tagsLine = d.tags.map(esc).join(' / ');
    detail.innerHTML = `
      <div class="mono detail-top"><span>${pad(d.no)} / ${pad(total, 3)}</span><a href="${d.link.getAttribute('href')}">記事 ↗</a></div>
      <p class="mono detail-eyebrow">${tagsLine}${d.no === total ? ' / 最新の記録' : ''}</p>
      <h2></h2>
      <p class="detail-desc"></p>
      <p class="mono detail-path">posts/<br><b>${esc(d.slug)}</b></p>
      <div class="detail-foot"><span class="mono">${d.date.replace(/-/g, '.')}</span><a class="btn btn-s" href="${d.link.getAttribute('href')}">読む <span aria-hidden="true">↗</span></a></div>`;
    detail.querySelector('h2').textContent = d.title;
    detail.querySelector('.detail-desc').textContent = d.desc;
  }

  function go(step) {
    if (view !== 'fan' || shown.length < 2) return;
    const n = shown.length;
    active = n >= 3 ? (active + step + n) % n : Math.min(n - 1, Math.max(0, active + step));
    layout();
  }

  // ---- 操作 ----
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) setTag(b.dataset.tag);
  });

  list.addEventListener('click', (e) => {
    if (view !== 'fan') return;
    const li = e.target.closest('.entry');
    const i = shown.findIndex((d) => d.el === li);
    if (i < 0 || i === active) return;
    e.preventDefault();
    active = i;
    layout();
  });

  document.querySelectorAll('.view-btn').forEach((b) => b.addEventListener('click', () => {
    view = b.dataset.view;
    try { localStorage.setItem('loc-view', view); } catch (e) { /* noop */ }
    layout();
  }));

  q.addEventListener('input', filter);

  document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea');
    if ((e.key === '/' && !typing) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      q.focus();
      return;
    }
    if (e.key === 'Escape' && typing) { q.value = ''; filter(); q.blur(); return; }
    if (typing) return;
    if (e.key === 'ArrowRight') { go(1); }
    if (e.key === 'ArrowLeft') { go(-1); }
  });

  // ホイールとスワイプでめくる
  let lock = 0;
  wrap.addEventListener('wheel', (e) => {
    if (view !== 'fan') return;
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
    if (Math.abs(dx) < 12) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lock < 420) return;
    lock = now;
    go(dx > 0 ? 1 : -1);
  }, { passive: false });

  let sx = null;
  let sy = null;
  wrap.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  wrap.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  });

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });

  // ---- はじめ ----
  const initial = new URLSearchParams(location.search).get('tag') || '';
  tag = tally.has(initial) ? initial : '';
  display.innerHTML = lineFor(tag);
  filter();
  requestAnimationFrame(() => bar.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' }));
})();

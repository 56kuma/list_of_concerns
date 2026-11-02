// 一覧のタグ絞り込み。記事の data-tags からボタンを作り、?tag= と同期する。
(() => {
  const list = document.getElementById('entries');
  const bar = document.getElementById('tag-filter');
  const count = document.getElementById('count');
  if (!list || !bar) return;
  const entries = [...list.querySelectorAll('.entry')];

  const tally = new Map();
  entries.forEach((el) => el.dataset.tags.split(',').forEach((t) => tally.set(t, (tally.get(t) || 0) + 1)));
  [...tally.keys()].sort((a, b) => tally.get(b) - tally.get(a) || a.localeCompare(b, 'ja')).forEach((t) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="tag" type="button" aria-pressed="false"></button>`;
    const b = li.firstChild;
    b.dataset.tag = t;
    b.textContent = `${t}（${tally.get(t)}）`;
    bar.appendChild(li);
  });

  function apply(tag) {
    let shown = 0;
    entries.forEach((el) => {
      const hit = !tag || el.dataset.tags.split(',').includes(tag);
      el.hidden = !hit;
      if (hit) shown++;
    });
    bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tag === tag)));
    count.textContent = tag ? `「${tag}」の記録 ${shown}件` : `記録 ${shown}件`;
  }

  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const tag = b.dataset.tag;
    const url = new URL(location.href);
    tag ? url.searchParams.set('tag', tag) : url.searchParams.delete('tag');
    history.replaceState(null, '', url);
    apply(tag);
  });

  // 記事カード内のタグリンクもページ遷移せずに絞り込む
  list.addEventListener('click', (e) => {
    const a = e.target.closest('.entry-tags a');
    if (!a) return;
    e.preventDefault();
    const tag = new URL(a.href).searchParams.get('tag');
    history.replaceState(null, '', a.href);
    apply(tag);
    bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const initial = new URLSearchParams(location.search).get('tag') || '';
  apply(tally.has(initial) ? initial : '');
})();

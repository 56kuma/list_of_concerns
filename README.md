# list_of_concerns
気になったことの記録用

気になったことを調べて、わかったところまで書いておくサイト。素の HTML/CSS で、Cloudflare Pages から公開する。

## 構成

```
site/                     ← 公開するのはこのフォルダだけ
  index.html              一覧（タグで絞り込み。?tag=Apple のようにURLでも指定できる）
  css/site.css            全ページ共通（色・文字・ボタン・タグ）
  css/home.css            一覧ページ
  js/tags.js              タグ絞り込み
  js/rise.js              スクロールで要素が出てくる動き
  img/<テーマ>/            写真。credits.json に出典とライセンス
  posts/<記事スラッグ>/     記事1本 = 1フォルダ（index.html と記事専用の css/js）
```

## 記録

| 日付 | 記事 | タグ |
| --- | --- | --- |
| 2026-11-02 | [Mac mini（M6）は買いか](site/posts/mac-mini-2026/index.html) | Apple, ガジェット, 買うか迷い中 |

## 記事の足し方

1. `site/posts/<スラッグ>/index.html` を作る（既存記事をコピーして中身を差し替えるのが早い）
2. `site/index.html` の `<ol id="entries">` の先頭に `<li class="entry" data-tags="タグ1,タグ2">…</li>` を1つ足す
   - タグのボタンは `data-tags` から自動で作られる。タグを増やすのにほかの作業はいらない
3. 上の「記録」の表に1行足す
4. 写真を使うときは出典とライセンスを `img/<テーマ>/credits.json` とページのフッターに書く

## 書き方

- 冒頭に「この記事でわかること」と先に結論
- 一人称は「自分」、常体。箇条書きと表を中心に、最後に「結論」
- 値段や仕様は調べた日付を書く。推定値は推定と明記する

## 公開（Cloudflare Pages）

GitHub 連携で、`main` に push すると自動で公開される。

初回だけ Cloudflare ダッシュボードで設定する。

1. Workers & Pages → Create → Pages → Connect to Git → `56kuma/list_of_concerns`
2. Framework preset: `None`
3. Build command: 空欄
4. Build output directory: `site`
5. Save and Deploy

「Import a repository」から Worker として作った場合は、ルートの `wrangler.jsonc` が `site/` を静的アセットとして配信する（Deploy command は `npx wrangler deploy` のまま）。URL は Settings → Domains & Routes の `workers.dev` で確認・有効化する。

ローカルで確認するときは `npx serve site` か、`site/index.html` をブラウザで直接開く。

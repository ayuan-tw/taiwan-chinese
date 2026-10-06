# 澄詞 開発管理

## このソースの版
Ver.6.10.2（feature branchのCloudflareテスト公開版）

## Ver.6のテーマ
辞書エンジン分離＋リスニング強化

## 構成
- `index.html`：画面
- `js/app.js`：既存機能と学習ロジック
- `css/style.css`：見た目
- `data/words.js`：基本辞書
- `data/overrides.json`：注音表記の差分資料
- `js/dictionary-loader.js`：旧構成向け（現在のindex.htmlでは未読込）
- `js/recall-cards.js`：單字の想起練習・進捗
- `js/personal-cards.js`：個人カードの追加・編集・比較UI
- `js/card-store.js`：個人差分・IndexedDB保存・競合管理
- `js/cloudflare-sync.js`：同一オリジンの差分同期・ログイン状態・再試行
- `sync-config.js`：無効な同期設定スタブ（公開情報のみ）
- `service-worker.js`：PWAキャッシュ
- `js/data-model.js`：共通 ID・種類・タグ分類
- `js/shortcut-export.js`：ショートカット用テキストの絞り込み・整形・コピー・共有・保存
- `js/speech-recognition.js`：台湾華語の文字起こし・お手本比較・ブラウザ対応判定
- `docs/TAG_TAXONOMY.md`：タグの分類と絞り込み仕様
- `docs/PENDING_ADDITIONS.md`：重複整理前の追加候補（追加完了時に0件へ戻す）

## 変更時の原則
1. 基本辞書の一括更新は `data/words.js`。
2. 学習カードは `data/words.js`。`data/overrides.json` は注音表記の差分資料で、学習カード用ではない。
3. Studio生成の `data/zhuyin-dict.js` は書き換えない。
4. 版を上げる時は index.html、app.js、service-worker.js、version.json、CHANGELOG.md を揃える。

## ローカル確認
- `node tests/recall.test.cjs`
- `node tests/personal-cards.test.cjs`
- `node --test tests/personal-cards-regression.test.cjs tests/card-store.test.cjs tests/cloudflare-sync.test.cjs`
- `node tests/app-smoke.test.cjs`
- `node tests/data-preservation.test.cjs`
- `node tests/service-worker.test.cjs`
- `node --check js/recall-cards.js`
- `git diff --check`

テストは依存パッケージ不要。DOMテストは軽量ハーネスであり、実ブラウザのレイアウト・Safari音声確認を代替しない。

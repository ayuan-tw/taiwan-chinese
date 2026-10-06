# 澄詞 開発管理

## このソースの版
Ver.6.11.0（単語帳統合のCloudflareテスト公開用）

## Ver.6のテーマ
辞書エンジン分離＋リスニング強化

## 構成
- `index.html`：画面
- `js/app.js`：既存機能と学習ロジック
- `css/style.css`：見た目
- `data/words.js`：単語の初期シード／移行前のオフライン表示、句型・慣用句・口ぐせ
- `data/overrides.json`：注音表記の差分資料
- `js/dictionary-loader.js`：旧構成向け（現在のindex.htmlでは未読込）
- `js/recall-cards.js`：單字の想起練習・進捗
- `js/personal-cards.js`：個人カードの追加・編集・比較UI
- `js/card-store.js`：統合単語帳・IndexedDB保存・移行前の保管・競合管理
- `js/cloudflare-sync.js`：同一オリジンの差分同期・ログイン状態・再試行
- `sync-config.js`：無効な同期設定スタブ（公開情報のみ）
- `service-worker.js`：PWAキャッシュ
- `js/data-model.js`：共通 ID・種類・タグ分類
- `js/shortcut-export.js`：ショートカット用テキストの絞り込み・整形・コピー・共有・保存
- `js/speech-recognition.js`：台湾華語の文字起こし・お手本比較・ブラウザ対応判定
- `docs/TAG_TAXONOMY.md`：タグの分類と絞り込み仕様
- `docs/PENDING_ADDITIONS.md`：重複整理前の追加候補（追加完了時に0件へ戻す）

## 変更時の原則
1. 統合後の単語の管理元はCloudflare。追加・変更は単語帳へ反映し、アプリの初期シードだけを更新して既存端末への反映と扱わない。
2. `data/words.js` の単語は初回移行・未移行時の表示用。型・慣用句・口ぐせは引き続きこのファイル。`data/overrides.json` は注音表記の差分資料で、学習カード用ではない。
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

## 統合単語帳の移行

`docs/UNIFIED_VOCABULARY_MIGRATION.md` にスキーマ適用順、保管、世代境界、復旧と公開前の確認を記載。公開・リモートDB操作は別途確認する。

# 澄詞 開発管理

## 現在の正式版
Ver.6.0.2

## Ver.6のテーマ
辞書エンジン分離＋リスニング強化

## 構成
- `index.html`：画面
- `app.js`：既存機能と学習ロジック
- `style.css`：見た目
- `data/base/dictionary.js`：基本辞書
- `data/user/override.json`：個人差分
- `js/dictionary-loader.js`：基本辞書と差分のマージ
- `service-worker.js`：PWAキャッシュ

## 変更時の原則
1. 基本辞書の一括更新は `data/base/dictionary.js`。
2. あゆあん独自の追加・修正は `data/user/override.json`。
3. 同じキーはoverrideを優先。
4. 版を上げる時は index.html、app.js、service-worker.js、version.json、CHANGELOG.md を揃える。

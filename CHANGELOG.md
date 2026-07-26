# 澄詞 更新履歴

## Ver.6.0.2
- フォルダ整理版の参照パスを再確認
- アプリ、フッター、PWAキャッシュのバージョン表記を統一
- 既存のVer.5.7.0機能を維持したまま「音から單字」を追加
- `data/base` と `data/user` の辞書構成を正式採用

## Ver.6.0.1
- JavaScriptを js/、CSSを css/、アイコンを assets/icons/ に整理
- 注音辞書を data/base/ に移動
- index.html、manifest.json、service-worker.jsの参照先を新構成へ更新
- GitHub上で役割ごとに管理しやすい構成へ変更


## Ver.6.0.0（2026-07-26）
- 🎧 「音から單字」を追加
- 入力して答える／頭の中で答えるモードを追加
- 間違えた單字を復習優先へ連携
- 基本辞書を `data/base/dictionary.js` に分離
- 個人差分用 `data/user/override.json` を追加
- 開発管理用 `docs/` を追加

## Ver.5.7.0
- アプリ内アップデート機能を追加

澄詞 Ver.6.0.2

【上書き方法】
このフォルダの「中身」を、GitHub Pagesの現在の澄詞フォルダへすべて上書きしてください。
Ver.5系でルート直下にあった app.js / style.css / zhuyin-dict.js / zhuyin-lite.js / icon.svg / words.js は、Ver.6.0.2では使いません。動作確認後に削除できます。

【フォルダ構成】
css/style.css                  : 画面デザイン
js/app.js                      : アプリ本体
js/zhuyin-lite.js              : 注音変換処理
js/dictionary-loader.js        : 基本辞書＋個人差分のマージ
data/base/dictionary.js        : 配布版の基本学習辞書
data/base/zhuyin-dict.js       : 注音辞書
data/user/override.json        : あゆあん個人の追加・修正差分
assets/icons/icon.svg          : PWAアイコン
docs/                          : 開発メモ・仕様・ロードマップ
service-worker.js              : PWA制御のためルート直下のまま
manifest.json                  : PWA設定のためルート直下のまま

重要：css、js、data、assets、docsフォルダも含め、フォルダ構成を保ったままアップロードしてください。

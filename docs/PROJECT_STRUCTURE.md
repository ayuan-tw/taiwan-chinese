# 澄詞 フォルダ構成

```text
/
├─ index.html
├─ manifest.json
├─ service-worker.js
├─ version.json
├─ CHANGELOG.md
├─ README.txt
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js
│  ├─ data-model.js
│  ├─ dictionary-loader.js
│  ├─ shortcut-export.js
│  └─ zhuyin-lite.js
├─ data/
│  ├─ base/
│  │  ├─ dictionary.js
│  │  └─ zhuyin-dict.js
│  └─ user/
│     └─ override.json
├─ assets/
│  └─ icons/
│     └─ icon.svg
└─ docs/
```

`service-worker.js` はサイト全体を制御できるようルート直下に置きます。
`manifest.json` と `index.html` も入口ファイルなのでルート直下に置きます。

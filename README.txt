澄詞 Ver.6.0.0

【上書き方法】
このフォルダの「中身」を、GitHub Pagesの現在の澄詞フォルダへすべて上書きしてください。
古い words.js はVer.6では使いません。GitHub上に残っていても動作には影響しませんが、削除して構いません。

【辞書構成】
data/base/dictionary.js : 配布版の基本辞書
data/user/override.json : あゆあん個人の追加・修正差分

同じ word / pattern / text がoverrideにある場合、override側の項目で上書きされます。

重要：data、js、docsフォルダも含め、フォルダ構成を保ったままアップロードしてください。

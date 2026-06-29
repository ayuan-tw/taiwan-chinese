const words = [
  { category: "副詞", word: "至少", zhuyin: "ㄓˋ ㄕㄠˇ", meaning: "少なくとも", note: "最低ラインを言うときに便利。", example: "至少要等一下。", exampleZhuyin: "ㄓˋ ㄕㄠˇ ㄧㄠˋ ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ" },
  { category: "買い物", word: "划算", zhuyin: "ㄏㄨㄚˊ ㄙㄨㄢˋ", meaning: "お得、コスパがいい", note: "夜市・買い物でかなり使える。", example: "這個很划算耶。", exampleZhuyin: "ㄓㄜˋ ㄍㄜ˙ ㄏㄣˇ ㄏㄨㄚˊ ㄙㄨㄢˋ ㄧㄝ" },
  { category: "副詞", word: "剛好", zhuyin: "ㄍㄤ ㄏㄠˇ", meaning: "ちょうど", note: "時間・量・タイミングがぴったり。", example: "時間剛好。", exampleZhuyin: "ㄕˊ ㄐㄧㄢ ㄍㄤ ㄏㄠˇ" },
  { category: "副詞", word: "差不多", zhuyin: "ㄔㄚ ㄅㄨˋ ㄉㄨㄛ", meaning: "だいたい、そろそろ", note: "ざっくり感。ゲームでも日常でも強い。", example: "差不多滿了。", exampleZhuyin: "ㄔㄚ ㄅㄨˋ ㄉㄨㄛ ㄇㄢˇ ㄌㄜ˙" },
  { category: "副詞", word: "幾乎", zhuyin: "ㄐㄧ ㄏㄨ", meaning: "ほとんど", note: "幾乎每天＝ほとんど毎日。", example: "我幾乎每天都用。", exampleZhuyin: "ㄨㄛˇ ㄐㄧ ㄏㄨ ㄇㄟˇ ㄊㄧㄢ ㄉㄡ ㄩㄥˋ" },
  { category: "リアクション", word: "原來", zhuyin: "ㄩㄢˊ ㄌㄞˊ", meaning: "なんだ、そうだったんだ", note: "新しく事情がわかった時の「なるほど」。", example: "原來是這樣啊。", exampleZhuyin: "ㄩㄢˊ ㄌㄞˊ ㄕˋ ㄓㄜˋ ㄧㄤˋ ㄚ" },
  { category: "リアクション", word: "竟然", zhuyin: "ㄐㄧㄥˋ ㄖㄢˊ", meaning: "まさか、意外にも", note: "びっくり・予想外の感じ。", example: "你竟然不知道！", exampleZhuyin: "ㄋㄧˇ ㄐㄧㄥˋ ㄖㄢˊ ㄅㄨˋ ㄓ ㄉㄠˋ" },
  { category: "推量", word: "說不定", zhuyin: "ㄕㄨㄛ ㄅㄨˊ ㄉㄧㄥˋ", meaning: "もしかしたら", note: "可能より少し口語っぽく、軽い推測。", example: "說不定明天會下雨。", exampleZhuyin: "ㄕㄨㄛ ㄅㄨˊ ㄉㄧㄥˋ ㄇㄧㄥˊ ㄊㄧㄢ ㄏㄨㄟˋ ㄒㄧㄚˋ ㄩˇ" },
  { category: "会話", word: "想不出來", zhuyin: "ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ", meaning: "思いつかない", note: "言いたい言葉が出てこない時にも使える。", example: "我想不出來。", exampleZhuyin: "ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ" },
  { category: "会話", word: "想不起來", zhuyin: "ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ", meaning: "思い出せない", note: "記憶にあるはずのものが出てこない時。", example: "我想不起來那個字。", exampleZhuyin: "ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ ㄋㄚˋ ㄍㄜ˙ ㄗˋ" },
  { category: "ゲーム", word: "記得要", zhuyin: "ㄐㄧˋ ㄉㄜ˙ ㄧㄠˋ", meaning: "忘れずに〜してね", note: "口語では「要」が省略されることもある。", example: "記得要開泡泡。", exampleZhuyin: "ㄐㄧˋ ㄉㄜ˙ ㄧㄠˋ ㄎㄞ ㄆㄠˋ ㄆㄠˋ" },
  { category: "会話", word: "還好", zhuyin: "ㄏㄞˊ ㄏㄠˇ", meaning: "まあまあ、大丈夫、幸いにも", note: "返事にも状況説明にも使える万能語。", example: "還好我有帶傘。", exampleZhuyin: "ㄏㄞˊ ㄏㄠˇ ㄨㄛˇ ㄧㄡˇ ㄉㄞˋ ㄙㄢˇ" },
  { category: "副詞", word: "其實", zhuyin: "ㄑㄧˊ ㄕˊ", meaning: "実は、本当は", note: "話を少し補足・修正するときに便利。", example: "其實我也不知道。", exampleZhuyin: "ㄑㄧˊ ㄕˊ ㄨㄛˇ ㄧㄝˇ ㄅㄨˋ ㄓ ㄉㄠˋ" },
  { category: "副詞", word: "好像", zhuyin: "ㄏㄠˇ ㄒㄧㄤˋ", meaning: "〜みたい、〜のようだ", note: "ㄏㄠˇは3声、ㄒㄧㄤˋは4声。覚え直し枠。", example: "我好像懂一點了。", exampleZhuyin: "ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄉㄨㄥˇ ㄧˋ ㄉㄧㄢˇ ㄌㄜ˙" },
  { category: "副詞", word: "可能", zhuyin: "ㄎㄜˇ ㄋㄥˊ", meaning: "たぶん、可能性がある", note: "會と一緒に使うと「〜するかも」。", example: "我可能會晚一點到。", exampleZhuyin: "ㄨㄛˇ ㄎㄜˇ ㄋㄥˊ ㄏㄨㄟˋ ㄨㄢˇ ㄧˋ ㄉㄧㄢˇ ㄉㄠˋ" },
  { category: "会話", word: "沒關係", zhuyin: "ㄇㄟˊ ㄍㄨㄢ ㄒㄧˋ", meaning: "大丈夫、気にしないで", note: "謝られた時の返事に自然。", example: "沒關係，不用擔心。", exampleZhuyin: "ㄇㄟˊ ㄍㄨㄢ ㄒㄧˋ，ㄅㄨˊ ㄩㄥˋ ㄉㄢ ㄒㄧㄣ" },
  { category: "会話", word: "不會不會", zhuyin: "ㄅㄨˊ ㄏㄨㄟˋ ㄅㄨˊ ㄏㄨㄟˋ", meaning: "いえいえ、大丈夫です", note: "謝罪やお礼への軽い返し。", example: "不會不會，沒事啦。", exampleZhuyin: "ㄅㄨˊ ㄏㄨㄟˋ ㄅㄨˊ ㄏㄨㄟˋ，ㄇㄟˊ ㄕˋ ㄌㄚ" },
  { category: "会話", word: "沒事", zhuyin: "ㄇㄟˊ ㄕˋ", meaning: "大丈夫、何でもない", note: "カジュアルで使いやすい。", example: "我沒事，謝謝。", exampleZhuyin: "ㄨㄛˇ ㄇㄟˊ ㄕˋ，ㄒㄧㄝˋ ㄒㄧㄝ˙" },
  { category: "会話", word: "等一下", zhuyin: "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ", meaning: "ちょっと待って", note: "一下はここでは軽くする感じ。", example: "等一下，我看一下。", exampleZhuyin: "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ，ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ" },
  { category: "会話", word: "看一下", zhuyin: "ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ", meaning: "ちょっと見る、確認する", note: "看看より少し一回確認する感じ。", example: "我先看一下。", exampleZhuyin: "ㄨㄛˇ ㄒㄧㄢ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ" },
  { category: "会話", word: "吃吃看", zhuyin: "ㄔ ㄔ ㄎㄢˋ", meaning: "食べてみる", note: "V V 看＝ちょっと〜してみる。", example: "我想吃吃看潤餅。", exampleZhuyin: "ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄔ ㄎㄢˋ ㄖㄨㄣˋ ㄅㄧㄥˇ" },
  { category: "会話", word: "用看看", zhuyin: "ㄩㄥˋ ㄎㄢˋ ㄎㄢˋ", meaning: "使ってみる", note: "台湾でよく聞く自然な言い方。", example: "你可以用看看。", exampleZhuyin: "ㄋㄧˇ ㄎㄜˇ ㄧˇ ㄩㄥˋ ㄎㄢˋ ㄎㄢˋ" },
  { category: "会話", word: "只能", zhuyin: "ㄓˇ ㄋㄥˊ", meaning: "〜するしかない", note: "選択肢がない感じ。", example: "我只能習慣了。", exampleZhuyin: "ㄨㄛˇ ㄓˇ ㄋㄥˊ ㄒㄧˊ ㄍㄨㄢˋ ㄌㄜ˙" },
  { category: "会話", word: "難怪", zhuyin: "ㄋㄢˊ ㄍㄨㄞˋ", meaning: "どうりで、なるほどそれで", note: "理由がわかって納得した時。", example: "難怪你這麼累。", exampleZhuyin: "ㄋㄢˊ ㄍㄨㄞˋ ㄋㄧˇ ㄓㄜˋ ㄇㄜ˙ ㄌㄟˋ" },
  { category: "リアクション", word: "真的假的", zhuyin: "ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙", meaning: "本当に？マジで？", note: "台湾の会話でよく使う驚き表現。", example: "真的假的？太誇張了吧。", exampleZhuyin: "ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙？ㄊㄞˋ ㄎㄨㄚ ㄓㄤ ㄌㄜ˙ ㄅㄚ" },
  { category: "リアクション", word: "蛤", zhuyin: "ㄏㄚˊ", meaning: "え？は？", note: "驚き・聞き返し。強く言うときつく聞こえる。", example: "蛤？怎麼會這樣？", exampleZhuyin: "ㄏㄚˊ？ㄗㄣˇ ㄇㄜ˙ ㄏㄨㄟˋ ㄓㄜˋ ㄧㄤˋ" },
  { category: "ゲーム", word: "開泡泡", zhuyin: "ㄎㄞ ㄆㄠˋ ㄆㄠˋ", meaning: "シールドを張る", note: "ゲーム内の口語表現としてメモ。", example: "記得開泡泡。", exampleZhuyin: "ㄐㄧˋ ㄉㄜ˙ ㄎㄞ ㄆㄠˋ ㄆㄠˋ" },
  { category: "ゲーム", word: "滿了", zhuyin: "ㄇㄢˇ ㄌㄜ˙", meaning: "満員になった、いっぱいになった", note: "集結や枠が埋まった時に便利。", example: "已經滿了。", exampleZhuyin: "ㄧˇ ㄐㄧㄥ ㄇㄢˇ ㄌㄜ˙" },
  { category: "ゲーム", word: "自行前往", zhuyin: "ㄗˋ ㄒㄧㄥˊ ㄑㄧㄢˊ ㄨㄤˇ", meaning: "各自で向かう", note: "やや書き言葉寄りだけどゲーム告知で見る。", example: "工程站自行前往拜訪。", exampleZhuyin: "ㄍㄨㄥ ㄔㄥˊ ㄓㄢˋ ㄗˋ ㄒㄧㄥˊ ㄑㄧㄢˊ ㄨㄤˇ ㄅㄞˋ ㄈㄤˇ" },
  { category: "天気", word: "颱風假", zhuyin: "ㄊㄞˊ ㄈㄥ ㄐㄧㄚˋ", meaning: "台風休み", note: "台湾らしい話題。日本には基本ないやつ。", example: "日本沒有放颱風假。", exampleZhuyin: "ㄖˋ ㄅㄣˇ ㄇㄟˊ ㄧㄡˇ ㄈㄤˋ ㄊㄞˊ ㄈㄥ ㄐㄧㄚˋ" },
  { category: "天気", word: "涼快", zhuyin: "ㄌㄧㄤˊ ㄎㄨㄞˋ", meaning: "涼しい", note: "冷は寒い寄り。涼快は気持ちいい涼しさ。", example: "明天好像會比較涼快。", exampleZhuyin: "ㄇㄧㄥˊ ㄊㄧㄢ ㄏㄠˇ ㄒㄧㄤˋ ㄏㄨㄟˋ ㄅㄧˇ ㄐㄧㄠˋ ㄌㄧㄤˊ ㄎㄨㄞˋ" },

  { category: "副詞", word: "原本", zhuyin: "ㄩㄢˊ ㄅㄣˇ", meaning: "もともと", note: "予定や状態がもともとそうだった時。", example: "我原本想去夜市。", exampleZhuyin: "ㄨㄛˇ ㄩㄢˊ ㄅㄣˇ ㄒㄧㄤˇ ㄑㄩˋ ㄧㄝˋ ㄕˋ" },
  { category: "副詞", word: "本來", zhuyin: "ㄅㄣˇ ㄌㄞˊ", meaning: "もともと、本来", note: "原本に近い。口語でもよく使う。", example: "我本來就知道。", exampleZhuyin: "ㄨㄛˇ ㄅㄣˇ ㄌㄞˊ ㄐㄧㄡˋ ㄓ ㄉㄠˋ" },
  { category: "副詞", word: "後來", zhuyin: "ㄏㄡˋ ㄌㄞˊ", meaning: "その後、結局", note: "時間が進んだ後の展開。", example: "後來我還是去了。", exampleZhuyin: "ㄏㄡˋ ㄌㄞˊ ㄨㄛˇ ㄏㄞˊ ㄕˋ ㄑㄩˋ ㄌㄜ˙" },
  { category: "接続", word: "然後", zhuyin: "ㄖㄢˊ ㄏㄡˋ", meaning: "それから、そして", note: "話をつなぐ口語の定番。", example: "然後我就回家了。", exampleZhuyin: "ㄖㄢˊ ㄏㄡˋ ㄨㄛˇ ㄐㄧㄡˋ ㄏㄨㄟˊ ㄐㄧㄚ ㄌㄜ˙" },
  { category: "接続", word: "之後", zhuyin: "ㄓ ㄏㄡˋ", meaning: "〜の後で", note: "出来事の後を言う。", example: "吃完飯之後，我想散步。", exampleZhuyin: "ㄔ ㄨㄢˊ ㄈㄢˋ ㄓ ㄏㄡˋ，ㄨㄛˇ ㄒㄧㄤˇ ㄙㄢˋ ㄅㄨˋ" },
  { category: "接続", word: "以後", zhuyin: "ㄧˇ ㄏㄡˋ", meaning: "これから、以後", note: "今後の話にも使える。", example: "以後我會記得。", exampleZhuyin: "ㄧˇ ㄏㄡˋ ㄨㄛˇ ㄏㄨㄟˋ ㄐㄧˋ ㄉㄜ˙" },
  { category: "副詞", word: "剛剛", zhuyin: "ㄍㄤ ㄍㄤ", meaning: "さっき、たった今", note: "少し前のこと。", example: "我剛剛吃藥了。", exampleZhuyin: "ㄨㄛˇ ㄍㄤ ㄍㄤ ㄔ ㄧㄠˋ ㄌㄜ˙" },
  { category: "副詞", word: "現在才", zhuyin: "ㄒㄧㄢˋ ㄗㄞˋ ㄘㄞˊ", meaning: "今やっと", note: "遅れてやっと、の感じ。", example: "我現在才洗澡。", exampleZhuyin: "ㄨㄛˇ ㄒㄧㄢˋ ㄗㄞˋ ㄘㄞˊ ㄒㄧˇ ㄗㄠˇ" },
  { category: "副詞", word: "應該", zhuyin: "ㄧㄥ ㄍㄞ", meaning: "たぶん〜はず、〜すべき", note: "推測にも義務にも使う。", example: "我應該要上班。", exampleZhuyin: "ㄨㄛˇ ㄧㄥ ㄍㄞ ㄧㄠˋ ㄕㄤˋ ㄅㄢ" },
  { category: "副詞", word: "還是", zhuyin: "ㄏㄞˊ ㄕˋ", meaning: "やっぱり、それとも", note: "文脈で意味が変わりやすい要注意語。", example: "我還是想吃潤餅。", exampleZhuyin: "ㄨㄛˇ ㄏㄞˊ ㄕˋ ㄒㄧㄤˇ ㄔ ㄖㄨㄣˋ ㄅㄧㄥˇ" },
  { category: "会話", word: "不就好了", zhuyin: "ㄅㄨˊ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙", meaning: "〜すればいいじゃん", note: "少し軽く解決案を出す感じ。", example: "吃蛋糕不就好了。", exampleZhuyin: "ㄔ ㄉㄢˋ ㄍㄠ ㄅㄨˊ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙" },
  { category: "会話", word: "想退游", zhuyin: "ㄒㄧㄤˇ ㄊㄨㄟˋ ㄧㄡˊ", meaning: "ゲームを辞めたい", note: "退游＝ゲーム界隈で引退する感じ。", example: "我有點想退游。", exampleZhuyin: "ㄨㄛˇ ㄧㄡˇ ㄉㄧㄢˇ ㄒㄧㄤˇ ㄊㄨㄟˋ ㄧㄡˊ" },
  { category: "会話", word: "忙翻了", zhuyin: "ㄇㄤˊ ㄈㄢ ㄌㄜ˙", meaning: "めちゃくちゃ忙しい", note: "口語でかなり忙しい感じ。", example: "最近工作忙翻了。", exampleZhuyin: "ㄗㄨㄟˋ ㄐㄧㄣˋ ㄍㄨㄥ ㄗㄨㄛˋ ㄇㄤˊ ㄈㄢ ㄌㄜ˙" },
  { category: "会話", word: "搞錯", zhuyin: "ㄍㄠˇ ㄘㄨㄛˋ", meaning: "間違える、勘違いする", note: "カジュアルな勘違い。", example: "我好像搞錯了。", exampleZhuyin: "ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄍㄠˇ ㄘㄨㄛˋ ㄌㄜ˙" },
  { category: "買い物", word: "多一點", zhuyin: "ㄉㄨㄛ ㄧˋ ㄉㄧㄢˇ", meaning: "少し多め", note: "注文でめちゃ使える。", example: "香菜多一點。", exampleZhuyin: "ㄒㄧㄤ ㄘㄞˋ ㄉㄨㄛ ㄧˋ ㄉㄧㄢˇ" },
  { category: "買い物", word: "去冰", zhuyin: "ㄑㄩˋ ㄅㄧㄥ", meaning: "氷なし", note: "台湾ドリンク注文の必須語。", example: "我要一杯去冰。", exampleZhuyin: "ㄨㄛˇ ㄧㄠˋ ㄧˋ ㄅㄟ ㄑㄩˋ ㄅㄧㄥ" },
  { category: "買い物", word: "微糖", zhuyin: "ㄨㄟˊ ㄊㄤˊ", meaning: "微糖、少し甘い", note: "ドリンク注文の甘さ指定。", example: "我要微糖去冰。", exampleZhuyin: "ㄨㄛˇ ㄧㄠˋ ㄨㄟˊ ㄊㄤˊ ㄑㄩˋ ㄅㄧㄥ" },
  { category: "旅行", word: "這裡有人嗎", zhuyin: "ㄓㄜˋ ㄌㄧˇ ㄧㄡˇ ㄖㄣˊ ㄇㄚ˙", meaning: "ここ誰かいますか", note: "席が空いているか聞く自然表現。", example: "不好意思，這裡有人嗎？", exampleZhuyin: "ㄅㄨˋ ㄏㄠˇ ㄧˋ ㄙ˙，ㄓㄜˋ ㄌㄧˇ ㄧㄡˇ ㄖㄣˊ ㄇㄚ˙" },
  { category: "リアクション", word: "太誇張了", zhuyin: "ㄊㄞˋ ㄎㄨㄚ ㄓㄤ ㄌㄜ˙", meaning: "大げさ、やばすぎ", note: "驚いた時に使える台湾っぽい反応。", example: "這也太誇張了吧。", exampleZhuyin: "ㄓㄜˋ ㄧㄝˇ ㄊㄞˋ ㄎㄨㄚ ㄓㄤ ㄌㄜ˙ ㄅㄚ" },
  { category: "リアクション", word: "什麼鬼", zhuyin: "ㄕㄣˊ ㄇㄜ˙ ㄍㄨㄟˇ", meaning: "何これ、なんだこれ", note: "ツッコミ。カジュアル強め。", example: "這是什麼鬼啦？", exampleZhuyin: "ㄓㄜˋ ㄕˋ ㄕㄣˊ ㄇㄜ˙ ㄍㄨㄟˇ ㄌㄚ" },
  { category: "リアクション", word: "懂了懂了", zhuyin: "ㄉㄨㄥˇ ㄌㄜ˙ ㄉㄨㄥˇ ㄌㄜ˙", meaning: "わかったわかった", note: "軽い反応。言い方次第でかわいい。", example: "懂了懂了，謝啦。", exampleZhuyin: "ㄉㄨㄥˇ ㄌㄜ˙ ㄉㄨㄥˇ ㄌㄜ˙，ㄒㄧㄝˋ ㄌㄚ" }
];


const phrases = [
  { text: "原來是這樣啊。", zhuyin: "ㄩㄢˊ ㄌㄞˊ ㄕˋ ㄓㄜˋ ㄧㄤˋ ㄚ", meaning: "なるほど、そういうことか。" },
  { text: "我好像懂一點了。", zhuyin: "ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄉㄨㄥˇ ㄧˋ ㄉㄧㄢˇ ㄌㄜ˙", meaning: "ちょっとわかった気がする。" },
  { text: "我想不起來那個字。", zhuyin: "ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ ㄋㄚˋ ㄍㄜ˙ ㄗˋ", meaning: "その字が思い出せない。" },
  { text: "我想不出來怎麼說。", zhuyin: "ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ ㄗㄣˇ ㄇㄜ˙ ㄕㄨㄛ", meaning: "なんて言えばいいか思いつかない。" },
  { text: "等一下，我看一下。", zhuyin: "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ，ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ", meaning: "ちょっと待って、確認する。" },
  { text: "不好意思，這裡有人嗎？", zhuyin: "ㄅㄨˋ ㄏㄠˇ ㄧˋ ㄙ˙，ㄓㄜˋ ㄌㄧˇ ㄧㄡˇ ㄖㄣˊ ㄇㄚ˙", meaning: "すみません、ここ誰かいますか？" },
  { text: "我想吃吃看潤餅。", zhuyin: "ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄔ ㄎㄢˋ ㄖㄨㄣˋ ㄅㄧㄥˇ", meaning: "潤餅を食べてみたい。" },
  { text: "日本沒有放颱風假。", zhuyin: "ㄖˋ ㄅㄣˇ ㄇㄟˊ ㄧㄡˇ ㄈㄤˋ ㄊㄞˊ ㄈㄥ ㄐㄧㄚˋ", meaning: "日本には台風休みがない。" },
  { text: "最近工作忙翻了。", zhuyin: "ㄗㄨㄟˋ ㄐㄧㄣˋ ㄍㄨㄥ ㄗㄨㄛˋ ㄇㄤˊ ㄈㄢ ㄌㄜ˙", meaning: "最近仕事がめちゃくちゃ忙しい。" },
  { text: "記得開泡泡。", zhuyin: "ㄐㄧˋ ㄉㄜ˙ ㄎㄞ ㄆㄠˋ ㄆㄠˋ", meaning: "シールド張るの忘れないで。" },
  { text: "我可能會晚一點到。", zhuyin: "ㄨㄛˇ ㄎㄜˇ ㄋㄥˊ ㄏㄨㄟˋ ㄨㄢˇ ㄧˋ ㄉㄧㄢˇ ㄉㄠˋ", meaning: "少し遅れるかも。" }
];


// Ver.2.0: あゆあん苦手単語パック Vol.1 + tags/confuse
const enrich = {
  "至少": {confuse:"意味を忘れやすい。チャットで見かけたら即復習枠。", tags:["何回も忘れた","副詞","台湾人よく使う"]},
  "划算": {confuse:"『お得』より『コスパがいい』で覚えると残りやすい。", tags:["何回も忘れた","買い物","夜市"]},
  "剛好": {confuse:"差不多＝だいたい、剛好＝ちょうど。ここが混ざりやすい。", tags:["差不多と混同","何回も忘れた"]},
  "差不多": {confuse:"剛好と混ぜない。ぴったりではなく『だいたい』。", tags:["差不多と混同","WOS"]},
  "幾乎": {confuse:"似乎と字面が似るけど意味は別。幾乎＝ほとんど。", tags:["幾乎と似乎","何度も質問した"]},
  "原來": {confuse:"原來是這樣啊 を丸ごと覚えると強い。", tags:["何回も忘れた","リアクション"]},
  "竟然": {confuse:"『まさか！』の驚き。你竟然不知道！で覚える枠。", tags:["何回も忘れた","リアクション"]},
  "好像": {confuse:"声調注意。ㄏㄠˇ ㄒㄧㄤˋ＝3声＋4声。3声3声で覚えがち。", tags:["声調注意","何度も質問した"]},
  "想不出來": {confuse:"想不起來＝思い出せない。想不出來＝考えても出てこない。", tags:["想不起來と想不出來","何度も質問した"]},
  "想不起來": {confuse:"想不出來＝思いつかない。想不起來＝記憶から取り出せない。", tags:["想不起來と想不出來","何度も質問した"]},
  "記得要": {confuse:"記得開泡泡のように要が落ちても自然。", tags:["WOS","台湾人よく使う"]},
  "等一下": {confuse:"等一下＋我看一下 は実用セット。", tags:["台湾人よく使う","会話"]},
  "看一下": {confuse:"看看より『確認する』が出やすい。", tags:["台湾人よく使う","会話"]},
  "吃吃看": {confuse:"想吃吃看＋食べ物、で丸ごと使う。", tags:["台湾旅行","夜市","会話"]},
  "用看看": {confuse:"用一下より『試しに使ってみる』感。", tags:["台湾人よく使う","会話"]},
  "只能": {confuse:"只＋能。只能習慣＝慣れるしかない。", tags:["何度も質問した","会話"]},
  "還是": {confuse:"選択疑問の『それとも』と、結局の『やっぱり』がある。", tags:["何度も質問した","副詞"]},
  "應該": {confuse:"應該要〜で『〜しなきゃ/〜するはず』っぽく使う。", tags:["何度も質問した","副詞"]},
  "搞錯": {confuse:"錯は間違い。搞錯了＝勘違いした。", tags:["何度も質問した","会話"]},
  "颱風假": {confuse:"放颱風假＝台風休みになる。", tags:["台湾生活","天気"]},
  "涼快": {confuse:"冷＝寒い、涼快＝涼しくて快適。", tags:["天気","何度も質問した"]},
  "忙翻了": {confuse:"忙死了に近いけど、忙しさでひっくり返る感じ。", tags:["会話","あゆあん語録"]}
};

const extraWords = [
  { category:"副詞", word:"似乎", zhuyin:"ㄙˋ ㄏㄨ", meaning:"〜みたいだ、〜らしい", note:"好像に近いけど少し書き言葉寄り。", confuse:"幾乎＝ほとんど、似乎＝〜みたい。字面だけで混ざりやすい。", example:"他似乎不知道。", exampleZhuyin:"ㄊㄚ ㄙˋ ㄏㄨ ㄅㄨˋ ㄓ ㄉㄠˋ", tags:["幾乎と似乎","何度も質問した"] },
  { category:"会話", word:"懂", zhuyin:"ㄉㄨㄥˇ", meaning:"わかる、理解する", note:"懂了＝わかった。", confuse:"3声。感情が乗ると4声っぽく言いがちなので注意。", example:"我懂了。", exampleZhuyin:"ㄨㄛˇ ㄉㄨㄥˇ ㄌㄜ˙", tags:["声調注意","何度も質問した"] },
  { category:"会話", word:"習慣", zhuyin:"ㄒㄧˊ ㄍㄨㄢˋ", meaning:"慣れる、習慣", note:"動詞にも名詞にもなる。", confuse:"『慣れる』は習慣でOK。只能習慣＝慣れるしかない。", example:"我應該習慣。", exampleZhuyin:"ㄨㄛˇ ㄧㄥ ㄍㄞ ㄒㄧˊ ㄍㄨㄢˋ", tags:["何度も質問した","会話"] },
  { category:"接続", word:"就", zhuyin:"ㄐㄧㄡˋ", meaning:"すぐ、もう、それなら、〜すれば", note:"意味が広すぎる超重要語。", confuse:"才と対になりがち。就＝早い・自然な流れ、才＝やっと・遅い。", example:"我明天就去。", exampleZhuyin:"ㄨㄛˇ ㄇㄧㄥˊ ㄊㄧㄢ ㄐㄧㄡˋ ㄑㄩˋ", tags:["就と才","接続詞","何度も質問した"] },
  { category:"接続", word:"才", zhuyin:"ㄘㄞˊ", meaning:"やっと、〜して初めて、たった", note:"遅さ・条件・少なさのニュアンス。", confuse:"就と対比。現在才＝今やっと。", example:"我現在才洗澡。", exampleZhuyin:"ㄨㄛˇ ㄒㄧㄢˋ ㄗㄞˋ ㄘㄞˊ ㄒㄧˇ ㄗㄠˇ", tags:["就と才","接続詞","何度も質問した"] },
  { category:"接続", word:"又", zhuyin:"ㄧㄡˋ", meaning:"また、さらに", note:"すでに起きたこと・繰り返し。", confuse:"再＝これからまた。又＝もうまた起きた。", example:"我又忘記了。", exampleZhuyin:"ㄨㄛˇ ㄧㄡˋ ㄨㄤˋ ㄐㄧˋ ㄌㄜ˙", tags:["又と再","何度も質問した"] },
  { category:"接続", word:"再", zhuyin:"ㄗㄞˋ", meaning:"また、もう一度、あとで", note:"これから起こることに使う。", confuse:"又＝すでにまた。再＝これからまた。", example:"我明天再問你。", exampleZhuyin:"ㄨㄛˇ ㄇㄧㄥˊ ㄊㄧㄢ ㄗㄞˋ ㄨㄣˋ ㄋㄧˇ", tags:["又と再","何度も質問した"] },
  { category:"接続", word:"如果", zhuyin:"ㄖㄨˊ ㄍㄨㄛˇ", meaning:"もし", note:"仮定の文を作る。", confuse:"ㄖ が ㄌ 寄りになりやすい発音注意枠。", example:"如果明天下雨，我就不去。", exampleZhuyin:"ㄖㄨˊ ㄍㄨㄛˇ ㄇㄧㄥˊ ㄊㄧㄢ ㄒㄧㄚˋ ㄩˇ，ㄨㄛˇ ㄐㄧㄡˋ ㄅㄨˊ ㄑㄩˋ", tags:["r注意","接続詞","発音注意"] },
  { category:"接続", word:"因為", zhuyin:"ㄧㄣ ㄨㄟˋ", meaning:"なぜなら、〜だから", note:"理由を言う。", confuse:"因為＋理由、所以＋結果。セットで覚える。", example:"因為日本沒有放颱風假。", exampleZhuyin:"ㄧㄣ ㄨㄟˋ ㄖˋ ㄅㄣˇ ㄇㄟˊ ㄧㄡˇ ㄈㄤˋ ㄊㄞˊ ㄈㄥ ㄐㄧㄚˋ", tags:["因為所以","接続詞"] },
  { category:"接続", word:"所以", zhuyin:"ㄙㄨㄛˇ ㄧˇ", meaning:"だから、それで", note:"結果を言う。", confuse:"因為＋理由、所以＋結果。日本語順と相性良い。", example:"所以我應該要上班。", exampleZhuyin:"ㄙㄨㄛˇ ㄧˇ ㄨㄛˇ ㄧㄥ ㄍㄞ ㄧㄠˋ ㄕㄤˋ ㄅㄢ", tags:["因為所以","接続詞"] },
  { category:"接続", word:"雖然", zhuyin:"ㄙㄨㄟ ㄖㄢˊ", meaning:"〜だけど、〜ではあるが", note:"譲歩の文。後ろに但是/可是が来やすい。", confuse:"雖然A，但是B の型で覚える。", example:"雖然很難，但是很好玩。", exampleZhuyin:"ㄙㄨㄟ ㄖㄢˊ ㄏㄣˇ ㄋㄢˊ，ㄉㄢˋ ㄕˋ ㄏㄣˇ ㄏㄠˇ ㄨㄢˊ", tags:["接続詞","何度も質問した"] },
  { category:"接続", word:"但是", zhuyin:"ㄉㄢˋ ㄕˋ", meaning:"でも、しかし", note:"比較的はっきりした逆接。", confuse:"可是より少し硬め・はっきり。", example:"但是我還是想去。", exampleZhuyin:"ㄉㄢˋ ㄕˋ ㄨㄛˇ ㄏㄞˊ ㄕˋ ㄒㄧㄤˇ ㄑㄩˋ", tags:["接続詞"] },
  { category:"接続", word:"可是", zhuyin:"ㄎㄜˇ ㄕˋ", meaning:"でも、だけど", note:"口語で使いやすい逆接。", confuse:"但是より会話っぽい。可是我想〜で便利。", example:"可是我想吃吃看潤餅耶。", exampleZhuyin:"ㄎㄜˇ ㄕˋ ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄔ ㄎㄢˋ ㄖㄨㄣˋ ㄅㄧㄥˇ ㄧㄝ", tags:["接続詞","会話"] },
  { category:"助動詞", word:"可以", zhuyin:"ㄎㄜˇ ㄧˇ", meaning:"〜できる、〜してもいい", note:"許可・可能。", confuse:"能/會との違いで迷いやすい。可以＝OK/許可寄り。", example:"可以開嗎？", exampleZhuyin:"ㄎㄜˇ ㄧˇ ㄎㄞ ㄇㄚ˙", tags:["可以能會","WOS","助動詞"] },
  { category:"助動詞", word:"能", zhuyin:"ㄋㄥˊ", meaning:"〜できる", note:"条件的にできる。", confuse:"可以より能力・条件寄り。能不能＝できるかどうか。", example:"明天能不能上班？", exampleZhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄋㄥˊ ㄅㄨˋ ㄋㄥˊ ㄕㄤˋ ㄅㄢ", tags:["可以能會","助動詞"] },
  { category:"助動詞", word:"會", zhuyin:"ㄏㄨㄟˋ", meaning:"〜するだろう、〜できる", note:"未来・可能性・習得能力。", confuse:"會有颱風/會下雨など、未来の見込みでよく使う。", example:"明天好像會下雨。", exampleZhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄏㄠˇ ㄒㄧㄤˋ ㄏㄨㄟˋ ㄒㄧㄚˋ ㄩˇ", tags:["可以能會","助動詞","何度も質問した"] },
  { category:"副詞", word:"比較", zhuyin:"ㄅㄧˇ ㄐㄧㄠˋ", meaning:"比較的、より〜", note:"比べる時に使う。", confuse:"比較涼快＝より涼しい。比とセットで考えがち。", example:"明天會比較涼快。", exampleZhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄏㄨㄟˋ ㄅㄧˇ ㄐㄧㄠˋ ㄌㄧㄤˊ ㄎㄨㄞˋ", tags:["何度も質問した","副詞"] },
  { category:"副詞", word:"一點", zhuyin:"ㄧˋ ㄉㄧㄢˇ", meaning:"少し", note:"台湾では一點が自然。", confuse:"有一點はネガティブ専用ではない。", example:"我好像懂一點了。", exampleZhuyin:"ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄉㄨㄥˇ ㄧˋ ㄉㄧㄢˇ ㄌㄜ˙", tags:["何度も質問した","副詞"] },
  { category:"リアクション", word:"欸", zhuyin:"ㄟˋ", meaning:"え、ねえ、あれ", note:"台湾の会話でよく出る感嘆詞。", confuse:"語気で意味が変わる。やわらかく使うと自然。", example:"欸，這個很好吃。", exampleZhuyin:"ㄟˋ，ㄓㄜˋ ㄍㄜ˙ ㄏㄣˇ ㄏㄠˇ ㄔ", tags:["台湾人よく使う","リアクション"] },
  { category:"リアクション", word:"好扯", zhuyin:"ㄏㄠˇ ㄔㄜˇ", meaning:"やばい、ありえない", note:"カジュアルな驚き・ツッコミ。", confuse:"親しい場面向け。少しくだけた表現。", example:"這也太扯了吧。", exampleZhuyin:"ㄓㄜˋ ㄧㄝˇ ㄊㄞˋ ㄔㄜˇ ㄌㄜ˙ ㄅㄚ", tags:["台湾人よく使う","リアクション"] },
  { category:"リアクション", word:"有道理", zhuyin:"ㄧㄡˇ ㄉㄠˋ ㄌㄧˇ", meaning:"一理ある、たしかに", note:"相手の説明に納得した時。", confuse:"懂了より『筋が通ってるね』寄り。", example:"你說得有道理。", exampleZhuyin:"ㄋㄧˇ ㄕㄨㄛ ㄉㄜ˙ ㄧㄡˇ ㄉㄠˋ ㄌㄧˇ", tags:["台湾人よく使う","リアクション"] },
  { category:"発音", word:"忍不住", zhuyin:"ㄖㄣˇ ㄅㄨˊ ㄓㄨˋ", meaning:"我慢できずに〜する", note:"音だけ聞くと拾いにくかった単語。", confuse:"ㄖㄣˇ の r 音注意。忍たま乱太郎で記憶。", example:"我忍不住笑了。", exampleZhuyin:"ㄨㄛˇ ㄖㄣˇ ㄅㄨˊ ㄓㄨˋ ㄒㄧㄠˋ ㄌㄜ˙", tags:["r注意","発音注意","何度も質問した"] }
];

for (const item of words) {
  if (enrich[item.word]) Object.assign(item, enrich[item.word]);
  item.tags = item.tags || [item.category];
  item.confuse = item.confuse || item.note || "復習ポイントなし";
}
for (const item of extraWords) {
  if (!words.some(w => w.word === item.word)) words.push(item);
}

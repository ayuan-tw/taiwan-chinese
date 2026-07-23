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


const v55Words = [
  { category: "会話", word: "抓到", zhuyin: "ㄓㄨㄚ ㄉㄠˋ", meaning: "つかまえる／見つける／気づく", note: "実際につかまえるほか、ミスやポイントを見つけた時にも使える。", example: "我終於抓到問題了。", exampleZhuyin: "ㄨㄛˇ ㄓㄨㄥ ㄩˊ ㄓㄨㄚ ㄉㄠˋ ㄨㄣˋ ㄊㄧˊ ㄌㄜ˙" },
  { category: "会話", word: "發現", zhuyin: "ㄈㄚ ㄒㄧㄢˋ", meaning: "気づく／発見する", note: "見たり考えたりして、新しい事実に気づいた時。", example: "我才發現去年也寫過。", exampleZhuyin: "ㄨㄛˇ ㄘㄞˊ ㄈㄚ ㄒㄧㄢˋ ㄑㄩˋ ㄋㄧㄢˊ ㄧㄝˇ ㄒㄧㄝˇ ㄍㄨㄛˋ" }
];
for (const item of v55Words) { if (!words.some(w => w.word === item.word)) words.push(item); }

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


const idioms = [
  {
    "category": "理解・納得",
    "text": "原來是這樣啊！",
    "zhuyin": "ㄩㄢˊ ㄌㄞˊ ㄕˋ ㄓㄜˋ ㄧㄤˋ ㄚ",
    "meaning": "なるほど、そういうことか！",
    "note": "説明を聞いて腑に落ちた時の自然なリアクション。",
    "tags": [
      "台湾人よく使う",
      "リアクション"
    ]
  },
  {
    "category": "理解・納得",
    "text": "喔～，了解！",
    "zhuyin": "ㄛ～，ㄌㄧㄠˇ ㄐㄧㄝˇ",
    "meaning": "おお、了解！",
    "note": "軽く納得した時。チャットでも会話でも使いやすい。",
    "tags": [
      "台湾人よく使う",
      "リアクション"
    ]
  },
  {
    "category": "理解・納得",
    "text": "懂了懂了！",
    "zhuyin": "ㄉㄨㄥˇ ㄌㄜ˙ ㄉㄨㄥˇ ㄌㄜ˙",
    "meaning": "わかった、わかった！",
    "note": "親しい相手への軽いリアクション。",
    "tags": [
      "台湾人よく使う",
      "リアクション"
    ]
  },
  {
    "category": "理解・納得",
    "text": "我懂！",
    "zhuyin": "ㄨㄛˇ ㄉㄨㄥˇ",
    "meaning": "わかる！／理解した！",
    "note": "文脈により共感にも理解にもなる。",
    "tags": [
      "会話",
      "リアクション"
    ]
  },
  {
    "category": "共感",
    "text": "我也這麼覺得！",
    "zhuyin": "ㄨㄛˇ ㄧㄝˇ ㄓㄜˋ ㄇㄜ˙ ㄐㄩㄝˊ ㄉㄜ˙",
    "meaning": "私もそう思う！",
    "note": "相手の意見への自然な同意。",
    "tags": [
      "共感",
      "会話"
    ]
  },
  {
    "category": "質問",
    "text": "我想問一下。",
    "zhuyin": "ㄨㄛˇ ㄒㄧㄤˇ ㄨㄣˋ ㄧˊ ㄒㄧㄚˋ",
    "meaning": "ちょっと聞きたいんだけど。",
    "note": "質問を切り出す万能フレーズ。",
    "tags": [
      "Sランク",
      "毎日使う"
    ]
  },
  {
    "category": "質問",
    "text": "這是什麼意思？",
    "zhuyin": "ㄓㄜˋ ㄕˋ ㄕㄣˊ ㄇㄜ˙ ㄧˋ ㄙ˙",
    "meaning": "これはどういう意味？",
    "note": "学習中にそのまま使える。",
    "tags": [
      "学習",
      "質問"
    ]
  },
  {
    "category": "質問",
    "text": "這句怎麼唸？",
    "zhuyin": "ㄓㄜˋ ㄐㄩˋ ㄗㄣˇ ㄇㄜ˙ ㄋㄧㄢˋ",
    "meaning": "この文はどう読むの？",
    "note": "注音や読み方を尋ねる時。",
    "tags": [
      "学習",
      "発音"
    ]
  },
  {
    "category": "質問",
    "text": "可以再說一次嗎？",
    "zhuyin": "ㄎㄜˇ ㄧˇ ㄗㄞˋ ㄕㄨㄛ ㄧˊ ㄘˋ ㄇㄚ˙",
    "meaning": "もう一度言ってもらえますか？",
    "note": "聞き取れなかった時の必須表現。",
    "tags": [
      "旅行",
      "Sランク"
    ]
  },
  {
    "category": "記憶",
    "text": "記住了！",
    "zhuyin": "ㄐㄧˋ ㄓㄨˋ ㄌㄜ˙",
    "meaning": "覚えた！",
    "note": "住＝記憶が脳に住み着いて定着するイメージ。",
    "tags": [
      "あゆあん語録",
      "学習"
    ]
  },
  {
    "category": "記憶",
    "text": "想起來了！",
    "zhuyin": "ㄒㄧㄤˇ ㄑㄧˇ ㄌㄞˊ ㄌㄜ˙",
    "meaning": "思い出した！",
    "note": "忘れていたことを思い出した時に自然。",
    "tags": [
      "学習",
      "会話"
    ]
  },
  {
    "category": "記憶",
    "text": "我又忘記了。",
    "zhuyin": "ㄨㄛˇ ㄧㄡˋ ㄨㄤˋ ㄐㄧˋ ㄌㄜ˙",
    "meaning": "また忘れた。",
    "note": "又＝すでにまた起きた。",
    "tags": [
      "あゆあん語録",
      "又と再"
    ]
  },
  {
    "category": "驚き・ツッコミ",
    "text": "真的假的？",
    "zhuyin": "ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙",
    "meaning": "マジで？／本当？",
    "note": "台湾で非常によく聞くリアクション。",
    "tags": [
      "台湾人よく使う",
      "リアクション"
    ]
  },
  {
    "category": "驚き・ツッコミ",
    "text": "什麼鬼啦？",
    "zhuyin": "ㄕㄣˊ ㄇㄜ˙ ㄍㄨㄟˇ ㄌㄚ",
    "meaning": "なんやねんこれ！／何これ！",
    "note": "親しい場面向けの強めのツッコミ。",
    "tags": [
      "台湾人よく使う",
      "カジュアル"
    ]
  },
  {
    "category": "驚き・ツッコミ",
    "text": "該不會～吧？",
    "zhuyin": "ㄍㄞ ㄅㄨˊ ㄏㄨㄟˋ ～ ㄅㄚ",
    "meaning": "まさか～じゃないよね？",
    "note": "悪い予感や驚きの推測。",
    "tags": [
      "会話",
      "型候補"
    ]
  },
  {
    "category": "驚き・ツッコミ",
    "text": "靠！",
    "zhuyin": "ㄎㄠˋ",
    "meaning": "くそ！／うわ！",
    "note": "かなりくだけた表現。相手と場面を選ぶ。",
    "tags": [
      "カジュアル",
      "注意"
    ]
  },
  {
    "category": "差・問題なし",
    "text": "沒差。",
    "zhuyin": "ㄇㄟˊ ㄔㄚ",
    "meaning": "違いはない／別にいいよ。",
    "note": "差がない、気にしない、どちらでもいい。",
    "tags": [
      "台湾人よく使う",
      "会話"
    ]
  },
  {
    "category": "差・問題なし",
    "text": "好像沒差。",
    "zhuyin": "ㄏㄠˇ ㄒㄧㄤˋ ㄇㄟˊ ㄔㄚ",
    "meaning": "違いはなさそう。",
    "note": "断定を少し弱めた言い方。",
    "tags": [
      "会話",
      "好像"
    ]
  },
  {
    "category": "差・問題なし",
    "text": "沒事。",
    "zhuyin": "ㄇㄟˊ ㄕˋ",
    "meaning": "大丈夫だよ／何でもない。",
    "note": "軽くぶつかった時などの返事にも自然。",
    "tags": [
      "旅行",
      "会話"
    ]
  },
  {
    "category": "会話進行",
    "text": "等一下，我看一下。",
    "zhuyin": "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ，ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ",
    "meaning": "ちょっと待って、確認するね。",
    "note": "ゴロもよく、実用性が高いセット。",
    "tags": [
      "毎日使う",
      "会話"
    ]
  },
  {
    "category": "会話進行",
    "text": "話說～",
    "zhuyin": "ㄏㄨㄚˋ ㄕㄨㄛ ～",
    "meaning": "そういえば～／ところで～",
    "note": "話題を切り替える時の台湾らしい口語。",
    "tags": [
      "台湾人よく使う",
      "話題転換"
    ]
  },
  {
    "category": "会話進行",
    "text": "順便～",
    "zhuyin": "ㄕㄨㄣˋ ㄅㄧㄢˋ ～",
    "meaning": "ついでに～",
    "note": "一つの行動のついでに別のことをする。",
    "tags": [
      "毎日使う",
      "会話"
    ]
  },
  {
    "category": "評価",
    "text": "很棒耶！",
    "zhuyin": "ㄏㄣˇ ㄅㄤˋ ㄧㄝ",
    "meaning": "すごくいいね！",
    "note": "柔らかく褒める自然な言い方。",
    "tags": [
      "リアクション",
      "会話"
    ]
  },
  {
    "category": "評価",
    "text": "這樣不錯耶！",
    "zhuyin": "ㄓㄜˋ ㄧㄤˋ ㄅㄨˊ ㄘㄨㄛˋ ㄧㄝ",
    "meaning": "これ、いい感じだね！",
    "note": "方法や出来を評価する時。",
    "tags": [
      "リアクション",
      "会話"
    ]
  },
  {
    "category": "希望・好み",
    "text": "香菜越多越好！",
    "zhuyin": "ㄒㄧㄤ ㄘㄞˋ ㄩㄝˋ ㄉㄨㄛ ㄩㄝˋ ㄏㄠˇ",
    "meaning": "パクチーは多ければ多いほどいい！",
    "note": "あゆあんの人生の真理。",
    "tags": [
      "あゆあん語録",
      "夜市"
    ]
  },
  {
    "category": "希望・好み",
    "text": "我想吃吃看。",
    "zhuyin": "ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄔ ㄎㄢˋ",
    "meaning": "食べてみたい。",
    "note": "食べ物を後ろに置いて使う。",
    "tags": [
      "旅行",
      "夜市"
    ]
  },
  {
    "category": "返答",
    "text": "對，在這邊吃。",
    "zhuyin": "ㄉㄨㄟˋ，ㄗㄞˋ ㄓㄜˋ ㄅㄧㄢ ㄔ",
    "meaning": "はい、ここで食べます。",
    "note": "在這邊吃嗎？への自然な返答。",
    "tags": [
      "旅行",
      "店内会話"
    ]
  },
  {
    "category": "返答",
    "text": "不會不會。",
    "zhuyin": "ㄅㄨˊ ㄏㄨㄟˋ ㄅㄨˊ ㄏㄨㄟˋ",
    "meaning": "いえいえ／そんなことないよ。",
    "note": "謝罪やお礼に対する柔らかい返事。",
    "tags": [
      "会話",
      "返答"
    ]
  }
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


const moreExtraWords = [
  {
    "category": "会話",
    "word": "大概",
    "zhuyin": "ㄉㄚˋ ㄍㄞˋ",
    "meaning": "だいたい、たぶん",
    "note": "大概＋時間／数量／推測で便利。",
    "example": "大概要十分鐘。",
    "exampleZhuyin": "ㄉㄚˋ ㄍㄞˋ ㄧㄠˋ ㄕˊ ㄈㄣ ㄓㄨㄥ",
    "tags": [
      "会話",
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "左右",
    "zhuyin": "ㄗㄨㄛˇ ㄧㄡˋ",
    "meaning": "〜くらい、前後",
    "note": "時間・数量のざっくり表現。",
    "example": "十分鐘左右。",
    "exampleZhuyin": "ㄕˊ ㄈㄣ ㄓㄨㄥ ㄗㄨㄛˇ ㄧㄡˋ",
    "tags": [
      "会話",
      "数量"
    ]
  },
  {
    "category": "会話",
    "word": "差點",
    "zhuyin": "ㄔㄚˋ ㄉㄧㄢˇ",
    "meaning": "もう少しで〜するところだった",
    "note": "差一點より短い言い方。",
    "example": "我差點遲到。",
    "exampleZhuyin": "ㄨㄛˇ ㄔㄚˋ ㄉㄧㄢˇ ㄔˊ ㄉㄠˋ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "來得及",
    "zhuyin": "ㄌㄞˊ ㄉㄜˊ ㄐㄧˊ",
    "meaning": "間に合う",
    "note": "來不及の反対。",
    "example": "現在去還來得及。",
    "exampleZhuyin": "ㄒㄧㄢˋ ㄗㄞˋ ㄑㄩˋ ㄏㄞˊ ㄌㄞˊ ㄉㄜˊ ㄐㄧˊ",
    "tags": [
      "時間",
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "趁現在",
    "zhuyin": "ㄔㄣˋ ㄒㄧㄢˋ ㄗㄞˋ",
    "meaning": "今のうちに",
    "note": "趁～＝〜のうちに。",
    "example": "趁現在快點去。",
    "exampleZhuyin": "ㄔㄣˋ ㄒㄧㄢˋ ㄗㄞˋ ㄎㄨㄞˋ ㄉㄧㄢˇ ㄑㄩˋ",
    "tags": [
      "会話",
      "時間"
    ]
  },
  {
    "category": "会話",
    "word": "乾脆",
    "zhuyin": "ㄍㄢ ㄘㄨㄟˋ",
    "meaning": "いっそ、思い切って",
    "note": "提案・開き直りに使う。",
    "example": "乾脆明天再說。",
    "exampleZhuyin": "ㄍㄢ ㄘㄨㄟˋ ㄇㄧㄥˊ ㄊㄧㄢ ㄗㄞˋ ㄕㄨㄛ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "尤其",
    "zhuyin": "ㄧㄡˊ ㄑㄧˊ",
    "meaning": "特に",
    "note": "尤其是～＝特に〜。",
    "example": "我尤其喜歡香菜。",
    "exampleZhuyin": "ㄨㄛˇ ㄧㄡˊ ㄑㄧˊ ㄒㄧˇ ㄏㄨㄢ ㄒㄧㄤ ㄘㄞˋ",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "特別",
    "zhuyin": "ㄊㄜˋ ㄅㄧㄝˊ",
    "meaning": "特に、とても",
    "note": "特別好吃＝特においしい。",
    "example": "今天特別累。",
    "exampleZhuyin": "ㄐㄧㄣ ㄊㄧㄢ ㄊㄜˋ ㄅㄧㄝˊ ㄌㄟˋ",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "非常",
    "zhuyin": "ㄈㄟ ㄔㄤˊ",
    "meaning": "非常に、とても",
    "note": "很よりやや強め・丁寧め。",
    "example": "非常好吃。",
    "exampleZhuyin": "ㄈㄟ ㄔㄤˊ ㄏㄠˇ ㄔ",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "超",
    "zhuyin": "ㄔㄠ",
    "meaning": "超〜",
    "note": "口語の強調。超難、超好吃。",
    "example": "這個超難。",
    "exampleZhuyin": "ㄓㄜˋ ㄍㄜ˙ ㄔㄠ ㄋㄢˊ",
    "tags": [
      "台湾人よく使う",
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "蠻",
    "zhuyin": "ㄇㄢˊ",
    "meaning": "けっこう、かなり",
    "note": "台湾口語でよく聞く。蠻好吃的。",
    "example": "這個蠻好吃的。",
    "exampleZhuyin": "ㄓㄜˋ ㄍㄜ˙ ㄇㄢˊ ㄏㄠˇ ㄔ ㄉㄜ˙",
    "tags": [
      "台湾人よく使う",
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "挺",
    "zhuyin": "ㄊㄧㄥˇ",
    "meaning": "けっこう",
    "note": "蠻に近い。台湾でも使う。",
    "example": "聽起來挺不錯。",
    "exampleZhuyin": "ㄊㄧㄥ ㄑㄧˇ ㄌㄞˊ ㄊㄧㄥˇ ㄅㄨˊ ㄘㄨㄛˋ",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "像是",
    "zhuyin": "ㄒㄧㄤˋ ㄕˋ",
    "meaning": "例えば〜のような",
    "note": "例を出す時にも使える。",
    "example": "像是潤餅、豆花之類的。",
    "exampleZhuyin": "ㄒㄧㄤˋ ㄕˋ ㄖㄨㄣˋ ㄅㄧㄥˇ、ㄉㄡˋ ㄏㄨㄚ ㄓ ㄌㄟˋ ㄉㄜ˙",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "之類的",
    "zhuyin": "ㄓ ㄌㄟˋ ㄉㄜ˙",
    "meaning": "〜みたいなもの、〜とか",
    "note": "例をざっくりまとめる。",
    "example": "豆花之類的。",
    "exampleZhuyin": "ㄉㄡˋ ㄏㄨㄚ ㄓ ㄌㄟˋ ㄉㄜ˙",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "比方說",
    "zhuyin": "ㄅㄧˇ ㄈㄤ ㄕㄨㄛ",
    "meaning": "例えば",
    "note": "話し言葉で使いやすい。",
    "example": "比方說，這樣講比較自然。",
    "exampleZhuyin": "ㄅㄧˇ ㄈㄤ ㄕㄨㄛ，ㄓㄜˋ ㄧㄤˋ ㄐㄧㄤˇ ㄅㄧˇ ㄐㄧㄠˋ ㄗˋ ㄖㄢˊ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "也就是說",
    "zhuyin": "ㄧㄝˇ ㄐㄧㄡˋ ㄕˋ ㄕㄨㄛ",
    "meaning": "つまり",
    "note": "説明を言い換える時。",
    "example": "也就是說，我還沒學會。",
    "exampleZhuyin": "ㄧㄝˇ ㄐㄧㄡˋ ㄕˋ ㄕㄨㄛ，ㄨㄛˇ ㄏㄞˊ ㄇㄟˊ ㄒㄩㄝˊ ㄏㄨㄟˋ",
    "tags": [
      "会話",
      "接続詞"
    ]
  },
  {
    "category": "会話",
    "word": "換句話說",
    "zhuyin": "ㄏㄨㄢˋ ㄐㄩˋ ㄏㄨㄚˋ ㄕㄨㄛ",
    "meaning": "言い換えると",
    "note": "説明・整理に便利。",
    "example": "換句話說，這是短期記憶。",
    "exampleZhuyin": "ㄏㄨㄢˋ ㄐㄩˋ ㄏㄨㄚˋ ㄕㄨㄛ，ㄓㄜˋ ㄕˋ ㄉㄨㄢˇ ㄑㄧˊ ㄐㄧˋ ㄧˋ",
    "tags": [
      "会話",
      "接続詞"
    ]
  },
  {
    "category": "会話",
    "word": "總之",
    "zhuyin": "ㄗㄨㄥˇ ㄓ",
    "meaning": "とにかく、要するに",
    "note": "話をまとめる。",
    "example": "總之，先練習看看。",
    "exampleZhuyin": "ㄗㄨㄥˇ ㄓ，ㄒㄧㄢ ㄌㄧㄢˋ ㄒㄧˊ ㄎㄢˋ ㄎㄢˋ",
    "tags": [
      "会話",
      "接続詞"
    ]
  },
  {
    "category": "会話",
    "word": "總算",
    "zhuyin": "ㄗㄨㄥˇ ㄙㄨㄢˋ",
    "meaning": "やっと、どうにか",
    "note": "待った後・苦労した後の『やっと』。",
    "example": "我總算懂了。",
    "exampleZhuyin": "ㄨㄛˇ ㄗㄨㄥˇ ㄙㄨㄢˋ ㄉㄨㄥˇ ㄌㄜ˙",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "終於",
    "zhuyin": "ㄓㄨㄥ ㄩˊ",
    "meaning": "ついに、やっと",
    "note": "待望の結果。",
    "example": "我終於想起來了。",
    "exampleZhuyin": "ㄨㄛˇ ㄓㄨㄥ ㄩˊ ㄒㄧㄤˇ ㄑㄧˇ ㄌㄞˊ ㄌㄜ˙",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "暫時",
    "zhuyin": "ㄓㄢˋ ㄕˊ",
    "meaning": "しばらく、一時的に",
    "note": "暫時不用＝しばらく不要。",
    "example": "我暫時不用。",
    "exampleZhuyin": "ㄨㄛˇ ㄓㄢˋ ㄕˊ ㄅㄨˊ ㄩㄥˋ",
    "tags": [
      "時間"
    ]
  },
  {
    "category": "会話",
    "word": "目前",
    "zhuyin": "ㄇㄨˋ ㄑㄧㄢˊ",
    "meaning": "今のところ、現在",
    "note": "やや説明っぽい。",
    "example": "目前還沒有問題。",
    "exampleZhuyin": "ㄇㄨˋ ㄑㄧㄢˊ ㄏㄞˊ ㄇㄟˊ ㄧㄡˇ ㄨㄣˋ ㄊㄧˊ",
    "tags": [
      "時間"
    ]
  },
  {
    "category": "会話",
    "word": "平常",
    "zhuyin": "ㄆㄧㄥˊ ㄔㄤˊ",
    "meaning": "普段",
    "note": "平常都～＝普段はいつも〜。",
    "example": "我平常用注音輸入。",
    "exampleZhuyin": "ㄨㄛˇ ㄆㄧㄥˊ ㄔㄤˊ ㄩㄥˋ ㄓㄨˋ ㄧㄣ ㄕㄨ ㄖㄨˋ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "偶爾",
    "zhuyin": "ㄡˇ ㄦˇ",
    "meaning": "たまに",
    "note": "たまに〜する。",
    "example": "我偶爾會忘記。",
    "exampleZhuyin": "ㄨㄛˇ ㄡˇ ㄦˇ ㄏㄨㄟˋ ㄨㄤˋ ㄐㄧˋ",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "常常",
    "zhuyin": "ㄔㄤˊ ㄔㄤˊ",
    "meaning": "よく、しょっちゅう",
    "note": "頻度が高い。",
    "example": "我常常忘記。",
    "exampleZhuyin": "ㄨㄛˇ ㄔㄤˊ ㄔㄤˊ ㄨㄤˋ ㄐㄧˋ",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "一直",
    "zhuyin": "ㄧˋ ㄓˊ",
    "meaning": "ずっと",
    "note": "継続を表す。",
    "example": "我一直在練習。",
    "exampleZhuyin": "ㄨㄛˇ ㄧˋ ㄓˊ ㄗㄞˋ ㄌㄧㄢˋ ㄒㄧˊ",
    "tags": [
      "副詞"
    ]
  },
  {
    "category": "会話",
    "word": "一邊",
    "zhuyin": "ㄧˋ ㄅㄧㄢ",
    "meaning": "〜しながら",
    "note": "一邊A一邊B。",
    "example": "我一邊走路一邊聽中文。",
    "exampleZhuyin": "ㄨㄛˇ ㄧˋ ㄅㄧㄢ ㄗㄡˇ ㄌㄨˋ ㄧˋ ㄅㄧㄢ ㄊㄧㄥ ㄓㄨㄥ ㄨㄣˊ",
    "tags": [
      "型",
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "順利",
    "zhuyin": "ㄕㄨㄣˋ ㄌㄧˋ",
    "meaning": "順調、スムーズ",
    "note": "仕事・旅行・学習に使える。",
    "example": "今天還算順利。",
    "exampleZhuyin": "ㄐㄧㄣ ㄊㄧㄢ ㄏㄞˊ ㄙㄨㄢˋ ㄕㄨㄣˋ ㄌㄧˋ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "麻煩",
    "zhuyin": "ㄇㄚˊ ㄈㄢˊ",
    "meaning": "面倒、手間をかける",
    "note": "麻煩你＝お手数ですが。",
    "example": "麻煩你幫我看一下。",
    "exampleZhuyin": "ㄇㄚˊ ㄈㄢˊ ㄋㄧˇ ㄅㄤ ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ",
    "tags": [
      "依頼",
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "可惜",
    "zhuyin": "ㄎㄜˇ ㄒㄧˊ",
    "meaning": "残念、惜しい",
    "note": "真可惜＝残念だね。",
    "example": "真可惜。",
    "exampleZhuyin": "ㄓㄣ ㄎㄜˇ ㄒㄧˊ",
    "tags": [
      "リアクション"
    ]
  },
  {
    "category": "会話",
    "word": "幸好",
    "zhuyin": "ㄒㄧㄥˋ ㄏㄠˇ",
    "meaning": "幸いにも、よかったことに",
    "note": "還好に近いが『幸い』感。",
    "example": "幸好我有帶傘。",
    "exampleZhuyin": "ㄒㄧㄥˋ ㄏㄠˇ ㄨㄛˇ ㄧㄡˇ ㄉㄞˋ ㄙㄢˇ",
    "tags": [
      "リアクション"
    ]
  },
  {
    "category": "会話",
    "word": "不小心",
    "zhuyin": "ㄅㄨˋ ㄒㄧㄠˇ ㄒㄧㄣ",
    "meaning": "うっかり、間違って",
    "note": "不小心忘記＝うっかり忘れる。",
    "example": "我不小心按錯了。",
    "exampleZhuyin": "ㄨㄛˇ ㄅㄨˋ ㄒㄧㄠˇ ㄒㄧㄣ ㄢˋ ㄘㄨㄛˋ ㄌㄜ˙",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "按錯",
    "zhuyin": "ㄢˋ ㄘㄨㄛˋ",
    "meaning": "押し間違える",
    "note": "スマホ・ゲームで便利。",
    "example": "我按錯了。",
    "exampleZhuyin": "ㄨㄛˇ ㄢˋ ㄘㄨㄛˋ ㄌㄜ˙",
    "tags": [
      "会話",
      "WOS"
    ]
  },
  {
    "category": "会話",
    "word": "打錯",
    "zhuyin": "ㄉㄚˇ ㄘㄨㄛˋ",
    "meaning": "打ち間違える",
    "note": "文字入力ミス。",
    "example": "我打錯字了。",
    "exampleZhuyin": "ㄨㄛˇ ㄉㄚˇ ㄘㄨㄛˋ ㄗˋ ㄌㄜ˙",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "看錯",
    "zhuyin": "ㄎㄢˋ ㄘㄨㄛˋ",
    "meaning": "見間違える",
    "note": "字・時間・場所を見間違える。",
    "example": "我看錯了。",
    "exampleZhuyin": "ㄨㄛˇ ㄎㄢˋ ㄘㄨㄛˋ ㄌㄜ˙",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "聽錯",
    "zhuyin": "ㄊㄧㄥ ㄘㄨㄛˋ",
    "meaning": "聞き間違える",
    "note": "リスニングで便利。",
    "example": "我可能聽錯了。",
    "exampleZhuyin": "ㄨㄛˇ ㄎㄜˇ ㄋㄥˊ ㄊㄧㄥ ㄘㄨㄛˋ ㄌㄜ˙",
    "tags": [
      "会話",
      "リスニング"
    ]
  },
  {
    "category": "会話",
    "word": "猜",
    "zhuyin": "ㄘㄞ",
    "meaning": "当てる、推測する",
    "note": "我猜～＝たぶん〜だと思う。",
    "example": "我猜他不知道。",
    "exampleZhuyin": "ㄨㄛˇ ㄘㄞ ㄊㄚ ㄅㄨˋ ㄓ ㄉㄠˋ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "提醒",
    "zhuyin": "ㄊㄧˊ ㄒㄧㄥˇ",
    "meaning": "リマインドする、注意喚起する",
    "note": "記得～と相性がいい。",
    "example": "謝謝你提醒我。",
    "exampleZhuyin": "ㄒㄧㄝˋ ㄒㄧㄝ˙ ㄋㄧˇ ㄊㄧˊ ㄒㄧㄥˇ ㄨㄛˇ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "確認",
    "zhuyin": "ㄑㄩㄝˋ ㄖㄣˋ",
    "meaning": "確認する",
    "note": "日本語と字は同じだけど発音注意。",
    "example": "我確認一下。",
    "exampleZhuyin": "ㄨㄛˇ ㄑㄩㄝˋ ㄖㄣˋ ㄧˊ ㄒㄧㄚˋ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "查",
    "zhuyin": "ㄔㄚˊ",
    "meaning": "調べる",
    "note": "查一下＝ちょっと調べる。",
    "example": "我查一下。",
    "exampleZhuyin": "ㄨㄛˇ ㄔㄚˊ ㄧˊ ㄒㄧㄚˋ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "回覆",
    "zhuyin": "ㄏㄨㄟˊ ㄈㄨˋ",
    "meaning": "返信する、返事する",
    "note": "チャット・メールで便利。",
    "example": "我下班後回覆。",
    "exampleZhuyin": "ㄨㄛˇ ㄒㄧㄚˋ ㄅㄢ ㄏㄡˋ ㄏㄨㄟˊ ㄈㄨˋ",
    "tags": [
      "会話",
      "仕事"
    ]
  },
  {
    "category": "会話",
    "word": "補充",
    "zhuyin": "ㄅㄨˇ ㄔㄨㄥ",
    "meaning": "補足する、追加する",
    "note": "説明を足す時。",
    "example": "我補充一下。",
    "exampleZhuyin": "ㄨㄛˇ ㄅㄨˇ ㄔㄨㄥ ㄧˊ ㄒㄧㄚˋ",
    "tags": [
      "会話"
    ]
  },
  {
    "category": "会話",
    "word": "整理",
    "zhuyin": "ㄓㄥˇ ㄌㄧˇ",
    "meaning": "整理する",
    "note": "資料・考え・ノートに使う。",
    "example": "我先整理一下。",
    "exampleZhuyin": "ㄨㄛˇ ㄒㄧㄢ ㄓㄥˇ ㄌㄧˇ ㄧˊ ㄒㄧㄚˋ",
    "tags": [
      "会話",
      "学習"
    ]
  },
  {
    "category": "会話",
    "word": "重點",
    "zhuyin": "ㄓㄨㄥˋ ㄉㄧㄢˇ",
    "meaning": "ポイント、重要点",
    "note": "重點是～＝大事なのは〜。",
    "example": "重點是要說得出來。",
    "exampleZhuyin": "ㄓㄨㄥˋ ㄉㄧㄢˇ ㄕˋ ㄧㄠˋ ㄕㄨㄛ ㄉㄜ˙ ㄔㄨ ㄌㄞˊ",
    "tags": [
      "学習",
      "会話"
    ]
  }
];
for (const item of moreExtraWords) {
  if (!words.some(w => w.word === item.word)) words.push(item);
}


const v54Words = [
  {
    "category": "副詞",
    "word": "順便",
    "zhuyin": "ㄕㄨㄣˋ ㄅㄧㄢˋ",
    "meaning": "ついでに",
    "note": "別の用事に合わせて何かする。",
    "example": "我順便去買飲料。",
    "exampleZhuyin": "ㄨㄛˇ ㄕㄨㄣˋ ㄅㄧㄢˋ ㄑㄩˋ ㄇㄞˇ ㄧㄣˇ ㄌㄧㄠˋ",
    "tags": [
      "何回も忘れた",
      "会話"
    ]
  },
  {
    "category": "副詞",
    "word": "難怪",
    "zhuyin": "ㄋㄢˊ ㄍㄨㄞˋ",
    "meaning": "どうりで／なるほど～なわけだ",
    "note": "原因を知って納得した時。",
    "example": "難怪你這麼累。",
    "exampleZhuyin": "ㄋㄢˊ ㄍㄨㄞˋ ㄋㄧˇ ㄓㄜˋ ㄇㄜ˙ ㄌㄟˋ",
    "tags": [
      "何回も忘れた",
      "リアクション"
    ]
  },
  {
    "category": "副詞",
    "word": "目前",
    "zhuyin": "ㄇㄨˋ ㄑㄧㄢˊ",
    "meaning": "現在のところ",
    "note": "今の時点では、という少し説明的な表現。",
    "example": "目前還沒有問題。",
    "exampleZhuyin": "ㄇㄨˋ ㄑㄧㄢˊ ㄏㄞˊ ㄇㄟˊ ㄧㄡˇ ㄨㄣˋ ㄊㄧˊ",
    "tags": [
      "何回も忘れた"
    ]
  },
  {
    "category": "副詞",
    "word": "一般",
    "zhuyin": "ㄧˋ ㄅㄢ",
    "meaning": "一般的に／普通",
    "note": "頻度の『だいたい』なら通常のほうが自然なことも多い。",
    "example": "一般來說，台灣夏天很熱。",
    "exampleZhuyin": "ㄧˋ ㄅㄢ ㄌㄞˊ ㄕㄨㄛ，ㄊㄞˊ ㄨㄢ ㄒㄧㄚˋ ㄊㄧㄢ ㄏㄣˇ ㄖㄜˋ",
    "tags": [
      "何度も質問した"
    ]
  },
  {
    "category": "副詞",
    "word": "大概",
    "zhuyin": "ㄉㄚˋ ㄍㄞˋ",
    "meaning": "だいたい／おそらく",
    "note": "概算や推測に使う。",
    "example": "大概八點到。",
    "exampleZhuyin": "ㄉㄚˋ ㄍㄞˋ ㄅㄚ ㄉㄧㄢˇ ㄉㄠˋ",
    "tags": [
      "何度も質問した"
    ]
  },
  {
    "category": "表現",
    "word": "理所當然",
    "zhuyin": "ㄌㄧˇ ㄙㄨㄛˇ ㄉㄤ ㄖㄢˊ",
    "meaning": "当然のこと／当たり前",
    "note": "少し説明的だが会話でも使える。",
    "example": "不同國家有不同文化是理所當然的。",
    "exampleZhuyin": "ㄅㄨˋ ㄊㄨㄥˊ ㄍㄨㄛˊ ㄐㄧㄚ ㄧㄡˇ ㄅㄨˋ ㄊㄨㄥˊ ㄨㄣˊ ㄏㄨㄚˋ ㄕˋ ㄌㄧˇ ㄙㄨㄛˇ ㄉㄤ ㄖㄢˊ ㄉㄜ˙",
    "tags": [
      "課題文"
    ]
  },
  {
    "category": "名詞",
    "word": "差異",
    "zhuyin": "ㄔㄚ ㄧˋ",
    "meaning": "差異、違い",
    "note": "差別より客観的な違いを表す。",
    "example": "沒有太大的文化差異。",
    "exampleZhuyin": "ㄇㄟˊ ㄧㄡˇ ㄊㄞˋ ㄉㄚˋ ㄉㄜ˙ ㄨㄣˊ ㄏㄨㄚˋ ㄔㄚ ㄧˋ",
    "tags": [
      "課題文"
    ]
  },
  {
    "category": "動詞",
    "word": "記住",
    "zhuyin": "ㄐㄧˋ ㄓㄨˋ",
    "meaning": "しっかり覚える",
    "note": "住＝固定・定着。脳に住み着くイメージ。",
    "example": "我記住了。",
    "exampleZhuyin": "ㄨㄛˇ ㄐㄧˋ ㄓㄨˋ ㄌㄜ˙",
    "tags": [
      "あゆあん語録",
      "学習"
    ]
  },
  {
    "category": "動詞",
    "word": "了解",
    "zhuyin": "ㄌㄧㄠˇ ㄐㄧㄝˇ",
    "meaning": "了解する／わかる",
    "note": "喔～，了解！でよく使う。",
    "example": "喔～，了解了。",
    "exampleZhuyin": "ㄛ～，ㄌㄧㄠˇ ㄐㄧㄝˇ ㄌㄜ˙",
    "tags": [
      "会話",
      "台湾人よく使う"
    ]
  }
];
for (const item of v54Words) { if (!words.some(w => w.word === item.word)) words.push(item); }

// Ver.3.0: 型カードへ移動するもの
const patternWords = ["想不出來","想不起來","記得要","好像","吃吃看","用看看","不就好了"];
for (let i = words.length - 1; i >= 0; i--) {
  if (patternWords.includes(words[i].word)) words.splice(i, 1);
}

const patterns = [
  {category:"願望", pattern:"我想～", zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ", meaning:"～したい", note:"一番基本。旅行・食べ物・ゲーム全部に使える。", example:"我想去台灣旅行。", exampleZhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄑㄩˋ ㄊㄞˊ ㄨㄢ ㄌㄩˇ ㄒㄧㄥˊ", tags:["Sランク","毎日使う"], prompts:[{ja:"台湾に行きたい",answer:"我想去台灣。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄑㄩˋ ㄊㄞˊ ㄨㄢ"},{ja:"牛肉麵を食べたい",answer:"我想吃牛肉麵。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄋㄧㄡˊ ㄖㄡˋ ㄇㄧㄢˋ"},{ja:"台湾人と話したい",answer:"我想跟台灣人聊天。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄍㄣ ㄊㄞˊ ㄨㄢ ㄖㄣˊ ㄌㄧㄠˊ ㄊㄧㄢ"}]},
  {category:"願望", pattern:"我想～一下", zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ～ ㄧˊ ㄒㄧㄚˋ", meaning:"ちょっと～したい", note:"一下で軽くする。聞く・見る・確認するに便利。", example:"我想問一下。", exampleZhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄨㄣˋ ㄧˊ ㄒㄧㄚˋ", tags:["Sランク","会話"], prompts:[{ja:"ちょっと聞きたい",answer:"我想問一下。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄨㄣˋ ㄧˊ ㄒㄧㄚˋ"},{ja:"ちょっと見たい",answer:"我想看一下。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ"},{ja:"ちょっと確認したい",answer:"我想確認一下。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄑㄩㄝˋ ㄖㄣˋ ㄧˊ ㄒㄧㄚˋ"}]},
  {category:"願望", pattern:"我想 VV 看", zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ VV ㄎㄢˋ", meaning:"～してみたい", note:"食べてみたい・使ってみたいに強い。台湾旅行向け。", example:"我想吃吃看潤餅。", exampleZhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄔ ㄎㄢˋ ㄖㄨㄣˋ ㄅㄧㄥˇ", tags:["Sランク","夜市"], prompts:[{ja:"潤餅を食べてみたい",answer:"我想吃吃看潤餅。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄔ ㄎㄢˋ ㄖㄨㄣˋ ㄅㄧㄥˇ"},{ja:"使ってみたい",answer:"我想用看看。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄩㄥˋ ㄎㄢˋ ㄎㄢˋ"},{ja:"聞いてみたい",answer:"我想問問看。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄨㄣˋ ㄨㄣˋ ㄎㄢˋ"}]},
  {category:"願望", pattern:"我不想～", zhuyin:"ㄨㄛˇ ㄅㄨˋ ㄒㄧㄤˇ", meaning:"～したくない", note:"仕事・外出・ゲームで普通に使える。", example:"我今天不想出門。", exampleZhuyin:"ㄨㄛˇ ㄐㄧㄣ ㄊㄧㄢ ㄅㄨˋ ㄒㄧㄤˇ ㄔㄨ ㄇㄣˊ", tags:["Sランク"], prompts:[{ja:"今日は出かけたくない",answer:"我今天不想出門。",zhuyin:"ㄨㄛˇ ㄐㄧㄣ ㄊㄧㄢ ㄅㄨˋ ㄒㄧㄤˇ ㄔㄨ ㄇㄣˊ"},{ja:"残業したくない",answer:"我不想加班。",zhuyin:"ㄨㄛˇ ㄅㄨˋ ㄒㄧㄤˇ ㄐㄧㄚ ㄅㄢ"},{ja:"ゲームをやめたくない",answer:"我不想退游。",zhuyin:"ㄨㄛˇ ㄅㄨˋ ㄒㄧㄤˇ ㄊㄨㄟˋ ㄧㄡˊ"}]},
  {category:"意見", pattern:"我覺得～", zhuyin:"ㄨㄛˇ ㄐㄩㄝˊ ㄉㄜ˙", meaning:"～だと思う", note:"我認為より口語で自然。感想に便利。", example:"我覺得這家店很好吃。", exampleZhuyin:"ㄨㄛˇ ㄐㄩㄝˊ ㄉㄜ˙ ㄓㄜˋ ㄐㄧㄚ ㄉㄧㄢˋ ㄏㄣˇ ㄏㄠˇ ㄔ", tags:["Sランク","感想"], prompts:[{ja:"この店はおいしいと思う",answer:"我覺得這家店很好吃。",zhuyin:"ㄨㄛˇ ㄐㄩㄝˊ ㄉㄜ˙ ㄓㄜˋ ㄐㄧㄚ ㄉㄧㄢˋ ㄏㄣˇ ㄏㄠˇ ㄔ"},{ja:"今日は暑すぎると思う",answer:"我覺得今天太熱了。",zhuyin:"ㄨㄛˇ ㄐㄩㄝˊ ㄉㄜ˙ ㄐㄧㄣ ㄊㄧㄢ ㄊㄞˋ ㄖㄜˋ ㄌㄜ˙"},{ja:"これはちょっと難しいと思う",answer:"我覺得這個有點難。",zhuyin:"ㄨㄛˇ ㄐㄩㄝˊ ㄉㄜ˙ ㄓㄜˋ ㄍㄜ˙ ㄧㄡˇ ㄉㄧㄢˇ ㄋㄢˊ"}]},
  {category:"推量", pattern:"好像～", zhuyin:"ㄏㄠˇ ㄒㄧㄤˋ", meaning:"～みたい、～らしい", note:"あゆあん声調注意。ㄏㄠˇは3声、ㄒㄧㄤˋは4声。", example:"我好像懂一點了。", exampleZhuyin:"ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄉㄨㄥˇ ㄧˋ ㄉㄧㄢˇ ㄌㄜ˙", tags:["Sランク","声調注意"], prompts:[{ja:"雨が降りそう",answer:"好像要下雨了。",zhuyin:"ㄏㄠˇ ㄒㄧㄤˋ ㄧㄠˋ ㄒㄧㄚˋ ㄩˇ ㄌㄜ˙"},{ja:"ちょっとわかった気がする",answer:"我好像懂一點了。",zhuyin:"ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄉㄨㄥˇ ㄧˋ ㄉㄧㄢˇ ㄌㄜ˙"},{ja:"彼はいないみたい",answer:"他好像不在。",zhuyin:"ㄊㄚ ㄏㄠˇ ㄒㄧㄤˋ ㄅㄨˊ ㄗㄞˋ"}]},
  {category:"提醒", pattern:"記得要～", zhuyin:"ㄐㄧˋ ㄉㄜ˙ ㄧㄠˋ", meaning:"忘れずに～してね", note:"口語では要が省略されることもある。記得開泡泡。", example:"記得要開泡泡。", exampleZhuyin:"ㄐㄧˋ ㄉㄜ˙ ㄧㄠˋ ㄎㄞ ㄆㄠˋ ㄆㄠˋ", tags:["Sランク","WOS"], prompts:[{ja:"シールド張るの忘れないで",answer:"記得要開泡泡。",zhuyin:"ㄐㄧˋ ㄉㄜ˙ ㄧㄠˋ ㄎㄞ ㄆㄠˋ ㄆㄠˋ"},{ja:"早く寝るの忘れないで",answer:"記得要早點睡。",zhuyin:"ㄐㄧˋ ㄉㄜ˙ ㄧㄠˋ ㄗㄠˇ ㄉㄧㄢˇ ㄕㄨㄟˋ"},{ja:"採集時間を計算するの忘れないで",answer:"記得要算採集時間。",zhuyin:"ㄐㄧˋ ㄉㄜ˙ ㄧㄠˋ ㄙㄨㄢˋ ㄘㄞˇ ㄐㄧˊ ㄕˊ ㄐㄧㄢ"}]},
  {category:"予定", pattern:"我要～了", zhuyin:"ㄨㄛˇ ㄧㄠˋ ～ ㄌㄜ˙", meaning:"これから～する、もう～する", note:"行動に入る直前の感じ。", example:"我要睡覺了。", exampleZhuyin:"ㄨㄛˇ ㄧㄠˋ ㄕㄨㄟˋ ㄐㄧㄠˋ ㄌㄜ˙", tags:["Sランク"], prompts:[{ja:"もう寝るね",answer:"我要睡覺了。",zhuyin:"ㄨㄛˇ ㄧㄠˋ ㄕㄨㄟˋ ㄐㄧㄠˋ ㄌㄜ˙"},{ja:"もう行くね",answer:"我要走了。",zhuyin:"ㄨㄛˇ ㄧㄠˋ ㄗㄡˇ ㄌㄜ˙"},{ja:"これから出かける",answer:"我要出門了。",zhuyin:"ㄨㄛˇ ㄧㄠˋ ㄔㄨ ㄇㄣˊ ㄌㄜ˙"}]},
  {category:"許可", pattern:"可以～嗎？", zhuyin:"ㄎㄜˇ ㄧˇ ～ ㄇㄚ˙", meaning:"～していい？", note:"カフェ・写真・ゲームで万能。", example:"可以拍照嗎？", exampleZhuyin:"ㄎㄜˇ ㄧˇ ㄆㄞ ㄓㄠˋ ㄇㄚ˙", tags:["Sランク","旅行"], prompts:[{ja:"ここに座ってもいいですか",answer:"可以坐這裡嗎？",zhuyin:"ㄎㄜˇ ㄧˇ ㄗㄨㄛˋ ㄓㄜˋ ㄌㄧˇ ㄇㄚ˙"},{ja:"写真を撮ってもいいですか",answer:"可以拍照嗎？",zhuyin:"ㄎㄜˇ ㄧˇ ㄆㄞ ㄓㄠˋ ㄇㄚ˙"},{ja:"開けてもいい？",answer:"可以開嗎？",zhuyin:"ㄎㄜˇ ㄧˇ ㄎㄞ ㄇㄚ˙"}]},
  {category:"依頼", pattern:"你能～嗎？", zhuyin:"ㄋㄧˇ ㄋㄥˊ ～ ㄇㄚ˙", meaning:"～してもらえますか", note:"丁寧にお願いしたい時。主語なしの能～嗎も自然。", example:"你能幫我嗎？", exampleZhuyin:"ㄋㄧˇ ㄋㄥˊ ㄅㄤ ㄨㄛˇ ㄇㄚ˙", tags:["Sランク","依頼"], prompts:[{ja:"手伝ってもらえますか",answer:"你能幫我嗎？",zhuyin:"ㄋㄧˇ ㄋㄥˊ ㄅㄤ ㄨㄛˇ ㄇㄚ˙"},{ja:"もう一回言ってもらえますか",answer:"能再說一次嗎？",zhuyin:"ㄋㄥˊ ㄗㄞˋ ㄕㄨㄛ ㄧˊ ㄘˋ ㄇㄚ˙"},{ja:"ちょっと見てもらえますか",answer:"你能幫我看一下嗎？",zhuyin:"ㄋㄧˇ ㄋㄥˊ ㄅㄤ ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ ㄇㄚ˙"}]},
  {category:"理由", pattern:"因為～所以～", zhuyin:"ㄧㄣ ㄨㄟˋ ～ ㄙㄨㄛˇ ㄧˇ ～", meaning:"～だから～", note:"因為＋理由、所以＋結果。片方だけでもよく使う。", example:"因為我喜歡台灣，所以我學中文。", exampleZhuyin:"ㄧㄣ ㄨㄟˋ ㄨㄛˇ ㄒㄧˇ ㄏㄨㄢ ㄊㄞˊ ㄨㄢ，ㄙㄨㄛˇ ㄧˇ ㄨㄛˇ ㄒㄩㄝˊ ㄓㄨㄥ ㄨㄣˊ", tags:["接続詞"], prompts:[{ja:"台湾が好きだから中国語を勉強してる",answer:"因為我喜歡台灣，所以我學中文。",zhuyin:"ㄧㄣ ㄨㄟˋ ㄨㄛˇ ㄒㄧˇ ㄏㄨㄢ ㄊㄞˊ ㄨㄢ，ㄙㄨㄛˇ ㄧˇ ㄨㄛˇ ㄒㄩㄝˊ ㄓㄨㄥ ㄨㄣˊ"},{ja:"仕事が忙しいから疲れてる",answer:"因為工作很忙，所以我很累。",zhuyin:"ㄧㄣ ㄨㄟˋ ㄍㄨㄥ ㄗㄨㄛˋ ㄏㄣˇ ㄇㄤˊ，ㄙㄨㄛˇ ㄧˇ ㄨㄛˇ ㄏㄣˇ ㄌㄟˋ"},{ja:"日本は台風休みがないから出社しなきゃ",answer:"因為日本沒有放颱風假，所以我得上班。",zhuyin:"ㄧㄣ ㄨㄟˋ ㄖˋ ㄅㄣˇ ㄇㄟˊ ㄧㄡˇ ㄈㄤˋ ㄊㄞˊ ㄈㄥ ㄐㄧㄚˋ，ㄙㄨㄛˇ ㄧˇ ㄨㄛˇ ㄉㄟˇ ㄕㄤˋ ㄅㄢ"}]},
  {category:"仮定", pattern:"如果～就～", zhuyin:"ㄖㄨˊ ㄍㄨㄛˇ ～ ㄐㄧㄡˋ ～", meaning:"もし～なら～", note:"ㄖ音注意。就は結果側に置くと自然。", example:"如果明天下雨，我就不去。", exampleZhuyin:"ㄖㄨˊ ㄍㄨㄛˇ ㄇㄧㄥˊ ㄊㄧㄢ ㄒㄧㄚˋ ㄩˇ，ㄨㄛˇ ㄐㄧㄡˋ ㄅㄨˊ ㄑㄩˋ", tags:["接続詞","r注意"], prompts:[{ja:"もし明日雨なら行かない",answer:"如果明天下雨，我就不去。",zhuyin:"ㄖㄨˊ ㄍㄨㄛˇ ㄇㄧㄥˊ ㄊㄧㄢ ㄒㄧㄚˋ ㄩˇ，ㄨㄛˇ ㄐㄧㄡˋ ㄅㄨˊ ㄑㄩˋ"},{ja:"もし時間があったら見てみる",answer:"如果有時間，我就看看。",zhuyin:"ㄖㄨˊ ㄍㄨㄛˇ ㄧㄡˇ ㄕˊ ㄐㄧㄢ，ㄨㄛˇ ㄐㄧㄡˋ ㄎㄢˋ ㄎㄢ˙"},{ja:"もし台湾に行ったら潤餅を食べたい",answer:"如果我去台灣，我想吃潤餅。",zhuyin:"ㄖㄨˊ ㄍㄨㄛˇ ㄨㄛˇ ㄑㄩˋ ㄊㄞˊ ㄨㄢ，ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄖㄨㄣˋ ㄅㄧㄥˇ"}]},
  {category:"逆接", pattern:"雖然～但是～", zhuyin:"ㄙㄨㄟ ㄖㄢˊ ～ ㄉㄢˋ ㄕˋ ～", meaning:"～だけど～", note:"中文では但是を入れると組み立てやすい。", example:"雖然很難，但是很好玩。", exampleZhuyin:"ㄙㄨㄟ ㄖㄢˊ ㄏㄣˇ ㄋㄢˊ，ㄉㄢˋ ㄕˋ ㄏㄣˇ ㄏㄠˇ ㄨㄢˊ", tags:["接続詞"], prompts:[{ja:"難しいけど面白い",answer:"雖然很難，但是很好玩。",zhuyin:"ㄙㄨㄟ ㄖㄢˊ ㄏㄣˇ ㄋㄢˊ，ㄉㄢˋ ㄕˋ ㄏㄣˇ ㄏㄠˇ ㄨㄢˊ"},{ja:"疲れてるけど嬉しい",answer:"雖然很累，但是很開心。",zhuyin:"ㄙㄨㄟ ㄖㄢˊ ㄏㄣˇ ㄌㄟˋ，ㄉㄢˋ ㄕˋ ㄏㄣˇ ㄎㄞ ㄒㄧㄣ"},{ja:"日本は台風が来ても出社しなきゃ",answer:"雖然颱風要來，但是我得上班。",zhuyin:"ㄙㄨㄟ ㄖㄢˊ ㄊㄞˊ ㄈㄥ ㄧㄠˋ ㄌㄞˊ，ㄉㄢˋ ㄕˋ ㄨㄛˇ ㄉㄟˇ ㄕㄤˋ ㄅㄢ"}]},
  {category:"提案", pattern:"還是～吧", zhuyin:"ㄏㄞˊ ㄕˋ ～ ㄅㄚ˙", meaning:"やっぱり～しよう／～したほうがいい", note:"迷ったあとに結論を出す感じ。", example:"我們還是坐捷運吧。", exampleZhuyin:"ㄨㄛˇ ㄇㄣ˙ ㄏㄞˊ ㄕˋ ㄗㄨㄛˋ ㄐㄧㄝˊ ㄩㄣˋ ㄅㄚ˙", tags:["雑談"], prompts:[{ja:"やっぱり地下鉄で行こう",answer:"我們還是坐捷運吧。",zhuyin:"ㄨㄛˇ ㄇㄣ˙ ㄏㄞˊ ㄕˋ ㄗㄨㄛˋ ㄐㄧㄝˊ ㄩㄣˋ ㄅㄚ˙"},{ja:"やっぱり早く寝たほうがいい",answer:"你還是早點睡吧。",zhuyin:"ㄋㄧˇ ㄏㄞˊ ㄕˋ ㄗㄠˇ ㄉㄧㄢˇ ㄕㄨㄟˋ ㄅㄚ˙"},{ja:"やっぱり潤餅を食べたい",answer:"我還是想吃潤餅。",zhuyin:"ㄨㄛˇ ㄏㄞˊ ㄕˋ ㄒㄧㄤˇ ㄔ ㄖㄨㄣˋ ㄅㄧㄥˇ"}]},
  {category:"意見", pattern:"對我來說～", zhuyin:"ㄉㄨㄟˋ ㄨㄛˇ ㄌㄞˊ ㄕㄨㄛ", meaning:"私にとって～", note:"自分基準で言えるので安全。", example:"對我來說，這不太難。", exampleZhuyin:"ㄉㄨㄟˋ ㄨㄛˇ ㄌㄞˊ ㄕㄨㄛ，ㄓㄜˋ ㄅㄨˊ ㄊㄞˋ ㄋㄢˊ", tags:["雑談"], prompts:[{ja:"私にとってこれはそんなに難しくない",answer:"對我來說，這不太難。",zhuyin:"ㄉㄨㄟˋ ㄨㄛˇ ㄌㄞˊ ㄕㄨㄛ，ㄓㄜˋ ㄅㄨˊ ㄊㄞˋ ㄋㄢˊ"},{ja:"私にとって台湾華語は大事",answer:"對我來說，台灣華語很重要。",zhuyin:"ㄉㄨㄟˋ ㄨㄛˇ ㄌㄞˊ ㄕㄨㄛ，ㄊㄞˊ ㄨㄢ ㄏㄨㄚˊ ㄩˇ ㄏㄣˇ ㄓㄨㄥˋ ㄧㄠˋ"},{ja:"私にとって発音は難しい",answer:"對我來說，發音很難。",zhuyin:"ㄉㄨㄟˋ ㄨㄛˇ ㄌㄞˊ ㄕㄨㄛ，ㄈㄚ ㄧㄣ ㄏㄣˇ ㄋㄢˊ"}]},
  {category:"願望", pattern:"我希望～", zhuyin:"ㄨㄛˇ ㄒㄧ ㄨㄤˋ", meaning:"～だといいな、～を望む", note:"期待や願望を少し丁寧に言える。", example:"我希望明天是晴天。", exampleZhuyin:"ㄨㄛˇ ㄒㄧ ㄨㄤˋ ㄇㄧㄥˊ ㄊㄧㄢ ㄕˋ ㄑㄧㄥˊ ㄊㄧㄢ", tags:["雑談"], prompts:[{ja:"明日晴れるといいな",answer:"我希望明天是晴天。",zhuyin:"ㄨㄛˇ ㄒㄧ ㄨㄤˋ ㄇㄧㄥˊ ㄊㄧㄢ ㄕˋ ㄑㄧㄥˊ ㄊㄧㄢ"},{ja:"あなたが来られるといいな",answer:"我希望你能來。",zhuyin:"ㄨㄛˇ ㄒㄧ ㄨㄤˋ ㄋㄧˇ ㄋㄥˊ ㄌㄞˊ"},{ja:"もっと話せるようになるといいな",answer:"我希望我可以說得更好。",zhuyin:"ㄨㄛˇ ㄒㄧ ㄨㄤˋ ㄨㄛˇ ㄎㄜˇ ㄧˇ ㄕㄨㄛ ㄉㄜ˙ ㄍㄥˋ ㄏㄠˇ"}]},
  {category:"気持ち", pattern:"我擔心～", zhuyin:"ㄨㄛˇ ㄉㄢ ㄒㄧㄣ", meaning:"～が心配", note:"颱風・仕事・体調で使える。", example:"我擔心明天的天氣。", exampleZhuyin:"ㄨㄛˇ ㄉㄢ ㄒㄧㄣ ㄇㄧㄥˊ ㄊㄧㄢ ㄉㄜ˙ ㄊㄧㄢ ㄑㄧˋ", tags:["雑談"], prompts:[{ja:"明日の天気が心配",answer:"我擔心明天的天氣。",zhuyin:"ㄨㄛˇ ㄉㄢ ㄒㄧㄣ ㄇㄧㄥˊ ㄊㄧㄢ ㄉㄜ˙ ㄊㄧㄢ ㄑㄧˋ"},{ja:"仕事が心配",answer:"我擔心工作。",zhuyin:"ㄨㄛˇ ㄉㄢ ㄒㄧㄣ ㄍㄨㄥ ㄗㄨㄛˋ"},{ja:"間に合わないか心配",answer:"我擔心來不及。",zhuyin:"ㄨㄛˇ ㄉㄢ ㄒㄧㄣ ㄌㄞˊ ㄅㄨˋ ㄐㄧˊ"}]},
  {category:"変化", pattern:"越來越～", zhuyin:"ㄩㄝˋ ㄌㄞˊ ㄩㄝˋ", meaning:"だんだん～、ますます～", note:"變化している感じ。天気・中文・仕事に便利。", example:"我的中文越來越好了。", exampleZhuyin:"ㄨㄛˇ ㄉㄜ˙ ㄓㄨㄥ ㄨㄣˊ ㄩㄝˋ ㄌㄞˊ ㄩㄝˋ ㄏㄠˇ ㄌㄜ˙", tags:["何度も質問した"], prompts:[{ja:"中国語がだんだん上手になってる",answer:"我的中文越來越好了。",zhuyin:"ㄨㄛˇ ㄉㄜ˙ ㄓㄨㄥ ㄨㄣˊ ㄩㄝˋ ㄌㄞˊ ㄩㄝˋ ㄏㄠˇ ㄌㄜ˙"},{ja:"天気がだんだん暑くなってきた",answer:"天氣越來越熱了。",zhuyin:"ㄊㄧㄢ ㄑㄧˋ ㄩㄝˋ ㄌㄞˊ ㄩㄝˋ ㄖㄜˋ ㄌㄜ˙"},{ja:"仕事がますます忙しくなってる",answer:"工作越來越忙了。",zhuyin:"ㄍㄨㄥ ㄗㄨㄛˋ ㄩㄝˋ ㄌㄞˊ ㄩㄝˋ ㄇㄤˊ ㄌㄜ˙"}]},
  {category:"変化", pattern:"越A越B", zhuyin:"ㄩㄝˋ A ㄩㄝˋ B", meaning:"AすればするほどB", note:"越看越～、越聽越～など。", example:"越聽越奇怪。", exampleZhuyin:"ㄩㄝˋ ㄊㄧㄥ ㄩㄝˋ ㄑㄧˊ ㄍㄨㄞˋ", tags:["何度も質問した"], prompts:[{ja:"聞けば聞くほど変",answer:"越聽越奇怪。",zhuyin:"ㄩㄝˋ ㄊㄧㄥ ㄩㄝˋ ㄑㄧˊ ㄍㄨㄞˋ"},{ja:"見れば見るほど笑える",answer:"越看越想笑。",zhuyin:"ㄩㄝˋ ㄎㄢˋ ㄩㄝˋ ㄒㄧㄤˇ ㄒㄧㄠˋ"},{ja:"勉強すればするほど難しい",answer:"越學越難。",zhuyin:"ㄩㄝˋ ㄒㄩㄝˊ ㄩㄝˋ ㄋㄢˊ"}]},
  {category:"条件", pattern:"只要～就～", zhuyin:"ㄓˇ ㄧㄠˋ ～ ㄐㄧㄡˋ ～", meaning:"～しさえすれば～", note:"条件を軽く言える。", example:"只要多練習，就會進步。", exampleZhuyin:"ㄓˇ ㄧㄠˋ ㄉㄨㄛ ㄌㄧㄢˋ ㄒㄧˊ，ㄐㄧㄡˋ ㄏㄨㄟˋ ㄐㄧㄣˋ ㄅㄨˋ", tags:["接続詞"], prompts:[{ja:"たくさん練習すれば上達する",answer:"只要多練習，就會進步。",zhuyin:"ㄓˇ ㄧㄠˋ ㄉㄨㄛ ㄌㄧㄢˋ ㄒㄧˊ，ㄐㄧㄡˋ ㄏㄨㄟˋ ㄐㄧㄣˋ ㄅㄨˋ"},{ja:"聞けばわかる",answer:"只要聽，就會懂。",zhuyin:"ㄓˇ ㄧㄠˋ ㄊㄧㄥ，ㄐㄧㄡˋ ㄏㄨㄟˋ ㄉㄨㄥˇ"},{ja:"行けば買える",answer:"只要去，就買得到。",zhuyin:"ㄓˇ ㄧㄠˋ ㄑㄩˋ，ㄐㄧㄡˋ ㄇㄞˇ ㄉㄜˊ ㄉㄠˋ"}]},
  {category:"判断", pattern:"要看～", zhuyin:"ㄧㄠˋ ㄎㄢˋ", meaning:"～による", note:"『場合による』に近い。短く便利。", example:"要看天氣。", exampleZhuyin:"ㄧㄠˋ ㄎㄢˋ ㄊㄧㄢ ㄑㄧˋ", tags:["会話"], prompts:[{ja:"天気による",answer:"要看天氣。",zhuyin:"ㄧㄠˋ ㄎㄢˋ ㄊㄧㄢ ㄑㄧˋ"},{ja:"時間による",answer:"要看時間。",zhuyin:"ㄧㄠˋ ㄎㄢˋ ㄕˊ ㄐㄧㄢ"},{ja:"状況による",answer:"要看情況。",zhuyin:"ㄧㄠˋ ㄎㄢˋ ㄑㄧㄥˊ ㄎㄨㄤˋ"}]},
  {category:"比較", pattern:"比我想像中還～", zhuyin:"ㄅㄧˇ ㄨㄛˇ ㄒㄧㄤˇ ㄒㄧㄤˋ ㄓㄨㄥ ㄏㄞˊ", meaning:"思ったより～", note:"還がポイント。想像よりさらに、の感じ。", example:"比我想像中還難。", exampleZhuyin:"ㄅㄧˇ ㄨㄛˇ ㄒㄧㄤˇ ㄒㄧㄤˋ ㄓㄨㄥ ㄏㄞˊ ㄋㄢˊ", tags:["感想"], prompts:[{ja:"思ったより難しい",answer:"比我想像中還難。",zhuyin:"ㄅㄧˇ ㄨㄛˇ ㄒㄧㄤˇ ㄒㄧㄤˋ ㄓㄨㄥ ㄏㄞˊ ㄋㄢˊ"},{ja:"思ったよりおいしい",answer:"比我想像中還好吃。",zhuyin:"ㄅㄧˇ ㄨㄛˇ ㄒㄧㄤˇ ㄒㄧㄤˋ ㄓㄨㄥ ㄏㄞˊ ㄏㄠˇ ㄔ"},{ja:"思ったより人が多い",answer:"比我想像中還多人。",zhuyin:"ㄅㄧˇ ㄨㄛˇ ㄒㄧㄤˇ ㄒㄧㄤˋ ㄓㄨㄥ ㄏㄞˊ ㄉㄨㄛ ㄖㄣˊ"}]},
  {category:"時間", pattern:"該～了", zhuyin:"ㄍㄞ ～ ㄌㄜ˙", meaning:"そろそろ～する時間だ", note:"該睡覺了が最重要。", example:"該睡覺了。", exampleZhuyin:"ㄍㄞ ㄕㄨㄟˋ ㄐㄧㄠˋ ㄌㄜ˙", tags:["会話"], prompts:[{ja:"そろそろ寝る時間だ",answer:"該睡覺了。",zhuyin:"ㄍㄞ ㄕㄨㄟˋ ㄐㄧㄠˋ ㄌㄜ˙"},{ja:"そろそろ出かける時間だ",answer:"該出門了。",zhuyin:"ㄍㄞ ㄔㄨ ㄇㄣˊ ㄌㄜ˙"},{ja:"そろそろ仕事に行く時間だ",answer:"該去上班了。",zhuyin:"ㄍㄞ ㄑㄩˋ ㄕㄤˋ ㄅㄢ ㄌㄜ˙"}]},
  {category:"感想", pattern:"～怪怪的", zhuyin:"～ ㄍㄨㄞˋ ㄍㄨㄞˋ ㄉㄜ˙", meaning:"なんか変", note:"違和感をやわらかく言える。", example:"今天的味道怪怪的。", exampleZhuyin:"ㄐㄧㄣ ㄊㄧㄢ ㄉㄜ˙ ㄨㄟˋ ㄉㄠˋ ㄍㄨㄞˋ ㄍㄨㄞˋ ㄉㄜ˙", tags:["感想","台湾人よく使う"], prompts:[{ja:"今日の味なんか変",answer:"今天的味道怪怪的。",zhuyin:"ㄐㄧㄣ ㄊㄧㄢ ㄉㄜ˙ ㄨㄟˋ ㄉㄠˋ ㄍㄨㄞˋ ㄍㄨㄞˋ ㄉㄜ˙"},{ja:"彼の表情なんか変",answer:"他的表情怪怪的。",zhuyin:"ㄊㄚ ㄉㄜ˙ ㄅㄧㄠˇ ㄑㄧㄥˊ ㄍㄨㄞˋ ㄍㄨㄞˋ ㄉㄜ˙"},{ja:"この文なんか変",answer:"這個句子怪怪的。",zhuyin:"ㄓㄜˋ ㄍㄜ˙ ㄐㄩˋ ㄗˇ ㄍㄨㄞˋ ㄍㄨㄞˋ ㄉㄜ˙"}]},
  {category:"挑戦", pattern:"我試著～", zhuyin:"ㄨㄛˇ ㄕˋ ㄓㄜ˙", meaning:"～してみる", note:"我想VV看より『試しにやってみる』感。", example:"我試著用中文回答。", exampleZhuyin:"ㄨㄛˇ ㄕˋ ㄓㄜ˙ ㄩㄥˋ ㄓㄨㄥ ㄨㄣˊ ㄏㄨㄟˊ ㄉㄚˊ", tags:["会話"], prompts:[{ja:"中国語で答えてみる",answer:"我試著用中文回答。",zhuyin:"ㄨㄛˇ ㄕˋ ㄓㄜ˙ ㄩㄥˋ ㄓㄨㄥ ㄨㄣˊ ㄏㄨㄟˊ ㄉㄚˊ"},{ja:"早く寝るようにしてみる",answer:"我試著早點睡。",zhuyin:"ㄨㄛˇ ㄕˋ ㄓㄜ˙ ㄗㄠˇ ㄉㄧㄢˇ ㄕㄨㄟˋ"},{ja:"毎日練習してみる",answer:"我試著每天練習。",zhuyin:"ㄨㄛˇ ㄕˋ ㄓㄜ˙ ㄇㄟˇ ㄊㄧㄢ ㄌㄧㄢˋ ㄒㄧˊ"}]},
  {category:"反問", pattern:"不就～嗎？", zhuyin:"ㄅㄨˊ ㄐㄧㄡˋ ～ ㄇㄚ˙", meaning:"～すればいいじゃん／～じゃない？", note:"少しツッコミっぽい解決案。強く言いすぎ注意。", example:"吃蛋糕不就好了嗎？", exampleZhuyin:"ㄔ ㄉㄢˋ ㄍㄠ ㄅㄨˊ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙ ㄇㄚ˙", tags:["何度も質問した","会話"], prompts:[{ja:"ケーキを食べればいいじゃん",answer:"吃蛋糕不就好了嗎？",zhuyin:"ㄔ ㄉㄢˋ ㄍㄠ ㄅㄨˊ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙ ㄇㄚ˙"},{ja:"直接聞けばいいじゃん",answer:"直接問不就好了嗎？",zhuyin:"ㄓˊ ㄐㄧㄝ ㄨㄣˋ ㄅㄨˊ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙ ㄇㄚ˙"},{ja:"早く寝ればいいじゃん",answer:"早點睡不就好了嗎？",zhuyin:"ㄗㄠˇ ㄉㄧㄢˇ ㄕㄨㄟˋ ㄅㄨˊ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙ ㄇㄚ˙"}]},
  {category:"選択", pattern:"寧願A，也不願意B", zhuyin:"ㄋㄧㄥˊ ㄩㄢˋ A，ㄧㄝˇ ㄅㄨˊ ㄩㄢˋ ㄧˋ B", meaning:"BするくらいならAしたい", note:"寧は2声。Bを避けたい感じ。", example:"我寧願走路，也不願意加班。", exampleZhuyin:"ㄨㄛˇ ㄋㄧㄥˊ ㄩㄢˋ ㄗㄡˇ ㄌㄨˋ，ㄧㄝˇ ㄅㄨˊ ㄩㄢˋ ㄧˋ ㄐㄧㄚ ㄅㄢ", tags:["声調注意","何度も質問した"], prompts:[{ja:"残業するくらいなら歩きたい",answer:"我寧願走路，也不願意加班。",zhuyin:"ㄨㄛˇ ㄋㄧㄥˊ ㄩㄢˋ ㄗㄡˇ ㄌㄨˋ，ㄧㄝˇ ㄅㄨˊ ㄩㄢˋ ㄧˋ ㄐㄧㄚ ㄅㄢ"},{ja:"行かないくらいなら少し遅れて行きたい",answer:"我寧願晚一點去，也不願意不去。",zhuyin:"ㄨㄛˇ ㄋㄧㄥˊ ㄩㄢˋ ㄨㄢˇ ㄧˋ ㄉㄧㄢˇ ㄑㄩˋ，ㄧㄝˇ ㄅㄨˊ ㄩㄢˋ ㄧˋ ㄅㄨˊ ㄑㄩˋ"},{ja:"何もしないくらいなら少し勉強したい",answer:"我寧願學一點，也不願意什麼都不做。",zhuyin:"ㄨㄛˇ ㄋㄧㄥˊ ㄩㄢˋ ㄒㄩㄝˊ ㄧˋ ㄉㄧㄢˇ，ㄧㄝˇ ㄅㄨˊ ㄩㄢˋ ㄧˋ ㄕㄣˊ ㄇㄜ˙ ㄉㄡ ㄅㄨˊ ㄗㄨㄛˋ"}]},
  {category:"話題", pattern:"說到～", zhuyin:"ㄕㄨㄛ ㄉㄠˋ", meaning:"～といえば", note:"話題を自然につなぐ。對了より流れに沿う。", example:"說到台灣，我想吃潤餅。", exampleZhuyin:"ㄕㄨㄛ ㄉㄠˋ ㄊㄞˊ ㄨㄢ，ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄖㄨㄣˋ ㄅㄧㄥˇ", tags:["何度も質問した","雑談"], prompts:[{ja:"台湾といえば、潤餅を食べたい",answer:"說到台灣，我想吃潤餅。",zhuyin:"ㄕㄨㄛ ㄉㄠˋ ㄊㄞˊ ㄨㄢ，ㄨㄛˇ ㄒㄧㄤˇ ㄔ ㄖㄨㄣˋ ㄅㄧㄥˇ"},{ja:"文具といえば、私はノートが好き",answer:"說到文具，我喜歡筆記本。",zhuyin:"ㄕㄨㄛ ㄉㄠˋ ㄨㄣˊ ㄐㄩˋ，ㄨㄛˇ ㄒㄧˇ ㄏㄨㄢ ㄅㄧˇ ㄐㄧˋ ㄅㄣˇ"},{ja:"ゲームといえば、今日は熊ある？",answer:"說到遊戲，今天有熊嗎？",zhuyin:"ㄕㄨㄛ ㄉㄠˋ ㄧㄡˊ ㄒㄧˋ，ㄐㄧㄣ ㄊㄧㄢ ㄧㄡˇ ㄒㄩㄥˊ ㄇㄚ˙"}]},
  {category:"記憶", pattern:"想不起來", zhuyin:"ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ", meaning:"思い出せない", note:"記憶にあるはずなのに出てこない。", example:"我想不起來那個字。", exampleZhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ ㄋㄚˋ ㄍㄜ˙ ㄗˋ", tags:["何度も質問した"], prompts:[{ja:"その字が思い出せない",answer:"我想不起來那個字。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ ㄋㄚˋ ㄍㄜ˙ ㄗˋ"},{ja:"名前が思い出せない",answer:"我想不起來名字。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ ㄇㄧㄥˊ ㄗˋ"},{ja:"前にも聞いたけど思い出せない",answer:"我以前問過，但是想不起來。",zhuyin:"ㄨㄛˇ ㄧˇ ㄑㄧㄢˊ ㄨㄣˋ ㄍㄨㄛˋ，ㄉㄢˋ ㄕˋ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ"}]},
  {category:"発想", pattern:"想不出來", zhuyin:"ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ", meaning:"思いつかない", note:"言い方・答え・案が出てこない時。", example:"我想不出來怎麼說。", exampleZhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ ㄗㄣˇ ㄇㄜ˙ ㄕㄨㄛ", tags:["何度も質問した"], prompts:[{ja:"なんて言えばいいか思いつかない",answer:"我想不出來怎麼說。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ ㄗㄣˇ ㄇㄜ˙ ㄕㄨㄛ"},{ja:"答えが思いつかない",answer:"我想不出來答案。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ ㄉㄚˊ ㄢˋ"},{ja:"いい例文が思いつかない",answer:"我想不出來好的例句。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄅㄨˋ ㄔㄨ ㄌㄞˊ ㄏㄠˇ ㄉㄜ˙ ㄌㄧˋ ㄐㄩˋ"}]},
  {category:"完了", pattern:"V 完了", zhuyin:"V ㄨㄢˊ ㄌㄜ˙", meaning:"～し終わった", note:"言い換え集から。日常動作に便利。", example:"我吃完早飯了。", exampleZhuyin:"ㄨㄛˇ ㄔ ㄨㄢˊ ㄗㄠˇ ㄈㄢˋ ㄌㄜ˙", tags:["日常"], prompts:[{ja:"朝ごはんを食べ終わった",answer:"我吃完早飯了。",zhuyin:"ㄨㄛˇ ㄔ ㄨㄢˊ ㄗㄠˇ ㄈㄢˋ ㄌㄜ˙"},{ja:"買い物が終わった",answer:"東西買完了。",zhuyin:"ㄉㄨㄥ ㄒㄧ˙ ㄇㄞˇ ㄨㄢˊ ㄌㄜ˙"},{ja:"宿題が終わった",answer:"作業做完了。",zhuyin:"ㄗㄨㄛˋ ㄧㄝˋ ㄗㄨㄛˋ ㄨㄢˊ ㄌㄜ˙"}]},
  {category:"経験", pattern:"你～過嗎？", zhuyin:"ㄋㄧˇ ～ ㄍㄨㄛˋ ㄇㄚ˙", meaning:"～したことある？", note:"旅行・食べ物の雑談に強い。", example:"你去過台灣嗎？", exampleZhuyin:"ㄋㄧˇ ㄑㄩˋ ㄍㄨㄛˋ ㄊㄞˊ ㄨㄢ ㄇㄚ˙", tags:["雑談"], prompts:[{ja:"台湾に行ったことある？",answer:"你去過台灣嗎？",zhuyin:"ㄋㄧˇ ㄑㄩˋ ㄍㄨㄛˋ ㄊㄞˊ ㄨㄢ ㄇㄚ˙"},{ja:"潤餅を食べたことある？",answer:"你吃過潤餅嗎？",zhuyin:"ㄋㄧˇ ㄔ ㄍㄨㄛˋ ㄖㄨㄣˋ ㄅㄧㄥˇ ㄇㄚ˙"},{ja:"このゲームやったことある？",answer:"你玩過這個遊戲嗎？",zhuyin:"ㄋㄧˇ ㄨㄢˊ ㄍㄨㄛˋ ㄓㄜˋ ㄍㄜ˙ ㄧㄡˊ ㄒㄧˋ ㄇㄚ˙"}]},
  {category:"見た目", pattern:"看起來～", zhuyin:"ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ", meaning:"～に見える、～そう", note:"食べ物・体調・雰囲気に便利。", example:"這個看起來很好吃。", exampleZhuyin:"ㄓㄜˋ ㄍㄜ˙ ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄏㄣˇ ㄏㄠˇ ㄔ", tags:["旅行","感想"], prompts:[{ja:"これおいしそう",answer:"這個看起來很好吃。",zhuyin:"ㄓㄜˋ ㄍㄜ˙ ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄏㄣˇ ㄏㄠˇ ㄔ"},{ja:"疲れているみたいだね",answer:"你看起來很累。",zhuyin:"ㄋㄧˇ ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄏㄣˇ ㄌㄟˋ"},{ja:"楽しそう",answer:"看起來很好玩。",zhuyin:"ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄏㄣˇ ㄏㄠˇ ㄨㄢˊ"}]},

  {category:"程度", pattern:"有一點～", zhuyin:"ㄧㄡˇ ㄧˋ ㄉㄧㄢˇ", meaning:"ちょっと～", note:"ネガティブ寄りが多いけど、普通に少しの意味でも使える。", example:"我有一點累。", exampleZhuyin:"ㄨㄛˇ ㄧㄡˇ ㄧˋ ㄉㄧㄢˇ ㄌㄟˋ", tags:["会話"], prompts:[{ja:"ちょっと疲れた",answer:"我有一點累。",zhuyin:"ㄨㄛˇ ㄧㄡˇ ㄧˋ ㄉㄧㄢˇ ㄌㄟˋ"},{ja:"ちょっとわかった",answer:"我懂一點了。",zhuyin:"ㄨㄛˇ ㄉㄨㄥˇ ㄧˋ ㄉㄧㄢˇ ㄌㄜ˙"},{ja:"ちょっと頭が痛い",answer:"我有一點頭痛。",zhuyin:"ㄨㄛˇ ㄧㄡˇ ㄧˋ ㄉㄧㄢˇ ㄊㄡˊ ㄊㄨㄥˋ"}]},
  {category:"経験", pattern:"V 過", zhuyin:"V ㄍㄨㄛˋ", meaning:"～したことがある", note:"吃過、去過、看過。経験を言う。", example:"我去過台灣。", exampleZhuyin:"ㄨㄛˇ ㄑㄩˋ ㄍㄨㄛˋ ㄊㄞˊ ㄨㄢ", tags:["旅行"], prompts:[{ja:"台湾に行ったことがある",answer:"我去過台灣。",zhuyin:"ㄨㄛˇ ㄑㄩˋ ㄍㄨㄛˋ ㄊㄞˊ ㄨㄢ"},{ja:"臭豆腐を食べたことがある",answer:"我吃過臭豆腐。",zhuyin:"ㄨㄛˇ ㄔ ㄍㄨㄛˋ ㄔㄡˋ ㄉㄡˋ ㄈㄨˇ"},{ja:"その動画を見たことがある",answer:"我看過那個影片。",zhuyin:"ㄨㄛˇ ㄎㄢˋ ㄍㄨㄛˋ ㄋㄚˋ ㄍㄜ˙ ㄧㄥˇ ㄆㄧㄢˋ"}]},
  {category:"能力", pattern:"V 得到／V 不到", zhuyin:"V ㄉㄜˊ ㄉㄠˋ／V ㄅㄨˊ ㄉㄠˋ", meaning:"～できる／～できない（結果に届く）", note:"買得到＝買える、聽得到＝聞こえる。", example:"這裡買得到嗎？", exampleZhuyin:"ㄓㄜˋ ㄌㄧˇ ㄇㄞˇ ㄉㄜˊ ㄉㄠˋ ㄇㄚ˙", tags:["旅行","会話"], prompts:[{ja:"ここで買えますか",answer:"這裡買得到嗎？",zhuyin:"ㄓㄜˋ ㄌㄧˇ ㄇㄞˇ ㄉㄜˊ ㄉㄠˋ ㄇㄚ˙"},{ja:"聞こえない",answer:"我聽不到。",zhuyin:"ㄨㄛˇ ㄊㄧㄥ ㄅㄨˊ ㄉㄠˋ"},{ja:"見つけられない",answer:"我找不到。",zhuyin:"ㄨㄛˇ ㄓㄠˇ ㄅㄨˊ ㄉㄠˋ"}]},
  {category:"程度", pattern:"太～了", zhuyin:"ㄊㄞˋ ～ ㄌㄜ˙", meaning:"～すぎる／とても～", note:"文脈で褒めにも不満にもなる。太好了！は最高。", example:"太難了。", exampleZhuyin:"ㄊㄞˋ ㄋㄢˊ ㄌㄜ˙", tags:["会話"], prompts:[{ja:"難しすぎる",answer:"太難了。",zhuyin:"ㄊㄞˋ ㄋㄢˊ ㄌㄜ˙"},{ja:"おいしすぎる",answer:"太好吃了。",zhuyin:"ㄊㄞˋ ㄏㄠˇ ㄔ ㄌㄜ˙"},{ja:"眠すぎる",answer:"太睏了。",zhuyin:"ㄊㄞˋ ㄎㄨㄣˋ ㄌㄜ˙"}]},
  {category:"確認", pattern:"是不是～？", zhuyin:"ㄕˋ ㄅㄨˊ ㄕˋ", meaning:"～なの？～で合ってる？", note:"確認したい時に便利。", example:"今天是不是有熊？", exampleZhuyin:"ㄐㄧㄣ ㄊㄧㄢ ㄕˋ ㄅㄨˊ ㄕˋ ㄧㄡˇ ㄒㄩㄥˊ", tags:["WOS","会話"], prompts:[{ja:"今日は熊ある？",answer:"今天是不是有熊？",zhuyin:"ㄐㄧㄣ ㄊㄧㄢ ㄕˋ ㄅㄨˊ ㄕˋ ㄧㄡˇ ㄒㄩㄥˊ"},{ja:"これは台湾華語で合ってる？",answer:"這是不是台灣華語？",zhuyin:"ㄓㄜˋ ㄕˋ ㄅㄨˊ ㄕˋ ㄊㄞˊ ㄨㄢ ㄏㄨㄚˊ ㄩˇ"},{ja:"明日は休みなの？",answer:"明天是不是放假？",zhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄕˋ ㄅㄨˊ ㄕˋ ㄈㄤˋ ㄐㄧㄚˋ"}]},
  {category:"依頼", pattern:"幫我～一下", zhuyin:"ㄅㄤ ㄨㄛˇ ～ ㄧˊ ㄒㄧㄚˋ", meaning:"ちょっと～してもらう", note:"お願いを柔らかくする。", example:"幫我看一下。", exampleZhuyin:"ㄅㄤ ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ", tags:["依頼","会話"], prompts:[{ja:"ちょっと見て",answer:"幫我看一下。",zhuyin:"ㄅㄤ ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ"},{ja:"ちょっと確認してもらえる？",answer:"可以幫我確認一下嗎？",zhuyin:"ㄎㄜˇ ㄧˇ ㄅㄤ ㄨㄛˇ ㄑㄩㄝˋ ㄖㄣˋ ㄧˊ ㄒㄧㄚˋ ㄇㄚ˙"},{ja:"ちょっと開けて",answer:"幫我開一下。",zhuyin:"ㄅㄤ ㄨㄛˇ ㄎㄞ ㄧˊ ㄒㄧㄚˋ"}]},
  {category:"推量", pattern:"應該會～", zhuyin:"ㄧㄥ ㄍㄞ ㄏㄨㄟˋ", meaning:"たぶん～するはず", note:"未来の推量。『明天應該會下雨』。", example:"明天應該會下雨。", exampleZhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄧㄥ ㄍㄞ ㄏㄨㄟˋ ㄒㄧㄚˋ ㄩˇ", tags:["天氣","会話"], prompts:[{ja:"明日はたぶん雨が降る",answer:"明天應該會下雨。",zhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄧㄥ ㄍㄞ ㄏㄨㄟˋ ㄒㄧㄚˋ ㄩˇ"},{ja:"たぶん出社しなきゃ",answer:"我應該得上班。",zhuyin:"ㄨㄛˇ ㄧㄥ ㄍㄞ ㄉㄟˇ ㄕㄤˋ ㄅㄢ"},{ja:"彼はたぶん来る",answer:"他應該會來。",zhuyin:"ㄊㄚ ㄧㄥ ㄍㄞ ㄏㄨㄟˋ ㄌㄞˊ"}]},
  {category:"可能", pattern:"可能會～", zhuyin:"ㄎㄜˇ ㄋㄥˊ ㄏㄨㄟˋ", meaning:"～かもしれない", note:"未来の可能性。會を忘れやすい。", example:"我可能會晚一點到。", exampleZhuyin:"ㄨㄛˇ ㄎㄜˇ ㄋㄥˊ ㄏㄨㄟˋ ㄨㄢˇ ㄧˋ ㄉㄧㄢˇ ㄉㄠˋ", tags:["何度も質問した"], prompts:[{ja:"少し遅れるかも",answer:"我可能會晚一點到。",zhuyin:"ㄨㄛˇ ㄎㄜˇ ㄋㄥˊ ㄏㄨㄟˋ ㄨㄢˇ ㄧˋ ㄉㄧㄢˇ ㄉㄠˋ"},{ja:"明日は涼しいかも",answer:"明天可能會比較涼快。",zhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄎㄜˇ ㄋㄥˊ ㄏㄨㄟˋ ㄅㄧˇ ㄐㄧㄠˋ ㄌㄧㄤˊ ㄎㄨㄞˋ"},{ja:"今日は残業かも",answer:"今天可能會加班。",zhuyin:"ㄐㄧㄣ ㄊㄧㄢ ㄎㄜˇ ㄋㄥˊ ㄏㄨㄟˋ ㄐㄧㄚ ㄅㄢ"}]},
  {category:"感想", pattern:"好像～", zhuyin:"ㄏㄠˇ ㄒㄧㄤˋ", meaning:"～みたい、～気がする", note:"好は3声、像は4声。3-3で覚えない。", example:"我好像懂了。", exampleZhuyin:"ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄉㄨㄥˇ ㄌㄜ˙", tags:["声調注意","何度も質問した"], prompts:[{ja:"なんかわかった気がする",answer:"我好像懂了。",zhuyin:"ㄨㄛˇ ㄏㄠˇ ㄒㄧㄤˋ ㄉㄨㄥˇ ㄌㄜ˙"},{ja:"明日はもっと暑そう",answer:"明天好像會更熱。",zhuyin:"ㄇㄧㄥˊ ㄊㄧㄢ ㄏㄠˇ ㄒㄧㄤˋ ㄏㄨㄟˋ ㄍㄥˋ ㄖㄜˋ"},{ja:"彼は忙しいみたい",answer:"他好像很忙。",zhuyin:"ㄊㄚ ㄏㄠˇ ㄒㄧㄤˋ ㄏㄣˇ ㄇㄤˊ"}]},
  {category:"時間", pattern:"先～再～", zhuyin:"ㄒㄧㄢ ～ ㄗㄞˋ ～", meaning:"先に～してから～", note:"順番を言う。再は『もう一度』だけじゃない。", example:"我先吃飯再洗澡。", exampleZhuyin:"ㄨㄛˇ ㄒㄧㄢ ㄔ ㄈㄢˋ ㄗㄞˋ ㄒㄧˇ ㄗㄠˇ", tags:["又と再","日常"], prompts:[{ja:"先にご飯を食べてからお風呂に入る",answer:"我先吃飯再洗澡。",zhuyin:"ㄨㄛˇ ㄒㄧㄢ ㄔ ㄈㄢˋ ㄗㄞˋ ㄒㄧˇ ㄗㄠˇ"},{ja:"先に確認してから返信する",answer:"我先確認再回覆。",zhuyin:"ㄨㄛˇ ㄒㄧㄢ ㄑㄩㄝˋ ㄖㄣˋ ㄗㄞˋ ㄏㄨㄟˊ ㄈㄨˋ"},{ja:"先に見てから決める",answer:"我先看再決定。",zhuyin:"ㄨㄛˇ ㄒㄧㄢ ㄎㄢˋ ㄗㄞˋ ㄐㄩㄝˊ ㄉㄧㄥˋ"}]},
  {category:"追加", pattern:"又～了", zhuyin:"ㄧㄡˋ ～ ㄌㄜ˙", meaning:"また～した", note:"すでに起きたことがまた起きた。ちょっと『またか』感も出る。", example:"我又忘記了。", exampleZhuyin:"ㄨㄛˇ ㄧㄡˋ ㄨㄤˋ ㄐㄧˋ ㄌㄜ˙", tags:["又と再","会話"], prompts:[{ja:"また忘れた",answer:"我又忘記了。",zhuyin:"ㄨㄛˇ ㄧㄡˋ ㄨㄤˋ ㄐㄧˋ ㄌㄜ˙"},{ja:"また間違えた",answer:"我又搞錯了。",zhuyin:"ㄨㄛˇ ㄧㄡˋ ㄍㄠˇ ㄘㄨㄛˋ ㄌㄜ˙"},{ja:"また残業だ",answer:"我又要加班了。",zhuyin:"ㄨㄛˇ ㄧㄡˋ ㄧㄠˋ ㄐㄧㄚ ㄅㄢ ㄌㄜ˙"}]},
  {category:"追加", pattern:"再～一次", zhuyin:"ㄗㄞˋ ～ ㄧˊ ㄘˋ", meaning:"もう一回～する", note:"これからもう一度する。又は過去、再はこれから。", example:"可以再說一次嗎？", exampleZhuyin:"ㄎㄜˇ ㄧˇ ㄗㄞˋ ㄕㄨㄛ ㄧˊ ㄘˋ ㄇㄚ˙", tags:["又と再","依頼"], prompts:[{ja:"もう一回言ってもらえますか",answer:"可以再說一次嗎？",zhuyin:"ㄎㄜˇ ㄧˇ ㄗㄞˋ ㄕㄨㄛ ㄧˊ ㄘˋ ㄇㄚ˙"},{ja:"もう一回見たい",answer:"我想再看一次。",zhuyin:"ㄨㄛˇ ㄒㄧㄤˇ ㄗㄞˋ ㄎㄢˋ ㄧˊ ㄘˋ"},{ja:"もう一回練習する",answer:"我再練習一次。",zhuyin:"ㄨㄛˇ ㄗㄞˋ ㄌㄧㄢˋ ㄒㄧˊ ㄧˊ ㄘˋ"}]},
  {category:"会話", pattern:"真的假的？", zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙", meaning:"ほんとに？まじで？", note:"かなり口語。驚いた時に便利。", example:"真的假的？太誇張了吧！", exampleZhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙？ㄊㄞˋ ㄎㄨㄚ ㄓㄤ ㄌㄜ˙ ㄅㄚ˙", tags:["台湾人よく使う","会話"], prompts:[{ja:"ほんとに？",answer:"真的假的？",zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙"},{ja:"まじで？すごすぎる",answer:"真的假的？太厲害了吧！",zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙？ㄊㄞˋ ㄌㄧˋ ㄏㄞˋ ㄌㄜ˙ ㄅㄚ˙"},{ja:"ほんとに？誰もいないの？",answer:"真的假的？沒有人嗎？",zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙？ㄇㄟˊ ㄧㄡˇ ㄖㄣˊ ㄇㄚ˙"}]},
  {"category": "接続", "pattern": "反正～", "zhuyin": "ㄈㄢˇ ㄓㄥˋ", "meaning": "どうせ／とにかく～", "note": "理由を軽くまとめたり、投げやりに言う時。", "example": "反正我也不知道。", "exampleZhuyin": "ㄈㄢˇ ㄓㄥˋ ㄨㄛˇ ㄧㄝˇ ㄅㄨˋ ㄓ ㄉㄠˋ", "tags": ["副詞", "会話"], "prompts": [{"ja": "どうせ私も知らない", "answer": "反正我也不知道。", "zhuyin": "ㄈㄢˇ ㄓㄥˋ ㄨㄛˇ ㄧㄝˇ ㄅㄨˋ ㄓ ㄉㄠˋ"}, {"ja": "とにかく先に見てみる", "answer": "反正我先看一下。", "zhuyin": "ㄈㄢˇ ㄓㄥˋ ㄨㄛˇ ㄒㄧㄢ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ"}]},
  {"category": "接続", "pattern": "不然～", "zhuyin": "ㄅㄨˋ ㄖㄢˊ", "meaning": "じゃないと～", "note": "前の行動をしない場合の結果。", "example": "快一點，不然會來不及。", "exampleZhuyin": "ㄎㄨㄞˋ ㄧˋ ㄉㄧㄢˇ，ㄅㄨˋ ㄖㄢˊ ㄏㄨㄟˋ ㄌㄞˊ ㄅㄨˋ ㄐㄧˊ", "tags": ["接続詞"], "prompts": [{"ja": "早くして、じゃないと間に合わない", "answer": "快一點，不然會來不及。", "zhuyin": "ㄎㄨㄞˋ ㄧˋ ㄉㄧㄢˇ，ㄅㄨˋ ㄖㄢˊ ㄏㄨㄟˋ ㄌㄞˊ ㄅㄨˋ ㄐㄧˊ"}, {"ja": "先に寝て、じゃないと明日つらい", "answer": "先睡覺，不然明天會很累。", "zhuyin": "ㄒㄧㄢ ㄕㄨㄟˋ ㄐㄧㄠˋ，ㄅㄨˋ ㄖㄢˊ ㄇㄧㄥˊ ㄊㄧㄢ ㄏㄨㄟˋ ㄏㄣˇ ㄌㄟˋ"}]},
  {"category": "副詞", "pattern": "順便～", "zhuyin": "ㄕㄨㄣˋ ㄅㄧㄢˋ", "meaning": "ついでに～", "note": "買い物・移動・返信で便利。", "example": "我順便買飲料。", "exampleZhuyin": "ㄨㄛˇ ㄕㄨㄣˋ ㄅㄧㄢˋ ㄇㄞˇ ㄧㄣˇ ㄌㄧㄠˋ", "tags": ["会話"], "prompts": [{"ja": "ついでに飲み物を買う", "answer": "我順便買飲料。", "zhuyin": "ㄨㄛˇ ㄕㄨㄣˋ ㄅㄧㄢˋ ㄇㄞˇ ㄧㄣˇ ㄌㄧㄠˋ"}, {"ja": "ついでに聞いてみる", "answer": "我順便問一下。", "zhuyin": "ㄨㄛˇ ㄕㄨㄣˋ ㄅㄧㄢˋ ㄨㄣˋ ㄧˊ ㄒㄧㄚˋ"}]},
  {"category": "時間", "pattern": "後來～", "zhuyin": "ㄏㄡˋ ㄌㄞˊ", "meaning": "その後～", "note": "過去の流れを説明する。", "example": "後來我就回家了。", "exampleZhuyin": "ㄏㄡˋ ㄌㄞˊ ㄨㄛˇ ㄐㄧㄡˋ ㄏㄨㄟˊ ㄐㄧㄚ ㄌㄜ˙", "tags": ["接続詞", "時間"], "prompts": [{"ja": "その後、家に帰った", "answer": "後來我就回家了。", "zhuyin": "ㄏㄡˋ ㄌㄞˊ ㄨㄛˇ ㄐㄧㄡˋ ㄏㄨㄟˊ ㄐㄧㄚ ㄌㄜ˙"}, {"ja": "その後、やっとわかった", "answer": "後來我才懂。", "zhuyin": "ㄏㄡˋ ㄌㄞˊ ㄨㄛˇ ㄘㄞˊ ㄉㄨㄥˇ"}]},
  {"category": "時間", "pattern": "原本想～", "zhuyin": "ㄩㄢˊ ㄅㄣˇ ㄒㄧㄤˇ", "meaning": "もともとは～したかった", "note": "予定変更の説明に強い。", "example": "我原本想去夜市。", "exampleZhuyin": "ㄨㄛˇ ㄩㄢˊ ㄅㄣˇ ㄒㄧㄤˇ ㄑㄩˋ ㄧㄝˋ ㄕˋ", "tags": ["会話"], "prompts": [{"ja": "もともとは夜市に行きたかった", "answer": "我原本想去夜市。", "zhuyin": "ㄨㄛˇ ㄩㄢˊ ㄅㄣˇ ㄒㄧㄤˇ ㄑㄩˋ ㄧㄝˋ ㄕˋ"}, {"ja": "もともとは早く寝たかった", "answer": "我原本想早點睡。", "zhuyin": "ㄨㄛˇ ㄩㄢˊ ㄅㄣˇ ㄒㄧㄤˇ ㄗㄠˇ ㄉㄧㄢˇ ㄕㄨㄟˋ"}]},
  {"category": "強調", "pattern": "根本～", "zhuyin": "ㄍㄣ ㄅㄣˇ", "meaning": "そもそも／全然～", "note": "強めの否定によく出る。", "example": "我根本不知道。", "exampleZhuyin": "ㄨㄛˇ ㄍㄣ ㄅㄣˇ ㄅㄨˋ ㄓ ㄉㄠˋ", "tags": ["副詞"], "prompts": [{"ja": "そもそも知らない", "answer": "我根本不知道。", "zhuyin": "ㄨㄛˇ ㄍㄣ ㄅㄣˇ ㄅㄨˋ ㄓ ㄉㄠˋ"}, {"ja": "全然聞き取れない", "answer": "我根本聽不懂。", "zhuyin": "ㄨㄛˇ ㄍㄣ ㄅㄣˇ ㄊㄧㄥ ㄅㄨˋ ㄉㄨㄥˇ"}]},
  {"category": "意外", "pattern": "沒想到～", "zhuyin": "ㄇㄟˊ ㄒㄧㄤˇ ㄉㄠˋ", "meaning": "～とは思わなかった", "note": "意外だった時。", "example": "沒想到這麼難。", "exampleZhuyin": "ㄇㄟˊ ㄒㄧㄤˇ ㄉㄠˋ ㄓㄜˋ ㄇㄜ˙ ㄋㄢˊ", "tags": ["リアクション"], "prompts": [{"ja": "こんなに難しいとは思わなかった", "answer": "沒想到這麼難。", "zhuyin": "ㄇㄟˊ ㄒㄧㄤˇ ㄉㄠˋ ㄓㄜˋ ㄇㄜ˙ ㄋㄢˊ"}, {"ja": "こんなにおいしいとは思わなかった", "answer": "沒想到這麼好吃。", "zhuyin": "ㄇㄟˊ ㄒㄧㄤˇ ㄉㄠˋ ㄓㄜˋ ㄇㄜ˙ ㄏㄠˇ ㄔ"}]},
  {"category": "逆接", "pattern": "明明～，卻～", "zhuyin": "ㄇㄧㄥˊ ㄇㄧㄥˊ ～，ㄑㄩㄝˋ ～", "meaning": "明らかに～なのに、でも～", "note": "不満・ツッコミで使いやすい。", "example": "我明明記得，卻想不起來。", "exampleZhuyin": "ㄨㄛˇ ㄇㄧㄥˊ ㄇㄧㄥˊ ㄐㄧˋ ㄉㄜ˙，ㄑㄩㄝˋ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ", "tags": ["会話"], "prompts": [{"ja": "覚えてるはずなのに思い出せない", "answer": "我明明記得，卻想不起來。", "zhuyin": "ㄨㄛˇ ㄇㄧㄥˊ ㄇㄧㄥˊ ㄐㄧˋ ㄉㄜ˙，ㄑㄩㄝˋ ㄒㄧㄤˇ ㄅㄨˋ ㄑㄧˇ ㄌㄞˊ"}, {"ja": "明らかに眠いのに寝ない", "answer": "你明明很睏，卻不睡覺。", "zhuyin": "ㄋㄧˇ ㄇㄧㄥˊ ㄇㄧㄥˊ ㄏㄣˇ ㄎㄨㄣˋ，ㄑㄩㄝˋ ㄅㄨˊ ㄕㄨㄟˋ ㄐㄧㄠˋ"}]},
  {"category": "反問", "pattern": "不然呢？", "zhuyin": "ㄅㄨˋ ㄖㄢˊ ㄋㄜ˙", "meaning": "じゃあどうするの？／そうじゃなきゃ？", "note": "言い方によってツッコミ感が強い。", "example": "不然呢？", "exampleZhuyin": "ㄅㄨˋ ㄖㄢˊ ㄋㄜ˙", "tags": ["会話"], "prompts": [{"ja": "じゃあどうするの？", "answer": "不然呢？", "zhuyin": "ㄅㄨˋ ㄖㄢˊ ㄋㄜ˙"}, {"ja": "じゃなきゃ何？", "answer": "不然是什麼？", "zhuyin": "ㄅㄨˋ ㄖㄢˊ ㄕˋ ㄕㄣˊ ㄇㄜ˙"}]},
  {"category": "判断", "pattern": "看起來像～", "zhuyin": "ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄒㄧㄤˋ", "meaning": "～みたいに見える", "note": "看起來很好吃より少し具体的。", "example": "看起來像台灣人。", "exampleZhuyin": "ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄒㄧㄤˋ ㄊㄞˊ ㄨㄢ ㄖㄣˊ", "tags": ["感想"], "prompts": [{"ja": "台湾人みたいに見える", "answer": "看起來像台灣人。", "zhuyin": "ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄒㄧㄤˋ ㄊㄞˊ ㄨㄢ ㄖㄣˊ"}, {"ja": "おいしそうに見える", "answer": "看起來像很好吃。", "zhuyin": "ㄎㄢˋ ㄑㄧˇ ㄌㄞˊ ㄒㄧㄤˋ ㄏㄣˇ ㄏㄠˇ ㄔ"}]},
  {"category": "感想", "pattern": "聽起來～", "zhuyin": "ㄊㄧㄥ ㄑㄧˇ ㄌㄞˊ", "meaning": "聞いた感じ～", "note": "説明を聞いた感想に使う。", "example": "聽起來很不錯。", "exampleZhuyin": "ㄊㄧㄥ ㄑㄧˇ ㄌㄞˊ ㄏㄣˇ ㄅㄨˊ ㄘㄨㄛˋ", "tags": ["感想"], "prompts": [{"ja": "聞いた感じよさそう", "answer": "聽起來很不錯。", "zhuyin": "ㄊㄧㄥ ㄑㄧˇ ㄌㄞˊ ㄏㄣˇ ㄅㄨˊ ㄘㄨㄛˋ"}, {"ja": "聞いた感じ難しそう", "answer": "聽起來很難。", "zhuyin": "ㄊㄧㄥ ㄑㄧˇ ㄌㄞˊ ㄏㄣˇ ㄋㄢˊ"}]},
  {"category": "感想", "pattern": "感覺～", "zhuyin": "ㄍㄢˇ ㄐㄩㄝˊ", "meaning": "なんか～な感じがする", "note": "好像より体感寄り。", "example": "感覺快下雨了。", "exampleZhuyin": "ㄍㄢˇ ㄐㄩㄝˊ ㄎㄨㄞˋ ㄒㄧㄚˋ ㄩˇ ㄌㄜ˙", "tags": ["感想"], "prompts": [{"ja": "なんか雨が降りそう", "answer": "感覺快下雨了。", "zhuyin": "ㄍㄢˇ ㄐㄩㄝˊ ㄎㄨㄞˋ ㄒㄧㄚˋ ㄩˇ ㄌㄜ˙"}, {"ja": "なんかわかった気がする", "answer": "感覺我懂了。", "zhuyin": "ㄍㄢˇ ㄐㄩㄝˊ ㄨㄛˇ ㄉㄨㄥˇ ㄌㄜ˙"}]},
  {"category": "時間", "pattern": "等一下再～", "zhuyin": "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ ㄗㄞˋ", "meaning": "あとで／ちょっと待ってから～", "note": "再はこれからする行動。", "example": "等一下再說。", "exampleZhuyin": "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ ㄗㄞˋ ㄕㄨㄛ", "tags": ["会話", "又と再"], "prompts": [{"ja": "あとで言う", "answer": "等一下再說。", "zhuyin": "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ ㄗㄞˋ ㄕㄨㄛ"}, {"ja": "あとで見る", "answer": "等一下再看。", "zhuyin": "ㄉㄥˇ ㄧˊ ㄒㄧㄚˋ ㄗㄞˋ ㄎㄢˋ"}]},
  {"category": "時間", "pattern": "先～一下", "zhuyin": "ㄒㄧㄢ ～ ㄧˊ ㄒㄧㄚˋ", "meaning": "先にちょっと～する", "note": "とりあえず確認・試す時。", "example": "我先查一下。", "exampleZhuyin": "ㄨㄛˇ ㄒㄧㄢ ㄔㄚˊ ㄧˊ ㄒㄧㄚˋ", "tags": ["会話"], "prompts": [{"ja": "先にちょっと調べる", "answer": "我先查一下。", "zhuyin": "ㄨㄛˇ ㄒㄧㄢ ㄔㄚˊ ㄧˊ ㄒㄧㄚˋ"}, {"ja": "先にちょっと考える", "answer": "我先想一下。", "zhuyin": "ㄨㄛˇ ㄒㄧㄢ ㄒㄧㄤˇ ㄧˊ ㄒㄧㄚˋ"}]},
  {"category": "依頼", "pattern": "可以幫我～嗎？", "zhuyin": "ㄎㄜˇ ㄧˇ ㄅㄤ ㄨㄛˇ ～ ㄇㄚ˙", "meaning": "～してもらえますか", "note": "丁寧で使いやすいお願い。", "example": "可以幫我看一下嗎？", "exampleZhuyin": "ㄎㄜˇ ㄧˇ ㄅㄤ ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ ㄇㄚ˙", "tags": ["依頼"], "prompts": [{"ja": "ちょっと見てもらえますか", "answer": "可以幫我看一下嗎？", "zhuyin": "ㄎㄜˇ ㄧˇ ㄅㄤ ㄨㄛˇ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ ㄇㄚ˙"}, {"ja": "確認してもらえますか", "answer": "可以幫我確認一下嗎？", "zhuyin": "ㄎㄜˇ ㄧˇ ㄅㄤ ㄨㄛˇ ㄑㄩㄝˋ ㄖㄣˋ ㄧˊ ㄒㄧㄚˋ ㄇㄚ˙"}]},
  {"category": "注文", "pattern": "我要～，去冰／少冰", "zhuyin": "ㄨㄛˇ ㄧㄠˋ ～，ㄑㄩˋ ㄅㄧㄥ／ㄕㄠˇ ㄅㄧㄥ", "meaning": "～をください、氷なし／少なめで", "note": "台湾旅行の飲み物注文。", "example": "我要西瓜汁，去冰。", "exampleZhuyin": "ㄨㄛˇ ㄧㄠˋ ㄒㄧ ㄍㄨㄚ ㄓ，ㄑㄩˋ ㄅㄧㄥ", "tags": ["旅行", "注文"], "prompts": [{"ja": "西瓜ジュースをください、氷なしで", "answer": "我要西瓜汁，去冰。", "zhuyin": "ㄨㄛˇ ㄧㄠˋ ㄒㄧ ㄍㄨㄚ ㄓ，ㄑㄩˋ ㄅㄧㄥ"}, {"ja": "ミルクティーください、少冰で", "answer": "我要奶茶，少冰。", "zhuyin": "ㄨㄛˇ ㄧㄠˋ ㄋㄞˇ ㄔㄚˊ，ㄕㄠˇ ㄅㄧㄥ"}]},
  {"category": "注文", "pattern": "可以～多一點嗎？", "zhuyin": "ㄎㄜˇ ㄧˇ ～ ㄉㄨㄛ ㄧˋ ㄉㄧㄢˇ ㄇㄚ˙", "meaning": "～を多めにできますか", "note": "香菜多一點用。", "example": "香菜可以多一點嗎？", "exampleZhuyin": "ㄒㄧㄤ ㄘㄞˋ ㄎㄜˇ ㄧˇ ㄉㄨㄛ ㄧˋ ㄉㄧㄢˇ ㄇㄚ˙", "tags": ["旅行", "注文"], "prompts": [{"ja": "パクチー多めにできますか", "answer": "香菜可以多一點嗎？", "zhuyin": "ㄒㄧㄤ ㄘㄞˋ ㄎㄜˇ ㄧˇ ㄉㄨㄛ ㄧˋ ㄉㄧㄢˇ ㄇㄚ˙"}, {"ja": "辛さ少なめにできますか", "answer": "辣可以少一點嗎？", "zhuyin": "ㄌㄚˋ ㄎㄜˇ ㄧˇ ㄕㄠˇ ㄧˋ ㄉㄧㄢˇ ㄇㄚ˙"}]},
  {"category": "確認", "pattern": "這樣可以嗎？", "zhuyin": "ㄓㄜˋ ㄧㄤˋ ㄎㄜˇ ㄧˇ ㄇㄚ˙", "meaning": "これで大丈夫？", "note": "提出・確認・作業で超便利。", "example": "這樣可以嗎？", "exampleZhuyin": "ㄓㄜˋ ㄧㄤˋ ㄎㄜˇ ㄧˇ ㄇㄚ˙", "tags": ["会話"], "prompts": [{"ja": "これで大丈夫？", "answer": "這樣可以嗎？", "zhuyin": "ㄓㄜˋ ㄧㄤˋ ㄎㄜˇ ㄧˇ ㄇㄚ˙"}, {"ja": "こう言えば大丈夫？", "answer": "這樣說可以嗎？", "zhuyin": "ㄓㄜˋ ㄧㄤˋ ㄕㄨㄛ ㄎㄜˇ ㄧˇ ㄇㄚ˙"}]},
  {"category": "確認", "pattern": "這樣不錯耶", "zhuyin": "ㄓㄜˋ ㄧㄤˋ ㄅㄨˊ ㄘㄨㄛˋ ㄧㄝ", "meaning": "これいい感じだね", "note": "今まさに使った表現。", "example": "這樣不錯耶！", "exampleZhuyin": "ㄓㄜˋ ㄧㄤˋ ㄅㄨˊ ㄘㄨㄛˋ ㄧㄝ", "tags": ["会話"], "prompts": [{"ja": "これいい感じだね", "answer": "這樣不錯耶！", "zhuyin": "ㄓㄜˋ ㄧㄤˋ ㄅㄨˊ ㄘㄨㄛˋ ㄧㄝ"}, {"ja": "この方法いい感じだね", "answer": "這個方法不錯耶！", "zhuyin": "ㄓㄜˋ ㄍㄜ˙ ㄈㄤ ㄈㄚˇ ㄅㄨˊ ㄘㄨㄛˋ ㄧㄝ"}]},
  {"category": "仕事", "pattern": "我今天又要～", "zhuyin": "ㄨㄛˇ ㄐㄧㄣ ㄊㄧㄢ ㄧㄡˋ ㄧㄠˋ", "meaning": "今日また～しなきゃ", "note": "又＋要で『またか…』感。", "example": "我今天又要加班。", "exampleZhuyin": "ㄨㄛˇ ㄐㄧㄣ ㄊㄧㄢ ㄧㄡˋ ㄧㄠˋ ㄐㄧㄚ ㄅㄢ", "tags": ["仕事", "又と再"], "prompts": [{"ja": "今日また残業しなきゃ", "answer": "我今天又要加班。", "zhuyin": "ㄨㄛˇ ㄐㄧㄣ ㄊㄧㄢ ㄧㄡˋ ㄧㄠˋ ㄐㄧㄚ ㄅㄢ"}, {"ja": "今日また出社しなきゃ", "answer": "我今天又要上班。", "zhuyin": "ㄨㄛˇ ㄐㄧㄣ ㄊㄧㄢ ㄧㄡˋ ㄧㄠˋ ㄕㄤˋ ㄅㄢ"}]},
  {"category": "体調", "pattern": "我一直～", "zhuyin": "ㄨㄛˇ ㄧˋ ㄓˊ", "meaning": "ずっと～している", "note": "鼻水・眠い・忙しいなど。", "example": "我一直流鼻水。", "exampleZhuyin": "ㄨㄛˇ ㄧˋ ㄓˊ ㄌㄧㄡˊ ㄅㄧˊ ㄕㄨㄟˇ", "tags": ["体調", "会話"], "prompts": [{"ja": "ずっと鼻水が出てる", "answer": "我一直流鼻水。", "zhuyin": "ㄨㄛˇ ㄧˋ ㄓˊ ㄌㄧㄡˊ ㄅㄧˊ ㄕㄨㄟˇ"}, {"ja": "ずっと眠い", "answer": "我一直很睏。", "zhuyin": "ㄨㄛˇ ㄧˋ ㄓˊ ㄏㄣˇ ㄎㄨㄣˋ"}]},
  {"category": "学習", "pattern": "我還沒完全～", "zhuyin": "ㄨㄛˇ ㄏㄞˊ ㄇㄟˊ ㄨㄢˊ ㄑㄩㄢˊ", "meaning": "まだ完全には～していない", "note": "懂・記住・習慣などと相性よし。", "example": "我還沒完全懂。", "exampleZhuyin": "ㄨㄛˇ ㄏㄞˊ ㄇㄟˊ ㄨㄢˊ ㄑㄩㄢˊ ㄉㄨㄥˇ", "tags": ["学習"], "prompts": [{"ja": "まだ完全にはわかってない", "answer": "我還沒完全懂。", "zhuyin": "ㄨㄛˇ ㄏㄞˊ ㄇㄟˊ ㄨㄢˊ ㄑㄩㄢˊ ㄉㄨㄥˇ"}, {"ja": "まだ完全には覚えてない", "answer": "我還沒完全記住。", "zhuyin": "ㄨㄛˇ ㄏㄞˊ ㄇㄟˊ ㄨㄢˊ ㄑㄩㄢˊ ㄐㄧˋ ㄓㄨˋ"}]},
  {"category": "学習", "pattern": "我只是剛剛看過", "zhuyin": "ㄨㄛˇ ㄓˇ ㄕˋ ㄍㄤ ㄍㄤ ㄎㄢˋ ㄍㄨㄛˋ", "meaning": "さっき見ただけ", "note": "短期記憶で当たる問題そのもの。", "example": "我只是剛剛看過，不是真的會了。", "exampleZhuyin": "ㄨㄛˇ ㄓˇ ㄕˋ ㄍㄤ ㄍㄤ ㄎㄢˋ ㄍㄨㄛˋ，ㄅㄨˋ ㄕˋ ㄓㄣ ㄉㄜ˙ ㄏㄨㄟˋ ㄌㄜ˙", "tags": ["学習"], "prompts": [{"ja": "さっき見ただけで、本当にできるわけじゃない", "answer": "我只是剛剛看過，不是真的會了。", "zhuyin": "ㄨㄛˇ ㄓˇ ㄕˋ ㄍㄤ ㄍㄤ ㄎㄢˋ ㄍㄨㄛˋ，ㄅㄨˋ ㄕˋ ㄓㄣ ㄉㄜ˙ ㄏㄨㄟˋ ㄌㄜ˙"}, {"ja": "これは短期記憶だけだ", "answer": "這只是短期記憶。", "zhuyin": "ㄓㄜˋ ㄓˇ ㄕˋ ㄉㄨㄢˇ ㄑㄧˊ ㄐㄧˋ ㄧˋ"}]},
  {category:"時間", pattern:"一～就～", zhuyin:"ㄧˊ ～ ㄐㄧㄡˋ ～", meaning:"～するとすぐ～", note:"動作Aのあと、すぐBする。『一下班就想睡覺』みたいに日常でかなり使える。", example:"我一下班就想睡覺。", exampleZhuyin:"ㄨㄛˇ ㄧˊ ㄒㄧㄚˋ ㄅㄢ ㄐㄧㄡˋ ㄒㄧㄤˇ ㄕㄨㄟˋ ㄐㄧㄠˋ", tags:["接続詞","Sランク","日常"], prompts:[{ja:"仕事が終わるとすぐ眠くなる",answer:"我一下班就想睡覺。",zhuyin:"ㄨㄛˇ ㄧˊ ㄒㄧㄚˋ ㄅㄢ ㄐㄧㄡˋ ㄒㄧㄤˇ ㄕㄨㄟˋ ㄐㄧㄠˋ"},{ja:"家に着いたらすぐご飯を食べる",answer:"我一到家就吃飯。",zhuyin:"ㄨㄛˇ ㄧˊ ㄉㄠˋ ㄐㄧㄚ ㄐㄧㄡˋ ㄔ ㄈㄢˋ"},{ja:"起きたらすぐスマホを見る",answer:"我一起床就看手機。",zhuyin:"ㄨㄛˇ ㄧˋ ㄑㄧˇ ㄔㄨㄤˊ ㄐㄧㄡˋ ㄎㄢˋ ㄕㄡˇ ㄐㄧ"}]},
  {category:"範囲", pattern:"除了～以外～", zhuyin:"ㄔㄨˊ ㄌㄜ˙ ～ ㄧˇ ㄨㄞˋ ～", meaning:"～以外／～のほかに", note:"『～以外は全部』『～のほかにも』の両方で使える。都・也とセットになりやすい。", example:"除了香菜以外，我不挑食。", exampleZhuyin:"ㄔㄨˊ ㄌㄜ˙ ㄒㄧㄤ ㄘㄞˋ ㄧˇ ㄨㄞˋ，ㄨㄛˇ ㄅㄨˋ ㄊㄧㄠ ㄕˊ", tags:["接続詞","範囲","旅行"], prompts:[{ja:"パクチー以外は好き嫌いしない",answer:"除了香菜以外，我不挑食。",zhuyin:"ㄔㄨˊ ㄌㄜ˙ ㄒㄧㄤ ㄘㄞˋ ㄧˇ ㄨㄞˋ，ㄨㄛˇ ㄅㄨˋ ㄊㄧㄠ ㄕˊ"},{ja:"彼以外みんな来た",answer:"除了他以外，大家都來了。",zhuyin:"ㄔㄨˊ ㄌㄜ˙ ㄊㄚ ㄧˇ ㄨㄞˋ，ㄉㄚˋ ㄐㄧㄚ ㄉㄡ ㄌㄞˊ ㄌㄜ˙"},{ja:"中国語以外に台湾語も少し聞きたい",answer:"除了中文以外，我也想聽一點台語。",zhuyin:"ㄔㄨˊ ㄌㄜ˙ ㄓㄨㄥ ㄨㄣˊ ㄧˇ ㄨㄞˋ，ㄨㄛˇ ㄧㄝˇ ㄒㄧㄤˇ ㄊㄧㄥ ㄧˋ ㄉㄧㄢˇ ㄊㄞˊ ㄩˇ"}]},
  {category:"並列", pattern:"又～又～", zhuyin:"ㄧㄡˋ ～ ㄧㄡˋ ～", meaning:"～でもあり、～でもある／～くて～", note:"形容詞を2つ並べる時に便利。『又熱又濕』は台湾の天気で使いやすい。", example:"今天又熱又濕。", exampleZhuyin:"ㄐㄧㄣ ㄊㄧㄢ ㄧㄡˋ ㄖㄜˋ ㄧㄡˋ ㄕ", tags:["接続詞","日常","天氣"], prompts:[{ja:"今日は暑くて蒸し蒸ししている",answer:"今天又熱又濕。",zhuyin:"ㄐㄧㄣ ㄊㄧㄢ ㄧㄡˋ ㄖㄜˋ ㄧㄡˋ ㄕ"},{ja:"彼は忙しくて疲れている",answer:"他又忙又累。",zhuyin:"ㄊㄚ ㄧㄡˋ ㄇㄤˊ ㄧㄡˋ ㄌㄟˋ"},{ja:"この豆花は安くておいしい",answer:"這個豆花又便宜又好吃。",zhuyin:"ㄓㄜˋ ㄍㄜ˙ ㄉㄡˋ ㄏㄨㄚ ㄧㄡˋ ㄆㄧㄢˊ ㄧˊ ㄧㄡˋ ㄏㄠˇ ㄔ"}]},
  {category:"追加", pattern:"不但～而且～", zhuyin:"ㄅㄨˋ ㄉㄢˋ ～ ㄦˊ ㄑㄧㄝˇ ～", meaning:"～だけでなく、さらに～", note:"少し説明っぽく言いたい時に使える。口語なら『不只～也～』も自然。", example:"她不但會說中文，而且會說日文。", exampleZhuyin:"ㄊㄚ ㄅㄨˋ ㄉㄢˋ ㄏㄨㄟˋ ㄕㄨㄛ ㄓㄨㄥ ㄨㄣˊ，ㄦˊ ㄑㄧㄝˇ ㄏㄨㄟˋ ㄕㄨㄛ ㄖˋ ㄨㄣˊ", tags:["接続詞","説明"], prompts:[{ja:"彼女は中国語だけでなく日本語も話せる",answer:"她不但會說中文，而且會說日文。",zhuyin:"ㄊㄚ ㄅㄨˋ ㄉㄢˋ ㄏㄨㄟˋ ㄕㄨㄛ ㄓㄨㄥ ㄨㄣˊ，ㄦˊ ㄑㄧㄝˇ ㄏㄨㄟˋ ㄕㄨㄛ ㄖˋ ㄨㄣˊ"},{ja:"この店は安いだけでなく、おいしい",answer:"這家店不但便宜，而且很好吃。",zhuyin:"ㄓㄜˋ ㄐㄧㄚ ㄉㄧㄢˋ ㄅㄨˋ ㄉㄢˋ ㄆㄧㄢˊ ㄧˊ，ㄦˊ ㄑㄧㄝˇ ㄏㄣˇ ㄏㄠˇ ㄔ"},{ja:"台湾華語は難しいだけでなく、面白い",answer:"台灣華語不但很難，而且很好玩。",zhuyin:"ㄊㄞˊ ㄨㄢ ㄏㄨㄚˊ ㄩˇ ㄅㄨˋ ㄉㄢˋ ㄏㄣˇ ㄋㄢˊ，ㄦˊ ㄑㄧㄝˇ ㄏㄣˇ ㄏㄠˇ ㄨㄢˊ"}]},
  {category:"条件", pattern:"不管～都～", zhuyin:"ㄅㄨˋ ㄍㄨㄢˇ ～ ㄉㄡ ～", meaning:"～でも、どんなに～でも", note:"条件が変わっても結果は同じ、という感じ。『不管多忙，我都想學中文』があゆあん向き。", example:"不管多忙，我都想學中文。", exampleZhuyin:"ㄅㄨˋ ㄍㄨㄢˇ ㄉㄨㄛ ㄇㄤˊ，ㄨㄛˇ ㄉㄡ ㄒㄧㄤˇ ㄒㄩㄝˊ ㄓㄨㄥ ㄨㄣˊ", tags:["接続詞","条件","学習"], prompts:[{ja:"どんなに忙しくても中国語を勉強したい",answer:"不管多忙，我都想學中文。",zhuyin:"ㄅㄨˋ ㄍㄨㄢˇ ㄉㄨㄛ ㄇㄤˊ，ㄨㄛˇ ㄉㄡ ㄒㄧㄤˇ ㄒㄩㄝˊ ㄓㄨㄥ ㄨㄣˊ"},{ja:"雨でも行きたい",answer:"不管下不下雨，我都想去。",zhuyin:"ㄅㄨˋ ㄍㄨㄢˇ ㄒㄧㄚˋ ㄅㄨˊ ㄒㄧㄚˋ ㄩˇ，ㄨㄛˇ ㄉㄡ ㄒㄧㄤˇ ㄑㄩˋ"},{ja:"何を食べてもパクチーを入れたい",answer:"不管吃什麼，我都想加香菜。",zhuyin:"ㄅㄨˋ ㄍㄨㄢˇ ㄔ ㄕㄣˊ ㄇㄜ˙，ㄨㄛˇ ㄉㄡ ㄒㄧㄤˇ ㄐㄧㄚ ㄒㄧㄤ ㄘㄞˋ"}]},
  {category:"訂正", pattern:"不是～而是～", zhuyin:"ㄅㄨˊ ㄕˋ ～ ㄦˊ ㄕˋ ～", meaning:"～ではなく、～だ", note:"言い間違い・誤解の訂正に便利。『不是A，是B』より少しきれいに対比する感じ。", example:"這不是咖啡，而是奶茶。", exampleZhuyin:"ㄓㄜˋ ㄅㄨˊ ㄕˋ ㄎㄚ ㄈㄟ，ㄦˊ ㄕˋ ㄋㄞˇ ㄔㄚˊ", tags:["接続詞","訂正","会話"], prompts:[{ja:"これはコーヒーではなくミルクティーだ",answer:"這不是咖啡，而是奶茶。",zhuyin:"ㄓㄜˋ ㄅㄨˊ ㄕˋ ㄎㄚ ㄈㄟ，ㄦˊ ㄕˋ ㄋㄞˇ ㄔㄚˊ"},{ja:"私は中国語が嫌いなのではなく、まだ慣れていないだけ",answer:"我不是討厭中文，而是還不習慣。",zhuyin:"ㄨㄛˇ ㄅㄨˊ ㄕˋ ㄊㄠˇ ㄧㄢˋ ㄓㄨㄥ ㄨㄣˊ，ㄦˊ ㄕˋ ㄏㄞˊ ㄅㄨˋ ㄒㄧˊ ㄍㄨㄢˋ"},{ja:"これは間違いではなく、台湾の言い方だ",answer:"這不是錯，而是台灣的說法。",zhuyin:"ㄓㄜˋ ㄅㄨˊ ㄕˋ ㄘㄨㄛˋ，ㄦˊ ㄕˋ ㄊㄞˊ ㄨㄢ ㄉㄜ˙ ㄕㄨㄛ ㄈㄚˇ"}]}

];


const v54Patterns = [
  {
    "category": "強調",
    "pattern": "就是要～",
    "zhuyin": "ㄐㄧㄡˋ ㄕˋ ㄧㄠˋ ～",
    "meaning": "まさに～するもの／～こそするべき",
    "note": "その店・物の定番や醍醐味を強調する。",
    "example": "這家就是要吃芋泥火山冰。",
    "exampleZhuyin": "ㄓㄜˋ ㄐㄧㄚ ㄐㄧㄡˋ ㄕˋ ㄧㄠˋ ㄔ ㄩˋ ㄋㄧˊ ㄏㄨㄛˇ ㄕㄢ ㄅㄧㄥ",
    "tags": [
      "型候補",
      "台湾人よく使う"
    ],
    "prompts": [
      {
        "ja": "この店ではタロイモ火山かき氷を食べるべき",
        "answer": "這家就是要吃芋泥火山冰。",
        "zhuyin": "ㄓㄜˋ ㄐㄧㄚ ㄐㄧㄡˋ ㄕˋ ㄧㄠˋ ㄔ ㄩˋ ㄋㄧˊ ㄏㄨㄛˇ ㄕㄢ ㄅㄧㄥ"
      }
    ]
  },
  {
    "category": "比例",
    "pattern": "越～越～",
    "zhuyin": "ㄩㄝˋ ～ ㄩㄝˋ ～",
    "meaning": "～すればするほど～",
    "note": "程度が一緒に変化する。",
    "example": "中文越說越自然。",
    "exampleZhuyin": "ㄓㄨㄥ ㄨㄣˊ ㄩㄝˋ ㄕㄨㄛ ㄩㄝˋ ㄗˋ ㄖㄢˊ",
    "tags": [
      "型候補",
      "Sランク"
    ],
    "prompts": [
      {
        "ja": "中国語は話せば話すほど自然になる",
        "answer": "中文越說越自然。",
        "zhuyin": "ㄓㄨㄥ ㄨㄣˊ ㄩㄝˋ ㄕㄨㄛ ㄩㄝˋ ㄗˋ ㄖㄢˊ"
      },
      {
        "ja": "パクチーは多ければ多いほどいい",
        "answer": "香菜越多越好。",
        "zhuyin": "ㄒㄧㄤ ㄘㄞˋ ㄩㄝˋ ㄉㄨㄛ ㄩㄝˋ ㄏㄠˇ"
      }
    ]
  },
  {
    "category": "提案",
    "pattern": "不就～嗎？",
    "zhuyin": "ㄅㄨˋ ㄐㄧㄡˋ ～ ㄇㄚ˙",
    "meaning": "～すればいいじゃない？",
    "note": "答えは簡単じゃん、という反語。",
    "example": "吃蛋糕不就好了嗎？",
    "exampleZhuyin": "ㄔ ㄉㄢˋ ㄍㄠ ㄅㄨˋ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙ ㄇㄚ˙",
    "tags": [
      "型候補",
      "会話"
    ],
    "prompts": [
      {
        "ja": "ケーキを食べればいいじゃない？",
        "answer": "吃蛋糕不就好了嗎？",
        "zhuyin": "ㄔ ㄉㄢˋ ㄍㄠ ㄅㄨˋ ㄐㄧㄡˋ ㄏㄠˇ ㄌㄜ˙ ㄇㄚ˙"
      }
    ]
  },
  {
    "category": "譲歩",
    "pattern": "就算～也～",
    "zhuyin": "ㄐㄧㄡˋ ㄙㄨㄢˋ ～ ㄧㄝˇ ～",
    "meaning": "たとえ～でも～",
    "note": "仮定した不利な条件でも結果は変わらない。",
    "example": "就算下雨，我也想去。",
    "exampleZhuyin": "ㄐㄧㄡˋ ㄙㄨㄢˋ ㄒㄧㄚˋ ㄩˇ，ㄨㄛˇ ㄧㄝˇ ㄒㄧㄤˇ ㄑㄩˋ",
    "tags": [
      "型候補",
      "接続詞"
    ],
    "prompts": [
      {
        "ja": "たとえ雨でも行きたい",
        "answer": "就算下雨，我也想去。",
        "zhuyin": "ㄐㄧㄡˋ ㄙㄨㄢˋ ㄒㄧㄚˋ ㄩˇ，ㄨㄛˇ ㄧㄝˇ ㄒㄧㄤˇ ㄑㄩˋ"
      }
    ]
  },
  {
    "category": "選択",
    "pattern": "寧願A，也不願B",
    "zhuyin": "ㄋㄧㄥˊ ㄩㄢˋ A，ㄧㄝˇ ㄅㄨˋ ㄩㄢˋ B",
    "meaning": "BするくらいならAするほうがいい",
    "note": "好みや強い選択を表す。",
    "example": "我寧願走路，也不願排隊。",
    "exampleZhuyin": "ㄨㄛˇ ㄋㄧㄥˊ ㄩㄢˋ ㄗㄡˇ ㄌㄨˋ，ㄧㄝˇ ㄅㄨˋ ㄩㄢˋ ㄆㄞˊ ㄉㄨㄟˋ",
    "tags": [
      "型候補",
      "選択"
    ],
    "prompts": [
      {
        "ja": "並ぶくらいなら歩くほうがいい",
        "answer": "我寧願走路，也不願排隊。",
        "zhuyin": "ㄨㄛˇ ㄋㄧㄥˊ ㄩㄢˋ ㄗㄡˇ ㄌㄨˋ，ㄧㄝˇ ㄅㄨˋ ㄩㄢˋ ㄆㄞˊ ㄉㄨㄟˋ"
      }
    ]
  },
  {
    "category": "理由",
    "pattern": "因為～所以～",
    "zhuyin": "ㄧㄣ ㄨㄟˋ ～ ㄙㄨㄛˇ ㄧˇ ～",
    "meaning": "～なので～",
    "note": "理由から結果へ。口語では所以が省略されることもある。",
    "example": "因為香菜很貴，所以他自己種。",
    "exampleZhuyin": "ㄧㄣ ㄨㄟˋ ㄒㄧㄤ ㄘㄞˋ ㄏㄣˇ ㄍㄨㄟˋ，ㄙㄨㄛˇ ㄧˇ ㄊㄚ ㄗˋ ㄐㄧˇ ㄓㄨㄥˋ",
    "tags": [
      "型候補",
      "接続詞"
    ],
    "prompts": [
      {
        "ja": "パクチーが高いので、彼は自分で育てている",
        "answer": "因為香菜很貴，所以他自己種。",
        "zhuyin": "ㄧㄣ ㄨㄟˋ ㄒㄧㄤ ㄘㄞˋ ㄏㄣˇ ㄍㄨㄟˋ，ㄙㄨㄛˇ ㄧˇ ㄊㄚ ㄗˋ ㄐㄧˇ ㄓㄨㄥˋ"
      }
    ]
  },
  {
    "category": "条件",
    "pattern": "如果～就～",
    "zhuyin": "ㄖㄨˊ ㄍㄨㄛˇ ～ ㄐㄧㄡˋ ～",
    "meaning": "もし～なら～",
    "note": "仮定から自然な結果へ。",
    "example": "如果有時間，就看一下。",
    "exampleZhuyin": "ㄖㄨˊ ㄍㄨㄛˇ ㄧㄡˇ ㄕˊ ㄐㄧㄢ，ㄐㄧㄡˋ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ",
    "tags": [
      "型候補",
      "Sランク"
    ],
    "prompts": [
      {
        "ja": "時間があればちょっと見る",
        "answer": "如果有時間，就看一下。",
        "zhuyin": "ㄖㄨˊ ㄍㄨㄛˇ ㄧㄡˇ ㄕˊ ㄐㄧㄢ，ㄐㄧㄡˋ ㄎㄢˋ ㄧˊ ㄒㄧㄚˋ"
      }
    ]
  }
];
for (const item of v54Patterns) { if (!patterns.some(p => p.pattern === item.pattern)) patterns.push(item); }


const v55Patterns = [
  {category:"結果", pattern:"害我＋（結果）", zhuyin:"ㄏㄞˋ ㄨㄛˇ", meaning:"そのせいで私は～になった／～してしまった", note:"相手や出来事が原因で、自分に困った結果が起きた時。軽い文句にも使える。", example:"你害我嚇一跳。", exampleZhuyin:"ㄋㄧˇ ㄏㄞˋ ㄨㄛˇ ㄒㄧㄚˋ ㄧˊ ㄊㄧㄠˋ", tags:["会話","結果"], prompts:[{ja:"びっくりさせられた",answer:"你害我嚇一跳。",zhuyin:"ㄋㄧˇ ㄏㄞˋ ㄨㄛˇ ㄒㄧㄚˋ ㄧˊ ㄊㄧㄠˋ"},{ja:"そのせいで遅刻した",answer:"害我遲到了。",zhuyin:"ㄏㄞˋ ㄨㄛˇ ㄔˊ ㄉㄠˋ ㄌㄜ˙"}]},
  {category:"強調", pattern:"光是～就～", zhuyin:"ㄍㄨㄤ ㄕˋ ～ ㄐㄧㄡˋ ～", meaning:"～だけで、もう～", note:"一つのことだけでも十分その結果になる、と強調する。", example:"光是上班就滿身都是汗。", exampleZhuyin:"ㄍㄨㄤ ㄕˋ ㄕㄤˋ ㄅㄢ ㄐㄧㄡˋ ㄇㄢˇ ㄕㄣ ㄉㄡ ㄕˋ ㄏㄢˋ", tags:["会話","強調"], prompts:[{ja:"出勤だけで汗だく",answer:"光是上班就滿身都是汗。",zhuyin:"ㄍㄨㄤ ㄕˋ ㄕㄤˋ ㄅㄢ ㄐㄧㄡˋ ㄇㄢˇ ㄕㄣ ㄉㄡ ㄕˋ ㄏㄢˋ"}]},
  {category:"変化", pattern:"V著V著，就～", zhuyin:"V ㄓㄜ˙ V ㄓㄜ˙，ㄐㄧㄡˋ ～", meaning:"～しているうちに、（自然に）～した", note:"動作を続けるうちに、結果が自然に起きた時。", example:"看著看著，就睡著了。", exampleZhuyin:"ㄎㄢˋ ㄓㄜ˙ ㄎㄢˋ ㄓㄜ˙，ㄐㄧㄡˋ ㄕㄨㄟˋ ㄓㄠˊ ㄌㄜ˙", tags:["時間","変化"], prompts:[{ja:"見ているうちに寝ちゃった",answer:"看著看著，就睡著了。",zhuyin:"ㄎㄢˋ ㄓㄜ˙ ㄎㄢˋ ㄓㄜ˙，ㄐㄧㄡˋ ㄕㄨㄟˋ ㄓㄠˊ ㄌㄜ˙"}]},
  {category:"発見", pattern:"V著V著，才～", zhuyin:"V ㄓㄜ˙ V ㄓㄜ˙，ㄘㄞˊ ～", meaning:"～しているうちに、そこで初めて～した", note:"続けている途中で、遅れて気づいたり発見したりした時。", example:"寫著寫著，我才發現去年也寫過。", exampleZhuyin:"ㄒㄧㄝˇ ㄓㄜ˙ ㄒㄧㄝˇ ㄓㄜ˙，ㄨㄛˇ ㄘㄞˊ ㄈㄚ ㄒㄧㄢˋ ㄑㄩˋ ㄋㄧㄢˊ ㄧㄝˇ ㄒㄧㄝˇ ㄍㄨㄛˋ", tags:["時間","発見"], prompts:[{ja:"書いているうちに去年も書いたと気づいた",answer:"寫著寫著，我才發現去年也寫過。",zhuyin:"ㄒㄧㄝˇ ㄓㄜ˙ ㄒㄧㄝˇ ㄓㄜ˙，ㄨㄛˇ ㄘㄞˊ ㄈㄚ ㄒㄧㄢˋ ㄑㄩˋ ㄋㄧㄢˊ ㄧㄝˇ ㄒㄧㄝˇ ㄍㄨㄛˋ"}]},
  {category:"補足", pattern:"～就是了", zhuyin:"～ ㄐㄧㄡˋ ㄕˋ ㄌㄜ˙", meaning:"もっとも～だけど／ただ～というだけ", note:"前の内容に軽く補足や限定を加える。台湾の会話でも自然。", example:"去年也很熱，只是更早就是了。", exampleZhuyin:"ㄑㄩˋ ㄋㄧㄢˊ ㄧㄝˇ ㄏㄣˇ ㄖㄜˋ，ㄓˇ ㄕˋ ㄍㄥˋ ㄗㄠˇ ㄐㄧㄡˋ ㄕˋ ㄌㄜ˙", tags:["補足","会話"], prompts:[{ja:"もっとも去年はもっと早かったけど",answer:"不過去年更早就是了。",zhuyin:"ㄅㄨˋ ㄍㄨㄛˋ ㄑㄩˋ ㄋㄧㄢˊ ㄍㄥˋ ㄗㄠˇ ㄐㄧㄡˋ ㄕˋ ㄌㄜ˙"}]},
  {category:"推量", pattern:"不知道是不是…", zhuyin:"ㄅㄨˋ ㄓ ㄉㄠˋ ㄕˋ ㄅㄨˊ ㄕˋ", meaning:"～なのかな／～かどうかわからない", note:"断定せず、原因や可能性をやわらかく考える言い方。", example:"不知道是不是最近太累了。", exampleZhuyin:"ㄅㄨˋ ㄓ ㄉㄠˋ ㄕˋ ㄅㄨˊ ㄕˋ ㄗㄨㄟˋ ㄐㄧㄣˋ ㄊㄞˋ ㄌㄟˋ ㄌㄜ˙", tags:["推量","会話"], prompts:[{ja:"最近疲れすぎなのかな",answer:"不知道是不是最近太累了。",zhuyin:"ㄅㄨˋ ㄓ ㄉㄠˋ ㄕˋ ㄅㄨˊ ㄕˋ ㄗㄨㄟˋ ㄐㄧㄣˋ ㄊㄞˋ ㄌㄟˋ ㄌㄜ˙"}]},
  {category:"感覚", pattern:"總覺得…", zhuyin:"ㄗㄨㄥˇ ㄐㄩㄝˊ ㄉㄜ˙", meaning:"なんとなく～な気がする", note:"はっきりした根拠はないけれど、ずっとそんな感じがする時。", example:"總覺得今天比昨天更熱。", exampleZhuyin:"ㄗㄨㄥˇ ㄐㄩㄝˊ ㄉㄜ˙ ㄐㄧㄣ ㄊㄧㄢ ㄅㄧˇ ㄗㄨㄛˊ ㄊㄧㄢ ㄍㄥˋ ㄖㄜˋ", tags:["感覚","会話"], prompts:[{ja:"なんとなく今日は昨日より暑い気がする",answer:"總覺得今天比昨天更熱。",zhuyin:"ㄗㄨㄥˇ ㄐㄩㄝˊ ㄉㄜ˙ ㄐㄧㄣ ㄊㄧㄢ ㄅㄧˇ ㄗㄨㄛˊ ㄊㄧㄢ ㄍㄥˋ ㄖㄜˋ"}]}
];
for (const item of v55Patterns) { if (!patterns.some(p => p.pattern === item.pattern)) patterns.push(item); }

const compositionPrompts = patterns.flatMap(p => p.prompts.map(q => ({...q, type:"pattern", source:p.pattern, category:p.category})));

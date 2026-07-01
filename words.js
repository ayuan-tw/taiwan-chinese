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
  {category:"会話", pattern:"真的假的？", zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙", meaning:"ほんとに？まじで？", note:"かなり口語。驚いた時に便利。", example:"真的假的？太誇張了吧！", exampleZhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙？ㄊㄞˋ ㄎㄨㄚ ㄓㄤ ㄌㄜ˙ ㄅㄚ˙", tags:["台湾人よく使う","会話"], prompts:[{ja:"ほんとに？",answer:"真的假的？",zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙"},{ja:"まじで？すごすぎる",answer:"真的假的？太厲害了吧！",zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙？ㄊㄞˋ ㄌㄧˋ ㄏㄞˋ ㄌㄜ˙ ㄅㄚ˙"},{ja:"ほんとに？誰もいないの？",answer:"真的假的？沒有人嗎？",zhuyin:"ㄓㄣ ㄉㄜ˙ ㄐㄧㄚˇ ㄉㄜ˙？ㄇㄟˊ ㄧㄡˇ ㄖㄣˊ ㄇㄚ˙"}]}
];

const compositionPrompts = patterns.flatMap(p => p.prompts.map(q => ({...q, type:"pattern", source:p.pattern, category:p.category})));

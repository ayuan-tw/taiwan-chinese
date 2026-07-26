# override.json 書式

```json
{
  "schemaVersion": 1,
  "words": [{"word":"晚點","zhuyin":"ㄨㄢˇ ㄉㄧㄢˇ","meaning":"あとで"}],
  "patterns": [],
  "idioms": [],
  "phrases": []
}
```

照合キー：wordsは`word`、patternsは`pattern`、idiomsとphrasesは`text`。
同じキーが基本辞書にあれば項目を上書きし、なければ追加します。

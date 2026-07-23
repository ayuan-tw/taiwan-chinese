// Ver.5.5 zhuyin-lite: 澄詞の登録データを優先して、入力文の注音を簡易表示する小さな変換器
(function(){
  const manualCharMap={
    "我":"ㄨㄛˇ","你":"ㄋㄧˇ","他":"ㄊㄚ","她":"ㄊㄚ","們":"ㄇㄣ˙","的":"ㄉㄜ˙","了":"ㄌㄜ˙","嗎":"ㄇㄚ˙","呢":"ㄋㄜ˙","吧":"ㄅㄚ˙","啊":"ㄚ","喔":"ㄛ","啦":"ㄌㄚ˙","耶":"ㄧㄝ",
    "是":"ㄕˋ","不":"ㄅㄨˋ","沒":"ㄇㄟˊ","有":"ㄧㄡˇ","在":"ㄗㄞˋ","會":"ㄏㄨㄟˋ","要":"ㄧㄠˋ","想":"ㄒㄧㄤˇ","可":"ㄎㄜˇ","以":"ㄧˇ","能":"ㄋㄥˊ","就":"ㄐㄧㄡˋ","都":"ㄉㄡ","也":"ㄧㄝˇ","還":"ㄏㄞˊ","很":"ㄏㄣˇ","太":"ㄊㄞˋ","最":"ㄗㄨㄟˋ","超":"ㄔㄠ","更":"ㄍㄥˋ","再":"ㄗㄞˋ","又":"ㄧㄡˋ","先":"ㄒㄧㄢ","只":"ㄓˇ","才":"ㄘㄞˊ","跟":"ㄍㄣ","和":"ㄏㄢˋ","或":"ㄏㄨㄛˋ","把":"ㄅㄚˇ","被":"ㄅㄟˋ","給":"ㄍㄟˇ","對":"ㄉㄨㄟˋ","因":"ㄧㄣ","為":"ㄨㄟˋ","所":"ㄙㄨㄛˇ","雖":"ㄙㄨㄟ","然":"ㄖㄢˊ","但":"ㄉㄢˋ","如":"ㄖㄨˊ","果":"ㄍㄨㄛˇ","跟":"ㄍㄣ",
    "好":"ㄏㄠˇ","壞":"ㄏㄨㄞˋ","大":"ㄉㄚˋ","小":"ㄒㄧㄠˇ","多":"ㄉㄨㄛ","少":"ㄕㄠˇ","高":"ㄍㄠ","低":"ㄉㄧ","快":"ㄎㄨㄞˋ","慢":"ㄇㄢˋ","早":"ㄗㄠˇ","晚":"ㄨㄢˇ","忙":"ㄇㄤˊ","累":"ㄌㄟˋ","睏":"ㄎㄨㄣˋ","熱":"ㄖㄜˋ","冷":"ㄌㄥˇ","涼":"ㄌㄧㄤˊ","餓":"ㄜˋ","飽":"ㄅㄠˇ","難":"ㄋㄢˊ","簡":"ㄐㄧㄢˇ","單":"ㄉㄢ","厲":"ㄌㄧˋ","害":"ㄏㄞˋ","怪":"ㄍㄨㄞˋ","可":"ㄎㄜˇ","愛":"ㄞˋ","自":"ㄗˋ","己":"ㄐㄧˇ","直":"ㄓˊ","接":"ㄐㄧㄝ","正":"ㄓㄥˋ","確":"ㄑㄩㄝˋ",
    "今":"ㄐㄧㄣ","天":"ㄊㄧㄢ","昨":"ㄗㄨㄛˊ","明":"ㄇㄧㄥˊ","後":"ㄏㄡˋ","前":"ㄑㄧㄢˊ","現":"ㄒㄧㄢˋ","時":"ㄕˊ","間":"ㄐㄧㄢ","次":"ㄘˋ","上":"ㄕㄤˋ","下":"ㄒㄧㄚˋ","班":"ㄅㄢ","剛":"ㄍㄤ","點":"ㄉㄧㄢˇ","分":"ㄈㄣ","秒":"ㄇㄧㄠˇ",
    "吃":"ㄔ","喝":"ㄏㄜ","買":"ㄇㄞˇ","賣":"ㄇㄞˋ","看":"ㄎㄢˋ","聽":"ㄊㄧㄥ","說":"ㄕㄨㄛ","講":"ㄐㄧㄤˇ","寫":"ㄒㄧㄝˇ","讀":"ㄉㄨˊ","學":"ㄒㄩㄝˊ","教":"ㄐㄧㄠ","問":"ㄨㄣˋ","答":"ㄉㄚˊ","試":"ㄕˋ","用":"ㄩㄥˋ","開":"ㄎㄞ","關":"ㄍㄨㄢ","來":"ㄌㄞˊ","去":"ㄑㄩˋ","回":"ㄏㄨㄟˊ","拿":"ㄋㄚˊ","找":"ㄓㄠˇ","等":"ㄉㄥˇ","放":"ㄈㄤˋ","發":"ㄈㄚ","出":"ㄔㄨ","聲":"ㄕㄥ","音":"ㄧㄣ","覺":"ㄐㄩㄝˊ","得":"ㄉㄜˊ","懂":"ㄉㄨㄥˇ","知":"ㄓ","道":"ㄉㄠˋ","忘":"ㄨㄤˋ","記":"ㄐㄧˋ","住":"ㄓㄨˋ","喜":"ㄒㄧˇ","歡":"ㄏㄨㄢ","覺":"ㄐㄩㄝˊ",
    "中":"ㄓㄨㄥ","文":"ㄨㄣˊ","華":"ㄏㄨㄚˊ","語":"ㄩˇ","台":"ㄊㄞˊ","灣":"ㄨㄢ","日":"ㄖˋ","本":"ㄅㄣˇ","朋":"ㄆㄥˊ","友":"ㄧㄡˇ","人":"ㄖㄣˊ","老":"ㄌㄠˇ","師":"ㄕ","同":"ㄊㄨㄥˊ","學":"ㄒㄩㄝˊ","家":"ㄐㄧㄚ","店":"ㄉㄧㄢˋ","車":"ㄔㄜ","錢":"ㄑㄧㄢˊ","水":"ㄕㄨㄟˇ","飯":"ㄈㄢˋ","麵":"ㄇㄧㄢˋ","拉":"ㄌㄚ","肉":"ㄖㄡˋ","菜":"ㄘㄞˋ","香":"ㄒㄧㄤ","茶":"ㄔㄚˊ","冰":"ㄅㄧㄥ","口":"ㄎㄡˇ","味":"ㄨㄟˋ","法":"ㄈㄚˇ","題":"ㄊㄧˊ","問":"ㄨㄣˋ","鬼":"ㄍㄨㄟˇ","泡":"ㄆㄠˋ","熊":"ㄒㄩㄥˊ","假":"ㄐㄧㄚˋ","颱":"ㄊㄞˊ","風":"ㄈㄥ",
    "這":"ㄓㄜˋ","那":"ㄋㄚˋ","哪":"ㄋㄚˇ","什":"ㄕㄣˊ","麼":"ㄇㄜ˙","誰":"ㄕㄟˊ","裡":"ㄌㄧˇ","邊":"ㄅㄧㄢ","個":"ㄍㄜ˙","一":"ㄧ","二":"ㄦˋ","三":"ㄙㄢ","四":"ㄙˋ","五":"ㄨˇ","六":"ㄌㄧㄡˋ","七":"ㄑㄧ","八":"ㄅㄚ","九":"ㄐㄧㄡˇ","十":"ㄕˊ","百":"ㄅㄞˇ","千":"ㄑㄧㄢ","萬":"ㄨㄢˋ"
  };
  const punctuation=/[，。！？、,.!?；;：:\n\r\t（）()「」『』\[\]【】\s]/;
  const chinese=/[\u3400-\u9fff]/;
  let phraseMap=null;
  let charMap=null;
  function splitZhuyin(z){return String(z||"").trim().split(/\s+/).filter(Boolean);}
  function plainChinese(s){return String(s||"").replace(/[^\u3400-\u9fff]/g,"");}
  function addEntry(map, text, zh){
    const t=plainChinese(text); const z=splitZhuyin(zh);
    if(!t||!z.length)return;
    map.set(t,z.join(" "));
  }
  function collectEntries(){
    const entries=[];
    try{ if(typeof words!=="undefined") words.forEach(w=>{entries.push([w.word,w.zhuyin]); entries.push([w.example,w.exampleZhuyin]);}); }catch(e){}
    try{ if(typeof patterns!=="undefined") patterns.forEach(p=>{entries.push([p.pattern,p.zhuyin]); entries.push([p.answer,p.answerZhuyin]); entries.push([p.example,p.exampleZhuyin]);}); }catch(e){}
    try{ if(typeof phrases!=="undefined") phrases.forEach(p=>entries.push([p.text,p.zhuyin])); }catch(e){}
    return entries;
  }
  function build(){
    if(phraseMap&&charMap)return;
    const dict=window.ChengciZhuyinDictionary||{phrases:{},chars:{}};
    phraseMap=new Map(Object.entries(dict.phrases||{}));
    charMap=Object.assign({},dict.chars||{},manualCharMap);
    collectEntries().forEach(([text,zh])=>{
      addEntry(phraseMap,text,zh);
      const t=plainChinese(text); const z=splitZhuyin(zh);
      if(t&&z.length===t.length){
        [...t].forEach((ch,i)=>{ charMap[ch]=z[i]; });
      }
    });
  }
  function convert(text){
    build();
    const src=String(text||"");
    const keys=[...phraseMap.keys()].sort((a,b)=>b.length-a.length).filter(k=>k.length>1);
    const out=[];
    let i=0;
    while(i<src.length){
      const ch=src[i];
      if(punctuation.test(ch)){ out.push(ch); i++; continue; }
      let matched=false;
      if(chinese.test(ch)){
        for(const k of keys){
          if(src.startsWith(k,i)){
            out.push(phraseMap.get(k));
            i+=k.length;
            matched=true;
            break;
          }
        }
        if(matched)continue;
        out.push(charMap[ch]||"□");
        i++;
      }else{
        i++;
      }
    }
    return out.join(" ").replace(/\s+([，。！？、,.!?；;：:])/g,"$1").replace(/([，。！？、,.!?；;：:])\s+/g,"$1 ").replace(/\s+/g," ").trim();
  }
  window.ChengciZhuyinLite={convert};
})();

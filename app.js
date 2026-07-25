
// Ver.4.2: ブラウザ標準の音声読み上げ＋自由読み上げ＋リピート再生＋注音表示
let availableVoices=[];
let audioPrefs=JSON.parse(localStorage.getItem("audioPrefs")||"{}");
let speechRepeatTimer=null;
let speechRunId=0;
let freeSpeakPrefs=JSON.parse(localStorage.getItem("freeSpeakPrefs")||"{}");

function speechTextAttr(text){
  return encodeURIComponent(String(text||""));
}
function audioButton(text,label="🔊 音声"){
  if(!text)return "";
  return `<button class="secondary small audio-btn" onclick="speakEncoded('${speechTextAttr(text)}')">${label}</button>`;
}
function speakEncoded(encoded){
  speakText(decodeURIComponent(encoded));
}
function getSpeechRate(){
  const el=document.getElementById("speechRate");
  return el?Number(el.value||0.9):Number(audioPrefs.rate||0.9);
}
function updateRateLabel(){
  const rate=document.getElementById("speechRate");
  const label=document.getElementById("rateLabel");
  if(rate&&label)label.textContent=Number(rate.value).toFixed(2);
}
function saveAudioPrefs(){
  const voice=document.getElementById("voiceSelect");
  const rate=document.getElementById("speechRate");
  const auto=document.getElementById("autoSpeak");
  audioPrefs={
    voiceURI:voice?voice.value:(audioPrefs.voiceURI||""),
    rate:rate?Number(rate.value||0.9):(audioPrefs.rate||0.9),
    autoSpeak:auto?auto.checked:!!audioPrefs.autoSpeak
  };
  localStorage.setItem("audioPrefs",JSON.stringify(audioPrefs));
}
function shouldAutoSpeak(){
  const auto=document.getElementById("autoSpeak");
  return auto?auto.checked:!!audioPrefs.autoSpeak;
}
function populateVoiceSelect(){
  const select=document.getElementById("voiceSelect");
  if(!select||!("speechSynthesis" in window))return;
  availableVoices=window.speechSynthesis.getVoices()||[];
  const current=audioPrefs.voiceURI||select.value||"";
  const zhVoices=availableVoices.filter(v=>/^zh/i.test(v.lang||""));
  select.innerHTML=`<option value="">自動選択（zh-TW優先）</option>`+
    zhVoices.map(v=>`<option value="${v.voiceURI}">${v.name}（${v.lang}）</option>`).join("");
  select.value=current;
}
function pickChineseVoice(){
  if(!("speechSynthesis" in window))return null;
  availableVoices=window.speechSynthesis.getVoices()||availableVoices||[];
  const selected=audioPrefs.voiceURI;
  if(selected){
    const v=availableVoices.find(v=>v.voiceURI===selected);
    if(v)return v;
  }
  return availableVoices.find(v=>/zh[-_]?TW/i.test(v.lang||""))
      || availableVoices.find(v=>/zh[-_]?Hant/i.test(v.lang||""))
      || availableVoices.find(v=>/zh[-_]?HK/i.test(v.lang||""))
      || availableVoices.find(v=>/^zh/i.test(v.lang||""))
      || null;
}
function prepareSpeechText(text){
  return String(text||"").replace(/[ㄅ-ㄩˊˇˋ˙\s]+/g," ").trim();
}
function speakText(text, options={}){
  const clean=prepareSpeechText(text);
  if(!clean)return;
  if(!("speechSynthesis" in window)){
    alert("このブラウザは音声読み上げに対応していないみたい。Chrome / Safariで試してね。");
    return;
  }
  window.speechSynthesis.cancel();
  if(speechRepeatTimer)clearTimeout(speechRepeatTimer);
  const repeat=Math.max(1,Math.min(Number(options.repeat||1),10));
  const gap=Math.max(0,Number(options.gap||0));
  const runId=++speechRunId;
  const speakOne=(count)=>{
    if(runId!==speechRunId)return;
    const u=new SpeechSynthesisUtterance(clean);
    u.lang="zh-TW";
    u.rate=getSpeechRate();
    u.pitch=1;
    const voice=pickChineseVoice();
    if(voice)u.voice=voice;
    u.onend=()=>{
      if(runId!==speechRunId)return;
      if(count<repeat){
        speechRepeatTimer=setTimeout(()=>speakOne(count+1),gap);
      }
    };
    u.onerror=()=>{};
    window.speechSynthesis.speak(u);
  };
  speakOne(1);
}
function stopSpeech(){
  speechRunId++;
  if(speechRepeatTimer){
    clearTimeout(speechRepeatTimer);
    speechRepeatTimer=null;
  }
  if("speechSynthesis" in window)window.speechSynthesis.cancel();
}
function stopFreeSpeech(){
  stopSpeech();
  const status=document.getElementById("freeSpeakStatus");
  if(status)status.innerHTML='<span class="note">⏹ 読み上げを停止しました</span>';
}
function testSpeech(){
  speakText("這樣不錯耶！");
}

function setSpeechRate(value){
  const rate=document.getElementById("speechRate");
  if(rate){
    rate.value=String(value);
    updateRateLabel();
    saveAudioPrefs();
  }else{
    audioPrefs.rate=value;
    localStorage.setItem("audioPrefs",JSON.stringify(audioPrefs));
  }
}
function getFreeSpeakText(){
  const el=document.getElementById("freeSpeakText");
  return el?el.value.trim():"";
}
function saveFreeSpeakText(){
  const text=getFreeSpeakText();
  localStorage.setItem("freeSpeakText",text);
}
function getFreeSpeakRepeat(){
  const el=document.getElementById("freeSpeakRepeat");
  return el?Number(el.value||1):Number(freeSpeakPrefs.repeat||1);
}
function getFreeSpeakGap(){
  const el=document.getElementById("freeSpeakGap");
  return el?Number(el.value||1000):Number(freeSpeakPrefs.gap||1000);
}
function saveFreeSpeakPrefs(){
  freeSpeakPrefs={repeat:getFreeSpeakRepeat(),gap:getFreeSpeakGap()};
  localStorage.setItem("freeSpeakPrefs",JSON.stringify(freeSpeakPrefs));
}
function initFreeSpeak(){
  const el=document.getElementById("freeSpeakText");
  if(!el)return;
  el.value=localStorage.getItem("freeSpeakText")||"";
  const repeat=document.getElementById("freeSpeakRepeat");
  const gap=document.getElementById("freeSpeakGap");
  if(repeat&&freeSpeakPrefs.repeat)repeat.value=String(freeSpeakPrefs.repeat);
  if(gap&&freeSpeakPrefs.gap)gap.value=String(freeSpeakPrefs.gap);
  el.addEventListener("input",saveFreeSpeakText);
}
function speakFreeText(){
  const text=getFreeSpeakText();
  const status=document.getElementById("freeSpeakStatus");
  if(!text){
    if(status)status.innerHTML='<span class="wrong">まだ中文が入ってないよ</span>';
    return;
  }
  saveFreeSpeakText();
  saveFreeSpeakPrefs();
  const repeat=getFreeSpeakRepeat();
  speakText(text,{repeat,gap:getFreeSpeakGap()});
  if(status)status.innerHTML=`<span class="correct">読み上げ中${repeat>1?`（${repeat}回）`:""}：</span><span class="free-speak-preview">${escapeHtml(text).slice(0,80)}${text.length>80?"…":""}</span>`;
}
async function pasteFreeText(){
  const el=document.getElementById("freeSpeakText");
  const status=document.getElementById("freeSpeakStatus");
  if(!el)return;
  try{
    if(navigator.clipboard&&navigator.clipboard.readText){
      const text=await navigator.clipboard.readText();
      if(text){
        el.value=text;
        saveFreeSpeakText();
        if(status)status.innerHTML='<span class="correct">貼り付けたよ。🔊で再生できるよ。</span>';
        el.focus();
        return;
      }
    }
    el.focus();
    if(status)status.innerHTML='<span class="note">ここに貼り付けてね。iPhoneは長押し→ペーストでもOK。</span>';
  }catch(e){
    el.focus();
    if(status)status.innerHTML='<span class="note">ブラウザの制限で自動貼り付けできないかも。長押し→ペーストしてね。</span>';
  }
}
function clearFreeText(){
  const el=document.getElementById("freeSpeakText");
  if(el)el.value="";
  localStorage.removeItem("freeSpeakText");
  const status=document.getElementById("freeSpeakStatus");
  if(status)status.textContent="";
  const zh=document.getElementById("freeSpeakZhuyin");
  if(zh){zh.hidden=true;zh.innerHTML="";}
  stopSpeech();
}
function showFreeSpeakZhuyin(){
  const text=getFreeSpeakText();
  const box=document.getElementById("freeSpeakZhuyin");
  const status=document.getElementById("freeSpeakStatus");
  if(!box)return;
  if(!text){
    if(status)status.innerHTML='<span class="wrong">まだ中文が入ってないよ</span>';
    return;
  }
  saveFreeSpeakText();
  const converter=window.ChengciZhuyinLite;
  const result=converter?converter.convert(text):"";
  box.hidden=false;
  box.innerHTML=`<div class="zhuyin-title">📖 注音（澄詞データ → 台湾華語熟語辞書 → 常用字辞書）</div><div class="zhuyin-original">${escapeHtml(text)}</div><div class="zhuyin-output">${escapeHtml(result||"注音を作れなかったみたい🥲")}</div><div class="zhuyin-note">※ 多音字は文脈でズレることがあります。最後は音声・辞書・のあ確認で調整してね。</div>`;
  if(status)status.innerHTML='<span class="correct">注音を表示したよ。</span>';
}

function escapeHtml(text){
  return String(text||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function initAudio(){
  const rate=document.getElementById("speechRate");
  const auto=document.getElementById("autoSpeak");
  if(rate&&audioPrefs.rate)rate.value=audioPrefs.rate;
  if(auto)auto.checked=!!audioPrefs.autoSpeak;
  updateRateLabel();
  populateVoiceSelect();
  if("speechSynthesis" in window){
    window.speechSynthesis.onvoiceschanged=populateVoiceSelect;
    setTimeout(populateVoiceSelect,300);
  }
}

let favorites=JSON.parse(localStorage.getItem("favorites")||"[]");
let weakWords=JSON.parse(localStorage.getItem("weakWords")||"[]");
let mistakeCounts=JSON.parse(localStorage.getItem("mistakeCounts")||"{}");
let quizRuns=Number(localStorage.getItem("quizRuns")||localStorage.getItem("quizCount")||"0");
let currentQuiz=null;

// Ver.3.5: 1周するまで重複しないランダム山札
let quizQueue=[];
let compositionQueues={mix:[], word:[], pattern:[]};
function shuffleArray(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function pickFromQueue(queueName,pool,keyFn){
  if(!pool.length)return null;
  const unique=[];
  const seen=new Set();
  pool.forEach(item=>{
    const key=keyFn(item);
    if(!seen.has(key)){seen.add(key); unique.push(item);}
  });
  // Ver.5.5.1: 新しい出題モードでも未初期化の山札で止まらないようにする
  let queue;
  if(queueName==="quiz"){
    queue=quizQueue;
  }else{
    if(!Array.isArray(compositionQueues[queueName])) compositionQueues[queueName]=[];
    queue=compositionQueues[queueName];
  }
  const keys=new Set(unique.map(keyFn));
  queue=queue.filter(item=>keys.has(keyFn(item)));
  if(queue.length===0){
    queue=shuffleArray(unique);
  }
  const item=queue.shift();
  if(queueName==="quiz") quizQueue=queue; else compositionQueues[queueName]=queue;
  return item;
}
function weightedQuizPool(){
  const base=[...words];
  const weak=base.filter(w=>score(w)>0);
  // 苦手は少し多めに山札へ入れる。でも山札内で同じカードが連続しないように後で調整。
  const pool=[...base,...weak,...weak.filter(w=>(mistakeCounts[w.word]||0)>1)];
  const seen=[];
  pool.forEach(w=>seen.push(w));
  return seen;
}
function saveAll(){localStorage.setItem("favorites",JSON.stringify(favorites));localStorage.setItem("weakWords",JSON.stringify(weakWords));localStorage.setItem("mistakeCounts",JSON.stringify(mistakeCounts));localStorage.setItem("quizRuns",String(quizRuns));updateStats();}
function updateStats(){document.getElementById("totalCount").textContent=words.length;document.getElementById("favoriteCount").textContent=favorites.length;document.getElementById("weakCount").textContent=weakWords.length;document.getElementById("quizCount").textContent=quizRuns;}
function score(item){return (mistakeCounts[item.word]||0)*3+(weakWords.includes(item.word)?2:0)+(favorites.includes(item.word)?1:0);}
function toggleFavorite(word){favorites=favorites.includes(word)?favorites.filter(w=>w!==word):[...favorites,word];saveAll();refresh();}
function escapeWordText(s){return String(s||"").replace(/'/g,"\\'");}
function toggleCard(btn){const card=btn.closest(".card");card.classList.toggle("open");btn.textContent=card.classList.contains("open")?"閉じる":"例文・忘れやすい理由を見る";}
function createWordCard(item){
  const star=favorites.includes(item.word)?"★":"☆";
  const allTags=getWordTags(item);
  const topTags=allTags.slice(0,3).map(t=>`<span class="tag hot">#${t}</span>`).join("");
  const tags=allTags.map(t=>`<span class="tag hot">#${t}</span>`).join("");
  return `<div class="card"><div class="card-top"><div class="tag">${item.category}</div><button class="small star" onclick="toggleFavorite('${escapeWordText(item.word)}')">${star}</button></div><div class="word">${item.word}</div><div class="zhuyin">${item.zhuyin}</div><div class="audio-row">${audioButton(item.word,"🔊 單字")}${audioButton(item.example,"🔊 例文")}</div><div class="meaning">${item.meaning}</div><div class="tag-row top-tags">${topTags}</div><button class="mobile-more" onclick="toggleCard(this)">例文・忘れやすい理由を見る</button><div class="details"><div class="example">${item.example}<br><span style="color:#666">${item.exampleZhuyin}</span><br><span class="note">${item.note}</span></div><div class="confuse">⚠️ ${item.confuse||item.note}</div><div class="tag-row">${tags}</div><span class="priority">復習優先度：${score(item)} / 忘れた回数：${mistakeCounts[item.word]||0}</span></div></div>`;
}
function renderWordList(list=words){document.getElementById("wordList").innerHTML=list.length?list.map(createWordCard).join(""):'<div class="empty">找不到耶 🥲</div>';}
function pickWords(){document.getElementById("todayWords").innerHTML=[...words].sort(()=>Math.random()-.5).slice(0,3).map(createWordCard).join("");}
function pickPriorityWords(){let sorted=[...words].sort((a,b)=>score(b)-score(a));let top=sorted.filter(w=>score(w)>0).slice(0,3);let selected=(top.length>=3?top:[...top,...words.filter(w=>!top.includes(w)).sort(()=>Math.random()-.5)]).slice(0,3);document.getElementById("priorityWords").innerHTML=selected.map(createWordCard).join("");}
function clearTodayWords(){document.getElementById("todayWords").innerHTML="";}
function clearPriorityWords(){document.getElementById("priorityWords").innerHTML="";}
function searchWords(){let k=document.getElementById("searchInput").value.trim().replace(/^#/,"");let results=document.getElementById("searchResults");if(!k){results.innerHTML="";return;}let m=words.filter(i=>[i.category,i.word,i.zhuyin,i.meaning,i.note,i.example,i.exampleZhuyin,i.confuse,getWordTags(i).join(" ")].some(x=>(x||"").includes(k)));results.innerHTML=m.length?m.map(createWordCard).join(""):'<div class="empty">找不到耶 🥲</div>';}
function renderCategoryButtons(){let cats=["全部",...new Set(words.map(w=>w.category))];document.getElementById("categoryButtons").innerHTML=cats.map(c=>`<button class="secondary small" onclick="filterByCategory('${c}')">${c}</button>`).join("");}
function getWordTags(w){return (w.tags&&w.tags.length)?w.tags:[w.category].filter(Boolean);}
function renderTagButtons(){let area=document.getElementById("tagButtons");if(!area)return;let tags=[...new Set(words.flatMap(getWordTags))].filter(Boolean).sort();area.innerHTML=tags.length?tags.map(t=>`<button class="secondary small" onclick="filterByTag('${t}')">#${t}</button>`).join(""):'<span class="empty-inline">タグがまだありません</span>';let hotArea=document.getElementById("hotTagButtons");if(hotArea){let hot=["何回も忘れた","声調注意","何度も質問した","就と才","又と再","台湾人よく使う","WOS","夜市"];let visible=hot.filter(t=>tags.includes(t));hotArea.innerHTML=visible.map(t=>`<button class="secondary small" onclick="filterByTag('${t}');document.getElementById('wordList').scrollIntoView({behavior:'smooth'});">#${t}</button>`).join("");}}
function filterByTag(t){renderWordList(words.filter(w=>getWordTags(w).includes(t)));}
function filterByCategory(c){renderWordList(c==="全部"?words:words.filter(w=>w.category===c));}
function showFavorites(){renderWordList(words.filter(w=>favorites.includes(w.word)));}
function showWeakWords(){renderWordList(words.filter(w=>weakWords.includes(w.word)));}
function showPriorityWords(){renderWordList([...words].sort((a,b)=>score(b)-score(a)));}
function clearWeakWords(){if(!confirm("苦手單字と忘れた回数を消す？"))return;weakWords=[];mistakeCounts={};saveAll();renderWordList(words);}
function startQuiz(){let pool=[...words].sort((a,b)=>score(b)-score(a)||Math.random()-.5);let q=pickFromQueue("quiz",pool,w=>w.word)||pool[0];let ans=[q.meaning];while(ans.length<4){let r=words[Math.floor(Math.random()*words.length)].meaning;if(!ans.includes(r))ans.push(r);}ans.sort(()=>Math.random()-.5);currentQuiz=q;quizRuns++;saveAll();document.getElementById("quizArea").innerHTML=`<div class="quiz-card"><span class="tag">${q.category}</span><div class="word">${q.word}</div><div class="zhuyin">${q.zhuyin}</div><div class="audio-row">${audioButton(q.word,"🔊 單字")}${audioButton(q.example,"🔊 例文")}</div><p class="hint">この意味はどれ？</p><div class="quiz-options">${ans.map(a=>`<button onclick="checkAnswer('${a.replace(/'/g,"\\'")}')">${a}</button>`).join("")}</div><div id="quizResult"></div></div>`;if(shouldAutoSpeak())speakText(q.word);}
function checkAnswer(a){if(!currentQuiz)return;let result=document.getElementById("quizResult");if(a===currentQuiz.meaning){result.innerHTML=`<div class="quiz-result"><span class="correct">⭕ 正解！</span><br>${currentQuiz.example}<br>${currentQuiz.exampleZhuyin}<div class="audio-row">${audioButton(currentQuiz.example,"🔊 例文")}</div></div>`;}else{if(!weakWords.includes(currentQuiz.word))weakWords.push(currentQuiz.word);mistakeCounts[currentQuiz.word]=(mistakeCounts[currentQuiz.word]||0)+1;saveAll();result.innerHTML=`<div class="quiz-result"><span class="wrong">❌ 不正解</span><br>正解：${currentQuiz.meaning}<br>${currentQuiz.example}<br>${currentQuiz.exampleZhuyin}<div class="audio-row">${audioButton(currentQuiz.example,"🔊 例文")}</div><br>⚠️ ${currentQuiz.confuse||currentQuiz.note}</div>`;}}
function clearQuiz(){document.getElementById("quizArea").innerHTML="";currentQuiz=null;}
function renderPhrases(){document.getElementById("phraseList").innerHTML=phrases.map(p=>`<div class="phrase-card"><div class="phrase-main">${p.text}</div><div class="phrase-sub">${p.zhuyin}</div><div class="audio-row">${audioButton(p.text,"🔊 音声")}</div><div class="phrase-meaning">${p.meaning}</div></div>`).join("");}
function refresh(){renderWordList(words);searchWords();}
window.addEventListener("load",()=>{initAudio();initFreeSpeak();renderCategoryButtons();renderTagButtons();renderWordList();renderPhrases();pickPriorityWords();updateStats();});

// Ver.3.0 additions: 型カード・瞬間作文
let weakCards=JSON.parse(localStorage.getItem("weakCards")||"[]");
let patternMistakeCounts=JSON.parse(localStorage.getItem("patternMistakeCounts")||"{}");
let currentComposition=null;

const oldUpdateStats=updateStats;
updateStats=function(){
  oldUpdateStats();
  const pc=document.getElementById("patternCount");
  if(pc) pc.textContent=(typeof patterns!=="undefined"?patterns.length:0);
  const wc=document.getElementById("weakCount");
  if(wc) wc.textContent=[...new Set([...weakWords,...weakCards])].length;
}
const oldSaveAll=saveAll;
saveAll=function(){
  localStorage.setItem("weakCards",JSON.stringify(weakCards));
  localStorage.setItem("patternMistakeCounts",JSON.stringify(patternMistakeCounts));
  oldSaveAll();
}
function patternScore(item){return (patternMistakeCounts[item.pattern]||0)*3+(weakCards.includes(item.pattern)?2:0);}
function getPatternTags(p){return (p.tags&&p.tags.length)?p.tags:[p.category].filter(Boolean);}
function toggleWeakPattern(key){weakCards=weakCards.includes(key)?weakCards.filter(w=>w!==key):[...weakCards,key];saveAll();renderPatternList(patterns);}
function createPatternCard(item){
  const tags=getPatternTags(item).map(t=>`<span class="tag hot">#${t}</span>`).join("");
  const top=getPatternTags(item).slice(0,3).map(t=>`<span class="tag hot">#${t}</span>`).join("");
  const weak=weakCards.includes(item.pattern)?"苦手解除":"苦手登録";
  const promptList=(item.prompts||[]).map(q=>`<li><b>${q.ja}</b><br>${q.answer}<br><span class="zhuyin">${q.zhuyin}</span></li>`).join("");
  return `<div class="card pattern-card"><div class="card-top"><div class="tag">${item.category}</div><button class="small star" onclick="toggleWeakPattern('${escapeWordText(item.pattern)}')">${weak}</button></div><div class="word">${item.pattern}</div><div class="zhuyin">${item.zhuyin}</div><div class="audio-row">${audioButton(item.example,"🔊 例文")}</div><div class="meaning">${item.meaning}</div><div class="tag-row top-tags">${top}</div><button class="mobile-more" onclick="toggleCard(this)">例文・瞬間作文を見る</button><div class="details"><div class="example">${item.example}<br><span style="color:#666">${item.exampleZhuyin}</span><br><span class="note">${item.note}</span></div><div class="confuse">⚡ 瞬間作文候補</div><ol class="prompt-list">${promptList}</ol><div class="tag-row">${tags}</div><span class="priority">復習優先度：${patternScore(item)} / 間違えた回数：${patternMistakeCounts[item.pattern]||0}</span></div></div>`;
}
function renderPatternList(list=patterns){const area=document.getElementById("patternList"); if(area) area.innerHTML=list.length?list.map(createPatternCard).join(""):'<div class="empty">找不到耶 🥲</div>';}
function showPatternPriority(){renderPatternList([...patterns].sort((a,b)=>patternScore(b)-patternScore(a)));}
function renderPatternTagButtons(){let area=document.getElementById("patternTagButtons"); if(!area)return; let tags=[...new Set(patterns.flatMap(getPatternTags))].sort(); area.innerHTML=tags.map(t=>`<button class="secondary small" onclick="renderPatternList(patterns.filter(p=>getPatternTags(p).includes('${t}'))) ">#${t}</button>`).join("");}
function wordCompositionPool(){return words.map(w=>({type:"word",category:w.category,source:w.word,ja:w.meaning,answer:w.word,zhuyin:w.zhuyin}));}
function normalizeCompositionText(text){
  return String(text||"")
    .toLowerCase()
    .replace(/[\s　，。！？!?、,.；;：:"“”‘’'（）()]/g,"")
    .replace(/臺/g,"台")
    .replace(/妳/g,"你");
}
function getCompositionInput(){
  const input=document.getElementById("compositionInput");
  return input?input.value.trim():"";
}
function startComposition(mode="mix"){
  const wordPool=wordCompositionPool();
  let pool=mode==="word"?wordPool:mode==="pattern"?compositionPrompts:[...wordPool,...compositionPrompts];
  const weakPool=pool.filter(a=>(a.type==="pattern"?patternMistakeCounts[a.source]||0:mistakeCounts[a.source]||0)>0);
  const weightedPool=[...pool,...weakPool,...weakPool];
  currentComposition=pickFromQueue(mode,weightedPool,a=>`${a.type}:${a.source}:${a.ja}`)||pool[Math.floor(Math.random()*pool.length)];
  quizRuns++; saveAll();
  document.getElementById("compositionArea").innerHTML=`<div class="quiz-card composition-card"><span class="tag">${currentComposition.type==="pattern"?"型":"單字"}：${currentComposition.category}</span><p class="hint">日本語を見て、台湾華語で答えてみて。スマホなら下の入力欄にカーソルを置いて、繁體中文（台灣）キーボードの🎤でもOK。</p><div class="composition-label">問題</div><div class="composition-ja" aria-label="問題文">${currentComposition.ja}</div><label class="composition-label" for="compositionInput">你的答案</label><textarea id="compositionInput" class="composition-input" rows="3" lang="zh-Hant-TW" inputmode="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="ここに中文で入力／音声入力&#10;例：比我想像中還好吃"></textarea><div class="button-row"><button onclick="checkCompositionAnswer()">答え合わせ</button><button onclick="showCompositionAnswer()">答えを見る</button><button class="secondary" onclick="markCompositionMistake()">苦手にする</button><button class="secondary" onclick="startComposition('${mode}')">次の問題</button></div><div id="compositionResult"></div></div>`;
  setTimeout(()=>{const input=document.getElementById("compositionInput"); if(input) input.focus();},50);
}
function showCompositionAnswer(){
  if(!currentComposition)return;
  const user=getCompositionInput();
  document.getElementById("compositionResult").innerHTML=`<div class="quiz-result"><span class="correct">答え</span>${user?`<br><span class="note">你的答案：</span><br><div class="user-answer">${user}</div>`:""}<br><div class="word">${currentComposition.answer}</div><div class="zhuyin">${currentComposition.zhuyin}</div><div class="audio-row">${audioButton(currentComposition.answer,"🔊 答え")}</div><span class="note">型：${currentComposition.source}</span></div>`;if(shouldAutoSpeak())speakText(currentComposition.answer);
}
function checkCompositionAnswer(){
  if(!currentComposition)return;
  const user=getCompositionInput();
  const result=document.getElementById("compositionResult");
  if(!user){result.innerHTML=`<div class="quiz-result"><span class="wrong">まだ入力されてないよ</span><br>キーボード入力でも🎤音声入力でもOK。</div>`;return;}
  const ok=normalizeCompositionText(user)===normalizeCompositionText(currentComposition.answer);
  if(ok){
    result.innerHTML=`<div class="quiz-result"><span class="correct">⭕ ぴったり！</span><br><div class="user-answer">${user}</div><div class="zhuyin">${currentComposition.zhuyin}</div><div class="audio-row">${audioButton(currentComposition.answer,"🔊 答え")}</div><span class="note">この調子で次いこー</span></div>`;if(shouldAutoSpeak())speakText(currentComposition.answer);
  }else{
    result.innerHTML=`<div class="quiz-result"><span class="wrong">△ 答えと違うかも</span><br><span class="note">你的答案：</span><br><div class="user-answer">${user}</div><br><span class="note">參考答案：</span><br><div class="word">${currentComposition.answer}</div><div class="zhuyin">${currentComposition.zhuyin}</div><div class="audio-row">${audioButton(currentComposition.answer,"🔊 答え")}</div><div class="button-row score-row"><button onclick="markCompositionCorrect()">これでOKにする</button><button class="secondary" onclick="markCompositionMistake()">苦手にする</button></div></div>`;
  }
}
function markCompositionCorrect(){
  if(!currentComposition)return;
  document.getElementById("compositionResult").innerHTML+=`<div class="mini-feedback correct">自己採点：OK！</div>`;
}
function markCompositionMistake(){if(!currentComposition)return; if(currentComposition.type==="pattern"){if(!weakCards.includes(currentComposition.source))weakCards.push(currentComposition.source); patternMistakeCounts[currentComposition.source]=(patternMistakeCounts[currentComposition.source]||0)+1;}else{if(!weakWords.includes(currentComposition.source))weakWords.push(currentComposition.source); mistakeCounts[currentComposition.source]=(mistakeCounts[currentComposition.source]||0)+1;} saveAll(); showCompositionAnswer();}
function clearComposition(){document.getElementById("compositionArea").innerHTML="";currentComposition=null;}

const oldSearchWords=searchWords;
searchWords=function(){
  let k=document.getElementById("searchInput").value.trim().replace(/^#/,"");
  let results=document.getElementById("searchResults");if(!k){results.innerHTML="";return;}
  let wm=words.filter(i=>[i.category,i.word,i.zhuyin,i.meaning,i.note,i.example,i.exampleZhuyin,i.confuse,getWordTags(i).join(" ")].some(x=>(x||"").includes(k)));
  let pm=patterns.filter(i=>[i.category,i.pattern,i.zhuyin,i.meaning,i.note,i.example,i.exampleZhuyin,getPatternTags(i).join(" ")].some(x=>(x||"").includes(k)));
  results.innerHTML=(wm.length||pm.length)?[...wm.map(createWordCard),...pm.map(createPatternCard)].join(""):'<div class="empty">找不到耶 🥲</div>';
}

const oldWindowLoad = window.onload;
window.addEventListener("load",()=>{renderPatternTagButtons();renderPatternList(patterns);updateStats();});

// Ver.5.0 tab navigation
function showTab(name){
  document.querySelectorAll('.tab-page').forEach(page=>page.classList.remove('active'));
  const target=document.getElementById(`tab-${name}`);
  if(target) target.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tabTarget===name);
  });
  localStorage.setItem('chengciActiveTab', name);
  window.scrollTo({top:0, behavior:'smooth'});
}
function scrollToPanel(id){
  showTab('home');
  setTimeout(()=>{
    const el=document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  },80);
}
function jumpToStudyPanel(id){
  showTab('study');
  setTimeout(()=>{
    const el=document.getElementById(id);
    if(el){
      el.scrollIntoView({behavior:'smooth', block:'start'});
      el.classList.add('jump-highlight');
      setTimeout(()=>el.classList.remove('jump-highlight'), 900);
    }
  },80);
}
window.addEventListener('load',()=>{
  const saved=localStorage.getItem('chengciActiveTab')||'home';
  showTab(saved);
});


// Ver.5.1 PWA offline support
function setOfflineStatus(message, ok=false){
  const el=document.getElementById('offlineStatus');
  if(!el)return;
  el.textContent=message;
  el.classList.toggle('ok', !!ok);
}
function updateNetworkBadge(){
  setOfflineStatus(navigator.onLine ? 'オンライン：オフライン保存が有効なら、次回から電波なしでも開けます。' : 'オフライン：保存済みデータで動作中です。', !navigator.onLine);
}
async function refreshOfflineCache(){
  if(!('serviceWorker' in navigator) || !('caches' in window)){
    setOfflineStatus('このブラウザはオフライン保存に対応していないみたいです。');
    return;
  }
  setOfflineStatus('オフライン用データを更新中…');
  try{
    const cache=await caches.open('chengci-v5-4-2-offline');
    await cache.addAll(['./index.html','./style.css','./app.js','./words.js','./zhuyin-dict.js','./zhuyin-lite.js','./manifest.json','./icon.svg']);
    setOfflineStatus('オフライン保存OK。次回から電波なしでも起動できます。', true);
  }catch(e){
    setOfflineStatus('保存更新に失敗しました。ネット接続がある時にもう一度試してね。');
  }
}
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./service-worker.js').then(()=>{
      setOfflineStatus('オフライン保存OK。初回読み込み後は電波なしでも使えます。', true);
    }).catch(()=>{
      setOfflineStatus('オフライン保存の登録に失敗しました。GitHub Pages上で開くと有効になります。');
    });
    updateNetworkBadge();
  });
  window.addEventListener('online', updateNetworkBadge);
  window.addEventListener('offline', updateNetworkBadge);
}


// Ver.5.4 慣用說法・統合クイズ
let weakIdioms=JSON.parse(localStorage.getItem("weakIdioms")||"[]");
let idiomMistakeCounts=JSON.parse(localStorage.getItem("idiomMistakeCounts")||"{}");
function idiomKey(i){return i.text;}
function idiomScore(i){return (idiomMistakeCounts[idiomKey(i)]||0)*3+(weakIdioms.includes(idiomKey(i))?2:0);}
function getIdiomTags(i){return (i.tags&&i.tags.length)?i.tags:[i.category].filter(Boolean);}
const v54SaveAll=saveAll;
saveAll=function(){localStorage.setItem("weakIdioms",JSON.stringify(weakIdioms));localStorage.setItem("idiomMistakeCounts",JSON.stringify(idiomMistakeCounts));v54SaveAll();}
const v54UpdateStats=updateStats;
updateStats=function(){v54UpdateStats();const el=document.getElementById("idiomCount");if(el)el.textContent=idioms.length;}
function toggleWeakIdiom(key){weakIdioms=weakIdioms.includes(key)?weakIdioms.filter(x=>x!==key):[...weakIdioms,key];saveAll();renderIdiomList(idioms);}
function createIdiomCard(item){
 const tags=getIdiomTags(item).map(t=>`<span class="tag hot">#${t}</span>`).join("");
 const weak=weakIdioms.includes(idiomKey(item))?"苦手解除":"苦手登録";
 return `<div class="card idiom-card"><div class="card-top"><div class="tag">${item.category}</div><button class="small star" onclick="toggleWeakIdiom('${escapeWordText(idiomKey(item))}')">${weak}</button></div><div class="word">${item.text}</div><div class="zhuyin">${item.zhuyin}</div><div class="audio-row">${audioButton(item.text,"🔊 音声")}</div><div class="meaning">${item.meaning}</div><button class="mobile-more" onclick="toggleCard(this)">使い方メモを見る</button><div class="details"><div class="example"><span class="note">${item.note||""}</span></div><div class="tag-row">${tags}</div><span class="priority">復習優先度：${idiomScore(item)} / 間違えた回数：${idiomMistakeCounts[idiomKey(item)]||0}</span></div></div>`;
}
function renderIdiomList(list=idioms){const area=document.getElementById("idiomList");if(area)area.innerHTML=list.length?list.map(createIdiomCard).join(""):'<div class="empty">找不到耶 🥲</div>';}
function showIdiomPriority(){renderIdiomList([...idioms].sort((a,b)=>idiomScore(b)-idiomScore(a)));}
function renderIdiomTagButtons(){const area=document.getElementById("idiomTagButtons");if(!area)return;const tags=[...new Set(idioms.flatMap(getIdiomTags))].sort();area.innerHTML=tags.map(t=>`<button class="secondary small" onclick="renderIdiomList(idioms.filter(i=>getIdiomTags(i).includes('${t}')))">#${t}</button>`).join("");}
function idiomCompositionPool(){return idioms.map(i=>({type:"idiom",category:i.category,source:i.text,ja:i.meaning,answer:i.text,zhuyin:i.zhuyin}));}
function typeLabel(t){return t==="pattern"?"句型":t==="idiom"?"慣用說法":"單字";}
startComposition=function(mode="mix"){
 const wordPool=wordCompositionPool(), idiomPool=idiomCompositionPool();
 let pool=mode==="word"?wordPool:mode==="pattern"?compositionPrompts:mode==="idiom"?idiomPool:[...wordPool,...compositionPrompts,...idiomPool];
 const weakPool=pool.filter(a=>a.type==="pattern"?(patternMistakeCounts[a.source]||0)>0:a.type==="idiom"?(idiomMistakeCounts[a.source]||0)>0:(mistakeCounts[a.source]||0)>0);
 const weighted=[...pool,...weakPool,...weakPool];currentComposition=pickFromQueue(mode,weighted,a=>`${a.type}:${a.source}:${a.ja}`)||pool[Math.floor(Math.random()*pool.length)];quizRuns++;saveAll();
 document.getElementById("compositionArea").innerHTML=`<div class="quiz-card composition-card"><span class="tag">${typeLabel(currentComposition.type)}：${currentComposition.category}</span><p class="hint">日本語を見て、台湾華語で答えてみて。</p><div class="composition-label">問題</div><div class="composition-ja">${currentComposition.ja}</div><label class="composition-label" for="compositionInput">你的答案</label><textarea id="compositionInput" class="composition-input" rows="3" lang="zh-Hant-TW" inputmode="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="ここに中文で入力／音声入力"></textarea><div class="button-row"><button onclick="checkCompositionAnswer()">答え合わせ</button><button onclick="showCompositionAnswer()">答えを見る</button><button class="secondary" onclick="markCompositionMistake()">苦手にする</button><button class="secondary" onclick="startComposition('${mode}')">次の問題</button></div><div id="compositionResult"></div></div>`;
 setTimeout(()=>{const input=document.getElementById("compositionInput");if(input)input.focus();},50);
}
markCompositionMistake=function(){if(!currentComposition)return;if(currentComposition.type==="pattern"){if(!weakCards.includes(currentComposition.source))weakCards.push(currentComposition.source);patternMistakeCounts[currentComposition.source]=(patternMistakeCounts[currentComposition.source]||0)+1;}else if(currentComposition.type==="idiom"){if(!weakIdioms.includes(currentComposition.source))weakIdioms.push(currentComposition.source);idiomMistakeCounts[currentComposition.source]=(idiomMistakeCounts[currentComposition.source]||0)+1;}else{if(!weakWords.includes(currentComposition.source))weakWords.push(currentComposition.source);mistakeCounts[currentComposition.source]=(mistakeCounts[currentComposition.source]||0)+1;}saveAll();showCompositionAnswer();}
function quizItems(mode="mix"){
 const ws=words.map(w=>({type:"word",key:w.word,category:w.category,front:w.word,zhuyin:w.zhuyin,meaning:w.meaning,audio:w.word,note:w.note,example:w.example,exampleZhuyin:w.exampleZhuyin,score:score(w)}));
 const ps=patterns.map(p=>({type:"pattern",key:p.pattern,category:p.category,front:p.pattern,zhuyin:p.zhuyin,meaning:p.meaning,audio:p.example,note:p.note,example:p.example,exampleZhuyin:p.exampleZhuyin,score:patternScore(p)}));
 const is=idioms.map(i=>({type:"idiom",key:i.text,category:i.category,front:i.text,zhuyin:i.zhuyin,meaning:i.meaning,audio:i.text,note:i.note,example:i.text,exampleZhuyin:i.zhuyin,score:idiomScore(i)}));
 return mode==="word"?ws:mode==="pattern"?ps:mode==="idiom"?is:[...ws,...ps,...is];
}
startQuiz=function(mode="mix"){
 const all=quizItems(mode), pool=[...all].sort((a,b)=>b.score-a.score||Math.random()-.5);const q=pickFromQueue(`quiz-${mode}`,pool,x=>`${x.type}:${x.key}`)||pool[0];if(!q)return;
 let ans=[q.meaning];while(ans.length<Math.min(4,all.length)){const r=all[Math.floor(Math.random()*all.length)].meaning;if(!ans.includes(r))ans.push(r);}ans.sort(()=>Math.random()-.5);currentQuiz=q;quizRuns++;saveAll();
 document.getElementById("quizArea").innerHTML=`<div class="quiz-card"><span class="tag">${typeLabel(q.type)}：${q.category}</span><div class="word">${q.front}</div><div class="zhuyin">${q.zhuyin}</div><div class="audio-row">${audioButton(q.audio,"🔊 音声")}</div><p class="hint">この意味はどれ？</p><div class="quiz-options">${ans.map(a=>`<button onclick="checkAnswer('${a.replace(/'/g,"\\'")}')">${a}</button>`).join("")}</div><div id="quizResult"></div></div>`;if(shouldAutoSpeak())speakText(q.audio);
}
checkAnswer=function(a){if(!currentQuiz)return;const q=currentQuiz,result=document.getElementById("quizResult");if(a===q.meaning){result.innerHTML=`<div class="quiz-result"><span class="correct">⭕ 正解！</span><br>${q.example||q.front}<br>${q.exampleZhuyin||q.zhuyin}<div class="audio-row">${audioButton(q.audio,"🔊 音声")}</div></div>`;}else{if(q.type==="pattern"){if(!weakCards.includes(q.key))weakCards.push(q.key);patternMistakeCounts[q.key]=(patternMistakeCounts[q.key]||0)+1;}else if(q.type==="idiom"){if(!weakIdioms.includes(q.key))weakIdioms.push(q.key);idiomMistakeCounts[q.key]=(idiomMistakeCounts[q.key]||0)+1;}else{if(!weakWords.includes(q.key))weakWords.push(q.key);mistakeCounts[q.key]=(mistakeCounts[q.key]||0)+1;}saveAll();result.innerHTML=`<div class="quiz-result"><span class="wrong">❌ 不正解</span><br>正解：${q.meaning}<br>${q.note||""}</div>`;}}
const v54SearchWords=searchWords;
searchWords=function(){let k=document.getElementById("searchInput").value.trim().replace(/^#/,"");let results=document.getElementById("searchResults");if(!k){results.innerHTML="";return;}let wm=words.filter(i=>[i.category,i.word,i.zhuyin,i.meaning,i.note,i.example,i.exampleZhuyin,i.confuse,getWordTags(i).join(" ")].some(x=>(x||"").includes(k)));let pm=patterns.filter(i=>[i.category,i.pattern,i.zhuyin,i.meaning,i.note,i.example,i.exampleZhuyin,getPatternTags(i).join(" ")].some(x=>(x||"").includes(k)));let im=idioms.filter(i=>[i.category,i.text,i.zhuyin,i.meaning,i.note,getIdiomTags(i).join(" ")].some(x=>(x||"").includes(k)));results.innerHTML=(wm.length||pm.length||im.length)?[...wm.map(createWordCard),...pm.map(createPatternCard),...im.map(createIdiomCard)].join(""):'<div class="empty">找不到耶 🥲</div>';}
window.addEventListener("load",()=>{renderIdiomTagButtons();renderIdiomList(idioms);updateStats();});

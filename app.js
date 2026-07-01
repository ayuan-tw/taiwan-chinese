let favorites=JSON.parse(localStorage.getItem("favorites")||"[]");
let weakWords=JSON.parse(localStorage.getItem("weakWords")||"[]");
let mistakeCounts=JSON.parse(localStorage.getItem("mistakeCounts")||"{}");
let quizRuns=Number(localStorage.getItem("quizRuns")||localStorage.getItem("quizCount")||"0");
let currentQuiz=null;

// Ver.3.4: 1周するまで重複しないランダム山札
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
  let queue=queueName==="quiz"?quizQueue:compositionQueues[queueName];
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
  return `<div class="card"><div class="card-top"><div class="tag">${item.category}</div><button class="small star" onclick="toggleFavorite('${escapeWordText(item.word)}')">${star}</button></div><div class="word">${item.word}</div><div class="zhuyin">${item.zhuyin}</div><div class="meaning">${item.meaning}</div><div class="tag-row top-tags">${topTags}</div><button class="mobile-more" onclick="toggleCard(this)">例文・忘れやすい理由を見る</button><div class="details"><div class="example">${item.example}<br><span style="color:#666">${item.exampleZhuyin}</span><br><span class="note">${item.note}</span></div><div class="confuse">⚠️ ${item.confuse||item.note}</div><div class="tag-row">${tags}</div><span class="priority">復習優先度：${score(item)} / 忘れた回数：${mistakeCounts[item.word]||0}</span></div></div>`;
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
function startQuiz(){let pool=[...words].sort((a,b)=>score(b)-score(a)||Math.random()-.5);let q=(Math.random()<.5&&pool.some(w=>score(w)>0))?pool.find(w=>score(w)>0):words[Math.floor(Math.random()*words.length)];let ans=[q.meaning];while(ans.length<4){let r=words[Math.floor(Math.random()*words.length)].meaning;if(!ans.includes(r))ans.push(r);}ans.sort(()=>Math.random()-.5);currentQuiz=q;quizRuns++;saveAll();document.getElementById("quizArea").innerHTML=`<div class="quiz-card"><span class="tag">${q.category}</span><div class="word">${q.word}</div><div class="zhuyin">${q.zhuyin}</div><p class="hint">この意味はどれ？</p><div class="quiz-options">${ans.map(a=>`<button onclick="checkAnswer('${a.replace(/'/g,"\\'")}')">${a}</button>`).join("")}</div><div id="quizResult"></div></div>`;}
function checkAnswer(a){if(!currentQuiz)return;let result=document.getElementById("quizResult");if(a===currentQuiz.meaning){result.innerHTML=`<div class="quiz-result"><span class="correct">⭕ 正解！</span><br>${currentQuiz.example}<br>${currentQuiz.exampleZhuyin}</div>`;}else{if(!weakWords.includes(currentQuiz.word))weakWords.push(currentQuiz.word);mistakeCounts[currentQuiz.word]=(mistakeCounts[currentQuiz.word]||0)+1;saveAll();result.innerHTML=`<div class="quiz-result"><span class="wrong">❌ 不正解</span><br>正解：${currentQuiz.meaning}<br>${currentQuiz.example}<br>${currentQuiz.exampleZhuyin}<br>⚠️ ${currentQuiz.confuse||currentQuiz.note}</div>`;}}
function clearQuiz(){document.getElementById("quizArea").innerHTML="";currentQuiz=null;}
function renderPhrases(){document.getElementById("phraseList").innerHTML=phrases.map(p=>`<div class="phrase-card"><div class="phrase-main">${p.text}</div><div class="phrase-sub">${p.zhuyin}</div><div class="phrase-meaning">${p.meaning}</div></div>`).join("");}
function refresh(){renderWordList(words);searchWords();}
window.addEventListener("load",()=>{renderCategoryButtons();renderTagButtons();renderWordList();renderPhrases();pickPriorityWords();updateStats();});

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
  return `<div class="card pattern-card"><div class="card-top"><div class="tag">${item.category}</div><button class="small star" onclick="toggleWeakPattern('${escapeWordText(item.pattern)}')">${weak}</button></div><div class="word">${item.pattern}</div><div class="zhuyin">${item.zhuyin}</div><div class="meaning">${item.meaning}</div><div class="tag-row top-tags">${top}</div><button class="mobile-more" onclick="toggleCard(this)">例文・瞬間作文を見る</button><div class="details"><div class="example">${item.example}<br><span style="color:#666">${item.exampleZhuyin}</span><br><span class="note">${item.note}</span></div><div class="confuse">⚡ 瞬間作文候補</div><ol class="prompt-list">${promptList}</ol><div class="tag-row">${tags}</div><span class="priority">復習優先度：${patternScore(item)} / 間違えた回数：${patternMistakeCounts[item.pattern]||0}</span></div></div>`;
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
  document.getElementById("compositionResult").innerHTML=`<div class="quiz-result"><span class="correct">答え</span>${user?`<br><span class="note">你的答案：</span><br><div class="user-answer">${user}</div>`:""}<br><div class="word">${currentComposition.answer}</div><div class="zhuyin">${currentComposition.zhuyin}</div><span class="note">型：${currentComposition.source}</span></div>`;
}
function checkCompositionAnswer(){
  if(!currentComposition)return;
  const user=getCompositionInput();
  const result=document.getElementById("compositionResult");
  if(!user){result.innerHTML=`<div class="quiz-result"><span class="wrong">まだ入力されてないよ</span><br>キーボード入力でも🎤音声入力でもOK。</div>`;return;}
  const ok=normalizeCompositionText(user)===normalizeCompositionText(currentComposition.answer);
  if(ok){
    result.innerHTML=`<div class="quiz-result"><span class="correct">⭕ ぴったり！</span><br><div class="user-answer">${user}</div><div class="zhuyin">${currentComposition.zhuyin}</div><span class="note">この調子で次いこー</span></div>`;
  }else{
    result.innerHTML=`<div class="quiz-result"><span class="wrong">△ 答えと違うかも</span><br><span class="note">你的答案：</span><br><div class="user-answer">${user}</div><br><span class="note">參考答案：</span><br><div class="word">${currentComposition.answer}</div><div class="zhuyin">${currentComposition.zhuyin}</div><div class="button-row score-row"><button onclick="markCompositionCorrect()">これでOKにする</button><button class="secondary" onclick="markCompositionMistake()">苦手にする</button></div></div>`;
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

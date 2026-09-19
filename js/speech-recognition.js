// 澄詞 Ver.6.9.1: 台湾華語の音声認識・文字起こし・お手本比較
(function(){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognition=null;
  let isListening=false;
  let finalTranscript="";
  let latestTranscript="";
  let targetText="";

  function escapeHtml(value){
    return String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }

  function normalizeText(value){
    return Array.from(String(value||"").normalize("NFKC"))
      .filter(char=>/[\p{Script=Han}A-Za-z0-9]/u.test(char));
  }

  function alignText(expected,actual){
    const a=normalizeText(expected),b=normalizeText(actual);
    const rows=a.length+1,cols=b.length+1;
    const table=Array.from({length:rows},()=>new Uint16Array(cols));
    for(let i=1;i<rows;i++){
      for(let j=1;j<cols;j++){
        table[i][j]=a[i-1]===b[j-1]?table[i-1][j-1]+1:Math.max(table[i-1][j],table[i][j-1]);
      }
    }
    const expectedMatches=new Set(),actualMatches=new Set();
    let i=a.length,j=b.length;
    while(i>0&&j>0){
      if(a[i-1]===b[j-1]){
        expectedMatches.add(i-1);actualMatches.add(j-1);i--;j--;
      }else if(table[i-1][j]>=table[i][j-1])i--;
      else j--;
    }
    const denominator=Math.max(a.length,b.length,1);
    return {a,b,expectedMatches,actualMatches,score:Math.round((table[a.length][b.length]/denominator)*100)};
  }

  function getElements(){
    return {
      panel:document.getElementById("speechPracticePanel"),
      target:document.getElementById("speechPracticeTarget"),
      status:document.getElementById("speechPracticeStatus"),
      transcript:document.getElementById("speechPracticeTranscript"),
      result:document.getElementById("speechPracticeResult"),
      start:document.getElementById("speechPracticeStart"),
      stop:document.getElementById("speechPracticeStop"),
      support:document.getElementById("speechRecognitionSupport")
    };
  }

  function setListeningState(listening){
    isListening=listening;
    const {start,stop}=getElements();
    if(start)start.disabled=listening;
    if(stop)stop.disabled=!listening;
  }

  function setStatus(message,className="note"){
    const {status}=getElements();
    if(status)status.innerHTML=`<span class="${className}">${escapeHtml(message)}</span>`;
  }

  function setTarget(value){
    targetText=String(value||"").trim();
    const {target}=getElements();
    if(target){
      target.textContent=targetText||"お手本なし（自由に文字起こし）";
      target.classList.toggle("is-empty",!targetText);
    }
  }

  function renderTranscript(value,isInterim=false){
    const {transcript}=getElements();
    if(!transcript)return;
    transcript.innerHTML=value
      ?`<span class="speech-transcript-label">${isInterim?"認識中":"認識結果"}</span><strong lang="zh-Hant-TW">${escapeHtml(value)}</strong>`
      :'<span class="speech-transcript-placeholder">ここに文字起こし結果が出ます</span>';
  }

  function renderComparison(value){
    const {result}=getElements();
    if(!result)return;
    if(!targetText){
      result.innerHTML='<div class="speech-compare-note">お手本なしのため、文字起こし結果だけを表示しています。</div>';
      return;
    }
    const aligned=alignText(targetText,value);
    const expectedHtml=aligned.a.map((char,index)=>`<span class="${aligned.expectedMatches.has(index)?"speech-match":"speech-miss"}">${escapeHtml(char)}</span>`).join("");
    const actualHtml=aligned.b.map((char,index)=>`<span class="${aligned.actualMatches.has(index)?"speech-match":"speech-extra"}">${escapeHtml(char)}</span>`).join("");
    const scoreClass=aligned.score>=90?"speech-score-good":aligned.score>=70?"speech-score-mid":"speech-score-low";
    result.innerHTML=`<div class="speech-score ${scoreClass}"><strong>${aligned.score}%</strong><span>文字一致度</span></div><div class="speech-compare-grid"><div><span>お手本</span><p lang="zh-Hant-TW">${expectedHtml||"—"}</p></div><div><span>認識結果</span><p lang="zh-Hant-TW">${actualHtml||"—"}</p></div></div><div class="speech-compare-legend"><span><i class="speech-match"></i>一致</span><span><i class="speech-miss"></i>抜け・違い</span><span><i class="speech-extra"></i>余分</span></div><p class="speech-compare-note">文字一致度は、音声認識がどの字として聞き取ったかの目安です。発音や声調そのものの採点ではありません。</p>`;
  }

  function errorMessage(code){
    const messages={
      "not-allowed":"マイクの利用が許可されていません。ブラウザの設定で澄詞のマイクを許可してね。",
      "service-not-allowed":"この環境では音声認識サービスを利用できません。",
      "audio-capture":"マイクを利用できませんでした。ほかのアプリが使用中でないか確認してね。",
      "no-speech":"音声を聞き取れませんでした。もう一度、マイクに近づいて読んでみてね。",
      "network":"音声認識の通信でエラーが起きました。ネット接続を確認してね。",
      "language-not-supported":"台湾華語（zh-TW）の音声認識が利用できません。"
    };
    return messages[code]||`音声認識でエラーが起きました（${code||"不明"}）。`;
  }

  function startRecognition(value){
    if(!Recognition){setStatus("このブラウザは音声認識に対応していません。","wrong");return;}
    if(isListening&&recognition){recognition.abort();}
    if(typeof value==="string")setTarget(value);
    else if(!targetText){
      const freeText=document.getElementById("freeSpeakText");
      setTarget(freeText?freeText.value:"");
    }
    if(typeof stopSpeech==="function")stopSpeech({resume:false});
    setStatus("マイクを準備中…「聞いています」が出てから読んでね。");
    finalTranscript="";latestTranscript="";
    renderTranscript("");
    const {result}=getElements();
    if(result)result.innerHTML="";
    const session=new Recognition();
    recognition=session;
    session.lang="zh-TW";
    session.continuous=false;
    session.interimResults=true;
    session.maxAlternatives=1;
    session.onstart=()=>{if(recognition!==session)return;setListeningState(true);setStatus("🎙 聞いています。台湾華語で読んでね。","correct");};
    session.onresult=event=>{
      if(recognition!==session)return;
      let interim="";
      for(let index=event.resultIndex;index<event.results.length;index++){
        const piece=event.results[index][0].transcript;
        if(event.results[index].isFinal)finalTranscript+=piece;
        else interim+=piece;
      }
      latestTranscript=(finalTranscript||interim).trim();
      renderTranscript(latestTranscript,!!interim&&!finalTranscript);
    };
    session.onerror=event=>{
      if(recognition!==session)return;
      if(event.error!=="aborted")setStatus(errorMessage(event.error),"wrong");
    };
    session.onend=()=>{
      if(recognition!==session)return;
      setListeningState(false);
      const text=(finalTranscript||latestTranscript).trim();
      if(text){
        renderTranscript(text,false);renderComparison(text);setStatus("文字起こしできたよ。お手本との違いも確認してみてね。","correct");
      }else if(!getElements().status?.querySelector(".wrong"))setStatus("音声を認識できませんでした。もう一度試してみてね。","wrong");
    };
    try{session.start();}
    catch(error){setListeningState(false);setStatus("音声認識を開始できませんでした。少し待ってからもう一度試してね。","wrong");}
  }

  function openPractice(encoded){
    const value=decodeURIComponent(encoded||"");
    if(typeof showTab==="function")showTab("pronunciation");
    setTarget(value);
    const freeText=document.getElementById("freeSpeakText");
    if(freeText&&value){freeText.value=value;if(typeof saveFreeSpeakText==="function")saveFreeSpeakText();}
    const {panel}=getElements();
    if(panel)setTimeout(()=>panel.scrollIntoView({behavior:"smooth",block:"start"}),50);
    startRecognition(value);
  }

  function startFromFreeText(){
    const freeText=document.getElementById("freeSpeakText");
    setTarget(freeText?freeText.value:"");
    startRecognition(targetText);
  }

  function stopRecognition(){
    if(recognition&&isListening){recognition.stop();setStatus("認識を終了しています…");}
  }

  function releaseForPlayback(){
    const session=recognition;
    recognition=null;
    setListeningState(false);
    if(session){
      try{session.abort();}catch(error){}
      return true;
    }
    return false;
  }

  function clearRecognition(){
    if(recognition&&isListening)recognition.abort();
    recognition=null;setListeningState(false);finalTranscript="";latestTranscript="";targetText="";
    setTarget("");renderTranscript("");
    const {result,status}=getElements();
    if(result)result.innerHTML="";
    if(status)status.textContent="";
  }

  function practiceButton(text,label="🎙 読む"){
    const value=String(text||"").trim();
    if(!Recognition||!value)return "";
    const encoded=encodeURIComponent(value).replace(/'/g,"%27");
    return `<button class="secondary small speech-practice-btn" onclick="openSpeechPractice('${encoded}')">${escapeHtml(label)}</button>`;
  }

  function init(){
    const {support,start,stop}=getElements();
    if(support){
      support.textContent=Recognition?"このブラウザでは音声認識を利用できます。":"このブラウザは音声認識に対応していません。Chrome／Edge、または対応するSafariで開いてね。";
      support.classList.toggle("is-unsupported",!Recognition);
    }
    if(start)start.disabled=!Recognition;
    if(stop)stop.disabled=true;
    setTarget("");renderTranscript("");
  }

  window.speechPracticeButton=practiceButton;
  window.openSpeechPractice=openPractice;
  window.startSpeechPracticeFromFreeText=startFromFreeText;
  window.stopSpeechRecognition=stopRecognition;
  window.clearSpeechRecognition=clearRecognition;
  window.releaseSpeechRecognitionForPlayback=releaseForPlayback;
  window.CHENGCI_SPEECH_RECOGNITION={supported:!!Recognition,normalizeText,alignText,start:startRecognition};
  window.addEventListener("load",init);
})();

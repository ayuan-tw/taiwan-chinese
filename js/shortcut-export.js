// Ver.6.8.0: iPhoneショートカット向けテキスト書き出し
(function(){
  const DELIMITER="｜";

  function cleanField(value){
    return String(value??"").replace(/[\r\n｜]+/g," ").trim();
  }

  function exportLine(chinese,zhuyin,japanese){
    return [chinese,zhuyin,japanese].map(cleanField).join(DELIMITER);
  }

  function wordRecord(item){
    return {
      type:"word", chinese:item.word, zhuyin:item.zhuyin, japanese:item.meaning,
      tags:item.tags||[], category:item.category, priority:typeof score==="function"?score(item):0,
      examples:item.example?[{chinese:item.example,zhuyin:item.exampleZhuyin,japanese:"例文"}]:[]
    };
  }

  function patternRecord(item){
    const prompts=(item.prompts||[]).map(prompt=>({chinese:prompt.answer,zhuyin:prompt.zhuyin,japanese:prompt.ja}));
    const examples=prompts.length?prompts:(item.example?[{chinese:item.example,zhuyin:item.exampleZhuyin,japanese:"例文"}]:[]);
    return {
      type:"pattern", chinese:item.pattern, zhuyin:item.zhuyin, japanese:item.meaning,
      tags:item.tags||[], category:item.category, priority:typeof patternScore==="function"?patternScore(item):0,
      examples
    };
  }

  function idiomRecord(item){
    return {
      type:"idiom", chinese:item.text, zhuyin:item.zhuyin, japanese:item.meaning,
      tags:item.tags||[], category:item.category, priority:typeof idiomScore==="function"?idiomScore(item):0,
      examples:[]
    };
  }

  function habitRecord(item){
    const examples=[];
    if(item.example)examples.push({chinese:item.example,zhuyin:item.exampleZhuyin,japanese:"例文"});
    for(const variant of item.variants||[]){
      examples.push({chinese:variant.text,zhuyin:variant.zhuyin,japanese:variant.label||"言い換え"});
      if(variant.example)examples.push({chinese:variant.example,zhuyin:variant.exampleZhuyin,japanese:`${variant.label||"言い換え"}の例文`});
    }
    return {type:"habit",chinese:item.primary,zhuyin:item.zhuyin,japanese:item.ja,tags:[item.category,"口ぐせ"],category:item.category,priority:0,examples};
  }

  function normalRecords(){
    return [...words.map(wordRecord),...patterns.map(patternRecord),...idioms.map(idiomRecord)];
  }

  function uniqueSorted(values){
    return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"ja"));
  }

  function option(value,label){
    return `<option value="${escapeHtml(String(value))}">${escapeHtml(String(label))}</option>`;
  }

  function renderShortcutExportOptions(){
    const scope=document.getElementById("shortcutExportScope");
    const detail=document.getElementById("shortcutExportDetail");
    const label=document.getElementById("shortcutExportDetailLabel");
    if(!scope||!detail||!label)return;
    const previous=detail.value;
    let options=[];
    if(scope.value==="tag"){
      label.firstChild.textContent="タグ ";
      options=uniqueSorted(normalRecords().flatMap(item=>item.tags)).map(tag=>[tag,`#${tag}`]);
    }else if(scope.value==="priority"){
      label.firstChild.textContent="優先度 ";
      options=[[1,"1以上"],[3,"3以上"],[5,"5以上"],[8,"8以上"]];
    }else if(scope.value==="habit"){
      label.firstChild.textContent="分類 ";
      options=[["all",`すべて（${habits.length}件）`],...uniqueSorted(habits.map(item=>item.category)).map(category=>[category,category])];
    }else{
      label.firstChild.textContent="分類 ";
      options=[["all",`すべて（${patterns.length}件）`],...uniqueSorted(patterns.map(item=>item.category)).map(category=>[category,category])];
    }
    detail.innerHTML=options.map(([value,text])=>option(value,text)).join("");
    if(options.some(([value])=>String(value)===previous))detail.value=previous;
  }

  function selectedShortcutExportRecords(scopeValue,detailValue){
    if(scopeValue==="habit"){
      return habits.filter(item=>detailValue==="all"||item.category===detailValue).map(habitRecord);
    }
    if(scopeValue==="pattern"){
      return patterns.filter(item=>detailValue==="all"||item.category===detailValue).map(patternRecord);
    }
    const records=normalRecords();
    if(scopeValue==="priority"){
      const minimum=Number(detailValue)||1;
      return records.filter(item=>item.priority>=minimum).sort((a,b)=>b.priority-a.priority||a.chinese.localeCompare(b.chinese,"zh-Hant-TW"));
    }
    return records.filter(item=>item.tags.includes(detailValue));
  }

  function formatShortcutExport(records,includeExamples=false){
    const lines=[];
    for(const record of records){
      lines.push(exportLine(record.chinese,record.zhuyin,record.japanese));
      if(includeExamples){
        for(const example of record.examples||[])lines.push(exportLine(example.chinese,example.zhuyin,example.japanese));
      }
    }
    return lines.join("\n");
  }

  function buildShortcutExportText(){
    const scope=document.getElementById("shortcutExportScope");
    const detail=document.getElementById("shortcutExportDetail");
    const output=document.getElementById("shortcutExportOutput");
    const summary=document.getElementById("shortcutExportSummary");
    if(!scope||!detail||!output||!summary)return "";
    const records=selectedShortcutExportRecords(scope.value,detail.value);
    const includeExamples=Boolean(document.getElementById("shortcutExportExamples")?.checked);
    const text=formatShortcutExport(records,includeExamples);
    output.value=text;
    const lineCount=text?text.split("\n").length:0;
    summary.classList.toggle("is-empty",records.length===0);
    summary.innerHTML=records.length?`<div>${records.length}件を書き出し（${lineCount}行）</div><div class="study-scope-counts"><span>中文｜注音｜日本語</span>${includeExamples?"<span>例文・具体例あり</span>":""}</div>`:"<div>条件に合う項目がありません</div>";
    setShortcutExportStatus("");
    return text;
  }

  function currentExportText(){
    return document.getElementById("shortcutExportOutput")?.value||buildShortcutExportText();
  }

  function setShortcutExportStatus(message,ok=false){
    const status=document.getElementById("shortcutExportStatus");
    if(!status)return;
    status.textContent=message;
    status.classList.toggle("ok",Boolean(ok));
  }

  async function copyShortcutExport(){
    const text=currentExportText();
    if(!text){setShortcutExportStatus("書き出す項目がありません。");return;}
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
      else{
        const output=document.getElementById("shortcutExportOutput");output.focus();output.select();
        if(!document.execCommand("copy"))throw new Error("copy failed");
      }
      setShortcutExportStatus("コピーしました。ショートカットへ貼り付けられます。",true);
    }catch(error){setShortcutExportStatus("コピーできませんでした。テキストを選択してコピーしてください。");}
  }

  async function shareShortcutExport(){
    const text=currentExportText();
    if(!text){setShortcutExportStatus("書き出す項目がありません。");return;}
    if(!navigator.share){await copyShortcutExport();setShortcutExportStatus("共有に未対応のため、代わりにコピーしました。",true);return;}
    try{await navigator.share({title:"澄詞 ショートカット用データ",text});setShortcutExportStatus("共有しました。",true);}
    catch(error){if(error?.name!=="AbortError")setShortcutExportStatus("共有できませんでした。");}
  }

  function downloadShortcutExport(){
    const text=currentExportText();
    if(!text){setShortcutExportStatus("書き出す項目がありません。");return;}
    const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    const stamp=new Date().toISOString().slice(0,10).replaceAll("-","");
    link.href=url;link.download=`chengci-shortcut-${stamp}.txt`;document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);setShortcutExportStatus("テキストファイルを保存しました。",true);
  }

  window.renderShortcutExportOptions=renderShortcutExportOptions;
  window.buildShortcutExportText=buildShortcutExportText;
  window.copyShortcutExport=copyShortcutExport;
  window.shareShortcutExport=shareShortcutExport;
  window.downloadShortcutExport=downloadShortcutExport;
  window.CHENGCI_SHORTCUT_EXPORT={exportLine,formatShortcutExport,selectedShortcutExportRecords,wordRecord,patternRecord,idiomRecord,habitRecord};
  window.addEventListener("load",()=>{renderShortcutExportOptions();buildShortcutExportText();});
})();

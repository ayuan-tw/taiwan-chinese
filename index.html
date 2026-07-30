// 澄詞 Ver.6 dictionary loader
// base dictionary is loaded first. This file merges optional user overrides.
(function(){
  const empty={words:[],patterns:[],idioms:[],phrases:[]};
  const keyOf={words:'word',patterns:'pattern',idioms:'text',phrases:'text'};

  function mergeList(target, additions, key){
    if(!Array.isArray(target)||!Array.isArray(additions))return;
    const index=new Map(target.map((item,i)=>[String(item?.[key]||''),i]));
    additions.forEach(item=>{
      if(!item||!item[key])return;
      const k=String(item[key]);
      if(index.has(k)) target[index.get(k)]={...target[index.get(k)],...item};
      else { index.set(k,target.length); target.push(item); }
    });
  }

  async function loadOverride(){
    let data=empty;
    try{
      const response=await fetch(`./data/user/override.json?t=${Date.now()}`,{cache:'no-store'});
      if(response.ok)data=await response.json();
    }catch(error){ console.info('override.json is optional:',error); }
    mergeList(words,data.words,keyOf.words);
    mergeList(patterns,data.patterns,keyOf.patterns);
    if(typeof idioms!=='undefined')mergeList(idioms,data.idioms,keyOf.idioms);
    if(typeof phrases!=='undefined')mergeList(phrases,data.phrases,keyOf.phrases);
    window.CHENGCI_OVERRIDE=data;
    window.dispatchEvent(new CustomEvent('chengci-dictionary-ready',{detail:data}));
    return data;
  }
  window.chengciDictionaryReady=loadOverride();
})();

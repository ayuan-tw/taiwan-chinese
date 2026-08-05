// 澄詞 Ver.6.5 shared learning-item model
// Adds a stable common ID, type, and normalized tags without changing the
// existing words / patterns / idioms / phrases arrays used by the app.
(function(){
  const TAG_ALIASES={
    '接続':'接続詞',
    '天氣':'天気',
    '台湾旅行':'旅行'
  };
  const TAG_GROUPS=[
    {
      id:'learning',
      label:'学習メモ',
      tags:new Set(['Sランク','毎日使う','何回も忘れた','何度も質問した','声調注意','発音注意','r注意','リスニング','課題文','型候補'])
    },
    {
      id:'scene',
      label:'場面・話題',
      tags:new Set(['WOS','ゲーム','旅行','夜市','買い物','注文','店内会話','台湾生活','天気','仕事','学習','日常','会話','雑談','活動','体調'])
    },
    {
      id:'usage',
      label:'使い方',
      tags:new Set(['台湾人よく使う','カジュアル','あゆあん語録','会話進行','リアクション','驚き・ツッコミ','理解・納得','差・問題なし','返答','共感','注意'])
    },
    {id:'grammar',label:'文法・意味',tags:new Set()}
  ];

  const definitions = [
    {type:'word', list:typeof words!=='undefined'?words:[], key:'word'},
    {type:'pattern', list:typeof patterns!=='undefined'?patterns:[], key:'pattern'},
    {type:'idiom', list:typeof idioms!=='undefined'?idioms:[], key:'text'},
    {type:'phrase', list:typeof phrases!=='undefined'?phrases:[], key:'text'}
  ];

  function stableHash(value){
    let hash=2166136261;
    for(let i=0;i<value.length;i++){
      hash^=value.charCodeAt(i);
      hash=Math.imul(hash,16777619);
    }
    return (hash>>>0).toString(36).padStart(7,'0');
  }

  function normalizeTags(item){
    const source=Array.isArray(item.tags)?item.tags:[];
    return [...new Set([...source,item.category]
      .map(tag=>String(tag||'').trim())
      .filter(Boolean)
      .map(tag=>TAG_ALIASES[tag]||tag))];
  }

  function getTagGroup(tag){
    const normalized=TAG_ALIASES[String(tag||'').trim()]||String(tag||'').trim();
    if(/と/.test(normalized)||['可以能會','因為所以'].includes(normalized))return 'usage';
    const group=TAG_GROUPS.find(candidate=>candidate.tags.has(normalized));
    return group?group.id:'grammar';
  }

  function groupTags(items){
    const counts=new Map();
    items.forEach(item=>(item.tags||[]).forEach(tag=>counts.set(tag,(counts.get(tag)||0)+1)));
    return TAG_GROUPS.map(group=>({
      id:group.id,
      label:group.label,
      tags:[...counts]
        .filter(([tag])=>getTagGroup(tag)===group.id)
        .map(([tag,count])=>({tag,count}))
        .sort((a,b)=>b.count-a.count||a.tag.localeCompare(b.tag,'ja'))
    })).filter(group=>group.tags.length);
  }

  function normalizeItem(item,type,key,usedIds){
    if(!item||typeof item!=='object')return item;
    const identity=String(item[key]||'').trim();
    item.type=type;
    const baseId=String(item.id||`${type}-${stableHash(`${type}:${identity}`)}`);
    let id=baseId;
    let suffix=2;
    while(usedIds.has(id))id=`${baseId}-${suffix++}`;
    item.id=id;
    item.tags=normalizeTags(item);
    return item;
  }

  const allItems=[];
  const itemById=new Map();
  definitions.forEach(({type,list,key})=>{
    list.forEach(item=>{
      normalizeItem(item,type,key,itemById);
      itemById.set(item.id,item);
      allItems.push(item);
    });
  });

  window.CHENGCI_DATA_MODEL={
    version:2,
    allItems,
    itemById,
    tagAliases:{...TAG_ALIASES},
    tagGroups:TAG_GROUPS.map(({id,label})=>({id,label})),
    getById(id){return itemById.get(String(id));},
    filterByTag(tag){return allItems.filter(item=>item.tags.includes(tag));},
    filterByType(type){return allItems.filter(item=>item.type===type);},
    getTagGroup,
    groupTags
  };
  window.dispatchEvent(new CustomEvent('chengci-data-model-ready',{detail:window.CHENGCI_DATA_MODEL}));
})();

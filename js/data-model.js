// 澄詞 Ver.6.4 shared learning-item model
// Adds a stable common ID, type, and normalized tags without changing the
// existing words / patterns / idioms / phrases arrays used by the app.
(function(){
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
    return [...new Set([...source,item.category].map(tag=>String(tag||'').trim()).filter(Boolean))];
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
    version:1,
    allItems,
    itemById,
    getById(id){return itemById.get(String(id));},
    filterByTag(tag){return allItems.filter(item=>item.tags.includes(tag));},
    filterByType(type){return allItems.filter(item=>item.type===type);}
  };
  window.dispatchEvent(new CustomEvent('chengci-data-model-ready',{detail:window.CHENGCI_DATA_MODEL}));
})();

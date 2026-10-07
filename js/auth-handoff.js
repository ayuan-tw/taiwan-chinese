// Optional, explicit per-tab checkpoint before a full-page sign-in redirect.
// Contains cards/drafts only, never authentication tokens or cookies.
(function(root){
  'use strict';
  const KEY='chengciLoginCheckpointV1';
  function createHandoff(store,env=root){
    function storage(){if(!env.sessionStorage)throw new Error('このブラウザーではログイン前の一時保存ができません。先に端末保存をオンにするか、バックアップを保存してね。');return env.sessionStorage;}
    function validateDraft(draft){
      if(draft==null)return null;
      if(typeof draft!=='object' || Array.isArray(draft) || typeof draft.editorId!=='string' || draft.editorId.length>150 || !draft.fields || typeof draft.fields!=='object')throw new Error('入力の一時保存を読み込めませんでした。');
      const fields={};
      const limits={word:300,example:8000,zhuyin:1000,meaning:4000,exampleZhuyin:16000,note:8000,pronunciationStatus:20,category:300,confuse:4000};
      for(const [name,limit] of Object.entries(limits)){const value=draft.fields[name] || '';if(typeof value!=='string'||value.length>limit)throw new Error('入力の一時保存の形式が正しくありません。');fields[name]=value;}
      const tags=draft.fields.tags || [];if(!Array.isArray(tags)||tags.length>100||tags.some(tag=>typeof tag!=='string'||tag.length>100))throw new Error('タグの一時保存を確認できませんでした。');fields.tags=[...tags];
      let baseline=null;
      if(draft.baseline!=null){const b=draft.baseline;if(!Number.isSafeInteger(b.revision)||b.revision<0||typeof b.localVersion!=='string'||b.localVersion.length>200||typeof b.fingerprint!=='string'||b.fingerprint.length>100000||typeof b.deleted!=='boolean')throw new Error('編集前の内容を確認できませんでした。');baseline={revision:b.revision,localVersion:b.localVersion,fingerprint:b.fingerprint,deleted:b.deleted};}
      return {editorId:draft.editorId,fields,baseline};
    }
    return {
      async prepare(draft){
        await store.ready;
        const saved=storage();
        if(saved.getItem(KEY))throw new Error('前回のログイン前の一時保存が残っています。先に復元してからログインしてね。');
        const backup=store.exportBackup();
        // Already-synced records will be fetched after login. Keeping only the
        // outbox avoids importing an old cloud copy over a newer device edit.
        for(const kind of (store.getKinds?store.getKinds():['cards','progress']))for(const [id,record] of Object.entries(backup.state[kind] || {})){if(record.syncStatus==='synced')delete backup.state[kind][id];}
        const value={version:1,origin:env.location.origin,createdAt:new Date().toISOString(),backup,draft:validateDraft(draft)};
        const text=JSON.stringify(value);
        if(text.length>5*1024*1024)throw new Error('一時保存には大きすぎます。先に端末保存かバックアップを使ってね。');
        try {saved.setItem(KEY,text);if(saved.getItem(KEY)!==text)throw new Error('一時保存を確認できませんでした。');}
        catch(error){throw new Error('一時保存できませんでした。ログイン画面には移動していません。先に端末保存かバックアップを使ってね。');}
        return true;
      },
      async restore(){
        if(!env.sessionStorage)return null;
        const text=env.sessionStorage.getItem(KEY);
        if(!text)return null;
        let data;try{data=JSON.parse(text);}catch(error){throw new Error('ログイン前の一時保存を読み込めませんでした。元データは消していません。');}
        if(data.version!==1 || data.origin!==env.location.origin)throw new Error('一時保存の保存元を確認できませんでした。元データは消していません。');
        const draft=validateDraft(data.draft);
        await store.ready;
        await store.importBackup(data.backup);
        env.sessionStorage.removeItem(KEY);
        return {restored:true,draft};
      }
    };
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createHandoff,KEY};
  else root.ChengciAuthHandoff=createHandoff(root.ChengciCardStore);
})(typeof window!=='undefined'?window:globalThis);

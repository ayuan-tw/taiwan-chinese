// Optional old-origin favorites/history import. No automatic navigation or data upload.
(function(){
  'use strict';
  let lastResult=null;
  const el=id=>document.getElementById(id);
  const options=()=>({includeHistory:el('legacyIncludeHistory').checked,includePreferences:false,includeFreeText:false});
  function status(text){el('legacyMigrationStatus').textContent=text;}
  function download(data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='chengci-old-favorites-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  async function exportOld(){
    try {const data=await window.ChengciLegacyMigration.exportBackup(options());download(data);status('このURLで保存されていたお気に入りを書き出しました。元のアプリとファイルは残しておいてね。');}
    catch(error){status(error.message || '書き出しできませんでした。');}
  }
  async function importOld(event){
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(file.size>5*1024*1024)throw new Error('引き継ぎファイルは5MB以下のJSONを選んでね。');
      const data=JSON.parse(await file.text()),summary=window.ChengciLegacyMigration.inspectBackup(data);
      if(!window.confirm(`お気に入り${summary.favorites}件${options().includeHistory?'と選んだ過去の学習記録':''}を取り込みますか？元のデータは消しません。`))return;
      if(window.ChengciStudySync?.getState().enabled){
        // Shared-mode import never writes legacy localStorage on a shared PC.
        lastResult=window.ChengciLegacyMigration.prepareSharedImport(data,options());
      }else lastResult=await window.ChengciLegacyMigration.importBackup(data,options());
      el('legacyApplyImport').hidden=false;
      status('ファイルを確認しました。「反映する」でお気に入り・選んだ記録を使い始められます。');
    }catch(error){status(error.message || '引き継ぎファイルを読み込めませんでした。');}
    finally{event.target.value='';}
  }
  async function apply(){
    if(!lastResult)return;
    try{
      if(window.ChengciStudySync?.getState().enabled){
        const result=await window.ChengciStudySync.seedLegacy(lastResult.sharedSnapshot,lastResult.backupId);
        status(`共有する記録に反映しました。${result.skipped.length?'元の辞書にない項目は反映できていないので、引き継ぎファイルを残してね。':'同期待ちは、オンラインでログインすると送信されます。'}`);
        lastResult=null;el('legacyApplyImport').hidden=true;
      }else{
        if(!window.confirm('入力途中の内容やこの画面だけのカードを保存・バックアップしてから再読み込みしてください。今、再読み込みして反映しますか？'))return;
        window.location.reload();
      }
    }catch(error){status(error.message || '反映できませんでした。ファイルは残しています。');}
  }
  window.addEventListener('load',()=>{
    if(!el('legacyMigrationPanel')||!window.ChengciLegacyMigration)return;
    el('legacySourceOrigin').textContent=window.location.origin;
    el('legacyExport').addEventListener('click',exportOld);
    el('legacyImport').addEventListener('click',()=>el('legacyImportFile').click());
    el('legacyImportFile').addEventListener('change',importOld);
    el('legacyApplyImport').addEventListener('click',apply);
  });
})();

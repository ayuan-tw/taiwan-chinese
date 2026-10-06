// Private cards are overlays. Bundled dictionaries are never mutated.
(function () {
  'use strict';
  let ready = false;
  let busy = false;
  let editingId = '';
  let editingRevision = 0;
  let editingLocalVersion = '';
  let saveCopy = false;
  let originalFingerprint = '';
  let notice = '';
  let readingStatus = 'candidate';
  let lastCardSignature = '';
  let loginRequired = false;
  let authNavigating = false;
  let finishInitialLoad;
  // Consumers must wait for both device storage and the login checkpoint.
  // False means the card inventory could not be loaded authoritatively.
  const initialLoad = new Promise(resolve => { finishInitialLoad = resolve; });
  const ids = ['personalWord', 'personalExample', 'personalZhuyin', 'personalMeaning', 'personalExampleZhuyin', 'personalNote', 'personalCategory', 'personalTags', 'personalConfuse'];
  const rememberedWrites = new Map();
  const rememberedOwnAdds = new Map();
  let migrationBusy = false;
  let listView = items=>items;
  let listViewLabel = '';
  const byId = id => document.getElementById(id);
  const store = () => window.ChengciCardStore;
  const sync = () => window.ChengciCloudSync;
  const escape = value => escapeHtml(String(value || ''));
  const keyOf = item => item.id || 'word:' + item.word;
  const baseWords = () => typeof words === 'undefined' ? [] : words;
  const personalRecords = () => ready && store() ? store().list({includeDeleted:true}) : [];
  const baseItem = id => baseWords().find(item => keyOf(item) === id);

  function effectiveWords() {
    const records = new Map(personalRecords().map(item => [item.id, item]));
    if (store()?.getVocabulary?.().clientReady) return [...records.values()].filter(item=>!item.deleted).map(item=>({...item,category:item.category || '未分類',tags:item.tags || [],id:item.id,type:'word',isPersonal:true,isOverride:!!baseItem(item.id)}));
    const result = [];
    for (const item of baseWords()) {
      const id = keyOf(item);
      const overlay = records.get(id);
      records.delete(id);
      if (overlay?.deleted) continue;
      result.push({...item, ...(overlay || {}), id, type:'word', isPersonal:!!overlay, isOverride:!!overlay});
    }
    for (const item of records.values()) {
      if (!item.deleted) result.push({category:'追加した單字', tags:['自分で追加'], type:'word', ...item, isPersonal:true, isOverride:false});
    }
    return result;
  }
  function isRemembered(id) {
    const value=store()?.getShared?.('remembered',id);
    return Object.entries(value?.adds || {}).some(([actor,count])=>count>(value.removes?.[actor] || 0));
  }
  function learningWords() { return effectiveWords().filter(item=>!isRemembered(item.id)); }
  async function setRemembered(id, value) {
    if(!effectiveItem(id))throw new Error('単語を確認できません。もう一度一覧から選んでね。');
    // A gesture observes only the epoch and adds visible when it was made.
    const epoch=store().getVocabulary?.().epoch || 0;
    const observed={...(store().getShared('remembered',id)?.adds || {})};
    const previous=rememberedWrites.get(id) || Promise.resolve();
    const pending=previous.catch(()=>{}).then(async()=>{
      try {
        const proposed='remembered-'+(window.crypto?.randomUUID?.() || (Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)));
        const actor=await store().ensureStudyActorId(proposed);
        const ownKey=epoch+':'+id+':'+actor;
        if(value!==true)observed[actor]=Math.max(observed[actor] || 0,rememberedOwnAdds.get(ownKey) || 0);
        const committed=await store().updateShared(actor,[{kind:'remembered',id,active:value===true,observedAdds:observed}],{expectedEpoch:epoch});
        if(value===true)rememberedOwnAdds.set(ownKey,committed[0]?.adds?.[actor] || 0);
        render();
      } catch(error) {
        if(error.code==='vocabulary_epoch_changed')await store().archiveStudyQueue({source:'remembered-checkbox',epoch,id,value:value===true,observedAdds:observed});
        throw error;
      }
    });
    rememberedWrites.set(id,pending);
    try {await pending;} finally {if(rememberedWrites.get(id)===pending)rememberedWrites.delete(id);}
  }
  function managementExtras(item) {
    const current=store()?.get(item.id) || item;
    const id=escape(encodeURIComponent(item.id));
    return `<div class="personal-management-extra"><span class="personal-state">${escape(statusLabel(current))}</span><button class="secondary small" type="button" data-personal-${current.deleted?'restore':'delete'}="${id}">${current.deleted?'一覧に戻す':'削除する'}</button>${conflictView(current)}</div>`;
  }
  function deletedRows(items) {
    return items.map(item=>`<article class="card personal-item"><h3 lang="zh-Hant-TW">${escape(item.word || '削除された単語')}</h3><p>${escape(item.meaning)}</p>${managementExtras(item)}</article>`).join('');
  }
  function deletedItem(item) {
    const base = baseItem(item.id);
    return !item.word && base ? {...item,...base,id:item.id,deleted:true,revision:item.revision,localVersion:item.localVersion,syncStatus:item.syncStatus,conflict:item.conflict,isPersonal:true} : {...base,...item,isPersonal:true};
  }
  function effectiveItem(id) {
    return effectiveWords().find(item => item.id === id);
  }
  function formValues() {
    return {
      word:byId('personalWord').value.trim(),
      example:byId('personalExample').value.trim(),
      zhuyin:byId('personalZhuyin').value.trim(),
      meaning:byId('personalMeaning').value.trim(),
      exampleZhuyin:byId('personalExampleZhuyin').value.trim(),
      note:byId('personalNote').value.trim(),
      category:(byId('personalCategory')?.value || '').trim(),
      tags:[...new Set((byId('personalTags')?.value || '').split(/[,、\n]/).map(value=>value.trim()).filter(Boolean))],
      confuse:(byId('personalConfuse')?.value || '').trim(),
      pronunciationStatus:byId('personalReadingChecked').checked ? 'confirmed' : (byId('personalZhuyin').value.trim() ? 'candidate' : 'missing')
    };
  }
  function fingerprint() {return JSON.stringify(formValues());}
  function dirty() {return fingerprint() !== originalFingerprint;}
  function message(text, error = false) {
    notice = text;
    const area = byId('personalEditorStatus');
    if (!area) return;
    area.textContent = text;
    area.classList.toggle('personal-error', error);
  }
  function openEditor(id = '', force = false) {
    if (busy || (!force && dirty() && !window.confirm('編集中の内容を閉じますか？まだ保存されていません。'))) return false;
    const item = id ? effectiveItem(id) || {...baseItem(id), ...store()?.get(id)} : {};
    editingId = id;
    editingRevision = id ? Number(store()?.get(id)?.revision || 0) : 0;
    editingLocalVersion = id ? (store()?.get(id)?.localVersion || '') : '';
    saveCopy = false;
    byId('personalSaveCopy').hidden = true;
    if(byId('personalLoginCheckpoint'))byId('personalLoginCheckpoint').hidden=true;
    byId('personalWord').value = item.word || '';
    byId('personalExample').value = item.example || '';
    byId('personalZhuyin').value = item.zhuyin || '';
    byId('personalMeaning').value = item.meaning || '';
    byId('personalExampleZhuyin').value = item.exampleZhuyin || '';
    byId('personalNote').value = item.note || '';
    if(byId('personalCategory'))byId('personalCategory').value=item.category || '';
    if(byId('personalTags'))byId('personalTags').value=(item.tags || []).join('、');
    if(byId('personalConfuse'))byId('personalConfuse').value=item.confuse || '';
    readingStatus = item.pronunciationStatus || (id ? 'confirmed' : 'candidate');
    byId('personalReadingChecked').checked = readingStatus === 'confirmed';
    byId('personalEditorTitle').textContent = id ? 'カードを編集' : '単語を追加';
    byId('personalSave').textContent = id ? '変更を保存' : '追加する';
    byId('personalCancel').hidden = !id;
    byId('personalDetails').open = !!id;
    message(id ? 'この単語の内容を編集します。保存すると一覧・単語帳・学習で同じ内容を使います。' : '');
    originalFingerprint = fingerprint();
    return true;
  }
  function openPanel(id = '') {
    if (!ready || !openEditor(id)) return;
    showTab('home');
    byId('personalCardsPanel').scrollIntoView({behavior:'smooth',block:'start'});
    byId('personalWord').focus({preventScroll:true});
  }
  function suggest() {
    const value = formValues();
    if (!value.word) return;
    const existing = effectiveWords().find(item => item.word === value.word && item.id !== editingId);
    const convert = text => window.ChengciZhuyinLite?.convert(text) || '';
    if (!value.zhuyin) {
      byId('personalZhuyin').value = existing?.zhuyin || convert(value.word);
      readingStatus = 'candidate';
      byId('personalReadingChecked').checked = false;
    }
    if (!value.meaning && existing?.meaning) byId('personalMeaning').value = existing.meaning;
    if (value.example && !value.exampleZhuyin) byId('personalExampleZhuyin').value = existing?.example === value.example ? (existing.exampleZhuyin || convert(value.example)) : convert(value.example);
    if (!value.note && existing?.example === value.example && existing.note) byId('personalNote').value = existing.note;
    if (byId('personalZhuyin').value.includes('□') || byId('personalExampleZhuyin').value.includes('□')) {
      message('□ の字は辞書で読みを見つけられませんでした。注音はあとから直せます。');
    } else {
      message(existing?.meaning ? '注音と、既存カードの意味を候補に入れました。今回の文脈に合うか確認してね。' : '注音の候補を入れました。新しい語の日本語の意味は、あとから入力できます。');
    }
  }
  function lockForm(locked) {
    byId('personalCardForm').querySelectorAll('input,textarea,button').forEach(element=>{element.disabled=locked;});
  }
  async function save(event) {
    event?.preventDefault();
    if (!ready || busy) return;
    const before = formValues();
    if (!before.word) {message('覚えたい単語を入力してね。', true);byId('personalWord').focus();return;}
    if (!byId('personalCardForm').reportValidity()) return;
    busy = true;
    byId('personalSave').disabled = true;
    lockForm(true);
    try {
      suggest();
      const fields = formValues();
      if (!editingId && !saveCopy) {
        const duplicate = effectiveWords().find(item => item.word === fields.word && item.example === fields.example);
        if (duplicate) {
          if(!(byId('personalCategory')?.value || '').trim())fields.category=duplicate.category || '';
          if(!(byId('personalTags')?.value || '').trim())fields.tags=[...(duplicate.tags || [])];
          if(!(byId('personalConfuse')?.value || '').trim())fields.confuse=duplicate.confuse || '';
          const differs = ['zhuyin','meaning','exampleZhuyin','note','category','tags','confuse'].some(key=>String(fields[key] || '') !== String(duplicate[key] || ''));
          if (!differs) {message('同じ単語・例文のカードは登録済みです。入力内容はそのまま残しています。');return;}
          if (!window.confirm('同じ単語・例文のカードがあります。今の入力をそのカードに反映して保存しますか？')) {message('入力内容は残しています。下のカードを確認してから保存してね。');return;}
          editingId = duplicate.id;
          const current = store().get(editingId);
          editingRevision = Number(current?.revision || 0);
          editingLocalVersion = current?.localVersion || '';
        }
      }
      const saved = await store().save({...fields, ...(!saveCopy && editingId ? {id:editingId} : {})}, {expectedRevision:saveCopy ? 0 : editingRevision, expectedLocalVersion:saveCopy ? '' : editingLocalVersion});
      if (fingerprint() !== JSON.stringify(fields)) {
        editingId = saved.id;editingRevision=Number(saved.revision || 0);editingLocalVersion=saved.localVersion || '';saveCopy=false;
        originalFingerprint=JSON.stringify(fields);
        byId('personalEditorTitle').textContent='カードを編集';byId('personalSave').textContent='変更を保存';byId('personalCancel').hidden=false;
        message('保存しました。保存中に入力された変更は、そのまま残しています。続けて保存できます。');render();return;
      }
      const word = fields.word;
      busy = false;
      openEditor('', true);
      const state = store().getState();
      message(state.persistence === 'device' ? `「${word}」をこの端末に保存しました。同期の状態は下で確認できます。` : `「${word}」をこの画面に保存しました。同期完了前に閉じないでね。`);
      listView=items=>items;listViewLabel='';
      byId('personalListFilter').value = 'all';
      render();
      byId('personalWord').focus({preventScroll:true});
    } catch (error) {
      message(error?.code === 'STALE_CARD' ? '編集中にカードが更新されました。入力内容は残しています。下のカードで新しい内容を確認するか、この入力を別カードとして保存してね。' : (error?.message || '保存できませんでした。入力内容は残しています。'), true);
      byId('personalSaveCopy').hidden = error?.code !== 'STALE_CARD';
    } finally {
      busy = false;
      lockForm(false);
      byId('personalSave').disabled = false;
    }
  }

  function statusLabel(item) {
    const labels = {synced:'同期済み',pending:'同期待ち',error:'同期エラー',conflict:'変更の確認が必要'};
    return item.conflict ? labels.conflict : labels[item.syncStatus] || (item.isPersonal ? '端末内のカード' : '元の辞書');
  }
  function conflictView(item) {
    if (!item.conflict) return '';
    const otherLabel = item.conflict.source === 'backup' ? 'バックアップ' : 'クラウド';
    const local = item.conflict.local?.data || item.conflict.local || item;
    const remote = item.conflict.remote?.data || item.conflict.remote || {};
    const version = (label, value) => `<div><h4>${label}</h4><p lang="zh-Hant-TW">${escape(value.word || item.word)}</p><p>${escape(value.zhuyin)}</p><p>${escape(value.meaning || '意味は未入力')}</p><p>${escape(value.example)}</p><p>${escape(value.exampleZhuyin)}</p><p>メモ：${escape(value.note || 'なし')}</p><p>分類：${escape(value.category || '未分類')}</p><p>タグ：${escape((value.tags || []).join('、') || 'なし')}</p><p>混同しやすい語：${escape(value.confuse || 'なし')}</p><p>注音：${value.pronunciationStatus === 'confirmed' ? '確認済み' : value.pronunciationStatus === 'missing' ? '未登録' : '自動候補・未確認'}</p><p class="personal-help">更新：${escape(value.updatedAt || '日時なし')}</p>${value.deleted ? '<p>削除されたカード</p>' : ''}</div>`;
    const id = escape(encodeURIComponent(item.id));
    return `<details class="personal-conflict"><summary>${item.conflict.source === 'backup' ? 'バックアップと変更が重なりました' : '別の端末と変更が重なりました'}。両方を確認する</summary><div class="personal-conflict-versions">${version('この端末の内容',local)}${version(otherLabel+'の内容',remote)}</div><p>どちらも確認してから選んでね。</p><div class="button-row"><button type="button" data-personal-resolve="local" data-id="${id}" data-conflict-token="${escape(item.conflict.comparisonToken)}">この端末の内容を使う</button><button type="button" data-personal-resolve="remote" data-id="${id}" data-conflict-token="${escape(item.conflict.comparisonToken)}">${otherLabel}の内容を使う</button><button class="secondary" type="button" data-personal-resolve="both" data-id="${id}" data-conflict-token="${escape(item.conflict.comparisonToken)}">両方を別カードで残す</button></div></details>`;
  }
  function setListView(transform,label='') {
    listView=typeof transform==='function'?transform:items=>items;
    listViewLabel=String(label || '');
    renderList();
  }
  function renderList() {
    const filter = byId('personalListFilter').value;
    const query = byId('personalListSearch').value.trim().toLowerCase();
    let items = filter === 'deleted' ? personalRecords().filter(item => item.deleted).map(deletedItem) : effectiveWords();
    if (filter !== 'deleted') items.push(...personalRecords().filter(item=>item.deleted && item.conflict).map(deletedItem));
    if (filter === 'mine') items = items.filter(item => item.isPersonal);
    if (filter === 'remembered') items=items.filter(item=>isRemembered(item.id));
    if (filter === 'unremembered') items=items.filter(item=>!isRemembered(item.id));
    items=listView(items);
    items = items.filter(item => [item.word,item.zhuyin,item.meaning,item.example,item.exampleZhuyin,item.note,item.category,item.confuse,(item.tags || []).join(' ')].some(value => String(value || '').toLowerCase().includes(query)));
    byId('personalListCount').textContent = `${listViewLabel?listViewLabel+' / ':''}${items.length}件`;
    if(typeof window.renderWordList==='function' && byId('wordList')) {
      window.renderWordList(items.filter(item=>!item.deleted));
      const deleted=items.filter(item=>item.deleted);
      if(deleted.length){if(!items.some(item=>!item.deleted))byId('wordList').innerHTML='';byId('wordList').innerHTML+=deletedRows(deleted);}
      return;
    }
    byId('personalCardList').innerHTML = items.length ? items.slice(0, 80).map(item => {
      const id = escape(encodeURIComponent(item.id));
      return `<article class="personal-item"><div class="personal-item-header"><h3 lang="zh-Hant-TW">${escape(item.word || '非表示のカード')}</h3><span class="personal-state">${escape(statusLabel(item))}</span></div><p class="zhuyin">${escape(item.zhuyin)}</p><p>${escape(item.meaning || '意味はあとから入力できます')}</p>${item.example ? `<p class="personal-item-example" lang="zh-Hant-TW">${escape(item.example)}</p>` : ''}<div class="button-row">${item.deleted ? `<button type="button" data-personal-restore="${id}">単語帳に戻す</button>` : `<button class="secondary" type="button" data-personal-edit="${id}">編集</button><button class="secondary" type="button" data-personal-delete="${id}">${baseItem(item.id) ? '単語帳から非表示' : '削除'}</button>`}</div>${conflictView(item)}</article>`;
    }).join('') + (items.length > 80 ? '<p class="hint">最初の80件を表示しています。検索で絞り込めます。</p>' : '') : '<p class="hint">この条件のカードはありません。</p>';
  }
  function renderSync() {
    if (!ready) return;
    const state = store().getState();
    const cloud = sync()?.getState() || {};
    const persistence = state.persistence === 'device';
    byId('personalRememberDevice').checked = persistence;
    byId('personalRememberDevice').disabled = cloud.status === 'connecting';
    byId('personalLocalStatus').textContent = persistence ? 'この端末に保存：オン。オフラインで追加しても次回へ残ります。' : 'この端末に保存：オフ。同期前の変更は、この画面を閉じると失われます。';
    const configured = cloud.configured === true;
    byId('personalConnect').disabled = !configured || cloud.status === 'connecting';
    byId('personalConnect').hidden = !!cloud.connected;
    byId('personalDisconnect').hidden = !cloud.connected && !cloud.logoutPending;
    byId('personalSyncRetry').hidden = !cloud.connected;
    const pending = Number(state.pendingCount || 0);
    const conflicts = Number(state.conflictCount || 0);
    let text = !configured ? 'クラウド同期は設定の準備中です。まだクラウドへ送信していません。' : cloud.connected ? `Googleログイン済み${cloud.accountEmail ? '：'+cloud.accountEmail : ''}。` : 'Googleに連携すると、この単語帳をほかの端末でも使えます。';
    if(cloud.status === 'offline') text += ' オフラインです。再接続後、澄詞を開いている間に同期します。';
    else if(cloud.status === 'syncing') text += ' 同期しています…';
    else if(cloud.status === 'connecting') text += ' Googleへの接続を確認しています…';
    if (conflicts) text += ` ${conflicts}件の変更が重なっています。カードの比較画面で選んでね。`;
    else if (pending) text += ` ${pending}件が同期待ちです。`;
    else if (cloud.connected && cloud.status === 'synced') text += ' 同期済み。';
    if (cloud.error) text += ` ${cloud.error}`;
    if (state.warning) text += ` ${state.warning}`;
    const studyState=window.ChengciStudySync?.getState();
    if(studyState?.warning)text+=' '+studyState.warning;
    if(studyState?.unsavedCount)text+=` 保存待ちの学習記録が${studyState.unsavedCount}件あります。`;
    byId('personalSyncStatus').textContent = text;
    renderVocabularyStatus(cloud);
    const progress = (state.conflicts || []).filter(item=>item.kind === 'progress');
    byId('personalProgressConflicts').innerHTML = progress.map(item=>{const word=effectiveItem(item.id)?.word || item.id;const otherLabel=item.source === 'backup' ? 'バックアップ' : 'クラウド';const label=entry=>`${entry.result === 'read' ? '読めた' : 'まだ'}・${Number(entry.attempts) || 0}回（${entry.updatedAt || '日時なし'}）`;const id=escape(encodeURIComponent(item.id));return `<details class="personal-conflict"><summary>「${escape(word)}」の練習記録が重なりました</summary><p>この端末：${escape(label(item.local))}</p><p>${otherLabel}：${escape(label(item.remote))}</p><div class="button-row"><button type="button" data-progress-resolve="local" data-id="${id}" data-conflict-token="${escape(item.comparisonToken)}">この端末の記録を使う</button><button type="button" data-progress-resolve="remote" data-id="${id}" data-conflict-token="${escape(item.comparisonToken)}">${otherLabel}の記録を使う</button></div></details>`;}).join('');
  }
  function render() {
    if (!ready) return;
    renderList();renderSync();
    const signature = JSON.stringify(effectiveWords().map(item=>[item.id,item.word,item.zhuyin,item.meaning,item.example,item.exampleZhuyin,item.note,item.pronunciationStatus,item.category,item.tags,item.confuse,isRemembered(item.id)]));
    const cardsChanged = signature !== lastCardSignature;
    lastCardSignature = signature;
    window.dispatchEvent(new CustomEvent('chengci-user-cards-changed',{detail:{cardsChanged}}));
  }
  function renderVocabularyStatus(cloud) {
    const panel=byId('vocabularySetupPanel'),status=byId('vocabularyStatus'),button=byId('vocabularyBootstrap');
    if(!panel || !status || !button)return;
    const vocabulary=cloud.vocabulary || store().getVocabulary?.() || {};
    panel.hidden=false;
    button.hidden=!!vocabulary.clientReady;
    button.disabled=migrationBusy || !cloud.connected || cloud.status==='offline';
    button.textContent=vocabulary.ready?'単語帳の準備を再試行':'単語の管理をまとめる';
    status.textContent=vocabulary.clientReady?'既存の単語も追加した単語も、同じ単語帳で管理しています。':vocabulary.ready?'共有単語帳を読み込んでいます。今ある端末の単語は残しています。':cloud.connected?'初回だけ単語の管理をまとめます。単語と編集内容は残し、お気に入り・練習記録・「覚えた」のチェックをリセットします。変更前の控えも保存します。':'Googleでログインすると、既存の単語と追加した単語をまとめられます。';
    if(migrationBusy)status.textContent='単語帳をまとめています。読み込みが終わるまで、この画面を開いておいてね。';
  }
  async function bootstrapVocabulary() {
    if(migrationBusy)return;
    const current=sync()?.getState();
    if(!current?.connected){message('先にGoogleでログインしてね。',true);return;}
    if(!current.vocabulary?.ready && !window.confirm('単語と編集内容を残して、単語の管理をまとめます。お気に入り・練習記録・「覚えた」のチェックは一度リセットし、変更前の控えを保存します。進めますか？'))return;
    migrationBusy=true;renderSync();
    try {
      await window.ChengciStudySync?.retry();
      const result=await sync().bootstrapVocabulary();
      await window.ChengciStudySync?.reconcileVocabularyEpoch?.();
      if(result.vocabulary?.clientReady)message('単語の管理をまとめました。既存の単語も一覧から編集できます。');
      else throw new Error(result.error || '単語帳の準備が終わっていません。今ある内容は残しているので、オンラインで再試行してね。');
    } catch(error){message(error?.message || '単語帳をまとめられませんでした。今ある内容は残しています。',true);}
    finally {migrationBusy=false;render();}
  }
  async function exportVocabularyArchive() {
    try {
      const value=await sync().exportVocabularyArchive();
      const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download='chengci-before-unification-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      message(value.scope==='local-and-server'?'変更前の端末・クラウドの控えを書き出しました。':'この端末の控えだけを書き出しました。クラウドの控えも含めるには、オンラインでログインしてね。');
    } catch(error){message(error?.message || '控えを書き出せませんでした。部分的なファイルは保存していません。',true);}
  }
  async function changePersistence() {
    if (busy) return;
    const wanted = byId('personalRememberDevice').checked;
    if (!wanted && !window.confirm('この端末への保存をオフにしますか？同期待ちの内容があれば、先に同期またはバックアップしてください。')) {renderSync();return;}
    try {const wasConnected=sync()?.getState().connected;if(wasConnected)await sync().disconnect();await store().setPersistence(wanted);message((wanted ? 'この端末に保存する設定にしました。共有PCではオフにしてね。' : 'この端末への保存をオフにしました。')+(wasConnected ? '新しい保存設定で同期するには、もう一度Googleで連携してね。' : ''));}
    catch(error){message(error?.message || '保存設定を変更できませんでした。',true);}
    renderSync();
  }
  async function connect() {
    const remembered = byId('personalRememberDevice').checked;
    try {await window.ChengciStudySync?.retry();await sync().connect({rememberDevice:remembered});loginRequired=false;}
    catch(error){
      if(error?.code === 'LOGIN_REQUIRED') {
        loginRequired=true;
        const state=store().getState();
        if(dirty() || (state.persistence !== 'device' && (state.pendingCount || state.conflictCount)) || window.ChengciStudySync?.getState().unsavedCount) {
          byId('personalLoginCheckpoint').hidden=false;
          message('ログイン画面へ移動する前に、入力と同期待ちの内容をこのタブに一時保存できます。戻ったら復元し、一時保存を消します。',false);
        } else {window.location.assign(sync().loginUrl({rememberDevice:remembered}));}
      } else message(error?.message || 'Google連携できませんでした。入力内容は残しています。',true);
    }
    renderSync();
  }
  async function checkpointAndLogin(){
    if(!loginRequired)return;
    try {
      await window.ChengciStudySync?.retry();
      if(window.ChengciStudySync?.getState().unsavedCount)throw new Error('保存できていない学習記録があります。先に保存エラーを解消してね。');
      await window.ChengciAuthHandoff.prepare(dirty()?{editorId:editingId,fields:formValues(),baseline:{revision:editingRevision,localVersion:editingLocalVersion,fingerprint:originalFingerprint,deleted:false}}:null);
      authNavigating=true;
      window.location.assign(sync().loginUrl({rememberDevice:byId('personalRememberDevice').checked}));
    } catch(error){authNavigating=false;message(error?.message || '一時保存できませんでした。画面は移動していません。',true);}
  }
  async function disconnect() {
    if ((store().getState().pendingCount || store().getState().conflictCount) && !window.confirm('まだ同期していない変更や確認が必要な内容があります。連携を解除しますか？先にバックアップしておくと安心です。')) return;
    try {await sync().disconnect();}catch(error){message(error?.message || '連携を解除できませんでした。',true);}
    renderSync();
  }
  async function exportBackup() {
    try {
      const data = store().exportBackup();
      const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const filename = `chengci-backup-${new Date().toISOString().slice(0,10)}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');link.href=url;link.download=filename;
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
      message('バックアップを保存しました。iPhoneでは「ファイル」のダウンロード先を確認してね。');
    } catch(error){message(error?.message || 'バックアップを保存できませんでした。',true);}
  }
  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('バックアップは5MB以下のJSONファイルを選んでね。');
      const data = JSON.parse(await file.text());
      if (!window.confirm('このバックアップを今のカードに追加・統合しますか？異なるカードは両方を残し、練習記録の違いは比較して選べます。')) return;
      await store().importBackup(data);
      message('バックアップを取り込みました。異なるカードは両方を残しました。練習記録の違いがあれば、下で比較して選んでね。');
      render();
    } catch(error){message(error?.message || 'バックアップを読み込めませんでした。',true);}
    finally {event.target.value='';}
  }
  async function handleAction(event) {
    const remembered=event.target.closest('[data-personal-remembered]');
    if(remembered){remembered.disabled=true;try{await setRemembered(decodeURIComponent(remembered.dataset.personalRemembered),remembered.dataset.remembered==='true');}catch(error){message(error?.message || '覚えた記録を保存できませんでした。',true);render();}finally{remembered.disabled=false;}return;}
    const progress = event.target.closest('[data-progress-resolve]');
    if(progress && ready) {try{const id=decodeURIComponent(progress.dataset.id);const token=progress.dataset.conflictToken || store().getConflicts().find(item=>item.kind === 'progress' && item.id === id)?.comparisonToken;await store().resolveConflict(id,progress.dataset.progressResolve,{kind:'progress',expectedComparisonToken:token});render();}catch(error){message(error?.message || '記録を更新できませんでした。',true);}return;}
    const edit = event.target.closest('[data-personal-edit]');
    if (edit) {openPanel(decodeURIComponent(edit.dataset.personalEdit));return;}
    const button = event.target.closest('[data-personal-delete],[data-personal-restore],[data-personal-resolve]');
    if (!button || busy || !ready) return;
    const kind = button.dataset.personalDelete ? 'delete' : button.dataset.personalRestore ? 'restore' : 'resolve';
    const id = decodeURIComponent(button.dataset.personalDelete || button.dataset.personalRestore || button.dataset.id);
    try {
      if (kind === 'delete') {
        const item = effectiveItem(id);
        const revision = store().get(id);
        if (!window.confirm(`「${item?.word || 'このカード'}」を単語帳から外しますか？「非表示・削除済み」から戻せます。`)) return;
        await store().remove(id,{expectedRevision:revision?.revision || 0,expectedLocalVersion:revision?.localVersion || ''});
      } else if (kind === 'restore') {
        const item = deletedItem(store().get(id));
        await store().save({...item,deleted:false},{expectedRevision:item.revision || 0,expectedLocalVersion:item.localVersion || ''});
      } else {
        const token=button.dataset.conflictToken || store().getConflicts().find(item=>item.kind === 'cards' && item.id === id)?.comparisonToken;
        await store().resolveConflict(id,button.dataset.personalResolve,{kind:'cards',expectedComparisonToken:token});
      }
      render();
    } catch(error){message(error?.message || 'カードを更新できませんでした。',true);}
  }
  async function init() {
    if (!byId('personalCardsPanel') || !store()) return;
    try {await store().ready;}catch(error){message(error?.message || 'カードを読み込めませんでした。',true);return;}
    ready = true;
    if(store().getState().blocked) {message(store().getState().warning || '保存データを読み込めませんでした。既存データは残しています。',true);renderSync();return;}
    openEditor('',true);
    byId('personalSave').disabled = false;
    byId('personalCardForm').addEventListener('submit',save);
    byId('personalSuggest').addEventListener('click',()=>{if((byId('personalZhuyin').value || byId('personalExampleZhuyin').value) && !window.confirm('入力済みの注音を辞書の候補に置き換えますか？'))return;byId('personalZhuyin').value='';byId('personalExampleZhuyin').value='';suggest();byId('personalDetails').open=true;});
    byId('personalSaveCopy').addEventListener('click',()=>{saveCopy=true;save();});
    byId('personalCancel').addEventListener('click',()=>openEditor(''));
    byId('personalWord').addEventListener('change',()=>{readingStatus='candidate';byId('personalReadingChecked').checked=false;byId('personalZhuyin').value='';});
    byId('personalExample').addEventListener('change',()=>{byId('personalExampleZhuyin').value='';});
    byId('personalZhuyin').addEventListener('input',()=>{readingStatus='candidate';byId('personalReadingChecked').checked=false;});
    byId('personalListFilter').addEventListener('change',()=>{listView=items=>items;listViewLabel='';if(typeof window.clearTagFilters==='function')window.clearTagFilters('word',false);renderList();});
    byId('personalListSearch').addEventListener('input',renderList);
    byId('personalRememberDevice').addEventListener('change',changePersistence);
    byId('personalConnect').addEventListener('click',connect);
    byId('personalLoginCheckpoint')?.addEventListener('click',checkpointAndLogin);
    byId('personalDisconnect').addEventListener('click',disconnect);
    byId('personalSyncRetry').addEventListener('click',async()=>{try{await window.ChengciStudySync?.retry();await sync().retry();}catch(error){message(error?.message || '同期を再試行できませんでした。',true);}});
    byId('personalExport').addEventListener('click',exportBackup);
    byId('personalImportFile').addEventListener('change',importBackup);
    byId('personalImport').addEventListener('click',()=>byId('personalImportFile').click());
    byId('vocabularyBootstrap')?.addEventListener('click',bootstrapVocabulary);
    byId('vocabularyArchiveExport')?.addEventListener('click',exportVocabularyArchive);
    document.addEventListener('click',handleAction);
    window.addEventListener('beforeunload',event=>{if(authNavigating)return;if(dirty() || (store().getState().persistence !== 'device' && (store().getState().pendingCount || store().getState().conflictCount))){event.preventDefault();event.returnValue='';}});
    store().subscribe(render);
    sync()?.subscribe(renderSync);
    window.ChengciStudySync?.subscribe(renderSync);
    let handoffLoaded = true;
    try {
      const restored=await window.ChengciAuthHandoff?.restore();
      if(restored){
        let stale=false;
        if(restored.draft){
          const savedDraft=restored.draft;openEditor(savedDraft.editorId,true);
          const current=store().get(savedDraft.editorId),baseline=savedDraft.baseline;
          stale=!!savedDraft.editorId && (!baseline || baseline.fingerprint!==fingerprint() || (current?.deleted || false)!==baseline.deleted);
          if(stale){editingRevision=baseline?.revision ?? -1;editingLocalVersion=baseline?.localVersion || 'unverified-handoff';}
          const draft=savedDraft.fields;
          byId('personalWord').value=draft.word;byId('personalExample').value=draft.example;byId('personalZhuyin').value=draft.zhuyin;byId('personalMeaning').value=draft.meaning;byId('personalExampleZhuyin').value=draft.exampleZhuyin;byId('personalNote').value=draft.note;if(byId('personalCategory'))byId('personalCategory').value=draft.category || '';if(byId('personalTags'))byId('personalTags').value=(draft.tags || []).join('、');if(byId('personalConfuse'))byId('personalConfuse').value=draft.confuse || '';byId('personalReadingChecked').checked=draft.pronunciationStatus==='confirmed';
          byId('personalSaveCopy').hidden=!stale;
        }
        message(stale?'入力を復元しました。ログイン中に別の変更が届いています。最新のカードを比較するか、この入力を別カードとして保存してね。':'ログイン前のカードと入力を復元しました。',stale);
      }
    }catch(error){handoffLoaded=false;message(error?.message || '一時保存を復元できませんでした。元データは残しています。',true);}
    render();
    return handoffLoaded;
  }
  window.ChengciPersonalCards = {allWords:effectiveWords,learningWords,isRemembered,setRemembered,managementExtras,setListView,refreshList:renderList,get:effectiveItem,open:openPanel,ready:initialLoad};
  window.addEventListener('load',async()=>{
    let loaded = false;
    try { loaded = await init() === true; }
    catch(error){message(error?.message || 'カードを読み込めませんでした。既存データは残しています。',true);}
    finally { finishInitialLoad(loaded); }
  });
})();

// Same-origin sync. Authentication cookies stay HttpOnly; private API data is never cached.
(function (root) {
  'use strict';
  function createSync(store, options) {
    options = options || {};
    const env = options.env || root;
    const config = options.config === undefined ? root.CHENGCI_SYNC_CONFIG : options.config;
    const enabled = config?.enabled === true && config.provider === 'cloudflare';
    const fetcher = options.fetch || (env.fetch && env.fetch.bind(env));
    const pollMs = Math.max(10000, Math.min(60000, Number(config?.pollIntervalMs) || 15000));
    let connected = false, status = enabled ? 'disconnected' : 'disabled', error = '', email = '', csrf = '';
    let generation = 0, sessionPromise = null, sessionToken = 0, principal = '', terminalError = false, idlePolls = 0, pulling = false, flushing = null, timer = null, retryMs = 2000;
    let serverConfigured = null, stopped = false, logoutPending = false, pendingLogoutToken = '', authRefreshNeeded = false;
    let vocabulary = null, bootstrapPromise = null, errorCode = '';
    const listeners = new Set(), controllers = new Set(), checkpoints = new Map();
    const online = () => env.navigator?.onLine !== false;
    const visible = () => env.document?.visibilityState !== 'hidden';
    const kinds = () => store.getKinds ? store.getKinds() : ['cards','progress'];
    function checkedVocabulary(value) {
      if (!value || ![0,1].includes(value.epoch) || value.version !== value.epoch || value.ready !== (value.version === 1)) throw new Error('単語帳の移行状態を確認できませんでした。端末の内容は残っています。');
      return { version:value.version,epoch:value.epoch,ready:value.ready,...(typeof value.backupId==='string'?{backupId:value.backupId}:{}),...(typeof value.migratedAt==='string'?{migratedAt:value.migratedAt}:{}) };
    }
    function epochFailure() { const failure=new Error('単語帳の移行状態が更新されました。再接続して確認してください。未同期の内容は残しています。');failure.code='vocabulary_epoch_changed';failure.status=409;return failure; }
    function checkResponseEpoch(result, epoch) { if(result?.epoch!==epoch)throw epochFailure(); }
    function noteFailure(caught) { errorCode=caught.code || '';if(caught.code==='vocabulary_epoch_changed')authRefreshNeeded=true; }
    function vocabularyState() {
      const local=store.getState().vocabulary || {version:0,epoch:0,ready:false,clientReady:false};
      return {...(vocabulary || local),clientReady:local.clientReady===true && (!vocabulary || (vocabulary.ready && local.epoch===vocabulary.epoch))};
    }
    function emit() {for (const fn of listeners) {try {fn(api.getState());} catch(caught) {env.console?.error(caught);}}}
    function cancelTimer() {if(timer != null){env.clearTimeout(timer);timer=null;}}
    function abortRequests() {for(const controller of controllers)controller.abort();controllers.clear();}
    function refreshStatus() {
      if(!enabled || serverConfigured === false)status='disabled';
      else if(!online())status='offline';
      else if(error)status='error';
      else if(!connected)status='login-required';
      else if(store.getState().conflictCount)status='conflict';
      else if(pulling || flushing || store.getState().pendingCount)status='syncing';
      else status='synced';
      emit();
    }
    function expired(message) {
      connected=false;email='';csrf='';generation++;cancelTimer();
      error=message || 'ログインの有効期限が切れました。カードはそのまま使えます。同期にはもう一度ログインしてね。';
      refreshStatus();
    }
    async function request(path, init) {
      if(!fetcher)throw new Error('このブラウザーでは同期に必要な通信機能を使えません。');
      const controller=env.AbortController ? new env.AbortController() : null;
      if(controller)controllers.add(controller);
      let deadline=null;
      try {
        const work=(async()=>{
          const response=await fetcher(path,{credentials:'same-origin',cache:'no-store',redirect:'error',...init,headers:{Accept:'application/json',...(init?.headers || {})},...(controller?{signal:controller.signal}:{})});
          if(!response.ok) {
            let details;try{details=await response.json();}catch(_){}
            const failure=new Error(response.status===401 ? 'ログインし直すと同期できます。端末のカードは残っています。' : response.status===403 ? '同期の権限を確認できません。カードは残っています。' : `同期できませんでした（HTTP ${response.status}）。端末の変更は残っています。`);
            failure.status=response.status;failure.code=typeof details?.error==='string'?details.error:response.status===401?'AUTH_REQUIRED':response.status===403?'FORBIDDEN':'HTTP_ERROR';
            if(failure.code==='vocabulary_epoch_changed')throw epochFailure();
            if(failure.code==='retired_learning_operation')failure.message='移行前の学習操作を停止しました。未同期の内容は端末に残しています。';
            throw failure;
          }
          if(response.status===204)return null;
          return await response.json();
        })();
        if(!env.setTimeout)return await work;
        const timeout=new Promise((resolve,reject)=>{
          deadline=env.setTimeout(()=>{controller?.abort();const failure=new Error('通信がタイムアウトしました。未同期の変更は残しています。');failure.code='NETWORK_TIMEOUT';reject(failure);},20000);
          deadline?.unref?.();
        });
        return await Promise.race([work,timeout]);
      } finally {if(deadline!=null)env.clearTimeout(deadline);if(controller)controllers.delete(controller);}
    }
    function scheduleAuthentication() {
      cancelTimer();
      if(!enabled || connected || stopped || terminalError || !error || !online() || !visible() || !env.setTimeout)return;
      const delay=retryMs;retryMs=Math.min(60000,retryMs*2);
      timer=env.setTimeout(()=>{timer=null;authenticate(false).catch(()=>{});},delay);
      timer?.unref?.();
    }
    function schedule(delay=pollMs) {
      cancelTimer();
      if(!connected || !online() || !visible() || stopped || terminalError || !env.setTimeout)return;
      timer=env.setTimeout(()=>{timer=null;api.retry().catch(()=>{});},delay);
      timer?.unref?.();
    }
    async function pull(token) {
      let received = 0;
      pulling=true;refreshStatus();
      try {
        if(!vocabulary)throw new Error('単語帳の移行状態を確認できません。');
        const epoch=vocabulary.epoch;
        if((store.getState().vocabulary?.epoch || 0)>epoch)throw epochFailure();
        const initial=vocabulary.ready && !vocabularyState().clientReady;
        const stagedKinds={}, stagedCheckpoints={};
        for(const kind of kinds()) {
          if(!/^[a-z]+$/.test(kind))throw new Error('同期対象の設定が正しくありません。');
          const checkpointKey='cloudflare|'+(env.location?.origin || '')+'|'+principal+'|epoch-'+epoch+'|'+kind;
          const staging=initial, staged=[];
          const since=staging?0:store.getSyncCheckpoint ? store.getSyncCheckpoint(checkpointKey) : (checkpoints.get(checkpointKey) || 0);
          let cursor=null, checkpoint=null;
          const seen=new Set();
          for(let page=0;page<100;page++) {
            const result=await request('/api/'+kind+'?since='+since+(checkpoint!==null?'&until='+checkpoint:'')+(cursor?'&cursor='+encodeURIComponent(cursor):''),{headers:{'X-Chengci-Epoch':String(epoch)}});
            if(token!==generation || !connected)return;
            checkResponseEpoch(result,epoch);
            if(!result || !Array.isArray(result.documents) || !Number.isSafeInteger(result.checkpoint) || result.checkpoint < since || (checkpoint!==null && result.checkpoint!==checkpoint) || (result.cursor != null && (typeof result.cursor!=='string' || !/^\d+$/.test(result.cursor))))throw new Error('同期データを確認できませんでした。端末のカードは変更していません。');
            checkpoint=result.checkpoint;
            cursor=result.cursor;
            received+=result.documents.length;
            if(staging) {
              staged.push(...result.documents);
              if(!cursor){stagedKinds[kind]=staged;stagedCheckpoints[checkpointKey]=checkpoint;}
            } else await store.applyRemote(kind,result.documents,{epoch,...(!cursor?{checkpointKey,checkpoint}:{})});
            if(!cursor){checkpoints.set(checkpointKey,checkpoint);break;}
            if(seen.has(cursor) || page===99)throw new Error('同期データのページを確認できませんでした。');
            seen.add(cursor);
          }
        }
        if(initial) {
          if(token!==generation || !connected)return;
          const cards=stagedKinds.cards || [];delete stagedKinds.cards;
          await store.adoptVocabulary(vocabulary,cards,{documentsByKind:stagedKinds,checkpoints:stagedCheckpoints});
        }
        idlePolls=received ? 0 : Math.min(2,idlePolls+1);
      } finally {pulling=false;refreshStatus();}
    }
    async function flush() {
      if(flushing)return flushing;
      if(!connected || !online() || !visible() || stopped || !vocabulary || (vocabulary.ready && !vocabularyState().clientReady) || (store.getState().vocabulary?.epoch || 0)!==vocabulary.epoch)return;
      const token=generation;
      const epoch=vocabulary.epoch;
      flushing=(async()=>{
        const failed=new Set();
        try {
          while(token===generation && connected && online() && visible() && !stopped) {
            const operation=await store.prepareNext(failed,{epoch});
            if(!operation || token!==generation || !connected)break;
            try {
              const payload={kind:operation.kind,id:operation.id,operationId:operation.operationId,baseRevision:operation.baseRevision,deleted:operation.deleted,updatedAt:operation.updatedAt,data:operation.data};
              const result=await request('/api/sync',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,'X-Chengci-Epoch':String(epoch)},body:JSON.stringify({operations:[payload]})});
              if(token!==generation || !connected)break;
              checkResponseEpoch(result,epoch);
              const reply=result?.results?.[0];
              if(!reply || result.results.length!==1 || reply.kind!==operation.kind || reply.id!==operation.id || reply.operationId!==operation.operationId || !['accepted','conflict'].includes(reply.status))throw new Error('同期の保存結果を確認できませんでした。再試行しても同じ操作は重複しません。');
              await store.applyRemote(operation.kind,[reply.document],{epoch});
              retryMs=2000;idlePolls=0;
            } catch(caught) {
              if(token!==generation)break;
              noteFailure(caught);
              failed.add(operation.kind+':'+operation.id);
              await store.markError(operation,caught.message || '同期できませんでした。');
              if(caught.status===401){expired();break;}
              error=caught.message || '通信できません。再接続後に同期できます。';
              if(caught.status===403)authRefreshNeeded=true;
              if([400,403,409,429].includes(caught.status)){terminalError=true;break;}
            }
          }
        } finally {
          flushing=null;refreshStatus();
          if(connected) {schedule(error?retryMs:pollMs*Math.pow(2,idlePolls));if(error)retryMs=Math.min(60000,retryMs*2);}
        }
      })();
      refreshStatus();return flushing;
    }
    async function authenticate(interactive) {
      if(!enabled)throw new Error('クラウド同期はまだ設定されていません。');
      if(sessionPromise && sessionToken===generation)return sessionPromise;
      if(!online()){refreshStatus();throw new Error('ログインにはネット接続が必要です。オフライン学習は続けられます。');}
      const token=++generation;sessionToken=token;
      stopped=false;terminalError=false;error='';status='connecting';emit();
      sessionPromise=(async()=>{
        try {
          await store.ready;
          if(store.getState().blocked)throw new Error(store.getState().warning);
          const setup=await request('/api/config');
          if(token!==generation)return api.getState();
          serverConfigured=setup?.enabled===true;
          if(!serverConfigured){error=setup?.reason || '';refreshStatus();return api.getState();}
          const session=await request('/api/session');
          if(token!==generation)return api.getState();
          if(session?.authenticated!==true || typeof session.user?.uid!=='string' || !session.user.uid || session.user.emailVerified!==true || typeof session.csrfToken!=='string' || !session.csrfToken)throw new Error('ログイン状態を確認できませんでした。');
          vocabulary=checkedVocabulary(session.vocabulary);errorCode='';
          connected=true;principal=session.user.uid;email=session.user.email || '';csrf=session.csrfToken;error='';authRefreshNeeded=false;logoutPending=false;pendingLogoutToken='';
          await pull(token);
          if(token===generation)await flush();
          if(!error && connected)schedule(pollMs*Math.pow(2,idlePolls));return api.getState();
        } catch(caught) {
          noteFailure(caught);
          if(token===generation) {
            if(caught.status===401){connected=false;email='';csrf='';error='';status='login-required';emit();}
            else {error=caught.message || '同期できませんでした。';terminalError=[400,403,409,429].includes(caught.status);refreshStatus();if(connected){schedule(retryMs);retryMs=Math.min(60000,retryMs*2);}else scheduleAuthentication();}
          }
          if(interactive && caught.status===401){const login=new Error('Googleでログインしてください。');login.code='LOGIN_REQUIRED';throw login;}
          if(interactive)throw caught;
          return api.getState();
        } finally {if(sessionToken===token)sessionPromise=null;}
      })();
      return sessionPromise;
    }
    const api={
      ready:null,
      getState(){return {configured:enabled && serverConfigured!==false,provider:'cloudflare',status,connected,accountEmail:email,error,errorCode,logoutPending,...store.getState(),vocabulary:vocabularyState(),migrationInProgress:!!bootstrapPromise};},
      subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
      loginUrl(opts){return '/auth/login?rememberDevice='+(opts?.rememberDevice===true?'1':'0');},
      async connect(){await api.ready;if(logoutPending)await api.disconnect();return authenticate(true);},
      async exportVocabularyArchive() {
        await api.ready;
        const archive={format:'chengci-vocabulary-recovery',schemaVersion:1,exportedAt:new Date().toISOString(),scope:'local-only',local:store.exportVocabularyArchive(),server:null};
        if(!online() || !connected){archive.reason=!online()?'offline':'not-connected';return archive;}
        const token=generation, epoch=vocabulary?.epoch || 0;
        let cursor=null, backup=null;const documents=[],seen=new Set();
        for(let page=0;page<100;page++) {
          let result;
          try { result=await request('/api/vocabulary/backup'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{headers:{'X-Chengci-Epoch':String(epoch)}}); }
          catch(caught) { if(caught.status===404 && caught.code==='backup_not_found' && page===0){archive.reason='server-backup-not-created';return archive;}throw caught; }
          if(token!==generation || !connected)throw new Error('接続が変わったため保管データの書き出しを中止しました。再試行してください。');
          const meta=result?.backup;
          if(!meta || meta.id!=='unified-words-v1' || typeof meta.createdAt!=='string' || !Number.isFinite(Date.parse(meta.createdAt)) || meta.previousEpoch!==0 || !Number.isSafeInteger(meta.documentCount) || meta.documentCount<0 || !Array.isArray(result.documents) || (result.cursor!=null && (typeof result.cursor!=='string' || !/^[1-9]\d*$/.test(result.cursor) || !Number.isSafeInteger(Number(result.cursor)) || Number(result.cursor)<=Number(cursor || 0))))throw new Error('保管データの形式を確認できませんでした。');
          const checkedMeta={id:meta.id,createdAt:meta.createdAt,previousEpoch:meta.previousEpoch,documentCount:meta.documentCount};
          if(backup && JSON.stringify(backup)!==JSON.stringify(checkedMeta))throw new Error('保管データのページが一致しません。');
          backup=checkedMeta;
          for(const item of result.documents) {
            const key=item?.kind+':'+item?.id;
            if(seen.has(key))throw new Error('保管データのページが重複しています。');
            const document=store.validateRemoteDocument(item.kind,item);seen.add(key);documents.push({kind:item.kind,...document});
          }
          if(documents.length>25000 || documents.length>backup.documentCount)throw new Error('保管データの件数を確認できません。');
          cursor=result.cursor;
          if(!cursor) {
            if(documents.length!==backup.documentCount)throw new Error('保管データの一部を確認できませんでした。');
            return {...archive,scope:'local-and-server',server:{backup,documents}};
          }
        }
        throw new Error('保管データのページ数が上限を超えています。部分的な書き出しは行っていません。');
      },
      async bootstrapVocabulary() {
        await api.ready;
        if(bootstrapPromise)return bootstrapPromise;
        bootstrapPromise=(async()=>{
          if(!connected)await authenticate(true);
          if(!connected || !csrf)throw new Error('単語帳を移行するにはログインしてください。');
          if(!online())throw new Error('単語帳の移行にはネット接続が必要です。');
          const token=++generation;cancelTimer();abortRequests();
          if(flushing)await flushing.catch(()=>{});
          error='';errorCode='';terminalError=false;emit();
          try {
            const result=await request('/api/vocabulary/bootstrap',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({version:1})});
            if(token!==generation || !connected)return api.getState();
            vocabulary=checkedVocabulary(result?.vocabulary);
            if(!vocabulary.ready)throw new Error('単語帳の移行を確認できませんでした。');
            await pull(token);
            if(token===generation)await flush();
            if(!error && connected)schedule();
            return api.getState();
          } catch(caught) {
            if(token===generation) {
              noteFailure(caught);authRefreshNeeded=true;error=caught.message || '単語帳を移行できませんでした。端末の内容は残しています。';
              terminalError=[400,403,409,429].includes(caught.status);refreshStatus();
            }
            throw caught;
          }
        })();
        emit();
        try{return await bootstrapPromise;}finally{bootstrapPromise=null;refreshStatus();}
      },
      async disconnect(){
        pendingLogoutToken=csrf || pendingLogoutToken;
        const needsLogout=!!pendingLogoutToken || connected || logoutPending;
        ++generation;stopped=true;sessionPromise=null;cancelTimer();abortRequests();connected=false;email='';csrf='';error='';logoutPending=needsLogout;refreshStatus();
        if(needsLogout){
          try{
            if(!online())throw new Error('Offline logout');
            // Another tab may have replaced the cookie. Refresh the CSRF value
            // for the current browser session before revoking it.
            const session=await request('/api/session');
            if(session?.authenticated!==true || typeof session.csrfToken!=='string' || !session.csrfToken)throw new Error('Cannot verify logout session');
            pendingLogoutToken=session.csrfToken;
            await request('/api/logout',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':pendingLogoutToken},body:'{}'});
            pendingLogoutToken='';logoutPending=false;error='';refreshStatus();
          }catch(caught){
            if(caught.status===401){pendingLogoutToken='';logoutPending=false;error='';refreshStatus();}
            else{error='ログアウトを確認できませんでした。オンラインでもう一度「連携を解除」を押してね。';refreshStatus();throw caught;}
          }
        }
      },
      async retry(){
        if(!enabled)return api.getState();
        if(!connected || authRefreshNeeded)return authenticate(false);
        if(!online() || !visible()){refreshStatus();return api.getState();}
        if(bootstrapPromise)return bootstrapPromise;
        cancelTimer();error='';errorCode='';terminalError=false;const token=generation;
        try {await pull(token);if(token===generation)await flush();if(connected && !error)schedule(pollMs*Math.pow(2,idlePolls));}
        catch(caught){if(token===generation){noteFailure(caught);if(caught.status===401)expired();else{error=caught.message || '通信できません。';terminalError=[400,403,409,429].includes(caught.status);if(caught.status===403)authRefreshNeeded=true;refreshStatus();schedule(retryMs);retryMs=Math.min(60000,retryMs*2);}}}
        return api.getState();
      }
    };
    store.subscribe(()=>{refreshStatus();if(connected && !pulling && !flushing && !bootstrapPromise && !error && !stopped)flush().catch(caught=>{noteFailure(caught);error=caught.message;terminalError=true;refreshStatus();});});
    env.addEventListener?.('online',()=>{if(enabled && !stopped)api.retry().catch(()=>{});});
    env.addEventListener?.('offline',()=>{cancelTimer();refreshStatus();});
    env.document?.addEventListener?.('visibilitychange',()=>{if(visible() && enabled && !stopped)api.retry().catch(()=>{});else cancelTimer();});
    api.ready=Promise.resolve(store.ready).then(()=>enabled && !stopped?authenticate(false):api.getState()).catch(()=>api.getState());
    return api;
  }
  if(typeof module!=='undefined' && module.exports)module.exports={createSync};
  else root.ChengciCloudSync=createSync(root.ChengciCardStore);
})(typeof window!=='undefined'?window:globalThis);

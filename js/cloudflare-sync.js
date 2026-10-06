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
    const listeners = new Set(), controllers = new Set(), checkpoints = new Map();
    const online = () => env.navigator?.onLine !== false;
    const visible = () => env.document?.visibilityState !== 'hidden';
    const kinds = () => store.getKinds ? store.getKinds() : ['cards','progress'];
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
            const failure=new Error(response.status===401 ? 'ログインし直すと同期できます。端末のカードは残っています。' : response.status===403 ? '同期の権限を確認できません。カードは残っています。' : `同期できませんでした（HTTP ${response.status}）。端末の変更は残っています。`);
            failure.status=response.status;failure.code=response.status===401?'AUTH_REQUIRED':response.status===403?'FORBIDDEN':'HTTP_ERROR';throw failure;
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
        for(const kind of kinds()) {
          if(!/^[a-z]+$/.test(kind))throw new Error('同期対象の設定が正しくありません。');
          const checkpointKey='cloudflare|'+(env.location?.origin || '')+'|'+principal+'|'+kind;
          const since=store.getSyncCheckpoint ? store.getSyncCheckpoint(checkpointKey) : (checkpoints.get(checkpointKey) || 0);
          let cursor=null, checkpoint=null;
          const seen=new Set();
          for(let page=0;page<100;page++) {
            const result=await request('/api/'+kind+'?since='+since+(checkpoint!==null?'&until='+checkpoint:'')+(cursor?'&cursor='+encodeURIComponent(cursor):''));
            if(token!==generation || !connected)return;
            if(!result || !Array.isArray(result.documents) || !Number.isSafeInteger(result.checkpoint) || result.checkpoint < since || (checkpoint!==null && result.checkpoint!==checkpoint) || (result.cursor != null && (typeof result.cursor!=='string' || !/^\d+$/.test(result.cursor))))throw new Error('同期データを確認できませんでした。端末のカードは変更していません。');
            checkpoint=result.checkpoint;
            cursor=result.cursor;
            received+=result.documents.length;
            await store.applyRemote(kind,result.documents,!cursor?{checkpointKey,checkpoint}:undefined);
            if(!cursor){checkpoints.set(checkpointKey,checkpoint);break;}
            if(seen.has(cursor) || page===99)throw new Error('同期データのページを確認できませんでした。');
            seen.add(cursor);
          }
        }
        idlePolls=received ? 0 : Math.min(2,idlePolls+1);
      } finally {pulling=false;refreshStatus();}
    }
    async function flush() {
      if(flushing)return flushing;
      if(!connected || !online() || !visible() || stopped)return;
      const token=generation;
      flushing=(async()=>{
        const failed=new Set();
        try {
          while(token===generation && connected && online() && visible() && !stopped) {
            const operation=await store.prepareNext(failed);
            if(!operation || token!==generation || !connected)break;
            try {
              const payload={kind:operation.kind,id:operation.id,operationId:operation.operationId,baseRevision:operation.baseRevision,deleted:operation.deleted,updatedAt:operation.updatedAt,data:operation.data};
              const result=await request('/api/sync',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({operations:[payload]})});
              if(token!==generation || !connected)break;
              const reply=result?.results?.[0];
              if(!reply || result.results.length!==1 || reply.kind!==operation.kind || reply.id!==operation.id || reply.operationId!==operation.operationId || !['accepted','conflict'].includes(reply.status))throw new Error('同期の保存結果を確認できませんでした。再試行しても同じ操作は重複しません。');
              await store.applyRemote(operation.kind,[reply.document]);
              retryMs=2000;idlePolls=0;
            } catch(caught) {
              if(token!==generation)break;
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
          connected=true;principal=session.user.uid;email=session.user.email || '';csrf=session.csrfToken;error='';authRefreshNeeded=false;logoutPending=false;pendingLogoutToken='';
          await pull(token);
          if(token===generation)await flush();
          if(!error && connected)schedule(pollMs*Math.pow(2,idlePolls));return api.getState();
        } catch(caught) {
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
      getState(){return {configured:enabled && serverConfigured!==false,provider:'cloudflare',status,connected,accountEmail:email,error,logoutPending,...store.getState()};},
      subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
      loginUrl(opts){return '/auth/login?rememberDevice='+(opts?.rememberDevice===true?'1':'0');},
      async connect(){await api.ready;if(logoutPending)await api.disconnect();return authenticate(true);},
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
        cancelTimer();error='';terminalError=false;const token=generation;
        try {await pull(token);if(token===generation)await flush();if(connected && !error)schedule(pollMs*Math.pow(2,idlePolls));}
        catch(caught){if(token===generation){if(caught.status===401)expired();else{error=caught.message || '通信できません。';terminalError=[400,403,409,429].includes(caught.status);if(caught.status===403)authRefreshNeeded=true;refreshStatus();schedule(retryMs);retryMs=Math.min(60000,retryMs*2);}}}
        return api.getState();
      }
    };
    store.subscribe(()=>{refreshStatus();if(connected && !pulling && !flushing && !error && !stopped)flush().catch(()=>{});});
    env.addEventListener?.('online',()=>{if(enabled && !stopped)api.retry().catch(()=>{});});
    env.addEventListener?.('offline',()=>{cancelTimer();refreshStatus();});
    env.document?.addEventListener?.('visibilitychange',()=>{if(visible() && enabled && !stopped)api.retry().catch(()=>{});else cancelTimer();});
    api.ready=Promise.resolve(store.ready).then(()=>enabled && !stopped?authenticate(false):api.getState()).catch(()=>api.getState());
    return api;
  }
  if(typeof module!=='undefined' && module.exports)module.exports={createSync};
  else root.ChengciCloudSync=createSync(root.ChengciCardStore);
})(typeof window!=='undefined'?window:globalThis);

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'js/navigation.js'),'utf8');
function harness({saved=null,hash='',denyStorage=false}={}){
 const elements=new Map(),events=new Map(),storage=new Map(saved?[['chengciNavigationRoute',JSON.stringify(saved)]]:[]),entries=[];let index=-1;
 const document={activeElement:null,getElementById:id=>elements.get(id),querySelectorAll:selector=>[...elements.values()].filter(e=>selector==='.tab-page'?e.classes.has('tab-page'):selector==='.tab-btn'?e.classes.has('tab-btn'):selector==='[data-feature-panel]'?e.attrs['data-feature-panel']!==undefined:selector==='[data-study-content]'?e.attrs['data-study-content']!==undefined:selector==='[data-study-panel]'?e.dataset.studyPanel!==undefined:false)};
 function element(id,attrs={}){
  const classes=new Set((attrs.class||'').split(' '));
  const node={id,attrs,classes,hidden:attrs.hidden!==undefined,value:'',innerHTML:'',textContent:'',dataset:{studyPanel:attrs['data-study-panel'],tabTarget:attrs['data-tab-target']},
   classList:{toggle(name,value){value?classes.add(name):classes.delete(name);},contains:name=>classes.has(name)},
   setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];},focus(){document.activeElement=this;},querySelector(){return this.heading;}};
  node.heading={id:id+'-heading',setAttribute(){},focus(){document.activeElement=this;}};elements.set(id,node);return node;
 }
 let count=0;
 for(const match of html.matchAll(/<(section|button|select|input|textarea|p|div)\b([^>]*)>/g)){
  const attrs=Object.fromEntries([...match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],m[2]||'']));
  if(attrs.id||attrs['data-study-panel']||attrs['data-tab-target'])element(attrs.id||'button-'+(++count),attrs);
 }
 document.body=element('body');
 const context={document,console,location:{hash},scrollY:0,scrollTo({top}){this.scrollY=top;},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(denyStorage)throw Error('storage denied');storage.set(k,v);}},addEventListener:(name,fn)=>events.set(name,fn),stopSpeech(){context.stopped=(context.stopped||0)+1;},releaseSpeechRecognitionForPlayback(){context.released=(context.released||0)+1;}};
 function updateLocation(url){context.location.hash=url;}
 context.history={state:null,replaceState(state,unused,url){this.state=state;if(index<0){entries.push({state,url});index=0;}else entries[index]={state,url};updateLocation(url);},pushState(state,unused,url){entries.splice(index+1);entries.push({state,url});index++;this.state=state;updateLocation(url);}};
 context.window=context;vm.createContext(context);vm.runInContext(source,context);events.get('load')();
 function travel(delta){index+=delta;const entry=entries[index];assert.ok(entry);context.history.state=entry.state;updateLocation(entry.url);events.get('popstate')();events.get('hashchange')();}
 return {context,e:id=>elements.get(id),visible:selector=>document.querySelectorAll(selector).filter(e=>!e.hidden),entries,back:()=>travel(-1),forward:()=>travel(1),events,document};
}

test('home is a short launcher and each feature/category is displayed alone',()=>{
 const t=harness();assert.equal(t.visible('.tab-page')[0].id,'tab-home');assert.equal(t.visible('[data-feature-panel]').length,0);
 for(const id of ['recallPanel','searchPanel','compositionPanel','quizPanel','audioQuizPanel','studyScopePanel','personalCardsPanel','priorityPanel','todayWordsPanel','shortcutExportPanel']){
  t.context.openPracticePanel(id);assert.deepEqual(t.visible('[data-feature-panel]').map(e=>e.id),[id]);assert.deepEqual(t.visible('.tab-page').map(e=>e.id),['tab-practice']);assert.equal(t.document.activeElement.id,id+'-heading');
 }
 for(const id of ['wordListPanel','patternPanel','idiomPanel','habitPanel','phrasePanel']){
  t.context.jumpToStudyPanel(id);assert.deepEqual(t.visible('[data-study-content]').map(e=>e.id),[id]);assert.equal(t.document.activeElement.id,id+'-heading');
 }
 t.context.showTab('settings');assert.deepEqual(t.visible('.tab-page').map(e=>e.id),['tab-settings']);assert.equal(t.visible('[data-study-content]').length,0);
});

test('repeated navigation, Back and Forward retain draft, recall and typed answers without restarting',()=>{
 const t=harness();t.context.openPracticePanel('personalCardsPanel');t.e('personalWord').value='未保存の語';t.e('personalMeaning').value='途中の意味';t.context.scrollY=210;
 t.context.showTab('settings');const length=t.entries.length;t.context.showTab('settings');assert.equal(t.entries.length,length,'repeat must not add duplicate history');
 t.back();assert.equal(t.e('personalCardsPanel').hidden,false);assert.equal(t.e('personalWord').value,'未保存の語');assert.equal(t.e('personalMeaning').value,'途中の意味');assert.equal(t.context.scrollY,210);
 t.forward();assert.equal(t.e('tab-settings').hidden,false);t.back();
 t.context.openPracticePanel('recallPanel');t.e('recallArea').innerHTML='revealed current card and queue';t.context.openPracticePanel('searchPanel');t.back();assert.equal(t.e('recallArea').innerHTML,'revealed current card and queue');
 t.context.openPracticePanel('compositionPanel');t.e('compositionArea').innerHTML='question with partially typed answer';t.context.showTab('home');t.back();assert.equal(t.e('compositionArea').innerHTML,'question with partially typed answer');
 assert.ok(t.context.stopped);assert.ok(t.context.released);
});

test('storage restrictions do not disable browser history, and stale routes never create blank pages',()=>{
 const t=harness({denyStorage:true});t.context.openPracticePanel('recallPanel');t.context.showTab('settings');assert.equal(t.entries.length,3);t.back();assert.equal(t.e('recallPanel').hidden,false);
 for(const saved of [{page:'removed'},{page:'practice',panel:'unknown'},{page:'study',panel:'unknown'}]){const h=harness({saved});assert.equal(h.visible('.tab-page').length,1);}
 const deep=harness({hash:'#/study/patternPanel'});assert.equal(deep.e('patternPanel').hidden,false);
 deep.context.showTab('home');deep.context.showTab('study');assert.equal(deep.e('patternPanel').hidden,false,'last selected list returns');
});

test('app status is visible independently of the hidden editor',()=>{
 const t=harness();t.context.showTab('settings');t.context.ChengciNavigation.announce('一時保存を確認してね',true);assert.equal(t.e('navigationStatus').hidden,false);assert.equal(t.e('navigationStatus').textContent,'一時保存を確認してね');assert.ok(t.e('navigationStatus').classes.has('personal-error'));
});

test('delayed audio never starts after leaving and returning to an unfinished quiz',()=>{
 const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');const start=app.lastIndexOf('startAudioQuiz=function(mode="choice"){');const end=app.indexOf('\n};',start)+3;
 const callbacks=[],spoken=[],input={focus(){}};let generation=1,visible=true;
 const env={window:{ChengciNavigation:{generation:()=>generation,isPanelVisible:()=>visible}},document:{getElementById:id=>id==='audioQuizInput'?input:{innerHTML:''}},localStorage:{setItem(){}},stopSpeech(){},scopedStudyItems:()=>[{word:'敢',id:'word1'}],studyScopeSignature:()=> 'all',score:()=>0,pickFromQueue:(k,pool)=>pool[0],wordStudyKey:w=>w.id,saveAll(){},quizRuns:0,setTimeout:fn=>callbacks.push(fn),speakText:t=>spoken.push(t),showScopeEmpty(){},buildScopedChineseChoices:()=>[],audioQuizMode:'',currentAudioQuiz:null};
 vm.createContext(env);vm.runInContext(app.slice(start,end),env);env.startAudioQuiz('typing');visible=false;generation++;visible=true;generation++;callbacks.forEach(fn=>fn());assert.deepEqual(spoken,[]);assert.equal(env.quizRuns,1);
});

test('static wiring preserves IDs, feature scopes, sync settings and offline navigation asset',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 const home=html.slice(html.indexOf('id="tab-home"'),html.indexOf('id="tab-practice"'));assert.ok(!home.includes('personalCardForm'));assert.ok(!home.includes('quizArea'));
 const settings=html.slice(html.indexOf('id="tab-settings"'));for(const id of ['personalRememberDevice','personalConnect','personalLoginCheckpoint','personalProgressConflicts','vocabularyBootstrap','personalExport','personalImport'])assert.ok(settings.includes('id="'+id+'"'),id);
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');assert.ok(sw.includes("'./js/navigation.js'"));
});

test('leaving while microphone startup is pending aborts it and does not retain a false listening status',()=>{
 const nodes=new Map();let session;
 const e=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,classList:{toggle(){}},querySelector(){return null;}});return nodes.get(id);};
 class Recognition {constructor(){session=this;}start(){}abort(){this.aborted=true;}}
 const env={document:{getElementById:e},addEventListener(){},SpeechRecognition:Recognition,stopSpeech(){}};env.window=env;
 vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(root,'js/speech-recognition.js'),'utf8'),env);
 env.CHENGCI_SPEECH_RECOGNITION.start('測試');assert.match(e('speechPracticeStatus').innerHTML,/マイクを準備中/);
 assert.equal(env.releaseSpeechRecognitionForPlayback(),true);assert.equal(session.aborted,true);
 session.onstart();assert.match(e('speechPracticeStatus').innerHTML,/停止しました/);assert.equal(e('speechPracticeStart').disabled,false);
});

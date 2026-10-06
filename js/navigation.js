// Screen-only routing. Never rebuild cards, reset forms, or change learning data.
(function () {
  'use strict';
  const practicePanels = ['recallPanel','searchPanel','compositionPanel','quizPanel','audioQuizPanel','studyScopePanel','personalCardsPanel','priorityPanel','todayWordsPanel','shortcutExportPanel'];
  const studyPanels = ['wordListPanel','patternPanel','idiomPanel','habitPanel','phrasePanel'];
  const pages = ['home','practice','study','pronunciation','settings'];
  const scrollPositions = new Map();
  let current = null, lastStudyPanel = 'wordListPanel', generation = 0;
  const routeKey = route => route.page + (route.panel ? '/' + route.panel : '');
  function normalize(route) {
    if (!route || !pages.includes(route.page)) return {page:'home'};
    if (route.page === 'practice') return {page:'practice',panel:practicePanels.includes(route.panel) ? route.panel : 'recallPanel'};
    if (route.page === 'study') return {page:'study',panel:studyPanels.includes(route.panel) ? route.panel : 'wordListPanel'};
    return {page:route.page};
  }
  function fromHash() {
    const hash = window.location?.hash || '';
    if (!hash.startsWith('#/')) return null;
    const [page,panel,extra] = hash.slice(2).split('/');
    if (extra || !pages.includes(page)) return {page:'home'};
    return normalize({page,panel});
  }
  function readSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem('chengciNavigationRoute') || 'null');
      if (saved) return normalize(saved);
      return normalize({page:localStorage.getItem('chengciActiveTab') || 'home'});
    } catch (_) { return {page:'home'}; }
  }
  function announce(text, error = false) {
    const status = document.getElementById('navigationStatus');
    if (!status) return;
    status.textContent = text || '';
    status.hidden = !text;
    status.classList.toggle('personal-error', error);
  }
  function focusHeading(page) {
    const panel = current?.panel ? document.getElementById(current.panel) : page;
    const heading = panel?.querySelector('h2');
    if (!heading) return;
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
  }
  function navigate(request, options = {}) {
    const route = normalize(request), key = routeKey(route);
    if (current && key === routeKey(current) && !options.initial) return;
    if (current) scrollPositions.set(routeKey(current),Number(window.scrollY) || 0);
    generation++;
    if (current) {
      if (typeof window.stopSpeech === 'function') window.stopSpeech();
      if (typeof window.releaseSpeechRecognitionForPlayback === 'function') window.releaseSpeechRecognitionForPlayback();
    }
    current = route;
    if (route.page === 'study') lastStudyPanel = route.panel;
    document.querySelectorAll('.tab-page').forEach(page => {
      const active = page.id === 'tab-' + route.page;
      page.hidden = !active;
      page.classList.toggle('active',active);
    });
    document.querySelectorAll('[data-feature-panel]').forEach(panel => {panel.hidden = route.page !== 'practice' || panel.id !== route.panel;});
    document.querySelectorAll('[data-study-content]').forEach(panel => {panel.hidden = route.page !== 'study' || panel.id !== route.panel;});
    document.querySelectorAll('[data-study-panel]').forEach(button => {
      const active = button.dataset.studyPanel === lastStudyPanel;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    document.querySelectorAll('.tab-btn').forEach(button => {
      const active = button.dataset.tabTarget === (route.page === 'practice' ? 'home' : route.page);
      button.classList.toggle('active',active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    const selector = document.getElementById('practiceFeatureSelect');
    if (selector && route.page === 'practice') selector.value = route.panel;
    document.body?.setAttribute('data-page',route.page);
    try {
      localStorage.setItem('chengciNavigationRoute',JSON.stringify(route));
      localStorage.setItem('chengciActiveTab',route.page === 'practice' ? 'home' : route.page);
    } catch (_) { /* Private browsing storage restrictions never block navigation. */ }
    try {
      if (window.history?.replaceState && !options.fromHistory) {
        const method = options.initial || options.replace ? 'replaceState' : 'pushState';
        window.history[method]({...window.history.state,chengciRoute:route},'', '#/' + key);
      }
    } catch (_) { /* The screen still works when the host disallows history. */ }
    if (!options.initial) announce('');
    window.scrollTo({top:options.fromHistory ? scrollPositions.get(key) || 0 : 0,behavior:'auto'});
    if (!options.initial) focusHeading(document.getElementById('tab-' + route.page));
  }
  function showTab(page) {
    navigate({page,panel:page === 'study' ? lastStudyPanel : undefined});
  }
  function openPracticePanel(id) {
    if (!practicePanels.includes(id)) return;
    navigate({page:'practice',panel:id});
  }
  function jumpToStudyPanel(id) {
    if (!studyPanels.includes(id)) return;
    navigate({page:'study',panel:id});
  }
  function restore() { navigate(fromHash() || window.history?.state?.chengciRoute || {page:'home'},{fromHistory:true}); }
  window.showTab = showTab;
  window.openPracticePanel = openPracticePanel;
  window.scrollToPanel = openPracticePanel; // Compatibility with existing launchers.
  window.jumpToStudyPanel = jumpToStudyPanel;
  window.ChengciNavigation = {
    announce,
    isPanelVisible:id => !!current && (current.panel === id || current.page === 'pronunciation' && id === 'speechPracticePanel'),
    generation:() => generation,
    current:() => current ? {...current} : null
  };
  window.addEventListener('popstate',restore);
  window.addEventListener('hashchange',restore);
  window.addEventListener('load',() => navigate(fromHash() || readSaved(),{initial:true}));
})();

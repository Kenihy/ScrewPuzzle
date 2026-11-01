/*
 * 나사 너머 — 웹 프로토타입 본체
 * 화면 전환, 캔버스 렌더링, 입력, 저장, 해금 연출을 담당합니다.
 * 퍼즐 규칙은 rules.js, 캐릭터 데이터는 content.js, 레벨은 levels.js에 있습니다.
 */
(function () {
  'use strict';

  const C = window.GAME_CONTENT;
  const LV = window.GAME_LEVELS;
  const R = window.ScrewRules;
  const G = R.GRID;

  const TRAY_H = 60;          // 보드 위쪽 보관 구멍 영역 높이
  const BY = TRAY_H;          // 보드 시작 y
  const LW = G.boardW;
  const LH = TRAY_H + G.boardH;
  const SLOT_GAP = 42;
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 아이콘 ---------------- */
  const svg = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra || ''}>${d}</svg>`;
  const ICON = {
    back: svg('<path d="M15 5l-7 7 7 7"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    restart: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
    hammer: svg('<path d="M14 6l4 4"/><path d="M11.5 3.5l6 6-2.5 2.5-6-6z"/><path d="M12 9L4 17a1.4 1.4 0 0 0 2 2l8-8"/>'),
    hole: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M19 2v5M16.5 4.5h5"/>'),
    hint: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.6V16h5.2v-.5c0-.6.3-1.2.9-1.6A6 6 0 0 0 12 3z"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    chevron: svg('<path d="M9 5l7 7-7 7"/>'),
  };

  /* ---------------- 저장 ---------------- */
  const SAVE_KEY = 'nasa-neomeo-save-v1';
  const defaultSave = () => ({ stars: {}, tools: { hammer: 3, hole: 3, hint: 3 }, unlockAll: false, sound: true, seen: {} });
  let save = loadSave();
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const base = defaultSave();
        return Object.assign(base, d, { tools: Object.assign(base.tools, d.tools || {}), seen: d.seen || {} });
      }
    } catch (e) { /* 저장소를 쓸 수 없는 환경 */ }
    return defaultSave();
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 무시 */ }
  }

  /* ---------------- 진행 상태 ---------------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const levelId = (cid, n) => cid + '-' + n;
  const charById = (id) => C.characters.find((c) => c.id === id);
  const starsOf = (id) => save.stars[id] || 0;
  const clearedCount = (ch) => ch.stages.filter((_, i) => starsOf(levelId(ch.id, i + 1)) > 0).length;
  const totalStars = (ch) => ch.stages.reduce((n, _, i) => n + starsOf(levelId(ch.id, i + 1)), 0);
  function chapterUnlocked(ch) {
    if (save.unlockAll || !ch.unlockAfter) return true;
    return clearedCount(charById(ch.unlockAfter)) >= ch.stages.length;
  }
  function stageUnlocked(ch, n) {
    if (!chapterUnlocked(ch)) return false;
    if (save.unlockAll || n === 1) return true;
    return starsOf(levelId(ch.id, n - 1)) > 0;
  }
  const unlockText = (ch) => `${charById(ch.unlockAfter).name}의 이야기를 끝까지 풀면 열려요`;

  /* ---------------- 이미지 ---------------- */
  const images = {};
  function loadImages() {
    return Promise.all(C.characters.map((ch) => new Promise((res) => {
      const im = new Image();
      im.onload = () => res();
      im.onerror = () => res();
      im.src = ch.image;
      images[ch.id] = im;
    })));
  }
  function cropRect(img, crop) {
    const W = img.naturalWidth, H = img.naturalHeight;
    const sw = W / crop.zoom, sh = H / crop.zoom;
    const sx = Math.min(Math.max(crop.cx * W - sw / 2, 0), W - sw);
    const sy = Math.min(Math.max(crop.cy * H - sh / 2, 0), H - sh);
    return { sx, sy, sw, sh };
  }
  function bgCss(ch, crop) {
    const z = crop.zoom;
    const pos = (c) => (z <= 1 ? 50 : Math.max(0, Math.min(1, (c - 0.5 / z) / (1 - 1 / z))) * 100);
    return `background-image:url('${ch.image}');background-size:${z * 100}% ${z * 100}%;background-position:${pos(crop.cx)}% ${pos(crop.cy)}%`;
  }

  /* ---------------- 소리 (WebAudio 합성) ---------------- */
  let actx = null;
  function sfx(kind) {
    if (!save.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime;
      const tone = (freq, dur, type, vol, delay, slide) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t + delay);
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + delay + dur);
        g.gain.setValueAtTime(0.0001, t + delay);
        g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
        o.connect(g).connect(actx.destination);
        o.start(t + delay); o.stop(t + delay + dur + 0.02);
      };
      if (kind === 'pick') tone(880, 0.08, 'triangle', 0.12, 0, 1320);
      else if (kind === 'place') tone(520, 0.09, 'square', 0.05, 0, 300);
      else if (kind === 'drop') tone(160, 0.25, 'sine', 0.22, 0, 60);
      else if (kind === 'deny') tone(140, 0.12, 'sawtooth', 0.06, 0);
      else if (kind === 'unlock') { tone(660, 0.1, 'triangle', 0.1, 0); tone(990, 0.16, 'triangle', 0.1, 0.08); }
      else if (kind === 'win') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.11, i * 0.11));
    } catch (e) { /* 소리 재생 불가 환경 */ }
  }

  /* ---------------- 공통 UI ---------------- */
  let toastTimer = 0;
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2200);
  }
  function showScreen(name) {
    ['home', 'chapter', 'play'].forEach((n) => { $('#screen-' + n).hidden = n !== name; });
    if (name !== 'play') stopLoop();
  }
  function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; }
  function openSheet(html) {
    const el = $('#sheet');
    el.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true">${html}</div>`;
    el.hidden = false;
  }
  const starsHtml = (n) => '★'.repeat(n) + `<span class="off">${'★'.repeat(3 - n)}</span>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- 라우팅 (#zena, #zena-2 등) ---------------- */
  function go(hash) {
    if (location.hash.slice(1) === hash) route();
    else location.hash = hash;
  }
  function route() {
    closeSheet();
    $('#viewer').hidden = true;
    const h = decodeURIComponent(location.hash.slice(1));
    const ch = charById(h);
    if (ch) return chapterUnlocked(ch) ? showChapter(ch) : showHome();
    const m = /^([a-z]+)-(\d)$/.exec(h);
    if (m && charById(m[1]) && LV[h]) {
      const c2 = charById(m[1]);
      if (stageUnlocked(c2, +m[2])) return startPlay(c2, +m[2]);
      return go(c2.id);
    }
    showHome();
  }

  /* ---------------- 홈 ---------------- */
  function showHome() {
    const el = $('#screen-home');
    el.innerHTML = `
      <header class="home-head">
        <div>
          <h1 class="logo">나사 너머</h1>
          <p class="tagline">${esc(C.subtitle)}</p>
        </div>
        <button class="icon-btn" data-act="settings" aria-label="설정">${ICON.gear}</button>
      </header>
      <p class="section-label">공략할 마음</p>
      <div class="char-list">${C.characters.map(charCard).join('')}</div>
      <p class="foot">프로토타입 · 캐릭터 3명 · 스테이지 15개<br>진행 상황은 이 기기의 브라우저에만 저장됩니다</p>`;
    showScreen('home');
  }
  function charCard(ch) {
    const open = chapterUnlocked(ch);
    const pips = ch.stages.map((_, i) => `<span class="pip ${starsOf(levelId(ch.id, i + 1)) ? 'on' : ''}"></span>`).join('');
    return `
      <button class="char-card ${open ? '' : 'locked'}" data-${open ? 'go' : 'locked'}="${ch.id}" style="--accent:${ch.accent}">
        <span class="portrait" style="${bgCss(ch, ch.portrait)}"></span>
        ${open ? '' : `<span class="char-lock">${ICON.lock}</span>`}
        <span class="char-info">
          <span class="char-name">${open ? ch.name : '???'}<small>${open ? ch.nameEn : 'LOCKED'}</small></span>
          <span class="char-role">${open ? `${ch.age} · ${ch.role}` : '아직 만나지 못한 사람'}</span>
          <span class="char-outer">${open ? '겉: ' + esc(ch.outer) : esc(unlockText(ch))}</span>
          <span class="char-progress"><span class="pips">${pips}</span><span>★ ${totalStars(ch)}/15</span></span>
        </span>
      </button>`;
  }

  /* ---------------- 챕터 ---------------- */
  function showChapter(ch) {
    const el = $('#screen-chapter');
    const done = clearedCount(ch);
    const gm = ch.gimmick ? C.gimmicks[ch.gimmick] : null;
    el.style.setProperty('--accent', ch.accent);
    el.innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-go="" aria-label="캐릭터 목록으로">${ICON.back}</button>
        <span class="topbar-title">${ch.name}의 이야기</span>
        <span class="topbar-spacer"></span>
      </div>
      <section class="chapter-hero">
        <div class="hero-portrait" style="${bgCss(ch, ch.portrait)}"></div>
        <div class="hero-info">
          <p class="eyebrow">${ch.nameEn} · ${ch.age} · ${esc(ch.role)}</p>
          <h2 class="hero-name">${ch.name}</h2>
          <p class="hero-outer">겉으로 보이는 모습<strong>${esc(ch.outer)}</strong></p>
          ${gm ? `<span class="gimmick-chip" title="${esc(gm.desc)}">새 장치 · ${gm.name}</span>` : '<span class="gimmick-chip">기본 규칙 익히기</span>'}
          <p class="hero-progress">마음 조각 ${done}/5 · ★ ${totalStars(ch)}/15</p>
        </div>
      </section>
      <p class="section-label">스테이지</p>
      <ol class="stage-list">${ch.stages.map((s, i) => stageRow(ch, s, i + 1)).join('')}</ol>
      <p class="section-label">마음 조각</p>
      <div class="card-list">${ch.stages.map((s, i) => fragmentHtml(ch, i + 1, starsOf(levelId(ch.id, i + 1)) > 0)).join('')}${bonusHtml(ch)}</div>
      ${done >= 5 ? `<button class="btn primary wide" data-act="viewer" data-ch="${ch.id}">${ICON.image} 전체 일러스트 보기</button>` : ''}`;
    el.scrollTop = 0;
    showScreen('chapter');
  }
  function stageRow(ch, s, n) {
    const id = levelId(ch.id, n);
    const open = stageUnlocked(ch, n);
    const st = starsOf(id);
    return `<li><button class="stage-row ${st ? 'cleared' : ''}" ${open ? `data-go="${id}"` : 'disabled'}>
      <span class="stage-num">${n}</span>
      <span class="stage-title">${open ? esc(s.title) : '잠긴 스테이지'}<small>${open ? (st === 3 ? '별 3개 달성' : st ? '다시 하면 별을 더 모을 수 있어요' : '3별 목표 ' + (LV[id].par + 1) + '번 이동') : '앞 스테이지를 풀면 열려요'}</small></span>
      ${open ? `<span class="stage-stars">${starsHtml(st)}</span>` : ICON.lock}
    </button></li>`;
  }
  function fragmentHtml(ch, n, open) {
    const s = ch.stages[n - 1];
    if (!open) {
      return `<article class="fragment locked"><p class="fragment-type">마음 조각 ${n} · ${C.cardTypes[n - 1]}</p><h3>???</h3><p class="fragment-body">스테이지 ${n}을 풀면 열려요.</p></article>`;
    }
    return `<article class="fragment">
      <p class="fragment-type">마음 조각 ${n} · ${C.cardTypes[n - 1]}</p>
      <h3>${esc(s.title)}</h3>
      ${s.card.quote ? `<p class="fragment-quote">${esc(s.card.quote)}</p>` : ''}
      <p class="fragment-body">${esc(s.card.body)}</p>
    </article>`;
  }
  function bonusHtml(ch) {
    const stars = totalStars(ch);
    if (stars < 15) {
      return `<article class="fragment locked"><p class="fragment-type">비밀 메모 · 별 15개</p><h3>???</h3><p class="fragment-body">모든 스테이지에서 별 3개를 받으면 열려요. (지금 ★ ${stars}/15)</p></article>`;
    }
    return `<article class="fragment bonus"><p class="fragment-type">비밀 메모 · 별 15개 달성</p><h3>${esc(ch.bonus.title)}</h3><p class="fragment-body">${esc(ch.bonus.body)}</p></article>`;
  }

  /* ---------------- 일러스트 감상 ---------------- */
  function openViewer(ch) {
    const v = $('#viewer');
    v.innerHTML = `
      <img src="${ch.image}" alt="${ch.name}의 전체 일러스트">
      <p class="viewer-cap"><strong>${ch.name}</strong>${esc(ch.stages[4].title)} — 이면 공개</p>
      <button class="btn" data-act="close-viewer">${ICON.close} 닫기</button>`;
    v.hidden = false;
  }

  /* ---------------- 설정 ---------------- */
  let resetArmed = false;
  function openSettings() {
    resetArmed = false;
    openSheet(`
      <h2>설정</h2>
      <div class="setting-row"><span>효과음</span><button class="switch" role="switch" aria-checked="${save.sound}" data-act="toggle-sound" aria-label="효과음"></button></div>
      <div class="setting-row"><span>모든 스테이지 열기<small>프로토타입 검토용. 잠금 조건을 무시합니다.</small></span><button class="switch" role="switch" aria-checked="${save.unlockAll}" data-act="toggle-unlock" aria-label="모든 스테이지 열기"></button></div>
      <div class="setting-row"><span>진행 초기화<small>별, 마음 조각, 도구 개수를 처음 상태로 되돌립니다.</small></span><button class="btn" data-act="reset" id="btn-reset">초기화</button></div>
      <div class="actions"><button class="btn primary" data-act="close-sheet">닫기</button></div>`);
  }

  /* ================================================================
   * 퍼즐 화면
   * ================================================================ */
  const canvas = $('#board');
  const ctx = canvas.getContext('2d');
  let scale = 1, dpr = 1, k = 1;
  let P = null;          // 현재 퍼즐 상태
  let layers = null;     // 일러스트 레이어 (선명 / 흐림 / 마스크 / 드러남)
  let rafId = 0, lastT = 0;
  let tokenSeq = 0;      // 화면 전환·재시작 뒤 늦게 도착한 타이머를 무시하기 위한 번호

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function startPlay(ch, n) {
    const id = levelId(ch.id, n);
    const level = LV[id];
    P = { ch, n, id, level, model: R.buildModel(level) };
    resetPuzzle();
    $('#play-title').textContent = `${ch.name} · ${n} / 5`;
    $('#play-sub').textContent = ch.stages[n - 1].title;
    $('#screen-play').style.setProperty('--accent', ch.accent);
    showScreen('play');
    layers = null;
    resize();
    startLoop();
    introCoach();
  }

  function resetPuzzle() {
    P.st = R.initialState(P.model);
    P.sel = -1;
    P.mode = null;
    P.usedTools = false;
    P.falling = [];
    P.particles = [];
    P.reveal = P.model.planks.map(() => 0);
    P.revealGoal = P.model.planks.map(() => 0);
    P.clearT = 0;
    P.clearing = false;
    P.won = false;
    P.busy = false;
    P.moving = null;
    P.shake = null;
    P.hint = null;
    P.rot = P.st.screws.map((_, i) => ((i * 47) % 90) * Math.PI / 180);
    P.keyWasAlive = R.keyAlive(P.model, P.st);
    P.tutorialStep = 0;
    P.token = ++tokenSeq;
    maskDirty = true;
    closeSheet();
    updateHud();
  }

  /* ---------- 코치 메시지 ---------- */
  let coachTimer = 0;
  function coach(msg, ms) {
    const el = $('#coach');
    clearTimeout(coachTimer);
    if (!msg) { el.hidden = true; return; }
    el.textContent = msg;
    el.hidden = false;
    if (ms) coachTimer = setTimeout(() => { el.hidden = true; }, ms);
  }
  function introCoach() {
    coach('');
    if (P.id === 'zena-1' && !save.unlockAll) {
      P.tutorialStep = 1;
      coach('반짝이는 나사를 눌러 들어 올리세요.');
      return;
    }
    const g = P.ch.gimmick;
    if (g && P.n === 1 && !save.seen[g]) {
      save.seen[g] = true; persist();
      coach(`새 장치 · ${C.gimmicks[g].name} — ${C.gimmicks[g].desc}`, 6000);
    }
  }
  function tutorialEvent(ev) {
    if (!P.tutorialStep) return;
    if (P.tutorialStep === 1 && ev === 'select') { P.tutorialStep = 2; coach('위쪽 보관 구멍이나 비어 있는 구멍을 눌러 옮기세요.'); }
    else if (P.tutorialStep === 2 && ev === 'move') { P.tutorialStep = 3; coach('판을 붙잡은 나사를 모두 빼면 판이 떨어져요.'); }
    else if (P.tutorialStep >= 2 && ev === 'fall') { P.tutorialStep = 0; coach('판이 사라진 자리에 숨겨진 모습이 선명하게 드러나요.', 3500); }
  }

  /* ---------- HUD·도구 ---------- */
  function updateHud() {
    if (!P) return;
    $('#hud-moves').innerHTML = `이동 <b>${P.st.moves}</b>`;
    $('#hud-goal').innerHTML = `★★★ 목표 <b>${P.level.par + 1}</b>번 이내`;
    const t = save.tools;
    const hm = $('#tool-hammer'), ho = $('#tool-hole'), hi = $('#tool-hint');
    hm.innerHTML = `${ICON.hammer}<span>망치</span><span class="count">${t.hammer}</span>`;
    ho.innerHTML = `${ICON.hole}<span>구멍 추가</span><span class="count">${t.hole}</span>`;
    hi.innerHTML = `${ICON.hint}<span>힌트</span><span class="count">${t.hint}</span>`;
    hm.disabled = !t.hammer || P.won;
    ho.disabled = !t.hole || P.st.tray >= R.MAX_TRAY || P.won;
    hi.disabled = !t.hint || P.won;
    hm.classList.toggle('active', P.mode === 'hammer');
    hm.setAttribute('aria-pressed', P.mode === 'hammer');
  }

  function useHole() {
    if (!P || P.busy || P.won || !save.tools.hole || P.st.tray >= R.MAX_TRAY) return;
    save.tools.hole--; persist();
    P.st = R.clone(P.st);
    P.st.tray++;
    P.usedTools = true;
    P.hint = null;
    sfx('place');
    toast('보관 구멍이 하나 늘었어요.');
    updateHud();
    closeSheet();
  }
  function toggleHammer() {
    if (!P || P.won) return;
    if (P.mode === 'hammer') { P.mode = null; coach(''); }
    else if (save.tools.hammer) { P.mode = 'hammer'; P.sel = -1; coach('부술 판을 누르세요. 다시 누르면 취소됩니다.'); }
    updateHud();
  }
  // 힌트·자동 풀이: 가능하면 최단 경로, 탐색이 길어지면 일반 풀이로 대신합니다.
  function bestPath(st) {
    const a = R.minMoves(P.model, st, 4000);
    if (a) return { status: 'solved', path: a.path };
    return R.solve(P.model, st, { limit: 60000 });
  }

  function useHint() {
    if (!P || P.busy || P.won || !save.tools.hint) return;
    const r = bestPath(P.st);
    if (r.status !== 'solved') {
      toast(r.status === 'unsolvable' ? '이 상태로는 더 풀 수 없어요. 망치나 구멍 추가를 써 보세요.' : '힌트를 찾지 못했어요. 다시 시도해 주세요.');
      return;
    }
    save.tools.hint--; persist();
    P.usedTools = true;
    P.hint = r.path[0];
    P.sel = -1;
    coach('빛나는 나사를 표시된 구멍으로 옮겨 보세요.', 3500);
    updateHud();
  }

  /* ---------- 크기·레이어 ---------- */
  let maskDirty = true;
  function resize() {
    if (!P) return;
    const wrap = $('#stage-wrap');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    const ns = Math.min(w / LW, h / LH);
    const nd = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = Math.floor(LW * ns) + 'px';
    canvas.style.height = Math.floor(LH * ns) + 'px';
    if (layers && ns === scale && nd === dpr && layers.id === P.id) return;
    scale = ns; dpr = nd; k = scale * dpr;
    canvas.width = Math.round(LW * k);
    canvas.height = Math.round(LH * k);
    buildLayers();
  }

  function buildLayers() {
    const bw = Math.max(2, Math.round(G.boardW * k)), bh = Math.max(2, Math.round(G.boardH * k));
    const img = images[P.ch.id];
    const crop = P.ch.stages[P.n - 1].crop;
    const clear = mk(bw, bh);
    const c = clear.getContext('2d');
    c.fillStyle = '#1a1520'; c.fillRect(0, 0, bw, bh);
    if (img && img.naturalWidth) {
      const r = cropRect(img, crop);
      c.imageSmoothingQuality = 'high';
      c.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, bw, bh);
    }
    // 흐림: 축소 → 확대를 두 번 거쳐 부드럽게
    const tiny = mk(Math.max(4, Math.round(bw / 18)), Math.max(4, Math.round(bh / 18)));
    tiny.getContext('2d').drawImage(clear, 0, 0, tiny.width, tiny.height);
    const mid = mk(Math.max(8, Math.round(bw / 5)), Math.max(8, Math.round(bh / 5)));
    const mc = mid.getContext('2d'); mc.imageSmoothingQuality = 'high';
    mc.drawImage(tiny, 0, 0, mid.width, mid.height);
    const blur = mk(bw, bh);
    const b = blur.getContext('2d');
    b.imageSmoothingQuality = 'high';
    b.drawImage(mid, 0, 0, bw, bh);
    b.globalCompositeOperation = 'saturation';
    b.fillStyle = 'rgba(128,128,128,0.55)';
    b.fillRect(0, 0, bw, bh);
    b.globalCompositeOperation = 'source-over';
    b.fillStyle = 'rgba(20,14,30,0.4)';
    b.fillRect(0, 0, bw, bh);
    // 젖빛 유리 느낌의 가는 사선
    b.strokeStyle = 'rgba(255,255,255,0.035)';
    b.lineWidth = Math.max(1, k);
    for (let x = -bh; x < bw; x += 7 * k) { b.beginPath(); b.moveTo(x, bh); b.lineTo(x + bh, 0); b.stroke(); }
    layers = { id: P.id, clear, blur, mask: mk(bw, bh), reveal: mk(bw, bh), bw, bh };
    maskDirty = true;
  }

  function recomposeReveal() {
    const { mask, reveal, clear, bw, bh } = layers;
    const m = mask.getContext('2d');
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.clearRect(0, 0, bw, bh);
    m.setTransform(k, 0, 0, k, 0, 0);
    m.fillStyle = '#000';
    m.shadowColor = '#000';
    m.shadowBlur = 16 * k;
    P.reveal.forEach((a, z) => {
      if (a <= 0) return;
      m.globalAlpha = Math.min(1, a);
      plankPath(m, P.model.planks[z], 0, 3);
      m.fill();
    });
    m.globalAlpha = 1;
    m.shadowBlur = 0;
    const r = reveal.getContext('2d');
    r.globalCompositeOperation = 'source-over';
    r.clearRect(0, 0, bw, bh);
    r.drawImage(mask, 0, 0);
    r.globalCompositeOperation = 'source-in';
    r.drawImage(clear, 0, 0);
    r.globalCompositeOperation = 'source-over';
    maskDirty = false;
  }

  /* ---------- 좌표 ---------- */
  function trayX(slot, count) {
    const w = count * SLOT_GAP;
    return (LW - w) / 2 + SLOT_GAP / 2 + slot * SLOT_GAP;
  }
  function holePos(h) {
    const hole = P.model.holes[h];
    if (hole.tray) return [trayX(hole.slot, P.st.tray), TRAY_H / 2];
    const [x, y] = R.gridXY([hole.i, hole.j]);
    return [x, y + BY];
  }
  function topPinZ(h) {
    let t = -1;
    for (const c of P.model.holes[h].cover) if (P.st.alive[c.p] && c.hole && c.p > t) t = c.p;
    return t;
  }

  /* ---------- 판 모양 ---------- */
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function plankGeom(p) {
    const [ax, ay] = R.gridXY(p.a), [bx, by] = R.gridXY(p.b);
    if (p.kind === 'bar') return { ax, ay, bx, by, ang: Math.atan2(by - ay, bx - ax), len: Math.hypot(bx - ax, by - ay), cx: (ax + bx) / 2, cy: (ay + by) / 2 };
    const x0 = Math.min(ax, bx) - G.panelM, y0 = Math.min(ay, by) - G.panelM;
    const w = Math.abs(bx - ax) + G.panelM * 2, h = Math.abs(by - ay) + G.panelM * 2;
    return { x0, y0, w, h, cx: x0 + w / 2, cy: y0 + h / 2 };
  }
  function plankPath(c, p, oy, inflate) {
    const g = plankGeom(p);
    const f = inflate || 0;
    c.beginPath();
    if (p.kind === 'bar') {
      c.save();
      c.translate(g.ax, g.ay + oy);
      c.rotate(g.ang);
      rr(c, -G.barR - f, -G.barR - f, g.len + (G.barR + f) * 2, (G.barR + f) * 2, G.barR + f);
      c.restore();
    } else {
      rr(c, g.x0 - f, g.y0 + oy - f, g.w + f * 2, g.h + f * 2, 12 + f);
    }
  }
  function pointInPlank(p, x, y) {
    const g = plankGeom(p);
    if (p.kind === 'panel') return x >= g.x0 && x <= g.x0 + g.w && y >= g.y0 && y <= g.y0 + g.h;
    const dx = g.bx - g.ax, dy = g.by - g.ay;
    const t = Math.max(0, Math.min(1, ((x - g.ax) * dx + (y - g.ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - g.ax - t * dx, y - g.ay - t * dy) <= G.barR;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  // 캐릭터별 판 무늬: 거리(제나) / 벨벳(엘라) / 책 표지(미오)
  function plankPattern(c, p, col, oy) {
    const g = plankGeom(p);
    const pattern = P.ch.pattern;
    c.save();
    if (p.kind === 'bar') { c.translate(g.ax, g.ay + oy); c.rotate(g.ang); }
    const L = p.kind === 'bar' ? g.len : 0;
    if (pattern === 'hazard') {
      if (p.color === 0) {
        c.fillStyle = 'rgba(25,22,28,0.82)';
        if (p.kind === 'bar') {
          for (let x = -G.barR - 40; x < L + G.barR + 40; x += 18) {
            c.beginPath(); c.moveTo(x, -G.barR); c.lineTo(x + 9, -G.barR); c.lineTo(x + 9 + 2 * G.barR, G.barR); c.lineTo(x + 2 * G.barR, G.barR); c.closePath(); c.fill();
          }
        } else {
          for (let x = g.x0 - g.h; x < g.x0 + g.w; x += 20) {
            c.beginPath(); c.moveTo(x, g.y0 + oy + g.h); c.lineTo(x + 10, g.y0 + oy + g.h); c.lineTo(x + 10 + g.h, g.y0 + oy); c.lineTo(x + g.h, g.y0 + oy); c.closePath(); c.fill();
          }
        }
      } else if (p.color === 1) {
        c.strokeStyle = 'rgba(240,236,226,0.75)'; c.lineWidth = 3; c.setLineDash([12, 9]);
        c.beginPath();
        if (p.kind === 'bar') { c.moveTo(-G.barR + 6, 0); c.lineTo(L + G.barR - 6, 0); }
        else { rr(c, g.x0 + 9, g.y0 + oy + 9, g.w - 18, g.h - 18, 6); }
        c.stroke(); c.setLineDash([]);
      } else {
        c.fillStyle = luminance(col) > 0.6 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 26; i++) {
          const rx = ((i * 73 + p.z * 31) % 97) / 97, ry = ((i * 41 + p.z * 17) % 89) / 89;
          const x = p.kind === 'bar' ? -G.barR + rx * (L + 2 * G.barR) : g.x0 + rx * g.w;
          const y = p.kind === 'bar' ? -G.barR + ry * 2 * G.barR : g.y0 + oy + ry * g.h;
          c.beginPath(); c.arc(x, y, 1.2 + (i % 3) * 0.5, 0, Math.PI * 2); c.fill();
        }
      }
    } else if (pattern === 'velvet') {
      const step = 6;
      if (p.kind === 'bar') {
        for (let x = -G.barR; x < L + G.barR; x += step) {
          c.fillStyle = (x / step) % 2 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.06)';
          c.fillRect(x, -G.barR, step / 2, G.barR * 2);
        }
      } else {
        for (let x = g.x0; x < g.x0 + g.w; x += step) {
          c.fillStyle = ((x - g.x0) / step) % 2 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.06)';
          c.fillRect(x, g.y0 + oy, step / 2, g.h);
        }
        c.strokeStyle = 'rgba(232,192,104,0.7)'; c.lineWidth = 1.5;
        c.beginPath(); rr(c, g.x0 + 6, g.y0 + oy + 6, g.w - 12, g.h - 12, 8); c.stroke();
      }
    } else if (pattern === 'book') {
      c.strokeStyle = 'rgba(226,190,110,0.85)'; c.lineWidth = 1.6;
      if (p.kind === 'bar') {
        [-G.barR + 9, -G.barR + 13, L + G.barR - 13, L + G.barR - 9].forEach((x) => {
          c.beginPath(); c.moveTo(x, -G.barR); c.lineTo(x, G.barR); c.stroke();
        });
      } else {
        c.beginPath(); rr(c, g.x0 + 7, g.y0 + oy + 7, g.w - 14, g.h - 14, 5); c.stroke();
        c.fillStyle = 'rgba(226,190,110,0.35)';
        c.fillRect(g.x0 + g.w / 2 - 14, g.y0 + oy + g.h / 2 - 5, 28, 10);
      }
    }
    c.restore();
  }

  function drawHole(c, x, y) {
    c.beginPath(); c.arc(x, y, G.holeR, 0, Math.PI * 2);
    c.fillStyle = '#100c15'; c.fill();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.16)'; c.stroke();
    c.beginPath(); c.arc(x, y + 1.5, G.holeR - 2.5, 0, Math.PI * 2);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
  }

  function drawKey(c, x, y) {
    c.save();
    c.translate(x, y);
    c.fillStyle = '#f2c86a'; c.strokeStyle = '#6b4a14'; c.lineWidth = 1.4;
    c.beginPath(); c.arc(-7, 0, 6, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.arc(-7, 0, 2.2, 0, Math.PI * 2); c.fillStyle = '#6b4a14'; c.fill();
    c.fillStyle = '#f2c86a';
    c.beginPath(); rr(c, -1.5, -2, 15, 4, 1.5); c.fill(); c.stroke();
    c.fillRect(8, 1, 2.5, 4.5); c.strokeRect(8, 1, 2.5, 4.5);
    c.fillRect(11.5, 1, 2.5, 3.5); c.strokeRect(11.5, 1, 2.5, 3.5);
    c.restore();
  }

  function drawPlank(c, z, oy, opts) {
    const p = P.model.planks[z];
    const col = P.ch.planks[p.color % P.ch.planks.length];
    const g = plankGeom(p);
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.45)';
    c.shadowBlur = 8 * k;
    c.shadowOffsetY = 3 * k;
    plankPath(c, p, oy);
    c.fillStyle = col; c.fill();
    c.shadowColor = 'transparent';
    c.save();
    plankPath(c, p, oy); c.clip();
    plankPattern(c, p, col, oy);
    // 위쪽 빛, 아래쪽 그늘
    const top = p.kind === 'bar' ? Math.min(g.ay, g.by) - G.barR : g.y0;
    const bot = p.kind === 'bar' ? Math.max(g.ay, g.by) + G.barR : g.y0 + g.h;
    const gr = c.createLinearGradient(0, top + oy, 0, bot + oy);
    gr.addColorStop(0, 'rgba(255,255,255,0.3)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.22)');
    c.fillStyle = gr;
    c.fillRect(-50, top + oy - 5, LW + 100, bot - top + 10);
    c.restore();
    plankPath(c, p, oy);
    c.lineWidth = 1.6; c.strokeStyle = shade(col, -0.45); c.stroke();
    if (opts && opts.flash) {
      plankPath(c, p, oy);
      c.fillStyle = `rgba(255,255,255,${opts.flash})`; c.fill();
    }
    p.holeIdx.forEach((h) => {
      const hole = P.model.holes[h];
      const [x, y] = R.gridXY([hole.i, hole.j]);
      drawHole(c, x, y + oy);
    });
    if (p.key) drawKey(c, g.cx, g.cy + oy + (p.kind === 'panel' ? 0 : 0));
    c.restore();
  }

  function drawScrew(c, sid, x, y, lift, t) {
    const s = P.st.screws[sid];
    const r = G.screwR * (lift ? 1.18 : 1);
    const locked = s.lock && R.keyAlive(P.model, P.st);
    const iced = s.ice && P.st.moves < s.ice;
    c.save();
    if (P.shake && P.shake.sid === sid) {
      const a = 1 - (t - P.shake.t0) / 350;
      if (a > 0) x += Math.sin((t - P.shake.t0) / 22) * 4 * a;
    }
    // 그림자
    c.beginPath(); c.arc(x + 1.5, y + (lift ? 7 : 2.5), r, 0, Math.PI * 2);
    c.fillStyle = 'rgba(0,0,0,0.38)'; c.fill();
    const yy = y - (lift ? 7 : 0);
    const gr = c.createRadialGradient(x - r * 0.35, yy - r * 0.4, r * 0.1, x, yy, r);
    if (locked) { gr.addColorStop(0, '#fff3cf'); gr.addColorStop(0.5, '#e2b55a'); gr.addColorStop(1, '#8a6122'); }
    else { gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#c9d2da'); gr.addColorStop(1, '#6c7884'); }
    c.beginPath(); c.arc(x, yy, r, 0, Math.PI * 2);
    c.fillStyle = gr; c.fill();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(20,20,30,0.5)'; c.stroke();
    if (locked) {
      c.strokeStyle = '#4a3010'; c.lineWidth = 1.8;
      c.beginPath(); c.arc(x, yy - 1.5, 3.4, Math.PI, 0); c.stroke();
      c.fillStyle = '#4a3010';
      c.beginPath(); rr(c, x - 4.8, yy - 1.5, 9.6, 7, 1.5); c.fill();
    } else {
      c.save();
      c.translate(x, yy);
      c.rotate(P.rot[sid] + (lift ? t / 300 : 0));
      c.strokeStyle = 'rgba(40,46,56,0.85)'; c.lineWidth = r * 0.26; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-r * 0.5, 0); c.lineTo(r * 0.5, 0); c.moveTo(0, -r * 0.5); c.lineTo(0, r * 0.5); c.stroke();
      c.restore();
    }
    if (iced) {
      const s2 = r * 1.4;
      c.beginPath(); rr(c, x - s2, yy - s2, s2 * 2, s2 * 2, 6);
      c.fillStyle = 'rgba(168,222,245,0.62)'; c.fill();
      c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - s2 + 4, yy - s2 + 9); c.lineTo(x - s2 + 9, yy - s2 + 4); c.stroke();
      const left = s.ice - P.st.moves;
      c.beginPath(); c.arc(x + s2 - 2, yy + s2 - 2, 7.5, 0, Math.PI * 2);
      c.fillStyle = '#1d4f66'; c.fill();
      c.fillStyle = '#ffffff'; c.font = '700 10px "IBM Plex Sans KR", system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(left), x + s2 - 2, yy + s2 - 1.5);
    }
    c.restore();
  }

  function drawTray(c, t) {
    const n = P.st.tray;
    const w = n * SLOT_GAP + 14;
    const x0 = (LW - w) / 2;
    c.save();
    c.beginPath(); rr(c, x0, 9, w, 42, 21);
    const gr = c.createLinearGradient(0, 9, 0, 51);
    gr.addColorStop(0, '#3d3549'); gr.addColorStop(1, '#262030');
    c.fillStyle = gr; c.fill();
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.12)'; c.stroke();
    for (let s = 0; s < n; s++) drawHole(c, trayX(s, n), TRAY_H / 2);
    c.restore();
  }

  function screwPosNow(sid) { return holePos(P.st.screws[sid].h); }

  function draw(t) {
    if (!layers) return;
    if (maskDirty) recomposeReveal();
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.setTransform(k, 0, 0, k, 0, 0);

    drawTray(c, t);
    const movingSid = P.moving ? P.moving.sid : -1;
    // 보관 구멍의 나사
    P.st.screws.forEach((s, sid) => {
      if (sid === movingSid || sid === P.sel) return;
      if (P.model.holes[s.h].tray) { const [x, y] = holePos(s.h); drawScrew(c, sid, x, y, false, t); }
    });

    // 보드
    c.save();
    c.beginPath(); rr(c, 0, BY, G.boardW, G.boardH, 18); c.clip();
    c.drawImage(layers.blur, 0, BY, G.boardW, G.boardH);
    c.drawImage(layers.reveal, 0, BY, G.boardW, G.boardH);
    if (P.clearT > 0) {
      c.globalAlpha = Math.min(1, P.clearT);
      c.drawImage(layers.clear, 0, BY, G.boardW, G.boardH);
      c.globalAlpha = 1;
    }
    if (P.clearT < 1) {
      const groups = new Map();
      P.st.screws.forEach((s, sid) => {
        if (sid === movingSid || sid === P.sel || P.model.holes[s.h].tray) return;
        const z = topPinZ(s.h);
        if (!groups.has(z)) groups.set(z, []);
        groups.get(z).push(sid);
      });
      const fade = 1 - Math.min(1, P.clearT * 2);
      c.globalAlpha = fade;
      // 판이 모두 떨어진 자리의 구멍
      P.model.holes.forEach((hole, h) => {
        if (hole.tray) return;
        if (hole.cover.some((cv) => P.st.alive[cv.p])) return;
        const [x, y] = holePos(h);
        drawHole(c, x, y);
      });
      const drawGroup = (z) => (groups.get(z) || []).forEach((sid) => { const [x, y] = screwPosNow(sid); drawScrew(c, sid, x, y, false, t); });
      drawGroup(-1);
      P.model.planks.forEach((p, z) => {
        if (!P.st.alive[z]) return;
        drawPlank(c, z, BY);
        drawGroup(z);
      });
      c.globalAlpha = 1;
    }
    c.restore();
    c.beginPath(); rr(c, 0.5, BY + 0.5, G.boardW - 1, G.boardH - 1, 18);
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke();

    // 옮길 수 있는 구멍 표시
    const pulse = REDUCED ? 0.5 : (Math.sin(t / 180) + 1) / 2;
    if (P.sel >= 0 && !P.busy) {
      for (let h = 0; h < P.model.holes.length; h++) {
        if (!R.canPlace(P.model, P.st, h)) continue;
        const [x, y] = holePos(h);
        c.beginPath(); c.arc(x, y, G.holeR + 3 + pulse * 2, 0, Math.PI * 2);
        c.lineWidth = 2.2; c.strokeStyle = `rgba(230,180,92,${0.55 + pulse * 0.4})`; c.stroke();
      }
    }
    // 튜토리얼·힌트 강조
    const glowAt = (x, y, col) => {
      c.beginPath(); c.arc(x, y, G.screwR + 5 + pulse * 3, 0, Math.PI * 2);
      c.lineWidth = 2.5; c.strokeStyle = col; c.stroke();
    };
    if (P.won) { /* 클리어 뒤에는 강조 표시 없음 */ }
    else if (P.hint && !P.busy) {
      if (P.sel !== P.hint.sid) { const [x, y] = screwPosNow(P.hint.sid); glowAt(x, y, `rgba(255,128,153,${0.6 + pulse * 0.4})`); }
      const [hx, hy] = holePos(P.hint.h); glowAt(hx, hy, `rgba(255,128,153,${0.6 + pulse * 0.4})`);
    } else if (P.tutorialStep === 1 && P.sel < 0) {
      P.st.screws.forEach((s, sid) => {
        if (R.screwStatus(P.model, P.st, sid) !== 'free') return;
        const [x, y] = screwPosNow(sid); glowAt(x, y, `rgba(230,180,92,${0.5 + pulse * 0.5})`);
      });
    }

    // 떨어지는 판
    P.falling.forEach((f) => {
      c.save();
      c.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      c.translate(f.cx + f.x, f.cy + BY + f.y);
      c.rotate(f.rot);
      c.translate(-f.cx, -f.cy - BY);
      drawPlank(c, f.z, BY, { flash: f.t < 0.12 ? 0.5 * (1 - f.t / 0.12) : 0 });
      c.restore();
    });
    // 파편
    P.particles.forEach((q) => {
      c.globalAlpha = Math.max(0, 1 - q.t / q.life);
      c.fillStyle = q.col;
      c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
    });
    c.globalAlpha = 1;
    // 들어 올린 나사, 이동 중인 나사
    if (P.sel >= 0) { const [x, y] = screwPosNow(P.sel); drawScrew(c, P.sel, x, y, true, t); }
    if (P.moving) {
      const m = P.moving;
      const u = Math.min(1, (t - m.t0) / m.dur);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const x = m.from[0] + (m.to[0] - m.from[0]) * e;
      const y = m.from[1] + (m.to[1] - m.from[1]) * e - Math.sin(Math.PI * u) * 26 - 7 * (1 - u);
      drawScrew(c, m.sid, x, y, u < 0.85, t);
    }
  }

  /* ---------- 애니메이션 루프 ---------- */
  function step(t) {
    rafId = requestAnimationFrame(step);
    const dt = Math.min(0.05, (t - (lastT || t)) / 1000);
    lastT = t;
    if (!P) return;
    // 드러남 진행
    for (let z = 0; z < P.reveal.length; z++) {
      if (P.reveal[z] < P.revealGoal[z]) { P.reveal[z] = Math.min(P.revealGoal[z], P.reveal[z] + dt / 0.55); maskDirty = true; }
    }
    P.falling = P.falling.filter((f) => {
      f.t += dt; f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      return f.t < 1.4;
    });
    P.particles = P.particles.filter((q) => {
      q.t += dt; q.vy += 900 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      return q.t < q.life;
    });
    if (P.clearing) {
      P.clearT = Math.min(1, P.clearT + dt / 1.1);
      if (P.clearT >= 1 && P.clearing) { P.clearing = false; setTimeout(showResult, 450); }
    }
    draw(t);
  }
  function startLoop() { if (!rafId) { lastT = 0; rafId = requestAnimationFrame(step); } }
  function stopLoop() { if (rafId) cancelAnimationFrame(rafId); rafId = 0; }

  /* ---------- 입력 ---------- */
  function onPointer(e) {
    if (!P || $('#screen-play').hidden) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (LW / rect.width);
    const y = (e.clientY - rect.top) * (LH / rect.height);
    onTap(x, y, performance.now());
  }
  canvas.addEventListener('pointerdown', onPointer);

  function onTap(x, y, now) {
    if (P.busy || P.won || P.clearT > 0) return;
    if (P.mode === 'hammer') {
      if (y < BY) return;
      for (let z = P.model.planks.length - 1; z >= 0; z--) {
        if (P.st.alive[z] && pointInPlank(P.model.planks[z], x, y - BY)) { useHammer(z); return; }
      }
      toast('판을 눌러 주세요.');
      return;
    }
    let best = null, bd = 24 * 24;
    P.st.screws.forEach((s, sid) => {
      const status = R.screwStatus(P.model, P.st, sid);
      if (status === 'blocked') return;
      const [sx, sy] = holePos(s.h);
      const d = (sx - x) ** 2 + (sy - y) ** 2;
      if (d < bd) { bd = d; best = { type: 'screw', sid, status }; }
    });
    if (P.sel >= 0) {
      for (let h = 0; h < P.model.holes.length; h++) {
        if (!R.canPlace(P.model, P.st, h)) continue;
        const [hx, hy] = holePos(h);
        const d = (hx - x) ** 2 + (hy - y) ** 2;
        if (d < bd) { bd = d; best = { type: 'hole', h }; }
      }
    }
    if (!best) { if (P.sel >= 0) { P.sel = -1; } return; }
    if (best.type === 'hole') { doMove(P.sel, best.h, now); return; }
    if (best.status === 'free') {
      P.sel = P.sel === best.sid ? -1 : best.sid;
      if (P.sel >= 0) { sfx('pick'); tutorialEvent('select'); }
      return;
    }
    P.shake = { sid: best.sid, t0: now };
    sfx('deny');
    if (best.status === 'ice') {
      const left = P.st.screws[best.sid].ice - P.st.moves;
      coach(`얼어 있어요. 다른 나사를 ${left}번 더 옮기면 녹아요.`, 2200);
    } else if (best.status === 'lock') {
      coach('잠겨 있어요. 열쇠가 그려진 판을 먼저 떨어뜨리세요.', 2200);
    }
  }

  function spawnParticles(z) {
    const p = P.model.planks[z];
    const g = plankGeom(p);
    const col = P.ch.planks[p.color % P.ch.planks.length];
    const n = REDUCED ? 0 : 14;
    for (let i = 0; i < n; i++) {
      P.particles.push({
        x: g.cx + (Math.random() - 0.5) * 40, y: g.cy + BY + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260 - 60,
        s: 2 + Math.random() * 3, t: 0, life: 0.6 + Math.random() * 0.4,
        col: i % 3 ? col : '#ffffff',
      });
    }
  }
  function startFalls(list) {
    list.forEach((z) => {
      const g = plankGeom(P.model.planks[z]);
      P.falling.push({ z, cx: g.cx, cy: g.cy, x: 0, y: 0, rot: 0, t: 0, vx: (Math.random() - 0.5) * 120, vy: -140, vr: (Math.random() - 0.5) * 3 });
      P.revealGoal[z] = 1;
      spawnParticles(z);
    });
    if (list.length) {
      sfx('drop');
      try { navigator.vibrate && navigator.vibrate(18); } catch (e) { /* 무시 */ }
      tutorialEvent('fall');
    }
    if (P.keyWasAlive && !R.keyAlive(P.model, P.st)) {
      P.keyWasAlive = false;
      setTimeout(() => { sfx('unlock'); coach('열쇠 판이 떨어져 자물쇠가 모두 풀렸어요.', 2400); }, 200);
    }
  }

  function doMove(sid, h, now) {
    const from = screwPosNow(sid);
    const res = R.move(P.model, P.st, sid, h);
    P.st = res.state;
    const to = holePos(h);
    P.sel = -1;
    P.busy = true;
    P.hint = null;
    P.moving = { sid, from, to, t0: now, dur: REDUCED ? 120 : 260 };
    const token = P.token;
    tutorialEvent('move');
    setTimeout(() => {
      if (!P || P.token !== token) return;
      P.moving = null;
      P.busy = false;
      sfx('place');
      startFalls(res.fallen);
      updateHud();
      afterChange();
    }, P.moving.dur);
  }

  function useHammer(z) {
    save.tools.hammer--; persist();
    P.usedTools = true;
    P.mode = null;
    P.hint = null;
    coach('');
    const res = R.smash(P.model, P.st, z);
    P.st = res.state;
    startFalls(res.fallen);
    updateHud();
    afterChange();
  }

  function afterChange() {
    if (R.won(P.st)) {
      P.won = true;
      updateHud();
      coach('');
      const token = P.token;
      setTimeout(() => { if (P && P.token === token) { P.clearing = true; sfx('win'); } }, 700);
      return;
    }
    if (!R.hasAnyMove(P.model, P.st)) { setTimeout(() => showStuck('none'), 500); return; }
    // 겉보기엔 움직일 수 있어도, 이미 풀 수 없는 상태인지 확인
    const token = P.token, snap = P.st;
    setTimeout(() => {
      if (!P || P.token !== token || P.st !== snap || P.won) return;
      const r = R.solve(P.model, P.st, { limit: 12000 });
      if (r.status === 'unsolvable' && P.st === snap) showStuck('dead');
    }, 400);
  }

  function showStuck(kind) {
    if (!P || P.won || !$('#sheet').hidden) return;
    const t = save.tools;
    openSheet(`
      <h2>${kind === 'none' ? '옮길 나사가 없어요' : '이대로는 풀 수 없어요'}</h2>
      <p class="muted">${kind === 'none' ? '빈 구멍이 모두 막혔어요.' : '남은 나사를 어떻게 옮겨도 모든 판을 떨어뜨릴 수 없는 배치가 됐어요.'} 도구를 쓰거나 처음부터 다시 해 보세요.</p>
      <div class="actions">
        <button class="btn" data-act="stuck-hammer" ${t.hammer ? '' : 'disabled'}>${ICON.hammer} 망치 (${t.hammer})</button>
        <button class="btn" data-act="stuck-hole" ${t.hole && P.st.tray < R.MAX_TRAY ? '' : 'disabled'}>${ICON.hole} 구멍 추가 (${t.hole})</button>
      </div>
      <div class="actions">
        <button class="btn" data-act="close-sheet">계속 보기</button>
        <button class="btn primary" data-act="restart">${ICON.restart} 다시 하기</button>
      </div>`);
  }

  function calcStars() {
    const par = P.level.par;
    let s = P.st.moves <= par + 1 ? 3 : P.st.moves <= Math.ceil(par * 1.5) + 1 ? 2 : 1;
    if (P.usedTools) s = Math.min(s, 2);
    return s;
  }

  function showResult() {
    if (!P || !P.won || $('#screen-play').hidden) return;
    const stars = calcStars();
    const prev = starsOf(P.id);
    const first = !prev;
    save.stars[P.id] = Math.max(prev, stars);
    let reward = '';
    if (first) {
      const tool = ['hammer', 'hole', 'hint'][(P.n - 1) % 3];
      save.tools[tool]++;
      reward = `첫 클리어 보상 · <b>${{ hammer: '망치', hole: '구멍 추가', hint: '힌트' }[tool]} +1</b>`;
    }
    const chapterDone = first && clearedCount(P.ch) === P.ch.stages.length;
    let unlockMsg = '';
    if (chapterDone) {
      const opened = C.characters.filter((c) => c.unlockAfter === P.ch.id).map((c) => c.name);
      if (opened.length && !save.unlockAll) unlockMsg = `${opened.join('와 ')}의 이야기가 열렸어요.`;
    }
    const bonusNow = prev < 3 && stars === 3 && totalStars(P.ch) === 15;
    persist();
    updateHud();
    const s = P.ch.stages[P.n - 1];
    const last = P.n === P.ch.stages.length;
    openSheet(`
      <div class="result-stars" aria-label="별 ${stars}개">${starsHtml(stars)}</div>
      <p class="result-meta">이동 ${P.st.moves}번 · 3별 목표 ${P.level.par + 1}번${P.usedTools ? ' · 도구를 쓰면 별은 최대 2개' : ''}</p>
      ${last ? `<p class="reveal-title">${esc(P.ch.name)}의 이면이 드러났습니다</p>` : ''}
      ${fragmentHtml(P.ch, P.n, true)}
      ${reward ? `<p class="reward">${reward}</p>` : ''}
      ${unlockMsg ? `<p class="reward">${esc(unlockMsg)}</p>` : ''}
      ${bonusNow ? `<p class="reward">별 15개 달성 · <b>비밀 메모</b>가 열렸어요</p>` : ''}
      <div class="actions">
        <button class="btn" data-act="restart">${ICON.restart} 다시 하기</button>
        <button class="btn" data-go="${P.ch.id}">목록</button>
        ${last
          ? `<button class="btn primary" data-act="viewer" data-ch="${P.ch.id}">${ICON.image} 일러스트 보기</button>`
          : `<button class="btn primary" data-go="${levelId(P.ch.id, P.n + 1)}">다음 이야기</button>`}
      </div>`);
  }

  /* ---------------- 전역 클릭 처리 ---------------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go],[data-act],[data-locked]');
    if (!el || el.disabled) return;
    if (el.hasAttribute('data-locked')) { toast(unlockText(charById(el.getAttribute('data-locked')))); return; }
    if (el.hasAttribute('data-go')) { go(el.getAttribute('data-go')); return; }
    const act = el.getAttribute('data-act');
    if (act === 'settings') openSettings();
    else if (act === 'close-sheet') closeSheet();
    else if (act === 'toggle-sound') { save.sound = !save.sound; persist(); el.setAttribute('aria-checked', save.sound); }
    else if (act === 'toggle-unlock') { save.unlockAll = !save.unlockAll; persist(); el.setAttribute('aria-checked', save.unlockAll); if (!$('#screen-home').hidden) showHome(); }
    else if (act === 'reset') {
      if (!resetArmed) { resetArmed = true; el.textContent = '한 번 더 누르면 초기화'; return; }
      save = defaultSave(); persist(); closeSheet(); toast('진행 상황을 초기화했어요.'); showHome();
    }
    else if (act === 'viewer') { closeSheet(); openViewer(charById(el.getAttribute('data-ch'))); }
    else if (act === 'close-viewer') {
      $('#viewer').hidden = true;
      if (!$('#screen-play').hidden && P) go(P.ch.id);
    }
    else if (act === 'restart') { if (P) { resetPuzzle(); introCoach(); } }
    else if (act === 'stuck-hammer') { closeSheet(); if (P.mode !== 'hammer') toggleHammer(); }
    else if (act === 'stuck-hole') { useHole(); afterChange(); }
  });
  $('#btn-back').innerHTML = ICON.back;
  $('#btn-restart').innerHTML = ICON.restart;
  $('#btn-back').addEventListener('click', () => { if (P) go(P.ch.id); });
  $('#btn-restart').addEventListener('click', () => { if (P && !P.busy) { resetPuzzle(); introCoach(); } });
  $('#tool-hammer').addEventListener('click', toggleHammer);
  $('#tool-hole').addEventListener('click', () => { useHole(); if (P && !P.won) afterChange(); });
  $('#tool-hint').addEventListener('click', useHint);
  $('#viewer').addEventListener('click', (e) => { if (e.target.tagName === 'IMG') e.currentTarget.querySelector('[data-act]').click(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!$('#viewer').hidden) $('#viewer [data-act]').click(); else closeSheet(); }
  });

  if (window.ResizeObserver) new ResizeObserver(() => { if (!$('#screen-play').hidden) resize(); }).observe($('#stage-wrap'));
  window.addEventListener('resize', () => { if (!$('#screen-play').hidden) resize(); });
  window.addEventListener('hashchange', route);

  // 검토·자동 테스트용 (브라우저 콘솔에서 __nasa.autoSolve() 실행)
  window.__nasa = {
    get state() { return P; },
    autoSolve(ms) {
      if (!P) return 'no puzzle';
      const r = bestPath(P.st);
      if (r.status !== 'solved') return r.status;
      let i = 0;
      const tick = () => {
        if (!P || i >= r.path.length) return;
        if (P.busy) { setTimeout(tick, 40); return; }
        const m = r.path[i++];
        doMove(m.sid, m.h, performance.now());
        setTimeout(tick, ms || 320);
      };
      tick();
      return r.path.length + ' moves';
    },
  };

  loadImages().then(route);
})();

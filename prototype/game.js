/*
 * 하트볼트(Heartbolt) — 웹 프로토타입 본체 (v0.3 · 성향 공략)
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
    heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor" stroke="none"/>'),
    spark: svg('<path d="M12 3l2.2 6.3L20.5 12l-6.3 2.2L12 21l-2.2-6.8L3.5 12l6.3-2.7z" fill="currentColor" stroke="none"/>'),
  };

  /* ---------------- 저장 ---------------- */
  const S = window.GAME_STORY;
  const SAVE_KEY = 'heartbolt-save-v4';
  const defaultSave = () => ({
    stars: {},      // 만남별 최고 별 수
    meet: {},       // 만남 결과. 1~4: { choice: trust|attract|push, stars }, 5: { choice: accept|slow, stars }, 6: { stars }
    hidden: {},     // 끌림 선택으로 연 숨은 속마음
    facts: {},      // 캐릭터별 알아낸 것 (facts 번호 목록)
    deduce: {},     // 캐릭터별 성향 추리 [1단계, 2단계] = { pick, correct, wrongs, lockedAt }
    clears: {},     // 캐릭터별 만남을 마친 횟수 (오답 뒤 다시 추리할 수 있는 시점 계산용)
    night: {},      // 캐릭터별 '둘만의 밤' 해금 여부
    endings: {},    // 캐릭터별 본 엔딩 { love, exposed, hesitant }
    tools: { hammer: 3, hole: 3, hint: 3 },
    unlockAll: false, sound: true, seen: {},
  });
  let save = loadSave();
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const base = defaultSave();
        return Object.assign(base, d, { tools: Object.assign(base.tools, d.tools || {}) });
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
  const routeOf = (ch) => S.routes[ch.id];
  const MEETINGS = 6;
  const starsOf = (id) => save.stars[id] || 0;
  const totalStars = (ch) => ch.stages.reduce((n, _, i) => n + starsOf(levelId(ch.id, i + 1)), 0);
  const endingCount = (ch) => Object.keys(save.endings[ch.id] || {}).length;
  const meetDone = (ch, n) => !!save.meet[levelId(ch.id, n)];
  const clearedCount = (ch) => [1, 2, 3, 4, 5, 6].filter((n) => meetDone(ch, n)).length;
  const clamp = (v) => Math.max(0, Math.min(100, v));

  // 알아낸 것: 만남 n의 a(판 절반) = 2(n-1), b(클리어) = 2(n-1)+1
  const factsOf = (ch) => save.facts[ch.id] || [];
  const knows = (ch, idx) => save.unlockAll || factsOf(ch).includes(idx);
  const knowsName = (ch) => knows(ch, 1);
  const displayName = (ch) => (knowsName(ch) ? ch.name : ch.alias);
  function learnFact(ch, idx) {
    if (factsOf(ch).includes(idx) || !ch.facts[idx]) return false;
    save.facts[ch.id] = factsOf(ch).concat(idx);
    persist();
    return true;
  }

  // 성향 추리 2단계
  const dedSteps = (ch) => save.deduce[ch.id] || [];
  const dedStep = (ch, i) => dedSteps(ch)[i] || null;
  const dedCorrect = (ch, i) => !!(dedStep(ch, i) && dedStep(ch, i).correct);
  const allCorrect = (ch) => dedCorrect(ch, 0) && dedCorrect(ch, 1);
  const wrongCount = (ch) => dedSteps(ch).reduce((n, d) => n + ((d && d.wrongs) || 0), 0);
  // 단계 i를 지금 추리할 수 있는가: 해당 만남을 마쳤고, 아직 정답 전이며, 오답 직후라면 만남을 하나 더 마친 뒤
  function canDeduce(ch, i) {
    const d = ch.deductions[i];
    if (!meetDone(ch, d.after) || dedCorrect(ch, i)) return false;
    const st = dedStep(ch, i);
    return !st || (save.clears[ch.id] || 0) > st.lockedAt;
  }
  // 정답을 맞힌 단계의 역할 능력
  const abilitiesOf = (ch) => ch.deductions.filter((_, i) => dedCorrect(ch, i)).map((d) => d.ability);

  // 신뢰 = 그녀가 허락한 깊이, 끌림 = 그녀의 성향에 맞게 반응한 정도
  function gauges(ch) {
    let trust = 0, attraction = 0;
    for (let n = 1; n <= 5; n++) {
      const m = save.meet[levelId(ch.id, n)];
      if (!m) continue;
      const fx = n < 5 ? S.rules.choice[m.choice] : S.rules.finale[m.choice];
      if (fx) { trust += fx.trust; attraction += fx.attraction; }
      if (m.stars === 3) attraction += S.rules.starBonus;
    }
    attraction += S.rules.deduceBonus * ch.deductions.filter((_, i) => dedCorrect(ch, i)).length;
    trust -= S.rules.wrongPenalty * wrongCount(ch);
    return { trust: clamp(trust), attraction: clamp(attraction) };
  }
  function loveReady(ch) {
    const g = gauges(ch);
    return g.trust >= S.rules.love.trust && g.attraction >= S.rules.love.attraction && allCorrect(ch);
  }
  function chapterUnlocked(ch) {
    if (save.unlockAll || !ch.unlockAfter) return true;
    return meetDone(charById(ch.unlockAfter), 1);
  }
  function stageUnlocked(ch, n) {
    if (!LV[levelId(ch.id, n)]) return false; // 레벨 데이터가 아직 없으면 잠금
    if (!chapterUnlocked(ch)) return false;
    if (save.unlockAll || n === 1) return true;
    if (n <= 4) return meetDone(ch, n - 1);
    if (n === 5) return meetDone(ch, 4) && !!dedStep(ch, 1);
    return !!save.night[ch.id];
  }
  const unlockText = (ch) => `${displayName(charById(ch.unlockAfter))}와의 첫 만남을 마치면 열려요`;

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
      else if (kind === 'inject') { tone(330, 0.5, 'sine', 0.16, 0, 990); tone(1320, 0.4, 'triangle', 0.07, 0.35); tone(1760, 0.5, 'triangle', 0.06, 0.5); }
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
    ['home', 'chapter', 'play', 'scene'].forEach((n) => { $('#screen-' + n).hidden = n !== name; });
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

  /* ---------------- 라우팅 (#zena = 공략 노트, #zena-2 = 만남 2) ---------------- */
  function go(hash) {
    if (location.hash.slice(1) === hash) route();
    else location.hash = hash;
  }
  function route() {
    closeSheet();
    $('#viewer').hidden = true;
    stopScene();
    flowSeq++;
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h && !save.seen.prologue) return playPrologue();
    const ch = charById(h);
    if (ch) return chapterUnlocked(ch) ? showChapter(ch) : showHome();
    const m = /^([a-z]+)-(\d)$/.exec(h);
    if (m && charById(m[1]) && LV[h]) {
      const c2 = charById(m[1]);
      if (stageUnlocked(c2, +m[2])) return startMeeting(c2, +m[2]);
      return go(c2.id);
    }
    showHome();
  }

  /* ---------------- 홈: 처음에는 최소한의 정보만 ---------------- */
  function showHome() {
    const el = $('#screen-home');
    el.innerHTML = `
      <header class="home-head">
        <div>
          <p class="logo-en">HEARTBOLT</p>
          <h1 class="logo"><span class="logo-heart">하트</span><span class="logo-bolt">볼트</span></h1>
          <p class="tagline">${esc(C.subtitle)}</p>
        </div>
        <button class="icon-btn" data-act="settings" aria-label="설정">${ICON.gear}</button>
      </header>
      <p class="section-label">하트볼트가 보이는 사람</p>
      <div class="char-list">${C.characters.map(charCard).join('')}</div>
      <p class="foot">프로토타입 v0.4 · 국내판 수위 · 진행 상황은 이 기기의 브라우저에만 저장됩니다</p>`;
    showScreen('home');
  }
  function gaugeHtml(g, compact) {
    return `<span class="gauges${compact ? ' compact' : ''}">
      <span class="gauge trust"><span class="gauge-label">${ICON.spark}신뢰</span><span class="gauge-bar"><i style="width:${g.trust}%"></i></span><b>${g.trust}</b></span>
      <span class="gauge attraction"><span class="gauge-label">${ICON.heart}끌림</span><span class="gauge-bar"><i style="width:${g.attraction}%"></i></span><b>${g.attraction}</b></span>
    </span>`;
  }
  function charCard(ch) {
    const open = chapterUnlocked(ch);
    const pips = [1, 2, 3, 4, 5, 6].map((n) => `<span class="pip ${meetDone(ch, n) ? 'on' : ''}"></span>`).join('');
    const known = factsOf(ch).length;
    return `
      <button class="char-card ${open ? '' : 'locked'}" data-${open ? 'go' : 'locked'}="${ch.id}" style="--accent:${ch.accent}">
        <span class="portrait" style="${bgCss(ch, ch.portrait)}"></span>
        ${open ? '' : `<span class="char-lock">${ICON.lock}</span>`}
        <span class="char-info">
          <span class="char-name">${open ? esc(displayName(ch)) : '???'}${open && knowsName(ch) ? `<small>${ch.nameEn}</small>` : ''}</span>
          <span class="char-role">${open ? (known ? `알아낸 것 ${known}/12` : '아직 아무것도 모르는 사람') : esc(unlockText(ch))}</span>
          <span class="char-progress"><span class="pips">${pips}</span><span>${open ? `만남 ${clearedCount(ch)}/6` : ''}</span></span>
        </span>
      </button>`;
  }

  /* ---------------- 공략 노트: 알게 된 만큼만 보여 줍니다 ---------------- */
  function nextAction(ch) {
    for (let i = 0; i < 2; i++) {
      if (canDeduce(ch, i) && !dedStep(ch, i)) return { act: 'deduce', step: i, label: `성향 추리 ${i + 1}단계` };
    }
    for (let n = 1; n <= MEETINGS; n++) {
      if (!meetDone(ch, n) && stageUnlocked(ch, n)) {
        const mt = routeOf(ch).meetings[n - 1];
        return { go: levelId(ch.id, n), label: n === 5 ? '하트볼트' : n === 6 ? '둘만의 밤' : `만남 ${n} · ${mt.place}` };
      }
    }
    if (meetDone(ch, 4) && !dedStep(ch, 1) && canDeduce(ch, 1)) return { act: 'deduce', step: 1, label: '성향 추리 2단계' };
    return null;
  }
  function showChapter(ch) {
    const el = $('#screen-chapter');
    const next = nextAction(ch);
    const facts = factsOf(ch).slice().sort((a, b) => a - b);
    const roles = ch.deductions.filter((_, i) => dedCorrect(ch, i));
    el.style.setProperty('--accent', ch.accent);
    el.innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-go="" aria-label="그녀 목록으로">${ICON.back}</button>
        <span class="topbar-title">${esc(displayName(ch))}</span>
        <span class="topbar-spacer"></span>
      </div>
      <section class="chapter-hero">
        <div class="hero-portrait" style="${bgCss(ch, ch.portrait)}"></div>
        <div class="hero-info">
          <p class="eyebrow">${knowsName(ch) ? ch.nameEn : '???'}</p>
          <h2 class="hero-name">${esc(displayName(ch))}</h2>
          <p class="hero-outer">${knows(ch, 0) ? esc(ch.facts[0][1]) : '아직 아무것도 모르는 사람'}</p>
          ${roles.length ? `<span class="gimmick-row">${roles.map((d) => `<span class="role-chip">${esc(d.role)}</span>`).join('')}</span>` : ''}
        </div>
      </section>
      ${next ? `<button class="btn primary wide next-cta" ${next.go ? `data-go="${next.go}"` : `data-act="deduce" data-ch="${ch.id}" data-step="${next.step}"`}>${next.act ? ICON.spark : ''}${esc(next.label)}</button>` : ''}
      ${meetDone(ch, 1) ? gaugeHtml(gauges(ch)) : ''}
      ${facts.length ? `<p class="section-label">알아낸 것 ${facts.length}/12</p>
        <dl class="fact-list">${facts.map((i) => `<div><dt>${esc(ch.facts[i][0])}</dt><dd>${esc(ch.facts[i][1])}</dd></div>`).join('')}</dl>` : '<p class="note-result">판을 떨어뜨릴 때마다 그녀에 대해 조금씩 알게 돼요.</p>'}
      ${meetDone(ch, 2) || save.unlockAll ? `<p class="section-label">성향 노트</p>${prefNote(ch)}` : ''}
      <p class="section-label">만남</p>
      <ol class="stage-list">${ch.stages.map((s, i) => stageRow(ch, s, i + 1)).filter(Boolean).join('')}</ol>
      ${albumHtml(ch)}
      ${fragmentsHtml(ch)}
      ${meetDone(ch, 5) || endingCount(ch) || save.unlockAll ? `<p class="section-label">엔딩 ${endingCount(ch)}/3</p><div class="ending-list">${endingRows(ch)}</div>` : ''}`;
    el.scrollTop = 0;
    showScreen('chapter');
  }
  function collectedClues(ch) {
    const rt = routeOf(ch);
    const out = [];
    for (let n = 1; n <= 4; n++) {
      const id = levelId(ch.id, n);
      if (!meetDone(ch, n)) continue;
      out.push({ n, text: rt.meetings[n - 1].clue });
      if (save.hidden[id]) out.push({ n, text: '‘' + rt.meetings[n - 1].hidden + '’', hidden: true });
    }
    return out;
  }
  function stepStatusHtml(ch, i) {
    const d = ch.deductions[i];
    const st = dedStep(ch, i);
    if (dedCorrect(ch, i)) {
      const ab = C.abilities[d.ability];
      return `<div class="step ok"><span class="step-no">${i + 1}단계</span><strong>${esc(d.answer)}</strong>
        <span class="step-role">당신의 역할 · ${esc(d.role)} — ${esc(ab.name)}: ${esc(ab.desc)}</span></div>`;
    }
    if (!meetDone(ch, d.after) && !save.unlockAll) return `<div class="step"><span class="step-no">${i + 1}단계</span><span class="step-role">만남 ${d.after}을 마치면 추리할 수 있어요.</span></div>`;
    if (st && !canDeduce(ch, i)) return `<div class="step miss"><span class="step-no">${i + 1}단계</span><strong>빗나감 · ${esc(st.pick)}</strong><span class="step-role">만남을 하나 더 마치면 다시 추리할 수 있어요.</span></div>`;
    return `<div class="step"><span class="step-no">${i + 1}단계</span><button class="btn" data-act="deduce" data-ch="${ch.id}" data-step="${i}">${ICON.spark} ${st ? '다시 추리하기' : '추리하기'}</button></div>`;
  }
  function prefNote(ch) {
    const clues = collectedClues(ch);
    return `<section class="pref-note">
      ${stepStatusHtml(ch, 0)}
      ${stepStatusHtml(ch, 1)}
      ${clues.length ? `<details class="clue-box"><summary>모은 단서 ${clues.length}개</summary><ul class="clue-list">${clues.map((c) => `<li class="${c.hidden ? 'hidden-clue' : ''}"><span>만남 ${c.n}</span>${esc(c.text)}</li>`).join('')}</ul></details>` : ''}
    </section>`;
  }
  const fragmentOpen = (ch, n) => (n <= 5 ? meetDone(ch, n) : !!(save.endings[ch.id] || {}).love);
  function stageRow(ch, s, n) {
    const id = levelId(ch.id, n);
    const open = stageUnlocked(ch, n);
    const done = meetDone(ch, n);
    // 아직 열리지 않은 미래의 만남은 목록에 보이지 않습니다
    if (!done && !open) return '';
    const m = save.meet[id];
    const choiceName = { trust: '신뢰 선택', attract: '끌림 선택', push: '밀어붙이기', accept: '받아들임', slow: '천천히' };
    const sub = m && m.choice ? `${choiceName[m.choice]} · 다시 만나면 바꿀 수 있어요` : m ? '다시 볼 수 있어요' : routeOf(ch).meetings[n - 1].place;
    const title = n === 5 ? '하트볼트' : n === 6 ? '둘만의 밤' : s.title;
    return `<li><button class="stage-row ${done ? 'cleared' : ''}" data-go="${id}">
      <span class="stage-num">${n}</span>
      <span class="stage-title">${esc(title)}<small>${esc(sub)}</small></span>
      <span class="stage-stars">${starsHtml(starsOf(id))}</span>
    </button></li>`;
  }
  function endingRows(ch) {
    const got = save.endings[ch.id] || {};
    const eds = routeOf(ch).endings;
    return ['love', 'exposed', 'hesitant'].map((k) => {
      const t = S.endingTypes[k];
      return got[k]
        ? `<div class="ending-row got ending-${k}"><span class="ending-type">${t.name}</span><strong>${esc(eds[k].title)}</strong></div>`
        : `<div class="ending-row"><span class="ending-type">${t.name}</span><strong>???</strong><small>${esc(t.hint)}</small></div>`;
    }).join('');
  }
  function fragmentHtml(ch, n) {
    const s = ch.stages[n - 1];
    const id = levelId(ch.id, n);
    const hiddenLine = n <= 4 ? routeOf(ch).meetings[n - 1].hidden : null;
    const hiddenHtml = hiddenLine && save.hidden[id] ? `<p class="fragment-hidden"><span>숨은 속마음</span>‘${esc(hiddenLine)}’</p>` : '';
    return `<article class="fragment${n === 5 ? ' heart-card' : ''}">
      <p class="fragment-type">마음 조각 ${n} · ${C.cardTypes[n - 1]}</p>
      <h3>${esc(n === 5 ? ch.preference.main + ' · ' + ch.preference.sub : s.title)}</h3>
      ${s.card.quote ? `<p class="fragment-quote">${esc(s.card.quote)}</p>` : ''}
      <p class="fragment-body">${esc(s.card.body)}</p>
      ${hiddenHtml}
    </article>`;
  }
  // 모은 마음 조각만 보여 줍니다. 비밀 메모는 조건을 채웠을 때만 나타납니다
  function fragmentsHtml(ch) {
    const open = ch.stages.map((_, i) => i + 1).filter((n) => fragmentOpen(ch, n));
    const need = MEETINGS * 3;
    const bonus = totalStars(ch) >= need
      ? `<article class="fragment bonus"><p class="fragment-type">비밀 메모 · 별 ${need}개 달성</p><h3>${esc(ch.bonus.title)}</h3><p class="fragment-body">${esc(ch.bonus.body)}</p></article>` : '';
    if (!open.length && !bonus) return '';
    return `<p class="section-label">마음 조각 ${open.length}/6</p><div class="card-list">${open.map((n) => fragmentHtml(ch, n)).join('')}${bonus}</div>`;
  }

  /* ---------------- 앨범: 역할이 깨어나면 관련 이미지가 열립니다 ---------------- */
  function albumItems(ch) {
    const items = ch.deductions.map((d, i) => ({ key: 'd' + i, open: dedCorrect(ch, i) || save.unlockAll, ...d.image }));
    items.push({ key: 'love', open: !!(save.endings[ch.id] || {}).love || save.unlockAll, title: '하트볼트 너머의 그녀', caption: routeOf(ch).endings.love.title, crop: { cx: 0.5, cy: 0.5, zoom: 1 }, effect: 'none' });
    return items;
  }
  function albumHtml(ch) {
    const items = albumItems(ch);
    const open = items.filter((x) => x.open);
    if (!open.length) return '';
    return `<p class="section-label">앨범 ${open.length}/${items.length}</p>
      <div class="album">${items.map((x) => x.open
        ? `<button class="album-item" data-act="album" data-ch="${ch.id}" data-key="${x.key}"><span class="album-art fx-${x.effect}" style="${bgCss(ch, x.crop)}"></span><span>${esc(x.title)}</span></button>`
        : `<span class="album-item locked"><span class="album-art"></span><span>???</span></span>`).join('')}</div>`;
  }
  function openViewer(ch, key) {
    const item = albumItems(ch).find((x) => x.key === (key || 'love')) || albumItems(ch)[2];
    const v = $('#viewer');
    v.innerHTML = `
      <div class="viewer-art fx-${item.effect}" style="${bgCss(ch, item.crop)}" role="img" aria-label="${esc(item.title)}"></div>
      <p class="viewer-cap"><strong>${esc(item.title)}</strong>${esc(item.caption)}</p>
      <button class="btn" data-act="close-viewer">${ICON.close} 닫기</button>`;
    v.hidden = false;
  }

  /* ---------------- 성향 추리 (2단계, 맞히면 역할이 깨어남) ---------------- */
  let deducePick = null;
  function openDeduction(ch, i) {
    const d = ch.deductions[i];
    deducePick = null;
    const clues = collectedClues(ch);
    const render = () => {
      openSheet(`
        <p class="eyebrow center">성향 추리 ${i + 1}/2 · ${esc(displayName(ch))}</p>
        <h2>${i === 0 ? '그녀는 어떤 사람일까' : '하트볼트에 잠긴 또 하나의 성향'}</h2>
        <p class="muted">단서를 보고 하나를 고르세요. 맞히면 당신의 역할이 깨어나 퍼즐을 다루는 능력이 생깁니다. 틀리면 그녀가 당황해 신뢰가 ${S.rules.wrongPenalty} 떨어져요.</p>
        <details class="clue-box" open><summary>모은 단서 ${clues.length}개</summary><ul class="clue-list">${clues.map((c) => `<li class="${c.hidden ? 'hidden-clue' : ''}"><span>만남 ${c.n}</span>${esc(c.text)}</li>`).join('')}</ul></details>
        <div class="pref-chips">${d.options.map((o) => `
          <button class="pref-chip ${deducePick === o ? 'on' : ''}" data-pick="${esc(o)}" aria-pressed="${deducePick === o}">
            <strong>${esc(o)}</strong><small>${esc(C.preferenceGlossary[o] || '')}</small>
          </button>`).join('')}</div>
        <div class="actions">
          <button class="btn" data-act="close-sheet">나중에</button>
          <button class="btn primary" data-act="deduce-confirm" data-ch="${ch.id}" data-step="${i}" ${deducePick ? '' : 'disabled'}>${deducePick ? '이 성향이 맞다' : '하나를 고르세요'}</button>
        </div>`);
    };
    openDeduction.render = render;
    render();
  }
  function confirmDeduction(ch, i) {
    if (!deducePick) return;
    const d = ch.deductions[i];
    const prev = dedStep(ch, i) || { wrongs: 0 };
    const correct = deducePick === d.answer;
    const steps = dedSteps(ch).slice();
    steps[i] = { pick: deducePick, correct, wrongs: prev.wrongs + (correct ? 0 : 1), lockedAt: save.clears[ch.id] || 0 };
    save.deduce[ch.id] = steps;
    persist();
    if (correct) {
      const ab = C.abilities[d.ability];
      sfx('unlock');
      openSheet(`
        <p class="ending-badge ending-love">역할 각성</p>
        <h2 class="ending-title">${esc(d.role)}</h2>
        <p class="muted center">그녀의 성향 · <b>${esc(d.answer)}</b></p>
        <div class="ability-card"><strong>${esc(ab.name)}</strong><span>${esc(ab.desc)}</span></div>
        <button class="album-reveal" data-act="album" data-ch="${ch.id}" data-key="d${i}">
          <span class="album-art fx-${d.image.effect}" style="${bgCss(ch, d.image.crop)}"></span>
          <span><b>앨범에 새 이미지</b>${esc(d.image.title)}</span>
        </button>
        <div class="actions"><button class="btn primary" data-go="${ch.id}">계속</button></div>`);
    } else {
      sfx('deny');
      openSheet(`
        <h2>그녀가 당황했어요</h2>
        <p class="muted">‘${esc(deducePick)}’… 그녀의 표정이 굳었습니다. 섣부른 짐작에 신뢰가 ${S.rules.wrongPenalty} 떨어졌어요. 만남을 하나 더 마치고 단서를 모은 뒤 다시 추리할 수 있어요.</p>
        <div class="actions"><button class="btn primary" data-go="${ch.id}">확인</button></div>`);
    }
  }

  /* ---------------- 설정 ---------------- */
  let resetArmed = false;
  function openSettings() {
    resetArmed = false;
    openSheet(`
      <h2>설정</h2>
      <div class="setting-row"><span>효과음</span><button class="switch" role="switch" aria-checked="${save.sound}" data-act="toggle-sound" aria-label="효과음"></button></div>
      <div class="setting-row"><span>모든 만남 열기<small>프로토타입 검토용. 잠금 조건과 사랑 엔딩 조건을 무시하고, 정보도 모두 보여 줍니다.</small></span><button class="switch" role="switch" aria-checked="${save.unlockAll}" data-act="toggle-unlock" aria-label="모든 만남 열기"></button></div>
      <div class="setting-row"><span>판 구성<small>지금은 국내판(하트볼트) 수위입니다. 성인판(Heartbolt: After Dark)은 만남 6의 장면과 일러스트만 바뀝니다.</small></span></div>
      <div class="setting-row"><span>프롤로그 다시 보기</span><button class="btn" data-act="prologue">보기</button></div>
      <div class="setting-row"><span>진행 초기화<small>신뢰, 끌림, 추리, 알아낸 것, 엔딩, 별, 도구 개수를 처음 상태로 되돌립니다.</small></span><button class="btn" data-act="reset" id="btn-reset">초기화</button></div>
      <div class="actions"><button class="btn primary" data-act="close-sheet">닫기</button></div>`);
  }

  /* ---------------- 대화 장면 ---------------- */
  const SC = { lines: [], i: 0, typing: 0, full: '', done: null, choiceResolve: null };
  let flowSeq = 0;       // 화면을 벗어나면 진행 중이던 대화 흐름을 무효로 만듭니다
  let current = null;    // 진행 중인 만남 { ch, n, choice }

  function sceneSpeaker(who, tag) {
    if (who === 'narr') return null;
    if (who === 'me') return { name: '나', color: 'var(--brass)' };
    const c = charById(who);
    const nm = displayName(c);
    return { name: tag === 'hidden' ? `${nm}의 속마음` : nm, color: tag === 'hidden' ? 'var(--heart)' : c.accent };
  }
  function showSceneFrame(ch, place) {
    const bg = $('#scene-bg');
    if (ch) { bg.setAttribute('style', bgCss(ch, routeOf(ch).scene)); bg.classList.remove('empty'); }
    else { bg.removeAttribute('style'); bg.classList.add('empty'); }
    $('#scene-place').textContent = place || '';
    $('#scene-choices').hidden = true;
    $('#scene-box').hidden = false;
    showScreen('scene');
  }
  function playLines(lines) {
    return new Promise((resolve) => {
      SC.lines = lines; SC.i = 0; SC.done = resolve;
      showLine();
    });
  }
  function showLine() {
    const [who, text, tag] = SC.lines[SC.i];
    const sp = sceneSpeaker(who, tag);
    const name = $('#scene-name');
    name.hidden = !sp;
    if (sp) { name.textContent = sp.name; name.style.background = sp.color; }
    const thought = who === 'me' && text.charAt(0) === '(';
    $('#scene-box').className = 'scene-box' + (who === 'narr' ? ' narr' : '') + (thought ? ' thought' : '') + (tag ? ' ' + tag + '-line' : '');
    const el = $('#scene-text');
    clearInterval(SC.typing);
    SC.typing = 0;
    SC.full = text;
    if (REDUCED) { el.textContent = text; return; }
    let n = 0;
    el.textContent = '';
    SC.typing = setInterval(() => {
      n++;
      el.textContent = text.slice(0, n);
      if (n >= text.length) { clearInterval(SC.typing); SC.typing = 0; }
    }, 26);
  }
  function advanceScene() {
    if (!SC.done || SC.choiceResolve) return;
    if (SC.typing) { clearInterval(SC.typing); SC.typing = 0; $('#scene-text').textContent = SC.full; return; }
    SC.i++;
    if (SC.i >= SC.lines.length) { const d = SC.done; SC.done = null; d(); return; }
    showLine();
  }
  function skipScene() {
    if (!SC.done || SC.choiceResolve) return;
    clearInterval(SC.typing); SC.typing = 0;
    const d = SC.done; SC.done = null; d();
  }
  function stopScene() {
    clearInterval(SC.typing); SC.typing = 0;
    SC.done = null; SC.choiceResolve = null;
    $('#scene-choices').hidden = true;
  }
  function askChoice(opts) {
    return new Promise((resolve) => {
      const box = $('#scene-choices');
      box.innerHTML = opts.map((o) => `<button class="choice ${o.key}" data-choice="${o.key}">${esc(o.label)}${o.note ? `<small>${esc(o.note)}</small>` : ''}</button>`).join('');
      box.hidden = false;
      $('#scene-box').hidden = true;
      SC.choiceResolve = (k) => { SC.choiceResolve = null; box.hidden = true; $('#scene-box').hidden = false; resolve(k); };
    });
  }

  /* ---------------- 프롤로그 ---------------- */
  async function playPrologue() {
    const tk = ++flowSeq;
    current = null;
    showSceneFrame(null, '프롤로그 · 하트 드라이버');
    await playLines(S.prologue);
    if (tk !== flowSeq) return;
    save.seen.prologue = true;
    persist();
    go('');
  }

  /* ---------------- 만남 진행 ---------------- */
  // 선택지 → 퍼즐 변형: 신뢰 선택은 쉬운 변형(safe), 끌림·밀어붙이기는 어려운 변형(deep)
  const variantOf = (choice) => (choice === 'trust' ? 'safe' : 'deep');

  async function startMeeting(ch, n) {
    const tk = ++flowSeq;
    const rt = routeOf(ch);
    const mt = rt.meetings[n - 1];
    current = { ch, n, choice: null };
    const label = n === 5 ? `하트볼트 · ${mt.place}` : n === 6 ? `둘만의 밤 · ${mt.place}` : `만남 ${n} · ${mt.place}`;
    showSceneFrame(ch, label);
    await playLines(mt.intro);
    if (tk !== flowSeq) return;
    let variant = null;
    if (n <= 4) {
      const opts = [
        { key: 'trust', label: mt.choices.trust.label, note: S.choiceNote.trust },
        { key: 'attract', label: mt.choices.attract.label, note: S.choiceNote.attract },
      ];
      if (mt.choices.push) opts.push({ key: 'push', label: mt.choices.push.label, note: S.choiceNote.push });
      const key = await askChoice(opts);
      if (tk !== flowSeq) return;
      current.choice = key;
      variant = variantOf(key);
      await playLines([...mt.choices[key].reply, S.wall]);
    } else if (n === 5) {
      const key = await askChoice([
        { key: 'accept', label: mt.choices.accept.label, note: S.choiceNote.accept },
        { key: 'slow', label: mt.choices.slow.label, note: S.choiceNote.slow },
      ]);
      if (tk !== flowSeq) return;
      current.choice = key;
      variant = allCorrect(ch) ? 'safe' : 'deep';
      const verdict = allCorrect(ch)
        ? ['narr', `그녀가 털어놓은 성향은 내가 알아본 그대로였다. ${ch.preference.main}, 그리고 ${ch.preference.sub}.`]
        : ['narr', '그녀가 털어놓은 성향은 내 짐작과 달랐다. 하트볼트가 낯선 모양으로 단단히 조여 온다.'];
      await playLines([...mt.choices[key].reply, verdict, S.heartWall]);
    }
    if (tk !== flowSeq) return;
    startPlay(ch, n, variant);
  }

  // 퍼즐을 풀고 하트 드라이버 연출까지 끝난 뒤 호출됩니다.
  async function finishMeeting() {
    if (!P || !current || !P.won || $('#screen-play').hidden) return;
    const tk = ++flowSeq;
    const { ch, n } = current;
    const id = levelId(ch.id, n);
    const rt = routeOf(ch);
    const mt = rt.meetings[n - 1];
    const stars = calcStars();
    const summary = { ch, n, stars, moves: P.st.moves, par: P.level.par, usedTools: P.usedTools, before: gauges(ch) };
    const first = !meetDone(ch, n);
    save.stars[id] = Math.max(starsOf(id), stars);
    save.clears[ch.id] = (save.clears[ch.id] || 0) + 1;
    // 퍼즐을 다 풀면 이 만남의 두 번째 정보가 열립니다 (첫 번째는 판이 절반 떨어질 때 열림)
    const fb = 2 * (n - 1) + 1;
    if (learnFact(ch, fb)) P.newFacts.push(fb);
    summary.facts = P.newFacts.slice();
    if (first) {
      const tool = ['hammer', 'hole', 'hint'][(n - 1) % 3];
      save.tools[tool]++;
      summary.reward = `첫 클리어 보상 · <b>${{ hammer: '망치', hole: '구멍 추가', hint: '힌트' }[tool]} +1</b>`;
    }
    summary.first = first;

    if (n <= 4) {
      summary.newHidden = current.choice === 'attract' && !save.hidden[id];
      save.meet[id] = { choice: current.choice, stars };
      if (current.choice === 'attract') save.hidden[id] = true;
      persist();
      summary.after = gauges(ch);
      summary.clue = first ? mt.clue : null;
      showSceneFrame(ch, `만남 ${n} · ${mt.place}`);
      const lines = mt.after.slice();
      if (current.choice === 'attract') lines.push([ch.id, '‘' + mt.hidden + '’', 'hidden']);
      await playLines(lines);
      if (tk !== flowSeq) return;
      showMeetingResult(summary);
      return;
    }

    if (n === 5) {
      save.meet[id] = { choice: current.choice, stars };
      persist();
      summary.after = gauges(ch);
      if (loveReady(ch)) {
        save.night[ch.id] = true;
        persist();
        showSceneFrame(ch, `하트볼트 · ${mt.place}`);
        await playLines(mt.promise);
        if (tk !== flowSeq) return;
        showHeartResult(summary);
      } else {
        const g = summary.after;
        const ending = g.attraction >= S.rules.exposed.attraction && g.trust < S.rules.love.trust ? 'exposed' : 'hesitant';
        await playEnding(ch, ending, summary, tk);
      }
      return;
    }

    // n === 6: 둘만의 밤 → 사랑 엔딩
    save.meet[id] = { stars };
    persist();
    summary.after = gauges(ch);
    showSceneFrame(ch, `둘만의 밤 · ${mt.place}`);
    await playLines([...mt.night, ['narr', '— 성인판(Heartbolt: After Dark)에서는 이 장면이 확장됩니다 —', 'edition']]);
    if (tk !== flowSeq) return;
    await playEnding(ch, 'love', summary, tk);
  }

  async function playEnding(ch, ending, summary, tk) {
    summary.ending = ending;
    summary.isNew = !(save.endings[ch.id] || {})[ending];
    save.endings[ch.id] = Object.assign(save.endings[ch.id] || {}, { [ending]: true });
    persist();
    showSceneFrame(ch, `엔딩 · ${S.endingTypes[ending].name}`);
    await playLines(routeOf(ch).endings[ending].lines);
    if (tk !== flowSeq) return;
    showEndingResult(summary);
  }

  function deltaText(label, a, b) {
    const d = b - a;
    return `${label} ${a} → ${b}${d ? ` (${d > 0 ? '+' : ''}${d})` : ''}`;
  }
  function resultHead(r) {
    return `
      <div class="result-stars" aria-label="별 ${r.stars}개">${starsHtml(r.stars)}</div>
      <p class="result-meta">이동 ${r.moves}번 · 3별 목표 ${starGoal(r.par)}번 이내${r.usedTools ? ' · 도구를 쓰면 별은 최대 2개' : ''}</p>`;
  }
  function factChips(ch, list) {
    if (!list || !list.length) return '';
    return `<div class="fact-chips"><span class="fact-chips-title">새로 알아낸 것</span>${list.map((i) => `<span class="fact-chip"><b>${esc(ch.facts[i][0])}</b>${esc(ch.facts[i][1])}</span>`).join('')}</div>`;
  }
  function showMeetingResult(r) {
    const { ch, n } = r;
    showScreen('play');
    const stepNow = ch.deductions.findIndex((d) => d.after === n);
    const deduceNow = stepNow >= 0 && canDeduce(ch, stepNow);
    const next = deduceNow
      ? `<button class="btn primary" data-act="deduce" data-ch="${ch.id}" data-step="${stepNow}">${ICON.spark} 성향 추리하기</button>`
      : n === 4 && !dedStep(ch, 1) ? `<button class="btn primary" data-go="${ch.id}">공략 노트</button>`
        : `<button class="btn primary" data-go="${levelId(ch.id, n + 1)}">${n === 4 ? '하트볼트로' : '다음 만남'}</button>`;
    openSheet(`
      ${resultHead(r)}
      <p class="inject-line">볼트 ${n}/6 해제</p>
      ${factChips(ch, r.facts)}
      <p class="result-meta">${deltaText('신뢰', r.before.trust, r.after.trust)} · ${deltaText('끌림', r.before.attraction, r.after.attraction)}</p>
      ${r.first ? fragmentHtml(ch, n) : ''}
      ${r.clue ? `<p class="reward clue-reward"><span>성향 노트에 단서 추가</span>${esc(r.clue)}</p>` : ''}
      ${deduceNow ? '<p class="reward">단서가 모였어요. 그녀의 성향을 추리해 보세요.</p>' : ''}
      ${r.first && n === 1 && C.characters.some((c) => c.unlockAfter === ch.id) && !save.unlockAll ? '<p class="reward">다른 사람의 하트볼트도 보이기 시작했어요.</p>' : ''}
      ${r.reward ? `<p class="reward">${r.reward}</p>` : ''}
      <div class="actions">
        <button class="btn" data-act="replay">${ICON.restart} 다시 만나기</button>
        ${next}
      </div>`);
  }
  function showHeartResult(r) {
    const { ch } = r;
    showScreen('play');
    openSheet(`
      ${resultHead(r)}
      <p class="inject-line">하트볼트 해제</p>
      ${factChips(ch, r.facts)}
      <p class="result-meta">${deltaText('신뢰', r.before.trust, r.after.trust)} · ${deltaText('끌림', r.before.attraction, r.after.attraction)}</p>
      ${fragmentHtml(ch, 5)}
      <p class="reward">세이프워드 ‘${esc(routeOf(ch).safeword)}’를 약속했어요. 둘만의 밤이 열렸습니다.</p>
      ${r.reward ? `<p class="reward">${r.reward}</p>` : ''}
      <div class="actions">
        <button class="btn" data-go="${ch.id}">공략 노트</button>
        <button class="btn primary" data-go="${levelId(ch.id, 6)}">둘만의 밤으로</button>
      </div>`);
  }
  function showEndingResult(r) {
    const { ch, ending } = r;
    showScreen('play');
    const ed = routeOf(ch).endings[ending];
    const note = {
      exposed: '그녀를 알아낸 만큼 믿음을 쌓지 못했습니다. 신뢰 선택으로 그녀의 선을 존중해 보세요.',
      hesitant: '그녀의 마음에 충분히 닿지 못했습니다. 성향 추리 두 단계를 모두 맞히고, 그녀가 원하는 방식으로 반응해 보세요.',
    }[ending];
    openSheet(`
      <p class="ending-badge ending-${ending}">${S.endingTypes[ending].name}${r.isNew ? ' · 새 엔딩' : ''}</p>
      <h2 class="ending-title">${esc(ed.title)}</h2>
      ${resultHead(r)}
      ${factChips(ch, r.facts)}
      ${ending === 'love' ? fragmentHtml(ch, 6) : `${fragmentHtml(ch, 5)}<p class="muted center">${note}</p>`}
      <p class="result-meta">${esc(displayName(ch))} 엔딩 ${endingCount(ch)}/3</p>
      ${r.reward ? `<p class="reward">${r.reward}</p>` : ''}
      <div class="actions">
        <button class="btn" data-go="${ch.id}">공략 노트</button>
        ${ending === 'love' ? `<button class="btn primary" data-act="album" data-ch="${ch.id}" data-key="love">${ICON.image} 일러스트 보기</button>` : `<button class="btn primary" data-go="${levelId(ch.id, 1)}">처음 만남부터 다시</button>`}
      </div>`);
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

  // 역할 능력을 레벨에 적용합니다. 모두 퍼즐을 쉽게 만드는 방향이라 풀 수 있음이 유지됩니다.
  function applyAbilities(level, abilities) {
    const lv = JSON.parse(JSON.stringify(level));
    if (abilities.includes('tame')) lv.screws.forEach((s) => { if (s.brat) { delete s.brat; s.tamed = true; } });
    if (abilities.includes('lead')) lv.screws.forEach((s) => { if (s.ice && !s.guard) { delete s.ice; s.eased = true; } });
    if (abilities.includes('knot')) lv.planks.forEach((p) => { if (p.tie) { p.untied = p.tie; delete p.tie; } });
    if (abilities.includes('care')) {
      lv.screws.forEach((s) => { if (s.lock) { delete s.lock; s.eased = true; } });
      lv.planks.forEach((p) => { if (p.key) { delete p.key; p.cared = true; } });
    }
    return lv;
  }
  // 이 레벨에서 실제로 효과가 있는 능력
  function usefulAbilities(level, abilities) {
    const has = {
      tame: level.screws.some((s) => s.brat),
      audience: level.planks.some((p) => p.glass),
      lead: level.screws.some((s) => s.ice && !s.guard),
      knot: level.planks.some((p) => p.tie),
      care: level.screws.some((s) => s.lock),
      freebit: level.screws.some((s) => s.head),
    };
    return abilities.filter((a) => has[a]);
  }

  // variant: 'safe' | 'deep' | null. 선택지·추리 결과에 맞는 퍼즐 변형을 씁니다.
  function startPlay(ch, n, variant) {
    const id = levelId(ch.id, n);
    const base = LV[id];
    const v = variant && base.variants ? base.variants[variant] : null;
    const raw = v ? Object.assign({}, base, { tray: v.tray, par: v.par, screws: v.screws || base.screws }) : base;
    const abilities = usefulAbilities(raw, abilitiesOf(ch));
    const level = applyAbilities(raw, abilities);
    const model = R.buildModel(level, { glassPass: abilities.includes('audience'), freeBit: abilities.includes('freebit') });
    P = { ch, n, id, level, variant, abilities, effect: v ? v.effect : null, model };
    resetPuzzle();
    $('#play-title').textContent = n === 5 ? `${displayName(ch)} · 하트볼트` : n === 6 ? `${displayName(ch)} · 둘만의 밤` : `${displayName(ch)} · 만남 ${n}`;
    $('#play-sub').textContent = n === 5 ? '그녀의 가장 깊은 볼트' : n === 6 ? '그녀가 스스로 열어 둔 마지막 볼트' : ch.stages[n - 1].title;
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
    P.injectT = 0;
    P.injecting = false;
    P.won = false;
    P.busy = false;
    P.moving = null;
    P.shake = null;
    P.hint = null;
    P.whisper = null;
    P.whispered = {};
    P.newFacts = [];
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
    if (P.id === 'zena-1' && !save.unlockAll && !save.seen.tutorial) {
      P.tutorialStep = 1;
      coach('반짝이는 나사를 눌러 들어 올리세요.');
      return;
    }
    // 역할 능력이 이 퍼즐에 작동하면 먼저 알려 줍니다
    if (P.abilities.length) {
      const ab = C.abilities[P.abilities[0]];
      coach(`역할 능력 · ${ab.name} — ${ab.desc}`, 4500);
      return;
    }
    // 기믹은 처음 나올 때 한 번만 짧게 소개합니다 (성향 이름은 추리 전까지 숨김)
    const intro = P.n === 2 ? P.ch.gimmicks[0] : P.n === 3 ? P.ch.gimmicks[1] : null;
    if (intro && !save.seen[intro]) {
      save.seen[intro] = true; persist();
      coach(`${C.gimmicks[intro].name} — ${C.gimmicks[intro].desc}`, 7000);
      return;
    }
    if (P.effect === 'guard' && P.variant === 'deep' && !save.seen.guard) {
      save.seen.guard = true; persist();
      coach('경계 나사 — 그녀가 경계하고 있어요. 다른 나사를 3번 옮기면 풀립니다.', 5000);
      return;
    }
    if (P.variant) {
      const fx = P.variant === 'safe' ? '보관 구멍 +1' : P.effect === 'guard' ? '경계 나사 +2' : '보관 구멍 -1';
      coach(P.n === 5 ? (P.variant === 'safe' ? `성향을 알아봤어요 · ${fx}` : `성향을 잘못 짚었어요 · ${fx}`) : fx, 2500);
    }
  }
  function tutorialEvent(ev) {
    if (!P.tutorialStep) return;
    if (P.tutorialStep === 1 && ev === 'select') { P.tutorialStep = 2; coach('위쪽 보관 구멍이나 비어 있는 구멍을 눌러 옮기세요.'); }
    else if (P.tutorialStep === 2 && ev === 'move') { P.tutorialStep = 3; coach('판을 붙잡은 나사를 모두 빼면 판이 떨어져요.'); }
    else if (P.tutorialStep >= 2 && ev === 'fall') { P.tutorialStep = 0; save.seen.tutorial = true; persist(); coach('판이 사라진 자리에 숨겨진 모습이 선명하게 드러나요.', 3500); }
  }

  /* ---------- HUD·도구 ---------- */
  function updateHud() {
    if (!P) return;
    $('#hud-moves').innerHTML = `이동 <b>${P.st.moves}</b>`;
    $('#hud-goal').innerHTML = `★★★ 목표 <b>${starGoal(P.level.par)}</b>번 이내`;
    const t = save.tools;
    const hm = $('#tool-hammer'), ho = $('#tool-hole'), hi = $('#tool-hint'), bt = $('#tool-bit');
    hm.innerHTML = `${ICON.hammer}<span>망치</span><span class="count">${t.hammer}</span>`;
    ho.innerHTML = `${ICON.hole}<span>구멍 추가</span><span class="count">${t.hole}</span>`;
    hi.innerHTML = `${ICON.hint}<span>힌트</span><span class="count">${t.hint}</span>`;
    hm.disabled = !t.hammer || P.won;
    ho.disabled = !t.hole || P.st.tray >= R.MAX_TRAY || P.won;
    hi.disabled = !t.hint || P.won;
    hm.classList.toggle('active', P.mode === 'hammer');
    hm.setAttribute('aria-pressed', P.mode === 'hammer');
    bt.hidden = !P.model.hasSwitch;
    if (P.model.hasSwitch) {
      const lead = P.st.bit === 'lead';
      bt.innerHTML = `<span class="bit-dot ${lead ? 'lead' : 'follow'}"></span><span>${lead ? '이끄는 ▲' : '따르는 ▼'}</span><span class="bit-sub">${P.model.freeBit ? '비트 바꾸기 · 무료' : '비트 바꾸기'}</span>`;
      bt.setAttribute('aria-label', `드라이버 비트: ${lead ? '이끄는 쪽' : '따르는 쪽'}. 누르면 바꿉니다(이동 1회).`);
      bt.disabled = P.won || P.busy;
      bt.classList.toggle('hint-glow', !!(P.hint && P.hint.kind === 'bit'));
    }
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
    else if (save.tools.hammer) { P.mode = 'hammer'; P.sel = -1; coach('부술 판을 누르세요. 리본으로 묶인 판은 함께 떨어집니다. 다시 누르면 취소됩니다.'); }
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
    coach(P.hint.kind === 'bit' ? '아래 비트 버튼을 눌러 비트를 바꿔 보세요.' : P.hint.kind === 'provoke' ? '빛나는 반항 나사를 건드려 보세요.' : '빛나는 나사를 표시된 구멍으로 옮겨 보세요.', 3500);
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
    if (P.abilities && P.abilities.includes('audience')) {
      P.model.planks.forEach((p, z) => {
        if (!p.glass || !P.st.alive[z]) return;
        m.globalAlpha = 1;
        plankPath(m, p, 0, 0);
        m.fill();
      });
    }
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
  function holePos(h) { return R.holeXY(P.model, P.st, h); }
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

  const TIE_COLORS = ['#ff8fb1', '#c9a0ff', '#ffd27a'];
  function heartPath(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.8);
    c.bezierCurveTo(x - s * 1.3, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.45);
    c.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.3, y - s * 0.1, x, y + s * 0.8);
    c.closePath();
  }
  function drawBow(c, x, y, col) {
    c.save();
    c.translate(x, y);
    c.fillStyle = col; c.strokeStyle = 'rgba(70,20,40,0.65)'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-13, -11, -17, 7, 0, 0); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(13, -11, 17, 7, 0, 0); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-1, 1); c.lineTo(-6, 11); c.lineTo(-2, 10); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(1, 1); c.lineTo(6, 11); c.lineTo(2, 10); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(0, 0, 2.8, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
  }

  function drawPlank(c, z, oy, opts) {
    const p = P.model.planks[z];
    const col = p.heart ? '#9e2b4f' : P.ch.planks[p.color % P.ch.planks.length];
    const g = plankGeom(p);
    c.save();
    if (p.glass) {
      // 유리 판: 반투명이라 아래의 나사와 그림이 비쳐 보입니다
      plankPath(c, p, oy);
      c.fillStyle = 'rgba(205,232,255,0.2)'; c.fill();
      c.save();
      plankPath(c, p, oy); c.clip();
      const gl = c.createLinearGradient(g.cx - 70, g.cy + oy - 70, g.cx + 70, g.cy + oy + 70);
      gl.addColorStop(0, 'rgba(255,255,255,0.38)'); gl.addColorStop(0.38, 'rgba(255,255,255,0.04)');
      gl.addColorStop(0.52, 'rgba(255,255,255,0.24)'); gl.addColorStop(1, 'rgba(255,255,255,0.02)');
      c.fillStyle = gl; c.fillRect(0, 0, LW, LH);
      c.restore();
      plankPath(c, p, oy);
      const allowed = P.abilities && P.abilities.includes('audience');
      if (allowed) c.setLineDash([5, 4]);
      c.lineWidth = 2; c.strokeStyle = allowed ? 'rgba(255,170,200,0.95)' : 'rgba(225,242,255,0.9)'; c.stroke();
      c.setLineDash([]);
    } else {
      c.shadowColor = 'rgba(0,0,0,0.45)';
      c.shadowBlur = 8 * k;
      c.shadowOffsetY = 3 * k;
      plankPath(c, p, oy);
      c.fillStyle = col; c.fill();
      c.shadowColor = 'transparent';
      c.save();
      plankPath(c, p, oy); c.clip();
      if (!p.heart) plankPattern(c, p, col, oy);
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
      c.lineWidth = p.heart ? 2.4 : 1.6;
      c.strokeStyle = p.heart ? '#f2c86a' : shade(col, -0.45);
      c.stroke();
      if (p.heart) {
        // 하트볼트 판: 가운데 하트 문양
        heartPath(c, g.cx, g.cy + oy, 20);
        c.fillStyle = 'rgba(255,170,195,0.85)'; c.fill();
        c.lineWidth = 2; c.strokeStyle = '#f2c86a'; c.stroke();
      }
    }
    if (opts && opts.flash) {
      plankPath(c, p, oy);
      c.fillStyle = `rgba(255,255,255,${opts.flash})`; c.fill();
    }
    p.holeIdx.forEach((h) => {
      const hole = P.model.holes[h];
      const [x, y] = R.gridXY([hole.i, hole.j]);
      drawHole(c, x, y + oy);
    });
    if (p.key) drawKey(c, g.cx, g.cy + oy);
    if (p.tie) drawBow(c, g.cx, g.cy + oy, TIE_COLORS[(p.tie - 1) % TIE_COLORS.length]);
    c.restore();
  }

  function drawScrew(c, sid, x, y, lift, t) {
    const s = P.st.screws[sid];
    const r = G.screwR * (lift ? 1.18 : 1);
    const status = R.screwStatus(P.model, P.st, sid);
    const locked = s.lock && R.keyAlive(P.model, P.st);
    const iced = s.ice && P.st.moves < s.ice;
    c.save();
    if (status === 'bit' && !lift) c.globalAlpha *= 0.45;
    if (P.shake && P.shake.sid === sid) {
      const a = 1 - (t - P.shake.t0) / 350;
      if (a > 0) x += Math.sin((t - P.shake.t0) / 22) * 4 * a;
    }
    // 반항 나사는 가만히 있지 못하고 들썩입니다
    if (s.brat && !REDUCED) y += Math.sin(t / 140 + sid) * 1.2;
    // 그림자
    c.beginPath(); c.arc(x + 1.5, y + (lift ? 7 : 2.5), r, 0, Math.PI * 2);
    c.fillStyle = 'rgba(0,0,0,0.38)'; c.fill();
    const yy = y - (lift ? 7 : 0);
    const gr = c.createRadialGradient(x - r * 0.35, yy - r * 0.4, r * 0.1, x, yy, r);
    let stops = ['#ffffff', '#c9d2da', '#6c7884'];
    if (locked) stops = ['#fff3cf', '#e2b55a', '#8a6122'];
    else if (s.brat) stops = ['#fff0d6', '#ffab4a', '#b5541a'];
    else if (s.head === 'lead') stops = ['#fff6d8', '#e8b84f', '#8c6420'];
    else if (s.head === 'follow') stops = ['#f2f8ff', '#a9c3df', '#4d6a8a'];
    gr.addColorStop(0, stops[0]); gr.addColorStop(0.5, stops[1]); gr.addColorStop(1, stops[2]);
    c.beginPath(); c.arc(x, yy, r, 0, Math.PI * 2);
    c.fillStyle = gr; c.fill();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(20,20,30,0.5)'; c.stroke();
    if (locked) {
      c.strokeStyle = '#4a3010'; c.lineWidth = 1.8;
      c.beginPath(); c.arc(x, yy - 1.5, 3.4, Math.PI, 0); c.stroke();
      c.fillStyle = '#4a3010';
      c.beginPath(); rr(c, x - 4.8, yy - 1.5, 9.6, 7, 1.5); c.fill();
    } else if (s.head) {
      // 스위치 나사: 이끄는 쪽 ▲ / 따르는 쪽 ▼
      const up = s.head === 'lead';
      c.fillStyle = up ? '#5a3c08' : '#22374f';
      c.beginPath();
      if (up) { c.moveTo(x, yy - r * 0.55); c.lineTo(x + r * 0.5, yy + r * 0.35); c.lineTo(x - r * 0.5, yy + r * 0.35); }
      else { c.moveTo(x, yy + r * 0.55); c.lineTo(x + r * 0.5, yy - r * 0.35); c.lineTo(x - r * 0.5, yy - r * 0.35); }
      c.closePath(); c.fill();
    } else {
      c.save();
      c.translate(x, yy);
      c.rotate(P.rot[sid] + (lift ? t / 300 : 0));
      c.strokeStyle = s.brat ? 'rgba(90,40,10,0.85)' : 'rgba(40,46,56,0.85)';
      c.lineWidth = r * 0.26; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-r * 0.5, 0); c.lineTo(r * 0.5, 0); c.moveTo(0, -r * 0.5); c.lineTo(0, r * 0.5); c.stroke();
      c.restore();
      if (s.brat) {
        // 도발하는 듯한 작은 불꽃 표시
        c.strokeStyle = 'rgba(255,200,120,0.95)'; c.lineWidth = 1.6; c.lineCap = 'round';
        [[-0.9, -1.25], [0, -1.45], [0.9, -1.25]].forEach(([dx, dy]) => {
          c.beginPath(); c.moveTo(x + dx * r * 0.85, yy + dy * r * 0.85); c.lineTo(x + dx * r * 1.05, yy + dy * r * 1.08); c.stroke();
        });
      }
    }
    const def = P.level.screws[sid];
    if (def && def.tamed && !lift) {
      heartPath(c, x + r * 0.85, yy - r * 0.85, 4.2);
      c.fillStyle = '#ff8fb1'; c.fill();
      c.lineWidth = 1; c.strokeStyle = 'rgba(90,20,40,0.7)'; c.stroke();
    }
    if (iced) {
      const s2 = r * 1.4;
      if (s.guard) {
        // 경계 나사: 붉은 가시 고리
        c.beginPath(); c.arc(x, yy, s2, 0, Math.PI * 2);
        c.fillStyle = 'rgba(200,40,70,0.32)'; c.fill();
        c.lineWidth = 2; c.strokeStyle = 'rgba(255,110,130,0.95)'; c.stroke();
        for (let a = 0; a < 8; a++) {
          const ang = a * Math.PI / 4 + 0.2;
          c.beginPath(); c.moveTo(x + Math.cos(ang) * s2, yy + Math.sin(ang) * s2);
          c.lineTo(x + Math.cos(ang) * (s2 + 4), yy + Math.sin(ang) * (s2 + 4)); c.stroke();
        }
      } else {
        // 긴장 나사: 서늘한 막
        c.beginPath(); rr(c, x - s2, yy - s2, s2 * 2, s2 * 2, 6);
        c.fillStyle = 'rgba(190,200,255,0.55)'; c.fill();
        c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x - s2 + 4, yy - s2 + 9); c.lineTo(x - s2 + 9, yy - s2 + 4); c.stroke();
      }
      const left = s.ice - P.st.moves;
      c.beginPath(); c.arc(x + s2 - 2, yy + s2 - 2, 7.5, 0, Math.PI * 2);
      c.fillStyle = s.guard ? '#8a1f38' : '#3b3f7a'; c.fill();
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
      // 리본: 묶인 판끼리 이어 줍니다
      Object.entries(P.model.ties).forEach(([tie, zs]) => {
        const alive = zs.filter((z) => P.st.alive[z]);
        if (alive.length < 2) return;
        const col = TIE_COLORS[(tie - 1) % TIE_COLORS.length];
        c.save();
        c.globalAlpha = fade * 0.8;
        c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round';
        for (let i = 0; i + 1 < alive.length; i++) {
          const a = plankGeom(P.model.planks[alive[i]]), b = plankGeom(P.model.planks[alive[i + 1]]);
          c.beginPath();
          c.moveTo(a.cx, a.cy + BY);
          c.quadraticCurveTo((a.cx + b.cx) / 2, (a.cy + b.cy) / 2 + BY + 26, b.cx, b.cy + BY);
          c.stroke();
        }
        c.restore();
      });
      c.globalAlpha = 1;
    }
    c.restore();
    c.beginPath(); rr(c, 0.5, BY + 0.5, G.boardW - 1, G.boardH - 1, 18);
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke();

    const pulse = REDUCED ? 0.5 : (Math.sin(t / 180) + 1) / 2;
    // 반항 나사가 달아날 곳 미리 보기
    if (!P.won && !P.busy) {
      P.st.screws.forEach((s, sid) => {
        if (!s.brat || sid === movingSid || R.screwStatus(P.model, P.st, sid) !== 'brat') return;
        const to = R.bratTarget(P.model, P.st, sid);
        if (to < 0) return;
        const [x1, y1] = screwPosNow(sid), [x2, y2] = holePos(to);
        c.save();
        c.setLineDash([3, 4]);
        c.strokeStyle = `rgba(255,171,74,${0.45 + pulse * 0.35})`; c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 24, x2, y2); c.stroke();
        c.setLineDash([]);
        c.beginPath(); c.arc(x2, y2, G.holeR + 2, 0, Math.PI * 2); c.stroke();
        c.restore();
      });
    }
    // 옮길 수 있는 구멍 표시
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
    else if (P.hint && !P.busy && P.hint.kind !== 'bit') {
      const col = `rgba(255,128,153,${0.6 + pulse * 0.4})`;
      if (P.sel !== P.hint.sid) { const [x, y] = screwPosNow(P.hint.sid); glowAt(x, y, col); }
      if (P.hint.kind === 'move') { const [hx, hy] = holePos(P.hint.h); glowAt(hx, hy, col); }
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
      const hop = m.bounce ? 46 : 26;
      const y = m.from[1] + (m.to[1] - m.from[1]) * e - Math.sin(Math.PI * u) * hop - 7 * (1 - u);
      drawScrew(c, m.sid, x, y, u < 0.85, t);
    }
    drawWhisper(c, t);
    if (P.injectT > 0) drawUnlock(c);
  }

  /* ---------- 하트 드라이버 연출: 그녀가 허락한 볼트가 풀려 나옵니다 ---------- */
  function drawHeartScrew(c, x, y, r, rot, a) {
    if (a <= 0) return;
    c.save();
    c.globalAlpha = Math.min(1, a);
    c.shadowColor = 'rgba(255,128,153,0.9)';
    c.shadowBlur = 18 * k;
    const gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, '#fff0f4'); gr.addColorStop(0.5, '#ff8fa8'); gr.addColorStop(1, '#a3304f');
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = gr; c.fill();
    c.shadowBlur = 0;
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(80,10,30,0.6)'; c.stroke();
    c.translate(x, y); c.rotate(rot);
    heartPath(c, 0, 0, r * 0.42);
    c.fillStyle = '#5a0f26'; c.fill();
    c.restore();
  }
  function drawUnlock(c) {
    const u = P.injectT;
    const cx = G.boardW / 2, cy = BY + G.boardH * 0.45;
    const ease = (v) => 1 - Math.pow(1 - v, 3);
    c.save();
    c.beginPath(); rr(c, 0, BY, G.boardW, G.boardH, 18); c.clip();
    c.fillStyle = `rgba(30,6,24,${0.38 * Math.min(1, u * 4)})`;
    c.fillRect(0, BY, G.boardW, G.boardH);
    // 박혀 있던 하트볼트가 반시계 방향으로 돌며 풀려 올라옵니다
    let y, rot, sc;
    if (u < 0.55) { const e = ease(u / 0.55); y = cy + 10 - e * 36; rot = -e * Math.PI * 5; sc = 1.1 + e * 0.6; }
    else { y = cy - 26; rot = -Math.PI * 5; sc = 1.7; }
    for (let w = 0; w < 2; w++) {
      const p = (u - 0.5 - w * 0.1) / 0.32;
      if (p <= 0 || p >= 1) continue;
      c.beginPath(); c.arc(cx, y, 18 + p * 150, 0, Math.PI * 2);
      c.strokeStyle = `rgba(255,128,153,${0.75 * (1 - p)})`;
      c.lineWidth = 5 * (1 - p) + 1; c.stroke();
    }
    drawHeartScrew(c, cx, y, 16 * sc, rot, 1);
    const ta = u < 0.5 ? 0 : Math.min(1, (u - 0.5) / 0.2);
    if (ta > 0) {
      c.globalAlpha = ta;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineJoin = 'round';
      c.font = '400 26px "Bagel Fat One", "IBM Plex Sans KR", system-ui, sans-serif';
      c.lineWidth = 6; c.strokeStyle = 'rgba(30,6,24,0.9)'; c.fillStyle = '#ffd3dd';
      c.strokeText(S.ability.name, cx, cy + 62); c.fillText(S.ability.name, cx, cy + 62);
      c.font = '600 14px "IBM Plex Sans KR", system-ui, sans-serif';
      c.lineWidth = 4; c.fillStyle = '#ffffff';
      c.strokeText(P.injectLabel, cx, cy + 90); c.fillText(P.injectLabel, cx, cy + 90);
    }
    c.restore();
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
      if (P.clearT >= 1) { P.clearing = false; P.injecting = true; P.injectT = 0; sfx('inject'); }
    }
    if (P.injecting) {
      P.injectT = Math.min(1, P.injectT + dt / (REDUCED ? 1.2 : 2.2));
      if (P.injectT >= 1) {
        P.injecting = false;
        const tk = P.token;
        setTimeout(() => { if (P && P.token === tk) finishMeeting(); }, 400);
      }
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
    let best = null, bd = 24 * 24, hidden = null, hd = 24 * 24;
    P.st.screws.forEach((s, sid) => {
      const status = R.screwStatus(P.model, P.st, sid);
      const [sx, sy] = holePos(s.h);
      const d = (sx - x) ** 2 + (sy - y) ** 2;
      if (status === 'blocked') { if (d < hd) { hd = d; hidden = sid; } return; }
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
    if (!best) {
      // 무대 유리 아래에 비쳐 보이는 나사를 누르면 그녀가 속삭입니다
      if (hidden != null && underGlass(hidden)) {
        const [sx, sy] = screwPosNow(hidden);
        whisper('glass', sx, sy);
      }
      if (P.sel >= 0) { P.sel = -1; }
      return;
    }
    if (best.type === 'hole') { doAction({ kind: 'move', sid: P.sel, h: best.h }, now); return; }
    if (best.status === 'free') {
      P.sel = P.sel === best.sid ? -1 : best.sid;
      if (P.sel >= 0) { sfx('pick'); tutorialEvent('select'); }
      return;
    }
    if (best.status === 'brat') {
      const h = R.bratTarget(P.model, P.st, best.sid);
      if (h >= 0) { P.sel = -1; doAction({ kind: 'provoke', sid: best.sid, h }, now); return; }
      coach('반항 나사가 달아날 빈 구멍이 없어요. 구멍을 먼저 비워 주세요.', 2400);
    }
    P.shake = { sid: best.sid, t0: now };
    sfx('deny');
    const sc = P.st.screws[best.sid];
    const [wx, wy] = screwPosNow(best.sid);
    if (best.status === 'ice') {
      const left = sc.ice - P.st.moves;
      if (sc.guard) coach(`그녀가 경계하고 있어요. 다른 나사를 ${left}번 더 옮기면 풀려요.`, 2200);
      else { whisper('tension', wx, wy); coach(`다른 나사를 ${left}번 더 옮겨 먼저 이끌어 주세요.`, 2200); }
    } else if (best.status === 'lock') {
      whisper('rule', wx, wy);
      coach('조건이 그려진 판을 먼저 떨어뜨리세요.', 2200);
    } else if (best.status === 'bit') {
      whisper('switch', wx, wy, sc.head);
      coach(`${sc.head === 'lead' ? '이끄는 쪽(▲)' : '따르는 쪽(▼)'} 비트로 바꿔야 돌릴 수 있어요.`, 2200);
    }
  }

  /* ---------- 속삭임: 기믹이 작동할 때 그녀가 성향을 드러내는 짧은 말 ---------- */
  function whisper(gimmick, x, y, key) {
    if (!P.ch.gimmicks.includes(gimmick)) return;
    const w = C.gimmicks[gimmick].whispers;
    const list = Array.isArray(w) ? w : w[key] || [];
    if (!list.length) return;
    const n = (P.whispered[gimmick] = (P.whispered[gimmick] || 0) + 1);
    P.whisper = { text: list[(n - 1) % list.length], x, y, t0: performance.now() };
  }
  function underGlass(sid) {
    const hole = P.model.holes[P.st.screws[sid].h];
    return !hole.tray && hole.cover.some((c) => P.st.alive[c.p] && !c.hole && P.model.planks[c.p].glass);
  }
  // 리본으로 묶인 판 중 나사는 다 빠졌는데 짝 때문에 남아 있는 판이 있으면 한 번 속삭입니다
  function ribbonWhisper() {
    if (!P || P.won) return;
    for (const [tie, zs] of Object.entries(P.model.ties)) {
      if (P.whispered['tie' + tie]) continue;
      const z = zs.find((q) => P.st.alive[q] && !P.model.planks[q].holeIdx.some((h) => P.st.occ[h] >= 0));
      if (z === undefined) continue;
      P.whispered['tie' + tie] = true;
      const g = plankGeom(P.model.planks[z]);
      whisper('ribbon', g.cx, g.cy + BY);
      return;
    }
  }
  function drawWhisper(c, t) {
    const w = P.whisper;
    if (!w) return;
    const age = (t - w.t0) / 1000;
    if (age > 2.2) { P.whisper = null; return; }
    const a = Math.min(1, age / 0.15, (2.2 - age) / 0.35);
    c.save();
    c.globalAlpha = Math.max(0, a);
    c.font = '700 12.5px "Gowun Batang", "IBM Plex Sans KR", serif';
    const tw = c.measureText(w.text).width;
    const bw = tw + 22, bh = 28;
    const bx = Math.max(6, Math.min(LW - bw - 6, w.x - bw / 2));
    const by = Math.max(4, w.y - 46 - age * 6);
    c.beginPath(); rr(c, bx, by, bw, bh, 12);
    c.fillStyle = 'rgba(42,16,34,0.94)'; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = P.ch.accent; c.stroke();
    c.beginPath();
    const tx = Math.max(bx + 14, Math.min(bx + bw - 14, w.x));
    c.moveTo(tx - 6, by + bh); c.lineTo(tx, by + bh + 7); c.lineTo(tx + 6, by + bh); c.closePath();
    c.fillStyle = 'rgba(42,16,34,0.94)'; c.fill();
    c.fillStyle = '#ffe3ea'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(w.text, bx + bw / 2, by + bh / 2 + 1);
    c.restore();
  }

  function spawnParticles(z) {
    const p = P.model.planks[z];
    const g = plankGeom(p);
    const col = p.glass ? '#dff1ff' : P.ch.planks[p.color % P.ch.planks.length];
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
      if (list.some((z) => P.model.planks[z].tie)) coach('리본으로 묶인 판이 함께 떨어졌어요.', 2000);
    }
    // 판이 절반 떨어지면 이 만남의 첫 번째 정보가 열립니다
    const dead = P.st.alive.filter((a) => !a).length;
    const fa = 2 * (P.n - 1);
    if (list.length && dead * 2 >= P.st.alive.length && learnFact(P.ch, fa)) {
      P.newFacts.push(fa);
      const f = P.ch.facts[fa];
      setTimeout(() => { if (P && !P.tutorialStep && !P.won) coach(`알아낸 것 · ${f[0]}: ${f[1]}`, 2800); }, 350);
    }
    if (P.keyWasAlive && !R.keyAlive(P.model, P.st)) {
      P.keyWasAlive = false;
      setTimeout(() => { sfx('unlock'); coach('조건을 지켰어요. 조건 나사가 모두 풀렸습니다.', 2400); }, 200);
    }
  }

  // 모든 행동(옮기기, 반항 나사 건드리기, 비트 바꾸기)을 한곳에서 처리합니다.
  function doAction(a, now) {
    if (a.kind === 'bit') {
      const res = R.toggleBit(P.model, P.st);
      P.st = res.state;
      P.hint = null;
      P.sel = -1;
      sfx('pick');
      coach(P.st.bit === 'lead' ? '비트를 바꿨어요 · 이끄는 쪽(▲)' : '비트를 바꿨어요 · 따르는 쪽(▼)', 1600);
      updateHud();
      afterChange();
      return;
    }
    const from = screwPosNow(a.sid);
    const res = a.kind === 'provoke' ? R.provoke(P.model, P.st, a.sid) : R.move(P.model, P.st, a.sid, a.h);
    if (!res) return;
    P.st = res.state;
    const to = holePos(a.kind === 'provoke' ? res.to : a.h);
    P.sel = -1;
    P.busy = true;
    P.hint = null;
    P.moving = { sid: a.sid, from, to, t0: now, dur: REDUCED ? 120 : a.kind === 'provoke' ? 420 : 260, bounce: a.kind === 'provoke' };
    const token = P.token;
    if (a.kind === 'provoke') {
      sfx('deny');
      whisper('brat', to[0], to[1]);
      coach(save.seen.bratTease ? '반항! 다른 구멍으로 달아났어요.' : '반항! 빠지지 않고 다른 구멍으로 달아났어요. 이제부터는 순순히 빠집니다.', 2200);
      save.seen.bratTease = true; persist();
    } else {
      tutorialEvent('move');
    }
    setTimeout(() => {
      if (!P || P.token !== token) return;
      P.moving = null;
      P.busy = false;
      sfx('place');
      startFalls(res.fallen);
      ribbonWhisper();
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
      P.injectLabel = P.n === 5 ? '하트볼트가 풀렸다' : P.n === 6 ? '그녀가 열어 둔 마지막 볼트' : `볼트 ${P.n}/6 해제`;
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
    if (!P || P.won || !$('#sheet').hidden || $('#screen-play').hidden) return;
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

  // 별 기준: 3별은 최소 이동 수의 1.5배 + 1 이내, 2별은 2배 + 2 이내
  function starGoal(par) { return Math.ceil(par * 1.5) + 1; }
  function calcStars() {
    const par = P.level.par;
    let s = P.st.moves <= starGoal(par) ? 3 : P.st.moves <= par * 2 + 2 ? 2 : 1;
    if (P.usedTools) s = Math.min(s, 2);
    return s;
  }

  /* ---------------- 전역 클릭 처리 ---------------- */
  document.addEventListener('click', (e) => {
    const choice = e.target.closest('[data-choice]');
    if (choice) {
      if (SC.choiceResolve) SC.choiceResolve(choice.getAttribute('data-choice'));
      return;
    }
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      const v = pick.getAttribute('data-pick');
      deducePick = deducePick === v ? null : v;
      if (openDeduction.render) openDeduction.render();
      return;
    }
    const el = e.target.closest('[data-go],[data-act],[data-locked]');
    if (!el) {
      if (!$('#screen-scene').hidden && !e.target.closest('button') && $('#sheet').hidden) advanceScene();
      return;
    }
    if (el.disabled) return;
    if (el.hasAttribute('data-locked')) { toast(unlockText(charById(el.getAttribute('data-locked')))); return; }
    if (el.hasAttribute('data-go')) { go(el.getAttribute('data-go')); return; }
    const act = el.getAttribute('data-act');
    if (act === 'settings') openSettings();
    else if (act === 'close-sheet') closeSheet();
    else if (act === 'toggle-sound') { save.sound = !save.sound; persist(); el.setAttribute('aria-checked', save.sound); }
    else if (act === 'toggle-unlock') { save.unlockAll = !save.unlockAll; persist(); el.setAttribute('aria-checked', save.unlockAll); if (!$('#screen-home').hidden) showHome(); }
    else if (act === 'prologue') { closeSheet(); save.seen.prologue = false; persist(); go(''); }
    else if (act === 'reset') {
      if (!resetArmed) { resetArmed = true; el.textContent = '한 번 더 누르면 초기화'; return; }
      save = defaultSave(); persist(); closeSheet(); toast('진행 상황을 초기화했어요.'); go('');
    }
    else if (act === 'deduce') { openDeduction(charById(el.getAttribute('data-ch')), +(el.getAttribute('data-step') || 0)); }
    else if (act === 'deduce-confirm') { confirmDeduction(charById(el.getAttribute('data-ch')), +(el.getAttribute('data-step') || 0)); }
    else if (act === 'album' || act === 'viewer') { closeSheet(); openViewer(charById(el.getAttribute('data-ch')), el.getAttribute('data-key') || 'love'); }
    else if (act === 'close-viewer') {
      $('#viewer').hidden = true;
      if ($('#screen-chapter').hidden && current) go(current.ch.id);
    }
    else if (act === 'replay') { closeSheet(); if (current) startMeeting(current.ch, current.n); }
    else if (act === 'restart') { if (P) { resetPuzzle(); introCoach(); } }
    else if (act === 'stuck-hammer') { closeSheet(); if (P.mode !== 'hammer') toggleHammer(); }
    else if (act === 'stuck-hole') { useHole(); afterChange(); }
  });
  $('#btn-back').innerHTML = ICON.back;
  $('#btn-restart').innerHTML = ICON.restart;
  $('#scene-back').innerHTML = ICON.back;
  $('#btn-back').addEventListener('click', () => { if (P) go(P.ch.id); });
  $('#btn-restart').addEventListener('click', () => { if (P && !P.busy && !P.won) { resetPuzzle(); introCoach(); } });
  $('#scene-back').addEventListener('click', () => {
    if (current) { go(current.ch.id); return; }
    save.seen.prologue = true; persist(); stopScene(); go('');
  });
  $('#scene-skip').addEventListener('click', skipScene);
  $('#tool-hammer').addEventListener('click', toggleHammer);
  $('#tool-hole').addEventListener('click', () => { useHole(); if (P && !P.won) afterChange(); });
  $('#tool-hint').addEventListener('click', useHint);
  $('#tool-bit').addEventListener('click', () => { if (P && !P.busy && !P.won && P.model.hasSwitch) doAction({ kind: 'bit' }, performance.now()); });
  $('#viewer').addEventListener('click', (e) => { if (e.target.tagName === 'IMG') e.currentTarget.querySelector('[data-act]').click(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!$('#viewer').hidden) $('#viewer [data-act]').click(); else closeSheet(); return; }
    if ((e.key === ' ' || e.key === 'Enter') && !$('#screen-scene').hidden && !e.target.closest('button')) { e.preventDefault(); advanceScene(); }
  });

  if (window.ResizeObserver) new ResizeObserver(() => { if (!$('#screen-play').hidden) resize(); }).observe($('#stage-wrap'));
  window.addEventListener('resize', () => { if (!$('#screen-play').hidden) resize(); });
  window.addEventListener('hashchange', route);

  // 검토·자동 테스트용 (브라우저 콘솔에서 __nasa.autoSolve() 실행)
  window.__nasa = {
    get state() { return P; },
    get save() { return save; },
    get scene() { return { open: !$('#screen-scene').hidden, choice: !!SC.choiceResolve, line: SC.lines[SC.i] }; },
    skip: skipScene,
    autoSolve(ms) {
      if (!P) return 'no puzzle';
      const a = R.minMoves(P.model, P.st, 300000);
      const r = a ? { status: 'solved', path: a.path } : bestPath(P.st);
      if (r.status !== 'solved') return r.status;
      let i = 0;
      const tick = () => {
        if (!P || i >= r.path.length) return;
        if (P.busy) { setTimeout(tick, 40); return; }
        doAction(r.path[i++], performance.now());
        setTimeout(tick, ms || 320);
      };
      tick();
      return r.path.length + ' moves';
    },
  };

  loadImages().then(route);
})();

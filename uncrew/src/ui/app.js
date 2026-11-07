/*
 * 언스크류(UNCREW) — UI 컨트롤러
 *
 * 상태 표시와 입력 전달만 담당합니다. 게임 규칙은 core/game.js에 있습니다.
 * 화면: TITLE · 대화(PROLOGUE/RETURN/HAERIN_OPEN/OFFICE_ENTER/DOCUMENT_ACTION/BOSS) · 튜토리얼 · 허브 · 퍼즐 · 보상 · 결과
 * 오버레이: 노트(EVIDENCE) · 난이도 선택 · 메뉴 · 설정 · 확인창 · 테스트 패널
 */
import { PROJECT, ITEMS, DIFFICULTIES, DEPTH_LABEL, DEPTH_INFO, suspicionBand } from '../data/config.js';
import { NODES, CLUES, EVIDENCE, TOPICS, TOPIC_ORDER, CHARACTERS, SPEAKER_LABEL, BAND_LINES, REMOVAL_LINES, TUTORIAL, HUB, ENDINGS, RESULT_COMMON, CASE_INFO, SITUATION, LIFE_GOALS } from '../data/case01.js';
import { GUIDE } from '../data/guide.js';
import { clueUsage, requirementTree } from '../core/clueInfo.js';
import { buildTranscript } from '../core/transcript.js';
import { getBoard, TUTORIAL_BOARD } from '../data/puzzles.js';
import { pickHole, plateAt, hasScrew, canSelect, validDestinations, hasAnyValidMove, isBlocked, TEMP_HOLE_ID, REASONS } from '../core/puzzleEngine.js';
import { nextHint, solve } from '../core/solver.js';
import { ICON, silhouette, sealOverlay, titleEmblem } from './art.js';
import { boardMarkup, toLogical, slotMarkup } from './board.js';
import * as SFX from './audio.js';
import { formatText, validatePlayerName, DEFAULT_PLAYER, NAME_RULE_TEXT, josa } from '../core/names.js';

const REDUCED = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const SPEED = { normal: 26, fast: 10, instant: 0 };

const MOVE_REASON_TEXT = {
  [REASONS.SAME_HOLE]: '같은 구멍입니다. 다른 빈 구멍을 고르세요.',
  [REASONS.OCCUPIED]: '이미 나사가 있는 구멍입니다.',
  [REASONS.NO_SCREW]: '나사가 없는 구멍입니다.',
  [REASONS.SRC_BLOCKED]: '판에 가려진 나사는 집을 수 없습니다.',
  [REASONS.DST_BLOCKED]: '판에 가려진 구멍에는 넣을 수 없습니다.',
  [REASONS.UNKNOWN_HOLE]: '구멍이 없는 곳입니다.',
  [REASONS.NOT_PLAYING]: '지금은 나사를 옮길 수 없습니다.',
  [REASONS.NO_HISTORY]: '되돌릴 이동이 없습니다.',
  [REASONS.TEMP_HOLE_USED]: '임시 나사함은 보드마다 한 번만 쓸 수 있습니다.',
  NO_ITEM: '아이템이 없습니다.',
  NO_TARGET: '지금 가진 기억 단서와 모순되는 선택지가 없습니다. 돋보기는 소모되지 않았습니다.',
  LOCKED: '조건을 갖추지 못한 선택지입니다.',
};

const NODE_LABEL = {
  PROLOGUE: '프롤로그',
  RETURN: '회귀',
  NAME_ENTRY: '회귀 · 이름',
  AWAKEN: '회귀 · 능력',
  HAERIN_OPEN: '비서실 · 서해린',
  TUTORIAL: '연습 해체',
  OFFICE_ENTER: '회장실',
  MEMORY_HUB: '멈춘 시간',
  PUZZLE: '기억 해체 중',
  REWARD: '해체 완료',
  DOCUMENT_ACTION: '전달 목록',
  BOSS_01: '회장 대면 1/3',
  BOSS_02: '회장 대면 2/3',
  BOSS_03: '회장 대면 3/3',
  RESULT: '결과',
};

/** HUD·노트·재도전 메뉴를 아직 보여 주지 않는 도입 장면 */
const INTRO_NODES = ['PROLOGUE', 'RETURN', 'NAME_ENTRY', 'AWAKEN'];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const unquote = (t) => t.replace(/^[“"]|[”"]$/g, '');
const fmtDelta = (d) => (d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '±0');

export function createApp({ root, side, debugEl, shell, game }) {
  /** 대본의 이름 자리 표시를 현재 주인공 이름으로 바꿉니다. */
  const T = (text) => formatText(text, game.run?.player);
  const ui = {
    view: 'title',
    overlay: null,
    seqKey: null,
    lineIdx: 0,
    typing: false,
    typed: 0,
    timer: null,
    revealedAt: 0,
    shownLineKey: null,
    locked: false,
    selected: null,
    msg: null,
    anim: null,
    animTimer: null,
    clearView: null,
    picking: false,
    toast: null,
    toastTimer: null,
    busy: false,
    nameDraft: null,
    guardUntil: 0,
    lastSaveWarned: false,
    autoplay: false,
  };

  SFX.setMuted(game.meta.settings.muted);

  game.onChange((_state, res) => {
    if (res && !res.ok) {
      if (!ui.lastSaveWarned) {
        ui.lastSaveWarned = true;
        showToast('로컬 저장에 실패했습니다. 지금 상태로 계속 플레이할 수 있지만, 창을 닫으면 진행이 사라질 수 있습니다.');
      }
    } else ui.lastSaveWarned = false;
  });
  game.log.listeners.add(() => renderDebug());

  /* =============================== 공통 =============================== */

  function showToast(text, kind = '') {
    ui.toast = { text, kind };
    clearTimeout(ui.toastTimer);
    ui.toastTimer = setTimeout(() => {
      ui.toast = null;
      render();
    }, 4200);
    render();
  }

  function bandMeter(run) {
    const band = suspicionBand(run.suspicion);
    return `<div class="meter band-${band.id}" aria-label="조직 의심도 ${run.suspicion}, ${band.label}">
      <div class="meter-top">${ICON[band.icon]}<span>의심도 <b>${run.suspicion}</b> · ${band.label}</span></div>
      <div class="meter-bar"><i style="width:${run.suspicion}%"></i></div>
    </div>`;
  }

  function hud(run, { menu = true } = {}) {
    return `<header class="hud">
      <div class="hud-row">
        ${menu ? `<button class="icon-btn" data-act="menu" aria-label="메뉴">${ICON.menu}</button>` : ''}
        <span class="day" aria-label="죽음까지 ${run.daysRemaining}일">D-${run.daysRemaining}</span>
        <span class="hud-place">${esc(NODE_LABEL[run.nodeId] || '')}</span>
        <span class="chip trust-chip" aria-label="서해린 신뢰도 ${run.trust.HAERIN}">${ICON.heart}서해린 신뢰 ${run.trust.HAERIN}</span>
        <button class="icon-btn notes-btn" data-act="notes" aria-label="노트">${ICON.notes}</button>
      </div>
      ${bandMeter(run)}
    </header>`;
  }

  function pips(n, total, cls = '') {
    return `<span class="pips" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="pip ${cls} ${i < n ? 'on' : ''}"></span>`).join('')}</span>`;
  }

  function itemList(items) {
    const ents = Object.entries(items).filter(([, n]) => n > 0);
    if (!ents.length) return '<span class="muted">없음</span>';
    return ents.map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(', ');
  }

  /* =============================== 단서 설명 · 조건표 =============================== */

  const SCENE_NAME = {
    HAERIN_OPEN: '비서실 대화',
    DOCUMENT_ACTION: '전달 목록 요청',
    BOSS_01: '회장 대면 1',
    BOSS_02: '회장 대면 2',
    BOSS_03: '회장 대면 3',
  };

  function clueLabel(cid) {
    const c = CLUES[cid];
    if (!c.topic) return '사건 정리 단서';
    return `${CHARACTERS[c.who].name} · ${TOPICS[c.topic].title} · ${DEPTH_LABEL[c.depth]}`;
  }

  function reqLabel(leaf) {
    if (leaf.clue) return `기억 단서 「${clueLabel(leaf.clue)}」`;
    if (leaf.evidence) return `확보 증거 「${EVIDENCE[leaf.evidence].name}」`;
    if (leaf.trustAtLeast) return `${Object.keys(leaf.trustAtLeast).map((w) => CHARACTERS[w].name).join('·')}의 충분한 신뢰`;
    if (leaf.flag) return '앞선 선택';
    return '조건';
  }

  /** 조건을 ✓/✗ 목록으로 그립니다. 색만이 아니라 기호로도 충족 여부를 보여 줍니다. */
  function reqHtml(tree, top = true) {
    if (!tree) return '';
    if (tree.leaf) return `<span class="req ${tree.ok ? 'ok' : 'no'}">${tree.ok ? '✓' : '✗'} ${esc(reqLabel(tree.leaf))}</span>`;
    const sep = tree.op === 'all' ? '+' : '또는';
    const inner = tree.items.map((t) => reqHtml(t, false)).join(` <span class="req-op">${sep}</span> `);
    return top ? inner : `<span class="req-group">( ${inner} )</span>`;
  }

  function choiceRef(nodeId, choiceId) {
    return NODES[nodeId].choices.find((c) => c.id === choiceId);
  }

  /** 단서·증거가 실제로 작동하는 곳 */
  function workLines(id, { evidence = false } = {}) {
    const u = clueUsage(id, { evidence });
    const out = [];
    for (const x of u.unlocks) {
      const tree = requirementTree(choiceRef(x.nodeId, x.choiceId).requires, game.run);
      out.push(`<li><b>선택지를 엶</b> · ${SCENE_NAME[x.nodeId] || NODE_LABEL[x.nodeId]}에서 새 대답이 열립니다. 필요한 조건: ${reqHtml(tree)}</li>`);
    }
    for (const x of u.contradicts) out.push(`<li><b>모순 확인</b> · ${SCENE_NAME[x.nodeId] || NODE_LABEL[x.nodeId]}에 이 단서와 어긋나는 대답이 있습니다. 기억 돋보기로 표시할 수 있습니다.</li>`);
    for (const x of u.related) out.push(`<li><b>관련 표시</b> · ${SCENE_NAME[x.nodeId] || NODE_LABEL[x.nodeId]}에서 관련된 선택지 옆에 ‘관련 단서 보유’가 표시됩니다.</li>`);
    if (!out.length) out.push(`<li>직접 열리는 선택지는 없습니다. 대화에서 무엇이 위험한지 판단하는 근거로 씁니다.</li>`);
    return `<ul class="work">${out.join('')}</ul>`;
  }

  /** 기억 단서 카드. status: 'owned' | 'past', detail: 판단 힌트·작동까지 보일지 */
  function clueCard(cid, { status = 'owned', detail = true, extraChips = '' } = {}) {
    const c = CLUES[cid];
    const depth = c.depth ? DEPTH_INFO[c.depth] : null;
    const chips = [
      depth ? `<span class="chip teal" title="${esc(depth.desc)}">${depth.label}</span>` : `<span class="chip gold">사건 정리</span>`,
      `<span class="chip">${c.topic ? `${CHARACTERS[c.who].name} · ${esc(TOPICS[c.topic].title)}` : '공통 후속 단서'}</span>`,
      status === 'past' ? '<span class="chip dim">지난 시도에서 열람 · 이번 시도 미확보</span>' : '',
      extraChips,
    ].join('');
    return `<div class="note-item clue ${status === 'past' ? 'past' : ''}">
      <div class="meta">${chips}</div>
      <div class="clue-text">${esc(T(c.text))}</div>
      ${depth ? `<div class="clue-depth">${depth.label}: ${esc(depth.desc)}</div>` : ''}
      ${detail ? `<div class="clue-use"><b>판단 힌트</b>${esc(T(c.use))}</div>` : ''}
      ${detail ? `<div class="clue-work"><b>작동</b>${status === 'past' ? '<p class="faint">이번 시도에서 다시 확보해야 조건으로 쓰입니다.</p>' : ''}${workLines(cid)}</div>` : ''}
    </div>`;
  }

  /* =============================== 렌더 진입점 =============================== */

  function render() {
    const run = game.run;
    let html = '';
    if (ui.view === 'title' || !run) html = titleScreen();
    else if (ui.clearView) html = puzzleScreen(ui.clearView);
    else if (run.pendingReaction) html = dialogueScreen();
    else {
      const node = NODES[run.nodeId];
      if (node.type === 'scene' || node.type === 'dialogue') html = dialogueScreen();
      else if (node.type === 'name') html = nameScreen();
      else if (node.type === 'tutorial') html = run.activePuzzle ? puzzleScreen() : tutorialIntro();
      else if (node.type === 'hub') html = hubScreen();
      else if (node.type === 'puzzle') html = puzzleScreen();
      else if (node.type === 'reward') html = rewardScreen();
      else if (node.type === 'result') html = resultScreen();
    }
    html += overlayMarkup();
    if (ui.toast) html += `<div class="toast ${ui.toast.kind}" role="status">${esc(ui.toast.text)}</div>`;
    root.innerHTML = html;
    afterRender();
    renderSide();
    renderDebug();
  }

  function afterRender() {
    // 대화 타이핑 이어 가기
    const textEl = root.querySelector('[data-typer]');
    if (textEl) startTyping(textEl);
    const svg = root.querySelector('svg[data-board]');
    if (svg) svg.addEventListener('click', onBoardClick);
    const logBody = root.querySelector('[data-log-body]');
    if (logBody && ui.overlay?.type === 'log' && !ui.overlay.scrolled) {
      logBody.scrollTop = logBody.scrollHeight;
      ui.overlay.scrolled = true;
    }
    const focusEl = root.querySelector('[data-autofocus]');
    if (focusEl && ui.overlay) focusEl.focus({ preventScroll: true });
    const run = game.run;
    const inDialogue = ui.view === 'game' && run && (run.pendingReaction || ['scene', 'dialogue'].includes(NODES[run.nodeId]?.type));
    SFX.setAmbient(!!inDialogue && !game.meta.settings.muted && ['office', 'secretary'].includes(currentStage()?.loc));
  }

  /* =============================== 타이틀 =============================== */

  function titleScreen() {
    const issue = game.loadIssue;
    const canContinue = game.hasContinue();
    const run = game.run;
    return `<section class="screen title-screen" aria-label="타이틀">
      <div class="title-art">${titleEmblem()}</div>
      <div class="title-block">
        <h1 class="title-ko">${PROJECT.title}</h1>
        <div class="title-en">${PROJECT.titleEn}</div>
        <p class="title-copy">${PROJECT.copy}</p>
      </div>
      <div class="title-menu">
        ${issue?.kind === 'corrupt' ? `<div class="notice" role="alert">저장 데이터가 손상되어 별도로 보관했습니다. 잘못된 수치로 이어 가지 않도록 새 게임을 시작해 주세요.</div>` : ''}
        ${!game.saver.available ? `<div class="notice info">이 브라우저에서는 로컬 저장을 쓸 수 없습니다. 창을 닫으면 진행이 사라집니다.</div>` : ''}
        <button class="btn primary block" data-act="new-game">새 게임</button>
        <button class="btn block" data-act="continue" ${canContinue ? '' : 'disabled'}>
          이어하기${canContinue ? ` <span class="muted" style="font-weight:500">· ${NODE_LABEL[run.nodeId]}</span>` : ''}
        </button>
        <button class="btn ghost block" data-act="settings">설정</button>
      </div>
      <p class="title-foot">P0 프로토타입 · 첫 사건 「${CASE_INFO.title}」</p>
    </section>`;
  }

  /* =============================== 대화 =============================== */

  function currentSequence() {
    const run = game.run;
    const pr = run.pendingReaction;
    if (pr) {
      const node = NODES[pr.nodeId];
      const choice = node.choices.find((c) => c.id === pr.choiceId);
      const outcome = choice.outcomes ? choice.outcomes.find((o) => o.id === pr.outcomeId) : { reaction: choice.reaction };
      let lines = [{ who: 'DOYUN', text: unquote(choice.text) }];
      if (pr.removed) lines = lines.concat(REMOVAL_LINES);
      else {
        lines = lines.concat(outcome.reaction || []);
        if (pr.bandEntered && BAND_LINES[pr.bandEntered]) lines = lines.concat(BAND_LINES[pr.bandEntered]);
      }
      return { key: `R:${run.runId}:${pr.nodeId}:${pr.choiceId}`, lines, base: node.stage, mode: 'reaction', node, pr };
    }
    const node = NODES[run.nodeId];
    return { key: `N:${run.runId}:${node.id}`, lines: node.lines, base: node.stage, mode: 'node', node };
  }

  function stageAt(seq, idx) {
    const st = { loc: 'black', cast: [], seal: [], door: undefined, ...seq.base };
    for (let i = 0; i <= idx && i < seq.lines.length; i++) Object.assign(st, seq.lines[i].stage || {});
    if (st.door === undefined) st.door = st.loc === 'office' && game.run.suspicion >= 70;
    return st;
  }

  function currentStage() {
    const run = game.run;
    if (!run) return null;
    if (!run.pendingReaction && !['scene', 'dialogue'].includes(NODES[run.nodeId]?.type)) return null;
    const seq = currentSequence();
    return stageAt(seq, Math.min(ui.lineIdx, seq.lines.length - 1));
  }

  function stageMarkup(st, line) {
    const cast = st.cast || [];
    const solo = cast.length === 1;
    const figures = cast
      .map((who) => {
        const sealed = (st.seal || []).includes(who);
        return `<div class="figure ${solo ? 'solo' : ''} ${who.toLowerCase()}">
          ${silhouette(who, { label: CHARACTERS[who]?.name || '' })}
          ${sealed ? sealOverlay() : ''}
          <span class="name-tag">${esc(CHARACTERS[who]?.name || '')}</span>
        </div>`;
      })
      .join('');
    let over = '';
    if (line?.card && line.list) {
      over = `<div class="card-overlay goal"><div class="goal-card"><span class="eyebrow">${esc(line.card)}</span><ol>${line.list.map((g) => `<li>${esc(T(g))}</li>`).join('')}</ol></div></div>`;
    } else if (line?.card) over = `<div class="card-overlay"><div><div class="big">${esc(line.card)}</div><div class="sub">${esc(T(line.sub || ''))}</div></div></div>`;
    if (line?.fx === 'blackout') over = `<div class="blackout-overlay">······</div>`;
    return `<div class="stage loc-${st.loc} ${st.dizzy ? 'dizzy' : ''}">
      <div class="bg"></div>
      ${st.door ? `<div class="door" aria-label="문 밖의 보안실장 실루엣">${silhouette('MUJIN', { label: '권무진' })}</div>` : ''}
      <div class="cast">${figures}</div>
      ${over}
    </div>`;
  }

  function speakerLabel(who) {
    // 주인공은 이름을 떠올리기 전까지 '나', 그 뒤에는 입력한 이름으로 표시합니다.
    if (who === 'DOYUN') return game.run?.player ? game.run.player.given : SPEAKER_LABEL.DOYUN;
    return SPEAKER_LABEL[who] || who;
  }

  function lineParts(line) {
    if (line.card) return { who: '', cls: 'narr', text: T(line.sub || line.card) };
    if (line.fx === 'blackout') return { who: '', cls: 'narr', text: T(line.narr || '……') };
    if (line.who) {
      const label = speakerLabel(line.who);
      if (line.inner) return { who: `${label} · 속마음`, whoCls: 'inner', cls: 'inner', text: T(line.text) };
      const mono = !!line.mono;
      return { who: mono ? `${label} · 속마음` : label, whoCls: mono ? 'mono' : '', cls: mono ? 'mono' : 'quote', text: mono ? T(line.text) : `“${T(line.text)}”` };
    }
    return { who: '', cls: 'narr', text: T(line.narr) };
  }

  function deltaStrip(pr) {
    const chips = [];
    const ds = pr.delta.suspicion;
    const bandA = suspicionBand(pr.after.suspicion);
    chips.push(`<span class="chip ${ds > 0 ? 'danger' : ds < 0 ? 'teal' : ''}">${ds > 0 ? ICON.up : ds < 0 ? ICON.down : ICON.same}의심도 ${pr.before.suspicion} → ${pr.after.suspicion} (${fmtDelta(ds)}) · ${bandA.label}</span>`);
    const dt = pr.delta.trust.HAERIN;
    if (dt) chips.push(`<span class="chip ${dt > 0 ? 'gold' : 'warn'}">${ICON.heart}서해린 신뢰 ${pr.before.trust.HAERIN} → ${pr.after.trust.HAERIN} (${fmtDelta(dt)})</span>`);
    for (const e of pr.grantedEvidence) chips.push(`<span class="chip gold">${ICON.doc}확보 증거: ${esc(EVIDENCE[e].name)}</span>`);
    return `<div class="delta-strip" role="status">${chips.join('')}</div>`;
  }

  function dialogueScreen() {
    const run = game.run;
    const seq = currentSequence();
    if (ui.seqKey !== seq.key) {
      ui.seqKey = seq.key;
      ui.lineIdx = 0;
      ui.typed = 0;
      ui.typing = false;
      ui.picking = false;
      ui.shownLineKey = null;
    }
    const idx = Math.min(ui.lineIdx, seq.lines.length - 1);
    const line = seq.lines[idx];
    const st = stageAt(seq, idx);
    const parts = lineParts(line);
    const isLast = idx === seq.lines.length - 1;
    const lineKey = `${seq.key}#${idx}`;
    const fresh = ui.shownLineKey !== lineKey;
    const full = !fresh && !ui.typing;
    const showHud = !INTRO_NODES.includes(run.nodeId) || !!run.pendingReaction;
    const choicesReady = seq.mode === 'node' && seq.node.type === 'dialogue' && isLast && full && !game.canChoose();

    let bottom;
    if (choicesReady) bottom = choicesPanel(seq.node);
    else {
      bottom = `<div class="controls">
        <button class="btn small ghost" data-act="log" aria-label="대사 기록">${ICON.log}기록</button>
        ${!isLast ? `<button class="btn small ghost" data-act="skip">건너뛰기</button>` : ''}
        <span class="spacer"></span>
        <button class="btn primary next" data-act="next" ${full ? '' : 'disabled'} aria-label="다음 대사">다음 ${ICON.chevron}</button>
      </div>`;
    }

    return `<section class="screen dialogue-screen" aria-label="${esc(NODE_LABEL[run.nodeId])}">
      ${showHud ? hud(run) : `<header class="hud" style="border:0;background:transparent"><button class="icon-btn" data-act="menu" aria-label="메뉴">${ICON.menu}</button><span class="spacer" style="flex:1"></span></header>`}
      <div style="position:relative;flex:1;display:flex;flex-direction:column;min-height:0">
        ${stageMarkup(st, line)}
        ${seq.mode === 'reaction' ? deltaStrip(seq.pr) : ''}
      </div>
      <div class="textbox" data-act="reveal" role="button" tabindex="0" aria-label="대사 전체 보기">
        <div class="who ${parts.whoCls || ''}">${esc(parts.who)}</div>
        <div class="text ${parts.cls}" data-typer="${esc(lineKey)}" data-full="${esc(parts.text)}" aria-live="polite">${full ? esc(parts.text) : ''}</div>
        ${!full ? '<span class="tap-hint">눌러서 전체 보기</span>' : ''}
      </div>
      ${bottom}
    </section>`;
  }

  function startTyping(el) {
    const key = el.dataset.typer;
    const full = el.dataset.full;
    if (ui.shownLineKey === key) return; // 이미 전체 표시된 줄
    clearInterval(ui.timer);
    const seq = currentSequence();
    const line = seq.lines[Math.min(ui.lineIdx, seq.lines.length - 1)];
    if (line?.sfx) SFX.play(line.sfx);
    const speed = REDUCED || ui.autoplay ? 0 : SPEED[game.meta.settings.textSpeed] ?? SPEED.normal;
    ui.shownLineKey = key;
    if (!speed) {
      finishTyping(el, full);
      return;
    }
    ui.typing = true;
    ui.typed = 0;
    const chars = [...full];
    ui.timer = setInterval(() => {
      ui.typed += 1;
      el.textContent = chars.slice(0, ui.typed).join('');
      if (ui.typed >= chars.length) finishTyping(el, full);
    }, speed);
  }

  function finishTyping(el, full) {
    clearInterval(ui.timer);
    ui.typing = false;
    ui.revealedAt = performance.now();
    el.textContent = full;
    // 전체 표시 후 다음 버튼과 선택지를 갱신합니다.
    render();
  }

  function reveal() {
    const el = root.querySelector('[data-typer]');
    if (el && ui.typing) finishTyping(el, el.dataset.full);
  }

  function nextLine() {
    if (ui.typing) return; // 표시와 넘기기를 분리합니다.
    if (performance.now() - ui.revealedAt < 180) return; // 연타 오클릭 방지
    const seq = currentSequence();
    const idx = Math.min(ui.lineIdx, seq.lines.length - 1);
    if (idx < seq.lines.length - 1) {
      ui.lineIdx = idx + 1;
      render();
      return;
    }
    if (seq.mode === 'reaction') {
      game.ackReaction();
    } else if (seq.node.type === 'scene') {
      game.advance();
    }
    render();
  }

  function skipLines() {
    const seq = currentSequence();
    ui.lineIdx = seq.lines.length - 1;
    ui.shownLineKey = `${seq.key}#${ui.lineIdx}`; // 마지막 줄을 즉시 전체 표시
    ui.typing = false;
    ui.revealedAt = performance.now();
    clearInterval(ui.timer);
    const last = seq.lines[ui.lineIdx];
    if (last?.sfx) SFX.play(last.sfx);
    render();
  }

  function choicesPanel(node) {
    const run = game.run;
    const views = game.choiceView();
    const inv = run.inventory;
    const items = [];
    if (inv.magnifier > 0) items.push(`<button class="btn small" data-act="magnifier">${ICON.glass}기억 돋보기 ×${inv.magnifier}</button>`);
    const rehearsable = views.some((v) => v.enabled);
    if (inv.rehearsal > 0 || Object.keys(run.marks.rehearsal).length)
      items.push(`<button class="btn small ${ui.picking ? 'primary' : ''}" data-act="rehearsal" ${rehearsable ? '' : 'disabled'}>${ICON.mask}대화 리허설 ×${inv.rehearsal}</button>`);
    const dirText = { up: ['상승', ICON.up, 'danger'], same: ['유지', ICON.same, ''], down: ['하락', ICON.down, 'teal'] };
    const buttons = views
      .map((v) => {
        const c = v.choice;
        const badges = [];
        if (!v.enabled) badges.push(`<span class="chip">${ICON.lock}${esc(c.lockHint)}</span>`);
        if (v.related) badges.push(`<span class="chip teal">${ICON.notes}관련 단서 보유 · ${esc(clueLabel(c.relatedClue))}</span>`);
        if (v.magnified) badges.push(`<span class="chip danger">${ICON.glass}모순: ${esc(T(CLUES[v.magnified.clueId].text))}</span>`);
        if (v.rehearsal) {
          const [t, ic, cls] = dirText[v.rehearsal];
          badges.push(`<span class="chip ${cls}">${ic}리허설: 의심도 ${t}</span>`);
        }
        const req = c.requires ? requirementTree(c.requires, run) : null;
        const reqLine = req ? `<span class="req-line">${v.enabled ? '<b>단서로 열린 대답</b> · 근거:' : '<b>필요</b>:'} ${reqHtml(req)}</span>` : '';
        return `<button class="choice ${ui.picking && v.enabled ? 'picking' : ''} ${v.magnified ? 'contradict' : ''} ${req && v.enabled ? 'unlocked' : ''}" data-act="choose" data-id="${c.id}" ${v.enabled ? '' : 'disabled'}>
          <span>${esc(c.text)}</span>
          ${badges.length ? `<span class="badges">${badges.join('')}</span>` : ''}
          ${reqLine}
        </button>`;
      })
      .join('');
    return `<div class="choices" role="group" aria-label="선택지">
      <div class="item-bar">
        <button class="btn small ghost" data-act="log">${ICON.log}이전 대사 보기</button>
        <button class="btn small ghost" data-act="guide">${ICON.help}용어 안내</button>
        ${items.length ? `<span class="label">아이템</span>${items.join('')}` : ''}
      </div>
      ${ui.picking ? `<div class="pick-banner"><span>미리 볼 선택지를 고르세요. 의심도의 방향만 표시합니다.</span><button class="btn small ghost" data-act="cancel-pick">취소</button></div>` : ''}
      ${buttons}
    </div>`;
  }

  function onChoose(id) {
    if (ui.locked) return;
    if (ui.picking) {
      const r = game.useRehearsal(id);
      ui.picking = false;
      if (!r.ok) showToast(MOVE_REASON_TEXT[r.reason] || '리허설을 쓸 수 없습니다.');
      else if (r.reused) showToast('이미 리허설한 선택지입니다. 추가로 소모하지 않았습니다.', 'info');
      render();
      return;
    }
    ui.locked = true;
    const res = game.choose(id);
    ui.locked = false;
    if (!res.ok) {
      showToast(MOVE_REASON_TEXT[res.reason] || '지금은 고를 수 없습니다.');
      return;
    }
    SFX.play('choose');
    if (res.reaction.tone === 'up_big') SFX.duckAmbient();
    if (res.reaction.removed) SFX.play('danger');
    render();
  }

  /* =============================== 이름 입력 =============================== */

  function nameDraft() {
    if (!ui.nameDraft) {
      const last = game.meta.lastPlayer;
      ui.nameDraft = last ? { surname: last.surname, given: last.given } : { surname: '', given: '' };
    }
    return ui.nameDraft;
  }

  function nameStatus(d) {
    const v = validatePlayerName(d);
    if (!d.surname.trim() && !d.given.trim()) return { ok: false, html: `<span class="muted">성과 이름을 차례로 떠올려 보세요.</span>` };
    if (!v.ok) return { ok: false, html: `<span class="err">${esc(v.errors[0])}</span>` };
    const g = v.player.given;
    return { ok: true, html: `<span class="ok">회장은 ‘${esc(g + josa(g, '아'))}’, 직원들은 ‘${esc(v.player.surname)} 실장님’이라고 부릅니다.</span>` };
  }

  function nameScreen() {
    const d = nameDraft();
    const st = nameStatus(d);
    const def = DEFAULT_PLAYER.surname + DEFAULT_PLAYER.given;
    return `<section class="screen name-screen" aria-label="이름 떠올리기">
      <div class="name-stage">
        ${stageMarkup(NODES.NAME_ENTRY.stage, null)}
        <div class="nameplate ${st.ok ? 'clear' : ''}" aria-hidden="true"><small>회장실 실장</small><b data-plate>${st.ok ? esc(d.surname.trim() + d.given.trim()) : '· · ·'}</b></div>
      </div>
      <form class="name-form" autocomplete="off" onsubmit="return false">
        <span class="eyebrow">기억해 내기</span>
        <h2>내 이름은…</h2>
        <p class="muted">번진 명패를 붙잡고, 가장 먼저 자기 이름을 떠올립니다.</p>
        <div class="name-fields">
          <label><span>성</span><input name="surname" value="${esc(d.surname)}" placeholder="${DEFAULT_PLAYER.surname}" maxlength="3" lang="ko" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="name-rule"></label>
          <label><span>이름</span><input name="given" value="${esc(d.given)}" placeholder="${DEFAULT_PLAYER.given}" maxlength="3" lang="ko" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="name-rule"></label>
        </div>
        <p class="legend" id="name-rule">${esc(NAME_RULE_TEXT)}. 회장 일가의 성(차)과 다른 등장인물의 이름은 쓸 수 없습니다.</p>
        <div class="name-status" data-name-status role="status" aria-live="polite">${st.html}</div>
        <div class="name-actions">
          <button type="button" class="btn" data-act="name-default" aria-label="기본 이름 ${esc(def)}으로 기억한다">${esc(def)} 그대로</button>
          <button type="button" class="btn primary" data-act="name-submit" ${st.ok ? '' : 'disabled'}>이 이름으로 기억한다</button>
        </div>
      </form>
    </section>`;
  }

  /** 입력 중에는 화면 전체를 다시 그리지 않아 한글 조합이 끊기지 않게 합니다. */
  function onNameInput(e) {
    const form = e.target.closest('.name-form');
    if (!form) return;
    const d = nameDraft();
    d[e.target.name] = e.target.value;
    const st = nameStatus(d);
    form.querySelector('[data-name-status]').innerHTML = st.html;
    form.querySelector('[data-act="name-submit"]').disabled = !st.ok;
    const plate = root.querySelector('.nameplate');
    plate.classList.toggle('clear', st.ok);
    plate.querySelector('[data-plate]').textContent = st.ok ? d.surname.trim() + d.given.trim() : '· · ·';
  }

  function submitName(input) {
    const form = root.querySelector('.name-form');
    const d = input || {
      surname: form?.querySelector('[name="surname"]').value ?? '',
      given: form?.querySelector('[name="given"]').value ?? '',
    };
    const res = game.setPlayerName(d);
    if (!res.ok) {
      if (form) form.querySelector('[data-name-status]').innerHTML = `<span class="err">${esc(res.errors?.[0] || '이 이름은 쓸 수 없습니다.')}</span>`;
      SFX.play('error');
      return;
    }
    ui.nameDraft = null;
    SFX.play('chime');
    render();
  }

  /* =============================== 튜토리얼 =============================== */

  function tutorialIntro() {
    const run = game.run;
    return `<section class="screen dialogue-screen">
      ${hud(run)}
      <div style="position:relative;flex:1;display:flex;flex-direction:column;min-height:0">
        ${stageMarkup({ loc: 'memory', cast: ['HAERIN'], seal: ['HAERIN'] }, null)}
      </div>
      <div class="textbox" style="cursor:default">
        <div class="who mono">연습 해체</div>
        <div class="text mono">${esc(TUTORIAL.intro)}</div>
      </div>
      <div class="controls" style="flex-direction:column;align-items:stretch">
        <p class="muted" style="margin:0 0 4px;font-size:13px">${esc(TUTORIAL.note)}${game.meta.tutorialSeen ? ' 이미 해 본 적이 있다면 건너뛰어도 됩니다.' : ''}</p>
        <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:8px">
          <button class="btn" data-act="tutorial-skip">건너뛰기</button>
          <button class="btn primary" data-act="tutorial-start">연습 시작</button>
        </div>
      </div>
    </section>`;
  }

  function tutorialStep(board, p) {
    const removed = board.plates.length - p.activePlates.length;
    if (p.status === 'cleared') return 'done';
    if (ui.selected) return 'move';
    if (removed >= 1) return 'reveal';
    if (p.moves > 0) return 'plate';
    return 'select';
  }

  /* =============================== 허브 =============================== */

  function hubScreen() {
    const run = game.run;
    const byWho = { HAERIN: [], TAEGEON: [] };
    for (const t of TOPIC_ORDER) byWho[TOPICS[t].target].push(TOPICS[t]);
    const statusChip = (t) => {
      const a = run.topicAttempts[t.id];
      if (!a) return `<span class="chip teal">미조사</span>`;
      if (a.status === 'completed') return `<span class="chip gold">완료 · ${[1, 2, 3].filter((n) => n <= DIFFICULTIES[a.difficulty].depth).map((n) => DEPTH_LABEL[n]).join('·')}</span>`;
      if (a.status === 'abandoned') return `<span class="chip dim">${ICON.flag}포기</span>`;
      return `<span class="chip warn">진행 중</span>`;
    };
    const card = (who) => {
      const ch = CHARACTERS[who];
      return `<article class="who-card">
        <div class="portrait">${silhouette(who, { label: ch.name })}</div>
        <div>
          <h3>${ch.name}</h3>
          <div class="role">${ch.role} · ${ch.age}세${who === 'HAERIN' ? ` · 신뢰 ${run.trust.HAERIN}` : ''}</div>
          ${byWho[who]
            .map(
              (t) => `<button class="topic-btn" data-act="topic" data-id="${t.id}" ${run.topicAttempts[t.id] ? 'disabled' : ''}>
                <span><span class="t-title">${esc(t.title)}</span><span class="t-sub">${esc(t.teaser)}</span></span>
                ${statusChip(t)}
              </button>`,
            )
            .join('')}
        </div>
      </article>`;
    };
    const allDone = TOPIC_ORDER.every((t) => run.topicAttempts[t]);
    const highlightFinish = run.focus === 0 || allDone;
    return `<section class="screen hub-screen loc-memory" style="background:radial-gradient(70% 40% at 50% 0%, rgb(79 179 173 / .18), transparent 70%), #0b1416">
      ${hud(run)}
      <div class="scroll" style="flex:1">
        <div class="hub-head">
          <span class="eyebrow">D-30 · 회장의 첫 질문 직전</span>
          <h2>${HUB.title}</h2>
          <p>${esc(HUB.desc)}</p>
          <p class="case-goal"><b>이번 사건 목표</b> ${esc(SITUATION.caseGoal.goal)} 기억을 열어 단서를 모은 뒤, 회장의 질문에 그 단서를 근거로 대답합니다.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn small ghost" data-act="guide">${ICON.help}기억 단서·깊이란?</button><button class="btn small ghost" data-act="log">${ICON.log}대사 기록</button></div>
          <div class="focus-row">${ICON.focus}<span>집중력 <b>${run.focus}</b> / 4</span>${pips(run.focus, 4)}</div>
        </div>
        ${card('HAERIN')}
        ${card('TAEGEON')}
        <div class="hub-actions">
          <button class="btn notes-btn" data-act="notes">${ICON.notes}노트 보기</button>
          <button class="btn ${highlightFinish ? 'primary' : ''}" data-act="finish-investigation">조사를 마치고 보고하기 ${ICON.chevron}</button>
          ${run.focus === 0 && !allDone ? '<p class="muted" style="margin:0;font-size:13px;text-align:center">집중력을 모두 썼습니다. 노트 확인과 대화 진행은 계속할 수 있습니다.</p>' : ''}
        </div>
      </div>
    </section>`;
  }

  function difficultySheet(o) {
    const run = game.run;
    const t = TOPICS[o.topicId];
    const opts = Object.values(DIFFICULTIES)
      .map((d) => {
        const lack = run.focus < d.cost;
        return `<button class="diff-opt" role="radio" aria-checked="${o.diff === d.id}" data-act="pick-diff" data-id="${d.id}" ${lack ? 'disabled' : ''}>
          <span class="row"><span class="name"><span class="radio"></span>${d.name}</span><span>${pips(d.cost, 4, 'cost')}</span></span>
          <dl>
            <dt>집중력</dt><dd>${d.cost}</dd>
            <dt>단서</dt><dd>${d.clueText}</dd>
            <dt>지급 아이템</dt><dd>${itemList(d.items)}</dd>
            <dt>이동 한도</dt><dd>${getBoard(d.boardId).moveLimit}회</dd>
          </dl>
          ${lack ? `<span class="why">집중력이 부족합니다 (필요 ${d.cost} / 보유 ${run.focus})</span>` : ''}
        </button>`;
      })
      .join('');
    const sel = DIFFICULTIES[o.diff];
    const can = sel && run.focus >= sel.cost;
    return `<div class="overlay" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="난이도 선택">
        <div class="sheet-head">
          <div><span class="eyebrow">${CHARACTERS[t.target].name}의 기억</span><h2>${esc(t.title)}</h2><p class="muted" style="font-size:13px">${esc(t.teaser)}</p></div>
          <button class="icon-btn" data-act="close" aria-label="닫기">${ICON.close}</button>
        </div>
        <div class="sheet-body" role="radiogroup">
          ${opts}
          <dl class="depth-table compact">${[1, 2, 3].map((n) => `<dt>${DEPTH_INFO[n].label}</dt><dd>${esc(DEPTH_INFO[n].desc)}</dd>`).join('')}</dl>
          <p class="legend">난이도가 높을수록 더 깊은 기억까지 열립니다. 집중력은 조사 시작을 확정할 때만 줄어듭니다. 해체를 마치면 아이템을 확정 지급합니다. 이 주제는 이번 사건에서 한 번만 조사할 수 있습니다.</p>
        </div>
        <div class="sheet-foot">
          <button class="btn" data-act="close">취소</button>
          <button class="btn primary" data-act="start-topic" ${can ? '' : 'disabled'} data-autofocus>조사 시작${sel ? ` · 집중력 −${sel.cost}` : ''}</button>
        </div>
      </div>
    </div>`;
  }

  /* =============================== 퍼즐 =============================== */

  function puzzleContext(view) {
    const run = game.run;
    if (view) return view;
    const p = run.activePuzzle;
    const board = getBoard(p.boardId);
    const tutorial = p.kind === 'tutorial';
    const topic = tutorial ? null : TOPICS[p.topicId];
    const labels = Object.fromEntries(Object.entries(tutorial ? TUTORIAL.plates : topic.plates).map(([k, v]) => [k, v.label]));
    return { board, p, tutorial, topic, labels, symbol: tutorial ? 'mask' : topic.symbol, final: false };
  }

  function puzzleScreen(view) {
    const run = game.run;
    const ctx = puzzleContext(view);
    const { board, p, tutorial, topic } = ctx;
    const playing = p.status === 'playing' && !ctx.final;
    const targets = playing && ui.selected ? validDestinations(board, p, ui.selected) : [];
    let hint = null;
    let step = null;
    if (tutorial && !ctx.final) {
      step = tutorialStep(board, p);
      if (playing) {
        const nh = nextHint(board, p);
        if (nh) {
          if (!ui.selected) hint = { hole: nh[0] };
          else if (ui.selected === nh[0]) hint = { hole: nh[1] };
        }
      }
    }
    const anim = ui.anim || {};
    const svg = boardMarkup(board, p, {
      selected: ui.selected,
      targets: targets.filter((t) => t !== TEMP_HOLE_ID),
      hint,
      labels: ctx.labels,
      symbol: ctx.symbol,
      falling: anim.falling || [],
      revealed: anim.revealed || [],
      moved: anim.moved || null,
    });
    const left = p.moveLimit - p.moves;
    const title = tutorial ? '연습 해체' : `${CHARACTERS[topic.target].name} · ${topic.title}`;
    const sub = tutorial ? '보상 없음 · 집중력 소모 없음' : `${DIFFICULTIES[p.difficulty].name} · ${DEPTH_LABEL[DIFFICULTIES[p.difficulty].depth]}까지`;
    const inv = run.inventory;

    const tray = p.tempHole
      ? `<div class="pz-tray"><span class="lbl">임시 나사함</span>
          <button class="temp-slot ${targets.includes(TEMP_HOLE_ID) ? 'is-target' : ''} ${ui.selected === TEMP_HOLE_ID ? 'selected' : ''}" data-act="temp-slot" aria-label="임시 나사함 구멍${p.screws.includes(TEMP_HOLE_ID) ? ', 나사 있음' : ', 비어 있음'}">
            ${slotMarkup({ hasScrew: p.screws.includes(TEMP_HOLE_ID), selected: ui.selected === TEMP_HOLE_ID })}
          </button></div>`
      : '';

    let msg = ui.msg;
    let guide = '';
    if (tutorial && step) guide = `<div class="tutorial-box" role="status">${ICON.info}<span>${esc(TUTORIAL.steps[step])}</span></div>`;
    if (ctx.final) msg = { text: '해체 완료. 기억이 흘러나온다.', kind: 'mem' };

    let tools;
    if (tutorial) {
      tools = p.status === 'cleared'
        ? `<div class="pz-tools" style="grid-template-columns:1fr"><button class="btn primary" data-act="tutorial-done">회장실로 ${ICON.chevron}</button></div>`
        : `<div class="pz-tools" style="grid-template-columns:1fr 1fr">
            <button class="btn" data-act="pz-retry">${ICON.restart}처음부터</button>
            <button class="btn" data-act="tutorial-skip">${ICON.chevron}건너뛰기</button>
          </div>`;
    } else {
      tools = `<div class="pz-tools">
        <button class="btn" data-act="pz-undo" ${inv.undo > 0 && p.undoStack.length && playing ? '' : 'disabled'} aria-label="되감기 도구, ${inv.undo}개">${ICON.undo}되감기<span class="n">×${inv.undo}</span></button>
        <button class="btn" data-act="pz-temp" ${inv.temp_hole > 0 && !p.tempHole && playing ? '' : 'disabled'} aria-label="임시 나사함, ${inv.temp_hole}개">${ICON.hole}임시 나사함<span class="n">${p.tempHole ? '사용함' : `×${inv.temp_hole}`}</span></button>
        <button class="btn" data-act="pz-retry" ${ctx.final ? 'disabled' : ''}>${ICON.restart}처음부터<span class="n">집중력 그대로</span></button>
        <button class="btn danger" data-act="pz-abandon" ${ctx.final ? 'disabled' : ''}>${ICON.flag}포기<span class="n">환급 없음</span></button>
      </div>`;
    }

    return `<section class="screen puzzle-screen" aria-label="스크류 퍼즐">
      <div class="pz-top">
        <button class="icon-btn" data-act="menu" aria-label="메뉴">${ICON.menu}</button>
        <div class="pz-title"><div class="t">${esc(title)}</div><div class="s">${esc(sub)}</div></div>
        <div class="moves ${left <= 2 && !ctx.final ? 'near' : ''}" aria-label="이동 ${p.moves}회, 한도 ${p.moveLimit}회"><b>${p.moves}</b><small> / ${p.moveLimit}</small><div style="font-size:11px;color:var(--muted)">이동</div></div>
        ${tutorial ? '' : `<button class="icon-btn notes-btn" data-act="notes" aria-label="노트">${ICON.notes}</button>`}
      </div>
      <div class="board-wrap"><svg data-board viewBox="0 0 640 640" role="img" aria-label="나사 퍼즐 보드. 나사를 눌러 집고 빈 구멍을 눌러 옮깁니다.">${svg}</svg></div>
      ${guide}
      <div class="pz-msg ${msg?.kind || ''}" aria-live="polite">${esc(msg?.text || (playing && ui.selected ? '점선 고리가 있는 빈 구멍을 누르세요. 같은 나사를 다시 누르면 취소합니다.' : playing ? '나사를 눌러 집으세요.' : ''))}</div>
      ${tray}
      ${tools}
      ${!ctx.final && !ui.anim ? puzzleStateOverlay(board, p, tutorial) : ''}
    </section>`;
  }

  function puzzleStateOverlay(board, p, tutorial) {
    if (ui.overlay) return '';
    const inv = game.run.inventory;
    const canUndo = !tutorial && inv.undo > 0 && p.undoStack.length > 0;
    const canTemp = !tutorial && inv.temp_hole > 0 && !p.tempHole;
    if (p.status === 'failed') {
      return `<div class="overlay center"><div class="sheet" role="alertdialog" aria-modal="true" aria-label="이동 한도 도달">
        <div class="sheet-head"><h2>이동 한도에 도달했습니다</h2></div>
        <div class="sheet-body"><p>판이 아직 ${p.activePlates.length}장 남아 있습니다. 같은 보드를 처음부터 다시 풀 수 있고, 집중력은 다시 쓰지 않습니다.${tutorial ? '' : ' 이미 쓴 아이템은 돌아오지 않습니다.'}</p></div>
        <div class="menu-list" style="margin-top:12px">
          ${canUndo ? `<button class="btn" data-act="pz-undo">${ICON.undo}되감기 사용 (×${inv.undo})</button>` : ''}
          <button class="btn primary" data-act="pz-retry-now" data-autofocus>${ICON.restart}처음부터 다시</button>
          ${tutorial ? `<button class="btn" data-act="tutorial-skip">튜토리얼 건너뛰기</button>` : `<button class="btn danger" data-act="pz-abandon">${ICON.flag}포기하고 돌아가기</button>`}
        </div>
      </div></div>`;
    }
    if (p.status === 'playing' && !hasAnyValidMove(board, p)) {
      return `<div class="overlay center"><div class="sheet" role="alertdialog" aria-modal="true" aria-label="이동 불가">
        <div class="sheet-head"><h2>옮길 수 있는 나사가 없습니다</h2></div>
        <div class="sheet-body"><p>보이는 빈 구멍이 없어 더 움직일 수 없습니다.</p></div>
        <div class="menu-list" style="margin-top:12px">
          ${canTemp ? `<button class="btn" data-act="pz-temp">${ICON.hole}임시 나사함 사용 (×${inv.temp_hole})</button>` : ''}
          ${canUndo ? `<button class="btn" data-act="pz-undo">${ICON.undo}되감기 사용 (×${inv.undo})</button>` : ''}
          <button class="btn primary" data-act="pz-retry-now" data-autofocus>${ICON.restart}처음부터 다시</button>
          ${tutorial ? `<button class="btn" data-act="tutorial-skip">튜토리얼 건너뛰기</button>` : `<button class="btn danger" data-act="pz-abandon">${ICON.flag}포기하고 돌아가기</button>`}
        </div>
      </div></div>`;
    }
    return '';
  }

  function onBoardClick(e) {
    const svg = e.currentTarget;
    const run = game.run;
    if (!run?.activePuzzle) return;
    const { x, y } = toLogical(svg, e.clientX, e.clientY);
    const board = getBoard(run.activePuzzle.boardId);
    const hole = pickHole(board, run.activePuzzle, x, y, 50);
    tapHole(hole, { x, y, board });
  }

  function setMsg(text, kind = '') {
    ui.msg = text ? { text, kind } : null;
  }

  function tapHole(holeId, { x, y, board } = {}) {
    const run = game.run;
    const p = run?.activePuzzle;
    if (!p || ui.locked || ui.clearView) return;
    board = board || getBoard(p.boardId);
    if (p.status !== 'playing') {
      setMsg(MOVE_REASON_TEXT[REASONS.NOT_PLAYING], 'err');
      render();
      return;
    }
    if (!ui.selected) {
      if (!holeId) {
        if (x !== undefined && plateAt(board, p, x, y)) setMsg('판은 직접 움직일 수 없습니다. 판을 지지하는 나사를 먼저 옮기세요.');
        else setMsg('');
      } else if (hasScrew(p, holeId)) {
        if (canSelect(board, p, holeId)) {
          ui.selected = holeId;
          setMsg('');
          SFX.play('select');
        } else setMsg(MOVE_REASON_TEXT[REASONS.SRC_BLOCKED], 'err');
      } else {
        setMsg('먼저 옮길 나사를 고르세요.', 'err');
        SFX.play('error');
      }
      render();
      return;
    }
    if (!holeId) {
      setMsg(x !== undefined && plateAt(board, p, x, y) ? '판 위에는 뚫린 구멍에만 넣을 수 있습니다.' : '점선 고리가 있는 빈 구멍을 누르세요.', 'err');
      SFX.play('error');
      render();
      return;
    }
    if (holeId === ui.selected) {
      ui.selected = null;
      setMsg('선택을 취소했습니다.');
      render();
      return;
    }
    if (hasScrew(p, holeId)) {
      if (canSelect(board, p, holeId)) {
        ui.selected = holeId;
        setMsg('');
        SFX.play('select');
      }
      render();
      return;
    }
    doMove(ui.selected, holeId);
  }

  function doMove(src, dst) {
    const run = game.run;
    const p = run.activePuzzle;
    const ctx = puzzleContext();
    const res = game.puzzleMove(src, dst);
    if (!res.ok) {
      setMsg(MOVE_REASON_TEXT[res.reason] || '옮길 수 없습니다.', 'err');
      SFX.play('error');
      render();
      return;
    }
    ui.selected = null;
    SFX.play('move');
    const removed = res.removed || [];
    ui.anim = { falling: removed, revealed: res.revealed || [], moved: dst };
    if (removed.length) {
      setTimeout(() => SFX.play('plate'), 90);
      const flavor = ctx.tutorial ? TUTORIAL.plates : ctx.topic.plates;
      const last = removed[removed.length - 1];
      setMsg(`기억 파편 · ${flavor[last]?.fall || ''}`, 'mem');
      if ((res.revealed || []).length) setTimeout(() => SFX.play('memory'), 380);
    } else setMsg('');
    if (res.failed) setTimeout(() => SFX.play('error'), 300);

    if (res.cleared && !ctx.tutorial) {
      // 보상과 노드 이동은 이미 커밋됨. 마지막 판이 떨어지는 장면만 잠시 보여 줍니다.
      ui.clearView = { ...ctx, p: { ...p, ...res.state }, final: true };
      setTimeout(() => SFX.play('clear'), 450);
    } else if (res.cleared) {
      setTimeout(() => SFX.play('clear'), 450);
    }
    lockFor(removed.length || res.cleared ? (REDUCED ? 60 : 760) : 180, () => {
      ui.anim = null;
      if (ui.clearView) {
        setTimeout(() => {
          ui.clearView = null;
          setMsg('');
          render();
        }, REDUCED ? 100 : 520);
      }
    });
    render();
  }

  function lockFor(ms, done) {
    ui.locked = true;
    clearTimeout(ui.animTimer);
    ui.animTimer = setTimeout(() => {
      ui.locked = false;
      done?.();
      render();
    }, ms);
  }

  /* =============================== 보상 =============================== */

  function rewardScreen() {
    const run = game.run;
    const r = run.lastReward;
    const t = TOPICS[r.topicId];
    const d = DIFFICULTIES[r.difficulty];
    const clueCards = r.clues
      .map((cid) => clueCard(cid, { extraChips: r.newClues.includes(cid) ? '' : '<span class="chip dim">이미 확보</span>' }))
      .join('');
    const itemCards = Object.entries(r.items)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `<div class="note-item"><div class="meta"><b>${ITEMS[id].name} ×${n}</b><span class="chip">${ITEMS[id].context === 'puzzle' ? '퍼즐에서 사용' : '대화 선택지에서 사용'}</span></div><div class="muted" style="font-size:13px">${esc(ITEMS[id].desc)}</div></div>`)
      .join('');
    return `<section class="screen reward-screen">
      ${hud(run)}
      <div class="scroll" style="flex:1"><div class="body-col">
        <span class="eyebrow">해체 완료 · ${d.name}</span>
        <h2 class="big-title">${CHARACTERS[t.target].name} · ${esc(t.title)}</h2>
        <p class="fragment">${esc(T(t.fragment))}</p>
        <div class="explain">
          <p><b>기억 단서</b>는 상대가 겪었거나 믿는 내용입니다. 회장 앞에 증거로 내밀 수는 없지만, 어떤 대답이 위험한지 판단하게 해 주고 일부 대답을 열어 줍니다.</p>
          <p>${d.name} 난이도라서 ${DEPTH_INFO[d.depth].label}까지 열었습니다. ${[1, 2, 3].map((n) => `<b>${DEPTH_INFO[n].label}</b> ${esc(DEPTH_INFO[n].desc)}`).join(' · ')}</p>
          <button class="btn small ghost" data-act="guide">${ICON.help}용어 안내 자세히 보기</button>
        </div>
        <div class="section"><h3>얻은 기억 단서 ${r.clues.length}개</h3>${clueCards}</div>
        <div class="section"><h3>지급 아이템</h3>${itemCards || '<div class="note-item muted">없음</div>'}</div>
        <div class="section"><h3>남은 집중력</h3><div class="focus-row">${pips(run.focus, 4)}<b>${run.focus}</b> / 4</div></div>
      </div></div>
      <div class="foot-actions" style="grid-template-columns:1fr"><button class="btn primary" data-act="close-reward">멈춘 시간으로 돌아가기</button></div>
    </section>`;
  }

  /* =============================== 결과 =============================== */

  function resultScreen() {
    const run = game.run;
    const res = run.result;
    const end = ENDINGS[res.endingId];
    const minutes = Math.floor((run.endedAt - run.startedAt) / 60000);
    const seconds = Math.floor(((run.endedAt - run.startedAt) % 60000) / 1000);
    const removed = res.endingId === 'END_REMOVED';
    let causeHtml = '';
    if (removed && res.cause) {
      const node = NODES[res.cause.nodeId];
      const choice = node.choices.find((c) => c.id === res.cause.choiceId);
      causeHtml = `<div class="section"><h3>결정적인 발언</h3>
        <div class="note-item"><div>${esc(choice.text)}</div>
        <div class="meta"><span class="chip">${res.cause.choiceId}</span><span class="chip danger">의심도 ${res.cause.before.suspicion} → ${res.cause.after.suspicion}</span><span class="chip">서해린 신뢰 ${res.cause.after.trust.HAERIN}</span></div></div></div>`;
    }
    let clueHtml = '';
    if (res.caseClue) {
      const c = CLUES[res.caseClue.id];
      clueHtml = `<div class="section"><h3>공통 후속 단서</h3><div class="note-item evidence"><div class="meta"><span class="chip gold">사건 정리</span>${res.caseClue.reconfirmed ? '<span class="chip teal">다시 확인됨</span>' : '<span class="chip gold">새 단서</span>'}</div>${esc(T(res.caseClue.reconfirmed ? c.reconfirmText : c.text))}</div></div>`;
    }
    const msg = end.message ? `<div class="msg-bubble"><small>${CHARACTERS[end.message.from].name} · 문자 메시지</small>${esc(end.message.text)}</div>` : '';
    const leftItems = Object.entries(run.inventory).filter(([, n]) => n > 0);
    return `<section class="screen result-screen tone-${end.tone}">
      <div class="scroll" style="flex:1"><div class="body-col">
        <span class="eyebrow">${CASE_INFO.day} · ${esc(CASE_INFO.title)} · 결과</span>
        <h2 class="big-title">${esc(end.title)}</h2>
        <p class="tagline">${esc(end.tagline)}</p>
        <div class="story-lines">${end.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
        ${msg}
        ${causeHtml}
        ${clueHtml}
        <div class="section"><h3>이번 시도 요약</h3>
          <dl class="stat-grid">
            <dt>조직 의심도</dt><dd>20 → ${run.suspicion} · ${suspicionBand(run.suspicion).label}</dd>
            <dt>서해린 신뢰</dt><dd>50 → ${run.trust.HAERIN}</dd>
            <dt>기억 단서</dt><dd>${run.clues.filter((c) => c !== 'C_CASE_01_END').length}개</dd>
            <dt>확보 증거</dt><dd>${run.evidence.length ? run.evidence.map((e) => EVIDENCE[e].name).join(', ') : '없음'}</dd>
            <dt>남은 집중력</dt><dd>${run.focus}</dd>
            <dt>사건 플레이 시간</dt><dd>${minutes}분 ${seconds}초</dd>
            <dt>본 결과</dt><dd>${game.meta.endingsSeen.length} / 4</dd>
          </dl>
        </div>
        ${removed ? '' : `<p class="tagline" style="font-size:15px">${esc(RESULT_COMMON.daysLine)}</p>`}
        ${end.preview ? `<div class="preview"><span class="eyebrow">D-29 예고</span>${esc(end.preview)}</div>` : ''}
        ${removed ? '' : `<p class="legend">${leftItems.length ? `남은 아이템: ${leftItems.map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(', ')}. ` : ''}${esc(RESULT_COMMON.nextCaseNote)}</p>`}
      </div></div>
      <div class="foot-actions three">
        <button class="btn" data-act="log">${ICON.log}대사 기록</button>
        <button class="btn" data-act="to-title">타이틀로</button>
        <button class="btn primary" data-act="retry-case-now">사건 다시 하기</button>
      </div>
    </section>`;
  }

  /* =============================== 노트 =============================== */

  function situationContent({ compact = false } = {}) {
    const S = SITUATION;
    const timeline = S.firstLife.map((e) => `<li><b>${esc(e.when)}</b> ${esc(e.text)}</li>`).join('');
    return `<div class="note-group situation">
      <h4>이번 사건 · ${esc(S.caseGoal.title)}</h4>
      <div class="note-item evidence"><b>${esc(S.caseGoal.goal)}</b><ol class="steps">${S.caseGoal.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <h4>이번 삶의 목표</h4>
      <div class="note-item"><ol class="steps">${LIFE_GOALS.map((g) => `<li>${esc(g)}</li>`).join('')}</ol></div>
      ${compact ? '' : `<h4>지금 나의 처지</h4><div class="note-item"><ul class="steps">${S.now.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <h4>해결 방향</h4><div class="note-item"><ul class="steps">${S.way.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <h4>첫 번째 삶의 기록</h4><div class="note-item"><ul class="timeline">${timeline}</ul></div>`}
    </div>`;
  }

  function notesContent(tab, { all = false } = {}) {
    const run = game.run;
    const sections = [];
    if (all || tab === 'situation') sections.push(situationContent({ compact: all }));
    if (all || tab === 'clues') {
      const groups = TOPIC_ORDER.map((tid) => {
        const t = TOPICS[tid];
        const items = t.clues
          .map((cid) => {
            const c = CLUES[cid];
            const st = game.clueStatus(cid);
            if (st === 'owned' || st === 'past') return clueCard(cid, { status: st, detail: !all });
            return `<div class="note-item unknown"><b>${DEPTH_INFO[c.depth].label}</b> · 아직 보지 못한 기억 <span class="faint">(${esc(DEPTH_INFO[c.depth].desc)})</span></div>`;
          })
          .join('');
        const a = run?.topicAttempts[tid];
        const state = a ? (a.status === 'completed' ? `완료 · ${DIFFICULTIES[a.difficulty].name}` : a.status === 'abandoned' ? '포기' : '진행 중') : '미조사';
        return `<div class="note-group"><h4>${CHARACTERS[t.target].name} · ${esc(t.title)} <span class="faint" style="font-weight:500">(${state})</span></h4>${items}</div>`;
      }).join('');
      const end = game.clueStatus('C_CASE_01_END');
      const endHtml =
        end === 'unknown'
          ? ''
          : `<div class="note-group"><h4>사건 정리</h4>${clueCard('C_CASE_01_END', { status: end, detail: !all })}</div>`;
      sections.push(`<p class="legend">기억 단서는 독심으로 읽은 내용입니다. 상대가 믿는 것이지, 객관적 사실이나 실물 증거는 아닙니다. 카드의 <b>판단 힌트</b>는 대화에서의 의미, <b>작동</b>은 게임 규칙상 연결된 곳입니다.</p>${groups}${endHtml}`);
    }
    if (all || tab === 'evidence') {
      const items = Object.values(EVIDENCE)
        .map((e) => {
          if (run?.evidence.includes(e.id)) return `<div class="note-item evidence clue"><div class="meta"><span class="chip gold">${ICON.doc}확보 증거</span></div><b>${esc(e.name)}</b><div>${esc(e.text)}</div><div class="muted" style="font-size:13px">${esc(e.note)}</div>${all ? '' : `<div class="clue-work"><b>작동</b>${workLines(e.id, { evidence: true })}</div>`}</div>`;
          if (game.meta.evidenceSeen.includes(e.id)) return `<div class="note-item past"><div class="meta"><span class="chip dim">지난 시도에서 확보 · 이번 시도 미확보</span></div><b>${esc(e.name)}</b></div>`;
          return `<div class="note-item unknown">아직 확보한 실물 증거가 없습니다.</div>`;
        })
        .join('');
      sections.push(`<div class="note-group"><h4>확보 증거</h4>${items}<p class="legend">확보 증거는 실제 문서입니다. 상대 앞에 내밀 수 있는 것은 실물뿐입니다.</p></div>`);
    }
    if (all || tab === 'people') {
      const ppl = [...(run?.player ? ['DOYUN'] : []), 'HAERIN', 'TAEGEON', 'MUJIN', 'SEOJIN']
        .map((id) => {
          const c = CHARACTERS[id];
          return `<div class="note-item"><div class="meta"><b>${esc(T(c.name))}${id === 'DOYUN' ? ' (나)' : ''}</b><span class="chip">${c.age}세 · ${esc(c.role)}</span>${id === 'HAERIN' && run ? `<span class="chip gold">${ICON.heart}신뢰 ${run.trust.HAERIN}</span>` : ''}</div><div class="muted" style="font-size:13px">${esc(T(c.note))}</div></div>`;
        })
        .join('');
      sections.push(`<div class="note-group"><h4>인물</h4>${ppl}</div>`);
    }
    return sections.join('');
  }

  function notesSheet(o) {
    const tabs = [
      ['situation', '상황'],
      ['clues', '기억 단서'],
      ['evidence', '확보 증거'],
      ['people', '인물'],
    ];
    return `<div class="overlay" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="노트" style="height:88%">
        <div class="sheet-head"><h2>노트</h2><span style="display:flex;gap:6px"><button class="btn small ghost" data-act="guide">${ICON.help}용어 안내</button><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></span></div>
        <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button class="tab" role="tab" aria-selected="${o.tab === id}" data-act="notes-tab" data-id="${id}">${label}</button>`).join('')}</div>
        <div class="sheet-body">${notesContent(o.tab)}</div>
      </div>
    </div>`;
  }

  function renderSide() {
    const run = game.run;
    const show = ui.view === 'game' && run && !INTRO_NODES.includes(run.nodeId);
    shell.classList.toggle('with-side', !!show);
    if (show) side.innerHTML = `<h2 class="side-title">노트</h2><p class="legend" style="margin:0 0 10px">읽기 전용 · 진행 상태를 바꾸지 않습니다.</p>${notesContent(null, { all: true })}`;
    else side.innerHTML = '';
  }

  /* =============================== 메뉴 · 설정 · 확인 =============================== */

  function menuSheet() {
    const inGame = ui.view === 'game' && game.run;
    return `<div class="overlay center" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="메뉴">
        <div class="sheet-head"><h2>메뉴</h2><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></div>
        <div class="menu-list">
          ${inGame ? `<button class="btn" data-act="notes">${ICON.notes}노트</button>` : ''}
          ${inGame ? `<button class="btn" data-act="log">${ICON.log}대사 기록</button>` : ''}
          <button class="btn" data-act="guide">${ICON.help}용어 안내</button>
          <button class="btn" data-act="settings">설정</button>
          ${inGame && !INTRO_NODES.includes(game.run.nodeId) ? `<button class="btn" data-act="retry-case">${ICON.restart}사건 처음부터 다시</button>` : ''}
          ${inGame ? `<button class="btn" data-act="to-title">타이틀로 나가기</button>` : ''}
          <p class="legend">진행은 자동 저장됩니다. 타이틀에서 이어하기로 돌아올 수 있습니다.</p>
        </div>
      </div>
    </div>`;
  }

  function settingsSheet() {
    const s = game.meta.settings;
    return `<div class="overlay center" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="설정">
        <div class="sheet-head"><h2>설정</h2><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></div>
        <div class="sheet-body">
          <div class="setting-row"><span>소리</span><button class="switch" role="switch" aria-checked="${!s.muted}" data-act="toggle-sound" aria-label="소리 켜기"></button></div>
          <div class="setting-row"><span>대사 속도</span><span class="seg">${[
            ['normal', '보통'],
            ['fast', '빠르게'],
            ['instant', '즉시'],
          ]
            .map(([v, l]) => `<button aria-pressed="${s.textSpeed === v}" data-act="text-speed" data-id="${v}">${l}</button>`)
            .join('')}</span></div>
          <div class="setting-row"><span>테스트용 상태 패널<br><small class="muted">수치·플래그·로그 표시 (단축키 \`)</small></span><button class="switch" role="switch" aria-checked="${s.debug}" data-act="toggle-debug" aria-label="테스트 패널"></button></div>
          <div class="setting-row"><span>모든 기록 초기화<br><small class="muted">진행·도감·엔딩·로그 삭제</small></span><button class="btn small danger" data-act="reset-all">초기화</button></div>
        </div>
      </div>
    </div>`;
  }

  function confirmSheet(o) {
    return `<div class="overlay center" data-act="overlay-bg">
      <div class="sheet" role="alertdialog" aria-modal="true" aria-label="${esc(o.title)}">
        <div class="sheet-head"><h2>${esc(o.title)}</h2></div>
        <div class="sheet-body">${o.body.map((b) => `<p>${esc(b)}</p>`).join('')}</div>
        <div class="sheet-foot">
          <button class="btn" data-act="close">${esc(o.cancel || '취소')}</button>
          <button class="btn ${o.danger ? 'danger' : 'primary'}" data-act="confirm-yes" data-autofocus>${esc(o.ok)}</button>
        </div>
      </div>
    </div>`;
  }

  function guideSheet() {
    const sections = GUIDE.map((g) => {
      let extra = '';
      if (g.depthTable) {
        extra = `<dl class="depth-table">${[1, 2, 3]
          .map((n) => `<dt>${DEPTH_INFO[n].label}</dt><dd>${esc(DEPTH_INFO[n].desc)}<br><span class="faint">${Object.values(DIFFICULTIES).filter((d) => d.depth >= n).map((d) => d.name).join('·')}에서 열림</span></dd>`)
          .join('')}</dl>`;
      }
      if (g.items) {
        extra = Object.values(ITEMS)
          .map((it) => `<div class="note-item"><div class="meta"><b>${it.name}</b><span class="chip">${it.context === 'puzzle' ? '퍼즐' : '대화'}</span></div><div class="muted" style="font-size:13px">${esc(it.desc)}</div></div>`)
          .join('');
      }
      return `<section class="guide-sec" id="guide-${g.id}"><h3>${esc(g.title)} <span class="chip">${esc(g.tag)}</span></h3>${g.body.map((b) => `<p>${esc(b)}</p>`).join('')}${extra}</section>`;
    }).join('');
    return `<div class="overlay" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="용어 안내" style="height:88%">
        <div class="sheet-head"><h2>용어 안내</h2><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></div>
        <div class="sheet-body guide-body">${sections}</div>
      </div>
    </div>`;
  }

  function logLineHtml(line) {
    if (line.card && line.list) return `<div class="log-card"><b>${esc(line.card)}</b><ol>${line.list.map((g) => `<li>${esc(T(g))}</li>`).join('')}</ol></div>`;
    if (line.card) return `<div class="log-card"><b>${esc(line.card)}</b> · ${esc(T(line.sub || ''))}</div>`;
    if (line.fx === 'blackout') return `<p class="log-narr">— 암전 — ${esc(T(line.narr || ''))}</p>`;
    if (line.who) {
      const p = lineParts(line);
      return `<div class="log-line ${p.whoCls || ''}"><b class="log-who">${esc(p.who)}</b><p class="${p.cls}">${esc(p.text)}</p></div>`;
    }
    return `<p class="log-narr">${esc(T(line.narr))}</p>`;
  }

  function logSheet() {
    const run = game.run;
    const entries = buildTranscript(run, { lineIdx: ui.lineIdx });
    const body = entries
      .map((e) => {
        if (e.kind === 'scene') return `<div class="log-scene">${esc(SCENE_NAME[e.nodeId] || NODE_LABEL[e.nodeId] || e.nodeId)}</div>`;
        if (e.kind === 'choice') {
          const ch = choiceRef(e.nodeId, e.choiceId);
          const r = e.record;
          const ds = r.before && r.after ? r.after.suspicion - r.before.suspicion : null;
          const dt = r.before && r.after ? r.after.trust.HAERIN - r.before.trust.HAERIN : null;
          const chips = [
            ds !== null ? `<span class="chip ${ds > 0 ? 'danger' : ds < 0 ? 'teal' : ''}">의심도 ${r.before.suspicion} → ${r.after.suspicion}</span>` : '',
            dt ? `<span class="chip ${dt > 0 ? 'gold' : 'warn'}">서해린 신뢰 ${r.before.trust.HAERIN} → ${r.after.trust.HAERIN}</span>` : '',
          ].join('');
          return `<div class="log-choice"><span class="chip gold">내 대답</span><p>${esc(ch.text)}</p>${chips ? `<div class="meta">${chips}</div>` : ''}</div>`;
        }
        return logLineHtml(e.line);
      })
      .join('');
    return `<div class="overlay" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="대사 기록" style="height:88%">
        <div class="sheet-head"><div><h2>대사 기록</h2><p class="legend">이번 시도에서 지금까지 나온 대사입니다. 읽기만 할 수 있습니다.</p></div><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></div>
        <div class="sheet-body log-body" data-log-body>${body || '<p class="muted">아직 기록된 대사가 없습니다.</p>'}</div>
      </div>
    </div>`;
  }

  function overlayMarkup() {
    const o = ui.overlay;
    if (!o) return '';
    if (o.type === 'guide') return guideSheet();
    if (o.type === 'log') return logSheet();
    if (o.type === 'notes') return notesSheet(o);
    if (o.type === 'difficulty') return difficultySheet(o);
    if (o.type === 'menu') return menuSheet();
    if (o.type === 'settings') return settingsSheet();
    if (o.type === 'confirm') return confirmSheet(o);
    return '';
  }

  function confirm(opts, onYes) {
    ui.overlay = { type: 'confirm', ...opts, onYes };
    render();
  }

  /* =============================== 테스트 패널 =============================== */

  function renderDebug() {
    if (!debugEl) return;
    if (!game.meta.settings.debug) {
      debugEl.hidden = true;
      return;
    }
    debugEl.hidden = false;
    const run = game.run;
    const p = run?.activePuzzle;
    const lines = run
      ? [
          `runId: ${run.runId}`,
          `node: ${run.nodeId}${run.pendingReaction ? ` (반응 표시 중: ${run.pendingReaction.choiceId})` : ''}`,
          `suspicion: ${run.suspicion}  trust.HAERIN: ${run.trust.HAERIN}  focus: ${run.focus}`,
          `inventory: ${JSON.stringify(run.inventory)}`,
          `clues: ${run.clues.join(', ') || '-'}`,
          `evidence: ${run.evidence.join(', ') || '-'}`,
          `flags: ${JSON.stringify(run.flags)}`,
          `topics: ${JSON.stringify(Object.fromEntries(Object.entries(run.topicAttempts).map(([k, v]) => [k, `${v.status}/${v.difficulty}`])))}`,
          `rewardClaims: ${run.rewardClaims.length}`,
          p ? `puzzle: ${p.boardId} ${p.status} moves ${p.moves}/${p.moveLimit} plates[${p.activePlates}] screws[${p.screws}] undo:${p.undoStack.length} T:${p.tempHole}` : 'puzzle: -',
          `codex: ${game.meta.codex.length}  endings: ${game.meta.endingsSeen.join(', ') || '-'}`,
          game.lastSaveError ? `SAVE ERROR: ${game.lastSaveError}` : 'save: ok',
        ]
      : ['run: 없음'];
    const log = game.log
      .list()
      .slice(-10)
      .map((e) => `${new Date(e.t).toLocaleTimeString()} ${e.type} ${JSON.stringify({ ...e, t: undefined, type: undefined, runId: undefined })}`)
      .join('\n');
    debugEl.innerHTML = `<h5><span>테스트 패널 (개발용)</span><span>${p && p.status === 'playing' ? '<button data-dbg="solve">해법 재생</button> ' : ''}<button data-dbg="dump">콘솔 출력</button> <button data-dbg="hide">닫기</button></span></h5><pre>${esc(lines.join('\n'))}</pre><h5>최근 로그</h5><pre>${esc(log)}</pre>`;
  }

  async function debugSolve() {
    const run = game.run;
    const p = run?.activePuzzle;
    if (!p) return;
    ui.selected = null;
    const path = solve(getBoard(p.boardId), p);
    if (!path) {
      showToast('현재 상태에서 해법이 없습니다. 처음부터 다시 시도하세요.');
      return;
    }
    for (const [src, dst] of path) {
      while (ui.locked) await new Promise((r) => setTimeout(r, 50));
      if (!game.run?.activePuzzle) break;
      doMove(src, dst);
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  debugEl?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dbg]');
    if (!b) return;
    if (b.dataset.dbg === 'hide') game.updateSettings({ debug: false });
    if (b.dataset.dbg === 'dump') console.log('[UNCREW] state', structuredClone(game.state), 'log', game.log.list());
    if (b.dataset.dbg === 'solve') debugSolve();
    render();
  });

  /* =============================== 입력 처리 =============================== */

  const ACTIONS = {
    'name-submit': () => submitName(),
    'name-default': () => submitName({ ...DEFAULT_PLAYER }),
    'new-game': () => {
      const start = () => {
        game.newGame();
        ui.nameDraft = null;
        ui.view = 'game';
        ui.overlay = null;
        ui.seqKey = null;
        render();
      };
      if (game.hasContinue()) {
        confirm(
          {
            title: '새 게임을 시작할까요?',
            body: ['진행 중인 사건 기록이 사라집니다.', '열람한 단서 도감과 본 결과는 유지됩니다.'],
            ok: '새 게임 시작',
            danger: true,
          },
          start,
        );
      } else start();
    },
    continue: () => {
      if (!game.hasContinue()) return;
      ui.view = 'game';
      ui.seqKey = null;
      render();
    },
    settings: () => {
      ui.overlay = { type: 'settings' };
      render();
    },
    menu: () => {
      ui.overlay = { type: 'menu' };
      render();
    },
    notes: () => {
      ui.overlay = { type: 'notes', tab: ui.notesTab || 'situation' };
      render();
    },
    'notes-tab': (el) => {
      ui.notesTab = el.dataset.id;
      ui.overlay = { type: 'notes', tab: el.dataset.id };
      render();
    },
    log: () => {
      reveal();
      ui.overlay = { type: 'log', back: ui.overlay && ui.overlay.type !== 'menu' ? ui.overlay : null, scrolled: false };
      render();
    },
    guide: () => {
      ui.overlay = { type: 'guide', back: ui.overlay && ui.overlay.type !== 'menu' ? ui.overlay : null };
      render();
    },
    close: () => {
      // 다른 창에서 연 용어 안내·대사 기록은 닫으면 원래 창으로 돌아갑니다.
      ui.overlay = ui.overlay?.back || null;
      render();
    },
    'overlay-bg': (el, e) => {
      if (e.target === el && ui.overlay?.type !== 'confirm') {
        ui.overlay = null;
        render();
      }
    },
    'confirm-yes': () => {
      const fn = ui.overlay?.onYes;
      ui.overlay = null;
      fn?.();
      render();
    },
    reveal: () => reveal(),
    next: () => nextLine(),
    skip: () => skipLines(),
    choose: (el) => onChoose(el.dataset.id),
    magnifier: () => {
      const r = game.useMagnifier();
      if (!r.ok) showToast(MOVE_REASON_TEXT[r.reason] || '돋보기를 쓸 수 없습니다.', r.reason === 'NO_TARGET' ? 'info' : '');
      else SFX.play('memory');
      render();
    },
    rehearsal: () => {
      ui.picking = !ui.picking;
      render();
    },
    'cancel-pick': () => {
      ui.picking = false;
      render();
    },
    'tutorial-start': () => {
      game.startTutorial();
      ui.selected = null;
      setMsg('');
      render();
    },
    'tutorial-skip': () => {
      game.finishTutorial({ skipped: true });
      ui.selected = null;
      ui.overlay = null;
      setMsg('');
      render();
    },
    'tutorial-done': () => {
      game.finishTutorial();
      ui.selected = null;
      setMsg('');
      render();
    },
    topic: (el) => {
      const run = game.run;
      const order = ['easy', 'normal', 'hard'];
      const diff = order.find((d) => DIFFICULTIES[d].cost <= run.focus) || 'easy';
      ui.overlay = { type: 'difficulty', topicId: el.dataset.id, diff };
      render();
    },
    'pick-diff': (el) => {
      ui.overlay.diff = el.dataset.id;
      render();
    },
    'start-topic': () => {
      if (ui.busy) return;
      ui.busy = true;
      const o = ui.overlay;
      const r = game.startTopic(o.topicId, o.diff);
      ui.busy = false;
      if (!r.ok) {
        showToast(r.reason === 'NO_FOCUS' ? '집중력이 부족합니다.' : '이 주제는 지금 조사할 수 없습니다.');
        return;
      }
      ui.overlay = null;
      ui.selected = null;
      setMsg('');
      render();
    },
    'finish-investigation': () => {
      const run = game.run;
      confirm(
        {
          title: '조사를 마치고 보고할까요?',
          body: [HUB.finishNote, ...(run.focus > 0 ? [`남은 집중력 ${run.focus}은 쓰지 않고 넘어갑니다.`] : [])],
          ok: '보고하러 가기',
        },
        () => game.finishInvestigation(),
      );
    },
    'close-reward': () => {
      game.closeReward();
      render();
    },
    'temp-slot': () => tapHole(TEMP_HOLE_ID),
    'pz-undo': () => {
      const r = game.puzzleUndo();
      if (!r.ok) setMsg(MOVE_REASON_TEXT[r.reason] || '되돌릴 수 없습니다.', 'err');
      else {
        ui.selected = null;
        setMsg('직전 이동을 되돌렸습니다. 되감기 도구 1개를 썼습니다.');
        SFX.play('move');
      }
      render();
    },
    'pz-temp': () => {
      confirm(
        {
          title: '임시 나사함을 쓸까요?',
          body: ['보드 밖에 언제나 쓸 수 있는 빈 구멍 하나가 생깁니다. 이 구멍의 나사는 어떤 판도 지지하지 않습니다.', '사용하면 지금까지의 되감기 기록이 지워집니다. 보드당 한 번만 쓸 수 있습니다.'],
          ok: '사용하기',
        },
        () => {
          const r = game.puzzleTempHole();
          if (!r.ok) setMsg(MOVE_REASON_TEXT[r.reason] || '쓸 수 없습니다.', 'err');
          else {
            ui.selected = null;
            setMsg('임시 나사함이 생겼습니다. 보드 아래 슬롯을 구멍처럼 쓸 수 있습니다.');
          }
        },
      );
    },
    'pz-retry': () => {
      const tutorial = game.run.activePuzzle?.kind === 'tutorial';
      confirm(
        {
          title: '처음부터 다시 풀까요?',
          body: tutorial ? ['연습 보드를 처음 배치로 되돌립니다.'] : ['같은 보드를 처음 배치로 되돌립니다. 집중력은 다시 쓰지 않습니다.', '이미 쓴 아이템은 돌아오지 않습니다. 임시 나사함을 썼다면 빈 상태로 남습니다.'],
          ok: '처음부터',
        },
        () => {
          game.puzzleRetry();
          ui.selected = null;
          setMsg('');
        },
      );
    },
    'pz-retry-now': () => {
      game.puzzleRetry();
      ui.selected = null;
      setMsg('');
      render();
    },
    'pz-abandon': () => {
      confirm(
        {
          title: '이 조사를 포기할까요?',
          body: ['집중력과 사용한 아이템은 돌려받지 못합니다.', '이 주제는 이번 사건에서 다시 고를 수 없습니다. 다른 주제를 조사하거나 보고를 진행할 수 있습니다.'],
          ok: '포기하기',
          danger: true,
        },
        () => {
          game.puzzleAbandon();
          ui.selected = null;
          setMsg('');
        },
      );
    },
    'retry-case': () => {
      confirm(
        {
          title: '사건을 처음부터 다시 할까요?',
          body: ['서해린과의 첫 대화부터 다시 시작합니다. 의심도·신뢰도·집중력·아이템·이번 시도의 단서가 모두 처음으로 돌아갑니다.', '열람한 단서 도감과 본 결과는 유지되지만, 이번 시도에서 다시 확보하기 전까지 선택지 조건에는 쓰이지 않습니다.'],
          ok: '다시 시작',
          danger: true,
        },
        () => {
          game.retryCase();
          ui.view = 'game';
          ui.seqKey = null;
          ui.selected = null;
          setMsg('');
        },
      );
    },
    'retry-case-now': () => {
      game.retryCase();
      ui.view = 'game';
      ui.seqKey = null;
      ui.selected = null;
      setMsg('');
      render();
    },
    'to-title': () => {
      ui.view = 'title';
      ui.overlay = null;
      ui.selected = null;
      SFX.setAmbient(false);
      render();
    },
    'toggle-sound': () => {
      const muted = !game.meta.settings.muted;
      game.updateSettings({ muted });
      SFX.setMuted(muted);
      if (muted) SFX.setAmbient(false);
      render();
    },
    'text-speed': (el) => {
      game.updateSettings({ textSpeed: el.dataset.id });
      render();
    },
    'toggle-debug': () => {
      game.updateSettings({ debug: !game.meta.settings.debug });
      render();
    },
    'reset-all': () => {
      confirm(
        { title: '모든 기록을 지울까요?', body: ['진행 중인 사건, 단서 도감, 본 결과, 설정, 로그를 모두 삭제합니다. 되돌릴 수 없습니다.'], ok: '모두 삭제', danger: true },
        () => {
          game.resetAllData();
          ui.view = 'title';
          SFX.setMuted(false);
        },
      );
    },
  };

  // 화면이 바뀌는 동작 직후의 연타가 새 화면의 다른 버튼을 누르지 않도록 잠시 막습니다.
  const SCREEN_CHANGING = new Set(['name-submit', 'name-default', 'new-game', 'continue', 'choose', 'start-topic', 'close-reward', 'confirm-yes', 'tutorial-start', 'tutorial-done', 'tutorial-skip', 'retry-case-now', 'to-title', 'next']);
  root.addEventListener('click', (e) => {
    SFX.unlockAudio();
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    if (el.disabled) return;
    if (performance.now() < ui.guardUntil) return;
    const act = el.dataset.act;
    const fn = ACTIONS[act];
    if (!fn) return;
    const before = `${ui.view}|${game.run?.nodeId}|${game.run?.pendingReaction?.choiceId}|${ui.overlay?.type}`;
    fn(el, e);
    const after = `${ui.view}|${game.run?.nodeId}|${game.run?.pendingReaction?.choiceId}|${ui.overlay?.type}`;
    if (SCREEN_CHANGING.has(act) && before !== after) ui.guardUntil = performance.now() + 320;
  });

  root.addEventListener('input', onNameInput);

  document.addEventListener('keydown', (e) => {
    if (e.target?.closest?.('input, textarea')) {
      if (e.key === 'Enter' && e.target.closest('.name-form')) {
        e.preventDefault();
        submitName();
      }
      return; // 입력 칸에서는 단축키를 쓰지 않습니다.
    }
    if (e.key === '`') {
      game.updateSettings({ debug: !game.meta.settings.debug });
      render();
      return;
    }
    if (e.key === 'Escape') {
      if (ui.overlay) {
        ui.overlay = null;
        render();
      } else if (ui.picking) {
        ui.picking = false;
        render();
      } else if (ui.selected) {
        ui.selected = null;
        setMsg('선택을 취소했습니다.');
        render();
      }
      return;
    }
    if (ui.overlay || ui.view !== 'game') return;
    const run = game.run;
    if (!run) return;
    const inDialogue = run.pendingReaction || ['scene', 'dialogue'].includes(NODES[run.nodeId]?.type);
    if (!inDialogue) return;
    if (e.key === ' ') {
      e.preventDefault();
      reveal();
    } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
      if (e.target.closest?.('button')) return; // 버튼 위의 Enter는 버튼 자체 동작
      e.preventDefault();
      nextLine();
    }
  });

  return {
    render,
    ui,
    /** 자동 테스트용: 대사 줄을 즉시 표시하도록 전환 */
    setAutoplay(v) {
      ui.autoplay = !!v;
    },
    tapHole,
  };
}

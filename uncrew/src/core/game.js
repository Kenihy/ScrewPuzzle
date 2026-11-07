/*
 * 언스크류(UNCREW) — 게임 상태 컨트롤러
 *
 * 명세 19.1의 책임 분리를 한 파일 안에서 구역으로 나눴습니다.
 *   GameState      : 상태 생성과 원자적 변경(commit)
 *   DialogueEngine : 조건 평가 · 효과 적용 · 다음 노드
 *   RewardService  : 단서·아이템 지급과 중복 방지
 *   PuzzleEngine   : puzzleEngine.js 호출 (이동·undo·클리어 판정)
 *   SaveService    : save.js
 *
 * UI는 이 컨트롤러의 메서드만 호출합니다. 모든 메서드는 { ok, reason, ... }을 돌려주고,
 * 거절된 호출은 상태·이동 횟수·집중력·아이템을 바꾸지 않습니다.
 */
import { INITIAL_RUN, ITEM_IDS, DIFFICULTIES, SCHEMA_VERSION, clamp, suspicionBand } from '../data/config.js';
import { CASE_ID, NODES, CLUES, TOPICS, CHECKPOINT_NODE } from '../data/case01.js';
import { getBoard, TUTORIAL_BOARD } from '../data/puzzles.js';
import { evaluate } from './conditions.js';
import * as PE from './puzzleEngine.js';
import { SaveService, EventLog } from './save.js';
import { validatePlayerName, DEFAULT_PLAYER } from './names.js';

export const R = {
  BAD_NODE: 'BAD_NODE',
  ALREADY_CHOSEN: 'ALREADY_CHOSEN',
  REACTION_PENDING: 'REACTION_PENDING',
  UNKNOWN_CHOICE: 'UNKNOWN_CHOICE',
  LOCKED: 'LOCKED',
  NO_RUN: 'NO_RUN',
  TOPIC_USED: 'TOPIC_USED',
  NO_FOCUS: 'NO_FOCUS',
  UNKNOWN_TOPIC: 'UNKNOWN_TOPIC',
  UNKNOWN_DIFFICULTY: 'UNKNOWN_DIFFICULTY',
  INVESTIGATION_CLOSED: 'INVESTIGATION_CLOSED',
  NO_PUZZLE: 'NO_PUZZLE',
  PUZZLE_ACTIVE: 'PUZZLE_ACTIVE',
  NO_ITEM: 'NO_ITEM',
  NO_TARGET: 'NO_TARGET',
  TUTORIAL_NO_ITEMS: 'TUTORIAL_NO_ITEMS',
  NOT_CLEARED: 'NOT_CLEARED',
  BAD_NAME: 'BAD_NAME',
};

const emptyInventory = () => Object.fromEntries(ITEM_IDS.map((i) => [i, 0]));

export function createMeta() {
  return {
    codex: [],
    evidenceSeen: [],
    endingsSeen: [],
    tutorialSeen: false,
    runsStarted: 0,
    lastPlayer: null,
    settings: { muted: false, textSpeed: 'normal', debug: false },
  };
}

export function createRun({ runId, nodeId, now, player = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    runId,
    startNode: nodeId, // 대사 기록을 어디서부터 보여 줄지 (새 게임: 프롤로그, 재도전: 체크포인트)
    player: player ? { surname: player.surname, given: player.given } : null,
    caseId: CASE_ID,
    nodeId,
    daysRemaining: INITIAL_RUN.daysRemaining,
    suspicion: INITIAL_RUN.suspicion,
    trust: { ...INITIAL_RUN.trust },
    focus: INITIAL_RUN.focus,
    clues: [],
    evidence: [],
    flags: {},
    topicAttempts: {},
    inventory: emptyInventory(),
    rewardClaims: [],
    choices: {},
    pendingReaction: null,
    lastReward: null,
    marks: { magnifier: {}, rehearsal: {} },
    investigationClosed: false,
    bandsShown: [],
    result: null,
    startedAt: now,
    endedAt: null,
    activePuzzle: null,
  };
}

function defaultRunId() {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `run-${Date.now().toString(36)}-${rnd}`;
}

/** 선택지의 결과(조건부 결과가 있으면 첫 번째로 맞는 것) */
export function pickOutcome(choice, run) {
  if (!choice.outcomes) return { id: 'DEFAULT', effects: choice.effects, reaction: choice.reaction };
  return choice.outcomes.find((o) => evaluate(o.when, run));
}

export function isChoiceEnabled(choice, run) {
  return evaluate(choice.requires, run);
}

export function rewardKey(run, topicId) {
  return `${run.runId}+${run.caseId}+${topicId}`;
}

export function computeEnding(run) {
  if (run.suspicion >= 100) return 'END_REMOVED';
  const deep =
    run.suspicion <= 35 &&
    (run.trust.HAERIN ?? 0) >= 55 &&
    run.evidence.includes('DOC_LIST') &&
    run.flags.F_PRESERVE_RECORD === true;
  if (deep) return 'END_ADVANTAGE';
  if (run.suspicion >= 70) return 'END_WATCHED';
  return 'END_SURVIVED';
}

export class Game {
  constructor({ storage = null, now = () => Date.now(), makeRunId = defaultRunId } = {}) {
    this.now = now;
    this.makeRunId = makeRunId;
    this.saver = new SaveService(storage);
    this.log = new EventLog(storage, { now });
    this.state = { schemaVersion: SCHEMA_VERSION, run: null, meta: createMeta() };
    this.loadIssue = null;
    this.lastSaveError = null;
    this.listeners = new Set();
    this.loadFromStorage();
  }

  /* ----------------------------- GameState ----------------------------- */

  get run() {
    return this.state.run;
  }

  get meta() {
    return this.state.meta;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  loadFromStorage() {
    const res = this.saver.load();
    if (res.status === 'ok') {
      this.state = { schemaVersion: SCHEMA_VERSION, run: res.data.run ?? null, meta: { ...createMeta(), ...res.data.meta } };
      this.state.meta.settings = { ...createMeta().settings, ...res.data.meta.settings };
      this.log.add('save_loaded', { runId: this.run?.runId ?? null, nodeId: this.run?.nodeId ?? null });
    } else if (res.status === 'corrupt') {
      this.loadIssue = { kind: 'corrupt', backupKey: res.backupKey, errors: res.errors };
      this.log.add('save_error', { phase: 'load', backupKey: res.backupKey, errors: res.errors.slice(0, 5) });
    } else if (res.status === 'error') {
      this.loadIssue = { kind: 'error', error: res.error };
      this.log.add('save_error', { phase: 'load', error: res.error });
    }
    return res.status;
  }

  hasContinue() {
    return !!this.run;
  }

  /** 상태 변경을 한 번에 저장합니다. 실패해도 메모리 상태로 계속 진행합니다. */
  commit() {
    const res = this.saver.save({ run: this.state.run, meta: this.state.meta });
    if (!res.ok) {
      this.lastSaveError = res.error;
      this.log.add('save_error', { phase: 'save', error: res.error });
    } else {
      this.lastSaveError = null;
    }
    this.listeners.forEach((fn) => fn(this.state, res));
    return res;
  }

  /* ----------------------------- 시작 · 재도전 ----------------------------- */

  newGame() {
    const runId = this.makeRunId();
    this.state.run = createRun({ runId, nodeId: 'PROLOGUE', now: this.now() });
    this.meta.runsStarted += 1;
    this.loadIssue = null;
    this.log.add('case_start', { runId, caseId: CASE_ID, from: 'new_game' });
    this.commit();
    return { ok: true };
  }

  /** 사건 재도전: HAERIN_OPEN 이전 상태로. 도감·엔딩 기록은 유지하고 이번 시도 기록은 모두 초기화합니다. */
  retryCase() {
    const runId = this.makeRunId();
    // 이름은 사건 재도전에서도 유지합니다. (재도전은 이름을 떠올린 이후 시점부터 시작)
    const player = this.run?.player || this.meta.lastPlayer || DEFAULT_PLAYER;
    this.state.run = createRun({ runId, nodeId: CHECKPOINT_NODE, now: this.now(), player });
    this.meta.runsStarted += 1;
    this.log.add('case_start', { runId, caseId: CASE_ID, from: 'retry' });
    this.commit();
    return { ok: true };
  }

  resetAllData() {
    this.saver.clear();
    this.log.clear();
    this.state = { schemaVersion: SCHEMA_VERSION, run: null, meta: createMeta() };
    this.loadIssue = null;
    this.commit();
  }

  updateSettings(patch) {
    Object.assign(this.meta.settings, patch);
    this.commit();
  }

  node() {
    return this.run ? NODES[this.run.nodeId] : null;
  }

  /** 단순 장면(scene)의 마지막 줄 이후 다음 노드로 */
  advance() {
    const run = this.run;
    if (!run) return { ok: false, reason: R.NO_RUN };
    const node = NODES[run.nodeId];
    if (node.type !== 'scene') return { ok: false, reason: R.BAD_NODE };
    run.nodeId = node.next;
    this.commit();
    return { ok: true, nodeId: run.nodeId };
  }

  /* ----------------------------- 이름 입력 ----------------------------- */

  /** 회귀 직후 이름을 떠올리는 장면. 규칙에 맞는 이름만 받습니다. (core/names.js) */
  setPlayerName(input) {
    const run = this.run;
    if (!run || NODES[run.nodeId].type !== 'name') return { ok: false, reason: R.BAD_NODE };
    const res = validatePlayerName(input);
    if (!res.ok) return { ok: false, reason: R.BAD_NAME, errors: res.errors };
    run.player = { ...res.player };
    this.meta.lastPlayer = { ...res.player };
    run.nodeId = NODES[run.nodeId].next;
    // 이름 자체는 로그에 남기지 않습니다.
    this.log.add('name_set', { runId: run.runId, length: res.player.surname.length + res.player.given.length, isDefault: res.player.surname === DEFAULT_PLAYER.surname && res.player.given === DEFAULT_PLAYER.given });
    this.commit();
    return { ok: true, player: run.player };
  }

  /* ----------------------------- DialogueEngine ----------------------------- */

  choiceView(nodeId = this.run?.nodeId) {
    const node = NODES[nodeId];
    if (!node || node.type !== 'dialogue') return [];
    return node.choices.map((c) => ({
      choice: c,
      enabled: isChoiceEnabled(c, this.run),
      magnified: (this.run.marks.magnifier[nodeId] || []).find((m) => m.choiceId === c.id) || null,
      rehearsal: this.run.marks.rehearsal[c.id] || null,
      related: c.relatedClue ? this.run.clues.includes(c.relatedClue) : false,
    }));
  }

  canChoose() {
    const run = this.run;
    if (!run) return R.NO_RUN;
    const node = NODES[run.nodeId];
    if (node.type !== 'dialogue') return R.BAD_NODE;
    if (run.pendingReaction) return R.REACTION_PENDING;
    if (run.choices[run.nodeId]) return R.ALREADY_CHOSEN;
    return null;
  }

  /** 명세 19.4 commitChoice */
  choose(choiceId) {
    const blocked = this.canChoose();
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    const node = NODES[run.nodeId];
    const choice = node.choices.find((c) => c.id === choiceId);
    if (!choice) return { ok: false, reason: R.UNKNOWN_CHOICE };
    if (!isChoiceEnabled(choice, run)) return { ok: false, reason: R.LOCKED };

    const outcome = pickOutcome(choice, run);
    const fx = outcome.effects || {};
    const before = { suspicion: run.suspicion, trust: { ...run.trust } };
    const bandBefore = suspicionBand(run.suspicion).id;

    // 효과는 정확히 한 번 적용합니다.
    run.suspicion = clamp(run.suspicion + (fx.suspicionDelta || 0));
    for (const [who, d] of Object.entries(fx.trustDelta || {})) run.trust[who] = clamp((run.trust[who] ?? 0) + d);
    Object.assign(run.flags, fx.setFlags || {});
    const grantedEvidence = [];
    for (const e of fx.grantEvidence || []) {
      if (!run.evidence.includes(e)) {
        run.evidence.push(e);
        grantedEvidence.push(e);
        if (!this.meta.evidenceSeen.includes(e)) this.meta.evidenceSeen.push(e);
        this.log.add('evidence_granted', { runId: run.runId, evidence: e, via: choice.id });
      }
    }
    const after = { suspicion: run.suspicion, trust: { ...run.trust } };

    this.log.add('dialogue_choice', {
      runId: run.runId,
      node: node.id,
      id: choice.id,
      outcome: outcome.id,
      suspicionBefore: before.suspicion,
      suspicionAfter: after.suspicion,
      trustBefore: before.trust.HAERIN,
      trustAfter: after.trust.HAERIN,
    });

    const removed = run.suspicion >= 100;
    const bandAfter = suspicionBand(run.suspicion).id;
    let bandEntered = null;
    if (!removed && bandAfter !== bandBefore && ['watched', 'review'].includes(bandAfter) && !run.bandsShown.includes(bandAfter)) {
      bandEntered = bandAfter;
      run.bandsShown.push(bandAfter);
    }
    // 선택 기록: 선택 잠금과 대사 기록(백로그)에 함께 씁니다.
    run.choices[node.id] = { choiceId: choice.id, outcomeId: outcome.id, before, after, bandEntered, removed };
    const sDelta = after.suspicion - before.suspicion;
    const rawDelta = fx.suspicionDelta || 0;
    const tone = rawDelta < 0 ? 'down' : rawDelta === 0 ? 'flat' : rawDelta <= 10 ? 'up_small' : 'up_big';

    run.pendingReaction = {
      nodeId: node.id,
      choiceId: choice.id,
      outcomeId: outcome.id,
      before,
      after,
      delta: { suspicion: sDelta, trust: { HAERIN: after.trust.HAERIN - before.trust.HAERIN } },
      grantedEvidence,
      removed,
      bandEntered,
      tone,
    };

    if (removed) {
      // 제거 판정 이후의 후속 노드나 보상은 실행하지 않습니다.
      this.finishCase('END_REMOVED', { nodeId: node.id, choiceId: choice.id, before, after });
    } else if (node.next === 'RESULT') {
      this.finishCase(computeEnding(run), null);
    } else {
      run.nodeId = node.next;
    }
    this.commit();
    return { ok: true, reaction: run.pendingReaction, nodeId: run.nodeId };
  }

  ackReaction() {
    if (!this.run || !this.run.pendingReaction) return { ok: false, reason: R.BAD_NODE };
    this.run.pendingReaction = null;
    this.commit();
    return { ok: true };
  }

  finishCase(endingId, cause) {
    const run = this.run;
    const result = { endingId, cause, at: this.now(), caseClue: null };
    if (endingId !== 'END_REMOVED') {
      // 공통 후속 단서는 난이도와 무관하게 지급합니다. 결과 화면 재진입에도 한 번만.
      const key = `${run.runId}+${run.caseId}+RESULT`;
      if (!run.rewardClaims.includes(key)) {
        const reconfirmed = run.clues.includes('C_HA_3');
        if (!run.clues.includes('C_CASE_01_END')) run.clues.push('C_CASE_01_END');
        if (!this.meta.codex.includes('C_CASE_01_END')) this.meta.codex.push('C_CASE_01_END');
        run.rewardClaims.push(key);
        result.caseClue = { id: 'C_CASE_01_END', reconfirmed };
        this.log.add('clue_granted', { runId: run.runId, clue: 'C_CASE_01_END', via: 'RESULT' });
      }
    }
    run.result = result;
    run.nodeId = 'RESULT';
    run.endedAt = this.now();
    if (!this.meta.endingsSeen.includes(endingId)) this.meta.endingsSeen.push(endingId);
    this.log.add('case_result', {
      runId: run.runId,
      ending: endingId,
      suspicion: run.suspicion,
      trust: run.trust.HAERIN,
      clues: run.clues.length,
      evidence: run.evidence.length,
      durationMs: run.endedAt - run.startedAt,
      cause: cause ? cause.choiceId : null,
    });
  }

  /* ----------------------------- 대화 아이템 ----------------------------- */

  useMagnifier() {
    const blocked = this.canChoose();
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    if (run.inventory.magnifier < 1) return { ok: false, reason: R.NO_ITEM };
    const nodeId = run.nodeId;
    const marked = run.marks.magnifier[nodeId] || [];
    for (const c of NODES[nodeId].choices) {
      if (!isChoiceEnabled(c, run)) continue;
      if (marked.some((m) => m.choiceId === c.id)) continue;
      const clueId = (c.contradictsClues || []).find((cl) => run.clues.includes(cl));
      if (!clueId) continue;
      run.marks.magnifier[nodeId] = [...marked, { choiceId: c.id, clueId }];
      run.inventory.magnifier -= 1;
      this.log.add('item_used', { runId: run.runId, item: 'magnifier', context: nodeId, target: c.id });
      this.commit();
      return { ok: true, choiceId: c.id, clueId };
    }
    // 실제 모순 대상이 없으면 소모하지 않습니다.
    return { ok: false, reason: R.NO_TARGET };
  }

  useRehearsal(choiceId) {
    const blocked = this.canChoose();
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    const choice = NODES[run.nodeId].choices.find((c) => c.id === choiceId);
    if (!choice) return { ok: false, reason: R.UNKNOWN_CHOICE };
    if (!isChoiceEnabled(choice, run)) return { ok: false, reason: R.LOCKED };
    const seen = run.marks.rehearsal[choiceId];
    if (seen) return { ok: true, direction: seen, reused: true };
    if (run.inventory.rehearsal < 1) return { ok: false, reason: R.NO_ITEM };
    const d = pickOutcome(choice, run).effects?.suspicionDelta || 0;
    const direction = d > 0 ? 'up' : d < 0 ? 'down' : 'same';
    run.marks.rehearsal[choiceId] = direction;
    run.inventory.rehearsal -= 1;
    this.log.add('item_used', { runId: run.runId, item: 'rehearsal', context: run.nodeId, target: choiceId });
    this.commit();
    return { ok: true, direction, reused: false };
  }

  /* ----------------------------- 튜토리얼 ----------------------------- */

  startTutorial() {
    const run = this.run;
    if (!run || run.nodeId !== 'TUTORIAL') return { ok: false, reason: R.BAD_NODE };
    if (run.activePuzzle) return { ok: true, resumed: true };
    run.activePuzzle = { ...PE.createPuzzleState(TUTORIAL_BOARD), kind: 'tutorial', topicId: null, difficulty: 'tutorial', attemptId: `${run.runId}+TUTORIAL`, retries: 0 };
    this.log.add('tutorial_start', { runId: run.runId });
    this.commit();
    return { ok: true };
  }

  /** 완료 또는 건너뛰기. 집중력 4, 아이템 0인 본편 시작 상태를 그대로 유지합니다. */
  finishTutorial({ skipped = false } = {}) {
    const run = this.run;
    if (!run || run.nodeId !== 'TUTORIAL') return { ok: false, reason: R.BAD_NODE };
    const cleared = run.activePuzzle?.status === 'cleared';
    run.activePuzzle = null;
    run.nodeId = NODES.TUTORIAL.next;
    this.meta.tutorialSeen = true;
    this.log.add(skipped || !cleared ? 'tutorial_skip' : 'tutorial_complete', { runId: run.runId });
    this.commit();
    return { ok: true };
  }

  /* ----------------------------- 허브 · 조사 ----------------------------- */

  topicStatus(topicId) {
    return this.run?.topicAttempts[topicId]?.status ?? 'open';
  }

  canStartTopic(topicId, difficultyId) {
    const run = this.run;
    if (!run) return R.NO_RUN;
    if (run.nodeId !== 'MEMORY_HUB') return R.BAD_NODE;
    if (run.investigationClosed) return R.INVESTIGATION_CLOSED;
    if (run.activePuzzle) return R.PUZZLE_ACTIVE;
    if (!TOPICS[topicId]) return R.UNKNOWN_TOPIC;
    const diff = DIFFICULTIES[difficultyId];
    if (!diff) return R.UNKNOWN_DIFFICULTY;
    if (run.topicAttempts[topicId]) return R.TOPIC_USED;
    if (run.focus < diff.cost) return R.NO_FOCUS;
    return null;
  }

  /** 시작 확인 시에만 집중력을 차감합니다. 연타해도 두 번째 호출은 노드가 바뀌어 거절됩니다. */
  startTopic(topicId, difficultyId) {
    const blocked = this.canStartTopic(topicId, difficultyId);
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    const diff = DIFFICULTIES[difficultyId];
    const focusBefore = run.focus;
    run.focus -= diff.cost;
    const attemptId = `${run.runId}+${topicId}`;
    run.topicAttempts[topicId] = { status: 'in_progress', difficulty: difficultyId, attemptId, retries: 0 };
    const board = getBoard(diff.boardId);
    run.activePuzzle = { ...PE.createPuzzleState(board), kind: 'topic', topicId, difficulty: difficultyId, attemptId, retries: 0 };
    run.nodeId = 'PUZZLE';
    this.log.add('topic_start', { runId: run.runId, topic: topicId, difficulty: difficultyId, focusBefore, focusAfter: run.focus });
    this.commit();
    return { ok: true };
  }

  finishInvestigation() {
    const run = this.run;
    if (!run || run.nodeId !== 'MEMORY_HUB') return { ok: false, reason: R.BAD_NODE };
    if (run.activePuzzle) return { ok: false, reason: R.PUZZLE_ACTIVE };
    run.investigationClosed = true;
    run.nodeId = NODES.MEMORY_HUB.next;
    this.log.add('investigation_end', { runId: run.runId, focusLeft: run.focus });
    this.commit();
    return { ok: true };
  }

  closeReward() {
    const run = this.run;
    if (!run || run.nodeId !== 'REWARD') return { ok: false, reason: R.BAD_NODE };
    run.nodeId = NODES.REWARD.next;
    this.commit();
    return { ok: true };
  }

  /* ----------------------------- PuzzleEngine 연결 ----------------------------- */

  puzzleBoard() {
    return this.run?.activePuzzle ? getBoard(this.run.activePuzzle.boardId) : null;
  }

  puzzleMove(src, dst) {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    const board = getBoard(p.boardId);
    const res = PE.applyMove(board, p, src, dst);
    if (!res.ok) return res; // 잘못된 입력은 아무것도 소비하지 않습니다.
    run.activePuzzle = { ...p, ...res.state };
    this.log.add('puzzle_move', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', src, dst, moveNumber: res.state.moves });
    let reward = null;
    if (res.cleared) {
      this.log.add('puzzle_clear', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', moves: res.state.moves, difficulty: p.difficulty });
      if (p.kind === 'topic') reward = this.completePuzzle(p.topicId, { commit: false });
    } else if (res.failed) {
      this.log.add('puzzle_fail', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', moves: res.state.moves });
    }
    this.commit();
    return { ...res, reward };
  }

  /**
   * 명세 19.4 completePuzzle. 같은 보상 키가 있으면 다시 지급하지 않습니다.
   * 보드 클리어 · 보상 · 노드 이동을 같은 커밋으로 묶습니다.
   */
  completePuzzle(topicId, { commit = true } = {}) {
    const run = this.run;
    const key = rewardKey(run, topicId);
    // 이미 지급한 보상 키면 상태를 전혀 바꾸지 않습니다. (새로고침·뒤로가기·중복 콜백 대비)
    if (run.rewardClaims.includes(key)) return { ...run.lastReward, duplicate: true };
    const p = run.activePuzzle;
    const attempt = run.topicAttempts[topicId];
    if (!attempt || !p || p.kind !== 'topic' || p.topicId !== topicId || p.status !== 'cleared') return null;

    const diff = DIFFICULTIES[attempt.difficulty];
    const granted = { clues: [], newClues: [], items: {} };
    for (const cid of TOPICS[topicId].clues.slice(0, diff.depth)) {
      granted.clues.push(cid);
      if (!run.clues.includes(cid)) {
        run.clues.push(cid);
        granted.newClues.push(cid);
        this.log.add('clue_granted', { runId: run.runId, clue: cid, via: topicId });
      }
      if (!this.meta.codex.includes(cid)) this.meta.codex.push(cid);
    }
    for (const [item, n] of Object.entries(diff.items)) {
      run.inventory[item] += n;
      granted.items[item] = n;
    }
    run.rewardClaims.push(key);
    run.lastReward = { topicId, difficulty: attempt.difficulty, ...granted, focusLeft: run.focus };
    attempt.status = 'completed';
    run.activePuzzle = null;
    run.nodeId = 'REWARD';
    if (commit) this.commit();
    return run.lastReward;
  }

  puzzleUndo() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.kind === 'tutorial') return { ok: false, reason: R.TUTORIAL_NO_ITEMS };
    if (run.inventory.undo < 1) return { ok: false, reason: R.NO_ITEM };
    const res = PE.applyUndo(getBoard(p.boardId), p);
    if (!res.ok) return res;
    run.activePuzzle = { ...p, ...res.state };
    run.inventory.undo -= 1;
    this.log.add('item_used', { runId: run.runId, item: 'undo', context: p.topicId });
    this.commit();
    return { ok: true, state: res.state };
  }

  puzzleTempHole() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.kind === 'tutorial') return { ok: false, reason: R.TUTORIAL_NO_ITEMS };
    if (run.inventory.temp_hole < 1) return { ok: false, reason: R.NO_ITEM };
    const res = PE.applyTempHole(getBoard(p.boardId), p);
    if (!res.ok) return res;
    run.activePuzzle = { ...p, ...res.state };
    run.inventory.temp_hole -= 1;
    this.log.add('item_used', { runId: run.runId, item: 'temp_hole', context: p.topicId });
    this.commit();
    return { ok: true };
  }

  /** 보드 재도전: 집중력은 다시 쓰지 않고, 이미 쓴 아이템도 돌려주지 않습니다. */
  puzzleRetry() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.status === 'cleared') return { ok: false, reason: PE.REASONS.ALREADY_CLEARED };
    const board = getBoard(p.boardId);
    run.activePuzzle = { ...p, ...PE.resetPuzzle(board, p), retries: p.retries + 1 };
    if (p.kind === 'topic') run.topicAttempts[p.topicId].retries += 1;
    this.log.add('puzzle_retry', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', retries: p.retries + 1 });
    this.commit();
    return { ok: true };
  }

  /** 포기: 주제를 닫고 허브로. 집중력과 사용한 아이템은 돌려주지 않습니다. */
  puzzleAbandon() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.kind === 'tutorial') return this.finishTutorial({ skipped: true });
    if (p.status === 'cleared') return { ok: false, reason: PE.REASONS.ALREADY_CLEARED };
    run.topicAttempts[p.topicId].status = 'abandoned';
    run.activePuzzle = null;
    run.nodeId = 'MEMORY_HUB';
    this.log.add('puzzle_abandon', { runId: run.runId, topic: p.topicId, moves: p.moves });
    this.commit();
    return { ok: true };
  }

  /* ----------------------------- 노트 표시용 ----------------------------- */

  /** 단서 상태: 'owned'(이번 시도 확보) | 'past'(지난 시도에서 열람, 이번 시도 미확보) | 'unknown' */
  clueStatus(clueId) {
    if (this.run?.clues.includes(clueId)) return 'owned';
    if (this.meta.codex.includes(clueId)) return 'past';
    return 'unknown';
  }

  clueText(clueId) {
    return CLUES[clueId]?.text ?? '';
  }
}

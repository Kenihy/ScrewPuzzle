/*
 * 언스크류(UNCREW) — 저장 서비스와 로컬 이벤트 로그 (명세 18장, 19.5)
 *
 * - RunState(이번 시도), PuzzleState(run.activePuzzle), MetaState(도감·엔딩·설정)를 한 키에 한 번에 씁니다.
 *   localStorage.setItem 한 번이 원자적이므로 "보상은 남고 보드만 미완료" 같은 반쪽 상태가 생기지 않습니다.
 * - 저장 실패 시 예외를 밖으로 던지지 않고 결과만 돌려줍니다. 게임은 메모리 상태로 계속 진행합니다.
 * - 깨진 저장은 별도 키로 보관하고 새 게임을 안내합니다. 잘못된 수치로 조용히 복원하지 않습니다.
 */
import { SCHEMA_VERSION, ITEM_IDS } from '../data/config.js';
import { NODES, NODE_ORDER, CLUES, EVIDENCE, TOPICS, ENDINGS } from '../data/case01.js';
import { validatePlayerName, DEFAULT_PLAYER } from './names.js';
import { getBoard } from '../data/puzzles.js';
import { validatePuzzleState } from './puzzleEngine.js';

export const SAVE_KEY = 'uncrew.save.v1';
export const LOG_KEY = 'uncrew.log.v1';
export const CORRUPT_PREFIX = 'uncrew.save.corrupt.';

/** 테스트와 저장소 접근이 막힌 환경에서 쓰는 메모리 저장소 */
export function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    keys: () => [...map.keys()],
    _map: map,
  };
}

/** 브라우저 localStorage. 접근 자체가 막혀 있으면 null */
export function browserStorage() {
  try {
    const s = globalThis.localStorage;
    const probe = '__uncrew_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const isInt = (v) => Number.isInteger(v);

/**
 * 이전 저장 형식을 현재 형식으로 바꿉니다. 바꿀 수 없으면 그대로 돌려주고 검증에서 걸러집니다.
 * v1 → v2: 주인공 이름(run.player)이 생겼습니다. v1은 이름이 '한도윤'으로 고정되어 있었으므로,
 * 이름을 떠올리는 장면을 이미 지난 진행에는 기본 이름을 넣습니다.
 */
export function migrateSaveData(data) {
  if (!data || typeof data !== 'object') return data;
  if (data.schemaVersion === 1) {
    const out = { ...data, schemaVersion: 2 };
    out.meta = { ...(data.meta || {}), lastPlayer: null };
    if (data.run && typeof data.run === 'object') {
      const before = ['PROLOGUE', 'RETURN'].includes(data.run.nodeId);
      out.run = { ...data.run, schemaVersion: 2, player: before ? null : { ...DEFAULT_PLAYER } };
    }
    return out;
  }
  return data;
}
const inRange = (v, lo, hi) => isInt(v) && v >= lo && v <= hi;

/** 저장 데이터 스키마 검증. 문제 목록을 돌려줍니다. */
export function validateSaveData(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['not an object'];
  if (data.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion ${data.schemaVersion}`);
  const meta = data.meta;
  if (!meta || typeof meta !== 'object') errors.push('meta missing');
  else {
    if (!Array.isArray(meta.codex) || meta.codex.some((c) => !CLUES[c])) errors.push('meta.codex');
    if (!Array.isArray(meta.endingsSeen) || meta.endingsSeen.some((e) => !ENDINGS[e])) errors.push('meta.endingsSeen');
    if (typeof meta.tutorialSeen !== 'boolean') errors.push('meta.tutorialSeen');
    if (!meta.settings || typeof meta.settings !== 'object') errors.push('meta.settings');
    if (meta.lastPlayer != null && !validatePlayerName(meta.lastPlayer).ok) errors.push('meta.lastPlayer');
  }
  const run = data.run;
  if (run === null || run === undefined) return errors;
  if (typeof run !== 'object') return [...errors, 'run not object'];
  if (run.schemaVersion !== SCHEMA_VERSION) errors.push('run.schemaVersion');
  if (typeof run.runId !== 'string' || !run.runId) errors.push('run.runId');
  if (run.caseId !== 'CASE_01') errors.push('run.caseId');
  if (!NODES[run.nodeId]) errors.push('run.nodeId');
  if (run.player != null && !validatePlayerName(run.player).ok) errors.push('run.player');
  if (run.player == null && NODE_ORDER.indexOf(run.nodeId) > NODE_ORDER.indexOf('NAME_ENTRY')) errors.push('run.player missing');
  if (!inRange(run.suspicion, 0, 100)) errors.push('run.suspicion');
  if (!run.trust || !inRange(run.trust.HAERIN, 0, 100)) errors.push('run.trust');
  if (!inRange(run.focus, 0, 4)) errors.push('run.focus');
  if (!inRange(run.daysRemaining, 0, 30)) errors.push('run.daysRemaining');
  if (!Array.isArray(run.clues) || run.clues.some((c) => !CLUES[c])) errors.push('run.clues');
  if (!Array.isArray(run.evidence) || run.evidence.some((e) => !EVIDENCE[e])) errors.push('run.evidence');
  if (!run.flags || typeof run.flags !== 'object') errors.push('run.flags');
  if (!Array.isArray(run.rewardClaims) || run.rewardClaims.some((k) => typeof k !== 'string')) errors.push('run.rewardClaims');
  if (!run.inventory || ITEM_IDS.some((i) => !inRange(run.inventory[i], 0, 99))) errors.push('run.inventory');
  if (!run.topicAttempts || typeof run.topicAttempts !== 'object') errors.push('run.topicAttempts');
  else {
    for (const [t, a] of Object.entries(run.topicAttempts)) {
      if (!TOPICS[t]) errors.push(`run.topicAttempts.${t}`);
      if (!['in_progress', 'completed', 'abandoned'].includes(a?.status)) errors.push(`run.topicAttempts.${t}.status`);
    }
  }
  if (!run.choices || typeof run.choices !== 'object') errors.push('run.choices');
  if (!run.marks || typeof run.marks.magnifier !== 'object' || typeof run.marks.rehearsal !== 'object') errors.push('run.marks');
  if (!Array.isArray(run.bandsShown)) errors.push('run.bandsShown');
  if (typeof run.investigationClosed !== 'boolean') errors.push('run.investigationClosed');
  if (run.nodeId === 'PUZZLE' && !run.activePuzzle) errors.push('PUZZLE without activePuzzle');
  if (run.nodeId === 'REWARD' && !run.lastReward) errors.push('REWARD without lastReward');
  if (run.nodeId === 'RESULT' && !run.result) errors.push('RESULT without result');
  if (run.activePuzzle) {
    const p = run.activePuzzle;
    const board = getBoard(p.boardId);
    const perr = validatePuzzleState(board, p);
    errors.push(...perr.map((e) => `activePuzzle: ${e}`));
    if (p.kind === 'topic' && !TOPICS[p.topicId]) errors.push('activePuzzle.topicId');
    if (!['topic', 'tutorial'].includes(p.kind)) errors.push('activePuzzle.kind');
  }
  return errors;
}

export class SaveService {
  constructor(storage) {
    this.storage = storage;
  }

  get available() {
    return !!this.storage;
  }

  save(data) {
    if (!this.storage) return { ok: false, error: 'storage unavailable' };
    try {
      const payload = JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION, savedAt: Date.now() });
      this.storage.setItem(SAVE_KEY, payload);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    }
  }

  load() {
    if (!this.storage) return { status: 'empty' };
    let raw;
    try {
      raw = this.storage.getItem(SAVE_KEY);
    } catch (err) {
      return { status: 'error', error: String(err) };
    }
    if (raw == null) return { status: 'empty' };
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return this.quarantine(raw, ['JSON parse error']);
    }
    data = migrateSaveData(data);
    const errors = validateSaveData(data);
    if (errors.length) return this.quarantine(raw, errors);
    return { status: 'ok', data };
  }

  /** 깨진 저장을 별도 키로 옮겨 두고 원래 키를 비웁니다. */
  quarantine(raw, errors) {
    const backupKey = CORRUPT_PREFIX + Date.now();
    try {
      this.storage.setItem(backupKey, raw);
      this.storage.removeItem(SAVE_KEY);
    } catch {
      /* 보관에 실패해도 원본은 건드리지 않습니다 */
    }
    return { status: 'corrupt', backupKey, errors };
  }

  clear() {
    try {
      this.storage?.removeItem(SAVE_KEY);
    } catch {
      /* noop */
    }
  }
}

/** 외부로 전송하지 않는 로컬 플레이 로그. 디버그와 수치 조정용입니다. */
export class EventLog {
  constructor(storage, { max = 400, now = () => Date.now() } = {}) {
    this.storage = storage;
    this.max = max;
    this.now = now;
    this.items = [];
    this.listeners = new Set();
    try {
      const raw = storage?.getItem(LOG_KEY);
      if (raw) this.items = JSON.parse(raw).slice(-max);
    } catch {
      this.items = [];
    }
  }

  add(type, data = {}) {
    const entry = { t: this.now(), type, ...data };
    this.items.push(entry);
    if (this.items.length > this.max) this.items.splice(0, this.items.length - this.max);
    try {
      this.storage?.setItem(LOG_KEY, JSON.stringify(this.items));
    } catch {
      /* 로그 저장 실패는 무시합니다 */
    }
    this.listeners.forEach((fn) => fn(entry));
    return entry;
  }

  list() {
    return this.items;
  }

  clear() {
    this.items = [];
    try {
      this.storage?.removeItem(LOG_KEY);
    } catch {
      /* noop */
    }
  }
}

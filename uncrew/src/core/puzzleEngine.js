/*
 * 언스크류(UNCREW) — 스크류 퍼즐 엔진 (명세 10장)
 *
 * 화면과 분리된 순수 로직입니다. 브라우저와 Node.js 테스트가 같은 파일을 씁니다.
 * 모든 함수는 상태를 직접 바꾸지 않고 새 상태를 돌려줍니다. 상태는 그대로 JSON으로 저장할 수 있습니다.
 *
 * 퍼즐 상태(PuzzleState)
 *   boardId       보드 ID
 *   moveLimit     이동 한도
 *   screws        나사가 꽂힌 구멍 ID 목록
 *   activePlates  아직 떨어지지 않은 판 ID 목록
 *   moves         이동 횟수
 *   undoStack     이동 직전 상태 기록 [{ screws, activePlates, moves }]
 *   tempHole      임시 나사함(T)이 추가되었는지 여부
 *   status        'playing' | 'cleared' | 'failed'
 */

export const TEMP_HOLE_ID = 'T';

export const REASONS = {
  NOT_PLAYING: 'NOT_PLAYING',
  SAME_HOLE: 'SAME_HOLE',
  UNKNOWN_HOLE: 'UNKNOWN_HOLE',
  NO_SCREW: 'NO_SCREW',
  OCCUPIED: 'OCCUPIED',
  SRC_BLOCKED: 'SRC_BLOCKED',
  DST_BLOCKED: 'DST_BLOCKED',
  NO_HISTORY: 'NO_HISTORY',
  ALREADY_CLEARED: 'ALREADY_CLEARED',
  TEMP_HOLE_USED: 'TEMP_HOLE_USED',
};

export function createPuzzleState(board) {
  return {
    boardId: board.id,
    moveLimit: board.moveLimit,
    screws: [...board.screws],
    activePlates: board.plates.map((p) => p.id),
    moves: 0,
    undoStack: [],
    tempHole: false,
    status: 'playing',
  };
}

function plateById(board, id) {
  return board.plates.find((p) => p.id === id);
}

/** 현재 등록된 구멍 ID 목록. 임시 나사함이 있으면 T를 포함합니다. */
export function holeIds(board, state) {
  const ids = board.holes.map((h) => h.id);
  if (state.tempHole) ids.push(TEMP_HOLE_ID);
  return ids;
}

export function isRegisteredHole(board, state, id) {
  if (id === TEMP_HOLE_ID) return !!state.tempHole;
  return board.holes.some((h) => h.id === id);
}

/** 활성 판의 blockedHoles에 포함되면 가려진 구멍입니다. 임시 구멍은 어떤 판에도 가려지지 않습니다. */
export function isBlocked(board, state, holeId) {
  if (holeId === TEMP_HOLE_ID) return false;
  return state.activePlates.some((pid) => plateById(board, pid).blockedHoles.includes(holeId));
}

export function hasScrew(state, holeId) {
  return state.screws.includes(holeId);
}

/** 판을 지지하는 나사 수. 여러 판이 같은 anchorHole을 공유할 수 있습니다. 임시 구멍은 어떤 판도 지지하지 않습니다. */
export function supportCount(board, state, plateId) {
  const plate = plateById(board, plateId);
  return plate.anchorHoles.filter((h) => state.screws.includes(h)).length;
}

/** 명세 10.3의 이동 가능 조건 1~6 */
export function checkMove(board, state, src, dst) {
  if (state.status !== 'playing') return { ok: false, reason: REASONS.NOT_PLAYING };
  if (!isRegisteredHole(board, state, src) || !isRegisteredHole(board, state, dst)) {
    return { ok: false, reason: REASONS.UNKNOWN_HOLE };
  }
  if (src === dst) return { ok: false, reason: REASONS.SAME_HOLE };
  if (!hasScrew(state, src)) return { ok: false, reason: REASONS.NO_SCREW };
  if (hasScrew(state, dst)) return { ok: false, reason: REASONS.OCCUPIED };
  if (isBlocked(board, state, src)) return { ok: false, reason: REASONS.SRC_BLOCKED };
  if (isBlocked(board, state, dst)) return { ok: false, reason: REASONS.DST_BLOCKED };
  return { ok: true };
}

/** 나사를 집을 수 있는지(가려지지 않았는지). 선택만으로는 상태가 바뀌지 않습니다. */
export function canSelect(board, state, holeId) {
  if (state.status !== 'playing') return false;
  if (!isRegisteredHole(board, state, holeId)) return false;
  return hasScrew(state, holeId) && !isBlocked(board, state, holeId);
}

export function validDestinations(board, state, src) {
  return holeIds(board, state).filter((dst) => checkMove(board, state, src, dst).ok);
}

export function listValidMoves(board, state) {
  const out = [];
  for (const src of state.screws) {
    for (const dst of holeIds(board, state)) {
      if (checkMove(board, state, src, dst).ok) out.push([src, dst]);
    }
  }
  return out;
}

export function hasAnyValidMove(board, state) {
  return listValidMoves(board, state).length > 0;
}

function snapshot(state) {
  return { screws: [...state.screws], activePlates: [...state.activePlates], moves: state.moves };
}

/**
 * 나사 이동. 동작 순서(명세 10.3):
 * undo 기록 저장 → 나사 이동 → 이동 횟수 +1 → 지지 0인 판 모두 제거 → 클리어 판정 → 이동 한도 판정
 */
export function applyMove(board, state, src, dst) {
  const check = checkMove(board, state, src, dst);
  if (!check.ok) return { ok: false, reason: check.reason, state };

  const next = {
    ...state,
    undoStack: [...state.undoStack, snapshot(state)],
    screws: state.screws.filter((h) => h !== src).concat(dst),
    moves: state.moves + 1,
  };

  const removed = next.activePlates.filter((pid) => supportCount(board, next, pid) === 0);
  next.activePlates = next.activePlates.filter((pid) => !removed.includes(pid));

  let cleared = false;
  let failed = false;
  if (next.activePlates.length === 0) {
    next.status = 'cleared';
    cleared = true;
  } else if (next.moves >= next.moveLimit) {
    next.status = 'failed';
    failed = true;
  }

  // 새로 드러난 구멍: 이동 전에는 가려졌지만 지금은 보이는 구멍
  const revealed = holeIds(board, next).filter((h) => isBlocked(board, state, h) && !isBlocked(board, next, h));

  return { ok: true, state: next, removed, revealed, cleared, failed };
}

/** 직전 이동 하나를 되돌립니다. 제거된 판·가림·나사 위치·이동 횟수를 모두 복원합니다. */
export function applyUndo(board, state) {
  if (state.status === 'cleared') return { ok: false, reason: REASONS.ALREADY_CLEARED, state };
  if (state.undoStack.length === 0) return { ok: false, reason: REASONS.NO_HISTORY, state };
  const prev = state.undoStack[state.undoStack.length - 1];
  const next = {
    ...state,
    screws: [...prev.screws],
    activePlates: [...prev.activePlates],
    moves: prev.moves,
    undoStack: state.undoStack.slice(0, -1),
    status: 'playing',
  };
  return { ok: true, state: next };
}

/** 임시 나사함 T를 추가합니다. 이동 횟수는 쓰지 않고, 구조가 달라지므로 undo 기록을 비웁니다. */
export function applyTempHole(board, state) {
  if (state.status === 'cleared') return { ok: false, reason: REASONS.ALREADY_CLEARED, state };
  if (state.tempHole) return { ok: false, reason: REASONS.TEMP_HOLE_USED, state };
  return { ok: true, state: { ...state, tempHole: true, undoStack: [] } };
}

/** 보드 재도전: 초기 배치로 복원합니다. 임시 나사함 효과는 유지하되 비워 둡니다. */
export function resetPuzzle(board, state) {
  return {
    ...createPuzzleState(board),
    tempHole: state.tempHole,
  };
}

/**
 * 논리 좌표(640×640)에서 가장 가까운 "보이는" 구멍을 찾습니다.
 * 가려진 구멍은 후보에서 빼서 판 아래의 정보를 입력으로 노출하지 않습니다.
 */
export function pickHole(board, state, x, y, radius = 48) {
  let best = null;
  let bestD = radius * radius;
  for (const h of board.holes) {
    if (isBlocked(board, state, h.id)) continue;
    const d = (h.x - x) ** 2 + (h.y - y) ** 2;
    if (d <= bestD) {
      best = h.id;
      bestD = d;
    }
  }
  return best;
}

/** 논리 좌표가 활성 판 위인지 (가장 위의 판 ID, 없으면 null) */
export function plateAt(board, state, x, y) {
  let top = null;
  for (const pid of state.activePlates) {
    const p = plateById(board, pid);
    const [px, py, w, h] = p.rect;
    if (x >= px && x <= px + w && y >= py && y <= py + h && (!top || p.z > top.z)) top = p;
  }
  return top ? top.id : null;
}

/** 저장된 퍼즐 상태가 보드 데이터와 맞는지 검사합니다. 문제 목록을 돌려줍니다. */
export function validatePuzzleState(board, state) {
  const errors = [];
  if (!board) return ['unknown board'];
  if (state.boardId !== board.id) errors.push('boardId mismatch');
  if (!Number.isInteger(state.moves) || state.moves < 0 || state.moves > board.moveLimit) errors.push('moves out of range');
  if (state.moveLimit !== board.moveLimit) errors.push('moveLimit mismatch');
  if (!Array.isArray(state.screws)) errors.push('screws not array');
  else {
    if (new Set(state.screws).size !== state.screws.length) errors.push('duplicate screw');
    if (state.screws.length !== board.screws.length) errors.push('screw count changed');
    for (const h of state.screws) if (!isRegisteredHole(board, state, h)) errors.push(`screw on unknown hole ${h}`);
  }
  if (!Array.isArray(state.activePlates)) errors.push('activePlates not array');
  else for (const p of state.activePlates) if (!plateById(board, p)) errors.push(`unknown plate ${p}`);
  if (!['playing', 'cleared', 'failed'].includes(state.status)) errors.push('bad status');
  if (!Array.isArray(state.undoStack)) errors.push('undoStack not array');
  if (typeof state.tempHole !== 'boolean') errors.push('tempHole not boolean');
  return errors;
}

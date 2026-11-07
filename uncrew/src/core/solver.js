/*
 * 언스크류(UNCREW) — 너비 우선 탐색 풀이기
 *
 * 튜토리얼의 "다음 유효 행동 강조"와 개발용 검증에만 씁니다. 일반 플레이에서 정답을 자동 실행하지 않습니다.
 * P0 보드는 구멍 16개·나사 12개 이하라서 전체 상태 공간이 작습니다.
 */
import { applyMove, listValidMoves } from './puzzleEngine.js';

function keyOf(state) {
  return [...state.screws].sort().join(',') + '|' + [...state.activePlates].sort().join(',');
}

/**
 * 현재 상태에서 모든 판을 제거하는 최단 이동 목록을 찾습니다.
 * 이동 한도는 무시하고 순수 해법만 찾습니다. 해법이 없으면 null을 돌려줍니다.
 */
export function solve(board, start, { maxStates = 200000 } = {}) {
  if (start.activePlates.length === 0) return [];
  const root = { ...start, status: 'playing', moveLimit: Infinity, undoStack: [] };
  const seen = new Set([keyOf(root)]);
  const queue = [{ state: root, path: [] }];
  for (let head = 0; head < queue.length; head++) {
    const { state, path } = queue[head];
    for (const [src, dst] of listValidMoves(board, state)) {
      const res = applyMove(board, state, src, dst);
      const next = { ...res.state, undoStack: [] };
      const k = keyOf(next);
      if (seen.has(k)) continue;
      const nextPath = path.concat([[src, dst]]);
      if (res.cleared) return nextPath;
      seen.add(k);
      if (seen.size > maxStates) return null;
      queue.push({ state: next, path: nextPath });
    }
  }
  return null;
}

/** 다음 한 수만 돌려줍니다. 튜토리얼 강조용. */
export function nextHint(board, state) {
  const path = solve(board, state);
  return path && path.length ? path[0] : null;
}

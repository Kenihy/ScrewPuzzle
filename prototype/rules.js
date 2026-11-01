/*
 * 나사 너머 — 퍼즐 규칙 엔진 (브라우저와 Node.js 공용)
 *
 * 판(plank), 구멍(hole), 나사(screw)의 관계와 이동 규칙만 담당합니다.
 * 화면 그리기와 입력 처리는 game.js가, 레벨 생성은 tools/levelgen.mjs가 이 파일을 사용합니다.
 * Unity로 옮길 때도 이 파일의 규칙을 그대로 C#으로 옮기면 됩니다. (docs/game-design.md 참고)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ScrewRules = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  // 보드 좌표계: 300 x 400 (일러스트 3:4 비율과 동일), 격자 5열 x 7행
  const GRID = {
    cols: 5, rows: 7, x0: 40, y0: 35, step: 55,
    boardW: 300, boardH: 400,
    barR: 19,      // 막대형 판의 반폭
    panelM: 22,    // 판넬형 판이 격자점 바깥으로 나오는 여백
    holeR: 8.5,
    screwR: 11,
  };
  const MAX_TRAY = 6;

  function gridXY(pt) {
    return [GRID.x0 + GRID.step * pt[0], GRID.y0 + GRID.step * pt[1]];
  }

  // 판이 덮는 격자점 목록
  function coveredPoints(p) {
    const out = [];
    if (p.kind === 'bar') {
      const di = Math.sign(p.b[0] - p.a[0]);
      const dj = Math.sign(p.b[1] - p.a[1]);
      const L = Math.max(Math.abs(p.b[0] - p.a[0]), Math.abs(p.b[1] - p.a[1]));
      for (let k = 0; k <= L; k++) out.push([p.a[0] + di * k, p.a[1] + dj * k]);
    } else {
      const i0 = Math.min(p.a[0], p.b[0]), i1 = Math.max(p.a[0], p.b[0]);
      const j0 = Math.min(p.a[1], p.b[1]), j1 = Math.max(p.a[1], p.b[1]);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) out.push([i, j]);
    }
    return out;
  }

  const ptKey = (pt) => pt[0] + ',' + pt[1];

  /*
   * 레벨 데이터 → 계산용 모델
   * holes[0..5]  : 상단 보관 구멍(트레이). st.tray 개수만큼만 사용 가능
   * holes[6..]   : 보드 구멍. 판에 뚫린 구멍 위치의 합집합
   * hole.cover   : 그 구멍 위치를 덮는 판 목록(아래→위 순서). hole=true면 그 판에도 구멍이 뚫려 있음
   */
  function buildModel(level) {
    const holes = [];
    for (let t = 0; t < MAX_TRAY; t++) holes.push({ tray: true, slot: t, cover: [] });
    const index = new Map();
    const planks = level.planks.map((p, z) => ({
      z, kind: p.kind, a: p.a, b: p.b, color: p.color || 0, key: !!p.key,
      holePts: p.holes, holeIdx: [], cells: coveredPoints(p),
    }));
    planks.forEach((p) => {
      p.holePts.forEach((pt) => {
        const k = ptKey(pt);
        if (!index.has(k)) {
          index.set(k, holes.length);
          holes.push({ tray: false, i: pt[0], j: pt[1], cover: [] });
        }
        p.holeIdx.push(index.get(k));
      });
    });
    holes.forEach((h, hi) => {
      if (h.tray) return;
      planks.forEach((p) => {
        if (p.cells.some((c) => c[0] === h.i && c[1] === h.j)) {
          h.cover.push({ p: p.z, hole: p.holeIdx.includes(hi) });
        }
      });
    });
    let maxIce = 0;
    (level.screws || []).forEach((s) => { if (s.ice) maxIce = Math.max(maxIce, s.ice); });
    return { level, holes, planks, index, keyPlank: planks.findIndex((p) => p.key), maxIce };
  }

  // 구조 검사: 판의 구멍은 반드시 판 위에 있어야 하고,
  // 한 구멍 위치에서 '구멍 뚫린 판'은 항상 아래쪽부터 연속으로 쌓여야 합니다.
  // (구멍 뚫린 판 아래에 막힌 판이 있으면 나사가 박힐 수 없기 때문)
  function validate(model) {
    for (const p of model.planks) {
      for (const pt of p.holePts) {
        if (!p.cells.some((c) => c[0] === pt[0] && c[1] === pt[1])) return 'plank ' + p.z + ' hole outside';
      }
    }
    for (const h of model.holes) {
      if (h.tray) continue;
      let solidSeen = false;
      for (const c of h.cover) {
        if (!c.hole) solidSeen = true;
        else if (solidSeen) return 'hole ' + ptKey([h.i, h.j]) + ' prefix broken';
      }
    }
    return null;
  }

  function initialState(model) {
    const lv = model.level;
    const st = {
      alive: model.planks.map(() => 1),
      occ: model.holes.map(() => -1),
      screws: [],
      moves: 0,
      tray: lv.tray,
    };
    lv.screws.forEach((s, id) => {
      const h = model.index.get(ptKey(s.at));
      st.screws.push({ h, ice: s.ice || 0, lock: !!s.lock });
      st.occ[h] = id;
    });
    settle(model, st);
    return st;
  }

  function clone(st) {
    return {
      alive: st.alive.slice(),
      occ: st.occ.slice(),
      screws: st.screws.map((s) => ({ h: s.h, ice: s.ice, lock: s.lock })),
      moves: st.moves,
      tray: st.tray,
    };
  }

  // 구멍이 위에서 열려 있는가 (덮고 있는 판이 모두 같은 자리에 구멍이 있는가)
  function isOpen(model, st, h) {
    const hole = model.holes[h];
    if (hole.tray) return hole.slot < st.tray;
    for (const c of hole.cover) if (st.alive[c.p] && !c.hole) return false;
    return true;
  }

  // 이 구멍에 나사가 있으면 고정되는 판이 남아 있는가
  function pinsAlive(model, st, h) {
    for (const c of model.holes[h].cover) if (st.alive[c.p] && c.hole) return true;
    return false;
  }

  function keyAlive(model, st) {
    return model.keyPlank >= 0 && !!st.alive[model.keyPlank];
  }

  // 'free' | 'blocked'(다른 판에 가려짐) | 'ice'(얼음) | 'lock'(자물쇠)
  function screwStatus(model, st, sid) {
    const s = st.screws[sid];
    if (!isOpen(model, st, s.h)) return 'blocked';
    if (s.ice && st.moves < s.ice) return 'ice';
    if (s.lock && keyAlive(model, st)) return 'lock';
    return 'free';
  }

  function canPlace(model, st, h) {
    return st.occ[h] === -1 && isOpen(model, st, h);
  }

  // 나사가 하나도 남지 않은 판은 떨어집니다.
  function settle(model, st) {
    const fallen = [];
    model.planks.forEach((p, z) => {
      if (!st.alive[z]) return;
      if (!p.holeIdx.some((h) => st.occ[h] >= 0)) { st.alive[z] = 0; fallen.push(z); }
    });
    return fallen;
  }

  function move(model, st, sid, h) {
    const n = clone(st);
    const s = n.screws[sid];
    n.occ[s.h] = -1;
    s.h = h; s.ice = 0; s.lock = false;
    n.occ[h] = sid;
    n.moves++;
    const fallen = settle(model, n);
    return { state: n, fallen };
  }

  // 도구: 망치 — 판 하나를 바로 부숩니다.
  function smash(model, st, z) {
    const n = clone(st);
    n.alive[z] = 0;
    return { state: n, fallen: [z] };
  }

  function won(st) { return st.alive.every((a) => !a); }

  function legalMoves(model, st) {
    const out = [];
    const targets = [];
    for (let h = 0; h < model.holes.length; h++) if (canPlace(model, st, h)) targets.push(h);
    st.screws.forEach((s, sid) => {
      if (screwStatus(model, st, sid) !== 'free') return;
      for (const h of targets) if (h !== s.h) out.push({ sid, h });
    });
    return out;
  }

  function hasAnyMove(model, st) { return legalMoves(model, st).length > 0; }

  function stateKey(model, st) {
    let k = '';
    for (const a of st.alive) k += a;
    k += '|';
    for (const o of st.occ) k += o >= 0 ? 1 : 0;
    return k + '|' + Math.min(st.moves, model.maxIce) + '|' + st.tray;
  }

  // 탐색용 후보 수: 서로 바꿔도 결과가 같은 수는 하나만 남깁니다.
  function candidateMoves(model, st, rng) {
    const free = [], pin = [];
    for (let h = 0; h < model.holes.length; h++) {
      if (!canPlace(model, st, h)) continue;
      (pinsAlive(model, st, h) ? pin : free).push(h);
    }
    const iceLeft = st.screws.some((s) => s.ice && st.moves < s.ice);
    const moves = [];
    let freeSourceUsed = false;
    st.screws.forEach((s, sid) => {
      if (screwStatus(model, st, sid) !== 'free') return;
      const srcPins = pinsAlive(model, st, s.h);
      if (!srcPins) { if (freeSourceUsed) return; freeSourceUsed = true; }
      const t = free.find((h) => h !== s.h);
      if (t !== undefined && (srcPins || iceLeft)) {
        let falls = 0;
        if (srcPins) {
          for (const c of model.holes[s.h].cover) {
            if (!st.alive[c.p] || !c.hole) continue;
            const others = model.planks[c.p].holeIdx.some((hh) => hh !== s.h && st.occ[hh] >= 0);
            if (!others) falls++;
          }
        }
        moves.push({ sid, h: t, score: falls * 10 + (srcPins ? 5 : 1) + (rng ? rng() : 0) });
      }
      for (const h of pin) if (h !== s.h) moves.push({ sid, h, score: rng ? rng() : 0 });
    });
    moves.sort((a, b) => b.score - a.score);
    return moves;
  }

  /*
   * 깊이 우선 탐색 풀이기
   * status: 'solved'(풀이 찾음) | 'unsolvable'(모든 경우를 확인했지만 불가) | 'unknown'(탐색 한도 초과)
   */
  function solve(model, st0, opts) {
    const limit = (opts && opts.limit) || 200000;
    const rng = opts && opts.rng;
    const seen = new Set([stateKey(model, st0)]);
    const stack = [{ st: st0, moves: null, i: 0, m: null }];
    let nodes = 0;
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (won(top.st)) {
        return { status: 'solved', path: stack.slice(1).map((f) => f.m), nodes };
      }
      if (!top.moves) {
        if (++nodes > limit) return { status: 'unknown', path: null, nodes };
        top.moves = candidateMoves(model, top.st, rng);
      }
      if (top.i >= top.moves.length) { stack.pop(); continue; }
      const m = top.moves[top.i++];
      const ns = move(model, top.st, m.sid, m.h).state;
      const k = stateKey(model, ns);
      if (seen.has(k)) continue;
      seen.add(k);
      stack.push({ st: ns, moves: null, i: 0, m: { sid: m.sid, h: m.h } });
    }
    return { status: 'unsolvable', path: null, nodes };
  }

  // 최소 이동 수와 그 경로(A*). 결과: { moves, path } 또는 탐색 한도 초과 시 null. 고정 중인 나사는 최소 한 번씩 움직여야 하므로 그 개수를 하한으로 씁니다.
  function minMoves(model, st0, limit) {
    const hOf = (st) => st.screws.reduce((n, s) => n + (pinsAlive(model, st, s.h) ? 1 : 0), 0);
    const heap = [];
    const better = (a, b) => a.f < b.f || (a.f === b.f && a.g > b.g);
    const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
    const push = (node) => {
      heap.push(node);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (!better(heap[i], heap[p])) break;
        swap(i, p); i = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i;
          if (l < heap.length && better(heap[l], heap[m])) m = l;
          if (r < heap.length && better(heap[r], heap[m])) m = r;
          if (m === i) break;
          swap(i, m); i = m;
        }
      }
      return top;
    };
    const best = new Map();
    push({ st: st0, g: 0, f: hOf(st0), prev: null, m: null });
    best.set(stateKey(model, st0), 0);
    let nodes = 0;
    while (heap.length) {
      const cur = pop();
      if (won(cur.st)) {
        const path = [];
        for (let n = cur; n.prev; n = n.prev) path.unshift(n.m);
        return { moves: cur.g, path };
      }
      if (++nodes > (limit || 150000)) return null;
      for (const m of candidateMoves(model, cur.st, null)) {
        const ns = move(model, cur.st, m.sid, m.h).state;
        const k = stateKey(model, ns);
        const g = cur.g + 1;
        if (best.has(k) && best.get(k) <= g) continue;
        best.set(k, g);
        push({ st: ns, g, f: g + hOf(ns), prev: cur, m: { sid: m.sid, h: m.h } });
      }
    }
    return null;
  }

  return {
    GRID, MAX_TRAY, gridXY, coveredPoints, buildModel, validate, initialState, clone,
    isOpen, pinsAlive, keyAlive, screwStatus, canPlace, move, smash, won,
    legalMoves, hasAnyMove, stateKey, candidateMoves, solve, minMoves,
  };
});

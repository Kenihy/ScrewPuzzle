/*
 * 언스크류(UNCREW) — 콘텐츠 로딩 검증 (명세 19.3)
 * 문자열·숫자 누락, 미등록 ID, 중복 ID를 찾아 오류 목록으로 돌려줍니다.
 * 콘텐츠 데이터에 없는 조건이나 결과를 만들어 채우지 않습니다.
 */
import { collectRefs } from './conditions.js';

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function validateBoards(boards) {
  const errors = [];
  const ids = new Set();
  for (const b of boards) {
    const where = `board ${b.id}`;
    if (!isStr(b.id)) errors.push(`${where}: id 누락`);
    if (ids.has(b.id)) errors.push(`${where}: 중복 보드 ID`);
    ids.add(b.id);
    if (!isNum(b.moveLimit) || b.moveLimit <= 0) errors.push(`${where}: moveLimit 오류`);
    const holeIds = new Set();
    for (const h of b.holes) {
      if (!isStr(h.id)) errors.push(`${where}: 구멍 id 누락`);
      if (holeIds.has(h.id)) errors.push(`${where}: 중복 구멍 ${h.id}`);
      if (h.id === 'T') errors.push(`${where}: 구멍 ID T는 임시 나사함 전용`);
      holeIds.add(h.id);
      if (!isNum(h.x) || !isNum(h.y)) errors.push(`${where}: 구멍 ${h.id} 좌표 오류`);
      if (h.x < 0 || h.x > b.size[0] || h.y < 0 || h.y > b.size[1]) errors.push(`${where}: 구멍 ${h.id} 보드 밖`);
    }
    if (new Set(b.screws).size !== b.screws.length) errors.push(`${where}: 중복 나사`);
    for (const s of b.screws) if (!holeIds.has(s)) errors.push(`${where}: 미등록 구멍의 나사 ${s}`);
    const plateIds = new Set();
    for (const p of b.plates) {
      if (!isStr(p.id)) errors.push(`${where}: 판 id 누락`);
      if (plateIds.has(p.id)) errors.push(`${where}: 중복 판 ${p.id}`);
      plateIds.add(p.id);
      if (!isNum(p.z)) errors.push(`${where}: 판 ${p.id} z 오류`);
      if (!Array.isArray(p.rect) || p.rect.length !== 4 || !p.rect.every(isNum)) errors.push(`${where}: 판 ${p.id} rect 오류`);
      for (const h of [...p.anchorHoles, ...p.blockedHoles]) {
        if (!holeIds.has(h)) errors.push(`${where}: 판 ${p.id}의 미등록 구멍 ${h}`);
      }
      if (p.anchorHoles.some((h) => p.blockedHoles.includes(h))) errors.push(`${where}: 판 ${p.id} anchor/blocked 중복`);
      if (!p.anchorHoles.some((h) => b.screws.includes(h))) errors.push(`${where}: 판 ${p.id} 시작부터 지지 나사 없음`);
      // rect 안의 등록 구멍은 anchorHoles 또는 blockedHoles에 명시되어야 합니다.
      const [x, y, w, hgt] = p.rect;
      for (const h of b.holes) {
        const inside = h.x >= x && h.x <= x + w && h.y >= y && h.y <= y + hgt;
        if (inside && !p.anchorHoles.includes(h.id) && !p.blockedHoles.includes(h.id)) {
          errors.push(`${where}: 판 ${p.id} 영역 안 구멍 ${h.id} 미분류`);
        }
      }
    }
    for (const mv of b.solution || []) {
      if (!holeIds.has(mv[0]) || !holeIds.has(mv[1])) errors.push(`${where}: 해법에 미등록 구멍 ${mv}`);
    }
  }
  return errors;
}

export function validateContent(content) {
  const { NODES, CLUES, EVIDENCE, TOPICS, DIFFICULTIES, ITEMS, CHARACTERS, ENDINGS, boards } = content;
  const errors = [];
  const nodeIds = new Set(Object.keys(NODES));
  const clueIds = new Set(Object.keys(CLUES));
  const evidenceIds = new Set(Object.keys(EVIDENCE));
  const boardIds = new Set(boards.map((b) => b.id));

  for (const [k, c] of Object.entries(CLUES)) {
    if (c.id !== k) errors.push(`clue ${k}: id 불일치`);
    if (!isStr(c.text)) errors.push(`clue ${k}: text 누락`);
    if (!isNum(c.depth)) errors.push(`clue ${k}: depth 누락`);
    if (c.topic && !TOPICS[c.topic]) errors.push(`clue ${k}: 미등록 주제 ${c.topic}`);
  }
  for (const [k, e] of Object.entries(EVIDENCE)) {
    if (e.id !== k) errors.push(`evidence ${k}: id 불일치`);
    if (!isStr(e.name) || !isStr(e.text)) errors.push(`evidence ${k}: 문자열 누락`);
  }
  for (const [k, t] of Object.entries(TOPICS)) {
    if (t.id !== k) errors.push(`topic ${k}: id 불일치`);
    if (!CHARACTERS[t.target]) errors.push(`topic ${k}: 미등록 인물 ${t.target}`);
    if (!Array.isArray(t.clues) || t.clues.length !== 3) errors.push(`topic ${k}: 단서 3개 필요`);
    t.clues.forEach((cid, i) => {
      if (!clueIds.has(cid)) errors.push(`topic ${k}: 미등록 단서 ${cid}`);
      else if (CLUES[cid].depth !== i + 1) errors.push(`topic ${k}: 단서 ${cid} 깊이 순서 오류`);
    });
    for (const pid of ['A', 'B', 'C', 'D', 'E']) {
      if (!t.plates[pid] || !isStr(t.plates[pid].label) || !isStr(t.plates[pid].fall)) errors.push(`topic ${k}: 판 ${pid} 문구 누락`);
    }
  }
  for (const [k, d] of Object.entries(DIFFICULTIES)) {
    if (!isNum(d.cost) || !isNum(d.depth)) errors.push(`difficulty ${k}: 수치 누락`);
    if (!boardIds.has(d.boardId)) errors.push(`difficulty ${k}: 미등록 보드 ${d.boardId}`);
    for (const [item, n] of Object.entries(d.items)) {
      if (!ITEMS[item]) errors.push(`difficulty ${k}: 미등록 아이템 ${item}`);
      if (!isNum(n)) errors.push(`difficulty ${k}: 아이템 ${item} 수량 오류`);
    }
  }

  const choiceIds = new Set();
  const checkCond = (cond, where) => {
    const refs = collectRefs(cond);
    refs.clues.forEach((c) => clueIds.has(c) || errors.push(`${where}: 미등록 단서 ${c}`));
    refs.evidence.forEach((e) => evidenceIds.has(e) || errors.push(`${where}: 미등록 증거 ${e}`));
    refs.trust.forEach((w) => CHARACTERS[w] || errors.push(`${where}: 미등록 인물 ${w}`));
    refs.unknown.forEach((u) => errors.push(`${where}: 알 수 없는 조건 ${u}`));
  };
  const checkEffects = (fx, where) => {
    if (!fx) return;
    if ('suspicionDelta' in fx && !isNum(fx.suspicionDelta)) errors.push(`${where}: suspicionDelta 숫자 아님`);
    for (const [w, n] of Object.entries(fx.trustDelta || {})) {
      if (!CHARACTERS[w]) errors.push(`${where}: 미등록 인물 ${w}`);
      if (!isNum(n)) errors.push(`${where}: trustDelta 숫자 아님`);
    }
    (fx.grantEvidence || []).forEach((e) => evidenceIds.has(e) || errors.push(`${where}: 미등록 증거 ${e}`));
    (fx.grantClues || []).forEach((c) => clueIds.has(c) || errors.push(`${where}: 미등록 단서 ${c}`));
  };
  const checkLines = (lines, where) => {
    (lines || []).forEach((ln, i) => {
      if (ln.who && !isStr(ln.text)) errors.push(`${where}[${i}]: 대사 text 누락`);
      if (!ln.who && !ln.narr && !ln.card && !ln.fx) errors.push(`${where}[${i}]: 빈 줄`);
    });
  };

  for (const [k, n] of Object.entries(NODES)) {
    if (n.id !== k) errors.push(`node ${k}: id 불일치`);
    if (n.next && !nodeIds.has(n.next)) errors.push(`node ${k}: 미등록 다음 노드 ${n.next}`);
    checkLines(n.lines, `node ${k}.lines`);
    if (n.type === 'dialogue') {
      if (!Array.isArray(n.choices) || n.choices.length === 0) errors.push(`node ${k}: 선택지 없음`);
      for (const c of n.choices || []) {
        const where = `choice ${c.id}`;
        if (!isStr(c.id)) errors.push(`node ${k}: 선택지 id 누락`);
        if (choiceIds.has(c.id)) errors.push(`${where}: 중복 선택지 ID`);
        choiceIds.add(c.id);
        if (!isStr(c.text)) errors.push(`${where}: text 누락`);
        if (c.requires) {
          checkCond(c.requires, where);
          if (!isStr(c.lockHint)) errors.push(`${where}: 잠금 안내 문구 누락`);
        }
        (c.contradictsClues || []).forEach((cid) => clueIds.has(cid) || errors.push(`${where}: 미등록 모순 단서 ${cid}`));
        if (c.relatedClue && !clueIds.has(c.relatedClue)) errors.push(`${where}: 미등록 관련 단서`);
        if (c.outcomes) {
          c.outcomes.forEach((o, i) => {
            checkCond(o.when, `${where}.outcomes[${i}]`);
            checkEffects(o.effects, `${where}.outcomes[${i}]`);
            checkLines(o.reaction, `${where}.outcomes[${i}].reaction`);
          });
          if (c.outcomes[c.outcomes.length - 1].when) errors.push(`${where}: 마지막 결과는 조건 없는 기본값이어야 함`);
        } else {
          if (!c.effects) errors.push(`${where}: effects 누락`);
          checkEffects(c.effects, where);
          checkLines(c.reaction, `${where}.reaction`);
        }
      }
    }
  }
  for (const [k, e] of Object.entries(ENDINGS)) {
    if (e.id !== k) errors.push(`ending ${k}: id 불일치`);
    if (!isStr(e.title) || !isStr(e.tagline)) errors.push(`ending ${k}: 문자열 누락`);
  }

  errors.push(...validateBoards(boards));
  return errors;
}

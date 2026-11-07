/*
 * 언스크류(UNCREW) — 단서가 게임 규칙에서 "어디에 작동하는지" 계산
 *
 * 콘텐츠 데이터(선택지 조건 requires, contradictsClues, relatedClue)를 훑어서
 * 각 기억 단서·확보 증거가 연결된 선택지를 찾습니다. 화면은 이 결과로 '작동' 설명과 ✓/✗ 조건표를 그립니다.
 */
import { NODES, NODE_ORDER } from '../data/case01.js';
import { collectRefs, evaluate } from './conditions.js';

function eachChoice(fn) {
  for (const nodeId of NODE_ORDER) {
    const node = NODES[nodeId];
    for (const c of node.choices || []) fn(node, c);
  }
}

/**
 * 단서(또는 증거)의 작동 위치
 * @returns {{ unlocks: {nodeId, choiceId}[], contradicts: {nodeId, choiceId}[], related: {nodeId, choiceId}[] }}
 */
export function clueUsage(id, { evidence = false } = {}) {
  const unlocks = [];
  const contradicts = [];
  const related = [];
  eachChoice((node, c) => {
    if (c.requires) {
      const refs = collectRefs(c.requires);
      if ((evidence ? refs.evidence : refs.clues).includes(id)) unlocks.push({ nodeId: node.id, choiceId: c.id });
    }
    if (!evidence && (c.contradictsClues || []).includes(id)) contradicts.push({ nodeId: node.id, choiceId: c.id });
    if (!evidence && c.relatedClue === id) related.push({ nodeId: node.id, choiceId: c.id });
  });
  return { unlocks, contradicts, related };
}

/**
 * 조건을 화면에 그리기 좋은 트리로 바꿉니다. 각 잎에는 지금 충족 여부(ok)가 붙습니다.
 *   { op: 'all'|'any', items: [...] } 또는 { leaf: { clue|evidence|trust... }, ok }
 */
export function requirementTree(cond, run) {
  if (!cond) return null;
  if (cond.all) return { op: 'all', ok: evaluate(cond, run), items: cond.all.map((c) => requirementTree(c, run)) };
  if (cond.any) return { op: 'any', ok: evaluate(cond, run), items: cond.any.map((c) => requirementTree(c, run)) };
  return { leaf: cond, ok: evaluate(cond, run) };
}

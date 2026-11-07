/*
 * 언스크류(UNCREW) — 대사 기록(백로그)
 *
 * 저장된 진행 상태(지나온 노드, 고른 선택지와 결과)만으로 지금까지 화면에 나온 대사를 다시 만듭니다.
 * 대사 원문을 저장 데이터에 따로 쌓지 않으므로 저장 용량이 늘지 않고, 새로고침 뒤에도 같은 기록이 나옵니다.
 *
 * 항목 형식
 *   { kind: 'scene', nodeId }                       장면 구분
 *   { kind: 'line', line, nodeId }                  대본 한 줄 (who/narr/card/fx 그대로)
 *   { kind: 'choice', nodeId, choiceId, record }    내가 고른 대답 (record: 수치 변화 포함)
 */
import { NODES, NODE_ORDER, BAND_LINES, REMOVAL_LINES } from '../data/case01.js';

const TALK_TYPES = ['scene', 'dialogue'];

function reactionLines(node, record) {
  const choice = node.choices.find((c) => c.id === record.choiceId);
  if (!choice) return [];
  if (record.removed) return REMOVAL_LINES;
  const outcome = choice.outcomes ? choice.outcomes.find((o) => o.id === record.outcomeId) : { reaction: choice.reaction };
  const lines = [...(outcome?.reaction || [])];
  if (record.bandEntered && BAND_LINES[record.bandEntered]) lines.push(...BAND_LINES[record.bandEntered]);
  return lines;
}

/**
 * @param run      RunState
 * @param progress 현재 화면에서 몇 번째 줄까지 보였는지 (0부터). 지금 장면은 그 줄까지만 넣습니다.
 */
export function buildTranscript(run, { lineIdx = Infinity } = {}) {
  if (!run) return [];
  const out = [];
  const pr = run.pendingReaction;
  // 반응을 보여 주는 중이면, 지금 위치는 반응이 속한 노드입니다. (run.nodeId는 이미 다음 노드)
  const currentId = pr ? pr.nodeId : run.nodeId;
  const startIdx = Math.max(0, NODE_ORDER.indexOf(run.startNode || 'PROLOGUE'));
  // 제거로 끝났다면 그 뒤 장면은 보지 못했으므로 넣지 않습니다.
  const removedAt = run.result?.endingId === 'END_REMOVED' ? run.result.cause?.nodeId : null;
  const curIdx = removedAt ? NODE_ORDER.indexOf(removedAt) : NODE_ORDER.indexOf(currentId);

  for (let i = startIdx; i < NODE_ORDER.length && i <= curIdx; i++) {
    const node = NODES[NODE_ORDER[i]];
    if (!TALK_TYPES.includes(node.type)) continue;
    const isCurrent = i === curIdx && (!removedAt || !!pr);
    const record = run.choices?.[node.id];
    const lines = node.lines || [];
    // 지금 장면의 본문을 읽는 중이면 보인 줄까지만
    const bodyCount = isCurrent && !pr ? Math.min(lines.length, lineIdx + 1) : lines.length;
    if (bodyCount <= 0) continue;
    out.push({ kind: 'scene', nodeId: node.id });
    for (let k = 0; k < bodyCount; k++) out.push({ kind: 'line', line: lines[k], nodeId: node.id });
    if (node.type === 'dialogue' && record && (!isCurrent || pr)) {
      out.push({ kind: 'choice', nodeId: node.id, choiceId: record.choiceId, record });
      const rx = reactionLines(node, record);
      // 첫 줄(0번)은 화면에서 내가 고른 대답을 말하는 줄이므로, 반응 대사는 1번부터 셉니다.
      const rxCount = isCurrent && pr ? Math.max(0, Math.min(rx.length, lineIdx)) : rx.length;
      for (let k = 0; k < rxCount; k++) out.push({ kind: 'line', line: rx[k], nodeId: node.id });
    }
  }
  return out;
}

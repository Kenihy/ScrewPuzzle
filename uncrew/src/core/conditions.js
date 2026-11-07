/*
 * 언스크류(UNCREW) — 구조화된 조건 평가기 (명세 19.3)
 *
 * 문자열 eval을 쓰지 않습니다. 지원하는 조건:
 *   { all: [조건...] }                 모두 참
 *   { any: [조건...] }                 하나 이상 참
 *   { not: 조건 }                      거짓이면 참
 *   { clue: 'C_HA_1' }                 이번 시도에서 확보한 기억 단서
 *   { evidence: 'DOC_LIST' }           이번 시도에서 확보한 실물 증거
 *   { flag: 'F_X', equals: true }      플래그 값 (equals 생략 시 true)
 *   { trustAtLeast: { HAERIN: 45 } }   인물 신뢰도 하한
 *   { suspicionAtLeast: 70 } / { suspicionAtMost: 35 }
 *
 * 지난 시도 도감(MetaState)은 절대 참조하지 않습니다. 이번 RunState만 봅니다.
 */

export const CONDITION_KEYS = ['all', 'any', 'not', 'clue', 'evidence', 'flag', 'trustAtLeast', 'suspicionAtLeast', 'suspicionAtMost'];

export function evaluate(cond, run) {
  if (cond == null) return true;
  const keys = Object.keys(cond).filter((k) => k !== 'equals');
  if (keys.length !== 1) throw new Error(`조건 형식 오류: ${JSON.stringify(cond)}`);
  const key = keys[0];
  switch (key) {
    case 'all':
      return cond.all.every((c) => evaluate(c, run));
    case 'any':
      return cond.any.some((c) => evaluate(c, run));
    case 'not':
      return !evaluate(cond.not, run);
    case 'clue':
      return run.clues.includes(cond.clue);
    case 'evidence':
      return run.evidence.includes(cond.evidence);
    case 'flag': {
      const expected = 'equals' in cond ? cond.equals : true;
      return (run.flags[cond.flag] ?? false) === expected;
    }
    case 'trustAtLeast':
      return Object.entries(cond.trustAtLeast).every(([who, v]) => (run.trust[who] ?? 0) >= v);
    case 'suspicionAtLeast':
      return run.suspicion >= cond.suspicionAtLeast;
    case 'suspicionAtMost':
      return run.suspicion <= cond.suspicionAtMost;
    default:
      throw new Error(`알 수 없는 조건: ${key}`);
  }
}

/** 조건이 참조하는 ID를 모읍니다. 콘텐츠 검증용. */
export function collectRefs(cond, out = { clues: [], evidence: [], flags: [], trust: [], unknown: [] }) {
  if (cond == null) return out;
  for (const [k, v] of Object.entries(cond)) {
    if (k === 'equals') continue;
    if (k === 'all' || k === 'any') {
      if (!Array.isArray(v)) out.unknown.push(`${k} must be array`);
      else v.forEach((c) => collectRefs(c, out));
    } else if (k === 'not') collectRefs(v, out);
    else if (k === 'clue') out.clues.push(v);
    else if (k === 'evidence') out.evidence.push(v);
    else if (k === 'flag') out.flags.push(v);
    else if (k === 'trustAtLeast') {
      for (const [who, n] of Object.entries(v)) {
        out.trust.push(who);
        if (typeof n !== 'number') out.unknown.push(`trustAtLeast.${who} must be number`);
      }
    } else if (k === 'suspicionAtLeast' || k === 'suspicionAtMost') {
      if (typeof v !== 'number') out.unknown.push(`${k} must be number`);
    } else out.unknown.push(k);
  }
  return out;
}

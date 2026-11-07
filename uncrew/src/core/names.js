/*
 * 언스크류(UNCREW) — 주인공 이름 규칙과 한국어 조사 처리
 *
 * 이름 규칙은 현재 등장인물 구성(모두 성 1자 + 이름 2자, 회장 일가는 차씨)과
 * 대사 형태("{이름}아", "{성} 실장님", "{성명}.")가 자연스럽게 읽히도록 정했습니다.
 *   - 한글 완성형 글자만 (자모 단독·영문·숫자·공백·기호 불가)
 *   - 성: 1자, 또는 널리 쓰이는 복성 2자(남궁·황보·제갈 등)
 *   - 이름: 2자 ("민호야", "도윤아"처럼 부를 때 어색하지 않은 길이)
 *   - 성 '차' 불가: 회장 일가(차태건·차유라·차도혁)와 혈연으로 읽힙니다.
 *   - 다른 등장인물과 같은 이름(성명 또는 이름 2자) 불가: 대사에서 누구를 부르는지 헷갈립니다.
 *   - 호칭·직함·대명사로 읽히는 이름, 비속어 불가
 *
 * 대본 안의 이름 자리 표시
 *   {name} 이름 · {surname} 성 · {fullname} 성명
 *   {name:아} 처럼 조사를 붙이면 받침에 맞춰 바꿉니다. (아/야, 이/가, 은/는, 을/를, 과/와, 으로/로, 이랑/랑, 이에요/예요)
 */

export const DEFAULT_PLAYER = { surname: '한', given: '도윤' };

export const COMPOUND_SURNAMES = ['남궁', '황보', '제갈', '선우', '독고', '사공', '서문', '동방'];

export const BLOCKED_SURNAMES = { 차: '차씨는 회장 일가의 성이라 혈연으로 읽힙니다. 다른 성을 골라 주세요.' };

/** 다른 등장인물 (명세 4장) */
export const CAST_NAMES = [
  ['차', '태건'],
  ['서', '해린'],
  ['차', '유라'],
  ['윤', '서진'],
  ['백', '리아'],
  ['차', '도혁'],
  ['권', '무진'],
];

/** 호칭·직함·대명사로 읽혀 대사가 어색해지는 이름 */
export const RESERVED_GIVEN = ['회장', '실장', '사장', '부장', '과장', '대리', '비서', '보안', '본부', '임원', '직원', '당신', '자네', '우리', '저희', '누구', '아무', '그대', '이름', '주인', '선생', '아빠', '엄마'];

const PROFANITY = ['시발', '씨발', '씨빨', '병신', '븅신', '개새', '새끼', '좆', '존나', '지랄', '미친', '닥쳐', '꺼져', '섹스', '창녀', '걸레', '애미', '애비', '느금'];

const HANGUL_RE = /^[가-힣]+$/;

export const NAME_RULE_TEXT = '한글만 · 성 1자(남궁·황보 같은 복성은 2자) · 이름 2자';

/**
 * 이름 검사. 공백은 앞뒤만 정리하고, 중간 공백은 오류로 봅니다.
 * @returns {{ ok: boolean, errors: string[], player: {surname, given} }}
 */
export function validatePlayerName(input) {
  const surname = String(input?.surname ?? '').trim();
  const given = String(input?.given ?? '').trim();
  const errors = [];
  const player = { surname, given };

  if (!surname) errors.push('성을 입력해 주세요.');
  else if (!HANGUL_RE.test(surname)) errors.push('성은 완성된 한글만 쓸 수 있습니다.');
  else if (surname.length > 2) errors.push('성은 1자, 복성은 2자까지입니다.');
  else if (surname.length === 2 && !COMPOUND_SURNAMES.includes(surname)) errors.push(`2자 성은 복성(${COMPOUND_SURNAMES.slice(0, 5).join('·')} 등)만 쓸 수 있습니다.`);
  else if (BLOCKED_SURNAMES[surname]) errors.push(BLOCKED_SURNAMES[surname]);

  if (!given) errors.push('이름을 입력해 주세요.');
  else if (!HANGUL_RE.test(given)) errors.push('이름은 완성된 한글만 쓸 수 있습니다.');
  else if (given.length !== 2) errors.push('이름은 2자로 입력해 주세요.');
  else if (CAST_NAMES.some(([, g]) => g === given)) errors.push('다른 등장인물과 같은 이름이라 대사에서 헷갈립니다.');
  else if (RESERVED_GIVEN.includes(given)) errors.push('호칭이나 직함으로 읽히는 이름은 쓸 수 없습니다.');

  const full = surname + given;
  if (surname && given && PROFANITY.some((w) => full.includes(w))) errors.push('쓸 수 없는 표현이 들어 있습니다.');

  return { ok: errors.length === 0, errors, player };
}

/* ------------------------------ 조사 ------------------------------ */

export function hasBatchim(word) {
  const ch = String(word).slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

function hasRieulBatchim(word) {
  const code = String(word).slice(-1).charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 === 8;
}

/** 받침이 있을 때의 형태를 키로 씁니다. */
export const JOSA = {
  아: ['아', '야'],
  이: ['이', '가'],
  은: ['은', '는'],
  을: ['을', '를'],
  과: ['과', '와'],
  으로: ['으로', '로'],
  이랑: ['이랑', '랑'],
  이에요: ['이에요', '예요'],
};

export function josa(word, key) {
  const pair = JOSA[key];
  if (!pair) throw new Error(`알 수 없는 조사: ${key}`);
  if (key === '으로' && hasRieulBatchim(word)) return '로';
  return hasBatchim(word) ? pair[0] : pair[1];
}

/* ------------------------------ 대본 치환 ------------------------------ */

export const TOKEN_RE = /\{(name|surname|fullname)(?::([가-힣]+))?\}/g;
const ANY_BRACE_RE = /\{[^}]*\}/g;

export function playerParts(player) {
  const p = player || DEFAULT_PLAYER;
  return { name: p.given, surname: p.surname, fullname: p.surname + p.given };
}

/** 대본의 이름 자리 표시를 실제 이름으로 바꿉니다. */
export function formatText(text, player) {
  if (!text || !String(text).includes('{')) return text;
  const parts = playerParts(player);
  return String(text).replace(TOKEN_RE, (_m, key, j) => {
    const word = parts[key];
    return j ? word + josa(word, j) : word;
  });
}

/** 콘텐츠 검증용: 지원하지 않는 자리 표시 목록 */
export function invalidTokens(text) {
  const bad = [];
  for (const m of String(text ?? '').match(ANY_BRACE_RE) || []) {
    const re = /^\{(name|surname|fullname)(?::([가-힣]+))?\}$/;
    const mm = m.match(re);
    if (!mm || (mm[2] && !JOSA[mm[2]])) bad.push(m);
  }
  return bad;
}

export function hasTokens(text) {
  return /\{(name|surname|fullname)/.test(String(text ?? ''));
}

/*
 * 언스크류(UNCREW) — 게임 규칙 수치 (명세 11~13장)
 * 수치는 테스트 후 조정할 수 있도록 한곳에 모았습니다.
 */

export const SCHEMA_VERSION = 2; // 2: 주인공 이름(run.player) 추가
export const PROJECT = { title: '언스크류', titleEn: 'UNCREW', copy: '풀수록, 더 깊이 얽힌다.' };

export const INITIAL_RUN = {
  suspicion: 20,
  trust: { HAERIN: 50 },
  focus: 4,
  daysRemaining: 30,
};

export const ITEM_IDS = ['undo', 'temp_hole', 'magnifier', 'rehearsal'];

export const ITEMS = {
  undo: {
    id: 'undo',
    name: '되감기 도구',
    short: '되감기',
    desc: '직전 이동 하나를 되돌립니다. 떨어진 판과 이동 횟수도 함께 돌아옵니다.',
    context: 'puzzle',
  },
  temp_hole: {
    id: 'temp_hole',
    name: '임시 나사함',
    short: '임시 나사함',
    desc: '보드 밖에 언제나 쓸 수 있는 빈 구멍 하나를 추가합니다. 보드당 한 번 쓸 수 있고, 사용하면 그때까지의 되감기 기록이 지워집니다.',
    context: 'puzzle',
  },
  magnifier: {
    id: 'magnifier',
    name: '기억 돋보기',
    short: '돋보기',
    desc: '가진 기억 단서와 모순되는 선택지 하나를 표시합니다. 표시할 대상이 있을 때만 소모됩니다.',
    context: 'dialogue',
  },
  rehearsal: {
    id: 'rehearsal',
    name: '대화 리허설',
    short: '리허설',
    desc: '고른 선택지 하나가 의심도를 올릴지, 유지할지, 내릴지 미리 봅니다. 정확한 수치는 알려 주지 않습니다.',
    context: 'dialogue',
  },
};

export const DEPTH_LABEL = { 1: '표면', 2: '중층', 3: '심층' };

/** 기억 단서의 깊이 (명세 7장) */
export const DEPTH_INFO = {
  1: { label: '표면', desc: '상대가 겉으로 내세우는 명분, 이미 알고 있는 사실' },
  2: { label: '중층', desc: '상대가 감추고 있는 행동과 구체적인 기억' },
  3: { label: '심층', desc: '그 행동을 선택하게 만든 욕망과 두려움, 숨은 전제' },
};

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: '쉬움',
    cost: 1,
    depth: 1,
    clueText: '표면 단서 1개',
    items: { undo: 1 },
    boardId: 'SCREW_EASY_01',
  },
  normal: {
    id: 'normal',
    name: '보통',
    cost: 2,
    depth: 2,
    clueText: '표면·중층 단서 2개',
    items: { undo: 1, temp_hole: 1 },
    boardId: 'SCREW_NORMAL_01',
  },
  hard: {
    id: 'hard',
    name: '어려움',
    cost: 4,
    depth: 3,
    clueText: '표면·중층·심층 단서 3개',
    items: { temp_hole: 1, magnifier: 1, rehearsal: 1 },
    boardId: 'SCREW_HARD_01',
  },
};

export const SUSPICION_BANDS = [
  { id: 'normal', min: 0, max: 39, label: '정상 업무', icon: 'dot' },
  { id: 'watched', min: 40, max: 69, label: '관찰 대상', icon: 'eye' },
  { id: 'review', min: 70, max: 99, label: '제거 검토', icon: 'warn' },
  { id: 'removed', min: 100, max: 100, label: '제거 결정', icon: 'x' },
];

export function suspicionBand(value) {
  return SUSPICION_BANDS.find((b) => value >= b.min && value <= b.max) || SUSPICION_BANDS[0];
}

export function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

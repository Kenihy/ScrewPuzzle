/*
 * 언스크류(UNCREW) — 첫 사건 데이터: 어제의 전달 목록 (CASE_01, D-30)
 *
 * 대본 줄 형식
 *   { who: 'HAERIN', text }            인물 대사
 *   { who: 'DOYUN', mono: true, text } 주인공의 속마음 (이름을 떠올리기 전에는 '나'로 표시)
 *   { who: 'HAERIN', inner: true, text } 능력으로 들은 다른 인물의 속마음
 *   { card, sub, list }                화면 중앙 카드 (list가 있으면 목록 카드)
 *   {name} {surname} {fullname}        주인공 이름 자리 표시. {name:아}처럼 조사를 붙일 수 있습니다. (core/names.js)
 *   { narr }                           지문
 *   { card, sub }                      화면 중앙 카드 (예: D-30)
 *   { fx: 'blackout' }                 암전
 *   stage: { loc, cast, seal, door }   이 줄부터 바뀌는 무대 상태
 *   sfx: 'thud' | 'heartbeat' | 'chime' | 'danger' | 'tick'
 *
 * 선택지 효과
 *   effects: { suspicionDelta, trustDelta: { HAERIN }, setFlags, grantEvidence, grantClues }
 *   outcomes: [{ when, effects, reaction }]  조건에 따라 결과가 갈리는 선택지 (첫 번째로 맞는 결과 적용)
 *   requires: 조건 (conditions.js 형식). 충족하지 못하면 잠긴 선택지로 표시하고 lockHint를 보여 줍니다.
 *   contradictsClues: 기억 돋보기가 비교하는 단서 목록
 */

export const CASE_ID = 'CASE_01';

export const CASE_INFO = {
  id: CASE_ID,
  title: '어제의 전달 목록',
  day: 'D-30',
  question: '회장은 왜 외부 변호사에게 전달된 문서의 범위에 집착하는가?',
};

export const CHARACTERS = {
  DOYUN: { id: 'DOYUN', name: '{fullname}', short: '{name}', age: 35, role: '태경그룹 회장실 해결사', note: '주먹 대신 서류와 소문, 타이밍으로 문제를 지워 온 회장실의 해결사. 그룹 안에서는 ‘회장실 청소부’라는 소문으로 통했다. 모든 판을 안다고 믿었지만, 자신을 겨눈 판은 보지 못했고 첫 번째 삶에서 횡령범으로 조작된 채 제거됐다.' },
  TAEGEON: { id: 'TAEGEON', name: '차태건', short: '차태건', age: 59, role: '태경그룹 회장', note: '가난하던 {name}에게 일자리와 기회를 준 사람. 사소한 취향과 가족 사정까지 기억한다.' },
  HAERIN: { id: 'HAERIN', name: '서해린', short: '서해린', age: 37, role: '회장 비서실장', note: '흐트러짐 없는 업무와 절제된 태도. 회장실의 모든 일정과 문서가 그녀를 거친다.' },
  MUJIN: { id: 'MUJIN', name: '권무진', short: '권무진', age: 45, role: '보안실장', note: '예의 바르고 조용하다. 첫 번째 삶의 마지막 밤, 주차장에서 기다리던 사람.' },
  SEOJIN: { id: 'SEOJIN', name: '윤서진', short: '윤 변호사', age: 34, role: '외부 변호사', note: '어제 {name:이} 재단 결산 자료를 전달한 상대. 이번 사건에는 직접 등장하지 않는다.' },
};

export const SPEAKER_LABEL = {
  DOYUN: '나', // 이름을 떠올린 뒤에는 입력한 이름으로 표시합니다.
  TAEGEON: '차태건',
  TAEGEON_ECHO: '차태건 · 기억 속 목소리',
  HAERIN: '서해린',
  MUJIN: '권무진',
};

/* ------------------------------------------------------------------ */
/* 기억 단서 · 실물 증거                                                */
/* ------------------------------------------------------------------ */

export const CLUES = {
  C_HA_1: { id: 'C_HA_1', topic: 'HA', who: 'HAERIN', depth: 1, text: '회장은 {name:과} 윤서진이 만났다는 사실을 이미 알고 있다.', use: '회장 앞에서 ‘만나지 않았다’고 하면 거짓말이 바로 드러난다. 만남 자체는 인정하는 편이 안전하다.' },
  C_HA_2: { id: 'C_HA_2', topic: 'HA', who: 'HAERIN', depth: 2, text: '보안실장은 이번 점검 결과를 회장에게 직접 보고한다.', use: '이 방에서 한 말과 태도는 보안실장을 거쳐 회장에게 그대로 올라간다. 날 선 말은 기록으로 남는다고 보는 게 좋다.' },
  C_HA_3: { id: 'C_HA_3', topic: 'HA', who: 'HAERIN', depth: 3, text: '{name}의 출입 기록이 다른 직원들과 분리되어 보존되고 있다.', use: '누군가 내 동선을 따로 모으고 있다. 이번 사건 다음으로 이어지는 실마리다.' },
  C_HB_1: { id: 'C_HB_1', topic: 'HB', who: 'HAERIN', depth: 1, text: '서해린은 자료 전달 목록을 보관하고 있다.', use: '전달 목록은 서해린에게 있다. 신뢰가 충분하면 조사를 마친 뒤 실물 사본으로 받을 수 있다.' },
  C_HB_2: { id: 'C_HB_2', topic: 'HB', who: 'HAERIN', depth: 2, text: '실제 전달 목록에는 재단 결산 자료 3건이 적혀 있다.', use: '업무 서류를 넘긴 사실은 이미 확인된다. ‘개인적인 만남’이었다는 변명은 앞뒤가 맞지 않는다.' },
  C_HB_3: { id: 'C_HB_3', topic: 'HB', who: 'HAERIN', depth: 3, text: '서해린은 해외 송금 전표의 사본을 전달 목록에서 제외했다.', use: '서해린은 문제의 전표를 일부러 목록에서 뺐다. 그녀가 나를 완전히 버린 것은 아닐지도 모른다.' },
  C_BA_1: { id: 'C_BA_1', topic: 'BA', who: 'TAEGEON', depth: 1, text: '회장은 만남 자체보다 외부에 전달된 문서의 범위를 걱정한다.', use: '회장이 묻는 핵심은 누구를 만났느냐가 아니라 무엇을 넘겼느냐다. 전달한 범위를 분명히 말하는 대답이 안전하다.' },
  C_BA_2: { id: 'C_BA_2', topic: 'BA', who: 'TAEGEON', depth: 2, text: '회장이 가장 신경 쓰는 문서는 특정 해외 송금 전표다.', use: '문제의 문서는 해외 송금 전표다. 내가 먼저 그 이름을 꺼내면, 알고 있다는 사실이 드러난다.' },
  C_BA_3: { id: 'C_BA_3', topic: 'BA', who: 'TAEGEON', depth: 3, text: '회장은 {name:이} 해당 전표의 중요성을 아직 모른다고 믿는다.', use: '회장은 내가 전표의 의미를 모른다고 믿는다. 그 믿음을 지켜 주면서 기록을 남기자고 제안할 수 있다.' },
  C_BB_1: { id: 'C_BB_1', topic: 'BB', who: 'TAEGEON', depth: 1, text: '이번 질문에는 사실 확인과 {name}의 반응 확인이 함께 들어 있다.', use: '회장은 대답의 내용만큼 태도를 본다. 되묻거나 날을 세우면 내용과 상관없이 의심이 커진다.' },
  C_BB_2: { id: 'C_BB_2', topic: 'BB', who: 'TAEGEON', depth: 2, text: '자료 처리의 승인 절차와 기록을 명확히 하면 회장의 우려를 줄일 수 있다.', use: '결재 절차와 기록을 앞세우는 대답은 회장의 걱정을 덜어 준다. 실물 목록과 함께라면 더 확실하다.' },
  C_BB_3: { id: 'C_BB_3', topic: 'BB', who: 'TAEGEON', depth: 3, text: '회장은 보안실장을 가까운 곳에 대기시켜 두었다.', use: '회장은 이미 최악의 경우를 준비해 두었다. 이 대화에서의 실수는 곧바로 끝으로 이어질 수 있다.' },
  C_CASE_01_END: {
    id: 'C_CASE_01_END',
    topic: null,
    who: 'DOYUN',
    depth: 0,
    kind: 'case',
    text: '나의 업무 기록이 별도 보존되고 있다. 단순한 자료 확인이 아니다.',
    reconfirmText: '별도 보존 사실이 다시 확인되었다. 단순한 자료 확인이 아니다.',
    use: '내 기록을 따로 모으는 누군가가 있다. 다음 사건으로 이어지는 핵심 실마리다.',
  },
};

export const EVIDENCE = {
  DOC_LIST: {
    id: 'DOC_LIST',
    name: '어제 전달 목록 (사본)',
    text: '태경재단 결산 요약 / 지출 증빙 목록 / 외부 검토 요청서. 총 3건.',
    note: '해외 송금 전표는 목록에 없다. 이번 전달의 범위를 증명할 뿐, 지난 십 년의 일을 증명해 주지는 않는다.',
  },
};

/* ------------------------------------------------------------------ */
/* 조사 주제 (명세 15장)                                                */
/* 판 제거 문구는 분위기용입니다. 단서는 퍼즐을 모두 풀었을 때만 확정됩니다. */
/* 낮은 난이도에서 더 깊은 단서가 새지 않도록 문구에 단서 내용을 넣지 않습니다. */
/* ------------------------------------------------------------------ */

export const TOPICS = {
  HA: {
    id: 'HA',
    target: 'HAERIN',
    title: '바뀐 일정',
    teaser: '오늘 아침, 그녀가 고쳐 놓은 일정표',
    symbol: 'mask',
    clues: ['C_HA_1', 'C_HA_2', 'C_HA_3'],
    fragment: '서해린의 기억. 어젯밤 늦게 고친 일정표에 수정 기록이 몇 겹으로 쌓여 있다. 그녀는 한 이름을 입력했다가 지우기를 반복한다.',
    plates: {
      A: { label: '일정표', fall: '지운 일정 위로 새로 잡힌 시간이 겹쳐 보인다.' },
      B: { label: '서랍', fall: '열쇠를 돌리는 손끝이 아주 조금 떨린다.' },
      C: { label: '거울', fall: '엘리베이터 거울 앞에서 미소를 고쳐 짓는 얼굴.' },
      D: { label: '메일함', fall: '읽고도 답하지 않은 메일 한 통이 맨 위에 남아 있다.' },
      E: { label: '닫힌 문', fall: '문 너머에서 누군가 낮은 목소리로 내 이름을 말한다.' },
    },
  },
  HB: {
    id: 'HB',
    target: 'HAERIN',
    title: '전달한 문서',
    teaser: '그녀가 품에 안은 서류철',
    symbol: 'mask',
    clues: ['C_HB_1', 'C_HB_2', 'C_HB_3'],
    fragment: '서해린의 기억. 서류철을 닫기 직전, 그녀의 손이 한 번 멈춘다. 종이 모서리를 맞추는 소리만 길게 남는다.',
    plates: {
      A: { label: '서류철', fall: '모서리를 맞춰 정리하는 오래된 습관.' },
      B: { label: '복사기', fall: '복사기의 낮은 기계음과 따뜻한 종이 냄새.' },
      C: { label: '전자서명', fall: '서명 칸 위에서 멈춘 손끝.' },
      D: { label: '보안메일', fall: '보내기 버튼 앞에서 한 번 더 수신자를 확인하는 손.' },
      E: { label: '빈 책상', fall: '모두 퇴근한 사무실, 모니터 불빛 하나.' },
    },
  },
  BA: {
    id: 'BA',
    target: 'TAEGEON',
    title: '질문의 목적',
    teaser: '그가 정말 묻고 싶은 것',
    symbol: 'contract',
    clues: ['C_BA_1', 'C_BA_2', 'C_BA_3'],
    fragment: '차태건의 기억. 늦은 밤 서재, 그는 휴대폰 메모에 같은 질문을 세 번 고쳐 적는다. 마지막 문장만 남기고 나머지를 지운다.',
    plates: {
      A: { label: '미소', fall: '웃고 있지만, 눈은 웃지 않는다.' },
      B: { label: '메모', fall: '질문을 고르는 짧은 침묵.' },
      C: { label: '가족사진', fall: '어린 남매가 웃는 오래된 사진 한 장.' },
      D: { label: '식탁', fall: '가족 식탁의 대화가 갑자기 끊긴다.' },
      E: { label: '금고', fall: '비밀번호를 누르다 멈춘 손.' },
    },
  },
  BB: {
    id: 'BB',
    target: 'TAEGEON',
    title: '허용된 보고',
    teaser: '그가 듣고 싶은 대답의 모양',
    symbol: 'contract',
    clues: ['C_BB_1', 'C_BB_2', 'C_BB_3'],
    fragment: '차태건의 기억. 오래전, 아직 젊은 {name:이} 처음 보고서를 들고 왔던 날. 그는 그때도 내용보다 손을 먼저 보았다.',
    plates: {
      A: { label: '목소리', fall: '“너도 좀 쉬어야지.” 같은 다정함.' },
      B: { label: '결재', fall: '아직 승인되지 않은 결재 문서 하나.' },
      C: { label: '보고서', fall: '정해진 순서대로만 읽히는 문장들.' },
      D: { label: '창밖', fall: '도시를 내려다보는 사람의 오래된 습관.' },
      E: { label: '찻잔', fall: '손대지 않은 차가 천천히 식어 간다.' },
    },
  },
};

export const TOPIC_ORDER = ['HA', 'HB', 'BA', 'BB'];

/* ------------------------------------------------------------------ */
/* 이야기 상황 요약 — 각성 장면의 목표 카드와 노트의 '상황' 탭에서 씁니다.   */
/* ------------------------------------------------------------------ */

export const LIFE_GOALS = [
  '회장의 첫 호출에서 의심받지 않고 살아남는다',
  '내 이름으로 쌓이고 있는 기록의 실체를 찾는다',
  '나를 지켜 줄 실물 기록과 내 편을 확보한다',
  '누가, 왜 나를 죽였는지 밝혀낸다',
];

export const SITUATION = {
  firstLife: [
    { when: '십 년 전', text: '가난과 어머니의 병원비에 짓눌리던 나에게 차태건 회장이 회장실 일을 맡겼다. 병원비는 그때부터 회장 비서실 이름으로 결제되고 있다.' },
    { when: '십 년 동안', text: '주먹 대신 서류와 소문, 타이밍으로 회장 일가의 사고와 추문을 지웠다. 그룹 안에서는 ‘회장실 청소부’라는 소문으로 통했다. 보고서 문장 하나로 누군가를 감옥에 보낸 적도 있다.' },
    { when: '올해 봄', text: '회장이 아들 차도혁 사장에게 그룹을 넘기는 승계 작업을 시작했다. 자금 이동과 해외 법인 정리의 실무를 내가 맡았다.' },
    { when: 'D-30', text: '회장이 외부 변호사(윤서진)에게 넘긴 서류를 물었다. 첫 번째 삶에서는 이 질문에 대수롭지 않게 대답했다.' },
    { when: 'D-29 이후', text: '계좌 위임장, 출장 명의, 송금 승인서가 내 앞으로만 모였다. 감사가 시작되고 사람들이 나를 피했다. 나는 그것을 신뢰의 표시라고 잘못 읽었다.' },
    { when: 'D-Day', text: '승계 작업이 끝난 밤, 지하 주차장에서 내 전자서명이 남은 횡령 서류와 함께 보안실장 권무진에게 제거되었다.' },
  ],
  now: [
    '내 명의로 처리된 거래와 문서는 이미 존재한다. 도망치면 횡령범이자 배신자가 되고, 어머니의 병원비도 끊긴다.',
    '시키는 대로 움직이면 30일 뒤 같은 방식으로 죽는다.',
    '너무 많이 알고 있어서 제거됐다는 것만 안다. 정확히 무엇 때문인지는 짐작뿐이다. 승계 자금의 흐름일 수도, 십 년 동안 덮어 준 일들 중 하나일 수도 있다.',
    '누가 나를 죽이기로 했는지 아직 모른다. 회장, 후계자 차도혁, 회장실 안의 누군가 모두 가능성이 있다.',
  ],
  way: [
    '모든 것을 안다고 믿었던 자만이 나를 죽였다. 이번에는 모른다는 사실에서 시작한다.',
    '의심받지 않는다. 능력으로 알아낸 것을 아는 티를 내는 순간 끝이다.',
    '실물 기록을 확보한다. 기억으로 읽은 내용은 판단의 근거일 뿐, 증거로 내밀 수 있는 건 손에 쥔 서류뿐이다.',
    '혼자 버티지 않는다. 이해관계가 맞는 사람을 찾아 내 편으로 만든다.',
  ],
  caseGoal: {
    title: 'D-30 · 어제의 전달 목록',
    goal: '회장의 질문을 넘기고, 나를 향한 기록 수집의 실마리를 잡는다.',
    steps: [
      '멈춘 시간에서 서해린과 회장의 기억을 해체해 기억 단서를 얻는다. (집중력 4 안에서 주제와 난이도를 고른다)',
      '조사를 마치면 서해린에게 전달 목록 사본을 받아 실물 증거로 확보할 수 있다. (서해린의 신뢰가 필요하다)',
      '회장 대면 3번의 질문에 단서를 근거로 대답한다. 의심도가 100이 되면 그 자리에서 끝난다.',
    ],
  },
};

/* ------------------------------------------------------------------ */
/* 장면(노드)                                                            */
/* ------------------------------------------------------------------ */

const PROLOGUE = {
  id: 'PROLOGUE',
  type: 'scene',
  next: 'RETURN',
  skippable: true,
  stage: { loc: 'archive', cast: [] },
  // 주인공은 아직 자기 이름을 떠올리지 못한 상태라 '나'로만 표기하고, 다른 인물도 직함으로만 부릅니다.
  // 구성: ① 십 년의 충성과 그 대가 → ② 회장실 청소부(해결사의 방식과 자만) → ③ 첫 번째 삶의 마지막 30일 → ④ 죽음의 밤
  // 주인공은 자신이 죽은 정확한 이유를 모르고 짐작만 합니다. 회장이 최종 결정권자라는 사실도 확정하지 않습니다.
  lines: [
    { card: '십 년 전', sub: '태경그룹 회장실' },
    { narr: '어머니의 병원비 고지서가 현관에 쌓이던 해였다. 차태건 회장은 이력서 한 장 없는 나에게 회장실 책상 하나를 내주었다.' },
    { who: 'TAEGEON_ECHO', text: '맡긴 일은 끝까지 하는 놈이라고 들었다. 그거면 됐다.' },
    { narr: '그날부터 어머니의 병원비는 회장 비서실 이름으로 결제되었다. 십 년 동안 단 한 번도 끊긴 적이 없다.' },
    { card: '회장실 청소부', sub: '그룹 안에서 아무도 대놓고 부르지 않던 이름' },
    { who: 'DOYUN', mono: true, text: '나는 주먹을 쓰지 않았다. 사람을 무너뜨리는 데는 서류 한 장, 소문 하나, 그리고 정확한 타이밍이면 충분했다.' },
    { narr: '회장 일가의 음주 사고는 운전기사의 졸음운전이 되었다. 블랙박스 영상이 어떤 순서로 사라질지까지 내가 정했다.' },
    { narr: '파업을 이끌던 노조위원장은 처남 회사의 장부 한 장에 무너졌다. 그가 스스로 물러나기까지 사흘이 걸렸다.' },
    { narr: '회장님의 이름이 걸린 특종을 쥔 기자에게는 더 큰 특종을 건넸다. 다음 날 아침, 회장님의 이름은 어느 기사에도 없었다.' },
    { narr: '보고서에서 문장 하나를 지워 누군가를 감옥에 보낸 적도 있다. 그 사람의 이름은 일부러 기억하지 않았다.' },
    { who: 'DOYUN', mono: true, text: '사람들은 등 뒤에서 나를 ‘회장실 청소부’라고 불렀다. 내가 다녀간 자리에는 문제가 남지 않는다는 소문과 함께.' },
    { who: 'DOYUN', mono: true, text: '나는 그 이름이 싫지 않았다. 이 그룹에서 누가 누구를 미워하는지, 어느 계좌에 무엇이 숨어 있는지, 내가 모르는 판은 없다고 믿었다.' },
    { card: '마지막 30일', sub: '첫 번째 삶' },
    { narr: '올해 봄, 회장님은 그룹을 아들 차도혁 사장에게 넘기는 승계 작업을 시작했다. 재단으로 자금을 옮기고, 해외 법인을 정리하고, 지분을 맞추는 일. 실무는 전부 내 몫이었다.' },
    { narr: '죽기 30일 전 아침, 회장님이 물었다. 어제 외부 변호사에게 무슨 서류를 넘겼느냐고. 나는 대수롭지 않게 대답했다.' },
    { narr: '그날부터 결재 문서가 내 앞으로만 모이기 시작했다. 법인 계좌 위임장, 해외 출장 명의, 송금 승인서. 회장님은 ‘네가 맡아야 안심이 된다’고 했고, 나는 내용을 확인하지도 않고 승인 버튼을 눌렀다.' },
    { narr: '며칠 뒤, 감사팀이 재단 결산을 다시 열었다. 동료들은 복도에서 내 눈을 피했다. 내 출입증으로는 열리지 않는 문이 하나둘 늘었다.' },
    { who: 'DOYUN', mono: true, text: '나는 그 신호들을 전부 읽었다. 그리고 전부 잘못 읽었다. 일이 내게 몰리는 건 신뢰라고, 감사는 곧 누군가를 정리할 차례가 왔다는 뜻이라고 생각했다.' },
    { who: 'DOYUN', mono: true, text: '그 누군가가 나일 수 있다는 생각은, 단 한 번도 하지 않았다.' },
    { narr: '대규모 승계 작업이 끝난 밤. 열흘 만에 처음으로 사무실 불을 끄고 나왔다.', stage: { loc: 'parking' } },
    { narr: '자정 무렵, 비서실 번호로 메시지 한 통이 왔다. ‘지하 4층 B-17. 마지막 서류를 수령한 뒤 회장님께 보고 바랍니다.’' },
    { who: 'DOYUN', mono: true, text: '회장님께 보고만 하면 끝나는 일이었다.' },
    { who: 'DOYUN', mono: true, text: '십 년 동안, 나는 단 한 번도 그분의 지시를 의심하지 않았다.' },
    { narr: '지하 4층. 천장 조명 하나가 깜빡이다 꺼진다. 휴대폰의 신호 표시가 한 칸씩 사라진다.', sfx: 'tick' },
    { narr: 'B-17 자리에 세워진 검은 세단. 보닛 위에 서류 봉투 하나가 놓여 있다.' },
    { narr: '첫 장은 감사 보고서다. 재단 자금 횡령. 혐의자 칸에는 내 이름이, 승인란에는 내 전자서명이 남아 있다.' },
    { who: 'DOYUN', mono: true, text: '나는 이 승인을 한 적이 없다.' },
    { narr: '넘기는 장마다 내 서명이 있다. 출장 기록, 법인 계좌, 해외 송금. 십 년 동안 회장님을 위해 처리한 일들이 전부 내 이름으로 다시 쓰여 있다.' },
    { who: 'DOYUN', mono: true, text: '이 서류의 짜임을 나는 안다. 날짜를 맞추고, 결재 흐름을 잇고, 마지막에 한 사람의 이름만 남긴다. 내가 수없이 만들어 본 서류다.' },
    { who: 'DOYUN', mono: true, text: '다만 나는 늘, 이 서류의 반대편에 서 있었다.' },
    { narr: '등 뒤에서 구두 소리가 울린다. 서두르지 않는 걸음이다.', stage: { cast: ['MUJIN'] }, sfx: 'tick' },
    { who: 'MUJIN', text: '실장님. 서류는 확인하셨습니까.' },
    { who: 'DOYUN', text: '권 실장님, 이게 뭡니까. 회장님께 먼저 보고드려야—' },
    { who: 'MUJIN', text: '오늘 이후의 일정은 없습니다.' },
    { narr: '기둥 뒤에서 두 사람이 더 걸어 나온다. 출구 쪽 셔터가 내려가는 소리가 주차장 전체를 길게 긁는다.', sfx: 'danger' },
    { who: 'DOYUN', mono: true, text: '머리가 습관처럼 계산을 시작한다. 출구까지의 거리, 남은 시간, 협상에 쓸 카드. 그런데 내가 쥔 카드는 전부, 이미 저 서류 안에 들어 있다.' },
    { who: 'DOYUN', mono: true, text: '배신감보다 먼저 온 것은 모욕감이었다. 이 그룹에 내가 모르는 판이 있었다. 그리고 그 판 위의 말이, 나였다.' },
    { who: 'DOYUN', text: '회장님은… 알고 계십니까?' },
    { who: 'MUJIN', text: '그 질문의 답은 실장님이 제일 잘 아시지 않습니까.' },
    { who: 'MUJIN', text: '이런 밤은 늘 실장님이 정리하셨으니까요.' },
    { who: 'DOYUN', mono: true, text: '나는 너무 많이 알고 있었다. 그래서 죽는다. 그것만은 안다. 그런데 무엇을 알아서인가. 승계 자금의 흐름인가, 십 년 동안 덮어 준 일들 중 하나인가, 아니면 내가 아직 모르는 무언가인가.' },
    { narr: '주머니 속 휴대폰이 짧게 떨린다. 신호가 잠깐 잡힌 모양이다. 화면에 부재중 전화 한 통이 떠 있다. ‘비서실’, 2분 전.' },
    { narr: '다시 걸 틈은 없었다. 누군가 뒤에서 내 어깨를 붙잡는다. 손에서 빠져나간 휴대폰이 바닥에 부딪혀 화면이 갈라진다.', sfx: 'thud' },
    { who: 'DOYUN', mono: true, text: '십 년. 나는 누구를 위해, 무엇 때문에 죽는지도 모른 채—' },
    { fx: 'blackout', narr: '심장 소리가 느려진다. 그리고, 멈춘다.', sfx: 'heartbeat', stage: { loc: 'black', cast: [] } },
  ],
};

const RETURN = {
  id: 'RETURN',
  type: 'scene',
  next: 'NAME_ENTRY',
  skippable: true,
  stage: { loc: 'black', cast: [] },
  lines: [
    { fx: 'blackout', narr: '……숨이 들어온다. 차갑게, 한꺼번에, 너무 많이.', sfx: 'heartbeat' },
    { who: 'TAEGEON_ECHO', text: '이번 일만 끝나면, 너도 좀 쉬어야지.' },
    { narr: '눈을 뜬다. 천장 조명이 눈을 찌르고, 귓속에서 높은 소리가 멈추지 않는다.', stage: { loc: 'secretary', dizzy: true } },
    { narr: '손이 먼저 목으로 간다. 아무것도 없다. 상처도, 통증도. 셔츠 깃은 아침에 다린 그대로 빳빳하다.' },
    { narr: '손끝이 멈추지 않고 떨린다. 나는 그 손을 책상 아래로 숨긴다. 떨림은 숨기라고 남들에게 가르친 것도 나였다.' },
    { narr: '책상, 모니터, 결재 서류. 주차장의 콘크리트 냄새와 비서실의 커피 냄새가 한데 섞이며 속이 뒤집힌다.' },
    { who: 'DOYUN', mono: true, text: '여기는… 어디지. 나는 분명히 그 주차장에서—' },
    { who: 'HAERIN', text: '실장님?', stage: { cast: ['HAERIN'] } },
    { who: 'HAERIN', text: '실장님, 제 말 들리세요?' },
    { who: 'DOYUN', mono: true, text: '실장님. 그건 직함이다. 이름이 아니다.' },
    { who: 'DOYUN', mono: true, text: '셔터 소리도, 서류 속 내 전자서명도, 구두 소리도 이렇게 선명한데… 정작 내 이름이 떠오르지 않는다.' },
    { narr: '책상 위 명패로 손을 뻗는다. 글자가 물에 젖은 것처럼 번져 읽히지 않는다.' },
    { who: 'DOYUN', mono: true, text: '가장 먼저 붙잡아야 하는 건 이름이다. 내가 누구였는지부터.' },
  ],
};

/* 회귀 직후 어지러운 상태에서 자기 이름부터 떠올리는 장면. 이름 입력 화면입니다. */
const NAME_ENTRY = {
  id: 'NAME_ENTRY',
  type: 'name',
  next: 'AWAKEN',
  stage: { loc: 'secretary', cast: ['HAERIN'], dizzy: true },
};

const AWAKEN = {
  id: 'AWAKEN',
  type: 'scene',
  next: 'HAERIN_OPEN',
  skippable: true,
  stage: { loc: 'secretary', cast: ['HAERIN'] },
  lines: [
    { narr: '번져 있던 명패의 글자가 한 획씩 제자리를 찾는다. 「회장실 실장 {fullname}」.', sfx: 'chime' },
    { who: 'DOYUN', mono: true, text: '{fullname}. 서른다섯. 태경그룹 회장실 실장.' },
    { who: 'DOYUN', mono: true, text: '그리고 30일 뒤, 지하 주차장에서 죽은 사람.' },
    { card: 'D-30', sub: '죽기 30일 전 아침', sfx: 'chime' },
    { narr: '모니터 구석의 날짜, 휴대폰 첫 화면의 일정. ‘09:00 회장님 보고.’ 죽기 한 달 전의 바로 그 아침이다.' },
    { who: 'HAERIN', text: '{surname} 실장님. 안색이 좋지 않네요.' },
    { who: 'DOYUN', mono: true, text: '서해린. 이 목소리도, 책상 위 문서도… 죽기 한 달 전과 같다.' },
    { narr: '그런데 하나가 다르다. 그녀의 가슴 앞에 금속판 몇 장이 겹쳐 떠 있고, 나사들이 그 판을 붙들고 있다.', stage: { seal: ['HAERIN'] }, sfx: 'chime' },
    { who: 'DOYUN', mono: true, text: '눈을 깜빡여도 사라지지 않는다. 헛것이라기엔 나사 머리의 홈까지 너무 정교하다.' },
    { narr: '시선을 나사 하나에 모은다. 나사가 아주 조금 돌아가고, 그 틈으로 목소리 하나가 새어 나온다.', sfx: 'tick' },
    { who: 'HAERIN', inner: true, text: '…오늘만 넘기면 돼. 아무 일도 없을 거야.' },
    { narr: '관자놀이를 쇠꼬챙이로 누르는 듯한 통증. 나사에서 눈을 떼자 목소리가 뚝 끊긴다.', sfx: 'thud' },
    { who: 'DOYUN', mono: true, text: '사람의 속을 나사처럼 풀어낼 수 있다. 다만 오래 붙들 수는 없다. 한 번에 풀 수 있는 건 몇 개뿐이다.' },
    { who: 'DOYUN', mono: true, text: '들리는 건 지금 이 사람이 붙들고 있는 기억과 감정뿐이다. 그게 사실인지는 따로 확인해야 한다.' },
    { who: 'DOYUN', mono: true, text: '그리고 무엇보다, 내가 들여다봤다는 사실을 들켜서는 안 된다.' },
    { narr: '회장님의 얼굴이 떠오른다. 분노인지 그리움인지 모를 것이 목까지 차오른다. 지금은 둘 다 삼킨다.' },
    { narr: '숨을 고르고, 첫 번째 삶의 30일을 처음부터 다시 짚는다.' },
    { who: 'DOYUN', mono: true, text: '내 앞으로 쌓이던 결재는 우연이 아니었다. 누군가 30일에 걸쳐 내 이름으로 길을 깔았고, 그 길의 끝이 지하 주차장이었다.' },
    { who: 'DOYUN', mono: true, text: '나는 이 그룹의 모든 판을 안다고 믿었다. 그 믿음이 나를 그 주차장까지 제 발로 걸어가게 했다.' },
    { who: 'DOYUN', mono: true, text: '그러니 이번에는 반대로 시작한다. 나는 모른다. 짐작 가는 이유는 있다. 승계 자금의 흐름, 십 년 동안 덮어 준 일들. 하지만 짐작은 짐작일 뿐이다.' },
    { who: 'DOYUN', mono: true, text: '누가 시작했는지도 모른다. 회장님일 수도, 승계를 받는 차도혁 사장일 수도, 회장실 안의 누군가일 수도 있다.' },
    { who: 'DOYUN', mono: true, text: '도망칠 수는 없다. 내 명의로 처리된 거래와 문서가 이미 있다. 잠적하는 순간 나는 진짜 횡령범이자 쫓기는 배신자가 되고, 어머니의 병원비도 그날로 끊긴다.' },
    { who: 'DOYUN', mono: true, text: '시키는 대로 움직이면, 30일 뒤 같은 주차장에서 같은 구두 소리를 듣게 된다.' },
    { who: 'DOYUN', mono: true, text: '남은 길은 하나다. 나를 죽이는 것보다 살려 두는 편이 이득인 상황을 만드는 것. 내가 사라지면 함께 무너지는 기록을, 내 손에 쥐는 것.' },
    { who: 'DOYUN', mono: true, text: '그러려면 세 가지가 필요하다. 의심받지 않을 것. 나를 지켜 줄 실물 기록을 확보할 것. 혼자 버티지 않을 것.' },
    { who: 'DOYUN', mono: true, text: '다행히 나는 사람을 무너뜨리는 법을 안다. 서류 한 장, 소문 하나, 정확한 타이밍. 이번에는 그 방법으로 나를 살린다.' },
    { who: 'DOYUN', mono: true, text: '이 능력으로 들은 기억은 판단을 도와줄 뿐, 누구 앞에도 증거로 내밀 수 없다. 내밀 수 있는 건 손에 쥔 서류뿐이다.' },
    { card: '이번 삶의 목표', list: LIFE_GOALS, sub: '타인의 비밀을 알아야 살아남는다. 하지만 안다는 사실을 들키면 죽는다.' },
    { who: 'DOYUN', mono: true, text: '첫 시험은 오늘 아침이다. 첫 번째 삶이 어긋나기 시작한 바로 그 질문, 어제 외부 변호사에게 무엇을 넘겼느냐는 질문.' },
    { who: 'DOYUN', mono: true, text: '이번에는 대답하기 전에, 묻는 사람의 속부터 들여다본다. 아홉 시까지 이십 분.' },
  ],
};

const HAERIN_OPEN = {
  id: 'HAERIN_OPEN',
  type: 'dialogue',
  next: 'TUTORIAL',
  stage: { loc: 'secretary', cast: ['HAERIN'], seal: ['HAERIN'] },
  lines: [
    { narr: '서해린이 서류철을 가슴 앞에 끌어안은 채 한 걸음 다가온다. 향수 대신 복사기 토너와 식은 커피 냄새가 난다.' },
    { who: 'HAERIN', text: '회장님이 어제 윤 변호사에게 전달한 자료를 확인하고 싶어 하세요.' },
    { who: 'DOYUN', mono: true, text: '기억이 맞다면, 첫 번째 삶은 이 질문에서부터 어긋나기 시작했다.' },
  ],
  choices: [
    {
      id: 'H01_A',
      text: '“전달한 자료부터 차근히 확인하죠.”',
      effects: { suspicionDelta: 0, trustDelta: { HAERIN: 5 } },
      reaction: [
        { narr: '서해린의 어깨에서 힘이 조금 빠진다.' },
        { who: 'HAERIN', text: '…네. 그렇게 말씀해 주시면 저도 일하기 편하죠.' },
      ],
    },
    {
      id: 'H01_B',
      text: '“내가 누구를 만났는지까지 감시합니까?”',
      effects: { suspicionDelta: 10, trustDelta: { HAERIN: -15 } },
      reaction: [
        { narr: '그녀의 눈빛이 단번에 식는다.' },
        { who: 'HAERIN', text: '감시라니요. 회장님이 물으시는 건 업무예요, 실장님.' },
        { who: 'HAERIN', text: '목소리 낮추세요. 이 층 벽은 생각보다 얇아요.' },
      ],
    },
    {
      id: 'H01_C',
      text: '“어제는 아무도 만나지 않았습니다.”',
      effects: { suspicionDelta: 20, trustDelta: { HAERIN: -10 } },
      contradictsClues: ['C_HA_1'],
      reaction: [
        { narr: '서해린이 아주 잠깐 말을 멈춘다. 무언가를 알고 있는 사람의 침묵이다.' },
        { who: 'HAERIN', text: '…그래요? 그럼 회장님께도 그렇게 말씀드리세요. 그게 가능하다면요.' },
      ],
    },
  ],
};

const OFFICE_ENTER = {
  id: 'OFFICE_ENTER',
  type: 'scene',
  next: 'MEMORY_HUB',
  stage: { loc: 'office', cast: ['HAERIN', 'TAEGEON'] },
  lines: [
    { narr: '회장실. 통유리 너머로 아침의 도시가 내려다보인다. 서해린이 문 옆에 선다.' },
    { who: 'TAEGEON', text: '왔나. 커피는 여전히 설탕 없이?' },
    { who: 'TAEGEON', text: '어머님 병원은 옮겼다고 들었다. 잘했어. 그런 건 미루는 게 아니다.' },
    { who: 'DOYUN', mono: true, text: '기억 속과 똑같은 다정함이다. 그리고 그의 가슴 앞에도… 판과 나사가 보인다.', stage: { seal: ['HAERIN', 'TAEGEON'] }, sfx: 'chime' },
    { narr: '회장의 펜 끝이 종이 위에서 멈춘다. 세상의 소리가 멀어지고, 시간이 고인다.', stage: { loc: 'memory' } },
    { who: 'DOYUN', mono: true, text: '지금이라면 두 사람의 속을 열어 볼 수 있다. 다만 집중력은 오래 버티지 못한다.' },
  ],
};

const DOCUMENT_ACTION = {
  id: 'DOCUMENT_ACTION',
  type: 'dialogue',
  next: 'BOSS_01',
  stage: { loc: 'office', cast: ['HAERIN', 'TAEGEON'], seal: [] },
  lines: [
    { narr: '멈춰 있던 시간이 다시 흐른다. 회장이 서류를 넘기는 소리.' },
    { narr: '회장의 휴대폰이 울린다. 회장이 전화를 받으며 창가로 돌아선다. 짧은 틈이 생겼다.' },
    { narr: '서해린이 서류철을 정리하며 내 옆에 선다. 지금이라면 낮은 목소리로 말을 걸 수 있다.' },
  ],
  choices: [
    {
      id: 'DOC_REQUEST',
      text: '“어제 전달 목록을 받을 수 있을까요?”',
      relatedClue: 'C_HB_1',
      outcomes: [
        {
          id: 'GRANTED',
          when: { trustAtLeast: { HAERIN: 45 } },
          effects: { suspicionDelta: 0, trustDelta: { HAERIN: 5 }, grantEvidence: ['DOC_LIST'] },
          reaction: [
            { narr: '서해린이 회장 쪽을 짧게 확인한 뒤, 서류철 맨 뒤에서 종이 한 장을 빼낸다.' },
            { who: 'HAERIN', text: '…여기요. 어제 전달 목록 사본이에요.' },
            { who: 'HAERIN', text: '제가 드렸다고는 말하지 마세요.' },
          ],
        },
        {
          id: 'REFUSED',
          effects: { suspicionDelta: 0 },
          reaction: [
            { narr: '서해린은 서류철을 더 단단히 끌어안는다.' },
            { who: 'HAERIN', text: '지금 그걸 왜 저한테 받으려고 하세요?' },
            { who: 'HAERIN', text: '기억하시는 대로 말씀하세요. 그게 제일 안전해요.' },
          ],
        },
      ],
    },
    {
      id: 'DOC_SKIP',
      text: '“기억하고 있습니다. 바로 들어가죠.”',
      effects: { suspicionDelta: 0 },
      reaction: [
        { who: 'HAERIN', text: '…그러세요.' },
        { narr: '그녀는 서류철을 품에 안은 채 한 걸음 물러선다.' },
      ],
    },
  ],
};

const BOSS_01 = {
  id: 'BOSS_01',
  type: 'dialogue',
  next: 'BOSS_02',
  boss: true,
  stage: { loc: 'office', cast: ['HAERIN', 'TAEGEON'], seal: [] },
  lines: [
    { narr: '통화를 마친 회장이 의자에 등을 기댄다. 서류 위에 손을 얹은 채 나를 본다.' },
    { who: 'TAEGEON', text: '어제 윤 변호사에게 무슨 서류를 줬지?' },
  ],
  choices: [
    {
      id: 'B01_A',
      text: '“윤 변호사를 만난 적 없습니다.”',
      effects: { suspicionDelta: 30 },
      contradictsClues: ['C_HA_1'],
      reaction: [
        { who: 'TAEGEON', text: '만난 적이 없다.' },
        { narr: '회장이 펜을 내려놓지 않은 채 나를 오래 본다.' },
        { who: 'TAEGEON', text: '{name:아}. 나는 네가 거짓말을 잘 못한다는 점을 좋아했다.' },
      ],
    },
    {
      id: 'B01_B',
      text: '“요청받은 재단 결산 자료를 전달했습니다.”',
      effects: { suspicionDelta: 5 },
      reaction: [
        { narr: '짧은 침묵. 회장의 시선이 내 얼굴에 머문다.' },
        { who: 'TAEGEON', text: '재단 결산이라.' },
      ],
    },
    {
      id: 'B01_C',
      text: '“제 일정을 따로 조사하신 겁니까?”',
      effects: { suspicionDelta: 35 },
      reaction: [
        { narr: '방 안의 공기가 가라앉는다.' },
        { who: 'TAEGEON', text: '{fullname}.' },
        { narr: '이름 석 자를 또박또박 부른다. 확인하듯이.' },
        { who: 'TAEGEON', text: '내가 묻는 말에 질문으로 답하는 버릇은 언제 생겼지?' },
      ],
    },
    {
      id: 'B01_D',
      text: '“전달 목록입니다. 여기 적힌 세 건입니다.”',
      requires: { evidence: 'DOC_LIST' },
      lockHint: '실물 전달 목록 필요 · 기억으로 본 내용만으로는 내밀 수 없습니다',
      effects: { suspicionDelta: -10 },
      reaction: [
        { narr: '회장이 목록을 받아 훑어보고는 서류를 내려놓는다.' },
        { who: 'TAEGEON', text: '세 건. 깔끔하군. 이런 건 이렇게 남겨 두는 게 맞다.' },
      ],
    },
  ],
};

const BOSS_02 = {
  id: 'BOSS_02',
  type: 'dialogue',
  next: 'BOSS_03',
  boss: true,
  stage: { loc: 'office', cast: ['HAERIN', 'TAEGEON'], seal: [] },
  lines: [{ who: 'TAEGEON', text: '그쪽에서 다른 자료를 요구하지는 않았나?' }],
  choices: [
    {
      id: 'B02_A',
      text: '“현재 요청받은 범위는 결산 자료뿐입니다.”',
      effects: { suspicionDelta: 5 },
      reaction: [
        { who: 'TAEGEON', text: '현재는.' },
        { narr: '회장이 그 단어를 한 번 되뇐다. 시선이 잠시 내게 고정된다.' },
      ],
    },
    {
      id: 'B02_B',
      text: '“제게 책임을 넘길 준비를 하시는 겁니까?”',
      effects: { suspicionDelta: 40 },
      reaction: [
        { narr: '서해린이 숨을 멈춘다.' },
        { who: 'TAEGEON', text: '…{name:아}.' },
        { narr: '회장이 천천히 웃는다. 웃음이 끝나도 눈은 그대로다.' },
        { who: 'TAEGEON', text: '누가 너한테 그런 말을 넣었지?' },
      ],
    },
    {
      id: 'B02_C',
      text: '“개인적인 만남이라 업무와는 상관없습니다.”',
      effects: { suspicionDelta: 20 },
      contradictsClues: ['C_HB_2'],
      reaction: [
        { who: 'TAEGEON', text: '개인적인 만남.' },
        { narr: '회장이 서해린 쪽을 힐끗 본다.' },
        { who: 'TAEGEON', text: '개인적인 자리에서 재단 서류가 오갔다는 말이군.' },
      ],
    },
    {
      id: 'B02_D',
      text: '“추가 요청은 목록으로 받고, 회장님 결재 후 제공하겠습니다.”',
      requires: { all: [{ evidence: 'DOC_LIST' }, { clue: 'C_BB_2' }] },
      lockHint: '실물 전달 목록과, 회장이 원하는 보고 방식에 대한 단서 필요',
      effects: { suspicionDelta: -10 },
      reaction: [
        { narr: '회장이 고개를 끄덕이며 서류를 덮는다.' },
        { who: 'TAEGEON', text: '그래. 내 결재 없이 나가는 건 없다. 그 원칙만 지키면 된다.' },
      ],
    },
  ],
};

const BOSS_03 = {
  id: 'BOSS_03',
  type: 'dialogue',
  next: 'RESULT',
  boss: true,
  stage: { loc: 'office', cast: ['HAERIN', 'TAEGEON'], seal: [] },
  lines: [
    { who: 'TAEGEON', text: '좋아. 그럼 남은 자료도 네가 마무리하게.' },
    { who: 'DOYUN', mono: true, text: '남은 자료. 첫 번째 삶에서 나는 이 말에 고개만 숙였다. 그리고 그 서류들은 전부 내 이름으로 돌아왔다.' },
  ],
  choices: [
    {
      id: 'B03_A',
      text: '“지시하신 범위대로 처리하겠습니다.”',
      effects: { suspicionDelta: 5 },
      reaction: [
        { who: 'TAEGEON', text: '그래. 늘 그랬듯이.' },
        { narr: '회장의 시선이 잠시 더 머물다 서류로 돌아간다.' },
      ],
    },
    {
      id: 'B03_B',
      text: '“해외 송금 전표까지 제가 알아서 정리하겠습니다.”',
      effects: { suspicionDelta: 35 },
      reaction: [
        { narr: '펜이 멈춘다.' },
        { who: 'TAEGEON', text: '해외 송금 전표.' },
        { narr: '회장이 그 단어를 처음 듣는 사람처럼 따라 말한다.' },
        { who: 'TAEGEON', text: '그 이야기를 누구한테 들었나, {name:아}.' },
      ],
    },
    {
      id: 'B03_C',
      text: '“승인 내역과 자료 회수 확인서까지 함께 남기겠습니다.”',
      requires: {
        all: [
          { evidence: 'DOC_LIST' },
          { any: [{ clue: 'C_BA_3' }, { all: [{ clue: 'C_BA_2' }, { clue: 'C_BB_2' }] }] },
        ],
      },
      lockHint: '실물 전달 목록과, 회장이 걱정하는 문서에 대한 깊은 이해 필요',
      effects: { suspicionDelta: -5, setFlags: { F_PRESERVE_RECORD: true } },
      reaction: [
        { narr: '회장이 잠시 나를 본다. 그리고 웃는다.' },
        { who: 'TAEGEON', text: '확인서라. 좋다. 기록은 남겨야지.' },
        { narr: '문 옆의 서해린이 아주 작게 숨을 내쉰다.' },
      ],
    },
    {
      id: 'B03_D',
      text: '“윤 변호사와는 더 이상 접촉하지 않겠습니다.”',
      effects: { suspicionDelta: 15, setFlags: { F_CUT_CONTACT: true } },
      reaction: [
        { who: 'TAEGEON', text: '접촉하지 않겠다.' },
        { who: 'TAEGEON', text: '내가 그걸 부탁한 적이 있던가?' },
        { narr: '회장은 대답을 기다리지 않고 다음 서류를 넘긴다.' },
      ],
    },
  ],
};

export const NODES = {
  PROLOGUE,
  RETURN,
  NAME_ENTRY,
  AWAKEN,
  HAERIN_OPEN,
  TUTORIAL: { id: 'TUTORIAL', type: 'tutorial', next: 'OFFICE_ENTER' },
  OFFICE_ENTER,
  MEMORY_HUB: { id: 'MEMORY_HUB', type: 'hub', next: 'DOCUMENT_ACTION' },
  PUZZLE: { id: 'PUZZLE', type: 'puzzle' },
  REWARD: { id: 'REWARD', type: 'reward', next: 'MEMORY_HUB' },
  DOCUMENT_ACTION,
  BOSS_01,
  BOSS_02,
  BOSS_03,
  RESULT: { id: 'RESULT', type: 'result' },
};

export const NODE_ORDER = ['PROLOGUE', 'RETURN', 'NAME_ENTRY', 'AWAKEN', 'HAERIN_OPEN', 'TUTORIAL', 'OFFICE_ENTER', 'MEMORY_HUB', 'PUZZLE', 'REWARD', 'DOCUMENT_ACTION', 'BOSS_01', 'BOSS_02', 'BOSS_03', 'RESULT'];

/* 사건 재도전 체크포인트: HAERIN_OPEN 이전 상태 (명세 18.2) */
export const CHECKPOINT_NODE = 'HAERIN_OPEN';

/* 의심도 구간에 처음 들어설 때 덧붙는 장면 반응 (명세 13, 16.4) — 수치 외 숨은 규칙은 없습니다. */
export const BAND_LINES = {
  watched: [{ narr: '복도 끝에서 무전기 잡음이 짧게 울리고 끊긴다. 누군가 이 방의 대화를 듣고 있다.' }],
  review: [
    { narr: '반투명 유리문 너머로 검은 실루엣이 멈춰 선다.', stage: { door: true }, sfx: 'danger' },
    { who: 'MUJIN', text: '회장님. 필요하시면 부르십시오.' },
  ],
};

/* 의심도 100: 대화 종료, 보안실장 호출, 암전 */
export const REMOVAL_LINES = [
  { narr: '회장은 한동안 아무 말도 하지 않는다. 펜을 내려놓는 소리가 유난히 크게 들린다.' },
  { who: 'TAEGEON', text: '……그래. 알겠다.' },
  { narr: '회장이 인터폰을 누른다.', sfx: 'danger' },
  { who: 'TAEGEON', text: '무진아. 들어와라.' },
  { narr: '문이 열리고, 권무진이 고개를 숙인다. 서해린은 끝내 나를 보지 않는다.', stage: { cast: ['HAERIN', 'TAEGEON', 'MUJIN'], door: false } },
  { fx: 'blackout', sfx: 'thud', stage: { loc: 'black', cast: [] } },
];

/* ------------------------------------------------------------------ */
/* 튜토리얼 · 허브 문구                                                  */
/* ------------------------------------------------------------------ */

export const TUTORIAL = {
  intro: '서해린의 가슴 앞, 겹쳐진 판 위로 나사 머리가 빛난다. 본격적으로 들여다보기 전에 손에 익혀 두자.',
  note: '연습 해체입니다. 보상, 집중력 소모, 의심도 변화가 없습니다.',
  steps: {
    select: '빛나는 나사를 눌러 집으세요.',
    move: '점선으로 표시된 빈 구멍을 눌러 나사를 옮기세요.',
    plate: '지지하던 나사가 모두 빠진 판은 떨어집니다. 판 하나를 더 떨어뜨려 보세요.',
    reveal: '위 판이 떨어지자 가려져 있던 나사가 드러났습니다. 가려진 나사와 구멍은 판이 떨어지기 전까지 쓸 수 없습니다.',
    done: '해체 완료. 실제 조사에서는 해체를 마치면 기억 단서를 얻습니다.',
  },
  plates: {
    A: { label: '긴장', fall: '굳어 있던 어깨가 조금 풀린다.' },
    B: { label: '서류철', fall: '품에 안긴 서류철의 무게가 느껴진다.' },
  },
};

export const HUB = {
  title: '멈춘 시간',
  desc: '회장의 첫 질문 직전. 두 사람의 가슴 앞에 겹겹의 판과 나사가 떠 있다. 집중력이 허락하는 만큼만 풀어낼 수 있다.',
  finishNote: '조사를 마치면 시간이 다시 흐릅니다. 이번 사건에서는 이전 주제로 돌아올 수 없습니다.',
};

/* ------------------------------------------------------------------ */
/* 결과 (명세 17장)                                                      */
/* ------------------------------------------------------------------ */

export const ENDINGS = {
  END_REMOVED: {
    id: 'END_REMOVED',
    title: '제거',
    tagline: '당신은 너무 많은 것을 알고 있다는 사실을 들켰다.',
    lines: ['회장실 문이 닫히는 소리가 마지막이었다.', '이번에는 30일도 남지 않았다.'],
    tone: 'bad',
  },
  END_SURVIVED: {
    id: 'END_SURVIVED',
    title: '첫 호출을 넘기다',
    tagline: '회장실 문을 살아서 나섰다.',
    lines: ['“수고했다. 나가 봐.”', '복도 끝 보안실 문이 반쯤 열려 있다. 나는 그 앞을 지나며 걸음을 늦추지 않았다.'],
    preview: '내일, 감사팀이 재단 결산을 다시 요청한다. 그 서류에는 내 서명이 있어야 한다고 한다.',
    tone: 'ok',
  },
  END_WATCHED: {
    id: 'END_WATCHED',
    title: '감시 대상',
    tagline: '호출은 넘겼지만, 이제 누군가 나를 지켜본다.',
    lines: ['엘리베이터 문이 닫히기 직전, 권무진이 같은 칸에 오른다.', '그는 층수 버튼을 누르지 않는다. 내가 내릴 때까지 아무 말도 하지 않는다.'],
    preview: '오늘 밤부터 내 출입증 등급이 한 단계 낮아졌다. 내일은 회장실 층에 혼자 올라갈 수 없다.',
    tone: 'warn',
  },
  END_ADVANTAGE: {
    id: 'END_ADVANTAGE',
    title: '기록 보존의 명분',
    tagline: '처음으로, 종이 한 장이 내 편에 섰다.',
    lines: ['회장의 결재란 옆에 ‘자료 회수 확인서’라는 칸이 하나 늘었다.', '퇴근길, 휴대폰에 짧은 메시지가 와 있다.'],
    message: { from: 'HAERIN', text: '다음에는 혼자 들어가지 마세요.' },
    preview: '자료 회수 확인서. 회장의 서명이 들어간 그 종이가, 처음으로 나를 지킬 기록이 될지도 모른다.',
    tone: 'good',
  },
};

export const RESULT_COMMON = {
  daysLine: '죽음까지 남은 날 29일. 예정된 그날은 아직 그대로다.',
  nextCaseNote: '다음 사건(D-29)은 아직 준비 중입니다. 남은 아이템은 저장되어 있습니다.',
};

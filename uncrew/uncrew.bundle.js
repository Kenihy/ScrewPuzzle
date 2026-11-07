/*
 * 언스크류(UNCREW) — 실행용 단일 스크립트
 * 자동 생성 파일입니다. 직접 고치지 말고 src/를 수정한 뒤 `node tools/build.mjs`를 실행하세요.
 * 포함 모듈: 15개 (진입점 src/main.js)
 */
(function () {
'use strict';
var __factories = Object.create(null);
var __cache = Object.create(null);
function __define(id, factory) { __factories[id] = factory; }
function __require(id) {
  if (id in __cache) return __cache[id];
  var f = __factories[id];
  if (!f) throw new Error('UNCREW bundle: 모듈 없음 ' + id);
  __cache[id] = f(__require);
  return __cache[id];
}

/* ===== src/data/case01.js ===== */
__define("src/data/case01.js", function (__require) {
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

const CASE_ID = 'CASE_01';

const CASE_INFO = {
  id: CASE_ID,
  title: '어제의 전달 목록',
  day: 'D-30',
  question: '회장은 왜 외부 변호사에게 전달된 문서의 범위에 집착하는가?',
};

const CHARACTERS = {
  DOYUN: { id: 'DOYUN', name: '{fullname}', short: '{name}', age: 35, role: '태경그룹 회장실 해결사', note: '십 년 동안 회장의 일을 처리해 왔다. 첫 번째 삶에서 횡령범으로 조작된 채 살해당했다.' },
  TAEGEON: { id: 'TAEGEON', name: '차태건', short: '차태건', age: 59, role: '태경그룹 회장', note: '가난하던 {name}에게 일자리와 기회를 준 사람. 사소한 취향과 가족 사정까지 기억한다.' },
  HAERIN: { id: 'HAERIN', name: '서해린', short: '서해린', age: 37, role: '회장 비서실장', note: '흐트러짐 없는 업무와 절제된 태도. 회장실의 모든 일정과 문서가 그녀를 거친다.' },
  MUJIN: { id: 'MUJIN', name: '권무진', short: '권무진', age: 45, role: '보안실장', note: '예의 바르고 조용하다. 첫 번째 삶의 마지막 밤, 주차장에서 기다리던 사람.' },
  SEOJIN: { id: 'SEOJIN', name: '윤서진', short: '윤 변호사', age: 34, role: '외부 변호사', note: '어제 {name:이} 재단 결산 자료를 전달한 상대. 이번 사건에는 직접 등장하지 않는다.' },
};

const SPEAKER_LABEL = {
  DOYUN: '나', // 이름을 떠올린 뒤에는 입력한 이름으로 표시합니다.
  TAEGEON: '차태건',
  TAEGEON_ECHO: '차태건 · 기억 속 목소리',
  HAERIN: '서해린',
  MUJIN: '권무진',
};

/* ------------------------------------------------------------------ */
/* 기억 단서 · 실물 증거                                                */
/* ------------------------------------------------------------------ */

const CLUES = {
  C_HA_1: { id: 'C_HA_1', topic: 'HA', who: 'HAERIN', depth: 1, text: '회장은 {name:과} 윤서진이 만났다는 사실을 이미 알고 있다.' },
  C_HA_2: { id: 'C_HA_2', topic: 'HA', who: 'HAERIN', depth: 2, text: '보안실장은 이번 점검 결과를 회장에게 직접 보고한다.' },
  C_HA_3: { id: 'C_HA_3', topic: 'HA', who: 'HAERIN', depth: 3, text: '{name}의 출입 기록이 다른 직원들과 분리되어 보존되고 있다.' },
  C_HB_1: { id: 'C_HB_1', topic: 'HB', who: 'HAERIN', depth: 1, text: '서해린은 자료 전달 목록을 보관하고 있다.' },
  C_HB_2: { id: 'C_HB_2', topic: 'HB', who: 'HAERIN', depth: 2, text: '실제 전달 목록에는 재단 결산 자료 3건이 적혀 있다.' },
  C_HB_3: { id: 'C_HB_3', topic: 'HB', who: 'HAERIN', depth: 3, text: '서해린은 해외 송금 전표의 사본을 전달 목록에서 제외했다.' },
  C_BA_1: { id: 'C_BA_1', topic: 'BA', who: 'TAEGEON', depth: 1, text: '회장은 만남 자체보다 외부에 전달된 문서의 범위를 걱정한다.' },
  C_BA_2: { id: 'C_BA_2', topic: 'BA', who: 'TAEGEON', depth: 2, text: '회장이 가장 신경 쓰는 문서는 특정 해외 송금 전표다.' },
  C_BA_3: { id: 'C_BA_3', topic: 'BA', who: 'TAEGEON', depth: 3, text: '회장은 {name:이} 해당 전표의 중요성을 아직 모른다고 믿는다.' },
  C_BB_1: { id: 'C_BB_1', topic: 'BB', who: 'TAEGEON', depth: 1, text: '이번 질문에는 사실 확인과 {name}의 반응 확인이 함께 들어 있다.' },
  C_BB_2: { id: 'C_BB_2', topic: 'BB', who: 'TAEGEON', depth: 2, text: '자료 처리의 승인 절차와 기록을 명확히 하면 회장의 우려를 줄일 수 있다.' },
  C_BB_3: { id: 'C_BB_3', topic: 'BB', who: 'TAEGEON', depth: 3, text: '회장은 보안실장을 가까운 곳에 대기시켜 두었다.' },
  C_CASE_01_END: {
    id: 'C_CASE_01_END',
    topic: null,
    who: 'DOYUN',
    depth: 0,
    kind: 'case',
    text: '나의 업무 기록이 별도 보존되고 있다. 단순한 자료 확인이 아니다.',
    reconfirmText: '별도 보존 사실이 다시 확인되었다. 단순한 자료 확인이 아니다.',
  },
};

const EVIDENCE = {
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

const TOPICS = {
  HA: {
    id: 'HA',
    target: 'HAERIN',
    title: '바뀐 일정',
    teaser: '오늘 아침, 그녀가 다시 쓴 일정표',
    symbol: 'mask',
    clues: ['C_HA_1', 'C_HA_2', 'C_HA_3'],
    fragment: '서해린의 기억. 어젯밤 늦게 고쳐 쓴 일정표 위로 지우개 자국이 겹친다. 그녀는 한 이름을 적었다가 지우기를 반복한다.',
    plates: {
      A: { label: '일정표', fall: '지운 자국 위에 새로 쓴 시간이 겹쳐 보인다.' },
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
      C: { label: '만년필', fall: '서명 직전에 멈춘 펜촉 끝에 잉크가 맺힌다.' },
      D: { label: '봉투', fall: '봉인을 두 번 확인하는 손가락.' },
      E: { label: '빈 책상', fall: '모두 퇴근한 사무실, 스탠드 불빛 하나.' },
    },
  },
  BA: {
    id: 'BA',
    target: 'TAEGEON',
    title: '질문의 목적',
    teaser: '그가 정말 묻고 싶은 것',
    symbol: 'contract',
    clues: ['C_BA_1', 'C_BA_2', 'C_BA_3'],
    fragment: '차태건의 기억. 서재의 스탠드 아래에서 그는 같은 질문을 세 번 고쳐 쓴다. 마지막 문장만 남기고 종이를 접는다.',
    plates: {
      A: { label: '미소', fall: '웃고 있지만, 눈은 웃지 않는다.' },
      B: { label: '만년필', fall: '질문을 고르는 짧은 침묵.' },
      C: { label: '가족사진', fall: '어린 남매가 웃는 오래된 사진 한 장.' },
      D: { label: '식탁', fall: '가족 식탁의 대화가 갑자기 끊긴다.' },
      E: { label: '금고', fall: '다이얼을 돌리다 멈춘 손.' },
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
      B: { label: '결재판', fall: '도장이 찍히지 않은 빈칸 하나.' },
      C: { label: '보고서', fall: '정해진 순서대로만 읽히는 문장들.' },
      D: { label: '창밖', fall: '도시를 내려다보는 사람의 오래된 습관.' },
      E: { label: '찻잔', fall: '손대지 않은 차가 천천히 식어 간다.' },
    },
  },
};

const TOPIC_ORDER = ['HA', 'HB', 'BA', 'BB'];

/* ------------------------------------------------------------------ */
/* 장면(노드)                                                            */
/* ------------------------------------------------------------------ */

const PROLOGUE = {
  id: 'PROLOGUE',
  type: 'scene',
  next: 'RETURN',
  skippable: true,
  stage: { loc: 'parking', cast: [] },
  // 주인공은 아직 자기 이름을 떠올리지 못한 상태라 '나'로만 표기하고, 다른 인물도 직함으로만 부릅니다.
  lines: [
    { narr: '대규모 승계 작업이 끝난 밤. 열흘 만에 처음으로 사무실 불을 끄고 나왔다.' },
    { narr: '자정 무렵, 비서실 번호로 메시지 한 통이 왔다. ‘지하 4층 B-17. 마지막 서류를 수령한 뒤 회장님께 보고 바랍니다.’' },
    { who: 'DOYUN', mono: true, text: '회장님께 보고만 하면 끝나는 일이었다.' },
    { who: 'DOYUN', mono: true, text: '십 년 동안, 나는 단 한 번도 그분의 지시를 의심하지 않았다.' },
    { narr: '지하 4층. 천장의 형광등 하나가 깜빡이다 꺼진다. 휴대폰의 신호 표시가 한 칸씩 사라진다.', sfx: 'tick' },
    { narr: 'B-17 자리에 세워진 검은 세단. 보닛 위에 봉인된 서류 봉투가 놓여 있다.' },
    { narr: '첫 장은 감사 보고서다. 재단 자금 횡령. 혐의자 칸에는 내 이름이, 승인란에는 내 도장이 찍혀 있다.' },
    { who: 'DOYUN', mono: true, text: '나는 이 서류에 도장을 찍은 적이 없다.' },
    { narr: '넘기는 장마다 내 서명이 있다. 출장 기록, 법인 계좌, 해외 송금. 십 년 동안 회장님을 위해 처리한 일들이 전부 내 이름으로 다시 쓰여 있다.' },
    { narr: '등 뒤에서 구두 소리가 울린다. 서두르지 않는 걸음이다.', stage: { cast: ['MUJIN'] }, sfx: 'tick' },
    { who: 'MUJIN', text: '실장님. 서류는 확인하셨습니까.' },
    { who: 'DOYUN', text: '권 실장님, 이게 뭡니까. 회장님께 먼저 보고드려야—' },
    { who: 'MUJIN', text: '오늘 이후의 일정은 없습니다.' },
    { narr: '기둥 뒤에서 두 사람이 더 걸어 나온다. 출구 쪽 셔터가 내려가는 소리가 주차장 전체를 길게 긁는다.', sfx: 'danger' },
    { who: 'DOYUN', text: '회장님은… 알고 계십니까?' },
    { who: 'MUJIN', text: '그 질문의 답은 실장님이 제일 잘 아시지 않습니까.' },
    { who: 'MUJIN', text: '이런 밤은 늘 실장님이 정리하셨으니까요.' },
    { narr: '주머니 속 휴대폰이 짧게 떨린다. 신호가 잠깐 잡힌 모양이다. 화면에 부재중 전화 한 통이 떠 있다. ‘비서실’, 2분 전.' },
    { narr: '다시 걸 틈은 없었다. 누군가 뒤에서 내 어깨를 붙잡는다. 손에서 빠져나간 휴대폰이 바닥에 부딪혀 화면이 갈라진다.', sfx: 'thud' },
    { who: 'DOYUN', mono: true, text: '십 년. 나는 지금, 누구를 위해 죽는 걸까.' },
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
    { narr: '눈을 뜬다. 형광등 불빛이 눈을 찌르고, 귓속에서 높은 소리가 멈추지 않는다.', stage: { loc: 'secretary', dizzy: true } },
    { narr: '손이 먼저 목으로 간다. 아무것도 없다. 상처도, 통증도. 셔츠 깃은 아침에 다린 그대로 빳빳하다.' },
    { narr: '책상, 모니터, 결재판. 주차장의 콘크리트 냄새와 비서실의 커피 냄새가 한데 섞이며 속이 뒤집힌다.' },
    { who: 'DOYUN', mono: true, text: '여기는… 어디지. 나는 분명히 그 주차장에서—' },
    { who: 'HAERIN', text: '실장님?', stage: { cast: ['HAERIN'] } },
    { who: 'HAERIN', text: '실장님, 제 말 들리세요?' },
    { who: 'DOYUN', mono: true, text: '실장님. 그건 직함이다. 이름이 아니다.' },
    { who: 'DOYUN', mono: true, text: '셔터 소리도, 서류의 도장도, 구두 소리도 이렇게 선명한데… 정작 내 이름이 떠오르지 않는다.' },
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
    { who: 'DOYUN', mono: true, text: '그리고 서른 날 뒤, 지하 주차장에서 죽은 사람.' },
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
    { narr: '숨을 고르고 남은 시간을 헤아린다. 서른 날. 무엇을 할 수 있는지보다, 무엇을 하지 않으면 죽는지부터.' },
    { who: 'DOYUN', mono: true, text: '도망칠 수는 없다. 내 명의로 처리된 거래와 문서가 이미 있다. 잠적하는 순간 나는 진짜 횡령범이 되고, 쫓기는 배신자가 된다.' },
    { who: 'DOYUN', mono: true, text: '시키는 대로 움직이면, 서른 날 뒤 같은 주차장에서 같은 구두 소리를 듣게 된다.' },
    { who: 'DOYUN', mono: true, text: '남은 길은 하나다. 나를 죽이는 것보다 살려 두는 편이 이득인 상황을 만드는 것.' },
    {
      card: '이번 삶의 목표',
      list: ['회장의 첫 호출에서 의심받지 않고 살아남는다', '내 이름으로 쌓이고 있는 기록의 실체를 찾는다', '누가, 왜 나를 죽였는지 밝혀낸다'],
      sub: '타인의 비밀을 알아야 살아남는다. 하지만 안다는 사실을 들키면 죽는다.',
    },
    { who: 'DOYUN', mono: true, text: '아홉 시까지 이십 분. 첫 번째 시험은 이미 시작됐다.' },
  ],
};

const HAERIN_OPEN = {
  id: 'HAERIN_OPEN',
  type: 'dialogue',
  next: 'TUTORIAL',
  stage: { loc: 'secretary', cast: ['HAERIN'], seal: ['HAERIN'] },
  lines: [
    { narr: '서해린이 서류철을 가슴 앞에 끌어안은 채 한 걸음 다가온다. 향수 대신 잉크와 식은 커피 냄새가 난다.' },
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
    { narr: '멈춰 있던 시간이 다시 흐른다. 회장의 펜이 종이를 긁는 소리.' },
    { narr: '책상 위 전화가 울리고, 회장이 수화기를 들고 창가로 돌아선다. 짧은 틈이 생겼다.' },
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

const NODES = {
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

const NODE_ORDER = ['PROLOGUE', 'RETURN', 'NAME_ENTRY', 'AWAKEN', 'HAERIN_OPEN', 'TUTORIAL', 'OFFICE_ENTER', 'MEMORY_HUB', 'PUZZLE', 'REWARD', 'DOCUMENT_ACTION', 'BOSS_01', 'BOSS_02', 'BOSS_03', 'RESULT'];

/* 사건 재도전 체크포인트: HAERIN_OPEN 이전 상태 (명세 18.2) */
const CHECKPOINT_NODE = 'HAERIN_OPEN';

/* 의심도 구간에 처음 들어설 때 덧붙는 장면 반응 (명세 13, 16.4) — 수치 외 숨은 규칙은 없습니다. */
const BAND_LINES = {
  watched: [{ narr: '복도 끝에서 무전기 잡음이 짧게 울리고 끊긴다. 누군가 이 방의 대화를 듣고 있다.' }],
  review: [
    { narr: '반투명 유리문 너머로 검은 실루엣이 멈춰 선다.', stage: { door: true }, sfx: 'danger' },
    { who: 'MUJIN', text: '회장님. 필요하시면 부르십시오.' },
  ],
};

/* 의심도 100: 대화 종료, 보안실장 호출, 암전 */
const REMOVAL_LINES = [
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

const TUTORIAL = {
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

const HUB = {
  title: '멈춘 시간',
  desc: '회장의 첫 질문 직전. 두 사람의 가슴 앞에 겹겹의 판과 나사가 떠 있다. 집중력이 허락하는 만큼만 풀어낼 수 있다.',
  finishNote: '조사를 마치면 시간이 다시 흐릅니다. 이번 사건에서는 이전 주제로 돌아올 수 없습니다.',
};

/* ------------------------------------------------------------------ */
/* 결과 (명세 17장)                                                      */
/* ------------------------------------------------------------------ */

const ENDINGS = {
  END_REMOVED: {
    id: 'END_REMOVED',
    title: '제거',
    tagline: '당신은 너무 많은 것을 알고 있다는 사실을 들켰다.',
    lines: ['회장실 문이 닫히는 소리가 마지막이었다.', '이번에는 서른 날도 남지 않았다.'],
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

const RESULT_COMMON = {
  daysLine: '죽음까지 남은 날 29일. 예정된 그날은 아직 그대로다.',
  nextCaseNote: '다음 사건(D-29)은 아직 준비 중입니다. 남은 아이템은 저장되어 있습니다.',
};

return { CASE_ID, CASE_INFO, CHARACTERS, SPEAKER_LABEL, CLUES, EVIDENCE, TOPICS, TOPIC_ORDER, NODES, NODE_ORDER, CHECKPOINT_NODE, BAND_LINES, REMOVAL_LINES, TUTORIAL, HUB, ENDINGS, RESULT_COMMON };
});

/* ===== src/data/config.js ===== */
__define("src/data/config.js", function (__require) {
/*
 * 언스크류(UNCREW) — 게임 규칙 수치 (명세 11~13장)
 * 수치는 테스트 후 조정할 수 있도록 한곳에 모았습니다.
 */

const SCHEMA_VERSION = 2; // 2: 주인공 이름(run.player) 추가
const PROJECT = { title: '언스크류', titleEn: 'UNCREW', copy: '풀수록, 더 깊이 얽힌다.' };

const INITIAL_RUN = {
  suspicion: 20,
  trust: { HAERIN: 50 },
  focus: 4,
  daysRemaining: 30,
};

const ITEM_IDS = ['undo', 'temp_hole', 'magnifier', 'rehearsal'];

const ITEMS = {
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

const DEPTH_LABEL = { 1: '표면', 2: '중층', 3: '심층' };

const DIFFICULTIES = {
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

const SUSPICION_BANDS = [
  { id: 'normal', min: 0, max: 39, label: '정상 업무', icon: 'dot' },
  { id: 'watched', min: 40, max: 69, label: '관찰 대상', icon: 'eye' },
  { id: 'review', min: 70, max: 99, label: '제거 검토', icon: 'warn' },
  { id: 'removed', min: 100, max: 100, label: '제거 결정', icon: 'x' },
];

function suspicionBand(value) {
  return SUSPICION_BANDS.find((b) => value >= b.min && value <= b.max) || SUSPICION_BANDS[0];
}

function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

return { SCHEMA_VERSION, PROJECT, INITIAL_RUN, ITEM_IDS, ITEMS, DEPTH_LABEL, DIFFICULTIES, SUSPICION_BANDS, suspicionBand, clamp };
});

/* ===== src/data/puzzles.js ===== */
__define("src/data/puzzles.js", function (__require) {
/*
 * 언스크류(UNCREW) — 검증된 초기 퍼즐 데이터 (명세 부록 A 원본)
 *
 * 좌표계: 640×640, 왼쪽 위 원점.
 * 해결 이동 수: 쉬움 4회 / 보통 8회 / 어려움 12회 (최단 해법 증명은 아님).
 * 본편 네 기억 주제는 아래 세 지형을 공통으로 사용하고, 단서와 판 제거 연출 문구만 주제별로 바꿉니다.
 * 지형을 바꾸면 tests/puzzle.test.js의 해법 재생 검증을 다시 통과해야 합니다.
 */

const PUZZLES = [
  {
    id: "SCREW_EASY_01",
    difficulty: "easy",
    size: [640, 640],
    moveLimit: 8,
    holes: [
      { id: "a", x: 120, y: 180 },
      { id: "b", x: 520, y: 180 },
      { id: "c", x: 320, y: 180 },
      { id: "d", x: 320, y: 480 },
      { id: "g", x: 120, y: 80 },
      { id: "h", x: 520, y: 80 },
    ],
    screws: ["a", "b", "c", "d"],
    plates: [
      { id: "A", z: 2, rect: [80, 150, 480, 60], anchorHoles: ["a", "b"], blockedHoles: ["c"] },
      { id: "B", z: 1, rect: [290, 150, 60, 360], anchorHoles: ["c", "d"], blockedHoles: [] },
    ],
    // 개발 검증용 해법. 일반 플레이 UI에는 표시하지 않습니다.
    solution: [["a", "g"], ["b", "h"], ["c", "a"], ["d", "b"]],
  },
  {
    id: "SCREW_NORMAL_01",
    difficulty: "normal",
    size: [640, 640],
    moveLimit: 14,
    holes: [
      { id: "a", x: 120, y: 180 },
      { id: "b", x: 520, y: 180 },
      { id: "c", x: 280, y: 180 },
      { id: "d", x: 280, y: 440 },
      { id: "e", x: 120, y: 440 },
      { id: "f", x: 520, y: 440 },
      { id: "i", x: 280, y: 320 },
      { id: "j", x: 520, y: 320 },
      { id: "g", x: 120, y: 80 },
      { id: "h", x: 520, y: 80 },
      { id: "k", x: 320, y: 80 },
    ],
    screws: ["a", "b", "c", "d", "e", "f", "i", "j"],
    plates: [
      { id: "A", z: 4, rect: [80, 150, 480, 60], anchorHoles: ["a", "b"], blockedHoles: ["c"] },
      { id: "B", z: 3, rect: [250, 150, 60, 320], anchorHoles: ["c", "d"], blockedHoles: ["i"] },
      { id: "C", z: 1, rect: [80, 410, 480, 60], anchorHoles: ["e", "d", "f"], blockedHoles: [] },
      { id: "D", z: 2, rect: [250, 290, 300, 60], anchorHoles: ["i", "j"], blockedHoles: [] },
    ],
    // 개발 검증용 해법. 일반 플레이 UI에는 표시하지 않습니다.
    solution: [["a", "g"], ["b", "h"], ["c", "k"], ["d", "a"], ["e", "b"], ["f", "c"], ["i", "d"], ["j", "e"]],
  },
  {
    id: "SCREW_HARD_01",
    difficulty: "hard",
    size: [640, 640],
    moveLimit: 20,
    holes: [
      { id: "a", x: 120, y: 180 },
      { id: "b", x: 520, y: 180 },
      { id: "u", x: 320, y: 180 },
      { id: "c", x: 240, y: 180 },
      { id: "d", x: 240, y: 440 },
      { id: "e", x: 120, y: 440 },
      { id: "f", x: 520, y: 440 },
      { id: "i", x: 240, y: 320 },
      { id: "j", x: 520, y: 320 },
      { id: "n", x: 440, y: 320 },
      { id: "k", x: 440, y: 180 },
      { id: "l", x: 440, y: 500 },
      { id: "m", x: 440, y: 440 },
      { id: "g", x: 120, y: 80 },
      { id: "h", x: 520, y: 80 },
      { id: "v", x: 320, y: 80 },
    ],
    screws: ["a", "b", "u", "c", "d", "e", "f", "i", "j", "n", "k", "l"],
    plates: [
      { id: "A", z: 5, rect: [80, 150, 480, 60], anchorHoles: ["a", "b", "u"], blockedHoles: ["c", "k"] },
      { id: "B", z: 3, rect: [210, 150, 60, 320], anchorHoles: ["c", "d"], blockedHoles: ["i"] },
      { id: "C", z: 1, rect: [80, 410, 480, 60], anchorHoles: ["e", "d", "f"], blockedHoles: ["m"] },
      { id: "D", z: 2, rect: [210, 290, 340, 60], anchorHoles: ["i", "n", "j"], blockedHoles: [] },
      { id: "E", z: 4, rect: [410, 150, 60, 380], anchorHoles: ["k", "l"], blockedHoles: ["n", "m"] },
    ],
    // 개발 검증용 해법. 일반 플레이 UI에는 표시하지 않습니다.
    solution: [["a", "g"], ["b", "h"], ["u", "v"], ["k", "a"], ["l", "b"], ["c", "k"], ["d", "l"], ["e", "c"], ["f", "u"], ["i", "e"], ["n", "f"], ["j", "d"]],
  },
];

// 튜토리얼 보드: 쉬움 지형을 그대로 쓰되 일반 조사와 다른 ID를 사용합니다. (명세 10.5)
const easy = PUZZLES.find((b) => b.id === 'SCREW_EASY_01');
const TUTORIAL_BOARD = {
  ...structuredClone(easy),
  id: 'TUTORIAL_EASY_01',
  difficulty: 'tutorial',
};

const BOARD_BY_DIFFICULTY = {
  easy: 'SCREW_EASY_01',
  normal: 'SCREW_NORMAL_01',
  hard: 'SCREW_HARD_01',
};

function getBoard(boardId) {
  if (boardId === TUTORIAL_BOARD.id) return TUTORIAL_BOARD;
  return PUZZLES.find((b) => b.id === boardId) || null;
}

return { PUZZLES, TUTORIAL_BOARD, BOARD_BY_DIFFICULTY, getBoard };
});

/* ===== src/core/conditions.js ===== */
__define("src/core/conditions.js", function (__require) {
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

const CONDITION_KEYS = ['all', 'any', 'not', 'clue', 'evidence', 'flag', 'trustAtLeast', 'suspicionAtLeast', 'suspicionAtMost'];

function evaluate(cond, run) {
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
function collectRefs(cond, out = { clues: [], evidence: [], flags: [], trust: [], unknown: [] }) {
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

return { CONDITION_KEYS, evaluate, collectRefs };
});

/* ===== src/core/names.js ===== */
__define("src/core/names.js", function (__require) {
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

const DEFAULT_PLAYER = { surname: '한', given: '도윤' };

const COMPOUND_SURNAMES = ['남궁', '황보', '제갈', '선우', '독고', '사공', '서문', '동방'];

const BLOCKED_SURNAMES = { 차: '차씨는 회장 일가의 성이라 혈연으로 읽힙니다. 다른 성을 골라 주세요.' };

/** 다른 등장인물 (명세 4장) */
const CAST_NAMES = [
  ['차', '태건'],
  ['서', '해린'],
  ['차', '유라'],
  ['윤', '서진'],
  ['백', '리아'],
  ['차', '도혁'],
  ['권', '무진'],
];

/** 호칭·직함·대명사로 읽혀 대사가 어색해지는 이름 */
const RESERVED_GIVEN = ['회장', '실장', '사장', '부장', '과장', '대리', '비서', '보안', '본부', '임원', '직원', '당신', '자네', '우리', '저희', '누구', '아무', '그대', '이름', '주인', '선생', '아빠', '엄마'];

const PROFANITY = ['시발', '씨발', '씨빨', '병신', '븅신', '개새', '새끼', '좆', '존나', '지랄', '미친', '닥쳐', '꺼져', '섹스', '창녀', '걸레', '애미', '애비', '느금'];

const HANGUL_RE = /^[가-힣]+$/;

const NAME_RULE_TEXT = '한글만 · 성 1자(남궁·황보 같은 복성은 2자) · 이름 2자';

/**
 * 이름 검사. 공백은 앞뒤만 정리하고, 중간 공백은 오류로 봅니다.
 * @returns {{ ok: boolean, errors: string[], player: {surname, given} }}
 */
function validatePlayerName(input) {
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

function hasBatchim(word) {
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
const JOSA = {
  아: ['아', '야'],
  이: ['이', '가'],
  은: ['은', '는'],
  을: ['을', '를'],
  과: ['과', '와'],
  으로: ['으로', '로'],
  이랑: ['이랑', '랑'],
  이에요: ['이에요', '예요'],
};

function josa(word, key) {
  const pair = JOSA[key];
  if (!pair) throw new Error(`알 수 없는 조사: ${key}`);
  if (key === '으로' && hasRieulBatchim(word)) return '로';
  return hasBatchim(word) ? pair[0] : pair[1];
}

/* ------------------------------ 대본 치환 ------------------------------ */

const TOKEN_RE = /\{(name|surname|fullname)(?::([가-힣]+))?\}/g;
const ANY_BRACE_RE = /\{[^}]*\}/g;

function playerParts(player) {
  const p = player || DEFAULT_PLAYER;
  return { name: p.given, surname: p.surname, fullname: p.surname + p.given };
}

/** 대본의 이름 자리 표시를 실제 이름으로 바꿉니다. */
function formatText(text, player) {
  if (!text || !String(text).includes('{')) return text;
  const parts = playerParts(player);
  return String(text).replace(TOKEN_RE, (_m, key, j) => {
    const word = parts[key];
    return j ? word + josa(word, j) : word;
  });
}

/** 콘텐츠 검증용: 지원하지 않는 자리 표시 목록 */
function invalidTokens(text) {
  const bad = [];
  for (const m of String(text ?? '').match(ANY_BRACE_RE) || []) {
    const re = /^\{(name|surname|fullname)(?::([가-힣]+))?\}$/;
    const mm = m.match(re);
    if (!mm || (mm[2] && !JOSA[mm[2]])) bad.push(m);
  }
  return bad;
}

function hasTokens(text) {
  return /\{(name|surname|fullname)/.test(String(text ?? ''));
}

return { DEFAULT_PLAYER, COMPOUND_SURNAMES, BLOCKED_SURNAMES, CAST_NAMES, RESERVED_GIVEN, NAME_RULE_TEXT, validatePlayerName, hasBatchim, JOSA, josa, TOKEN_RE, playerParts, formatText, invalidTokens, hasTokens };
});

/* ===== src/core/validate.js ===== */
__define("src/core/validate.js", function (__require) {
/*
 * 언스크류(UNCREW) — 콘텐츠 로딩 검증 (명세 19.3)
 * 문자열·숫자 누락, 미등록 ID, 중복 ID를 찾아 오류 목록으로 돌려줍니다.
 * 콘텐츠 데이터에 없는 조건이나 결과를 만들어 채우지 않습니다.
 */
const { collectRefs } = __require("src/core/conditions.js");
const { invalidTokens, hasTokens } = __require("src/core/names.js");

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function validateBoards(boards) {
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

function validateContent(content) {
  const { NODES, NODE_ORDER, CLUES, EVIDENCE, TOPICS, DIFFICULTIES, ITEMS, CHARACTERS, ENDINGS, SPEAKER_LABEL, boards } = content;
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
  // 이름을 떠올리기 전 장면에는 이름 자리 표시를 쓸 수 없습니다.
  const nameIdx = NODE_ORDER ? NODE_ORDER.indexOf('NAME_ENTRY') : -1;
  const checkLines = (lines, where, nodeId) => {
    const beforeName = nodeId && nameIdx >= 0 && NODE_ORDER.indexOf(nodeId) < nameIdx;
    (lines || []).forEach((ln, i) => {
      if (ln.who && !isStr(ln.text)) errors.push(`${where}[${i}]: 대사 text 누락`);
      if (ln.who && SPEAKER_LABEL && !SPEAKER_LABEL[ln.who]) errors.push(`${where}[${i}]: 미등록 화자 ${ln.who}`);
      if (!ln.who && !ln.narr && !ln.card && !ln.fx) errors.push(`${where}[${i}]: 빈 줄`);
      for (const t of [ln.text, ln.narr, ln.sub, ...(ln.list || [])]) {
        invalidTokens(t).forEach((b) => errors.push(`${where}[${i}]: 지원하지 않는 자리 표시 ${b}`));
        if (beforeName && hasTokens(t)) errors.push(`${where}[${i}]: 이름을 떠올리기 전 장면에 이름 자리 표시`);
      }
    });
  };
  const checkText = (t, where) => invalidTokens(t).forEach((b) => errors.push(`${where}: 지원하지 않는 자리 표시 ${b}`));
  Object.values(CLUES).forEach((c) => checkText(c.text, `clue ${c.id}`));
  Object.values(CHARACTERS).forEach((c) => checkText(`${c.name} ${c.note}`, `character ${c.id}`));
  Object.values(TOPICS).forEach((t) => checkText(t.fragment, `topic ${t.id}`));

  for (const [k, n] of Object.entries(NODES)) {
    if (n.id !== k) errors.push(`node ${k}: id 불일치`);
    if (n.next && !nodeIds.has(n.next)) errors.push(`node ${k}: 미등록 다음 노드 ${n.next}`);
    checkLines(n.lines, `node ${k}.lines`, k);
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

return { validateBoards, validateContent };
});

/* ===== src/core/puzzleEngine.js ===== */
__define("src/core/puzzleEngine.js", function (__require) {
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

const TEMP_HOLE_ID = 'T';

const REASONS = {
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

function createPuzzleState(board) {
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
function holeIds(board, state) {
  const ids = board.holes.map((h) => h.id);
  if (state.tempHole) ids.push(TEMP_HOLE_ID);
  return ids;
}

function isRegisteredHole(board, state, id) {
  if (id === TEMP_HOLE_ID) return !!state.tempHole;
  return board.holes.some((h) => h.id === id);
}

/** 활성 판의 blockedHoles에 포함되면 가려진 구멍입니다. 임시 구멍은 어떤 판에도 가려지지 않습니다. */
function isBlocked(board, state, holeId) {
  if (holeId === TEMP_HOLE_ID) return false;
  return state.activePlates.some((pid) => plateById(board, pid).blockedHoles.includes(holeId));
}

function hasScrew(state, holeId) {
  return state.screws.includes(holeId);
}

/** 판을 지지하는 나사 수. 여러 판이 같은 anchorHole을 공유할 수 있습니다. 임시 구멍은 어떤 판도 지지하지 않습니다. */
function supportCount(board, state, plateId) {
  const plate = plateById(board, plateId);
  return plate.anchorHoles.filter((h) => state.screws.includes(h)).length;
}

/** 명세 10.3의 이동 가능 조건 1~6 */
function checkMove(board, state, src, dst) {
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
function canSelect(board, state, holeId) {
  if (state.status !== 'playing') return false;
  if (!isRegisteredHole(board, state, holeId)) return false;
  return hasScrew(state, holeId) && !isBlocked(board, state, holeId);
}

function validDestinations(board, state, src) {
  return holeIds(board, state).filter((dst) => checkMove(board, state, src, dst).ok);
}

function listValidMoves(board, state) {
  const out = [];
  for (const src of state.screws) {
    for (const dst of holeIds(board, state)) {
      if (checkMove(board, state, src, dst).ok) out.push([src, dst]);
    }
  }
  return out;
}

function hasAnyValidMove(board, state) {
  return listValidMoves(board, state).length > 0;
}

function snapshot(state) {
  return { screws: [...state.screws], activePlates: [...state.activePlates], moves: state.moves };
}

/**
 * 나사 이동. 동작 순서(명세 10.3):
 * undo 기록 저장 → 나사 이동 → 이동 횟수 +1 → 지지 0인 판 모두 제거 → 클리어 판정 → 이동 한도 판정
 */
function applyMove(board, state, src, dst) {
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
function applyUndo(board, state) {
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
function applyTempHole(board, state) {
  if (state.status === 'cleared') return { ok: false, reason: REASONS.ALREADY_CLEARED, state };
  if (state.tempHole) return { ok: false, reason: REASONS.TEMP_HOLE_USED, state };
  return { ok: true, state: { ...state, tempHole: true, undoStack: [] } };
}

/** 보드 재도전: 초기 배치로 복원합니다. 임시 나사함 효과는 유지하되 비워 둡니다. */
function resetPuzzle(board, state) {
  return {
    ...createPuzzleState(board),
    tempHole: state.tempHole,
  };
}

/**
 * 논리 좌표(640×640)에서 가장 가까운 "보이는" 구멍을 찾습니다.
 * 가려진 구멍은 후보에서 빼서 판 아래의 정보를 입력으로 노출하지 않습니다.
 */
function pickHole(board, state, x, y, radius = 48) {
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
function plateAt(board, state, x, y) {
  let top = null;
  for (const pid of state.activePlates) {
    const p = plateById(board, pid);
    const [px, py, w, h] = p.rect;
    if (x >= px && x <= px + w && y >= py && y <= py + h && (!top || p.z > top.z)) top = p;
  }
  return top ? top.id : null;
}

/** 저장된 퍼즐 상태가 보드 데이터와 맞는지 검사합니다. 문제 목록을 돌려줍니다. */
function validatePuzzleState(board, state) {
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

return { TEMP_HOLE_ID, REASONS, createPuzzleState, holeIds, isRegisteredHole, isBlocked, hasScrew, supportCount, checkMove, canSelect, validDestinations, listValidMoves, hasAnyValidMove, applyMove, applyUndo, applyTempHole, resetPuzzle, pickHole, plateAt, validatePuzzleState };
});

/* ===== src/core/save.js ===== */
__define("src/core/save.js", function (__require) {
/*
 * 언스크류(UNCREW) — 저장 서비스와 로컬 이벤트 로그 (명세 18장, 19.5)
 *
 * - RunState(이번 시도), PuzzleState(run.activePuzzle), MetaState(도감·엔딩·설정)를 한 키에 한 번에 씁니다.
 *   localStorage.setItem 한 번이 원자적이므로 "보상은 남고 보드만 미완료" 같은 반쪽 상태가 생기지 않습니다.
 * - 저장 실패 시 예외를 밖으로 던지지 않고 결과만 돌려줍니다. 게임은 메모리 상태로 계속 진행합니다.
 * - 깨진 저장은 별도 키로 보관하고 새 게임을 안내합니다. 잘못된 수치로 조용히 복원하지 않습니다.
 */
const { SCHEMA_VERSION, ITEM_IDS } = __require("src/data/config.js");
const { NODES, NODE_ORDER, CLUES, EVIDENCE, TOPICS, ENDINGS } = __require("src/data/case01.js");
const { validatePlayerName, DEFAULT_PLAYER } = __require("src/core/names.js");
const { getBoard } = __require("src/data/puzzles.js");
const { validatePuzzleState } = __require("src/core/puzzleEngine.js");

const SAVE_KEY = 'uncrew.save.v1';
const LOG_KEY = 'uncrew.log.v1';
const CORRUPT_PREFIX = 'uncrew.save.corrupt.';

/** 테스트와 저장소 접근이 막힌 환경에서 쓰는 메모리 저장소 */
function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    keys: () => [...map.keys()],
    _map: map,
  };
}

/** 브라우저 localStorage. 접근 자체가 막혀 있으면 null */
function browserStorage() {
  try {
    const s = globalThis.localStorage;
    const probe = '__uncrew_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const isInt = (v) => Number.isInteger(v);

/**
 * 이전 저장 형식을 현재 형식으로 바꿉니다. 바꿀 수 없으면 그대로 돌려주고 검증에서 걸러집니다.
 * v1 → v2: 주인공 이름(run.player)이 생겼습니다. v1은 이름이 '한도윤'으로 고정되어 있었으므로,
 * 이름을 떠올리는 장면을 이미 지난 진행에는 기본 이름을 넣습니다.
 */
function migrateSaveData(data) {
  if (!data || typeof data !== 'object') return data;
  if (data.schemaVersion === 1) {
    const out = { ...data, schemaVersion: 2 };
    out.meta = { ...(data.meta || {}), lastPlayer: null };
    if (data.run && typeof data.run === 'object') {
      const before = ['PROLOGUE', 'RETURN'].includes(data.run.nodeId);
      out.run = { ...data.run, schemaVersion: 2, player: before ? null : { ...DEFAULT_PLAYER } };
    }
    return out;
  }
  return data;
}
const inRange = (v, lo, hi) => isInt(v) && v >= lo && v <= hi;

/** 저장 데이터 스키마 검증. 문제 목록을 돌려줍니다. */
function validateSaveData(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['not an object'];
  if (data.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion ${data.schemaVersion}`);
  const meta = data.meta;
  if (!meta || typeof meta !== 'object') errors.push('meta missing');
  else {
    if (!Array.isArray(meta.codex) || meta.codex.some((c) => !CLUES[c])) errors.push('meta.codex');
    if (!Array.isArray(meta.endingsSeen) || meta.endingsSeen.some((e) => !ENDINGS[e])) errors.push('meta.endingsSeen');
    if (typeof meta.tutorialSeen !== 'boolean') errors.push('meta.tutorialSeen');
    if (!meta.settings || typeof meta.settings !== 'object') errors.push('meta.settings');
    if (meta.lastPlayer != null && !validatePlayerName(meta.lastPlayer).ok) errors.push('meta.lastPlayer');
  }
  const run = data.run;
  if (run === null || run === undefined) return errors;
  if (typeof run !== 'object') return [...errors, 'run not object'];
  if (run.schemaVersion !== SCHEMA_VERSION) errors.push('run.schemaVersion');
  if (typeof run.runId !== 'string' || !run.runId) errors.push('run.runId');
  if (run.caseId !== 'CASE_01') errors.push('run.caseId');
  if (!NODES[run.nodeId]) errors.push('run.nodeId');
  if (run.player != null && !validatePlayerName(run.player).ok) errors.push('run.player');
  if (run.player == null && NODE_ORDER.indexOf(run.nodeId) > NODE_ORDER.indexOf('NAME_ENTRY')) errors.push('run.player missing');
  if (!inRange(run.suspicion, 0, 100)) errors.push('run.suspicion');
  if (!run.trust || !inRange(run.trust.HAERIN, 0, 100)) errors.push('run.trust');
  if (!inRange(run.focus, 0, 4)) errors.push('run.focus');
  if (!inRange(run.daysRemaining, 0, 30)) errors.push('run.daysRemaining');
  if (!Array.isArray(run.clues) || run.clues.some((c) => !CLUES[c])) errors.push('run.clues');
  if (!Array.isArray(run.evidence) || run.evidence.some((e) => !EVIDENCE[e])) errors.push('run.evidence');
  if (!run.flags || typeof run.flags !== 'object') errors.push('run.flags');
  if (!Array.isArray(run.rewardClaims) || run.rewardClaims.some((k) => typeof k !== 'string')) errors.push('run.rewardClaims');
  if (!run.inventory || ITEM_IDS.some((i) => !inRange(run.inventory[i], 0, 99))) errors.push('run.inventory');
  if (!run.topicAttempts || typeof run.topicAttempts !== 'object') errors.push('run.topicAttempts');
  else {
    for (const [t, a] of Object.entries(run.topicAttempts)) {
      if (!TOPICS[t]) errors.push(`run.topicAttempts.${t}`);
      if (!['in_progress', 'completed', 'abandoned'].includes(a?.status)) errors.push(`run.topicAttempts.${t}.status`);
    }
  }
  if (!run.choices || typeof run.choices !== 'object') errors.push('run.choices');
  if (!run.marks || typeof run.marks.magnifier !== 'object' || typeof run.marks.rehearsal !== 'object') errors.push('run.marks');
  if (!Array.isArray(run.bandsShown)) errors.push('run.bandsShown');
  if (typeof run.investigationClosed !== 'boolean') errors.push('run.investigationClosed');
  if (run.nodeId === 'PUZZLE' && !run.activePuzzle) errors.push('PUZZLE without activePuzzle');
  if (run.nodeId === 'REWARD' && !run.lastReward) errors.push('REWARD without lastReward');
  if (run.nodeId === 'RESULT' && !run.result) errors.push('RESULT without result');
  if (run.activePuzzle) {
    const p = run.activePuzzle;
    const board = getBoard(p.boardId);
    const perr = validatePuzzleState(board, p);
    errors.push(...perr.map((e) => `activePuzzle: ${e}`));
    if (p.kind === 'topic' && !TOPICS[p.topicId]) errors.push('activePuzzle.topicId');
    if (!['topic', 'tutorial'].includes(p.kind)) errors.push('activePuzzle.kind');
  }
  return errors;
}

class SaveService {
  constructor(storage) {
    this.storage = storage;
  }

  get available() {
    return !!this.storage;
  }

  save(data) {
    if (!this.storage) return { ok: false, error: 'storage unavailable' };
    try {
      const payload = JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION, savedAt: Date.now() });
      this.storage.setItem(SAVE_KEY, payload);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    }
  }

  load() {
    if (!this.storage) return { status: 'empty' };
    let raw;
    try {
      raw = this.storage.getItem(SAVE_KEY);
    } catch (err) {
      return { status: 'error', error: String(err) };
    }
    if (raw == null) return { status: 'empty' };
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return this.quarantine(raw, ['JSON parse error']);
    }
    data = migrateSaveData(data);
    const errors = validateSaveData(data);
    if (errors.length) return this.quarantine(raw, errors);
    return { status: 'ok', data };
  }

  /** 깨진 저장을 별도 키로 옮겨 두고 원래 키를 비웁니다. */
  quarantine(raw, errors) {
    const backupKey = CORRUPT_PREFIX + Date.now();
    try {
      this.storage.setItem(backupKey, raw);
      this.storage.removeItem(SAVE_KEY);
    } catch {
      /* 보관에 실패해도 원본은 건드리지 않습니다 */
    }
    return { status: 'corrupt', backupKey, errors };
  }

  clear() {
    try {
      this.storage?.removeItem(SAVE_KEY);
    } catch {
      /* noop */
    }
  }
}

/** 외부로 전송하지 않는 로컬 플레이 로그. 디버그와 수치 조정용입니다. */
class EventLog {
  constructor(storage, { max = 400, now = () => Date.now() } = {}) {
    this.storage = storage;
    this.max = max;
    this.now = now;
    this.items = [];
    this.listeners = new Set();
    try {
      const raw = storage?.getItem(LOG_KEY);
      if (raw) this.items = JSON.parse(raw).slice(-max);
    } catch {
      this.items = [];
    }
  }

  add(type, data = {}) {
    const entry = { t: this.now(), type, ...data };
    this.items.push(entry);
    if (this.items.length > this.max) this.items.splice(0, this.items.length - this.max);
    try {
      this.storage?.setItem(LOG_KEY, JSON.stringify(this.items));
    } catch {
      /* 로그 저장 실패는 무시합니다 */
    }
    this.listeners.forEach((fn) => fn(entry));
    return entry;
  }

  list() {
    return this.items;
  }

  clear() {
    this.items = [];
    try {
      this.storage?.removeItem(LOG_KEY);
    } catch {
      /* noop */
    }
  }
}

return { SAVE_KEY, LOG_KEY, CORRUPT_PREFIX, createMemoryStorage, browserStorage, migrateSaveData, validateSaveData, SaveService, EventLog };
});

/* ===== src/core/game.js ===== */
__define("src/core/game.js", function (__require) {
/*
 * 언스크류(UNCREW) — 게임 상태 컨트롤러
 *
 * 명세 19.1의 책임 분리를 한 파일 안에서 구역으로 나눴습니다.
 *   GameState      : 상태 생성과 원자적 변경(commit)
 *   DialogueEngine : 조건 평가 · 효과 적용 · 다음 노드
 *   RewardService  : 단서·아이템 지급과 중복 방지
 *   PuzzleEngine   : puzzleEngine.js 호출 (이동·undo·클리어 판정)
 *   SaveService    : save.js
 *
 * UI는 이 컨트롤러의 메서드만 호출합니다. 모든 메서드는 { ok, reason, ... }을 돌려주고,
 * 거절된 호출은 상태·이동 횟수·집중력·아이템을 바꾸지 않습니다.
 */
const { INITIAL_RUN, ITEM_IDS, DIFFICULTIES, SCHEMA_VERSION, clamp, suspicionBand } = __require("src/data/config.js");
const { CASE_ID, NODES, CLUES, TOPICS, CHECKPOINT_NODE } = __require("src/data/case01.js");
const { getBoard, TUTORIAL_BOARD } = __require("src/data/puzzles.js");
const { evaluate } = __require("src/core/conditions.js");
const PE = __require("src/core/puzzleEngine.js");
const { SaveService, EventLog } = __require("src/core/save.js");
const { validatePlayerName, DEFAULT_PLAYER } = __require("src/core/names.js");

const R = {
  BAD_NODE: 'BAD_NODE',
  ALREADY_CHOSEN: 'ALREADY_CHOSEN',
  REACTION_PENDING: 'REACTION_PENDING',
  UNKNOWN_CHOICE: 'UNKNOWN_CHOICE',
  LOCKED: 'LOCKED',
  NO_RUN: 'NO_RUN',
  TOPIC_USED: 'TOPIC_USED',
  NO_FOCUS: 'NO_FOCUS',
  UNKNOWN_TOPIC: 'UNKNOWN_TOPIC',
  UNKNOWN_DIFFICULTY: 'UNKNOWN_DIFFICULTY',
  INVESTIGATION_CLOSED: 'INVESTIGATION_CLOSED',
  NO_PUZZLE: 'NO_PUZZLE',
  PUZZLE_ACTIVE: 'PUZZLE_ACTIVE',
  NO_ITEM: 'NO_ITEM',
  NO_TARGET: 'NO_TARGET',
  TUTORIAL_NO_ITEMS: 'TUTORIAL_NO_ITEMS',
  NOT_CLEARED: 'NOT_CLEARED',
  BAD_NAME: 'BAD_NAME',
};

const emptyInventory = () => Object.fromEntries(ITEM_IDS.map((i) => [i, 0]));

function createMeta() {
  return {
    codex: [],
    evidenceSeen: [],
    endingsSeen: [],
    tutorialSeen: false,
    runsStarted: 0,
    lastPlayer: null,
    settings: { muted: false, textSpeed: 'normal', debug: false },
  };
}

function createRun({ runId, nodeId, now, player = null }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    runId,
    player: player ? { surname: player.surname, given: player.given } : null,
    caseId: CASE_ID,
    nodeId,
    daysRemaining: INITIAL_RUN.daysRemaining,
    suspicion: INITIAL_RUN.suspicion,
    trust: { ...INITIAL_RUN.trust },
    focus: INITIAL_RUN.focus,
    clues: [],
    evidence: [],
    flags: {},
    topicAttempts: {},
    inventory: emptyInventory(),
    rewardClaims: [],
    choices: {},
    pendingReaction: null,
    lastReward: null,
    marks: { magnifier: {}, rehearsal: {} },
    investigationClosed: false,
    bandsShown: [],
    result: null,
    startedAt: now,
    endedAt: null,
    activePuzzle: null,
  };
}

function defaultRunId() {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `run-${Date.now().toString(36)}-${rnd}`;
}

/** 선택지의 결과(조건부 결과가 있으면 첫 번째로 맞는 것) */
function pickOutcome(choice, run) {
  if (!choice.outcomes) return { id: 'DEFAULT', effects: choice.effects, reaction: choice.reaction };
  return choice.outcomes.find((o) => evaluate(o.when, run));
}

function isChoiceEnabled(choice, run) {
  return evaluate(choice.requires, run);
}

function rewardKey(run, topicId) {
  return `${run.runId}+${run.caseId}+${topicId}`;
}

function computeEnding(run) {
  if (run.suspicion >= 100) return 'END_REMOVED';
  const deep =
    run.suspicion <= 35 &&
    (run.trust.HAERIN ?? 0) >= 55 &&
    run.evidence.includes('DOC_LIST') &&
    run.flags.F_PRESERVE_RECORD === true;
  if (deep) return 'END_ADVANTAGE';
  if (run.suspicion >= 70) return 'END_WATCHED';
  return 'END_SURVIVED';
}

class Game {
  constructor({ storage = null, now = () => Date.now(), makeRunId = defaultRunId } = {}) {
    this.now = now;
    this.makeRunId = makeRunId;
    this.saver = new SaveService(storage);
    this.log = new EventLog(storage, { now });
    this.state = { schemaVersion: SCHEMA_VERSION, run: null, meta: createMeta() };
    this.loadIssue = null;
    this.lastSaveError = null;
    this.listeners = new Set();
    this.loadFromStorage();
  }

  /* ----------------------------- GameState ----------------------------- */

  get run() {
    return this.state.run;
  }

  get meta() {
    return this.state.meta;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  loadFromStorage() {
    const res = this.saver.load();
    if (res.status === 'ok') {
      this.state = { schemaVersion: SCHEMA_VERSION, run: res.data.run ?? null, meta: { ...createMeta(), ...res.data.meta } };
      this.state.meta.settings = { ...createMeta().settings, ...res.data.meta.settings };
      this.log.add('save_loaded', { runId: this.run?.runId ?? null, nodeId: this.run?.nodeId ?? null });
    } else if (res.status === 'corrupt') {
      this.loadIssue = { kind: 'corrupt', backupKey: res.backupKey, errors: res.errors };
      this.log.add('save_error', { phase: 'load', backupKey: res.backupKey, errors: res.errors.slice(0, 5) });
    } else if (res.status === 'error') {
      this.loadIssue = { kind: 'error', error: res.error };
      this.log.add('save_error', { phase: 'load', error: res.error });
    }
    return res.status;
  }

  hasContinue() {
    return !!this.run;
  }

  /** 상태 변경을 한 번에 저장합니다. 실패해도 메모리 상태로 계속 진행합니다. */
  commit() {
    const res = this.saver.save({ run: this.state.run, meta: this.state.meta });
    if (!res.ok) {
      this.lastSaveError = res.error;
      this.log.add('save_error', { phase: 'save', error: res.error });
    } else {
      this.lastSaveError = null;
    }
    this.listeners.forEach((fn) => fn(this.state, res));
    return res;
  }

  /* ----------------------------- 시작 · 재도전 ----------------------------- */

  newGame() {
    const runId = this.makeRunId();
    this.state.run = createRun({ runId, nodeId: 'PROLOGUE', now: this.now() });
    this.meta.runsStarted += 1;
    this.loadIssue = null;
    this.log.add('case_start', { runId, caseId: CASE_ID, from: 'new_game' });
    this.commit();
    return { ok: true };
  }

  /** 사건 재도전: HAERIN_OPEN 이전 상태로. 도감·엔딩 기록은 유지하고 이번 시도 기록은 모두 초기화합니다. */
  retryCase() {
    const runId = this.makeRunId();
    // 이름은 사건 재도전에서도 유지합니다. (재도전은 이름을 떠올린 이후 시점부터 시작)
    const player = this.run?.player || this.meta.lastPlayer || DEFAULT_PLAYER;
    this.state.run = createRun({ runId, nodeId: CHECKPOINT_NODE, now: this.now(), player });
    this.meta.runsStarted += 1;
    this.log.add('case_start', { runId, caseId: CASE_ID, from: 'retry' });
    this.commit();
    return { ok: true };
  }

  resetAllData() {
    this.saver.clear();
    this.log.clear();
    this.state = { schemaVersion: SCHEMA_VERSION, run: null, meta: createMeta() };
    this.loadIssue = null;
    this.commit();
  }

  updateSettings(patch) {
    Object.assign(this.meta.settings, patch);
    this.commit();
  }

  node() {
    return this.run ? NODES[this.run.nodeId] : null;
  }

  /** 단순 장면(scene)의 마지막 줄 이후 다음 노드로 */
  advance() {
    const run = this.run;
    if (!run) return { ok: false, reason: R.NO_RUN };
    const node = NODES[run.nodeId];
    if (node.type !== 'scene') return { ok: false, reason: R.BAD_NODE };
    run.nodeId = node.next;
    this.commit();
    return { ok: true, nodeId: run.nodeId };
  }

  /* ----------------------------- 이름 입력 ----------------------------- */

  /** 회귀 직후 이름을 떠올리는 장면. 규칙에 맞는 이름만 받습니다. (core/names.js) */
  setPlayerName(input) {
    const run = this.run;
    if (!run || NODES[run.nodeId].type !== 'name') return { ok: false, reason: R.BAD_NODE };
    const res = validatePlayerName(input);
    if (!res.ok) return { ok: false, reason: R.BAD_NAME, errors: res.errors };
    run.player = { ...res.player };
    this.meta.lastPlayer = { ...res.player };
    run.nodeId = NODES[run.nodeId].next;
    // 이름 자체는 로그에 남기지 않습니다.
    this.log.add('name_set', { runId: run.runId, length: res.player.surname.length + res.player.given.length, isDefault: res.player.surname === DEFAULT_PLAYER.surname && res.player.given === DEFAULT_PLAYER.given });
    this.commit();
    return { ok: true, player: run.player };
  }

  /* ----------------------------- DialogueEngine ----------------------------- */

  choiceView(nodeId = this.run?.nodeId) {
    const node = NODES[nodeId];
    if (!node || node.type !== 'dialogue') return [];
    return node.choices.map((c) => ({
      choice: c,
      enabled: isChoiceEnabled(c, this.run),
      magnified: (this.run.marks.magnifier[nodeId] || []).find((m) => m.choiceId === c.id) || null,
      rehearsal: this.run.marks.rehearsal[c.id] || null,
      related: c.relatedClue ? this.run.clues.includes(c.relatedClue) : false,
    }));
  }

  canChoose() {
    const run = this.run;
    if (!run) return R.NO_RUN;
    const node = NODES[run.nodeId];
    if (node.type !== 'dialogue') return R.BAD_NODE;
    if (run.pendingReaction) return R.REACTION_PENDING;
    if (run.choices[run.nodeId]) return R.ALREADY_CHOSEN;
    return null;
  }

  /** 명세 19.4 commitChoice */
  choose(choiceId) {
    const blocked = this.canChoose();
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    const node = NODES[run.nodeId];
    const choice = node.choices.find((c) => c.id === choiceId);
    if (!choice) return { ok: false, reason: R.UNKNOWN_CHOICE };
    if (!isChoiceEnabled(choice, run)) return { ok: false, reason: R.LOCKED };

    const outcome = pickOutcome(choice, run);
    const fx = outcome.effects || {};
    const before = { suspicion: run.suspicion, trust: { ...run.trust } };
    const bandBefore = suspicionBand(run.suspicion).id;

    // 효과는 정확히 한 번 적용합니다.
    run.suspicion = clamp(run.suspicion + (fx.suspicionDelta || 0));
    for (const [who, d] of Object.entries(fx.trustDelta || {})) run.trust[who] = clamp((run.trust[who] ?? 0) + d);
    Object.assign(run.flags, fx.setFlags || {});
    const grantedEvidence = [];
    for (const e of fx.grantEvidence || []) {
      if (!run.evidence.includes(e)) {
        run.evidence.push(e);
        grantedEvidence.push(e);
        if (!this.meta.evidenceSeen.includes(e)) this.meta.evidenceSeen.push(e);
        this.log.add('evidence_granted', { runId: run.runId, evidence: e, via: choice.id });
      }
    }
    run.choices[node.id] = { choiceId: choice.id, outcomeId: outcome.id };
    const after = { suspicion: run.suspicion, trust: { ...run.trust } };

    this.log.add('dialogue_choice', {
      runId: run.runId,
      node: node.id,
      id: choice.id,
      outcome: outcome.id,
      suspicionBefore: before.suspicion,
      suspicionAfter: after.suspicion,
      trustBefore: before.trust.HAERIN,
      trustAfter: after.trust.HAERIN,
    });

    const removed = run.suspicion >= 100;
    const bandAfter = suspicionBand(run.suspicion).id;
    let bandEntered = null;
    if (!removed && bandAfter !== bandBefore && ['watched', 'review'].includes(bandAfter) && !run.bandsShown.includes(bandAfter)) {
      bandEntered = bandAfter;
      run.bandsShown.push(bandAfter);
    }
    const sDelta = after.suspicion - before.suspicion;
    const rawDelta = fx.suspicionDelta || 0;
    const tone = rawDelta < 0 ? 'down' : rawDelta === 0 ? 'flat' : rawDelta <= 10 ? 'up_small' : 'up_big';

    run.pendingReaction = {
      nodeId: node.id,
      choiceId: choice.id,
      outcomeId: outcome.id,
      before,
      after,
      delta: { suspicion: sDelta, trust: { HAERIN: after.trust.HAERIN - before.trust.HAERIN } },
      grantedEvidence,
      removed,
      bandEntered,
      tone,
    };

    if (removed) {
      // 제거 판정 이후의 후속 노드나 보상은 실행하지 않습니다.
      this.finishCase('END_REMOVED', { nodeId: node.id, choiceId: choice.id, before, after });
    } else if (node.next === 'RESULT') {
      this.finishCase(computeEnding(run), null);
    } else {
      run.nodeId = node.next;
    }
    this.commit();
    return { ok: true, reaction: run.pendingReaction, nodeId: run.nodeId };
  }

  ackReaction() {
    if (!this.run || !this.run.pendingReaction) return { ok: false, reason: R.BAD_NODE };
    this.run.pendingReaction = null;
    this.commit();
    return { ok: true };
  }

  finishCase(endingId, cause) {
    const run = this.run;
    const result = { endingId, cause, at: this.now(), caseClue: null };
    if (endingId !== 'END_REMOVED') {
      // 공통 후속 단서는 난이도와 무관하게 지급합니다. 결과 화면 재진입에도 한 번만.
      const key = `${run.runId}+${run.caseId}+RESULT`;
      if (!run.rewardClaims.includes(key)) {
        const reconfirmed = run.clues.includes('C_HA_3');
        if (!run.clues.includes('C_CASE_01_END')) run.clues.push('C_CASE_01_END');
        if (!this.meta.codex.includes('C_CASE_01_END')) this.meta.codex.push('C_CASE_01_END');
        run.rewardClaims.push(key);
        result.caseClue = { id: 'C_CASE_01_END', reconfirmed };
        this.log.add('clue_granted', { runId: run.runId, clue: 'C_CASE_01_END', via: 'RESULT' });
      }
    }
    run.result = result;
    run.nodeId = 'RESULT';
    run.endedAt = this.now();
    if (!this.meta.endingsSeen.includes(endingId)) this.meta.endingsSeen.push(endingId);
    this.log.add('case_result', {
      runId: run.runId,
      ending: endingId,
      suspicion: run.suspicion,
      trust: run.trust.HAERIN,
      clues: run.clues.length,
      evidence: run.evidence.length,
      durationMs: run.endedAt - run.startedAt,
      cause: cause ? cause.choiceId : null,
    });
  }

  /* ----------------------------- 대화 아이템 ----------------------------- */

  useMagnifier() {
    const blocked = this.canChoose();
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    if (run.inventory.magnifier < 1) return { ok: false, reason: R.NO_ITEM };
    const nodeId = run.nodeId;
    const marked = run.marks.magnifier[nodeId] || [];
    for (const c of NODES[nodeId].choices) {
      if (!isChoiceEnabled(c, run)) continue;
      if (marked.some((m) => m.choiceId === c.id)) continue;
      const clueId = (c.contradictsClues || []).find((cl) => run.clues.includes(cl));
      if (!clueId) continue;
      run.marks.magnifier[nodeId] = [...marked, { choiceId: c.id, clueId }];
      run.inventory.magnifier -= 1;
      this.log.add('item_used', { runId: run.runId, item: 'magnifier', context: nodeId, target: c.id });
      this.commit();
      return { ok: true, choiceId: c.id, clueId };
    }
    // 실제 모순 대상이 없으면 소모하지 않습니다.
    return { ok: false, reason: R.NO_TARGET };
  }

  useRehearsal(choiceId) {
    const blocked = this.canChoose();
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    const choice = NODES[run.nodeId].choices.find((c) => c.id === choiceId);
    if (!choice) return { ok: false, reason: R.UNKNOWN_CHOICE };
    if (!isChoiceEnabled(choice, run)) return { ok: false, reason: R.LOCKED };
    const seen = run.marks.rehearsal[choiceId];
    if (seen) return { ok: true, direction: seen, reused: true };
    if (run.inventory.rehearsal < 1) return { ok: false, reason: R.NO_ITEM };
    const d = pickOutcome(choice, run).effects?.suspicionDelta || 0;
    const direction = d > 0 ? 'up' : d < 0 ? 'down' : 'same';
    run.marks.rehearsal[choiceId] = direction;
    run.inventory.rehearsal -= 1;
    this.log.add('item_used', { runId: run.runId, item: 'rehearsal', context: run.nodeId, target: choiceId });
    this.commit();
    return { ok: true, direction, reused: false };
  }

  /* ----------------------------- 튜토리얼 ----------------------------- */

  startTutorial() {
    const run = this.run;
    if (!run || run.nodeId !== 'TUTORIAL') return { ok: false, reason: R.BAD_NODE };
    if (run.activePuzzle) return { ok: true, resumed: true };
    run.activePuzzle = { ...PE.createPuzzleState(TUTORIAL_BOARD), kind: 'tutorial', topicId: null, difficulty: 'tutorial', attemptId: `${run.runId}+TUTORIAL`, retries: 0 };
    this.log.add('tutorial_start', { runId: run.runId });
    this.commit();
    return { ok: true };
  }

  /** 완료 또는 건너뛰기. 집중력 4, 아이템 0인 본편 시작 상태를 그대로 유지합니다. */
  finishTutorial({ skipped = false } = {}) {
    const run = this.run;
    if (!run || run.nodeId !== 'TUTORIAL') return { ok: false, reason: R.BAD_NODE };
    const cleared = run.activePuzzle?.status === 'cleared';
    run.activePuzzle = null;
    run.nodeId = NODES.TUTORIAL.next;
    this.meta.tutorialSeen = true;
    this.log.add(skipped || !cleared ? 'tutorial_skip' : 'tutorial_complete', { runId: run.runId });
    this.commit();
    return { ok: true };
  }

  /* ----------------------------- 허브 · 조사 ----------------------------- */

  topicStatus(topicId) {
    return this.run?.topicAttempts[topicId]?.status ?? 'open';
  }

  canStartTopic(topicId, difficultyId) {
    const run = this.run;
    if (!run) return R.NO_RUN;
    if (run.nodeId !== 'MEMORY_HUB') return R.BAD_NODE;
    if (run.investigationClosed) return R.INVESTIGATION_CLOSED;
    if (run.activePuzzle) return R.PUZZLE_ACTIVE;
    if (!TOPICS[topicId]) return R.UNKNOWN_TOPIC;
    const diff = DIFFICULTIES[difficultyId];
    if (!diff) return R.UNKNOWN_DIFFICULTY;
    if (run.topicAttempts[topicId]) return R.TOPIC_USED;
    if (run.focus < diff.cost) return R.NO_FOCUS;
    return null;
  }

  /** 시작 확인 시에만 집중력을 차감합니다. 연타해도 두 번째 호출은 노드가 바뀌어 거절됩니다. */
  startTopic(topicId, difficultyId) {
    const blocked = this.canStartTopic(topicId, difficultyId);
    if (blocked) return { ok: false, reason: blocked };
    const run = this.run;
    const diff = DIFFICULTIES[difficultyId];
    const focusBefore = run.focus;
    run.focus -= diff.cost;
    const attemptId = `${run.runId}+${topicId}`;
    run.topicAttempts[topicId] = { status: 'in_progress', difficulty: difficultyId, attemptId, retries: 0 };
    const board = getBoard(diff.boardId);
    run.activePuzzle = { ...PE.createPuzzleState(board), kind: 'topic', topicId, difficulty: difficultyId, attemptId, retries: 0 };
    run.nodeId = 'PUZZLE';
    this.log.add('topic_start', { runId: run.runId, topic: topicId, difficulty: difficultyId, focusBefore, focusAfter: run.focus });
    this.commit();
    return { ok: true };
  }

  finishInvestigation() {
    const run = this.run;
    if (!run || run.nodeId !== 'MEMORY_HUB') return { ok: false, reason: R.BAD_NODE };
    if (run.activePuzzle) return { ok: false, reason: R.PUZZLE_ACTIVE };
    run.investigationClosed = true;
    run.nodeId = NODES.MEMORY_HUB.next;
    this.log.add('investigation_end', { runId: run.runId, focusLeft: run.focus });
    this.commit();
    return { ok: true };
  }

  closeReward() {
    const run = this.run;
    if (!run || run.nodeId !== 'REWARD') return { ok: false, reason: R.BAD_NODE };
    run.nodeId = NODES.REWARD.next;
    this.commit();
    return { ok: true };
  }

  /* ----------------------------- PuzzleEngine 연결 ----------------------------- */

  puzzleBoard() {
    return this.run?.activePuzzle ? getBoard(this.run.activePuzzle.boardId) : null;
  }

  puzzleMove(src, dst) {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    const board = getBoard(p.boardId);
    const res = PE.applyMove(board, p, src, dst);
    if (!res.ok) return res; // 잘못된 입력은 아무것도 소비하지 않습니다.
    run.activePuzzle = { ...p, ...res.state };
    this.log.add('puzzle_move', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', src, dst, moveNumber: res.state.moves });
    let reward = null;
    if (res.cleared) {
      this.log.add('puzzle_clear', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', moves: res.state.moves, difficulty: p.difficulty });
      if (p.kind === 'topic') reward = this.completePuzzle(p.topicId, { commit: false });
    } else if (res.failed) {
      this.log.add('puzzle_fail', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', moves: res.state.moves });
    }
    this.commit();
    return { ...res, reward };
  }

  /**
   * 명세 19.4 completePuzzle. 같은 보상 키가 있으면 다시 지급하지 않습니다.
   * 보드 클리어 · 보상 · 노드 이동을 같은 커밋으로 묶습니다.
   */
  completePuzzle(topicId, { commit = true } = {}) {
    const run = this.run;
    const key = rewardKey(run, topicId);
    // 이미 지급한 보상 키면 상태를 전혀 바꾸지 않습니다. (새로고침·뒤로가기·중복 콜백 대비)
    if (run.rewardClaims.includes(key)) return { ...run.lastReward, duplicate: true };
    const p = run.activePuzzle;
    const attempt = run.topicAttempts[topicId];
    if (!attempt || !p || p.kind !== 'topic' || p.topicId !== topicId || p.status !== 'cleared') return null;

    const diff = DIFFICULTIES[attempt.difficulty];
    const granted = { clues: [], newClues: [], items: {} };
    for (const cid of TOPICS[topicId].clues.slice(0, diff.depth)) {
      granted.clues.push(cid);
      if (!run.clues.includes(cid)) {
        run.clues.push(cid);
        granted.newClues.push(cid);
        this.log.add('clue_granted', { runId: run.runId, clue: cid, via: topicId });
      }
      if (!this.meta.codex.includes(cid)) this.meta.codex.push(cid);
    }
    for (const [item, n] of Object.entries(diff.items)) {
      run.inventory[item] += n;
      granted.items[item] = n;
    }
    run.rewardClaims.push(key);
    run.lastReward = { topicId, difficulty: attempt.difficulty, ...granted, focusLeft: run.focus };
    attempt.status = 'completed';
    run.activePuzzle = null;
    run.nodeId = 'REWARD';
    if (commit) this.commit();
    return run.lastReward;
  }

  puzzleUndo() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.kind === 'tutorial') return { ok: false, reason: R.TUTORIAL_NO_ITEMS };
    if (run.inventory.undo < 1) return { ok: false, reason: R.NO_ITEM };
    const res = PE.applyUndo(getBoard(p.boardId), p);
    if (!res.ok) return res;
    run.activePuzzle = { ...p, ...res.state };
    run.inventory.undo -= 1;
    this.log.add('item_used', { runId: run.runId, item: 'undo', context: p.topicId });
    this.commit();
    return { ok: true, state: res.state };
  }

  puzzleTempHole() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.kind === 'tutorial') return { ok: false, reason: R.TUTORIAL_NO_ITEMS };
    if (run.inventory.temp_hole < 1) return { ok: false, reason: R.NO_ITEM };
    const res = PE.applyTempHole(getBoard(p.boardId), p);
    if (!res.ok) return res;
    run.activePuzzle = { ...p, ...res.state };
    run.inventory.temp_hole -= 1;
    this.log.add('item_used', { runId: run.runId, item: 'temp_hole', context: p.topicId });
    this.commit();
    return { ok: true };
  }

  /** 보드 재도전: 집중력은 다시 쓰지 않고, 이미 쓴 아이템도 돌려주지 않습니다. */
  puzzleRetry() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.status === 'cleared') return { ok: false, reason: PE.REASONS.ALREADY_CLEARED };
    const board = getBoard(p.boardId);
    run.activePuzzle = { ...p, ...PE.resetPuzzle(board, p), retries: p.retries + 1 };
    if (p.kind === 'topic') run.topicAttempts[p.topicId].retries += 1;
    this.log.add('puzzle_retry', { runId: run.runId, topic: p.topicId ?? 'TUTORIAL', retries: p.retries + 1 });
    this.commit();
    return { ok: true };
  }

  /** 포기: 주제를 닫고 허브로. 집중력과 사용한 아이템은 돌려주지 않습니다. */
  puzzleAbandon() {
    const run = this.run;
    const p = run?.activePuzzle;
    if (!p) return { ok: false, reason: R.NO_PUZZLE };
    if (p.kind === 'tutorial') return this.finishTutorial({ skipped: true });
    if (p.status === 'cleared') return { ok: false, reason: PE.REASONS.ALREADY_CLEARED };
    run.topicAttempts[p.topicId].status = 'abandoned';
    run.activePuzzle = null;
    run.nodeId = 'MEMORY_HUB';
    this.log.add('puzzle_abandon', { runId: run.runId, topic: p.topicId, moves: p.moves });
    this.commit();
    return { ok: true };
  }

  /* ----------------------------- 노트 표시용 ----------------------------- */

  /** 단서 상태: 'owned'(이번 시도 확보) | 'past'(지난 시도에서 열람, 이번 시도 미확보) | 'unknown' */
  clueStatus(clueId) {
    if (this.run?.clues.includes(clueId)) return 'owned';
    if (this.meta.codex.includes(clueId)) return 'past';
    return 'unknown';
  }

  clueText(clueId) {
    return CLUES[clueId]?.text ?? '';
  }
}

return { R, createMeta, createRun, pickOutcome, isChoiceEnabled, rewardKey, computeEnding, Game };
});

/* ===== src/core/solver.js ===== */
__define("src/core/solver.js", function (__require) {
/*
 * 언스크류(UNCREW) — 너비 우선 탐색 풀이기
 *
 * 튜토리얼의 "다음 유효 행동 강조"와 개발용 검증에만 씁니다. 일반 플레이에서 정답을 자동 실행하지 않습니다.
 * P0 보드는 구멍 16개·나사 12개 이하라서 전체 상태 공간이 작습니다.
 */
const { applyMove, listValidMoves } = __require("src/core/puzzleEngine.js");

function keyOf(state) {
  return [...state.screws].sort().join(',') + '|' + [...state.activePlates].sort().join(',');
}

/**
 * 현재 상태에서 모든 판을 제거하는 최단 이동 목록을 찾습니다.
 * 이동 한도는 무시하고 순수 해법만 찾습니다. 해법이 없으면 null을 돌려줍니다.
 */
function solve(board, start, { maxStates = 200000 } = {}) {
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
function nextHint(board, state) {
  const path = solve(board, state);
  return path && path.length ? path[0] : null;
}

return { solve, nextHint };
});

/* ===== src/ui/art.js ===== */
__define("src/ui/art.js", function (__require) {
/*
 * 언스크류(UNCREW) — 대체 일러스트 (실루엣·아이콘·상징)
 * 외부 이미지 없이 인라인 SVG로만 그립니다. 최종 초상화가 생기면 이 파일만 교체하면 됩니다.
 */

const svg = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

const ICON = {
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  notes: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  hole: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>'),
  restart: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  flag: svg('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  warn: svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
  dot: svg('<circle cx="12" cy="12" r="5" fill="currentColor"/>'),
  x: svg('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  focus: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>'),
  glass: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>'),
  mask: svg('<path d="M3 8c3-2 15-2 18 0 0 6-3 10-9 10S3 14 3 8z"/><path d="M7 11c1-1 3-1 4 0M13 11c1-1 3-1 4 0"/>'),
  up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  down: svg('<path d="M12 5v14M5 12l7 7 7-7"/>'),
  same: svg('<path d="M5 12h14"/>'),
  chevron: svg('<path d="M9 5l7 7-7 7"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'),
  doc: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M9 13h7M9 17h7M9 9h3"/>'),
  sound: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
  mute: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
};

/* ---------------- 인물 실루엣 (viewBox 200×300) ---------------- */

const SIL_DEFS = (id, rim) => `
  <defs>
    <linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3136"/>
      <stop offset="1" stop-color="#0d0b0d"/>
    </linearGradient>
    <linearGradient id="r-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${rim}" stop-opacity="0"/>
      <stop offset="1" stop-color="${rim}" stop-opacity=".55"/>
    </linearGradient>
  </defs>`;

const FIGURES = {
  HAERIN: (id) => `
    ${SIL_DEFS(id, '#ecd7a8')}
    <g fill="url(#g-${id})" stroke="url(#r-${id})" stroke-width="2">
      <circle cx="126" cy="66" r="17"/>
      <path d="M100 38c20 0 31 16 31 37 0 25-13 42-31 42s-31-17-31-42c0-21 11-37 31-37z"/>
      <path d="M90 112h20l2 26c22 6 44 14 56 30 10 14 14 60 16 132H16c2-72 6-118 16-132 12-16 34-24 56-30z"/>
    </g>
    <path d="M88 140l12 40 12-40" fill="none" stroke="#ecd7a8" stroke-opacity=".45" stroke-width="2"/>
    <path d="M70 152l30 60 30-60" fill="none" stroke="#ecd7a8" stroke-opacity=".25" stroke-width="2"/>
    <circle cx="71" cy="88" r="2.5" fill="#ecd7a8" opacity=".8"/>`,
  TAEGEON: (id) => `
    ${SIL_DEFS(id, '#ecd7a8')}
    <g fill="url(#g-${id})" stroke="url(#r-${id})" stroke-width="2">
      <path d="M100 34c24 0 36 17 36 41 0 28-15 46-36 46s-36-18-36-46c0-24 12-41 36-41z"/>
      <path d="M86 116h28l3 22c28 6 52 16 64 34 10 16 14 56 16 128H3c2-72 6-112 16-128 12-18 36-28 64-34z"/>
    </g>
    <path d="M66 58c8-20 60-20 68 0" fill="none" stroke="#ecd7a8" stroke-opacity=".35" stroke-width="3"/>
    <path d="M100 140l-7 12 7 70 7-70z" fill="#7d2335" opacity=".9"/>
    <path d="M78 138l22 30 22-30" fill="none" stroke="#ecd7a8" stroke-opacity=".4" stroke-width="2"/>`,
  MUJIN: (id) => `
    ${SIL_DEFS(id, '#8adbd4')}
    <g fill="url(#g-${id})" stroke="url(#r-${id})" stroke-width="2">
      <path d="M100 26c21 0 32 15 32 37 0 26-13 43-32 43s-32-17-32-43c0-22 11-37 32-37z"/>
      <path d="M88 102h24l3 22c26 6 50 14 60 32 9 16 13 64 15 144H10c2-80 6-128 15-144 10-18 34-26 60-32z"/>
    </g>
    <path d="M133 70c6 2 8 10 4 16l-4 22" fill="none" stroke="#8adbd4" stroke-opacity=".6" stroke-width="2"/>`,
};

let silCount = 0;
function silhouette(who, { label = '' } = {}) {
  const id = `${who.toLowerCase()}${++silCount}`;
  const body = (FIGURES[who] || FIGURES.MUJIN)(id);
  return `<svg class="sil" viewBox="0 0 200 300" role="img" aria-label="${label}">${body}</svg>`;
}

/** 가슴 앞에 떠오르는 판과 나사(봉인 구조) */
function sealOverlay() {
  const screw = (x, y) =>
    `<g transform="translate(${x} ${y})"><circle r="7" fill="#cfe9e5" stroke="#0b2a29" stroke-width="2"/><path d="M-4 0h8M0 -4v8" stroke="#0b2a29" stroke-width="2"/></g>`;
  return `<svg class="seal" viewBox="0 0 120 90" aria-hidden="true">
    <rect x="8" y="30" width="104" height="22" rx="6" fill="#4fb3ad" fill-opacity=".35" stroke="#8adbd4" stroke-width="2"/>
    <rect x="46" y="6" width="24" height="78" rx="6" fill="#4fb3ad" fill-opacity=".45" stroke="#8adbd4" stroke-width="2"/>
    <rect x="14" y="58" width="64" height="18" rx="6" fill="#4fb3ad" fill-opacity=".25" stroke="#8adbd4" stroke-width="2"/>
    ${screw(20, 41)}${screw(100, 41)}${screw(58, 16)}${screw(58, 74)}${screw(26, 67)}
  </svg>`;
}

/** 타이틀 엠블럼: 겹친 판과 풀려 나오는 나사 */
function titleEmblem() {
  return `<svg viewBox="0 0 240 240" aria-hidden="true">
    <defs>
      <linearGradient id="te-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e4bb"/><stop offset="1" stop-color="#a88a55"/></linearGradient>
      <linearGradient id="te-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3036"/><stop offset="1" stop-color="#1a1518"/></linearGradient>
      <radialGradient id="te-screw" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#fff6de"/><stop offset=".6" stop-color="#d8c08f"/><stop offset="1" stop-color="#7c6236"/></radialGradient>
    </defs>
    <circle cx="120" cy="120" r="108" fill="none" stroke="#7d2335" stroke-width="2" opacity=".7"/>
    <circle cx="120" cy="120" r="96" fill="none" stroke="url(#te-gold)" stroke-width="1" stroke-dasharray="3 7" opacity=".7"/>
    <g transform="rotate(-12 120 120)">
      <rect x="44" y="92" width="152" height="40" rx="10" fill="url(#te-plate)" stroke="#5a4b3a" stroke-width="2"/>
      <rect x="100" y="52" width="40" height="140" rx="10" fill="url(#te-plate)" stroke="url(#te-gold)" stroke-width="2"/>
      <circle cx="66" cy="112" r="9" fill="#090809" stroke="#5a4b3a"/>
      <circle cx="174" cy="112" r="9" fill="#090809" stroke="#5a4b3a"/>
      <circle cx="120" cy="170" r="9" fill="#090809" stroke="#5a4b3a"/>
    </g>
    <g transform="translate(150 66) rotate(28)">
      <rect x="-5" y="6" width="10" height="34" rx="2" fill="#8c7448"/>
      <path d="M-5 12h10M-5 18h10M-5 24h10M-5 30h10" stroke="#5b4a2c" stroke-width="2"/>
      <circle r="16" fill="url(#te-screw)" stroke="#5b4a2c" stroke-width="2"/>
      <path d="M-8 0h16M0 -8v16" stroke="#3b2f1a" stroke-width="3" stroke-linecap="round"/>
    </g>
    <path d="M120 120c40-30 70-10 90 6" fill="none" stroke="#4fb3ad" stroke-width="1.5" stroke-dasharray="2 5" opacity=".7"/>
  </svg>`;
}

/** 퍼즐 배경 상징 (논리 좌표 640×640) */
function boardSymbol(kind) {
  if (kind === 'contract') {
    return `<g opacity=".10" fill="none" stroke="#8adbd4" stroke-width="6">
      <rect x="170" y="90" width="300" height="420" rx="10"/>
      <path d="M215 170h210M215 230h210M215 290h160M215 350h190M215 410h120"/>
      <path d="M300 470c30-40 60 30 90-10s40 20 60 0" stroke-width="5"/>
    </g>`;
  }
  if (kind === 'heart') {
    return `<g opacity=".10" fill="none" stroke="#8adbd4" stroke-width="6">
      <path d="M320 520s-200-120-200-270a110 110 0 0 1 200-60 110 110 0 0 1 200 60c0 150-200 270-200 270z"/>
    </g>`;
  }
  return `<g opacity=".10" fill="none" stroke="#8adbd4" stroke-width="6">
    <path d="M110 230c60-60 360-60 420 0 0 150-90 260-210 260S110 380 110 230z"/>
    <path d="M200 300c25-24 70-24 95 0M345 300c25-24 70-24 95 0"/>
    <path d="M270 420c30 18 70 18 100 0"/>
  </g>`;
}

return { ICON, silhouette, sealOverlay, titleEmblem, boardSymbol };
});

/* ===== src/ui/board.js ===== */
__define("src/ui/board.js", function (__require) {
/*
 * 언스크류(UNCREW) — 퍼즐 보드 SVG 렌더러
 *
 * 논리 좌표 640×640을 viewBox로 쓰고, 화면 크기에 비례해 그립니다.
 * 포인터 좌표는 toLogical()로 논리 좌표로 바꾼 뒤 엔진의 pickHole()로 판정합니다.
 * 가려진 나사와 구멍은 그리지 않습니다. (명세 10.2)
 * 상태 구분은 색만 쓰지 않고 모양(실선 고리·점선 고리·중심점)과 명도로 표시합니다.
 */
const { isBlocked } = __require("src/core/puzzleEngine.js");
const { boardSymbol } = __require("src/ui/art.js");

const PLATE_TONES = {
  A: ['#d9c8a2', '#8d7b58', '#f3e6c6'],
  B: ['#9a4352', '#5b1f2b', '#d48593'],
  C: ['#6c7882', '#3a434b', '#a9b5bf'],
  D: ['#a8804f', '#5f4223', '#e2bd8b'],
  E: ['#5a9592', '#2b5250', '#a3d8d3'],
};

const HOLE_R = 18;
const SCREW_R = 23;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

/** 판 위에서 구멍과 가장 덜 겹치는 라벨 위치를 고릅니다. */
function labelSpot(board, plate) {
  const [x, y, w, h] = plate.rect;
  const vertical = h > w;
  const holes = board.holes.filter((hh) => hh.x >= x && hh.x <= x + w && hh.y >= y && hh.y <= y + h);
  const len = vertical ? h : w;
  let best = len / 2;
  let bestScore = -1;
  for (let t = 34; t <= len - 34; t += 6) {
    const pos = (vertical ? y : x) + t;
    const score = holes.length ? Math.min(...holes.map((hh) => Math.abs((vertical ? hh.y : hh.x) - pos))) : len;
    const centerBias = -Math.abs(t - len / 2) * 0.01;
    if (score + centerBias > bestScore) {
      bestScore = score + centerBias;
      best = t;
    }
  }
  return vertical ? { x: x + w / 2, y: y + best, vertical } : { x: x + best, y: y + h / 2, vertical };
}

function plateMarkup(board, plate, label, cls = '') {
  const [x, y, w, h] = plate.rect;
  const tone = PLATE_TONES[plate.id] || PLATE_TONES.C;
  const spot = labelSpot(board, plate);
  let text = '';
  if (label) {
    const chars = [...label.replace(/\s+/g, '')];
    if (spot.vertical) {
      const step = 24;
      const y0 = spot.y - ((chars.length - 1) * step) / 2;
      text = chars
        .map((ch, i) => `<text x="${spot.x}" y="${y0 + i * step}" class="plate-label">${esc(ch)}</text>`)
        .join('');
    } else {
      text = `<text x="${spot.x}" y="${spot.y}" class="plate-label">${esc(label)}</text>`;
    }
  }
  return `<g class="plate ${cls}" data-plate="${plate.id}" filter="url(#pshadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="url(#pg-${plate.id})" stroke="${tone[2]}" stroke-opacity=".55" stroke-width="2"/>
    <rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" rx="12" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>
    ${text}
  </g>`;
}

function holeMarkup(h, cls = '') {
  return `<g class="hole ${cls}" transform="translate(${h.x} ${h.y})">
    <circle r="${HOLE_R}" fill="#051012" stroke="#000" stroke-opacity=".55" stroke-width="3"/>
    <circle r="${HOLE_R}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.5"/>
    <circle r="${HOLE_R - 7}" fill="#020708"/>
  </g>`;
}

function screwMarkup(x, y, { selected = false, moved = false, cls = '', angle = 0 } = {}) {
  return `<g transform="translate(${x} ${y})"><g class="screw ${selected ? 'selected' : ''} ${moved ? 'moved' : ''} ${cls}">
    ${selected ? `<circle class="sel-ring" r="32"/><circle class="sel-dash" r="39"/>` : ''}
    <g class="screw-body">
      <circle r="${SCREW_R}" fill="url(#screwg)" stroke="#3a2e1a" stroke-width="2.5"/>
      <circle r="${SCREW_R - 6}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
      <g transform="rotate(${angle})"><g class="slot"><path d="M-11 0h22M0 -11v22" stroke="#3b2f1a" stroke-width="4.5" stroke-linecap="round"/></g></g>
    </g>
  </g></g>`;
}

function targetMarkup(x, y) {
  return `<g transform="translate(${x} ${y})" class="target-wrap"><g class="target">
    <circle class="target-ring" r="29"/><circle class="target-dot" r="5"/>
  </g></g>`;
}

function hintMarkup(x, y) {
  return `<g transform="translate(${x} ${y})"><circle class="hint-ring" r="42"/></g>`;
}

const DEFS = `<defs>
  <radialGradient id="bgg" cx=".5" cy=".42" r=".75">
    <stop offset="0" stop-color="#173e3f"/><stop offset=".65" stop-color="#0c2224"/><stop offset="1" stop-color="#061113"/>
  </radialGradient>
  <radialGradient id="screwg" cx=".35" cy=".3" r=".85">
    <stop offset="0" stop-color="#fffaf0"/><stop offset=".45" stop-color="#d9cfbd"/><stop offset="1" stop-color="#7b6d55"/>
  </radialGradient>
  ${Object.entries(PLATE_TONES)
    .map(
      ([id, [a, b]]) =>
        `<linearGradient id="pg-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`,
    )
    .join('')}
  <filter id="pshadow" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="#000" flood-opacity=".55"/>
  </filter>
  <style>
    .plate-label { font: 700 21px "IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; fill: #140f0c; fill-opacity: .55; text-anchor: middle; dominant-baseline: central; letter-spacing: 1px; }
  </style>
</defs>`;

/**
 * 보드 전체 마크업
 * opts: { selected, targets[], hint:{hole}, labels{A..E}, symbol, falling[], revealed[], moved }
 */
function boardMarkup(board, state, opts = {}) {
  const { selected = null, targets = [], hint = null, labels = {}, symbol = 'mask', falling = [], revealed = [], moved = null } = opts;
  const holeById = Object.fromEntries(board.holes.map((h) => [h.id, h]));
  const active = board.plates.filter((p) => state.activePlates.includes(p.id)).sort((a, b) => a.z - b.z);
  const visibleHoles = board.holes.filter((h) => !isBlocked(board, state, h.id));

  const parts = [DEFS];
  parts.push(`<rect width="640" height="640" rx="28" fill="url(#bgg)"/>`);
  parts.push(boardSymbol(symbol));
  parts.push(`<rect x="10" y="10" width="620" height="620" rx="22" fill="none" stroke="#8adbd4" stroke-opacity=".12" stroke-width="2"/>`);

  for (const p of active) parts.push(plateMarkup(board, p, labels[p.id]));
  for (const h of visibleHoles) parts.push(holeMarkup(h, revealed.includes(h.id) ? 'revealed' : ''));

  for (const t of targets) {
    const h = holeById[t];
    if (h) parts.push(targetMarkup(h.x, h.y));
  }
  for (const sid of state.screws) {
    const h = holeById[sid];
    if (!h || isBlocked(board, state, sid)) continue; // 가려진 나사는 그리지 않습니다.
    const angle = (h.x * 7 + h.y * 3) % 90;
    parts.push(screwMarkup(h.x, h.y, { selected: selected === sid, moved: moved === sid, cls: revealed.includes(sid) ? 'revealed' : '', angle }));
  }
  if (hint && holeById[hint.hole]) parts.push(hintMarkup(holeById[hint.hole].x, holeById[hint.hole].y));
  for (const pid of falling) {
    const p = board.plates.find((pp) => pp.id === pid);
    if (p) parts.push(plateMarkup(board, p, labels[p.id], 'falling'));
  }
  return parts.join('');
}

/** 화면 좌표 → 논리 좌표(640×640) */
function toLogical(svgEl, clientX, clientY) {
  const r = svgEl.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * 640, y: ((clientY - r.top) / r.height) * 640 };
}

/** 논리 좌표 → 화면 좌표. 자동 테스트에서 실제 클릭 위치를 계산할 때 씁니다. */
function toScreen(svgEl, x, y) {
  const r = svgEl.getBoundingClientRect();
  return { x: r.left + (x / 640) * r.width, y: r.top + (y / 640) * r.height };
}

/** 임시 나사함 슬롯 안의 작은 나사/구멍 */
function slotMarkup({ hasScrew, selected }) {
  return `<svg viewBox="-32 -32 64 64" aria-hidden="true">${DEFS}
    <circle r="${HOLE_R}" fill="#051012" stroke="#000" stroke-opacity=".55" stroke-width="3"/>
    ${hasScrew ? screwMarkup(0, 0, { selected: false, angle: 20 }).replace('class="screw ', `class="screw ${selected ? 'selected ' : ''}`) : ''}
  </svg>`;
}

return { screwMarkup, boardMarkup, toLogical, toScreen, slotMarkup };
});

/* ===== src/ui/audio.js ===== */
__define("src/ui/audio.js", function (__require) {
/*
 * 언스크류(UNCREW) — 짧은 효과음 (Web Audio로 즉석 합성, 외부 파일 없음)
 * 나사 회전, 판 분리, 기억 파편, 위험 경고에 짧은 피드백을 줍니다. (명세 9.3)
 * 브라우저 정책상 첫 사용자 입력 이후에만 소리가 납니다.
 */

let ctx = null;
let master = null;
let ambient = null;
let muted = false;
let unlocked = false;

function ensure() {
  if (ctx) return ctx;
  if (!unlocked) return null; // 사용자 입력 전에는 오디오를 만들지 않습니다.
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

function unlockAudio() {
  unlocked = true;
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function setMuted(v) {
  muted = !!v;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.02);
}

function tone({ type = 'sine', freq = 440, to = null, dur = 0.12, gain = 0.2, delay = 0, filter = null }) {
  const c = ensure();
  if (!c || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = osc;
  if (filter) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.2, gain = 0.15, delay = 0, filter = 600 }) {
  const c = ensure();
  if (!c || muted) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = filter;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(c.currentTime + delay);
}

const SOUNDS = {
  select: () => tone({ type: 'square', freq: 1400, dur: 0.035, gain: 0.05, filter: 3000 }),
  move: () => {
    for (let i = 0; i < 4; i++) tone({ type: 'square', freq: 900 - i * 90, dur: 0.03, gain: 0.05, delay: i * 0.035, filter: 2500 });
  },
  plate: () => {
    tone({ type: 'sine', freq: 140, to: 60, dur: 0.35, gain: 0.35 });
    noise({ dur: 0.25, gain: 0.12, filter: 900, delay: 0.02 });
  },
  memory: () => {
    tone({ type: 'sine', freq: 880, dur: 0.6, gain: 0.08 });
    tone({ type: 'sine', freq: 1318, dur: 0.8, gain: 0.05, delay: 0.08 });
  },
  clear: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', freq: f, dur: 0.5, gain: 0.07, delay: i * 0.08 }));
  },
  error: () => tone({ type: 'triangle', freq: 170, dur: 0.12, gain: 0.12 }),
  danger: () => {
    tone({ type: 'sawtooth', freq: 62, dur: 0.6, gain: 0.12, filter: 260 });
    tone({ type: 'sawtooth', freq: 62, dur: 0.6, gain: 0.1, filter: 260, delay: 0.7 });
  },
  thud: () => {
    tone({ type: 'sine', freq: 90, to: 35, dur: 0.7, gain: 0.5 });
    noise({ dur: 0.4, gain: 0.2, filter: 400 });
  },
  heartbeat: () => {
    tone({ type: 'sine', freq: 70, to: 45, dur: 0.18, gain: 0.35 });
    tone({ type: 'sine', freq: 70, to: 45, dur: 0.18, gain: 0.25, delay: 0.24 });
  },
  chime: () => tone({ type: 'sine', freq: 1046, dur: 0.9, gain: 0.06 }),
  tick: () => {
    tone({ type: 'square', freq: 300, dur: 0.03, gain: 0.04, filter: 1200 });
    tone({ type: 'square', freq: 300, dur: 0.03, gain: 0.04, filter: 1200, delay: 0.45 });
  },
  choose: () => tone({ type: 'sine', freq: 660, dur: 0.08, gain: 0.05 }),
};

function play(name) {
  try {
    SOUNDS[name]?.();
  } catch {
    /* 소리 실패는 진행에 영향을 주지 않습니다 */
  }
}

/** 대화 장면의 낮은 배경음. 큰 의심 증가 때 잠시 낮춥니다. (명세 16.4) */
function setAmbient(on) {
  const c = ensure();
  if (!c) return;
  if (on && !ambient) {
    const g = c.createGain();
    g.gain.value = 0.0001;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 320;
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    o1.frequency.value = 55;
    o2.frequency.value = 82.6;
    o2.detune.value = 7;
    o1.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(master);
    o1.start();
    o2.start();
    g.gain.setTargetAtTime(0.035, c.currentTime, 1.5);
    ambient = { g, o1, o2 };
  } else if (!on && ambient) {
    const a = ambient;
    ambient = null;
    a.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
    setTimeout(() => {
      try {
        a.o1.stop();
        a.o2.stop();
      } catch {
        /* noop */
      }
    }, 1500);
  }
}

function duckAmbient() {
  if (!ambient || !ctx) return;
  const g = ambient.g.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setTargetAtTime(0.004, ctx.currentTime, 0.1);
  g.setTargetAtTime(0.035, ctx.currentTime + 3, 1.2);
}

return { unlockAudio, setMuted, play, setAmbient, duckAmbient };
});

/* ===== src/ui/app.js ===== */
__define("src/ui/app.js", function (__require) {
/*
 * 언스크류(UNCREW) — UI 컨트롤러
 *
 * 상태 표시와 입력 전달만 담당합니다. 게임 규칙은 core/game.js에 있습니다.
 * 화면: TITLE · 대화(PROLOGUE/RETURN/HAERIN_OPEN/OFFICE_ENTER/DOCUMENT_ACTION/BOSS) · 튜토리얼 · 허브 · 퍼즐 · 보상 · 결과
 * 오버레이: 노트(EVIDENCE) · 난이도 선택 · 메뉴 · 설정 · 확인창 · 테스트 패널
 */
const { PROJECT, ITEMS, DIFFICULTIES, DEPTH_LABEL, suspicionBand } = __require("src/data/config.js");
const { NODES, CLUES, EVIDENCE, TOPICS, TOPIC_ORDER, CHARACTERS, SPEAKER_LABEL, BAND_LINES, REMOVAL_LINES, TUTORIAL, HUB, ENDINGS, RESULT_COMMON, CASE_INFO } = __require("src/data/case01.js");
const { getBoard, TUTORIAL_BOARD } = __require("src/data/puzzles.js");
const { pickHole, plateAt, hasScrew, canSelect, validDestinations, hasAnyValidMove, isBlocked, TEMP_HOLE_ID, REASONS } = __require("src/core/puzzleEngine.js");
const { nextHint, solve } = __require("src/core/solver.js");
const { ICON, silhouette, sealOverlay, titleEmblem } = __require("src/ui/art.js");
const { boardMarkup, toLogical, slotMarkup } = __require("src/ui/board.js");
const SFX = __require("src/ui/audio.js");
const { formatText, validatePlayerName, DEFAULT_PLAYER, NAME_RULE_TEXT, josa } = __require("src/core/names.js");

const REDUCED = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const SPEED = { normal: 26, fast: 10, instant: 0 };

const MOVE_REASON_TEXT = {
  [REASONS.SAME_HOLE]: '같은 구멍입니다. 다른 빈 구멍을 고르세요.',
  [REASONS.OCCUPIED]: '이미 나사가 있는 구멍입니다.',
  [REASONS.NO_SCREW]: '나사가 없는 구멍입니다.',
  [REASONS.SRC_BLOCKED]: '판에 가려진 나사는 집을 수 없습니다.',
  [REASONS.DST_BLOCKED]: '판에 가려진 구멍에는 넣을 수 없습니다.',
  [REASONS.UNKNOWN_HOLE]: '구멍이 없는 곳입니다.',
  [REASONS.NOT_PLAYING]: '지금은 나사를 옮길 수 없습니다.',
  [REASONS.NO_HISTORY]: '되돌릴 이동이 없습니다.',
  [REASONS.TEMP_HOLE_USED]: '임시 나사함은 보드마다 한 번만 쓸 수 있습니다.',
  NO_ITEM: '아이템이 없습니다.',
  NO_TARGET: '지금 가진 기억 단서와 모순되는 선택지가 없습니다. 돋보기는 소모되지 않았습니다.',
  LOCKED: '조건을 갖추지 못한 선택지입니다.',
};

const NODE_LABEL = {
  PROLOGUE: '프롤로그',
  RETURN: '회귀',
  NAME_ENTRY: '회귀 · 이름',
  AWAKEN: '회귀 · 능력',
  HAERIN_OPEN: '비서실 · 서해린',
  TUTORIAL: '연습 해체',
  OFFICE_ENTER: '회장실',
  MEMORY_HUB: '멈춘 시간',
  PUZZLE: '기억 해체 중',
  REWARD: '해체 완료',
  DOCUMENT_ACTION: '전달 목록',
  BOSS_01: '회장 대면 1/3',
  BOSS_02: '회장 대면 2/3',
  BOSS_03: '회장 대면 3/3',
  RESULT: '결과',
};

/** HUD·노트·재도전 메뉴를 아직 보여 주지 않는 도입 장면 */
const INTRO_NODES = ['PROLOGUE', 'RETURN', 'NAME_ENTRY', 'AWAKEN'];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const unquote = (t) => t.replace(/^[“"]|[”"]$/g, '');
const fmtDelta = (d) => (d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '±0');

function createApp({ root, side, debugEl, shell, game }) {
  /** 대본의 이름 자리 표시를 현재 주인공 이름으로 바꿉니다. */
  const T = (text) => formatText(text, game.run?.player);
  const ui = {
    view: 'title',
    overlay: null,
    seqKey: null,
    lineIdx: 0,
    typing: false,
    typed: 0,
    timer: null,
    revealedAt: 0,
    shownLineKey: null,
    locked: false,
    selected: null,
    msg: null,
    anim: null,
    animTimer: null,
    clearView: null,
    picking: false,
    toast: null,
    toastTimer: null,
    busy: false,
    nameDraft: null,
    guardUntil: 0,
    lastSaveWarned: false,
    autoplay: false,
  };

  SFX.setMuted(game.meta.settings.muted);

  game.onChange((_state, res) => {
    if (res && !res.ok) {
      if (!ui.lastSaveWarned) {
        ui.lastSaveWarned = true;
        showToast('로컬 저장에 실패했습니다. 지금 상태로 계속 플레이할 수 있지만, 창을 닫으면 진행이 사라질 수 있습니다.');
      }
    } else ui.lastSaveWarned = false;
  });
  game.log.listeners.add(() => renderDebug());

  /* =============================== 공통 =============================== */

  function showToast(text, kind = '') {
    ui.toast = { text, kind };
    clearTimeout(ui.toastTimer);
    ui.toastTimer = setTimeout(() => {
      ui.toast = null;
      render();
    }, 4200);
    render();
  }

  function bandMeter(run) {
    const band = suspicionBand(run.suspicion);
    return `<div class="meter band-${band.id}" aria-label="조직 의심도 ${run.suspicion}, ${band.label}">
      <div class="meter-top">${ICON[band.icon]}<span>의심도 <b>${run.suspicion}</b> · ${band.label}</span></div>
      <div class="meter-bar"><i style="width:${run.suspicion}%"></i></div>
    </div>`;
  }

  function hud(run, { menu = true } = {}) {
    return `<header class="hud">
      <div class="hud-row">
        ${menu ? `<button class="icon-btn" data-act="menu" aria-label="메뉴">${ICON.menu}</button>` : ''}
        <span class="day" aria-label="죽음까지 ${run.daysRemaining}일">D-${run.daysRemaining}</span>
        <span class="hud-place">${esc(NODE_LABEL[run.nodeId] || '')}</span>
        <span class="chip trust-chip" aria-label="서해린 신뢰도 ${run.trust.HAERIN}">${ICON.heart}서해린 신뢰 ${run.trust.HAERIN}</span>
        <button class="icon-btn notes-btn" data-act="notes" aria-label="노트">${ICON.notes}</button>
      </div>
      ${bandMeter(run)}
    </header>`;
  }

  function pips(n, total, cls = '') {
    return `<span class="pips" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="pip ${cls} ${i < n ? 'on' : ''}"></span>`).join('')}</span>`;
  }

  function itemList(items) {
    const ents = Object.entries(items).filter(([, n]) => n > 0);
    if (!ents.length) return '<span class="muted">없음</span>';
    return ents.map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(', ');
  }

  /* =============================== 렌더 진입점 =============================== */

  function render() {
    const run = game.run;
    let html = '';
    if (ui.view === 'title' || !run) html = titleScreen();
    else if (ui.clearView) html = puzzleScreen(ui.clearView);
    else if (run.pendingReaction) html = dialogueScreen();
    else {
      const node = NODES[run.nodeId];
      if (node.type === 'scene' || node.type === 'dialogue') html = dialogueScreen();
      else if (node.type === 'name') html = nameScreen();
      else if (node.type === 'tutorial') html = run.activePuzzle ? puzzleScreen() : tutorialIntro();
      else if (node.type === 'hub') html = hubScreen();
      else if (node.type === 'puzzle') html = puzzleScreen();
      else if (node.type === 'reward') html = rewardScreen();
      else if (node.type === 'result') html = resultScreen();
    }
    html += overlayMarkup();
    if (ui.toast) html += `<div class="toast ${ui.toast.kind}" role="status">${esc(ui.toast.text)}</div>`;
    root.innerHTML = html;
    afterRender();
    renderSide();
    renderDebug();
  }

  function afterRender() {
    // 대화 타이핑 이어 가기
    const textEl = root.querySelector('[data-typer]');
    if (textEl) startTyping(textEl);
    const svg = root.querySelector('svg[data-board]');
    if (svg) svg.addEventListener('click', onBoardClick);
    const focusEl = root.querySelector('[data-autofocus]');
    if (focusEl && ui.overlay) focusEl.focus({ preventScroll: true });
    const run = game.run;
    const inDialogue = ui.view === 'game' && run && (run.pendingReaction || ['scene', 'dialogue'].includes(NODES[run.nodeId]?.type));
    SFX.setAmbient(!!inDialogue && !game.meta.settings.muted && ['office', 'secretary'].includes(currentStage()?.loc));
  }

  /* =============================== 타이틀 =============================== */

  function titleScreen() {
    const issue = game.loadIssue;
    const canContinue = game.hasContinue();
    const run = game.run;
    return `<section class="screen title-screen" aria-label="타이틀">
      <div class="title-art">${titleEmblem()}</div>
      <div class="title-block">
        <h1 class="title-ko">${PROJECT.title}</h1>
        <div class="title-en">${PROJECT.titleEn}</div>
        <p class="title-copy">${PROJECT.copy}</p>
      </div>
      <div class="title-menu">
        ${issue?.kind === 'corrupt' ? `<div class="notice" role="alert">저장 데이터가 손상되어 별도로 보관했습니다. 잘못된 수치로 이어 가지 않도록 새 게임을 시작해 주세요.</div>` : ''}
        ${!game.saver.available ? `<div class="notice info">이 브라우저에서는 로컬 저장을 쓸 수 없습니다. 창을 닫으면 진행이 사라집니다.</div>` : ''}
        <button class="btn primary block" data-act="new-game">새 게임</button>
        <button class="btn block" data-act="continue" ${canContinue ? '' : 'disabled'}>
          이어하기${canContinue ? ` <span class="muted" style="font-weight:500">· ${NODE_LABEL[run.nodeId]}</span>` : ''}
        </button>
        <button class="btn ghost block" data-act="settings">설정</button>
      </div>
      <p class="title-foot">P0 프로토타입 · 첫 사건 「${CASE_INFO.title}」</p>
    </section>`;
  }

  /* =============================== 대화 =============================== */

  function currentSequence() {
    const run = game.run;
    const pr = run.pendingReaction;
    if (pr) {
      const node = NODES[pr.nodeId];
      const choice = node.choices.find((c) => c.id === pr.choiceId);
      const outcome = choice.outcomes ? choice.outcomes.find((o) => o.id === pr.outcomeId) : { reaction: choice.reaction };
      let lines = [{ who: 'DOYUN', text: unquote(choice.text) }];
      if (pr.removed) lines = lines.concat(REMOVAL_LINES);
      else {
        lines = lines.concat(outcome.reaction || []);
        if (pr.bandEntered && BAND_LINES[pr.bandEntered]) lines = lines.concat(BAND_LINES[pr.bandEntered]);
      }
      return { key: `R:${run.runId}:${pr.nodeId}:${pr.choiceId}`, lines, base: node.stage, mode: 'reaction', node, pr };
    }
    const node = NODES[run.nodeId];
    return { key: `N:${run.runId}:${node.id}`, lines: node.lines, base: node.stage, mode: 'node', node };
  }

  function stageAt(seq, idx) {
    const st = { loc: 'black', cast: [], seal: [], door: undefined, ...seq.base };
    for (let i = 0; i <= idx && i < seq.lines.length; i++) Object.assign(st, seq.lines[i].stage || {});
    if (st.door === undefined) st.door = st.loc === 'office' && game.run.suspicion >= 70;
    return st;
  }

  function currentStage() {
    const run = game.run;
    if (!run) return null;
    if (!run.pendingReaction && !['scene', 'dialogue'].includes(NODES[run.nodeId]?.type)) return null;
    const seq = currentSequence();
    return stageAt(seq, Math.min(ui.lineIdx, seq.lines.length - 1));
  }

  function stageMarkup(st, line) {
    const cast = st.cast || [];
    const solo = cast.length === 1;
    const figures = cast
      .map((who) => {
        const sealed = (st.seal || []).includes(who);
        return `<div class="figure ${solo ? 'solo' : ''} ${who.toLowerCase()}">
          ${silhouette(who, { label: CHARACTERS[who]?.name || '' })}
          ${sealed ? sealOverlay() : ''}
          <span class="name-tag">${esc(CHARACTERS[who]?.name || '')}</span>
        </div>`;
      })
      .join('');
    let over = '';
    if (line?.card && line.list) {
      over = `<div class="card-overlay goal"><div class="goal-card"><span class="eyebrow">${esc(line.card)}</span><ol>${line.list.map((g) => `<li>${esc(T(g))}</li>`).join('')}</ol></div></div>`;
    } else if (line?.card) over = `<div class="card-overlay"><div><div class="big">${esc(line.card)}</div><div class="sub">${esc(T(line.sub || ''))}</div></div></div>`;
    if (line?.fx === 'blackout') over = `<div class="blackout-overlay">······</div>`;
    return `<div class="stage loc-${st.loc} ${st.dizzy ? 'dizzy' : ''}">
      <div class="bg"></div>
      ${st.door ? `<div class="door" aria-label="문 밖의 보안실장 실루엣">${silhouette('MUJIN', { label: '권무진' })}</div>` : ''}
      <div class="cast">${figures}</div>
      ${over}
    </div>`;
  }

  function speakerLabel(who) {
    // 주인공은 이름을 떠올리기 전까지 '나', 그 뒤에는 입력한 이름으로 표시합니다.
    if (who === 'DOYUN') return game.run?.player ? game.run.player.given : SPEAKER_LABEL.DOYUN;
    return SPEAKER_LABEL[who] || who;
  }

  function lineParts(line) {
    if (line.card) return { who: '', cls: 'narr', text: T(line.sub || line.card) };
    if (line.fx === 'blackout') return { who: '', cls: 'narr', text: T(line.narr || '……') };
    if (line.who) {
      const label = speakerLabel(line.who);
      if (line.inner) return { who: `${label} · 속마음`, whoCls: 'inner', cls: 'inner', text: T(line.text) };
      const mono = !!line.mono;
      return { who: mono ? `${label} · 속마음` : label, whoCls: mono ? 'mono' : '', cls: mono ? 'mono' : 'quote', text: mono ? T(line.text) : `“${T(line.text)}”` };
    }
    return { who: '', cls: 'narr', text: T(line.narr) };
  }

  function deltaStrip(pr) {
    const chips = [];
    const ds = pr.delta.suspicion;
    const bandA = suspicionBand(pr.after.suspicion);
    chips.push(`<span class="chip ${ds > 0 ? 'danger' : ds < 0 ? 'teal' : ''}">${ds > 0 ? ICON.up : ds < 0 ? ICON.down : ICON.same}의심도 ${pr.before.suspicion} → ${pr.after.suspicion} (${fmtDelta(ds)}) · ${bandA.label}</span>`);
    const dt = pr.delta.trust.HAERIN;
    if (dt) chips.push(`<span class="chip ${dt > 0 ? 'gold' : 'warn'}">${ICON.heart}서해린 신뢰 ${pr.before.trust.HAERIN} → ${pr.after.trust.HAERIN} (${fmtDelta(dt)})</span>`);
    for (const e of pr.grantedEvidence) chips.push(`<span class="chip gold">${ICON.doc}확보 증거: ${esc(EVIDENCE[e].name)}</span>`);
    return `<div class="delta-strip" role="status">${chips.join('')}</div>`;
  }

  function dialogueScreen() {
    const run = game.run;
    const seq = currentSequence();
    if (ui.seqKey !== seq.key) {
      ui.seqKey = seq.key;
      ui.lineIdx = 0;
      ui.typed = 0;
      ui.typing = false;
      ui.picking = false;
      ui.shownLineKey = null;
    }
    const idx = Math.min(ui.lineIdx, seq.lines.length - 1);
    const line = seq.lines[idx];
    const st = stageAt(seq, idx);
    const parts = lineParts(line);
    const isLast = idx === seq.lines.length - 1;
    const lineKey = `${seq.key}#${idx}`;
    const fresh = ui.shownLineKey !== lineKey;
    const full = !fresh && !ui.typing;
    const showHud = !INTRO_NODES.includes(run.nodeId) || !!run.pendingReaction;
    const choicesReady = seq.mode === 'node' && seq.node.type === 'dialogue' && isLast && full && !game.canChoose();

    let bottom;
    if (choicesReady) bottom = choicesPanel(seq.node);
    else {
      bottom = `<div class="controls">
        ${!isLast ? `<button class="btn small ghost" data-act="skip">건너뛰기</button>` : ''}
        <span class="spacer"></span>
        <button class="btn primary next" data-act="next" ${full ? '' : 'disabled'} aria-label="다음 대사">다음 ${ICON.chevron}</button>
      </div>`;
    }

    return `<section class="screen dialogue-screen" aria-label="${esc(NODE_LABEL[run.nodeId])}">
      ${showHud ? hud(run) : `<header class="hud" style="border:0;background:transparent"><button class="icon-btn" data-act="menu" aria-label="메뉴">${ICON.menu}</button><span class="spacer" style="flex:1"></span></header>`}
      <div style="position:relative;flex:1;display:flex;flex-direction:column;min-height:0">
        ${stageMarkup(st, line)}
        ${seq.mode === 'reaction' ? deltaStrip(seq.pr) : ''}
      </div>
      <div class="textbox" data-act="reveal" role="button" tabindex="0" aria-label="대사 전체 보기">
        <div class="who ${parts.whoCls || ''}">${esc(parts.who)}</div>
        <div class="text ${parts.cls}" data-typer="${esc(lineKey)}" data-full="${esc(parts.text)}" aria-live="polite">${full ? esc(parts.text) : ''}</div>
        ${!full ? '<span class="tap-hint">눌러서 전체 보기</span>' : ''}
      </div>
      ${bottom}
    </section>`;
  }

  function startTyping(el) {
    const key = el.dataset.typer;
    const full = el.dataset.full;
    if (ui.shownLineKey === key) return; // 이미 전체 표시된 줄
    clearInterval(ui.timer);
    const seq = currentSequence();
    const line = seq.lines[Math.min(ui.lineIdx, seq.lines.length - 1)];
    if (line?.sfx) SFX.play(line.sfx);
    const speed = REDUCED || ui.autoplay ? 0 : SPEED[game.meta.settings.textSpeed] ?? SPEED.normal;
    ui.shownLineKey = key;
    if (!speed) {
      finishTyping(el, full);
      return;
    }
    ui.typing = true;
    ui.typed = 0;
    const chars = [...full];
    ui.timer = setInterval(() => {
      ui.typed += 1;
      el.textContent = chars.slice(0, ui.typed).join('');
      if (ui.typed >= chars.length) finishTyping(el, full);
    }, speed);
  }

  function finishTyping(el, full) {
    clearInterval(ui.timer);
    ui.typing = false;
    ui.revealedAt = performance.now();
    el.textContent = full;
    // 전체 표시 후 다음 버튼과 선택지를 갱신합니다.
    render();
  }

  function reveal() {
    const el = root.querySelector('[data-typer]');
    if (el && ui.typing) finishTyping(el, el.dataset.full);
  }

  function nextLine() {
    if (ui.typing) return; // 표시와 넘기기를 분리합니다.
    if (performance.now() - ui.revealedAt < 180) return; // 연타 오클릭 방지
    const seq = currentSequence();
    const idx = Math.min(ui.lineIdx, seq.lines.length - 1);
    if (idx < seq.lines.length - 1) {
      ui.lineIdx = idx + 1;
      render();
      return;
    }
    if (seq.mode === 'reaction') {
      game.ackReaction();
    } else if (seq.node.type === 'scene') {
      game.advance();
    }
    render();
  }

  function skipLines() {
    const seq = currentSequence();
    ui.lineIdx = seq.lines.length - 1;
    ui.shownLineKey = `${seq.key}#${ui.lineIdx}`; // 마지막 줄을 즉시 전체 표시
    ui.typing = false;
    ui.revealedAt = performance.now();
    clearInterval(ui.timer);
    const last = seq.lines[ui.lineIdx];
    if (last?.sfx) SFX.play(last.sfx);
    render();
  }

  function choicesPanel(node) {
    const run = game.run;
    const views = game.choiceView();
    const inv = run.inventory;
    const items = [];
    if (inv.magnifier > 0) items.push(`<button class="btn small" data-act="magnifier">${ICON.glass}기억 돋보기 ×${inv.magnifier}</button>`);
    const rehearsable = views.some((v) => v.enabled);
    if (inv.rehearsal > 0 || Object.keys(run.marks.rehearsal).length)
      items.push(`<button class="btn small ${ui.picking ? 'primary' : ''}" data-act="rehearsal" ${rehearsable ? '' : 'disabled'}>${ICON.mask}대화 리허설 ×${inv.rehearsal}</button>`);
    const dirText = { up: ['상승', ICON.up, 'danger'], same: ['유지', ICON.same, ''], down: ['하락', ICON.down, 'teal'] };
    const buttons = views
      .map((v) => {
        const c = v.choice;
        const badges = [];
        if (!v.enabled) badges.push(`<span class="chip">${ICON.lock}${esc(c.lockHint)}</span>`);
        if (v.related) badges.push(`<span class="chip teal">${ICON.notes}관련 단서 보유</span>`);
        if (v.magnified) badges.push(`<span class="chip danger">${ICON.glass}모순: ${esc(T(CLUES[v.magnified.clueId].text))}</span>`);
        if (v.rehearsal) {
          const [t, ic, cls] = dirText[v.rehearsal];
          badges.push(`<span class="chip ${cls}">${ic}리허설: 의심도 ${t}</span>`);
        }
        return `<button class="choice ${ui.picking && v.enabled ? 'picking' : ''} ${v.magnified ? 'contradict' : ''}" data-act="choose" data-id="${c.id}" ${v.enabled ? '' : 'disabled'}>
          <span>${esc(c.text)}</span>
          ${badges.length ? `<span class="badges">${badges.join('')}</span>` : ''}
        </button>`;
      })
      .join('');
    return `<div class="choices" role="group" aria-label="선택지">
      ${items.length ? `<div class="item-bar"><span class="label">아이템</span>${items.join('')}</div>` : ''}
      ${ui.picking ? `<div class="pick-banner"><span>미리 볼 선택지를 고르세요. 의심도의 방향만 표시합니다.</span><button class="btn small ghost" data-act="cancel-pick">취소</button></div>` : ''}
      ${buttons}
    </div>`;
  }

  function onChoose(id) {
    if (ui.locked) return;
    if (ui.picking) {
      const r = game.useRehearsal(id);
      ui.picking = false;
      if (!r.ok) showToast(MOVE_REASON_TEXT[r.reason] || '리허설을 쓸 수 없습니다.');
      else if (r.reused) showToast('이미 리허설한 선택지입니다. 추가로 소모하지 않았습니다.', 'info');
      render();
      return;
    }
    ui.locked = true;
    const res = game.choose(id);
    ui.locked = false;
    if (!res.ok) {
      showToast(MOVE_REASON_TEXT[res.reason] || '지금은 고를 수 없습니다.');
      return;
    }
    SFX.play('choose');
    if (res.reaction.tone === 'up_big') SFX.duckAmbient();
    if (res.reaction.removed) SFX.play('danger');
    render();
  }

  /* =============================== 이름 입력 =============================== */

  function nameDraft() {
    if (!ui.nameDraft) {
      const last = game.meta.lastPlayer;
      ui.nameDraft = last ? { surname: last.surname, given: last.given } : { surname: '', given: '' };
    }
    return ui.nameDraft;
  }

  function nameStatus(d) {
    const v = validatePlayerName(d);
    if (!d.surname.trim() && !d.given.trim()) return { ok: false, html: `<span class="muted">성과 이름을 차례로 떠올려 보세요.</span>` };
    if (!v.ok) return { ok: false, html: `<span class="err">${esc(v.errors[0])}</span>` };
    const g = v.player.given;
    return { ok: true, html: `<span class="ok">회장은 ‘${esc(g + josa(g, '아'))}’, 직원들은 ‘${esc(v.player.surname)} 실장님’이라고 부릅니다.</span>` };
  }

  function nameScreen() {
    const d = nameDraft();
    const st = nameStatus(d);
    const def = DEFAULT_PLAYER.surname + DEFAULT_PLAYER.given;
    return `<section class="screen name-screen" aria-label="이름 떠올리기">
      <div class="name-stage">
        ${stageMarkup(NODES.NAME_ENTRY.stage, null)}
        <div class="nameplate ${st.ok ? 'clear' : ''}" aria-hidden="true"><small>회장실 실장</small><b data-plate>${st.ok ? esc(d.surname.trim() + d.given.trim()) : '· · ·'}</b></div>
      </div>
      <form class="name-form" autocomplete="off" onsubmit="return false">
        <span class="eyebrow">기억해 내기</span>
        <h2>내 이름은…</h2>
        <p class="muted">번진 명패를 붙잡고, 가장 먼저 자기 이름을 떠올립니다.</p>
        <div class="name-fields">
          <label><span>성</span><input name="surname" value="${esc(d.surname)}" placeholder="${DEFAULT_PLAYER.surname}" maxlength="3" lang="ko" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="name-rule"></label>
          <label><span>이름</span><input name="given" value="${esc(d.given)}" placeholder="${DEFAULT_PLAYER.given}" maxlength="3" lang="ko" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="name-rule"></label>
        </div>
        <p class="legend" id="name-rule">${esc(NAME_RULE_TEXT)}. 회장 일가의 성(차)과 다른 등장인물의 이름은 쓸 수 없습니다.</p>
        <div class="name-status" data-name-status role="status" aria-live="polite">${st.html}</div>
        <div class="name-actions">
          <button type="button" class="btn" data-act="name-default" aria-label="기본 이름 ${esc(def)}으로 기억한다">${esc(def)} 그대로</button>
          <button type="button" class="btn primary" data-act="name-submit" ${st.ok ? '' : 'disabled'}>이 이름으로 기억한다</button>
        </div>
      </form>
    </section>`;
  }

  /** 입력 중에는 화면 전체를 다시 그리지 않아 한글 조합이 끊기지 않게 합니다. */
  function onNameInput(e) {
    const form = e.target.closest('.name-form');
    if (!form) return;
    const d = nameDraft();
    d[e.target.name] = e.target.value;
    const st = nameStatus(d);
    form.querySelector('[data-name-status]').innerHTML = st.html;
    form.querySelector('[data-act="name-submit"]').disabled = !st.ok;
    const plate = root.querySelector('.nameplate');
    plate.classList.toggle('clear', st.ok);
    plate.querySelector('[data-plate]').textContent = st.ok ? d.surname.trim() + d.given.trim() : '· · ·';
  }

  function submitName(input) {
    const form = root.querySelector('.name-form');
    const d = input || {
      surname: form?.querySelector('[name="surname"]').value ?? '',
      given: form?.querySelector('[name="given"]').value ?? '',
    };
    const res = game.setPlayerName(d);
    if (!res.ok) {
      if (form) form.querySelector('[data-name-status]').innerHTML = `<span class="err">${esc(res.errors?.[0] || '이 이름은 쓸 수 없습니다.')}</span>`;
      SFX.play('error');
      return;
    }
    ui.nameDraft = null;
    SFX.play('chime');
    render();
  }

  /* =============================== 튜토리얼 =============================== */

  function tutorialIntro() {
    const run = game.run;
    return `<section class="screen dialogue-screen">
      ${hud(run)}
      <div style="position:relative;flex:1;display:flex;flex-direction:column;min-height:0">
        ${stageMarkup({ loc: 'memory', cast: ['HAERIN'], seal: ['HAERIN'] }, null)}
      </div>
      <div class="textbox" style="cursor:default">
        <div class="who mono">연습 해체</div>
        <div class="text mono">${esc(TUTORIAL.intro)}</div>
      </div>
      <div class="controls" style="flex-direction:column;align-items:stretch">
        <p class="muted" style="margin:0 0 4px;font-size:13px">${esc(TUTORIAL.note)}${game.meta.tutorialSeen ? ' 이미 해 본 적이 있다면 건너뛰어도 됩니다.' : ''}</p>
        <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:8px">
          <button class="btn" data-act="tutorial-skip">건너뛰기</button>
          <button class="btn primary" data-act="tutorial-start">연습 시작</button>
        </div>
      </div>
    </section>`;
  }

  function tutorialStep(board, p) {
    const removed = board.plates.length - p.activePlates.length;
    if (p.status === 'cleared') return 'done';
    if (ui.selected) return 'move';
    if (removed >= 1) return 'reveal';
    if (p.moves > 0) return 'plate';
    return 'select';
  }

  /* =============================== 허브 =============================== */

  function hubScreen() {
    const run = game.run;
    const byWho = { HAERIN: [], TAEGEON: [] };
    for (const t of TOPIC_ORDER) byWho[TOPICS[t].target].push(TOPICS[t]);
    const statusChip = (t) => {
      const a = run.topicAttempts[t.id];
      if (!a) return `<span class="chip teal">미조사</span>`;
      if (a.status === 'completed') return `<span class="chip gold">완료 · ${DIFFICULTIES[a.difficulty].name}</span>`;
      if (a.status === 'abandoned') return `<span class="chip dim">${ICON.flag}포기</span>`;
      return `<span class="chip warn">진행 중</span>`;
    };
    const card = (who) => {
      const ch = CHARACTERS[who];
      return `<article class="who-card">
        <div class="portrait">${silhouette(who, { label: ch.name })}</div>
        <div>
          <h3>${ch.name}</h3>
          <div class="role">${ch.role} · ${ch.age}세${who === 'HAERIN' ? ` · 신뢰 ${run.trust.HAERIN}` : ''}</div>
          ${byWho[who]
            .map(
              (t) => `<button class="topic-btn" data-act="topic" data-id="${t.id}" ${run.topicAttempts[t.id] ? 'disabled' : ''}>
                <span><span class="t-title">${esc(t.title)}</span><span class="t-sub">${esc(t.teaser)}</span></span>
                ${statusChip(t)}
              </button>`,
            )
            .join('')}
        </div>
      </article>`;
    };
    const allDone = TOPIC_ORDER.every((t) => run.topicAttempts[t]);
    const highlightFinish = run.focus === 0 || allDone;
    return `<section class="screen hub-screen loc-memory" style="background:radial-gradient(70% 40% at 50% 0%, rgb(79 179 173 / .18), transparent 70%), #0b1416">
      ${hud(run)}
      <div class="scroll" style="flex:1">
        <div class="hub-head">
          <span class="eyebrow">D-30 · 회장의 첫 질문 직전</span>
          <h2>${HUB.title}</h2>
          <p>${esc(HUB.desc)}</p>
          <div class="focus-row">${ICON.focus}<span>집중력 <b>${run.focus}</b> / 4</span>${pips(run.focus, 4)}</div>
        </div>
        ${card('HAERIN')}
        ${card('TAEGEON')}
        <div class="hub-actions">
          <button class="btn notes-btn" data-act="notes">${ICON.notes}노트 보기</button>
          <button class="btn ${highlightFinish ? 'primary' : ''}" data-act="finish-investigation">조사를 마치고 보고하기 ${ICON.chevron}</button>
          ${run.focus === 0 && !allDone ? '<p class="muted" style="margin:0;font-size:13px;text-align:center">집중력을 모두 썼습니다. 노트 확인과 대화 진행은 계속할 수 있습니다.</p>' : ''}
        </div>
      </div>
    </section>`;
  }

  function difficultySheet(o) {
    const run = game.run;
    const t = TOPICS[o.topicId];
    const opts = Object.values(DIFFICULTIES)
      .map((d) => {
        const lack = run.focus < d.cost;
        return `<button class="diff-opt" role="radio" aria-checked="${o.diff === d.id}" data-act="pick-diff" data-id="${d.id}" ${lack ? 'disabled' : ''}>
          <span class="row"><span class="name"><span class="radio"></span>${d.name}</span><span>${pips(d.cost, 4, 'cost')}</span></span>
          <dl>
            <dt>집중력</dt><dd>${d.cost}</dd>
            <dt>단서</dt><dd>${d.clueText}</dd>
            <dt>지급 아이템</dt><dd>${itemList(d.items)}</dd>
            <dt>이동 한도</dt><dd>${getBoard(d.boardId).moveLimit}회</dd>
          </dl>
          ${lack ? `<span class="why">집중력이 부족합니다 (필요 ${d.cost} / 보유 ${run.focus})</span>` : ''}
        </button>`;
      })
      .join('');
    const sel = DIFFICULTIES[o.diff];
    const can = sel && run.focus >= sel.cost;
    return `<div class="overlay" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="난이도 선택">
        <div class="sheet-head">
          <div><span class="eyebrow">${CHARACTERS[t.target].name}의 기억</span><h2>${esc(t.title)}</h2><p class="muted" style="font-size:13px">${esc(t.teaser)}</p></div>
          <button class="icon-btn" data-act="close" aria-label="닫기">${ICON.close}</button>
        </div>
        <div class="sheet-body" role="radiogroup">
          ${opts}
          <p class="legend">집중력은 조사 시작을 확정할 때만 줄어듭니다. 해체를 마치면 아이템을 확정 지급합니다. 이 주제는 이번 사건에서 한 번만 조사할 수 있습니다.</p>
        </div>
        <div class="sheet-foot">
          <button class="btn" data-act="close">취소</button>
          <button class="btn primary" data-act="start-topic" ${can ? '' : 'disabled'} data-autofocus>조사 시작${sel ? ` · 집중력 −${sel.cost}` : ''}</button>
        </div>
      </div>
    </div>`;
  }

  /* =============================== 퍼즐 =============================== */

  function puzzleContext(view) {
    const run = game.run;
    if (view) return view;
    const p = run.activePuzzle;
    const board = getBoard(p.boardId);
    const tutorial = p.kind === 'tutorial';
    const topic = tutorial ? null : TOPICS[p.topicId];
    const labels = Object.fromEntries(Object.entries(tutorial ? TUTORIAL.plates : topic.plates).map(([k, v]) => [k, v.label]));
    return { board, p, tutorial, topic, labels, symbol: tutorial ? 'mask' : topic.symbol, final: false };
  }

  function puzzleScreen(view) {
    const run = game.run;
    const ctx = puzzleContext(view);
    const { board, p, tutorial, topic } = ctx;
    const playing = p.status === 'playing' && !ctx.final;
    const targets = playing && ui.selected ? validDestinations(board, p, ui.selected) : [];
    let hint = null;
    let step = null;
    if (tutorial && !ctx.final) {
      step = tutorialStep(board, p);
      if (playing) {
        const nh = nextHint(board, p);
        if (nh) {
          if (!ui.selected) hint = { hole: nh[0] };
          else if (ui.selected === nh[0]) hint = { hole: nh[1] };
        }
      }
    }
    const anim = ui.anim || {};
    const svg = boardMarkup(board, p, {
      selected: ui.selected,
      targets: targets.filter((t) => t !== TEMP_HOLE_ID),
      hint,
      labels: ctx.labels,
      symbol: ctx.symbol,
      falling: anim.falling || [],
      revealed: anim.revealed || [],
      moved: anim.moved || null,
    });
    const left = p.moveLimit - p.moves;
    const title = tutorial ? '연습 해체' : `${CHARACTERS[topic.target].name} · ${topic.title}`;
    const sub = tutorial ? '보상 없음 · 집중력 소모 없음' : `${DIFFICULTIES[p.difficulty].name} · ${DEPTH_LABEL[DIFFICULTIES[p.difficulty].depth]}까지`;
    const inv = run.inventory;

    const tray = p.tempHole
      ? `<div class="pz-tray"><span class="lbl">임시 나사함</span>
          <button class="temp-slot ${targets.includes(TEMP_HOLE_ID) ? 'is-target' : ''} ${ui.selected === TEMP_HOLE_ID ? 'selected' : ''}" data-act="temp-slot" aria-label="임시 나사함 구멍${p.screws.includes(TEMP_HOLE_ID) ? ', 나사 있음' : ', 비어 있음'}">
            ${slotMarkup({ hasScrew: p.screws.includes(TEMP_HOLE_ID), selected: ui.selected === TEMP_HOLE_ID })}
          </button></div>`
      : '';

    let msg = ui.msg;
    let guide = '';
    if (tutorial && step) guide = `<div class="tutorial-box" role="status">${ICON.info}<span>${esc(TUTORIAL.steps[step])}</span></div>`;
    if (ctx.final) msg = { text: '해체 완료. 기억이 흘러나온다.', kind: 'mem' };

    let tools;
    if (tutorial) {
      tools = p.status === 'cleared'
        ? `<div class="pz-tools" style="grid-template-columns:1fr"><button class="btn primary" data-act="tutorial-done">회장실로 ${ICON.chevron}</button></div>`
        : `<div class="pz-tools" style="grid-template-columns:1fr 1fr">
            <button class="btn" data-act="pz-retry">${ICON.restart}처음부터</button>
            <button class="btn" data-act="tutorial-skip">${ICON.chevron}건너뛰기</button>
          </div>`;
    } else {
      tools = `<div class="pz-tools">
        <button class="btn" data-act="pz-undo" ${inv.undo > 0 && p.undoStack.length && playing ? '' : 'disabled'} aria-label="되감기 도구, ${inv.undo}개">${ICON.undo}되감기<span class="n">×${inv.undo}</span></button>
        <button class="btn" data-act="pz-temp" ${inv.temp_hole > 0 && !p.tempHole && playing ? '' : 'disabled'} aria-label="임시 나사함, ${inv.temp_hole}개">${ICON.hole}임시 나사함<span class="n">${p.tempHole ? '사용함' : `×${inv.temp_hole}`}</span></button>
        <button class="btn" data-act="pz-retry" ${ctx.final ? 'disabled' : ''}>${ICON.restart}처음부터<span class="n">집중력 그대로</span></button>
        <button class="btn danger" data-act="pz-abandon" ${ctx.final ? 'disabled' : ''}>${ICON.flag}포기<span class="n">환급 없음</span></button>
      </div>`;
    }

    return `<section class="screen puzzle-screen" aria-label="스크류 퍼즐">
      <div class="pz-top">
        <button class="icon-btn" data-act="menu" aria-label="메뉴">${ICON.menu}</button>
        <div class="pz-title"><div class="t">${esc(title)}</div><div class="s">${esc(sub)}</div></div>
        <div class="moves ${left <= 2 && !ctx.final ? 'near' : ''}" aria-label="이동 ${p.moves}회, 한도 ${p.moveLimit}회"><b>${p.moves}</b><small> / ${p.moveLimit}</small><div style="font-size:11px;color:var(--muted)">이동</div></div>
        ${tutorial ? '' : `<button class="icon-btn notes-btn" data-act="notes" aria-label="노트">${ICON.notes}</button>`}
      </div>
      <div class="board-wrap"><svg data-board viewBox="0 0 640 640" role="img" aria-label="나사 퍼즐 보드. 나사를 눌러 집고 빈 구멍을 눌러 옮깁니다.">${svg}</svg></div>
      ${guide}
      <div class="pz-msg ${msg?.kind || ''}" aria-live="polite">${esc(msg?.text || (playing && ui.selected ? '점선 고리가 있는 빈 구멍을 누르세요. 같은 나사를 다시 누르면 취소합니다.' : playing ? '나사를 눌러 집으세요.' : ''))}</div>
      ${tray}
      ${tools}
      ${!ctx.final && !ui.anim ? puzzleStateOverlay(board, p, tutorial) : ''}
    </section>`;
  }

  function puzzleStateOverlay(board, p, tutorial) {
    if (ui.overlay) return '';
    const inv = game.run.inventory;
    const canUndo = !tutorial && inv.undo > 0 && p.undoStack.length > 0;
    const canTemp = !tutorial && inv.temp_hole > 0 && !p.tempHole;
    if (p.status === 'failed') {
      return `<div class="overlay center"><div class="sheet" role="alertdialog" aria-modal="true" aria-label="이동 한도 도달">
        <div class="sheet-head"><h2>이동 한도에 도달했습니다</h2></div>
        <div class="sheet-body"><p>판이 아직 ${p.activePlates.length}장 남아 있습니다. 같은 보드를 처음부터 다시 풀 수 있고, 집중력은 다시 쓰지 않습니다.${tutorial ? '' : ' 이미 쓴 아이템은 돌아오지 않습니다.'}</p></div>
        <div class="menu-list" style="margin-top:12px">
          ${canUndo ? `<button class="btn" data-act="pz-undo">${ICON.undo}되감기 사용 (×${inv.undo})</button>` : ''}
          <button class="btn primary" data-act="pz-retry-now" data-autofocus>${ICON.restart}처음부터 다시</button>
          ${tutorial ? `<button class="btn" data-act="tutorial-skip">튜토리얼 건너뛰기</button>` : `<button class="btn danger" data-act="pz-abandon">${ICON.flag}포기하고 돌아가기</button>`}
        </div>
      </div></div>`;
    }
    if (p.status === 'playing' && !hasAnyValidMove(board, p)) {
      return `<div class="overlay center"><div class="sheet" role="alertdialog" aria-modal="true" aria-label="이동 불가">
        <div class="sheet-head"><h2>옮길 수 있는 나사가 없습니다</h2></div>
        <div class="sheet-body"><p>보이는 빈 구멍이 없어 더 움직일 수 없습니다.</p></div>
        <div class="menu-list" style="margin-top:12px">
          ${canTemp ? `<button class="btn" data-act="pz-temp">${ICON.hole}임시 나사함 사용 (×${inv.temp_hole})</button>` : ''}
          ${canUndo ? `<button class="btn" data-act="pz-undo">${ICON.undo}되감기 사용 (×${inv.undo})</button>` : ''}
          <button class="btn primary" data-act="pz-retry-now" data-autofocus>${ICON.restart}처음부터 다시</button>
          ${tutorial ? `<button class="btn" data-act="tutorial-skip">튜토리얼 건너뛰기</button>` : `<button class="btn danger" data-act="pz-abandon">${ICON.flag}포기하고 돌아가기</button>`}
        </div>
      </div></div>`;
    }
    return '';
  }

  function onBoardClick(e) {
    const svg = e.currentTarget;
    const run = game.run;
    if (!run?.activePuzzle) return;
    const { x, y } = toLogical(svg, e.clientX, e.clientY);
    const board = getBoard(run.activePuzzle.boardId);
    const hole = pickHole(board, run.activePuzzle, x, y, 50);
    tapHole(hole, { x, y, board });
  }

  function setMsg(text, kind = '') {
    ui.msg = text ? { text, kind } : null;
  }

  function tapHole(holeId, { x, y, board } = {}) {
    const run = game.run;
    const p = run?.activePuzzle;
    if (!p || ui.locked || ui.clearView) return;
    board = board || getBoard(p.boardId);
    if (p.status !== 'playing') {
      setMsg(MOVE_REASON_TEXT[REASONS.NOT_PLAYING], 'err');
      render();
      return;
    }
    if (!ui.selected) {
      if (!holeId) {
        if (x !== undefined && plateAt(board, p, x, y)) setMsg('판은 직접 움직일 수 없습니다. 판을 지지하는 나사를 먼저 옮기세요.');
        else setMsg('');
      } else if (hasScrew(p, holeId)) {
        if (canSelect(board, p, holeId)) {
          ui.selected = holeId;
          setMsg('');
          SFX.play('select');
        } else setMsg(MOVE_REASON_TEXT[REASONS.SRC_BLOCKED], 'err');
      } else {
        setMsg('먼저 옮길 나사를 고르세요.', 'err');
        SFX.play('error');
      }
      render();
      return;
    }
    if (!holeId) {
      setMsg(x !== undefined && plateAt(board, p, x, y) ? '판 위에는 뚫린 구멍에만 넣을 수 있습니다.' : '점선 고리가 있는 빈 구멍을 누르세요.', 'err');
      SFX.play('error');
      render();
      return;
    }
    if (holeId === ui.selected) {
      ui.selected = null;
      setMsg('선택을 취소했습니다.');
      render();
      return;
    }
    if (hasScrew(p, holeId)) {
      if (canSelect(board, p, holeId)) {
        ui.selected = holeId;
        setMsg('');
        SFX.play('select');
      }
      render();
      return;
    }
    doMove(ui.selected, holeId);
  }

  function doMove(src, dst) {
    const run = game.run;
    const p = run.activePuzzle;
    const ctx = puzzleContext();
    const res = game.puzzleMove(src, dst);
    if (!res.ok) {
      setMsg(MOVE_REASON_TEXT[res.reason] || '옮길 수 없습니다.', 'err');
      SFX.play('error');
      render();
      return;
    }
    ui.selected = null;
    SFX.play('move');
    const removed = res.removed || [];
    ui.anim = { falling: removed, revealed: res.revealed || [], moved: dst };
    if (removed.length) {
      setTimeout(() => SFX.play('plate'), 90);
      const flavor = ctx.tutorial ? TUTORIAL.plates : ctx.topic.plates;
      const last = removed[removed.length - 1];
      setMsg(`기억 파편 · ${flavor[last]?.fall || ''}`, 'mem');
      if ((res.revealed || []).length) setTimeout(() => SFX.play('memory'), 380);
    } else setMsg('');
    if (res.failed) setTimeout(() => SFX.play('error'), 300);

    if (res.cleared && !ctx.tutorial) {
      // 보상과 노드 이동은 이미 커밋됨. 마지막 판이 떨어지는 장면만 잠시 보여 줍니다.
      ui.clearView = { ...ctx, p: { ...p, ...res.state }, final: true };
      setTimeout(() => SFX.play('clear'), 450);
    } else if (res.cleared) {
      setTimeout(() => SFX.play('clear'), 450);
    }
    lockFor(removed.length || res.cleared ? (REDUCED ? 60 : 760) : 180, () => {
      ui.anim = null;
      if (ui.clearView) {
        setTimeout(() => {
          ui.clearView = null;
          setMsg('');
          render();
        }, REDUCED ? 100 : 520);
      }
    });
    render();
  }

  function lockFor(ms, done) {
    ui.locked = true;
    clearTimeout(ui.animTimer);
    ui.animTimer = setTimeout(() => {
      ui.locked = false;
      done?.();
      render();
    }, ms);
  }

  /* =============================== 보상 =============================== */

  function rewardScreen() {
    const run = game.run;
    const r = run.lastReward;
    const t = TOPICS[r.topicId];
    const d = DIFFICULTIES[r.difficulty];
    const clueCards = r.clues
      .map((cid) => {
        const c = CLUES[cid];
        return `<div class="note-item"><div class="meta"><span class="chip teal">${DEPTH_LABEL[c.depth]}</span><span class="chip">기억 단서</span>${r.newClues.includes(cid) ? '' : '<span class="chip dim">이미 확보</span>'}</div>${esc(T(c.text))}</div>`;
      })
      .join('');
    return `<section class="screen reward-screen">
      ${hud(run)}
      <div class="scroll" style="flex:1"><div class="body-col">
        <span class="eyebrow">해체 완료 · ${d.name}</span>
        <h2 class="big-title">${CHARACTERS[t.target].name} · ${esc(t.title)}</h2>
        <p class="fragment">${esc(T(t.fragment))}</p>
        <div class="section"><h3>얻은 기억 단서 ${r.clues.length}개</h3>${clueCards}
          <p class="legend">기억 단서는 상대가 겪거나 믿는 내용입니다. 실물 증거와는 다릅니다.</p></div>
        <div class="section"><h3>지급 아이템</h3><div class="note-item">${itemList(r.items)}</div></div>
        <div class="section"><h3>남은 집중력</h3><div class="focus-row">${pips(run.focus, 4)}<b>${run.focus}</b> / 4</div></div>
      </div></div>
      <div class="foot-actions" style="grid-template-columns:1fr"><button class="btn primary" data-act="close-reward">멈춘 시간으로 돌아가기</button></div>
    </section>`;
  }

  /* =============================== 결과 =============================== */

  function resultScreen() {
    const run = game.run;
    const res = run.result;
    const end = ENDINGS[res.endingId];
    const minutes = Math.floor((run.endedAt - run.startedAt) / 60000);
    const seconds = Math.floor(((run.endedAt - run.startedAt) % 60000) / 1000);
    const removed = res.endingId === 'END_REMOVED';
    let causeHtml = '';
    if (removed && res.cause) {
      const node = NODES[res.cause.nodeId];
      const choice = node.choices.find((c) => c.id === res.cause.choiceId);
      causeHtml = `<div class="section"><h3>결정적인 발언</h3>
        <div class="note-item"><div>${esc(choice.text)}</div>
        <div class="meta"><span class="chip">${res.cause.choiceId}</span><span class="chip danger">의심도 ${res.cause.before.suspicion} → ${res.cause.after.suspicion}</span><span class="chip">서해린 신뢰 ${res.cause.after.trust.HAERIN}</span></div></div></div>`;
    }
    let clueHtml = '';
    if (res.caseClue) {
      const c = CLUES[res.caseClue.id];
      clueHtml = `<div class="section"><h3>공통 후속 단서</h3><div class="note-item evidence"><div class="meta"><span class="chip gold">사건 정리</span>${res.caseClue.reconfirmed ? '<span class="chip teal">다시 확인됨</span>' : '<span class="chip gold">새 단서</span>'}</div>${esc(T(res.caseClue.reconfirmed ? c.reconfirmText : c.text))}</div></div>`;
    }
    const msg = end.message ? `<div class="msg-bubble"><small>${CHARACTERS[end.message.from].name} · 문자 메시지</small>${esc(end.message.text)}</div>` : '';
    const leftItems = Object.entries(run.inventory).filter(([, n]) => n > 0);
    return `<section class="screen result-screen tone-${end.tone}">
      <div class="scroll" style="flex:1"><div class="body-col">
        <span class="eyebrow">${CASE_INFO.day} · ${esc(CASE_INFO.title)} · 결과</span>
        <h2 class="big-title">${esc(end.title)}</h2>
        <p class="tagline">${esc(end.tagline)}</p>
        <div class="story-lines">${end.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
        ${msg}
        ${causeHtml}
        ${clueHtml}
        <div class="section"><h3>이번 시도 요약</h3>
          <dl class="stat-grid">
            <dt>조직 의심도</dt><dd>20 → ${run.suspicion} · ${suspicionBand(run.suspicion).label}</dd>
            <dt>서해린 신뢰</dt><dd>50 → ${run.trust.HAERIN}</dd>
            <dt>기억 단서</dt><dd>${run.clues.filter((c) => c !== 'C_CASE_01_END').length}개</dd>
            <dt>확보 증거</dt><dd>${run.evidence.length ? run.evidence.map((e) => EVIDENCE[e].name).join(', ') : '없음'}</dd>
            <dt>남은 집중력</dt><dd>${run.focus}</dd>
            <dt>사건 플레이 시간</dt><dd>${minutes}분 ${seconds}초</dd>
            <dt>본 결과</dt><dd>${game.meta.endingsSeen.length} / 4</dd>
          </dl>
        </div>
        ${removed ? '' : `<p class="tagline" style="font-size:15px">${esc(RESULT_COMMON.daysLine)}</p>`}
        ${end.preview ? `<div class="preview"><span class="eyebrow">D-29 예고</span>${esc(end.preview)}</div>` : ''}
        ${removed ? '' : `<p class="legend">${leftItems.length ? `남은 아이템: ${leftItems.map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(', ')}. ` : ''}${esc(RESULT_COMMON.nextCaseNote)}</p>`}
      </div></div>
      <div class="foot-actions">
        <button class="btn" data-act="to-title">타이틀로</button>
        <button class="btn primary" data-act="retry-case-now">사건 다시 하기</button>
      </div>
    </section>`;
  }

  /* =============================== 노트 =============================== */

  function notesContent(tab, { all = false } = {}) {
    const run = game.run;
    const sections = [];
    if (all || tab === 'clues') {
      const groups = TOPIC_ORDER.map((tid) => {
        const t = TOPICS[tid];
        const items = t.clues
          .map((cid) => {
            const c = CLUES[cid];
            const st = game.clueStatus(cid);
            const depth = `<span class="chip teal">${DEPTH_LABEL[c.depth]}</span>`;
            if (st === 'owned') return `<div class="note-item"><div class="meta">${depth}<span class="chip">이번 시도 확보</span></div>${esc(T(c.text))}</div>`;
            if (st === 'past') return `<div class="note-item past"><div class="meta">${depth}<span class="chip dim">지난 시도에서 열람 · 이번 시도 미확보</span></div>${esc(T(c.text))}</div>`;
            return `<div class="note-item unknown">${DEPTH_LABEL[c.depth]} · 아직 보지 못한 기억</div>`;
          })
          .join('');
        const a = run?.topicAttempts[tid];
        const state = a ? (a.status === 'completed' ? `완료 · ${DIFFICULTIES[a.difficulty].name}` : a.status === 'abandoned' ? '포기' : '진행 중') : '미조사';
        return `<div class="note-group"><h4>${CHARACTERS[t.target].name} · ${esc(t.title)} <span class="faint" style="font-weight:500">(${state})</span></h4>${items}</div>`;
      }).join('');
      const end = game.clueStatus('C_CASE_01_END');
      const endHtml =
        end === 'unknown'
          ? ''
          : `<div class="note-group"><h4>사건 정리</h4><div class="note-item ${end === 'past' ? 'past' : ''}"><div class="meta"><span class="chip gold">공통 후속 단서</span>${end === 'past' ? '<span class="chip dim">지난 시도에서 열람 · 이번 시도 미확보</span>' : ''}</div>${esc(T(CLUES.C_CASE_01_END.text))}</div></div>`;
      sections.push(`<p class="legend">기억 단서는 독심으로 읽은 내용입니다. 상대가 믿는 것이지, 객관적 사실이나 실물 증거는 아닙니다.</p>${groups}${endHtml}`);
    }
    if (all || tab === 'evidence') {
      const items = Object.values(EVIDENCE)
        .map((e) => {
          if (run?.evidence.includes(e.id)) return `<div class="note-item evidence"><div class="meta"><span class="chip gold">${ICON.doc}확보 증거</span></div><b>${esc(e.name)}</b><div>${esc(e.text)}</div><div class="muted" style="font-size:13px">${esc(e.note)}</div></div>`;
          if (game.meta.evidenceSeen.includes(e.id)) return `<div class="note-item past"><div class="meta"><span class="chip dim">지난 시도에서 확보 · 이번 시도 미확보</span></div><b>${esc(e.name)}</b></div>`;
          return `<div class="note-item unknown">아직 확보한 실물 증거가 없습니다.</div>`;
        })
        .join('');
      sections.push(`<div class="note-group"><h4>확보 증거</h4>${items}<p class="legend">확보 증거는 실제 문서입니다. 상대 앞에 내밀 수 있는 것은 실물뿐입니다.</p></div>`);
    }
    if (all || tab === 'people') {
      const ppl = [...(run?.player ? ['DOYUN'] : []), 'HAERIN', 'TAEGEON', 'MUJIN', 'SEOJIN']
        .map((id) => {
          const c = CHARACTERS[id];
          return `<div class="note-item"><div class="meta"><b>${esc(T(c.name))}${id === 'DOYUN' ? ' (나)' : ''}</b><span class="chip">${c.age}세 · ${esc(c.role)}</span>${id === 'HAERIN' && run ? `<span class="chip gold">${ICON.heart}신뢰 ${run.trust.HAERIN}</span>` : ''}</div><div class="muted" style="font-size:13px">${esc(T(c.note))}</div></div>`;
        })
        .join('');
      sections.push(`<div class="note-group"><h4>인물</h4>${ppl}</div>`);
    }
    return sections.join('');
  }

  function notesSheet(o) {
    const tabs = [
      ['clues', '기억 단서'],
      ['evidence', '확보 증거'],
      ['people', '인물'],
    ];
    return `<div class="overlay" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="노트" style="height:88%">
        <div class="sheet-head"><h2>노트</h2><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></div>
        <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button class="tab" role="tab" aria-selected="${o.tab === id}" data-act="notes-tab" data-id="${id}">${label}</button>`).join('')}</div>
        <div class="sheet-body">${notesContent(o.tab)}</div>
      </div>
    </div>`;
  }

  function renderSide() {
    const run = game.run;
    const show = ui.view === 'game' && run && !INTRO_NODES.includes(run.nodeId);
    shell.classList.toggle('with-side', !!show);
    if (show) side.innerHTML = `<h2 class="side-title">노트</h2><p class="legend" style="margin:0 0 10px">읽기 전용 · 진행 상태를 바꾸지 않습니다.</p>${notesContent(null, { all: true })}`;
    else side.innerHTML = '';
  }

  /* =============================== 메뉴 · 설정 · 확인 =============================== */

  function menuSheet() {
    const inGame = ui.view === 'game' && game.run;
    return `<div class="overlay center" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="메뉴">
        <div class="sheet-head"><h2>메뉴</h2><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></div>
        <div class="menu-list">
          ${inGame ? `<button class="btn" data-act="notes">${ICON.notes}노트</button>` : ''}
          <button class="btn" data-act="settings">설정</button>
          ${inGame && !INTRO_NODES.includes(game.run.nodeId) ? `<button class="btn" data-act="retry-case">${ICON.restart}사건 처음부터 다시</button>` : ''}
          ${inGame ? `<button class="btn" data-act="to-title">타이틀로 나가기</button>` : ''}
          <p class="legend">진행은 자동 저장됩니다. 타이틀에서 이어하기로 돌아올 수 있습니다.</p>
        </div>
      </div>
    </div>`;
  }

  function settingsSheet() {
    const s = game.meta.settings;
    return `<div class="overlay center" data-act="overlay-bg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="설정">
        <div class="sheet-head"><h2>설정</h2><button class="icon-btn" data-act="close" aria-label="닫기" data-autofocus>${ICON.close}</button></div>
        <div class="sheet-body">
          <div class="setting-row"><span>소리</span><button class="switch" role="switch" aria-checked="${!s.muted}" data-act="toggle-sound" aria-label="소리 켜기"></button></div>
          <div class="setting-row"><span>대사 속도</span><span class="seg">${[
            ['normal', '보통'],
            ['fast', '빠르게'],
            ['instant', '즉시'],
          ]
            .map(([v, l]) => `<button aria-pressed="${s.textSpeed === v}" data-act="text-speed" data-id="${v}">${l}</button>`)
            .join('')}</span></div>
          <div class="setting-row"><span>테스트용 상태 패널<br><small class="muted">수치·플래그·로그 표시 (단축키 \`)</small></span><button class="switch" role="switch" aria-checked="${s.debug}" data-act="toggle-debug" aria-label="테스트 패널"></button></div>
          <div class="setting-row"><span>모든 기록 초기화<br><small class="muted">진행·도감·엔딩·로그 삭제</small></span><button class="btn small danger" data-act="reset-all">초기화</button></div>
        </div>
      </div>
    </div>`;
  }

  function confirmSheet(o) {
    return `<div class="overlay center" data-act="overlay-bg">
      <div class="sheet" role="alertdialog" aria-modal="true" aria-label="${esc(o.title)}">
        <div class="sheet-head"><h2>${esc(o.title)}</h2></div>
        <div class="sheet-body">${o.body.map((b) => `<p>${esc(b)}</p>`).join('')}</div>
        <div class="sheet-foot">
          <button class="btn" data-act="close">${esc(o.cancel || '취소')}</button>
          <button class="btn ${o.danger ? 'danger' : 'primary'}" data-act="confirm-yes" data-autofocus>${esc(o.ok)}</button>
        </div>
      </div>
    </div>`;
  }

  function overlayMarkup() {
    const o = ui.overlay;
    if (!o) return '';
    if (o.type === 'notes') return notesSheet(o);
    if (o.type === 'difficulty') return difficultySheet(o);
    if (o.type === 'menu') return menuSheet();
    if (o.type === 'settings') return settingsSheet();
    if (o.type === 'confirm') return confirmSheet(o);
    return '';
  }

  function confirm(opts, onYes) {
    ui.overlay = { type: 'confirm', ...opts, onYes };
    render();
  }

  /* =============================== 테스트 패널 =============================== */

  function renderDebug() {
    if (!debugEl) return;
    if (!game.meta.settings.debug) {
      debugEl.hidden = true;
      return;
    }
    debugEl.hidden = false;
    const run = game.run;
    const p = run?.activePuzzle;
    const lines = run
      ? [
          `runId: ${run.runId}`,
          `node: ${run.nodeId}${run.pendingReaction ? ` (반응 표시 중: ${run.pendingReaction.choiceId})` : ''}`,
          `suspicion: ${run.suspicion}  trust.HAERIN: ${run.trust.HAERIN}  focus: ${run.focus}`,
          `inventory: ${JSON.stringify(run.inventory)}`,
          `clues: ${run.clues.join(', ') || '-'}`,
          `evidence: ${run.evidence.join(', ') || '-'}`,
          `flags: ${JSON.stringify(run.flags)}`,
          `topics: ${JSON.stringify(Object.fromEntries(Object.entries(run.topicAttempts).map(([k, v]) => [k, `${v.status}/${v.difficulty}`])))}`,
          `rewardClaims: ${run.rewardClaims.length}`,
          p ? `puzzle: ${p.boardId} ${p.status} moves ${p.moves}/${p.moveLimit} plates[${p.activePlates}] screws[${p.screws}] undo:${p.undoStack.length} T:${p.tempHole}` : 'puzzle: -',
          `codex: ${game.meta.codex.length}  endings: ${game.meta.endingsSeen.join(', ') || '-'}`,
          game.lastSaveError ? `SAVE ERROR: ${game.lastSaveError}` : 'save: ok',
        ]
      : ['run: 없음'];
    const log = game.log
      .list()
      .slice(-10)
      .map((e) => `${new Date(e.t).toLocaleTimeString()} ${e.type} ${JSON.stringify({ ...e, t: undefined, type: undefined, runId: undefined })}`)
      .join('\n');
    debugEl.innerHTML = `<h5><span>테스트 패널 (개발용)</span><span>${p && p.status === 'playing' ? '<button data-dbg="solve">해법 재생</button> ' : ''}<button data-dbg="dump">콘솔 출력</button> <button data-dbg="hide">닫기</button></span></h5><pre>${esc(lines.join('\n'))}</pre><h5>최근 로그</h5><pre>${esc(log)}</pre>`;
  }

  async function debugSolve() {
    const run = game.run;
    const p = run?.activePuzzle;
    if (!p) return;
    ui.selected = null;
    const path = solve(getBoard(p.boardId), p);
    if (!path) {
      showToast('현재 상태에서 해법이 없습니다. 처음부터 다시 시도하세요.');
      return;
    }
    for (const [src, dst] of path) {
      while (ui.locked) await new Promise((r) => setTimeout(r, 50));
      if (!game.run?.activePuzzle) break;
      doMove(src, dst);
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  debugEl?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dbg]');
    if (!b) return;
    if (b.dataset.dbg === 'hide') game.updateSettings({ debug: false });
    if (b.dataset.dbg === 'dump') console.log('[UNCREW] state', structuredClone(game.state), 'log', game.log.list());
    if (b.dataset.dbg === 'solve') debugSolve();
    render();
  });

  /* =============================== 입력 처리 =============================== */

  const ACTIONS = {
    'name-submit': () => submitName(),
    'name-default': () => submitName({ ...DEFAULT_PLAYER }),
    'new-game': () => {
      const start = () => {
        game.newGame();
        ui.nameDraft = null;
        ui.view = 'game';
        ui.overlay = null;
        ui.seqKey = null;
        render();
      };
      if (game.hasContinue()) {
        confirm(
          {
            title: '새 게임을 시작할까요?',
            body: ['진행 중인 사건 기록이 사라집니다.', '열람한 단서 도감과 본 결과는 유지됩니다.'],
            ok: '새 게임 시작',
            danger: true,
          },
          start,
        );
      } else start();
    },
    continue: () => {
      if (!game.hasContinue()) return;
      ui.view = 'game';
      ui.seqKey = null;
      render();
    },
    settings: () => {
      ui.overlay = { type: 'settings' };
      render();
    },
    menu: () => {
      ui.overlay = { type: 'menu' };
      render();
    },
    notes: () => {
      ui.overlay = { type: 'notes', tab: 'clues' };
      render();
    },
    'notes-tab': (el) => {
      ui.overlay = { type: 'notes', tab: el.dataset.id };
      render();
    },
    close: () => {
      ui.overlay = null;
      render();
    },
    'overlay-bg': (el, e) => {
      if (e.target === el && ui.overlay?.type !== 'confirm') {
        ui.overlay = null;
        render();
      }
    },
    'confirm-yes': () => {
      const fn = ui.overlay?.onYes;
      ui.overlay = null;
      fn?.();
      render();
    },
    reveal: () => reveal(),
    next: () => nextLine(),
    skip: () => skipLines(),
    choose: (el) => onChoose(el.dataset.id),
    magnifier: () => {
      const r = game.useMagnifier();
      if (!r.ok) showToast(MOVE_REASON_TEXT[r.reason] || '돋보기를 쓸 수 없습니다.', r.reason === 'NO_TARGET' ? 'info' : '');
      else SFX.play('memory');
      render();
    },
    rehearsal: () => {
      ui.picking = !ui.picking;
      render();
    },
    'cancel-pick': () => {
      ui.picking = false;
      render();
    },
    'tutorial-start': () => {
      game.startTutorial();
      ui.selected = null;
      setMsg('');
      render();
    },
    'tutorial-skip': () => {
      game.finishTutorial({ skipped: true });
      ui.selected = null;
      ui.overlay = null;
      setMsg('');
      render();
    },
    'tutorial-done': () => {
      game.finishTutorial();
      ui.selected = null;
      setMsg('');
      render();
    },
    topic: (el) => {
      const run = game.run;
      const order = ['easy', 'normal', 'hard'];
      const diff = order.find((d) => DIFFICULTIES[d].cost <= run.focus) || 'easy';
      ui.overlay = { type: 'difficulty', topicId: el.dataset.id, diff };
      render();
    },
    'pick-diff': (el) => {
      ui.overlay.diff = el.dataset.id;
      render();
    },
    'start-topic': () => {
      if (ui.busy) return;
      ui.busy = true;
      const o = ui.overlay;
      const r = game.startTopic(o.topicId, o.diff);
      ui.busy = false;
      if (!r.ok) {
        showToast(r.reason === 'NO_FOCUS' ? '집중력이 부족합니다.' : '이 주제는 지금 조사할 수 없습니다.');
        return;
      }
      ui.overlay = null;
      ui.selected = null;
      setMsg('');
      render();
    },
    'finish-investigation': () => {
      const run = game.run;
      confirm(
        {
          title: '조사를 마치고 보고할까요?',
          body: [HUB.finishNote, ...(run.focus > 0 ? [`남은 집중력 ${run.focus}은 쓰지 않고 넘어갑니다.`] : [])],
          ok: '보고하러 가기',
        },
        () => game.finishInvestigation(),
      );
    },
    'close-reward': () => {
      game.closeReward();
      render();
    },
    'temp-slot': () => tapHole(TEMP_HOLE_ID),
    'pz-undo': () => {
      const r = game.puzzleUndo();
      if (!r.ok) setMsg(MOVE_REASON_TEXT[r.reason] || '되돌릴 수 없습니다.', 'err');
      else {
        ui.selected = null;
        setMsg('직전 이동을 되돌렸습니다. 되감기 도구 1개를 썼습니다.');
        SFX.play('move');
      }
      render();
    },
    'pz-temp': () => {
      confirm(
        {
          title: '임시 나사함을 쓸까요?',
          body: ['보드 밖에 언제나 쓸 수 있는 빈 구멍 하나가 생깁니다. 이 구멍의 나사는 어떤 판도 지지하지 않습니다.', '사용하면 지금까지의 되감기 기록이 지워집니다. 보드당 한 번만 쓸 수 있습니다.'],
          ok: '사용하기',
        },
        () => {
          const r = game.puzzleTempHole();
          if (!r.ok) setMsg(MOVE_REASON_TEXT[r.reason] || '쓸 수 없습니다.', 'err');
          else {
            ui.selected = null;
            setMsg('임시 나사함이 생겼습니다. 보드 아래 슬롯을 구멍처럼 쓸 수 있습니다.');
          }
        },
      );
    },
    'pz-retry': () => {
      const tutorial = game.run.activePuzzle?.kind === 'tutorial';
      confirm(
        {
          title: '처음부터 다시 풀까요?',
          body: tutorial ? ['연습 보드를 처음 배치로 되돌립니다.'] : ['같은 보드를 처음 배치로 되돌립니다. 집중력은 다시 쓰지 않습니다.', '이미 쓴 아이템은 돌아오지 않습니다. 임시 나사함을 썼다면 빈 상태로 남습니다.'],
          ok: '처음부터',
        },
        () => {
          game.puzzleRetry();
          ui.selected = null;
          setMsg('');
        },
      );
    },
    'pz-retry-now': () => {
      game.puzzleRetry();
      ui.selected = null;
      setMsg('');
      render();
    },
    'pz-abandon': () => {
      confirm(
        {
          title: '이 조사를 포기할까요?',
          body: ['집중력과 사용한 아이템은 돌려받지 못합니다.', '이 주제는 이번 사건에서 다시 고를 수 없습니다. 다른 주제를 조사하거나 보고를 진행할 수 있습니다.'],
          ok: '포기하기',
          danger: true,
        },
        () => {
          game.puzzleAbandon();
          ui.selected = null;
          setMsg('');
        },
      );
    },
    'retry-case': () => {
      confirm(
        {
          title: '사건을 처음부터 다시 할까요?',
          body: ['서해린과의 첫 대화부터 다시 시작합니다. 의심도·신뢰도·집중력·아이템·이번 시도의 단서가 모두 처음으로 돌아갑니다.', '열람한 단서 도감과 본 결과는 유지되지만, 이번 시도에서 다시 확보하기 전까지 선택지 조건에는 쓰이지 않습니다.'],
          ok: '다시 시작',
          danger: true,
        },
        () => {
          game.retryCase();
          ui.view = 'game';
          ui.seqKey = null;
          ui.selected = null;
          setMsg('');
        },
      );
    },
    'retry-case-now': () => {
      game.retryCase();
      ui.view = 'game';
      ui.seqKey = null;
      ui.selected = null;
      setMsg('');
      render();
    },
    'to-title': () => {
      ui.view = 'title';
      ui.overlay = null;
      ui.selected = null;
      SFX.setAmbient(false);
      render();
    },
    'toggle-sound': () => {
      const muted = !game.meta.settings.muted;
      game.updateSettings({ muted });
      SFX.setMuted(muted);
      if (muted) SFX.setAmbient(false);
      render();
    },
    'text-speed': (el) => {
      game.updateSettings({ textSpeed: el.dataset.id });
      render();
    },
    'toggle-debug': () => {
      game.updateSettings({ debug: !game.meta.settings.debug });
      render();
    },
    'reset-all': () => {
      confirm(
        { title: '모든 기록을 지울까요?', body: ['진행 중인 사건, 단서 도감, 본 결과, 설정, 로그를 모두 삭제합니다. 되돌릴 수 없습니다.'], ok: '모두 삭제', danger: true },
        () => {
          game.resetAllData();
          ui.view = 'title';
          SFX.setMuted(false);
        },
      );
    },
  };

  // 화면이 바뀌는 동작 직후의 연타가 새 화면의 다른 버튼을 누르지 않도록 잠시 막습니다.
  const SCREEN_CHANGING = new Set(['name-submit', 'name-default', 'new-game', 'continue', 'choose', 'start-topic', 'close-reward', 'confirm-yes', 'tutorial-start', 'tutorial-done', 'tutorial-skip', 'retry-case-now', 'to-title', 'next']);
  root.addEventListener('click', (e) => {
    SFX.unlockAudio();
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    if (el.disabled) return;
    if (performance.now() < ui.guardUntil) return;
    const act = el.dataset.act;
    const fn = ACTIONS[act];
    if (!fn) return;
    const before = `${ui.view}|${game.run?.nodeId}|${game.run?.pendingReaction?.choiceId}|${ui.overlay?.type}`;
    fn(el, e);
    const after = `${ui.view}|${game.run?.nodeId}|${game.run?.pendingReaction?.choiceId}|${ui.overlay?.type}`;
    if (SCREEN_CHANGING.has(act) && before !== after) ui.guardUntil = performance.now() + 320;
  });

  root.addEventListener('input', onNameInput);

  document.addEventListener('keydown', (e) => {
    if (e.target?.closest?.('input, textarea')) {
      if (e.key === 'Enter' && e.target.closest('.name-form')) {
        e.preventDefault();
        submitName();
      }
      return; // 입력 칸에서는 단축키를 쓰지 않습니다.
    }
    if (e.key === '`') {
      game.updateSettings({ debug: !game.meta.settings.debug });
      render();
      return;
    }
    if (e.key === 'Escape') {
      if (ui.overlay) {
        ui.overlay = null;
        render();
      } else if (ui.picking) {
        ui.picking = false;
        render();
      } else if (ui.selected) {
        ui.selected = null;
        setMsg('선택을 취소했습니다.');
        render();
      }
      return;
    }
    if (ui.overlay || ui.view !== 'game') return;
    const run = game.run;
    if (!run) return;
    const inDialogue = run.pendingReaction || ['scene', 'dialogue'].includes(NODES[run.nodeId]?.type);
    if (!inDialogue) return;
    if (e.key === ' ') {
      e.preventDefault();
      reveal();
    } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
      if (e.target.closest?.('button')) return; // 버튼 위의 Enter는 버튼 자체 동작
      e.preventDefault();
      nextLine();
    }
  });

  return {
    render,
    ui,
    /** 자동 테스트용: 대사 줄을 즉시 표시하도록 전환 */
    setAutoplay(v) {
      ui.autoplay = !!v;
    },
    tapHole,
  };
}

return { createApp };
});

/* ===== src/main.js ===== */
__define("src/main.js", function (__require) {
/*
 * 언스크류(UNCREW) — 진입점
 * 콘텐츠를 검증한 뒤 게임 상태와 UI를 연결합니다. 검증에 실패하면 오류 목록을 보여 주고 시작하지 않습니다.
 */
const CASE = __require("src/data/case01.js");
const { DIFFICULTIES, ITEMS } = __require("src/data/config.js");
const { PUZZLES, TUTORIAL_BOARD } = __require("src/data/puzzles.js");
const { validateContent } = __require("src/core/validate.js");
const { Game } = __require("src/core/game.js");
const { browserStorage } = __require("src/core/save.js");
const { createApp } = __require("src/ui/app.js");

const root = document.getElementById('app');
const errors = validateContent({ ...CASE, DIFFICULTIES, ITEMS, boards: [...PUZZLES, TUTORIAL_BOARD] });

if (errors.length) {
  root.innerHTML = `<section class="screen" style="padding:24px;gap:12px;overflow:auto">
    <h2>콘텐츠 데이터 오류</h2>
    <p class="muted">데이터를 고친 뒤 새로고침하세요. 없는 조건이나 결과를 임의로 채우지 않습니다.</p>
    <pre style="white-space:pre-wrap;font-size:12px">${errors.map((e) => e.replace(/</g, '&lt;')).join('\n')}</pre>
  </section>`;
  console.error('[UNCREW] content errors', errors);
} else {
  const game = new Game({ storage: browserStorage() });
  const app = createApp({
    root,
    side: document.getElementById('side'),
    debugEl: document.getElementById('debug'),
    shell: document.getElementById('shell'),
    game,
  });
  app.render();
  // 개발·자동 테스트용 핸들. 일반 플레이에는 필요하지 않습니다.
  globalThis.__uncrew = { game, app };
}

return {  };
});

__require("src/main.js");
})();

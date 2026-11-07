/*
 * 언스크류(UNCREW) — 첫 사건 데이터: 어제의 전달 목록 (CASE_01, D-30)
 *
 * 대본 줄 형식
 *   { who: 'HAERIN', text }            인물 대사
 *   { who: 'DOYUN', mono: true, text } 도윤의 속마음
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
  DOYUN: { id: 'DOYUN', name: '한도윤', short: '도윤', age: 35, role: '태경그룹 회장실 해결사', note: '십 년 동안 회장의 일을 처리해 왔다. 첫 번째 삶에서 횡령범으로 조작된 채 살해당했다.' },
  TAEGEON: { id: 'TAEGEON', name: '차태건', short: '차태건', age: 59, role: '태경그룹 회장', note: '가난하던 도윤에게 일자리와 기회를 준 사람. 사소한 취향과 가족 사정까지 기억한다.' },
  HAERIN: { id: 'HAERIN', name: '서해린', short: '서해린', age: 37, role: '회장 비서실장', note: '흐트러짐 없는 업무와 절제된 태도. 회장실의 모든 일정과 문서가 그녀를 거친다.' },
  MUJIN: { id: 'MUJIN', name: '권무진', short: '권무진', age: 45, role: '보안실장', note: '예의 바르고 조용하다. 첫 번째 삶의 마지막 밤, 주차장에서 기다리던 사람.' },
  SEOJIN: { id: 'SEOJIN', name: '윤서진', short: '윤 변호사', age: 34, role: '외부 변호사', note: '어제 도윤이 재단 결산 자료를 전달한 상대. 이번 사건에는 직접 등장하지 않는다.' },
};

export const SPEAKER_LABEL = {
  DOYUN: '도윤',
  TAEGEON: '차태건',
  TAEGEON_ECHO: '차태건 · 기억 속 목소리',
  HAERIN: '서해린',
  MUJIN: '권무진',
};

/* ------------------------------------------------------------------ */
/* 기억 단서 · 실물 증거                                                */
/* ------------------------------------------------------------------ */

export const CLUES = {
  C_HA_1: { id: 'C_HA_1', topic: 'HA', who: 'HAERIN', depth: 1, text: '회장은 도윤과 윤서진이 만났다는 사실을 이미 알고 있다.' },
  C_HA_2: { id: 'C_HA_2', topic: 'HA', who: 'HAERIN', depth: 2, text: '보안실장은 이번 점검 결과를 회장에게 직접 보고한다.' },
  C_HA_3: { id: 'C_HA_3', topic: 'HA', who: 'HAERIN', depth: 3, text: '도윤의 출입 기록이 다른 직원들과 분리되어 보존되고 있다.' },
  C_HB_1: { id: 'C_HB_1', topic: 'HB', who: 'HAERIN', depth: 1, text: '서해린은 자료 전달 목록을 보관하고 있다.' },
  C_HB_2: { id: 'C_HB_2', topic: 'HB', who: 'HAERIN', depth: 2, text: '실제 전달 목록에는 재단 결산 자료 3건이 적혀 있다.' },
  C_HB_3: { id: 'C_HB_3', topic: 'HB', who: 'HAERIN', depth: 3, text: '서해린은 해외 송금 전표의 사본을 전달 목록에서 제외했다.' },
  C_BA_1: { id: 'C_BA_1', topic: 'BA', who: 'TAEGEON', depth: 1, text: '회장은 만남 자체보다 외부에 전달된 문서의 범위를 걱정한다.' },
  C_BA_2: { id: 'C_BA_2', topic: 'BA', who: 'TAEGEON', depth: 2, text: '회장이 가장 신경 쓰는 문서는 특정 해외 송금 전표다.' },
  C_BA_3: { id: 'C_BA_3', topic: 'BA', who: 'TAEGEON', depth: 3, text: '회장은 도윤이 해당 전표의 중요성을 아직 모른다고 믿는다.' },
  C_BB_1: { id: 'C_BB_1', topic: 'BB', who: 'TAEGEON', depth: 1, text: '이번 질문에는 사실 확인과 도윤의 반응 확인이 함께 들어 있다.' },
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
    fragment: '차태건의 기억. 오래전, 아직 젊은 도윤이 처음 보고서를 들고 왔던 날. 그는 그때도 내용보다 손을 먼저 보았다.',
    plates: {
      A: { label: '목소리', fall: '“너도 좀 쉬어야지.” 같은 다정함.' },
      B: { label: '결재판', fall: '도장이 찍히지 않은 빈칸 하나.' },
      C: { label: '보고서', fall: '정해진 순서대로만 읽히는 문장들.' },
      D: { label: '창밖', fall: '도시를 내려다보는 사람의 오래된 습관.' },
      E: { label: '찻잔', fall: '손대지 않은 차가 천천히 식어 간다.' },
    },
  },
};

export const TOPIC_ORDER = ['HA', 'HB', 'BA', 'BB'];

/* ------------------------------------------------------------------ */
/* 장면(노드)                                                            */
/* ------------------------------------------------------------------ */

const PROLOGUE = {
  id: 'PROLOGUE',
  type: 'scene',
  next: 'RETURN',
  skippable: true,
  stage: { loc: 'parking', cast: [] },
  lines: [
    { narr: '대규모 승계 작업이 끝난 밤. 마지막 업무로 지정된 장소는 본사 지하 주차장이었다.' },
    { who: 'DOYUN', mono: true, text: '회장님께 보고만 하면 끝나는 일이었다.' },
    { who: 'DOYUN', mono: true, text: '십 년 동안, 나는 단 한 번도 그분의 지시를 의심하지 않았다.' },
    { narr: '차 보닛 위에 서류 봉투가 놓여 있다. 첫 장에 내 이름과 ‘횡령’이라는 단어가 나란히 찍혀 있다.' },
    { narr: '기둥 그림자 사이로 구두 소리가 다가온다.', stage: { cast: ['MUJIN'] }, sfx: 'tick' },
    { who: 'MUJIN', text: '한 실장님. 오늘 이후의 일정은 없습니다.' },
    { who: 'DOYUN', text: '회장님은… 알고 계십니까?' },
    { narr: '권무진은 대답하지 않는다. 그 침묵이 대답이었는지, 나는 끝내 알지 못했다.' },
    { fx: 'blackout', sfx: 'thud', stage: { loc: 'black', cast: [] } },
  ],
};

const RETURN = {
  id: 'RETURN',
  type: 'scene',
  next: 'HAERIN_OPEN',
  skippable: true,
  stage: { loc: 'black', cast: [] },
  lines: [
    { who: 'TAEGEON_ECHO', text: '이번 일만 끝나면, 너도 좀 쉬어야지.', sfx: 'heartbeat' },
    { card: 'D-30', sub: '죽기 30일 전 아침', sfx: 'chime' },
    { narr: '형광등이 낮게 웅웅거린다. 비서실 책상. 손끝에 닿는 종이의 감촉.', stage: { loc: 'secretary', cast: ['HAERIN'] } },
    { who: 'HAERIN', text: '실장님. 안색이 좋지 않네요.' },
    { who: 'DOYUN', mono: true, text: '서해린. 이 목소리도, 책상 위 문서도… 죽기 한 달 전과 같다.' },
    { narr: '그녀의 가슴 앞으로 겹겹이 포개진 금속판과 나사가 떠오른다. 봉인처럼 박힌 구조물이다.', stage: { seal: ['HAERIN'] }, sfx: 'chime' },
    { who: 'DOYUN', mono: true, text: '사람의 속을… 나사처럼 풀어낼 수 있다는 건가.' },
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
        { who: 'TAEGEON', text: '도윤아. 나는 네가 거짓말을 잘 못한다는 점을 좋아했다.' },
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
        { who: 'TAEGEON', text: '한도윤.' },
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
        { who: 'TAEGEON', text: '…도윤아.' },
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
        { who: 'TAEGEON', text: '그 이야기를 누구한테 들었나, 도윤아.' },
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

export const NODE_ORDER = ['PROLOGUE', 'RETURN', 'HAERIN_OPEN', 'TUTORIAL', 'OFFICE_ENTER', 'MEMORY_HUB', 'PUZZLE', 'REWARD', 'DOCUMENT_ACTION', 'BOSS_01', 'BOSS_02', 'BOSS_03', 'RESULT'];

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

export const RESULT_COMMON = {
  daysLine: '죽음까지 남은 날 29일. 예정된 그날은 아직 그대로다.',
  nextCaseNote: '다음 사건(D-29)은 아직 준비 중입니다. 남은 아이템은 저장되어 있습니다.',
};

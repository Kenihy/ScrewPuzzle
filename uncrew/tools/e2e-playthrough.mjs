/*
 * 언스크류(UNCREW) — 브라우저 자동 플레이 검증 (선택 사항)
 *
 * 실제 Chromium에서 타이틀부터 결과까지 마우스 클릭으로 진행합니다.
 * 퍼즐은 화면의 나사·구멍 위치를 논리 좌표 → 화면 좌표로 바꿔 실제로 클릭합니다.
 * 개발자 콘솔 조작이나 자동 풀이 기능은 쓰지 않습니다. (보드 좌표를 읽기 위해서만 __uncrew를 참조)
 *
 * 실행: 정적 서버를 띄우거나 파일 주소를 직접 넘깁니다.
 *   python3 -m http.server 8123
 *   UNCREW_URL=http://localhost:8123/ node tools/e2e-playthrough.mjs
 *   UNCREW_URL=file:///<저장소 경로>/uncrew/index.html node tools/e2e-playthrough.mjs
 * 필요: Playwright 1.63.0 (프로젝트 의존성이 아니라 검증 도구입니다)
 * 스크린샷: SHOTS 환경 변수 폴더에 저장 (기본값: 저장 안 함)
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const URL = process.env.UNCREW_URL || 'http://localhost:8123/';
const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`) });
}

const state = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__uncrew.game.run)));

/** 화면 전환 직후 연타 방지 시간이 지난 뒤 클릭합니다. */
async function tap(page, selector) {
  await page.waitForFunction(() => !window.__uncrew || performance.now() >= window.__uncrew.app.ui.guardUntil, null, { timeout: 3000 });
  await page.click(selector);
}

/** 선택지가 나오거나(대화), 다른 화면으로 바뀔 때까지 대사를 넘깁니다. */
async function advanceDialogue(page, { until = 'choices', max = 160 } = {}) {
  for (let i = 0; i < max; i++) {
    if (until === 'choices' && (await page.locator('.choice').count())) return;
    if (until !== 'choices' && (await page.locator(until).count())) return;
    const next = page.locator('[data-act="next"]');
    if (!(await next.count())) {
      await page.waitForTimeout(80);
      continue;
    }
    if (await next.isDisabled()) {
      await page.click('.textbox');
      await page.waitForTimeout(220);
      continue; // 전체 표시 후 선택지가 나왔는지 다시 확인
    }
    await next.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(120);
  }
  throw new Error(`advanceDialogue: ${until} 에 도달하지 못함`);
}

async function choose(page, id) {
  await advanceDialogue(page);
  await tap(page, `.choice[data-id="${id}"]`);
  await page.waitForTimeout(150);
}

/** 보드의 구멍을 실제로 클릭합니다. */
async function clickHole(page, holeId) {
  if (holeId === 'T') {
    await tap(page, '[data-act="temp-slot"]');
  } else {
    const pos = await page.evaluate((hid) => {
      const b = window.__uncrew.game.puzzleBoard();
      const h = b.holes.find((x) => x.id === hid);
      const r = document.querySelector('svg[data-board]').getBoundingClientRect();
      return { x: r.left + (h.x / 640) * r.width, y: r.top + (h.y / 640) * r.height };
    }, holeId);
    await page.mouse.click(pos.x, pos.y);
  }
  await page.waitForTimeout(60);
}

async function waitUnlocked(page) {
  await page.waitForFunction(() => !window.__uncrew.app.ui.locked && !window.__uncrew.app.ui.clearView, null, { timeout: 5000 });
}

async function playMoves(page, moves) {
  for (const [src, dst] of moves) {
    await waitUnlocked(page);
    await clickHole(page, src);
    await clickHole(page, dst);
  }
  await page.waitForTimeout(100);
}

async function solution(page) {
  return page.evaluate(() => window.__uncrew.game.puzzleBoard().solution);
}

async function investigate(page, topic, diff, { shotName, beforeMoves } = {}) {
  await tap(page, `[data-act="topic"][data-id="${topic}"]`);
  await tap(page, `[data-act="pick-diff"][data-id="${diff}"]`);
  // 시작 확인 연타: 비용은 한 번만
  const btn = page.locator('[data-act="start-topic"]');
  await btn.dblclick().catch(() => {});
  await page.waitForSelector('svg[data-board]');
  if (beforeMoves) await beforeMoves();
  if (shotName) await shot(page, shotName);
  await playMoves(page, await solution(page));
  await page.waitForSelector('[data-act="close-reward"]', { timeout: 5000 });
}

async function run() {
  const browser = await chromium.launch();
  const errors = [];

  /* ---------- 1. 모바일 세로: 보통 조합 경로 (END_ADVANTAGE) ---------- */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const t0 = Date.now();
  await page.goto(URL);
  await page.waitForSelector('[data-act="new-game"]');
  check('타이틀에 한글·영문 제목과 카피 표시', (await page.textContent('.title-block')).includes('언스크류') && (await page.textContent('.title-en')).includes('UNCREW') && (await page.textContent('.title-copy')).includes('풀수록, 더 깊이 얽힌다.'));
  check('저장 없을 때 이어하기 비활성', await page.locator('[data-act="continue"]').isDisabled());
  await shot(page, 'm01-title');
  await tap(page, '[data-act="new-game"]');
  await page.waitForSelector('.textbox');
  await shot(page, 'm02-prologue');
  // 대사 표시 중에는 다음 버튼이 잠겨 있음 (짧은 첫 카드 다음의 긴 줄에서 확인)
  await page.waitForSelector('[data-act="next"]:not([disabled])');
  await page.waitForTimeout(200);
  await page.click('[data-act="next"]');
  check('타이핑 중 다음 버튼 비활성(표시와 넘기기 분리)', await page.locator('[data-act="next"]').isDisabled());
  await tap(page, '[data-act="skip"]');
  check('건너뛰기는 마지막 줄에서 멈춤', (await state(page)).nodeId === 'PROLOGUE');
  await shot(page, 'm02b-death');
  await advanceDialogue(page, { until: '.stage.dizzy' });
  await page.waitForTimeout(300);
  await shot(page, 'm02c-return-dizzy');
  // 회귀 직후: 이름을 떠올리기 전에는 주인공을 '나'로 표시
  await advanceDialogue(page, { until: '.name-form' });
  {
    const st = await state(page);
    check('회귀 장면 뒤 이름 입력 화면', st.nodeId === 'NAME_ENTRY' && st.player === null);
  }
  await shot(page, 'm02d-name-empty');
  check('이름 입력 전에는 기억한다 버튼 비활성', await page.locator('[data-act="name-submit"]').isDisabled());
  await page.fill('input[name="surname"]', '차');
  await page.fill('input[name="given"]', '민호');
  check('회장 일가 성(차) 거부 안내', (await page.textContent('[data-name-status]')).includes('회장 일가') && (await page.locator('[data-act="name-submit"]').isDisabled()));
  await page.fill('input[name="surname"]', '서');
  await page.fill('input[name="given"]', '해린');
  check('다른 등장인물 이름 거부 안내', (await page.textContent('[data-name-status]')).includes('등장인물'));
  await page.fill('input[name="surname"]', '강');
  await page.fill('input[name="given"]', '민호');
  check('올바른 이름: 호칭 미리보기(민호야 · 강 실장님)', (await page.textContent('[data-name-status]')).includes('민호야') && (await page.textContent('[data-name-status]')).includes('강 실장님'));
  await shot(page, 'm02e-name-filled');
  await page.press('input[name="given"]', 'Enter');
  await page.waitForTimeout(200);
  {
    const st = await state(page);
    check('Enter로 이름 확정 → 각성 장면, 이름 저장', st.nodeId === 'AWAKEN' && st.player.surname === '강' && st.player.given === '민호');
  }
  check('각성 장면에서 입력한 이름 사용', (await page.locator('.textbox .text').getAttribute('data-full')).includes('강민호'));
  check('도입 장면에서는 수치 HUD 숨김', (await page.locator('.hud .day').count()) === 0);
  await advanceDialogue(page, { until: '.goal-card' });
  await page.waitForTimeout(300);
  await shot(page, 'm02f-goals');
  await advanceDialogue(page, { until: '.hud .day' });
  // 대사 도중 기록 열기: 지금 보고 있는 줄까지만 나옴
  await tap(page, '.controls [data-act="log"]');
  {
    const logText = await page.textContent('[data-log-body]');
    check('대사 도중 기록: 본 줄까지만 표시', logText.includes('서해린이 서류철을 가슴 앞에') && !logText.includes('회장님이 어제 윤 변호사에게 전달한 자료를'));
  }
  await tap(page, '[data-act="close"]');
  await advanceDialogue(page);
  check('주인공 속마음 화자가 입력한 이름으로 표시', (await page.textContent('.textbox .who')).includes('민호'));
  await shot(page, 'm03-haerin-open');
  check('HAERIN_OPEN 선택지 3개', (await page.locator('.choice').count()) === 3);
  await page.locator('.choice[data-id="H01_A"]').dblclick();
  await page.waitForTimeout(200);
  let s = await state(page);
  check('선택지 연타는 한 번만 적용', s.trust.HAERIN === 55 && s.suspicion === 20, `trust ${s.trust.HAERIN}`);
  await shot(page, 'm04-reaction');
  await advanceDialogue(page, { until: '[data-act="tutorial-start"]' });
  await tap(page, '[data-act="tutorial-start"]');
  await page.waitForSelector('svg[data-board]');
  await shot(page, 'm05-tutorial');
  // 가려진 곳 클릭: 나사 c는 판 A 아래 → 선택되지 않음
  await clickHole(page, 'c');
  check('가려진 나사는 선택되지 않음', (await page.evaluate(() => window.__uncrew.app.ui.selected)) !== 'c');
  await clickHole(page, 'a');
  await shot(page, 'm06-tutorial-selected');
  await clickHole(page, 'g');
  await waitUnlocked(page);
  await playMoves(page, [['b', 'h']]);
  await waitUnlocked(page);
  await shot(page, 'm07-tutorial-reveal');
  await playMoves(page, [['c', 'a'], ['d', 'b']]);
  await page.waitForSelector('[data-act="tutorial-done"]');
  s = await state(page);
  check('튜토리얼 후 집중력 4·아이템 0', s.focus === 4 && Object.values(s.inventory).every((n) => n === 0));
  await tap(page, '[data-act="tutorial-done"]');
  await advanceDialogue(page, { until: '.hub-head' });
  await shot(page, 'm08-hub');
  await tap(page, '[data-act="topic"][data-id="BA"]');
  await tap(page, '[data-act="pick-diff"][data-id="normal"]');
  await shot(page, 'm09-difficulty');
  await tap(page, '[data-act="close"]');
  check('난이도 창 취소 시 집중력 유지', (await state(page)).focus === 4);
  await investigate(page, 'BA', 'normal', { shotName: 'm10-puzzle-normal' });
  s = await state(page);
  check('보통 클리어: 단서 2개, 집중력 2', s.clues.length === 2 && s.focus === 2, `${s.clues}`);
  await shot(page, 'm11-reward');
  check('보상 화면: 깊이 설명·판단 힌트·작동 표시', (await page.locator('.explain').count()) === 1 && (await page.locator('.reward-screen .clue-use').count()) === 2 && (await page.textContent('.reward-screen')).includes('선택지를 엶'));
  await tap(page, '.explain [data-act="guide"]');
  check('용어 안내 열기', (await page.textContent('.guide-body')).includes('기억 단서') && (await page.textContent('.guide-body')).includes('중층'));
  await shot(page, 'm11b-guide');
  await tap(page, '[data-act="close"]');
  await page.reload();
  await tap(page, '[data-act="continue"]');
  s = await state(page);
  check('보상 화면 새로고침 후 중복 지급 없음', s.clues.length === 2 && s.inventory.undo === 1 && s.inventory.temp_hole === 1);
  await tap(page, '[data-act="close-reward"]');

  // BB 보통: 세 수 둔 뒤 새로고침해서 복원 확인
  await tap(page, '[data-act="topic"][data-id="BB"]');
  await tap(page, '[data-act="pick-diff"][data-id="normal"]');
  await tap(page, '[data-act="start-topic"]');
  await page.waitForSelector('svg[data-board]');
  const sol = await solution(page);
  await playMoves(page, sol.slice(0, 3));
  await waitUnlocked(page);
  const mid = await state(page);
  await page.reload();
  await tap(page, '[data-act="continue"]');
  await page.waitForSelector('svg[data-board]');
  const after = await state(page);
  check('퍼즐 도중 새로고침 → 보드·이동 수 복원', JSON.stringify(after.activePuzzle) === JSON.stringify(mid.activePuzzle) && after.activePuzzle.moves === 3);
  await playMoves(page, sol.slice(3));
  await page.waitForSelector('[data-act="close-reward"]');
  await tap(page, '[data-act="close-reward"]');
  s = await state(page);
  check('보통+보통 후 집중력 0', s.focus === 0);
  await shot(page, 'm12-hub-done');
  check('허브: 이번 사건 목표 표시', (await page.textContent('.case-goal')).includes('회장의 질문을 넘기고'));
  await tap(page, '.hud [data-act="notes"]');
  check('노트 상황 탭: 사건 목표·첫 번째 삶 기록', (await page.textContent('.sheet-body')).includes('첫 번째 삶의 기록') && (await page.textContent('.sheet-body')).includes('D-Day'));
  await shot(page, 'm12b-notes-situation');
  await tap(page, '[data-act="notes-tab"][data-id="clues"]');
  check('노트 기억 단서 탭: 작동 설명', (await page.textContent('.sheet-body')).includes('작동'));
  await tap(page, '[data-act="close"]');
  await tap(page, '[data-act="finish-investigation"]');
  await tap(page, '[data-act="confirm-yes"]');
  await advanceDialogue(page);
  check('DOC_REQUEST 옆 관련 단서 표시 없음(C_HB_1 미보유)', !(await page.locator('.choice[data-id="DOC_REQUEST"] .chip').count()));
  await choose(page, 'DOC_REQUEST');
  await shot(page, 'm13-doc-granted');
  await choose(page, 'B01_D');
  await advanceDialogue(page);
  await shot(page, 'm14-boss02');
  check('단서로 열린 대답에 근거 표시(✓)', (await page.textContent('.choice[data-id="B02_D"]')).includes('단서로 열린 대답') && (await page.textContent('.choice[data-id="B02_D"]')).includes('✓'));
  await tap(page, '.choices [data-act="log"]');
  {
    const logText = await page.textContent('[data-log-body]');
    check('선택 중 이전 대사 보기: 앞 장면 질문·내 대답·수치 변화', logText.includes('어제 윤 변호사에게 무슨 서류를 줬지?') && logText.includes('내 대답') && logText.includes('전달 목록입니다') && logText.includes('의심도 20 → 10') && logText.includes('그쪽에서 다른 자료를 요구하지는 않았나?'));
    check('대사 기록에 프롤로그부터 포함', logText.includes('십 년 전') && logText.includes('오늘 이후의 일정은 없습니다'));
  }
  await shot(page, 'm14b-log');
  await tap(page, '[data-act="close"]');
  check('기록을 닫으면 선택지로 돌아옴', (await page.locator('.choice').count()) === 4);
  await choose(page, 'B02_D');
  await advanceDialogue(page);
  check('B03_C 활성', await page.locator('.choice[data-id="B03_C"]').isEnabled());
  await choose(page, 'B03_C');
  await advanceDialogue(page, { until: '.result-screen' });
  s = await state(page);
  check('보통 조합 경로 → END_ADVANTAGE, 의심 0, 신뢰 60', s.result.endingId === 'END_ADVANTAGE' && s.suspicion === 0 && s.trust.HAERIN === 60);
  await shot(page, 'm15-result-advantage');
  const playMs = Date.now() - t0;

  /* ---------- 2. 아이템 UI: 되감기·임시 나사함·돋보기·리허설 ---------- */
  await tap(page, '[data-act="retry-case-now"]');
  s = await state(page);
  check('사건 재도전 → 인벤토리 초기화, 도감 유지', s.nodeId === 'HAERIN_OPEN' && Object.values(s.inventory).every((n) => n === 0) && (await page.evaluate(() => window.__uncrew.game.meta.codex.length)) >= 4);
  await choose(page, 'H01_A');
  await advanceDialogue(page, { until: '[data-act="tutorial-skip"]' });
  await tap(page, '[data-act="tutorial-skip"]');
  await advanceDialogue(page, { until: '.hub-head' });
  await shot(page, 'm16-notes-past');
  await investigate(page, 'HA', 'easy');
  check('단서 문장의 이름·조사 치환(민호와)', (await page.textContent('.reward-screen')).includes('회장은 민호와 윤서진이'));
  await tap(page, '[data-act="close-reward"]');
  // HB 보통에서 되감기 사용
  await tap(page, '[data-act="topic"][data-id="HB"]');
  await tap(page, '[data-act="pick-diff"][data-id="normal"]');
  await tap(page, '[data-act="start-topic"]');
  await page.waitForSelector('svg[data-board]');
  await playMoves(page, [['a', 'g'], ['b', 'h']]);
  await waitUnlocked(page);
  check('판 A 제거', !(await state(page)).activePuzzle.activePlates.includes('A'));
  await tap(page, '[data-act="pz-undo"]');
  s = await state(page);
  check('되감기: 판 A 복원·이동 수 1·아이템 소비', s.activePuzzle.activePlates.includes('A') && s.activePuzzle.moves === 1 && s.inventory.undo === 0);
  await tap(page, '[data-act="pz-retry"]');
  await tap(page, '[data-act="confirm-yes"]');
  check('보드 재도전: 집중력 그대로', (await state(page)).focus === 1);
  await playMoves(page, await solution(page));
  await page.waitForSelector('[data-act="close-reward"]');
  await tap(page, '[data-act="close-reward"]');
  // BA 쉬움에서 임시 나사함 사용
  await tap(page, '[data-act="topic"][data-id="BA"]');
  await tap(page, '[data-act="pick-diff"][data-id="easy"]');
  await tap(page, '[data-act="start-topic"]');
  await page.waitForSelector('svg[data-board]');
  await tap(page, '[data-act="pz-temp"]');
  await tap(page, '[data-act="confirm-yes"]');
  await playMoves(page, [['a', 'T']]);
  await waitUnlocked(page);
  await shot(page, 'm17-temp-hole');
  check('임시 나사함에 나사 이동', (await state(page)).activePuzzle.screws.includes('T'));
  await playMoves(page, [['b', 'g'], ['c', 'h'], ['d', 'a']]);
  await page.waitForSelector('[data-act="close-reward"]');
  await tap(page, '[data-act="close-reward"]');
  await tap(page, '[data-act="finish-investigation"]');
  await tap(page, '[data-act="confirm-yes"]');
  await advanceDialogue(page);
  check('C_HB_1 보유 시 "관련 단서 보유" 표시', (await page.textContent('.choice[data-id="DOC_REQUEST"]')).includes('관련 단서 보유'));
  await choose(page, 'DOC_SKIP');
  await advanceDialogue(page);
  check('DOC_LIST 없으면 B01_D 잠김 + 조건 안내', (await page.locator('.choice[data-id="B01_D"]').isDisabled()) && (await page.textContent('.choice[data-id="B01_D"]')).includes('전달 목록'));
  check('잠긴 선택지에 필요한 조건 ✗ 표시', (await page.textContent('.choice[data-id="B01_D"] .req-line')).includes('✗'));

  await choose(page, 'B01_B');
  await choose(page, 'B02_A');
  await choose(page, 'B03_A');
  await advanceDialogue(page, { until: '.result-screen' });
  s = await state(page);
  check('쉬움·보통 혼합 → END_SURVIVED', s.result.endingId === 'END_SURVIVED');

  /* ---------- 3. 제거 경로 ---------- */
  await tap(page, '[data-act="retry-case-now"]');
  await choose(page, 'H01_B');
  await advanceDialogue(page, { until: '[data-act="tutorial-skip"]' });
  await tap(page, '[data-act="tutorial-skip"]');
  await advanceDialogue(page, { until: '.hub-head' });
  await tap(page, '[data-act="finish-investigation"]');
  await tap(page, '[data-act="confirm-yes"]');
  await choose(page, 'DOC_SKIP');
  await choose(page, 'B01_C');
  await advanceDialogue(page);
  check('의심 65: 관찰 대상 표시(아이콘+문구)', (await page.locator('.meter.band-watched').count()) === 1 && (await page.textContent('.meter')).includes('관찰 대상'));
  await choose(page, 'B02_B');
  await shot(page, 'm19-removal');
  await advanceDialogue(page, { until: '.result-screen' });
  s = await state(page);
  check('제거 경로 → END_REMOVED, BOSS_03 미진입', s.result.endingId === 'END_REMOVED' && !s.choices.BOSS_03);
  check('제거 결과에 원인 선택 ID와 수치 표시', (await page.textContent('.result-screen')).includes('B02_B') && (await page.textContent('.result-screen')).includes('65 → 100'));
  await shot(page, 'm20-result-removed');

  /* ---------- 4. 경계 생존: 제거 검토 구간 연출 ---------- */
  await tap(page, '[data-act="retry-case-now"]');
  await choose(page, 'H01_C');
  await advanceDialogue(page, { until: '[data-act="tutorial-skip"]' });
  await tap(page, '[data-act="tutorial-skip"]');
  await advanceDialogue(page, { until: '.hub-head' });
  await tap(page, '[data-act="finish-investigation"]');
  await tap(page, '[data-act="confirm-yes"]');
  await choose(page, 'DOC_SKIP');
  await choose(page, 'B01_C');
  // 반응 대사 중 회장이 이름 석 자를 부르는 줄 확인
  let calledFullName = false;
  for (let i = 0; i < 8 && !calledFullName; i++) {
    const full = await page.locator('.textbox .text').getAttribute('data-full');
    if (full && full.includes('강민호.')) calledFullName = true;
    else {
      if (await page.locator('[data-act="next"]').isDisabled()) await page.click('.textbox');
      await page.waitForTimeout(220);
      await page.locator('[data-act="next"]').click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
  }
  check('회장이 이름 석 자로 부름(강민호.)', calledFullName);
  await advanceDialogue(page);
  await shot(page, 'm18-review-warning');
  check('의심 70 이상: 문 밖 보안실장 실루엣 + 제거 검토 표시', (await page.locator('.door').count()) === 1 && (await page.textContent('.meter')).includes('제거 검토'));
  await choose(page, 'B02_A');
  await choose(page, 'B03_A');
  await advanceDialogue(page, { until: '.result-screen' });
  s = await state(page);
  check('H01_C → B01_C → B02_A → B03_A → END_WATCHED (의심 85)', s.result.endingId === 'END_WATCHED' && s.suspicion === 85);
  await shot(page, 'm21-result-watched');
  await page.close();

  /* ---------- 4. 작은 화면 / PC 화면 배치 ---------- */
  for (const vp of [
    { name: 's360', width: 360, height: 640 },
    { name: 'pc', width: 1280, height: 800 },
  ]) {
    const p2 = await ctx.newPage();
    await p2.setViewportSize({ width: vp.width, height: vp.height });
    p2.on('pageerror', (e) => errors.push(String(e)));
    await p2.goto(URL);
    await tap(p2, '[data-act="new-game"]');
    await tap(p2, '[data-act="confirm-yes"]');
    await advanceDialogue(p2, { until: '.name-form' });
    check(`${vp.name}: 새 게임에서 지난 이름 미리 채움`, (await p2.inputValue('input[name="surname"]')) === '강');
    await shot(p2, `${vp.name}-00-name`);
    const nameGeo = await p2.evaluate(() => {
      const f = document.querySelector('.name-form').getBoundingClientRect();
      const app = document.getElementById('app').getBoundingClientRect();
      return { fBottom: f.bottom, appBottom: app.bottom, fTop: f.top };
    });
    check(`${vp.name}: 이름 입력 칸이 화면 안에 있음`, nameGeo.fBottom <= nameGeo.appBottom + 1 && nameGeo.fTop >= 0, JSON.stringify(nameGeo));
    await tap(p2, '[data-act="name-submit"]');
    await advanceDialogue(p2, { until: '.hud .day' });
    await advanceDialogue(p2);
    await shot(p2, `${vp.name}-01-choices`);
    await choose(p2, 'H01_A');
    await advanceDialogue(p2, { until: '[data-act="tutorial-skip"]' });
    await tap(p2, '[data-act="tutorial-skip"]');
    await advanceDialogue(p2, { until: '.hub-head' });
    await shot(p2, `${vp.name}-02-hub`);
    await tap(p2, '[data-act="topic"][data-id="HA"]');
    await tap(p2, '[data-act="pick-diff"][data-id="hard"]');
    await tap(p2, '[data-act="start-topic"]');
    await p2.waitForSelector('svg[data-board]');
    await clickHole(p2, 'a');
    await shot(p2, `${vp.name}-03-hard`);
    // 겹침 검사: 보드와 도구 줄, 보드와 화면 밖
    const geo = await p2.evaluate(() => {
      const b = document.querySelector('.board-wrap').getBoundingClientRect();
      const t = document.querySelector('.pz-tools').getBoundingClientRect();
      const app = document.getElementById('app').getBoundingClientRect();
      const btns = [...document.querySelectorAll('.pz-tools .btn')].map((e) => e.getBoundingClientRect());
      return { bBottom: b.bottom, tTop: t.top, tBottom: t.bottom, appBottom: app.bottom, appRight: app.right, bRight: b.right, minBtnH: Math.min(...btns.map((r) => r.height)), boardW: b.width };
    });
    check(`${vp.name}: 보드와 도구가 겹치지 않고 화면 안에 있음`, geo.bBottom <= geo.tTop + 1 && geo.tBottom <= geo.appBottom + 1 && geo.bRight <= geo.appRight + 1, JSON.stringify(geo));
    check(`${vp.name}: 도구 버튼 높이 44px 이상`, geo.minBtnH >= 44);
    // 보드의 일반적인 구멍 간격(80 논리 단위)이 화면에서 44px 이상인지. 어려움 보드의 m–l(60)은 참고로만 기록
    check(`${vp.name}: 인접 구멍 간격(80) 44px 이상`, (80 / 640) * geo.boardW >= 44, `80→${((80 / 640) * geo.boardW).toFixed(1)}px, 60→${((60 / 640) * geo.boardW).toFixed(1)}px`);
    await p2.close();
  }

  await browser.close();
  check('페이지 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
  const failed = results.filter((r) => !r.ok);
  console.log(`\n자동 플레이 소요(1번 경로, 대기 포함): ${(playMs / 1000).toFixed(1)}초`);
  console.log(`결과: ${results.length - failed.length}/${results.length} 통과`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

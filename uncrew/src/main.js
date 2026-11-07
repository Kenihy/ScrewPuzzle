/*
 * 언스크류(UNCREW) — 진입점
 * 콘텐츠를 검증한 뒤 게임 상태와 UI를 연결합니다. 검증에 실패하면 오류 목록을 보여 주고 시작하지 않습니다.
 */
import * as CASE from './data/case01.js';
import { DIFFICULTIES, ITEMS } from './data/config.js';
import { PUZZLES, TUTORIAL_BOARD } from './data/puzzles.js';
import { validateContent } from './core/validate.js';
import { Game } from './core/game.js';
import { browserStorage } from './core/save.js';
import { createApp } from './ui/app.js';

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

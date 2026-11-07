/*
 * 언스크류(UNCREW) — 퍼즐 보드 SVG 렌더러
 *
 * 논리 좌표 640×640을 viewBox로 쓰고, 화면 크기에 비례해 그립니다.
 * 포인터 좌표는 toLogical()로 논리 좌표로 바꾼 뒤 엔진의 pickHole()로 판정합니다.
 * 가려진 나사와 구멍은 그리지 않습니다. (명세 10.2)
 * 상태 구분은 색만 쓰지 않고 모양(실선 고리·점선 고리·중심점)과 명도로 표시합니다.
 */
import { isBlocked } from '../core/puzzleEngine.js';
import { boardSymbol } from './art.js';

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

export function screwMarkup(x, y, { selected = false, moved = false, cls = '', angle = 0 } = {}) {
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
export function boardMarkup(board, state, opts = {}) {
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
export function toLogical(svgEl, clientX, clientY) {
  const r = svgEl.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * 640, y: ((clientY - r.top) / r.height) * 640 };
}

/** 논리 좌표 → 화면 좌표. 자동 테스트에서 실제 클릭 위치를 계산할 때 씁니다. */
export function toScreen(svgEl, x, y) {
  const r = svgEl.getBoundingClientRect();
  return { x: r.left + (x / 640) * r.width, y: r.top + (y / 640) * r.height };
}

/** 임시 나사함 슬롯 안의 작은 나사/구멍 */
export function slotMarkup({ hasScrew, selected }) {
  return `<svg viewBox="-32 -32 64 64" aria-hidden="true">${DEFS}
    <circle r="${HOLE_R}" fill="#051012" stroke="#000" stroke-opacity=".55" stroke-width="3"/>
    ${hasScrew ? screwMarkup(0, 0, { selected: false, angle: 20 }).replace('class="screw ', `class="screw ${selected ? 'selected ' : ''}`) : ''}
  </svg>`;
}

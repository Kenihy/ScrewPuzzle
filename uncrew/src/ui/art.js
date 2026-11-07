/*
 * 언스크류(UNCREW) — 대체 일러스트 (실루엣·아이콘·상징)
 * 외부 이미지 없이 인라인 SVG로만 그립니다. 최종 초상화가 생기면 이 파일만 교체하면 됩니다.
 */

const svg = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICON = {
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
export function silhouette(who, { label = '' } = {}) {
  const id = `${who.toLowerCase()}${++silCount}`;
  const body = (FIGURES[who] || FIGURES.MUJIN)(id);
  return `<svg class="sil" viewBox="0 0 200 300" role="img" aria-label="${label}">${body}</svg>`;
}

/** 가슴 앞에 떠오르는 판과 나사(봉인 구조) */
export function sealOverlay() {
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
export function titleEmblem() {
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
export function boardSymbol(kind) {
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

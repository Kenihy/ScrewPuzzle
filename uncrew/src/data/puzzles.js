/*
 * 언스크류(UNCREW) — 검증된 초기 퍼즐 데이터 (명세 부록 A 원본)
 *
 * 좌표계: 640×640, 왼쪽 위 원점.
 * 해결 이동 수: 쉬움 4회 / 보통 8회 / 어려움 12회 (최단 해법 증명은 아님).
 * 본편 네 기억 주제는 아래 세 지형을 공통으로 사용하고, 단서와 판 제거 연출 문구만 주제별로 바꿉니다.
 * 지형을 바꾸면 tests/puzzle.test.js의 해법 재생 검증을 다시 통과해야 합니다.
 */

export const PUZZLES = [
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
export const TUTORIAL_BOARD = {
  ...structuredClone(easy),
  id: 'TUTORIAL_EASY_01',
  difficulty: 'tutorial',
};

export const BOARD_BY_DIFFICULTY = {
  easy: 'SCREW_EASY_01',
  normal: 'SCREW_NORMAL_01',
  hard: 'SCREW_HARD_01',
};

export function getBoard(boardId) {
  if (boardId === TUTORIAL_BOARD.id) return TUTORIAL_BOARD;
  return PUZZLES.find((b) => b.id === boardId) || null;
}

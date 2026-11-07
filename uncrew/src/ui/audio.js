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

export function unlockAudio() {
  unlocked = true;
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setMuted(v) {
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

export function play(name) {
  try {
    SOUNDS[name]?.();
  } catch {
    /* 소리 실패는 진행에 영향을 주지 않습니다 */
  }
}

/** 대화 장면의 낮은 배경음. 큰 의심 증가 때 잠시 낮춥니다. (명세 16.4) */
export function setAmbient(on) {
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

export function duckAmbient() {
  if (!ambient || !ctx) return;
  const g = ambient.g.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setTargetAtTime(0.004, ctx.currentTime, 0.1);
  g.setTargetAtTime(0.035, ctx.currentTime + 3, 1.2);
}

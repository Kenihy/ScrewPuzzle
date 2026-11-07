// 실행용 단일 스크립트(uncrew.bundle.js)가 src/와 같은 내용인지 검사합니다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBundle, OUT } from '../tools/build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('커밋된 uncrew.bundle.js가 최신 src/로 만든 결과와 같다 (다르면 node tools/build.mjs 실행)', () => {
  assert.equal(readFileSync(join(root, OUT), 'utf8'), buildBundle());
});

test('index.html은 모듈이 아닌 일반 스크립트로 번들을 불러와 file://에서도 실행된다', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(html.includes(`<script src="${OUT}"></script>`));
  assert.ok(!html.includes('type="module"'));
});

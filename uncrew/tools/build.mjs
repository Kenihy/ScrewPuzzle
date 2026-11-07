/*
 * 언스크류(UNCREW) — 단일 스크립트 번들 생성기 (외부 패키지 없음)
 *
 * src/의 ES 모듈을 일반 <script> 한 개(uncrew.bundle.js)로 묶습니다.
 * 이렇게 하면 index.html을 더블클릭(file://)해도, GitHub Pages 같은 정적 호스팅에서도 바로 실행됩니다.
 * 원본은 언제나 src/입니다. src/를 고친 뒤에는 다시 실행하세요.
 *
 *   node tools/build.mjs
 *
 * 지원 범위: 이 프로젝트가 쓰는 형태만 처리합니다.
 *   import { a, b as c } from './x.js';   import * as X from './x.js';
 *   export function / export async function / export class / export const / export let
 * 그 밖의 형태(default export, export { } 목록, 순환 참조)는 오류로 멈춥니다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ENTRY = 'src/main.js';
export const OUT = 'uncrew.bundle.js';

const IMPORT_RE = /^import\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+)['"];?[ \t]*$/gm;
const EXPORT_DECL_RE = /^export\s+(async\s+function|function|class|const|let)\s+([A-Za-z_$][\w$]*)/gm;

function transform(id, code) {
  const deps = [];
  if (/^export\s+default\b/m.test(code) || /^export\s*\{/m.test(code)) {
    throw new Error(`${id}: 지원하지 않는 export 형태`);
  }
  let out = code.replace(IMPORT_RE, (_m, clause, spec) => {
    const depId = relative(ROOT, resolve(ROOT, dirname(id), spec)).split('\\').join('/');
    deps.push(depId);
    const c = clause.trim();
    const star = c.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (star) return `const ${star[1]} = __require(${JSON.stringify(depId)});`;
    const named = c.match(/^\{([\s\S]*)\}$/);
    if (!named) throw new Error(`${id}: 지원하지 않는 import 형태: ${c}`);
    const parts = named[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const m = s.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
        if (!m) throw new Error(`${id}: import 이름 해석 실패: ${s}`);
        return m[2] ? `${m[1]}: ${m[2]}` : m[1];
      });
    return `const { ${parts.join(', ')} } = __require(${JSON.stringify(depId)});`;
  });
  if (/^\s*import\s/m.test(out)) throw new Error(`${id}: 처리하지 못한 import가 있습니다`);
  const names = [];
  out = out.replace(EXPORT_DECL_RE, (_m, kind, name) => {
    names.push(name);
    return `${kind} ${name}`;
  });
  if (/^export\s/m.test(out)) throw new Error(`${id}: 처리하지 못한 export가 있습니다`);
  out += `\nreturn { ${names.join(', ')} };`;
  return { deps, code: out };
}

/** 번들 문자열을 만듭니다. 테스트에서 커밋된 번들이 최신인지 비교할 때도 씁니다. */
export function buildBundle() {
  const modules = new Map();
  const visiting = new Set();
  const visit = (id) => {
    if (modules.has(id)) return;
    if (visiting.has(id)) throw new Error(`순환 참조: ${id}`);
    visiting.add(id);
    const src = readFileSync(join(ROOT, id), 'utf8');
    const mod = transform(id, src);
    mod.deps.forEach(visit);
    visiting.delete(id);
    modules.set(id, mod);
  };
  visit(ENTRY);

  const body = [...modules.entries()]
    .map(([id, mod]) => `/* ===== ${id} ===== */\n__define(${JSON.stringify(id)}, function (__require) {\n${mod.code}\n});`)
    .join('\n\n');

  return `/*
 * 언스크류(UNCREW) — 실행용 단일 스크립트
 * 자동 생성 파일입니다. 직접 고치지 말고 src/를 수정한 뒤 \`node tools/build.mjs\`를 실행하세요.
 * 포함 모듈: ${modules.size}개 (진입점 ${ENTRY})
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

${body}

__require(${JSON.stringify(ENTRY)});
})();
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const bundle = buildBundle();
  writeFileSync(join(ROOT, OUT), bundle);
  console.log(`${OUT} 생성 완료 (${(bundle.length / 1024).toFixed(1)} KB)`);
}

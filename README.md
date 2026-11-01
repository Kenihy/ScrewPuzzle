# 나사 너머 (가제)

스크류 퍼즐을 풀면 캐릭터가 감추고 있던 속마음과 모습이 드러나는 퍼즐 게임입니다. 본 개발은 Unity로 진행해 Steam에 출시할 예정이며, 이 저장소에는 규칙과 콘텐츠 구성을 검증하는 웹 프로토타입이 들어 있습니다.

## 구성

| 경로 | 내용 |
|---|---|
| `prototype/` | 웹 프로토타입 (HTML5 Canvas, 휴대폰 세로 화면 기준) |
| `prototype/rules.js` | 퍼즐 규칙 엔진. 렌더링과 분리된 순수 로직 |
| `prototype/content.js` | 캐릭터, 스테이지, 마음 조각 텍스트 |
| `prototype/levels.js` | 생성된 레벨 데이터 (자동 생성) |
| `tools/levelgen.mjs` | 레벨 생성기 (풀이 검증, 난이도 추정, 최소 이동 수 계산) |
| `tools/data/levels.json` | 레벨 원본 데이터. Unity 이식 시 사용 |
| `docs/game-design.md` | 콘텐츠 구성, 퍼즐 규칙, Unity 이식 가이드 |

## 프로토타입 실행

브라우저가 로컬 파일의 이미지를 막을 수 있으므로 간단한 웹 서버로 엽니다.

```bash
cd prototype && python3 -m http.server 8000
```

그다음 브라우저에서 `http://localhost:8000`을 엽니다. 같은 와이파이의 휴대폰에서는 `http://<PC의 IP>:8000`으로 접속할 수 있습니다.

주소 끝에 `#mio-3`처럼 레벨 이름을 붙이면 해당 스테이지로 바로 들어갑니다. 잠긴 스테이지는 설정의 **모든 스테이지 열기**를 켜야 열립니다.

## 레벨 다시 만들기

```bash
node tools/levelgen.mjs
```

특정 레벨만 다시 만들 때는 `ONLY`를 지정합니다.

```bash
ONLY=ella-3,mio-5 node tools/levelgen.mjs
```

## 검토용 기능

- 설정 → 모든 스테이지 열기: 해금 조건을 무시합니다.
- 설정 → 진행 초기화: 별, 마음 조각, 도구 개수를 처음 상태로 되돌립니다.
- 브라우저 콘솔에서 `__nasa.autoSolve()`를 실행하면 현재 스테이지를 자동으로 풉니다.

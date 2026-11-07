# 하트볼트 (Heartbolt)

스크류 퍼즐과 성인 대상 연애 시뮬레이션을 합친 게임입니다. 주인공은 마음 가장 깊은 곳의 볼트(하트볼트)를 보고, 그녀가 허락한 만큼 풀 수 있는 능력 **하트 드라이버**를 가졌습니다. 퍼즐로 그녀의 숨겨진 성향을 밝혀내고, 그 성향을 받아들여 주며 사랑에 빠지는 과정을 그립니다. 본 개발은 Unity로 진행해 Steam에 출시할 예정이며, 이 저장소에는 규칙과 이야기 구성을 검증하는 웹 프로토타입(v0.4, 국내판 수위)이 들어 있습니다.

연애 시뮬레이션 구성은 [docs/romance-direction.md](docs/romance-direction.md), 퍼즐 규칙과 Unity 이식 방법은 [docs/game-design.md](docs/game-design.md)에 정리했습니다.

## 바로 플레이하기

**https://kenihy.github.io/ScrewPuzzle/**

휴대폰이나 PC 브라우저에서 위 주소를 열면 최신 프로토타입인 **언스크류(UNCREW)** 가 바로 실행됩니다. 로그인이나 설치는 필요 없습니다. PC 화면에 있는 아래 QR 코드를 휴대폰 카메라로 찍어도 됩니다.

<img src="docs/play-qr.png" alt="플레이 주소 QR 코드" width="180">

| 프로토타입 | 주소 | 설명 |
|---|---|---|
| 언스크류 (UNCREW) | https://kenihy.github.io/ScrewPuzzle/ | 회귀 생존 미스터리. 첫 사건(D-30 「어제의 전달 목록」) P0. 자세한 내용은 [uncrew/README.md](uncrew/README.md) |
| 하트볼트 (Heartbolt) | https://kenihy.github.io/ScrewPuzzle/prototype/ | 이전 프로토타입. 이 문서의 아래 내용은 하트볼트 기준입니다. |

> 풀수록, 더 깊이 얽힌다. — 언스크류(UNCREW)

휴대폰에서는 홈 화면에 추가하면 주소창 없이 앱처럼 전체 화면으로 실행됩니다.

- iPhone(Safari): 공유 버튼 → **홈 화면에 추가**
- Android(Chrome): 오른쪽 위 메뉴(⋮) → **홈 화면에 추가** 또는 **앱 설치**

하트볼트는 `prototype/#mio-3`처럼 주소 끝에 만남 이름을 붙이면 해당 만남으로 바로 들어갑니다. 잠긴 만남은 설정의 **모든 만남 열기**를 켜야 열립니다.

### 배포 설정 (처음 한 번)

이 주소는 GitHub Pages로 배포됩니다. 저장소의 **Settings → Pages**에서 아래처럼 한 번만 설정하면, 이후에는 이 브랜치에 푸시할 때마다 1~2분 뒤 자동으로 갱신됩니다.

1. **Build and deployment → Source**: `Deploy from a branch`
2. **Branch**: `claude/festive-einstein-f8t2vo`, 폴더 `/ (root)` → **Save**

저장소 루트의 `index.html`이 방문자를 `uncrew/`(언스크류)로 보내 줍니다. 언스크류는 컴퓨터에서 `uncrew/index.html`을 브라우저로 바로 열어도(더블클릭) 실행됩니다. 하트볼트를 컴퓨터에서 실행하는 방법은 아래 **내 컴퓨터에서 실행**을 참고하세요.

## 구성

| 경로 | 내용 |
|---|---|
| `prototype/` | 웹 프로토타입 (HTML5 Canvas, 휴대폰 세로 화면 기준) |
| `prototype/rules.js` | 퍼즐 규칙 엔진. 렌더링과 분리된 순수 로직 |
| `prototype/story.js` | 프롤로그, 만남별 대사·선택지·성향 단서, 약속 장면, 엔딩 대본, 신뢰·끌림 규칙 |
| `prototype/content.js` | 캐릭터 정보, 성향과 추리 후보, 기믹, 일러스트 크롭, 마음 조각 |
| `prototype/levels.js` | 생성된 레벨 데이터 (자동 생성) |
| `tools/levelgen.mjs` | 레벨 생성기 (풀이 검증, 난이도 추정, 최소 이동 수 계산) |
| `tools/variants.mjs` | 선택지별 퍼즐 변형 생성기 (신뢰 선택은 쉬운 변형, 끌림·밀어붙이기 선택은 어려운 변형) |
| `tools/data/levels.json` | 레벨 원본 데이터. Unity 이식 시 사용 |
| `docs/romance-direction.md` | 성향 공략 구성, 기믹과 성향의 연결, 엔딩, 심의 기준 |
| `docs/game-design.md` | 퍼즐 규칙, 레벨 데이터, Unity 이식 가이드 |

## 내 컴퓨터에서 실행

브라우저가 로컬 파일의 이미지를 막을 수 있으므로 간단한 웹 서버로 엽니다.

```bash
cd prototype && python3 -m http.server 8000
```

그다음 브라우저에서 `http://localhost:8000`을 엽니다. 같은 와이파이의 휴대폰에서는 `http://<PC의 IP>:8000`으로 접속할 수 있습니다.

## 레벨 다시 만들기

```bash
node tools/levelgen.mjs
```

특정 레벨만 다시 만들 때는 `ONLY`를 지정합니다.

```bash
ONLY=ella-3,mio-5 node tools/levelgen.mjs
```

레벨을 다시 만든 뒤에는 선택지별 변형도 다시 만들어야 합니다.

```bash
node tools/variants.mjs
```

## 검토용 기능

- 설정 → 모든 만남 열기: 해금 조건을 무시하고 알아낸 것·앨범을 모두 보여 줍니다.
- 설정 → 프롤로그 다시 보기
- 설정 → 진행 초기화: 신뢰, 끌림, 추리, 알아낸 것, 엔딩, 별, 도구 개수를 처음 상태로 되돌립니다.
- 브라우저 콘솔에서 `__nasa.autoSolve()`를 실행하면 현재 퍼즐을 자동으로 풉니다.

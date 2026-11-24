<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 문서 라우팅 (재고관리 PoC)

## 원칙

- **작업 시작 시 문서를 한꺼번에 읽지 않는다.** 질문 유형을 아래 표에서 찾고, 그 행의 원본만 읽는다.
- 원본은 [docs/harness/SSOT.md](docs/harness/SSOT.md) §1의 지정표가 정한다. 충돌하면 지정표를 따른다.
- 원본에서 판단이 안 되면 **탐색 범위를 한 단계씩 넓힌다** (아래 "탐색 확장" 참고).
- 원본 문서 전체를 읽기 전에 헤딩만 확인하고(`grep -n '^#'`), 필요한 절만 읽는다.

## 질문 유형 → 원본

| 질문 유형 | 먼저 읽을 원본 | 필요한 절 예시 |
|---|---|---|
| 재고 개념·규칙 (로트, 거점, 사유, 입고·출고, 이동, 정산 규칙) | `docs/01-requirements.md` | §2 개념, §3 해당 F번호 |
| 비기능 요구·범위·완료 기준 | `docs/01-requirements.md` | §5, §6, §7 |
| 가정·미결 사항 | `docs/01-requirements.md` | §8 |
| 기술 스택·폴더 구조·데이터 모델·핵심 로직 (FEFO·LEFO·정산 역산) | `docs/06-architecture.md` | §1~§4 |
| 상태 흐름·인증·시드·불변식 | `docs/06-architecture.md` | §5, §6, §7, §9 |
| 개별 작업 (기능·버그·개선) | GitHub Issue (`gh issue view <번호>`, 저장소 `jeongsuplee-dev/inventory-harness-lab`) | 이슈 본문·완료 조건 |
| 하네스 체계·원본 지정·이슈 규칙 | `docs/harness/SSOT.md` | §1, §2, §3 |
| 문서·이슈 간 충돌, 우선순위 | `docs/harness/SSOT.md` | §6 (충돌 시 `NEEDS_HUMAN`, 임의 판단 금지) |
| 검증 규칙 | `docs/harness/SSOT.md` §4 | 현재 **추후 생성** (비어 있음) |
| 구현·검증 루프 | `docs/harness/SSOT.md` §5 | 현재 **추후 생성** (비어 있음) |
| 사용 시나리오·설계 원칙 P1~P12 | `docs/03-scenarios.md` | 해당 S번호 또는 §6 |
| 차별화 장치 E1~E3 | `docs/04-engagement.md` | 해당 E번호 |
| 화면·컴포넌트·색상·접근성 | `docs/05-design.md` | 해당 §번호 (시안: `mockups/final.html`) |
| 실행 방법·명령어 | `README.md` | 실행, 명령어 절 |

## 탐색 확장 (라우팅 문서로 판단할 수 없을 때만)

1. 해당 행의 원본 **필요한 절**만 읽는다.
2. 그래도 부족하면 **같은 행의 다른 원본** 또는 SSOT가 지정한 보조 원본 한 개를 추가로 읽는다.
3. 그래도 부족하면 문서 전체 헤딩을 훑어 관련 절을 찾는다.
4. 문서로 끝내 답할 수 없을 때만 코드(`src/`, `prisma/`)를 본다. DB(`prisma/dev.db`)는 읽지 않는다.
5. 확장할 때마다 **무엇을 왜 더 읽는지** 한 줄로 밝힌다.

## 주의

- `docs/HANDOVER.md`는 진행 상태 기록이며 원본이 아니다. 판단 근거로 쓰지 않는다.
- 개별 작업의 상태·완료 여부는 GitHub Issue가 원본이다. 문서에 적힌 상태를 믿지 않는다.
- 검증 규칙과 구현·검증 루프는 아직 없다. 임의로 만들어 적용하지 않는다.

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * 아키텍처 규칙 검사 (06-architecture.md)
 *
 * 예외: prisma/seed.ts 와 tests/ 는 이 규칙 밖이다 (초기화·정리를 위해 직접 쓴다).
 * 검사 대상은 src/ 전체이며, 파일 그룹마다 규칙 목록이 다르므로 그룹을 겹치지 않게 나눈다.
 * (flat config는 같은 규칙을 뒤 블록이 덮어쓰므로, 그룹을 겹치면 앞 규칙이 사라진다.)
 */

const WRITE = "create|createMany|update|updateMany|upsert|delete|deleteMany";

/** db.<model>.<verb>() 또는 tx.<model>.<verb>() 형태의 호출 셀렉터 */
const modelCall = (model, verbs) => [
  `CallExpression[callee.property.name=/^(${verbs})$/][callee.object.property.name="${model}"]`,
  `CallExpression[callee.property.name=/^(${verbs})$/][callee.object.name="${model}"]`,
];

const LOT_WRITE = {
  selectors: modelCall("lot", WRITE),
  message: "재고 수량(Lot)은 lib/stock.ts의 applyMovement로만 바꾼다 (06 §2, §4.1)",
};
const MOVEMENT_CREATE = {
  selectors: modelCall("movement", "create|createMany"),
  message: "이동 기록(Movement)은 applyMovement에서만 만든다 (06 §4.1)",
};
const MOVEMENT_MUTATE = {
  selectors: modelCall("movement", "update|updateMany|upsert|delete|deleteMany"),
  message: "이동 기록은 수정·삭제하지 않는다. 취소는 상쇄 기록으로 한다 (01 §5)",
};
const RAW_SQL = {
  selectors: ['CallExpression[callee.property.name^="$execute"]'],
  message: "원시 SQL로 재고나 이력을 바꾸지 않는다 (06 §2)",
};
const APPLY_MOVEMENT_TX = {
  selectors: ['CallExpression[callee.name="applyMovement"]:not([arguments.0.name="tx"])'],
  message: "applyMovement는 트랜잭션 인자 tx로 호출한다 (06 §4.1)",
};
const UI_DB_WRITE = {
  selectors: [
    `CallExpression[callee.property.name=/^(${WRITE})$/][callee.object.object.name=/^(db|tx)$/]`,
  ],
  message: "화면·컴포넌트는 DB에 쓰지 않는다. 쓰기는 actions/ 의 Server Action에서 한다 (06 §2, §5)",
};
const UI_TRANSACTION = {
  selectors: ['CallExpression[callee.property.name="$transaction"]'],
  message: "트랜잭션은 Server Action(actions/)에서만 연다 (06 §5)",
};

/** 모든 src 파일에 공통으로 적용되는 규칙 */
const BASE = [LOT_WRITE, MOVEMENT_CREATE, MOVEMENT_MUTATE, RAW_SQL, APPLY_MOVEMENT_TX];

const toRules = (groups) => [
  "error",
  ...groups.flatMap((g) => g.selectors.map((selector) => ({ selector, message: g.message }))),
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma 생성물은 검사 대상이 아니다
    "src/generated/**",
  ]),

  // ── 그룹 1: 재고 통로 (lib/stock.ts) — 재고 수량과 이동 기록을 만드는 유일한 파일
  {
    files: ["src/lib/stock.ts"],
    rules: {
      "no-restricted-syntax": toRules([MOVEMENT_MUTATE, RAW_SQL, APPLY_MOVEMENT_TX]),
    },
  },

  // ── 그룹 2: 화면 컴포넌트 — DB 쓰기·트랜잭션 금지, 서버 전용 모듈 import 금지
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": toRules([...BASE, UI_DB_WRITE, UI_TRANSACTION]),
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db", "@/lib/session", "@/lib/stock", "@/lib/popup", "@/generated/**"],
              message: "화면 컴포넌트는 서버 전용 모듈을 import하지 않는다 (06 §2, §6)",
            },
            {
              group: ["@/lib/inventory"],
              allowTypeImports: true,
              message: "화면 컴포넌트는 조회 로직을 직접 import하지 않는다. 타입만 허용 (06 §2)",
            },
          ],
        },
      ],
    },
  },

  // ── 그룹 3: 화면 페이지 — 쓰기 금지 (읽기는 허용)
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": toRules([...BASE, UI_DB_WRITE, UI_TRANSACTION]),
    },
  },

  // ── 그룹 4: 나머지 src (actions/, lib/ 등) — 공통 규칙만
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/stock.ts", "src/components/**", "src/app/**"],
    rules: {
      "no-restricted-syntax": toRules(BASE),
    },
  },

  // ── 예외: seed와 테스트는 초기화·정리를 위해 규칙 밖이다
  {
    files: ["prisma/seed.ts", "tests/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;

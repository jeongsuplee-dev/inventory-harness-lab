#!/usr/bin/env node
/**
 * 검증 파이프라인: Prepare → Types → Lint → Test → Build
 *
 * - Prepare: 검증 전용 DB(prisma/verify.db)를 지우고 새로 만든다.
 *   마이그레이션 → 생성 → 시드 순서이며, 시드는 고정 시각(VERIFY_NOW)과
 *   고정 시간대(TZ)로 실행한다. 그래서 실행 날짜·PC·기존 DB 상태와 무관하게
 *   같은 시드 데이터가 나온다.
 * - 이후 단계는 모두 같은 검증 DB를 가리킨다. 개발 DB(prisma/dev.db)는 건드리지 않는다.
 * - 한 단계라도 실패하면 즉시 멈추고 그 단계의 종료 코드로 끝난다.
 *
 * 사용법
 *   npm run verify           전체 파이프라인
 *   npm run verify:prepare   Prepare 단계만 (검증 DB 재생성)
 */
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)

const VERIFY_DB = 'prisma/verify.db'
const FIXED_NOW = '2026-08-18T12:00:00+09:00' // 시드 기준 시각 (M1 구현 시점과 동일)

// 모든 자식 프로세스에 적용되는 검증 환경
const env = {
  ...process.env,
  DATABASE_URL: `file:./${VERIFY_DB}`,
  VERIFY_NOW: FIXED_NOW,
  TZ: 'Asia/Seoul',
}

function step(title, cmd, args) {
  console.log(`\n━━ ${title} ━━ ${[cmd, ...args].join(' ')}`)
  const res = spawnSync(cmd, args, { cwd: root, env, stdio: 'inherit', shell: true })
  if (res.status !== 0) {
    console.error(`\n✖ ${title} 실패 (종료 코드 ${res.status ?? 'signal'})`)
    process.exit(res.status ?? 1)
  }
}

function prepare() {
  console.log(`\n━━ Prepare ━━ 검증 DB 재생성: ${VERIFY_DB} (고정 시각 ${FIXED_NOW})`)
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    rmSync(path.join(root, VERIFY_DB + suffix), { force: true })
  }
  step('Prepare: 마이그레이션', 'npx', ['prisma', 'migrate', 'deploy'])
  step('Prepare: 클라이언트 생성', 'npx', ['prisma', 'generate'])
  step('Prepare: 시드', 'npx', ['tsx', 'prisma/seed.ts'])
  console.log('\n✔ Prepare 완료')
}

const onlyPrepare = process.argv[2] === 'prepare'

prepare()
if (onlyPrepare) process.exit(0)

step('Types', 'npm', ['run', 'typecheck'])
step('Lint', 'npm', ['run', 'lint'])
step('Test', 'npm', ['run', 'test'])
step('Build', 'npm', ['run', 'build'])

console.log('\n✔ 전체 검증 통과 (Prepare → Types → Lint → Test → Build)')

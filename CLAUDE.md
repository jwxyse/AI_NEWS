# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 프로젝트 상태

해외 AI 뉴스를 RSS로 수집해 Claude로 한국어 요약·분류하고, 카드로 보여주며 Notion에 저장하는 웹앱입니다. 요구사항 전체는 `PRD.md`에 있습니다. 대시보드(`/dashboard`), 뉴스 가져오기·요약·분류, Notion 저장까지 구현되어 있습니다. (`PRD.md`가 언급하는 `PLAN.md`는 아직 존재하지 않습니다.)

## 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드 (.next/types 의 LayoutProps/PageProps 등 라우트 타입도 생성)
npm run lint     # ESLint (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit # 타입 검사 — .next/ 가 없으면 LayoutProps 미정의 오류가 나므로 먼저 build 또는 dev 실행
npm run db:generate # src/db/schema.ts 변경 → drizzle/ 에 마이그레이션 SQL 생성 (DB 연결 불필요)
npm run db:migrate  # 마이그레이션을 Neon DB에 적용 (.env.local 의 DATABASE_URL 사용)
npm run db:studio   # Drizzle Studio로 DB 확인
```

테스트 러너는 아직 설정되어 있지 않습니다.

## 스택과 설정상 주의점

- **Next.js 16 (App Router, `src/app/`)**, React 19, TypeScript, 경로 별칭 `@/*` → `src/*`.
- `next.config.ts`에서 `cacheComponents: true`, `partialPrefetching: true`가 켜져 있습니다. 데이터 페칭·캐싱·동적 렌더링 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 확인하세요.
- **Tailwind CSS v4** — `tailwind.config` 파일 없이 `src/app/globals.css`에서 설정하며, Turbopack 로더 `@tailwindcss/turbopack`으로 처리됩니다.
- 설치된 PRD 스택 패키지: `@clerk/nextjs`(인증), `drizzle-orm` + `@neondatabase/serverless` + `drizzle-kit`(Neon Postgres), `rss-parser`, `@anthropic-ai/sdk`.
- **DB (Drizzle + Neon)**: 설정 `drizzle.config.ts`(`@next/env`로 `.env.local` 로드), 클라이언트 `src/db/index.ts`(`drizzle-orm/neon-http`, `server-only` — 서버 코드에서만 `import { db } from "@/db"`), 스키마 `src/db/schema.ts`. 스키마를 바꾸면 `db:generate`로 마이그레이션을 만들어 `drizzle/`을 함께 커밋한다(`push` 대신 generate+migrate).

## UI 가이드

화면·컴포넌트를 만들거나 스타일을 바꾸기 전에 반드시 `ui.md`를 읽고 따르세요. 핵심 규칙:

- 앱 이름은 "AI 뉴스 수집기", 메인 화면은 뉴스 카드 대시보드(헤더 → 툴바 → 카테고리 바 + "카테고리 추가" 버튼 → 카드 그리드)입니다.
- 색은 zinc 기반 **역할 토큰**(`bg-surface`, `text-fg-muted`, `bg-primary` 등, `globals.css`의 `@theme`에 정의)으로만 씁니다. `zinc-*` 같은 팔레트 클래스나 `dark:` 색 클래스를 컴포넌트에 직접 쓰지 않습니다. 상태 색(success·danger·warning)은 상태 표시에만 씁니다.
- 한국어 본문에는 `break-keep`과 넉넉한 줄 간격을 적용하고, 로딩·빈 상태·오류 상태를 함께 만듭니다.

## 인증 (Clerk Core 3, `@clerk/nextjs` v7)

- `<SignedIn>`/`<SignedOut>`는 v7에서 제거됨 → `<Show when="signed-in">` 사용. `auth()`는 `@clerk/nextjs/server`에서 import.
- `src/proxy.ts`(Next 16에서 `middleware` → `proxy`로 이름 변경): `/`만 공개. 로그인 안 한 요청은 API면 401 JSON, 페이지면 `/`로 리다이렉트.
- `/`는 로그인 안 한 사용자에게 `SignInGate`를 렌더링해 로그인 **모달**을 자동으로 연다(별도 `/sign-in` 페이지 없음, `.env.local`의 `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/`).
- `cacheComponents`가 켜져 있어 `auth()`/`<Show>`를 쓰는 서버 컴포넌트는 `<Suspense>`로 감싸야 빌드가 통과한다.
- UI 한국어화: `ClerkProvider localization={koKR}` (`@clerk/localizations`).

## 계획된 아키텍처 (PRD 기준)

- **공통 기사 + 사용자별 상태**: `articles`는 모든 사용자가 함께 보는 공통 데이터(`userId` 없음, `originalUrl` 전체 유일)입니다. 기사별 분류(`categoryId`)와 Notion 저장(`notionPageUrl`)은 `user_articles`(PK: userId+articleId)에 사용자별로 둡니다. 행이 없거나 `categoryId`가 null이면 그 사용자에게 "미분류"입니다. 목록 조회는 `articles` LEFT JOIN `user_articles`(해당 userId) 형태입니다(`src/db/queries.ts`).
- **멀티 유저 격리**: 모든 페이지와 API는 Clerk 로그인 필수이며, `categories`·`user_articles`(·나중에 쓸 `notion_connections`)의 모든 쿼리는 `userId`로 범위를 제한해야 합니다. `user_articles.categoryId`에는 같은 사용자의 카테고리만 넣어야 합니다. 첫 로그인 시 기본 카테고리(LLM·모델 / 투자·비즈니스 / 정책·규제 / 연구 / 제품·서비스 / 기타)를 생성합니다.
- **수집 파이프라인**: "뉴스 가져오기" 요청 시에만 실행(크론 없음) → TechCrunch AI, The Verge AI RSS 수집 → 전체 기사 기준 `originalUrl` 중복 제거 → **새 기사만** Claude(`claude-opus-5-5`)로 보내 한국어 제목·3~4문장 요약을 생성(공통, 기사당 1회) → 요청한 사용자 기준으로 아직 분류되지 않은 기사(새 기사 + 다른 사용자가 가져온 기사)에 카테고리 1개를 매겨 `user_articles`에 저장. 피드 하나가 실패해도 나머지 결과는 반환합니다.
- **재분류**: 사용자가 버튼을 눌렀을 때만 실행하며, 그 사용자의 `user_articles.categoryId`만 바꾸고 제목·요약은 유지합니다. 카테고리 삭제 시 해당 기사는 그 사용자에게만 "미분류"(categoryId null)로 바뀝니다.
- **Notion 저장 (PRD v0.3)**: 카드의 "뉴스 저장" 버튼 → Server Action `saveToNotion`(`src/app/dashboard/actions.ts`) → `src/lib/notion.ts`가 Notion REST API(`Notion-Version: 2025-09-03`)로 페이지를 만든다. 앱 공용 Internal integration 토큰 `NOTION_API_KEY`와 데이터베이스 `NOTION_DATABASE_ID`("AI 뉴스 북마크")를 쓰며, 모든 사용자가 같은 데이터베이스에 저장한다. 이 API 버전에서는 페이지 부모가 data source이므로 데이터베이스에서 data source ID를 조회해 쓴다. 데이터베이스 속성 이름(제목·텍스트·카테고리·출처·발행일·원문링크)을 Notion에서 바꾸면 `notion.ts`도 함께 바꿔야 한다. 저장 결과는 `user_articles.notionPageUrl`에 사용자별로 기록해 중복 저장을 막는다. Claude/MCP 커넥터는 쓰지 않는다 — 노션 MCP 서버(`mcp.notion.com`)는 OAuth만 받아 integration 토큰을 쓸 수 없다. 사용자별 OAuth 연결(FR-8)과 `notion_connections` 테이블은 보류 상태다.
- UI 문구는 모두 한국어이고, 반응형 카드 그리드를 사용합니다.

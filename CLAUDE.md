# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 프로젝트 상태

해외 AI 뉴스를 RSS로 수집해 Claude로 한국어 요약·분류하고, 카드로 보여주며 Notion에 저장하는 웹앱입니다. 요구사항 전체는 `PRD.md`에 있습니다. 현재는 `create-next-app` 기본 골격과 의존성만 설치된 상태이며, 앱 코드는 아직 없습니다. (`PRD.md`가 언급하는 `PLAN.md`는 아직 존재하지 않습니다.)

## 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드 (.next/types 의 LayoutProps/PageProps 등 라우트 타입도 생성)
npm run lint     # ESLint (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit # 타입 검사 — .next/ 가 없으면 LayoutProps 미정의 오류가 나므로 먼저 build 또는 dev 실행
```

테스트 러너는 아직 설정되어 있지 않습니다.

## 스택과 설정상 주의점

- **Next.js 16 (App Router, `src/app/`)**, React 19, TypeScript, 경로 별칭 `@/*` → `src/*`.
- `next.config.ts`에서 `cacheComponents: true`, `partialPrefetching: true`가 켜져 있습니다. 데이터 페칭·캐싱·동적 렌더링 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 확인하세요.
- **Tailwind CSS v4** — `tailwind.config` 파일 없이 `src/app/globals.css`에서 설정하며, Turbopack 로더 `@tailwindcss/turbopack`으로 처리됩니다.
- 설치된 PRD 스택 패키지: `@clerk/nextjs`(인증), `drizzle-orm` + `@neondatabase/serverless` + `drizzle-kit`(Neon Postgres), `rss-parser`, `@anthropic-ai/sdk`. Drizzle 설정·스키마와 `.env.local`은 아직 없습니다.

## 인증 (Clerk Core 3, `@clerk/nextjs` v7)

- `<SignedIn>`/`<SignedOut>`는 v7에서 제거됨 → `<Show when="signed-in">` 사용. `auth()`는 `@clerk/nextjs/server`에서 import.
- `src/proxy.ts`(Next 16에서 `middleware` → `proxy`로 이름 변경): `/`만 공개. 로그인 안 한 요청은 API면 401 JSON, 페이지면 `/`로 리다이렉트.
- `/`는 로그인 안 한 사용자에게 `SignInGate`를 렌더링해 로그인 **모달**을 자동으로 연다(별도 `/sign-in` 페이지 없음, `.env.local`의 `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/`).
- `cacheComponents`가 켜져 있어 `auth()`/`<Show>`를 쓰는 서버 컴포넌트는 `<Suspense>`로 감싸야 빌드가 통과한다.
- UI 한국어화: `ClerkProvider localization={koKR}` (`@clerk/localizations`).

## 계획된 아키텍처 (PRD 기준)

- **멀티 유저 격리**: 모든 페이지와 API는 Clerk 로그인 필수이며, `categories`·`articles`·`notion_connections`의 모든 쿼리는 `userId`로 범위를 제한해야 합니다. 첫 로그인 시 기본 카테고리(LLM·모델 / 투자·비즈니스 / 정책·규제 / 연구 / 제품·서비스 / 기타)를 생성합니다.
- **수집 파이프라인**: "뉴스 가져오기" 요청 시에만 실행(크론 없음) → TechCrunch AI, The Verge AI RSS 수집 → `originalUrl` 기준 중복 제거 → **새 기사만** Claude(`claude-opus-5-5`)로 보내 한국어 제목·3~4문장 요약·카테고리 1개를 생성. 피드 하나가 실패해도 나머지 결과는 반환합니다.
- **재분류**: 사용자가 버튼을 눌렀을 때만 실행하며, 카테고리만 바꾸고 제목·요약은 유지합니다. 카테고리 삭제 시 해당 기사는 "미분류"(categoryId null)로 바뀝니다.
- **Notion**: 사용자별 OAuth 연결, 토큰은 암호화해 저장하고 자동 갱신합니다. 저장은 Claude API의 MCP 커넥터로 노션 MCP 서버를 호출합니다. 첫 저장 때 "AI News" 데이터베이스를 만들고 그 ID를 `notion_connections`에 보관하며, 저장 후 `articles.notionPageUrl`로 중복 저장을 막습니다.
- UI 문구는 모두 한국어이고, 반응형 카드 그리드를 사용합니다.

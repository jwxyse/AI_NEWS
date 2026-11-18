# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 모아 **Claude로 한국어 제목·요약을 만들고**, **카테고리별 카드**로 보여주며, 필요한 기사는 버튼 한 번으로 **Notion 데이터베이스에 저장**하는 웹앱입니다.

## 주요 기능

- **뉴스 가져오기**: TechCrunch AI, The Verge AI의 RSS에서 최근 24시간 기사를 가져옵니다. 이미 있는 기사(원문 URL 기준)는 건너뜁니다.
- **한국어 번역·요약**: 새 기사만 Claude(`claude-opus-5-5`)로 보내 한국어 제목과 3~4문장 요약을 만듭니다. 기사당 한 번만 만들고 모든 사용자가 함께 씁니다.
- **카테고리 분류**: 사용자마다 자기 카테고리 기준으로 기사를 분류합니다. 첫 로그인 때 기본 카테고리(LLM·모델 / 투자·비즈니스 / 정책·규제 / 연구 / 제품·서비스 / 기타)를 만들어 주고, 카테고리를 더 추가할 수 있습니다.
- **뉴스 카드 대시보드**: 최신순 반응형 카드 그리드, 카테고리 필터, 페이지네이션(페이지당 9개)을 제공합니다.
- **뉴스 저장 (Notion)**: 카드의 "뉴스 저장" 버튼을 누르면 Notion 데이터베이스에 페이지로 저장되고, 버튼이 "저장됨 ✓"(Notion 페이지 링크)으로 바뀝니다.
- **로그인**: Clerk 로그인이 있어야 쓸 수 있습니다. 카테고리, 분류 결과, 저장 상태는 사용자별로 분리됩니다.

아직 만들지 않은 기능: 재분류(FR-7), 카테고리 수정·삭제, 사용자별 Notion 연결(FR-8, 보류). 요구사항 전체는 [`PRD.md`](PRD.md)에 있습니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript |
| 스타일 | Tailwind CSS v4 |
| 로그인 | Clerk (`@clerk/nextjs` v7, 한국어 UI) |
| 데이터베이스 | Neon Postgres + Drizzle ORM |
| RSS 수집 | `rss-parser`, 원문 본문 추출은 `@mozilla/readability` + `linkedom` |
| 번역·요약·분류 | Claude API (`@anthropic-ai/sdk`) |
| Notion 저장 | Notion REST API + Internal integration |

## 시작하기

### 1. 준비물

- Node.js 20 이상
- [Clerk](https://dashboard.clerk.com) 애플리케이션
- [Neon](https://console.neon.tech) Postgres 데이터베이스
- [Anthropic API](https://console.anthropic.com) 키
- Notion [Internal integration](https://www.notion.so/profile/integrations)과 저장할 데이터베이스

### 2. 설치

```bash
git clone https://github.com/jwxyse/AI_NEWS.git
cd AI_NEWS
npm install
```

### 3. 환경 변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채웁니다. 이 파일은 `.gitignore`에 들어 있어 커밋되지 않습니다.

```bash
# 로그인 (Clerk) — Clerk 대시보드 → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# 데이터베이스 (Neon) — Connection string
DATABASE_URL=

# 번역·요약·분류 (Claude API)
ANTHROPIC_API_KEY=

# Notion 저장 — Internal integration 토큰(ntn_...)과 데이터베이스 ID
NOTION_API_KEY=
NOTION_DATABASE_ID=
```

### 4. 데이터베이스 마이그레이션

```bash
npm run db:migrate
```

### 5. Notion 데이터베이스 준비

저장할 데이터베이스에 아래 속성을 만들고, 데이터베이스 `…` → **연결(Connections)**에서 integration을 추가합니다. 자세한 내용은 [`NOTION_SETUP.md`](NOTION_SETUP.md)를 보세요.

| 속성 | 형식 |
|---|---|
| 제목 | 제목(title) |
| 텍스트 | 텍스트 |
| 카테고리 | 선택 |
| 출처 | 선택 |
| 발행일 | 날짜 |
| 원문링크 | URL |

### 6. 실행

```bash
npm run dev
```

http://localhost:3000 에 들어가면 로그인 창이 뜹니다. 로그인하면 `/dashboard`로 이동하고, "뉴스 가져오기"를 누르면 기사를 수집·요약·분류합니다.

## 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드한 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npx tsc --noEmit` | 타입 검사 (먼저 `build`나 `dev`를 한 번 실행해야 합니다) |
| `npm run db:generate` | `src/db/schema.ts` 변경 내용으로 `drizzle/`에 마이그레이션 SQL 생성 |
| `npm run db:migrate` | 마이그레이션을 데이터베이스에 적용 |
| `npm run db:studio` | Drizzle Studio로 데이터 확인 |

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 로그인 화면 (로그인했으면 /dashboard로 이동)
│   └── dashboard/            # 뉴스 카드 대시보드, 서버 액션(actions.ts)
├── components/               # 헤더, 로그인 게이트, 버튼 스타일
├── db/
│   ├── schema.ts             # Drizzle 스키마
│   └── queries.ts            # 사용자별로 범위를 제한한 쿼리
├── lib/
│   ├── rss.ts                # RSS 수집
│   ├── article-content.ts    # 원문 본문 추출
│   ├── news-pipeline.ts      # 수집 → 요약 → 분류 파이프라인
│   ├── ai/                   # Claude 요약·분류
│   └── notion.ts             # Notion 페이지 생성
└── proxy.ts                  # 로그인 확인 (Next 16의 middleware)
drizzle/                      # 마이그레이션 SQL
```

## 데이터 구조

- `articles`: 모든 사용자가 함께 보는 공통 기사. 원문 URL은 전체에서 하나만 있습니다.
- `categories`: 사용자별 카테고리
- `user_articles`: 사용자별 기사 상태. 분류한 카테고리와 Notion 저장 페이지 URL이 들어갑니다.
- `notion_connections`: 사용자별 Notion 연결용 테이블(FR-8, 보류). 지금은 쓰지 않습니다.

## 관련 문서

- [`PRD.md`](PRD.md): 요구사항
- [`ui.md`](ui.md): UI 가이드 (색 토큰, 컴포넌트 규칙)
- [`NOTION_SETUP.md`](NOTION_SETUP.md): Notion 저장 설정
- [`CLAUDE.md`](CLAUDE.md): Claude Code 작업 가이드

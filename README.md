# AI 뉴스 수집기

해외 AI 뉴스를 버튼 한 번으로 모아 **한국어로 요약**하고, **카테고리별 카드**로 보여주며, 필요한 기사는 **Notion에 바로 저장**하는 웹앱입니다.

## 주요 기능

- **뉴스 가져오기**: TechCrunch AI, The Verge AI의 RSS 피드를 수집합니다. 이미 있는 기사는 원문 URL로 걸러냅니다.
- **한국어 요약**: 새 기사만 Claude로 보내 한국어 제목과 3~4문장 요약을 만듭니다.
- **카테고리 분류**: 기사마다 카테고리를 1개 붙입니다. 기본 카테고리는 LLM·모델, 투자·비즈니스, 정책·규제, 연구, 제품·서비스, 기타입니다. 카테고리는 사용자마다 추가·삭제하고 재분류할 수 있습니다.
- **Notion 저장**: 카드의 "뉴스 저장" 버튼으로 기사를 Notion 데이터베이스에 페이지로 저장합니다.
- **멀티 유저**: Clerk로 로그인합니다. 기사는 모든 사용자가 함께 보고, 분류와 저장 상태는 사용자마다 따로 관리합니다.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일 | Tailwind CSS v4 |
| 인증 | Clerk (`@clerk/nextjs`) |
| DB | Neon Postgres + Drizzle ORM |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| 수집 | `rss-parser`, `@mozilla/readability`, `linkedom` |
| 저장 | Notion REST API |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 넣습니다. 이 파일은 `.gitignore`에 들어 있으니 커밋하지 마세요.

```bash
# DB (Neon)
DATABASE_URL=

# Claude
ANTHROPIC_API_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/

# Notion
NOTION_API_KEY=
NOTION_DATABASE_ID=
```

Notion 설정 방법은 [`NOTION_SETUP.md`](./NOTION_SETUP.md)에 정리되어 있습니다.

### 3. DB 마이그레이션

```bash
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드한 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run db:generate` | 스키마 변경으로 마이그레이션 SQL 생성 |
| `npm run db:migrate` | 마이그레이션을 DB에 적용 |
| `npm run db:studio` | Drizzle Studio로 DB 확인 |

## 폴더 구조

```
src/
├── app/
│   ├── page.tsx          # 로그인 화면
│   └── dashboard/        # 뉴스 카드 대시보드, Server Actions
├── components/           # 헤더, 로그인 게이트, 공용 UI
├── db/                   # Drizzle 스키마와 쿼리
├── lib/
│   ├── ai/               # Claude 요약·분류
│   ├── rss.ts            # RSS 수집
│   ├── article-content.ts# 기사 본문 추출
│   ├── news-pipeline.ts  # 수집 → 요약 → 분류 파이프라인
│   └── notion.ts         # Notion 저장
└── proxy.ts              # 로그인 보호
drizzle/                  # 마이그레이션 파일
```

## 문서

- [`PRD.md`](./PRD.md): 요구사항 정의
- [`ui.md`](./ui.md): UI 가이드
- [`NOTION_SETUP.md`](./NOTION_SETUP.md): Notion 저장 설정

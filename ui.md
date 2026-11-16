# UI 가이드 — AI 뉴스 수집기

"AI 뉴스 수집기"의 화면을 만들 때 따르는 규칙입니다. 스타일은 **Tailwind CSS v4** 유틸리티 클래스로만 작성합니다. 테마 토큰은 `src/app/globals.css`의 `@theme`에서 관리하며 `tailwind.config` 파일은 없습니다.

---

## 1. 디자인 원칙

1. **읽기가 먼저입니다.** 한국어 제목과 요약이 주인공입니다. 장식은 줄이고 여백과 글자 크기로 위계를 만듭니다.
2. **색은 zinc 하나로 씁니다.** 모든 화면은 zinc 팔레트로 칠하고, 강조는 색이 아니라 **명도 대비**(진한 zinc ↔ 밝은 zinc)로 만듭니다. zinc 밖의 색은 성공·오류·경고 같은 상태 표시에만 씁니다.
3. **색은 역할 이름으로 씁니다.** 컴포넌트에서는 `bg-zinc-900`처럼 팔레트 단계를 직접 쓰지 않고 `bg-primary`, `text-fg-muted`처럼 **역할 토큰**을 씁니다 (2.1 참고).
4. **다크 모드는 토큰이 처리합니다.** 역할 토큰이 라이트·다크 값을 함께 갖고 있으므로 컴포넌트에 `dark:` 색 클래스를 따로 쓰지 않습니다.
5. **일관성을 지킵니다.** 간격, 모서리, 그림자는 2장의 토큰에서만 고릅니다.
6. **문구는 모두 한국어로 씁니다.** 짧고 친근한 존댓말을 씁니다 (예: "아직 뉴스가 없어요").

---

## 2. 디자인 토큰

### 2.1 색상 — zinc 기반 역할 토큰

#### 역할 정의

| 역할 | 토큰 (Tailwind 클래스) | 라이트 | 다크 | 쓰는 곳 |
|---|---|---|---|---|
| **배경** | `bg-background` | zinc-50 | zinc-950 | 페이지 바탕 |
| **표면** | `bg-surface` | white | zinc-900 | 카드, 헤더, 다이얼로그, 보조 버튼 |
| **표면 (옅게)** | `bg-surface-muted` | zinc-100 | zinc-800 | 배지, hover 배경, 스켈레톤 |
| **테두리** | `border-border` | zinc-200 | zinc-800 | 카드·입력창·탭 테두리, 구분선 |
| **테두리 (진하게)** | `border-border-strong` | zinc-300 | zinc-700 | hover 테두리, 점선 버튼(카테고리 추가) |
| **글자 (기본)** | `text-fg` | zinc-900 | zinc-100 | 제목, 본문, 버튼 글자 |
| **글자 (보조)** | `text-fg-muted` | zinc-600 | zinc-300 | 카드 요약, 설명 문구 |
| **글자 (흐리게)** | `text-fg-subtle` | zinc-500 | zinc-400 | 출처, 날짜, 기사 수, 안내 문구 |
| **주요 (Primary)** | `bg-primary` | zinc-900 | zinc-100 | 주요 버튼, 선택된 카테고리 탭 |
| **주요 hover** | `hover:bg-primary-hover` | zinc-700 | zinc-300 | 주요 버튼·선택 탭 hover |
| **주요 위 글자** | `text-primary-fg` | white | zinc-900 | 주요 버튼·선택 탭 안의 글자 |
| **포커스 링** | `outline-ring` | zinc-500 | zinc-400 | 키보드 포커스 표시 |

#### 상태 색 (zinc 예외)

정보 전달이 꼭 필요한 상태 표시에만 씁니다. 버튼이나 탭을 꾸미는 데는 쓰지 않습니다.

| 역할 | 토큰 | 라이트 | 다크 | 쓰는 곳 |
|---|---|---|---|---|
| 성공 | `text-success` / `bg-success-soft` | emerald-700 / emerald-50 | emerald-300 / emerald-950 | "저장됨" 배지, Notion 연결 점 |
| 오류 | `text-danger` / `bg-danger-soft` | red-700 / red-50 | red-300 / red-950 | 오류 안내, 입력 오류 문구, 삭제 버튼 |
| 경고 | `text-warning` / `bg-warning-soft` | amber-800 / amber-50 | amber-200 / amber-950 | 피드 일부 실패 안내 |

#### `globals.css` 정의

팔레트 값은 Tailwind 기본 변수(`var(--color-zinc-*)`)를 참조합니다. 다크 값은 `prefers-color-scheme`에 따라 바뀝니다.

```css
@import "tailwindcss";

:root {
  --background: var(--color-zinc-50);
  --surface: var(--color-white);
  --surface-muted: var(--color-zinc-100);
  --border: var(--color-zinc-200);
  --border-strong: var(--color-zinc-300);
  --fg: var(--color-zinc-900);
  --fg-muted: var(--color-zinc-600);
  --fg-subtle: var(--color-zinc-500);
  --primary: var(--color-zinc-900);
  --primary-hover: var(--color-zinc-700);
  --primary-fg: var(--color-white);
  --ring: var(--color-zinc-500);

  --success: var(--color-emerald-700);
  --success-soft: var(--color-emerald-50);
  --danger: var(--color-red-700);
  --danger-soft: var(--color-red-50);
  --warning: var(--color-amber-800);
  --warning-soft: var(--color-amber-50);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: var(--color-zinc-950);
    --surface: var(--color-zinc-900);
    --surface-muted: var(--color-zinc-800);
    --border: var(--color-zinc-800);
    --border-strong: var(--color-zinc-700);
    --fg: var(--color-zinc-100);
    --fg-muted: var(--color-zinc-300);
    --fg-subtle: var(--color-zinc-400);
    --primary: var(--color-zinc-100);
    --primary-hover: var(--color-zinc-300);
    --primary-fg: var(--color-zinc-900);
    --ring: var(--color-zinc-400);

    --success: var(--color-emerald-300);
    --success-soft: var(--color-emerald-950);
    --danger: var(--color-red-300);
    --danger-soft: var(--color-red-950);
    --warning: var(--color-amber-200);
    --warning-soft: var(--color-amber-950);
  }
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-fg: var(--primary-fg);
  --color-ring: var(--ring);

  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-danger: var(--danger);
  --color-danger-soft: var(--danger-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

> 기존 `--foreground` 변수는 `--fg`로 바꿉니다. `body`의 `font-family: Arial ...`는 지우고 `font-sans`가 적용되게 합니다.

#### 사용 규칙

- 컴포넌트에서 `zinc-*`, `blue-*` 같은 팔레트 클래스를 직접 쓰지 않습니다. 필요한 역할이 없으면 토큰을 먼저 추가합니다.
- 글자 색은 배경과 짝을 맞춥니다: `bg-primary` 위에는 `text-primary-fg`, `bg-surface`·`bg-background` 위에는 `text-fg` / `text-fg-muted` / `text-fg-subtle`.
- 반투명이 필요하면 토큰에 투명도를 붙입니다 (예: `bg-surface/80`).
- 링크는 색을 바꾸지 않고 `text-fg underline underline-offset-4`로 구분합니다.

### 2.2 타이포그래피

한국어 가독성을 위해 줄 간격을 넉넉히 두고, 단어 중간에서 줄이 바뀌지 않도록 `break-keep`을 씁니다.

| 요소 | 클래스 |
|---|---|
| 페이지 제목 | `text-2xl font-bold tracking-tight text-fg` |
| 앱 이름 (헤더) | `text-base font-semibold text-fg` |
| 카드 제목 | `text-lg font-semibold leading-snug break-keep text-fg` |
| 카드 요약 | `text-[15px] leading-relaxed break-keep text-fg-muted` (예외적으로 허용하는 임의 값) |
| 버튼·탭 | `text-sm font-medium` |
| 메타·배지 | `text-xs text-fg-subtle` |

- 글꼴은 `font-sans`(Geist + 시스템 한글 글꼴)를 씁니다.
- 굵기는 `font-medium`, `font-semibold`, `font-bold` 세 가지만 씁니다.

### 2.3 간격·모서리·그림자

| 항목 | 값 |
|---|---|
| 페이지 좌우 여백 | `px-4 sm:px-6 lg:px-8` |
| 콘텐츠 최대 너비 | `mx-auto max-w-6xl` |
| 섹션 사이 간격 | `gap-6` |
| 카드 안쪽 여백 | `p-5` |
| 카드 사이 간격 | `gap-4 sm:gap-5` |
| 모서리 | 카드 `rounded-xl`, 버튼·입력창 `rounded-lg`, 탭·배지 `rounded-full` |
| 그림자 | 기본 `shadow-sm`, 카드 hover `hover:shadow-md` |

---

## 3. 화면 구조 (메인 대시보드)

로그인한 사용자가 `/`에 들어오면 대시보드를 봅니다.

```
┌──────────────────────────────────────────────────────────┐
│ AI 뉴스 수집기                 [Notion 연결됨 ●]  (사용자) │  ← 헤더 (h-14, sticky)
├──────────────────────────────────────────────────────────┤
│ 오늘의 AI 뉴스                    [재분류] [뉴스 가져오기] │  ← 툴바
│                                                          │
│ (전체) (LLM·모델) (투자·비즈니스) (정책·규제) … [+ 추가]  │  ← 카테고리 바
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│ │ 뉴스 카드 │ │ 뉴스 카드 │ │ 뉴스 카드 │                   │  ← 카드 그리드
│ └──────────┘ └──────────┘ └──────────┘                   │
└──────────────────────────────────────────────────────────┘
```

```tsx
<body className="min-h-full flex flex-col bg-background font-sans text-fg">
  <AppHeader />
  <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-6">
      {/* 툴바 → 카테고리 바 → 카드 그리드 */}
    </div>
  </main>
</body>
```

---

## 4. 컴포넌트

### 4.1 헤더

- 높이 `h-14`, 상단 고정 `sticky top-0 z-10`, 반투명 배경 `bg-surface/80 backdrop-blur`, 아래 테두리.
- 왼쪽에는 앱 이름 **"AI 뉴스 수집기"**, 오른쪽에는 Notion 연결 상태와 Clerk `<UserButton />`을 둡니다.
- Notion 상태 표시: 연결됐으면 성공 색 점과 워크스페이스 이름, 연결 안 됐으면 "Notion 연결" 보조 버튼을 보여줍니다.

```tsx
<header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
  <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <span className="text-base font-semibold text-fg">AI 뉴스 수집기</span>
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <span className="size-2 rounded-full bg-success" />
        내 워크스페이스
      </span>
      <UserButton />
    </div>
  </div>
</header>
```

### 4.2 툴바

- 왼쪽에 페이지 제목, 오른쪽에 버튼을 둡니다. 모바일에서는 위아래로 쌓습니다.
- "뉴스 가져오기"가 화면에서 **유일한 주요(Primary) 버튼**입니다. "재분류"는 보조(Secondary) 버튼입니다.

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h1 className="text-2xl font-bold tracking-tight text-fg">오늘의 AI 뉴스</h1>
  <div className="flex gap-2">
    <button className={secondaryButton}>재분류</button>
    <button className={primaryButton}>뉴스 가져오기</button>
  </div>
</div>
```

### 4.3 카테고리 바 (뉴스 카드 목록 위)

- 순서: **"전체"** → 사용자 카테고리(만든 순서대로) → 기사가 있을 때만 **"미분류"** → 맨 끝에 **"+ 카테고리 추가"** 버튼.
- 탭은 둥근 알약(pill) 모양입니다. 선택된 탭은 `bg-primary`로 채우고, 나머지는 `bg-surface`에 테두리만 둡니다.
- 탭 옆에 기사 수를 작게 표시합니다 (예: `LLM·모델 12`).
- 모바일에서는 줄바꿈하지 않고 가로로 스크롤합니다 (`overflow-x-auto`). 데스크톱(`sm` 이상)에서는 `flex-wrap`으로 줄바꿈합니다.
- 선택 상태는 URL 쿼리(`?category=<id>`)로 관리해 새로고침해도 유지되게 합니다.

```tsx
<nav aria-label="카테고리" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
  <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
    {/* 선택된 탭 */}
    <li>
      <a aria-current="page" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover">
        전체 <span className="text-xs opacity-70">42</span>
      </a>
    </li>
    {/* 선택 안 된 탭 */}
    <li>
      <a className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium text-fg-muted hover:border-border-strong hover:bg-surface-muted hover:text-fg">
        LLM·모델 <span className="text-xs text-fg-subtle">12</span>
      </a>
    </li>
    {/* … */}
    {/* 카테고리 추가 */}
    <li>
      <button className="inline-flex h-9 items-center gap-1 rounded-full border border-dashed border-border-strong px-4 text-sm font-medium text-fg-subtle hover:bg-surface-muted hover:text-fg">
        <span aria-hidden>+</span> 카테고리 추가
      </button>
    </li>
  </ul>
</nav>
```

**카테고리 추가 버튼 동작**

- **점선 테두리**로 일반 탭과 구분해, 필터가 아니라 "추가" 동작임을 보여줍니다.
- 누르면 작은 다이얼로그(`<dialog>` 또는 팝오버, `bg-surface`)를 열어 **이름(필수)**과 **설명(선택, "분류 기준 힌트")**을 입력받습니다.
- 이름이 비어 있거나 이미 있는 이름이면 입력창 아래에 `text-danger` 안내 문구를 보여줍니다 (예: "이미 있는 카테고리 이름이에요").
- 추가가 끝나면 새 탭이 "+ 카테고리 추가" 버튼 바로 앞에 나타납니다. 기존 기사를 새 기준으로 나누려면 "재분류"를 눌러야 한다고 안내합니다.

### 4.4 뉴스 카드 그리드

```tsx
<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
  <li><NewsCard /></li>
</ul>
```

| 화면 너비 | 열 수 |
|---|---|
| ~639px (모바일) | 1열 |
| 640px~ (`sm`) | 2열 |
| 1024px~ (`lg`) | 3열 |

### 4.5 뉴스 카드

카드 구성(위→아래): **카테고리 배지 · 출처 · 발행일** → **한국어 제목** → **요약** → **하단 동작(원문 보기, Notion 저장)**

```tsx
<article className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
  <div className="flex items-center gap-2 text-xs text-fg-subtle">
    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-medium text-fg-muted">
      LLM·모델
    </span>
    <span>TechCrunch</span>
    <span aria-hidden>·</span>
    <time dateTime="2026-11-16">11월 16일</time>
  </div>

  <h2 className="text-lg font-semibold leading-snug break-keep text-fg">
    한국어로 번역된 기사 제목
  </h2>

  <p className="line-clamp-4 text-[15px] leading-relaxed break-keep text-fg-muted">
    3~4문장 한국어 요약…
  </p>

  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
    <a href="…" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-fg underline-offset-4 hover:underline">
      원문 보기 <span aria-hidden>↗</span>
    </a>
    <button className={secondaryButtonSm}>Notion 저장</button>
  </div>
</article>
```

- 같은 줄의 카드 높이를 맞추려고 `h-full`과 `mt-auto`(하단 영역)를 씁니다.
- 요약은 `line-clamp-4`로 자릅니다. 원문은 링크로 이어집니다.
- 날짜는 `11월 16일` 형식으로 쓰고, 올해가 아니면 연도를 붙입니다 (`2025년 3월 2일`). 발행일이 없으면 날짜를 생략합니다.
- 카테고리가 없는(null) 기사는 배지에 "미분류"를 `border border-dashed border-border-strong bg-transparent text-fg-subtle`로 표시합니다.
- **Notion 저장 상태**
  - 기본: 작은 보조 버튼 "Notion 저장"
  - 저장 중: 버튼 비활성화 + "저장 중…"
  - 저장됨: 버튼 대신 `저장됨 ✓` 배지(`bg-success-soft text-success`)와 Notion 페이지 링크

### 4.6 버튼

| 종류 | 클래스 |
|---|---|
| Primary | `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50` |
| Secondary | `inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-surface-muted disabled:opacity-50` |
| Secondary (작게, 카드 안) | Secondary에서 `h-8 px-3`로 바꿉니다 |
| Danger (삭제) | Secondary에서 글자를 `text-danger`로, hover를 `hover:bg-danger-soft`로 바꿉니다 |

- 모든 버튼과 링크에 포커스 링을 넣습니다: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`.
- 오래 걸리는 동작(뉴스 가져오기, 재분류)은 실행 중에 버튼을 비활성화하고 문구를 바꿉니다 ("가져오는 중…", "분류하는 중…").
- 같은 클래스 묶음은 컴포넌트(`<Button variant="primary">`)나 상수로 한 곳에 모아 둡니다.

---

## 5. 상태 화면

| 상태 | 표시 방법 |
|---|---|
| 로딩 (카드 목록) | 카드 모양 스켈레톤 6개: `h-56 animate-pulse rounded-xl bg-surface-muted` |
| 빈 상태 (기사 없음) | 그리드 자리에 가운데 정렬로 "아직 뉴스가 없어요. '뉴스 가져오기'를 눌러보세요." + Primary 버튼 |
| 빈 상태 (선택한 카테고리에 기사 없음) | "이 카테고리에는 아직 기사가 없어요." + "전체 보기" 링크 |
| 부분 실패 (피드 하나 실패) | 툴바 아래 안내 띠 `rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning`: "The Verge 뉴스를 가져오지 못했어요. 나머지 뉴스는 정상적으로 가져왔어요." |
| 오류 | 안내 띠 `rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger` + "다시 시도" 버튼 |
| 완료 알림 | 화면 오른쪽 아래 토스트 3초 (`bg-primary text-primary-fg`): "새 기사 8건을 가져왔어요" |

빈 상태 예시:

```tsx
<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border-strong px-6 py-16 text-center">
  <p className="text-fg-muted">
    아직 뉴스가 없어요. &apos;뉴스 가져오기&apos;를 눌러보세요.
  </p>
  <button className={primaryButton}>뉴스 가져오기</button>
</div>
```

---

## 6. 접근성

- 카테고리 바는 `<nav aria-label="카테고리">`로 감싸고, 선택된 탭에 `aria-current="page"`를 붙입니다.
- 카드는 `<article>`, 카드 제목은 `<h2>`를 씁니다 (페이지 제목이 `<h1>`).
- 아이콘만 있는 버튼에는 `aria-label`을 붙입니다. 장식용 기호(`+`, `↗`, `·`)에는 `aria-hidden`을 붙입니다.
- 외부 링크는 `target="_blank" rel="noopener noreferrer"`로 엽니다.
- 텍스트 대비는 WCAG AA(4.5:1) 이상을 지킵니다. 가장 흐린 글자 역할인 `fg-subtle`(라이트 zinc-500, 다크 zinc-400)도 이 기준을 넘도록 정했으므로, 이보다 흐린 zinc 단계를 글자에 쓰지 않습니다.
- 색만으로 상태를 전달하지 않습니다. "저장됨"에는 ✓와 글자를, 선택된 탭에는 `aria-current`를 함께 씁니다.
- 클릭 영역은 최소 높이 32px(`h-8`) 이상으로 합니다.

---

## 7. 체크리스트

새 화면이나 컴포넌트를 만들 때 확인합니다.

- [ ] 색은 역할 토큰(`bg-surface`, `text-fg-muted` 등)으로만 썼고, `zinc-*` 같은 팔레트 클래스나 `dark:` 색 클래스를 직접 쓰지 않았다
- [ ] 상태 색(success·danger·warning)은 상태 표시에만 썼다
- [ ] 2장의 토큰 밖 임의 값을 쓰지 않았다
- [ ] 한국어 본문에 `break-keep`과 넉넉한 줄 간격을 적용했다
- [ ] 모바일(375px)에서 가로 스크롤이 생기지 않는다 (카테고리 바는 예외)
- [ ] 로딩, 빈 상태, 오류 상태를 모두 만들었다
- [ ] 버튼과 링크에 포커스 표시가 보인다
- [ ] 화면 문구가 모두 한국어다

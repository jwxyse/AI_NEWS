"use client";

import { useSearchParams } from "next/navigation";

import { focusRing } from "@/components/ui/button-styles";
import type { DashboardArticle, DashboardCategory } from "@/db/queries";

import { CategoryBar, UNCATEGORIZED, categoryHref } from "./category-bar";
import { FetchNewsButton } from "./fetch-news";
import { NewsCard } from "./news-card";
import { Pagination } from "./pagination";

// 데스크톱 3열 기준 3줄
const PAGE_SIZE = 9;

// 카테고리 바 + 카드 목록. 기사는 서버에서 한 번에 받아 오고, 필터는 브라우저에서 바로 처리한다.
export function DashboardView({
  categories,
  articles,
  now,
}: {
  categories: DashboardCategory[];
  articles: DashboardArticle[];
  now: Date;
}) {
  // 탭 클릭은 history.pushState 로 주소만 바꾸고, Next.js 가 useSearchParams 를 갱신해 준다.
  const searchParams = useSearchParams();

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const counts = new Map<string, number>();
  let uncategorizedCount = 0;
  for (const a of articles) {
    // 다른 사용자의 카테고리 ID가 섞이는 일이 없도록 내 카테고리만 센다.
    if (a.categoryId && categoryNames.has(a.categoryId)) {
      counts.set(a.categoryId, (counts.get(a.categoryId) ?? 0) + 1);
    } else {
      uncategorizedCount++;
    }
  }

  // 알 수 없는 카테고리 값이면 "전체"로 본다.
  const raw = searchParams.get("category");
  const selected =
    raw === UNCATEGORIZED || (raw && categoryNames.has(raw)) ? raw : null;

  const categoryOf = (a: DashboardArticle) =>
    a.categoryId && categoryNames.has(a.categoryId) ? a.categoryId : null;

  const visible =
    selected === null
      ? articles
      : selected === UNCATEGORIZED
        ? articles.filter((a) => categoryOf(a) === null)
        : articles.filter((a) => categoryOf(a) === selected);

  // 페이지 번호가 잘못됐거나 범위를 넘으면 가까운 페이지로 맞춘다.
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const requested = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(requested) ? 1 : Math.min(Math.max(requested, 1), totalPages);
  const pageArticles = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <CategoryBar
        categories={categories}
        counts={counts}
        total={articles.length}
        uncategorizedCount={uncategorizedCount}
        selected={selected}
        showCounts={articles.length > 0}
      />

      {articles.length === 0 ? (
        <NoArticles />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center">
          <p className="text-fg-muted break-keep">이 카테고리에는 아직 기사가 없어요.</p>
          <a
            href={categoryHref(null)}
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", categoryHref(null));
            }}
            className={`rounded text-sm font-medium text-fg underline underline-offset-4 ${focusRing}`}
          >
            전체 보기
          </a>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {pageArticles.map((article) => {
              const id = categoryOf(article);
              return (
                <li key={article.id}>
                  <NewsCard
                    article={article}
                    categoryName={id ? (categoryNames.get(id) ?? null) : null}
                    now={now}
                  />
                </li>
              );
            })}
          </ul>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefFor={(p) => categoryHref(selected, p)}
          />
        </>
      )}
    </>
  );
}

// 기사가 하나도 없을 때 (ui.md 5)
function NoArticles() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border-strong px-6 py-14 text-center sm:py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-fg-subtle">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
        >
          <path d="M4 5h13a1 1 0 0 1 1 1v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5Z" />
          <path d="M18 9h1a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2" />
          <path d="M8 9h6M8 13h6M8 17h4" />
        </svg>
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-fg">아직 수집된 뉴스가 없어요</h2>
        <p className="text-sm leading-relaxed text-fg-muted break-keep">
          {/* TODO: Claude 요약(FR-3) 구현 후 "한국어로 요약해" 문구로 되돌리기 */}
          &apos;뉴스 가져오기&apos;를 누르면 TechCrunch와 The Verge에 최근 24시간 동안 올라온
          AI 뉴스를 가져와요.
        </p>
      </div>
      <FetchNewsButton />
    </div>
  );
}

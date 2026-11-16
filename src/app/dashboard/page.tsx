import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";

import { primaryButton, secondaryButton } from "@/components/ui/button-styles";
import { getArticles, getCategoriesWithDefaults } from "@/db/queries";

import { CategoryBar, UNCATEGORIZED } from "./category-bar";
import { NewsCard } from "./news-card";

export const metadata: Metadata = {
  title: "대시보드 | AI 뉴스 수집기",
};

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <Toolbar />
        {/* 로그인 사용자와 쿼리스트링을 읽으므로 요청 시점에 렌더링 (cacheComponents) */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

function Toolbar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold tracking-tight text-fg">오늘의 AI 뉴스</h1>
      <div className="flex gap-2">
        {/* TODO: 재분류(FR-7), 뉴스 가져오기(FR-2) 구현 후 활성화 */}
        <button type="button" disabled title="준비 중이에요" className={secondaryButton}>
          재분류
        </button>
        <button type="button" disabled title="준비 중이에요" className={primaryButton}>
          뉴스 가져오기
        </button>
      </div>
    </div>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const { userId } = await auth();
  // proxy가 이미 막지만, 데이터 접근 전에 한 번 더 확인한다.
  if (!userId) redirect("/");

  const [categories, articles, params] = await Promise.all([
    getCategoriesWithDefaults(userId),
    getArticles(userId),
    searchParams,
  ]);

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const counts = new Map<string, number>();
  let uncategorizedCount = 0;
  for (const a of articles) {
    if (a.categoryId) counts.set(a.categoryId, (counts.get(a.categoryId) ?? 0) + 1);
    else uncategorizedCount++;
  }

  // 알 수 없는 카테고리 값이면 "전체"로 본다.
  const raw = typeof params.category === "string" ? params.category : null;
  const selected =
    raw === UNCATEGORIZED || (raw && categoryNames.has(raw)) ? raw : null;

  const visible =
    selected === null
      ? articles
      : selected === UNCATEGORIZED
        ? articles.filter((a) => a.categoryId === null)
        : articles.filter((a) => a.categoryId === selected);

  const now = new Date();

  return (
    <>
      <CategoryBar
        categories={categories}
        counts={counts}
        total={articles.length}
        uncategorizedCount={uncategorizedCount}
        selected={selected}
      />

      {articles.length === 0 ? (
        <EmptyState>
          아직 뉴스가 없어요. &apos;뉴스 가져오기&apos;를 눌러보세요.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>
          이 카테고리에는 아직 기사가 없어요.{" "}
          <Link href="/dashboard" scroll={false} className="font-medium text-fg underline underline-offset-4">
            전체 보기
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {visible.map((article) => (
            <li key={article.id}>
              <NewsCard
                article={article}
                categoryName={article.categoryId ? (categoryNames.get(article.categoryId) ?? null) : null}
                now={now}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border-strong px-6 py-16 text-center">
      <p className="text-fg-muted break-keep">{children}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="뉴스를 불러오는 중">
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-surface-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}

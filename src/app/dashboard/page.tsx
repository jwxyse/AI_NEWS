import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";

import { primaryButton, secondaryButton } from "@/components/ui/button-styles";
import { getArticles, getCategoriesWithDefaults } from "@/db/queries";

import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "대시보드 | AI 뉴스 수집기",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-6">
        <Toolbar />
        {/* 로그인 사용자를 읽으므로 요청 시점에 렌더링 (cacheComponents) */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
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
        <button
          type="button"
          disabled
          title="준비 중이에요"
          className={`${secondaryButton} flex-1 sm:flex-none`}
        >
          재분류
        </button>
        <button
          type="button"
          disabled
          title="준비 중이에요"
          className={`${primaryButton} flex-1 sm:flex-none`}
        >
          뉴스 가져오기
        </button>
      </div>
    </div>
  );
}

async function DashboardContent() {
  const { userId } = await auth();
  // proxy가 이미 막지만, 데이터 접근 전에 한 번 더 확인한다.
  if (!userId) redirect("/");

  const [categories, articles] = await Promise.all([
    getCategoriesWithDefaults(userId),
    getArticles(userId),
  ]);

  // 카테고리 필터는 클라이언트에서 처리한다 (탭 전환 시 서버 왕복 없음).
  return <DashboardView categories={categories} articles={articles} now={new Date()} />;
}

// 실제 카테고리 바·카드 구조를 본뜬 로딩 화면 (ui.md 5)
function DashboardSkeleton() {
  const tabWidths = ["w-16", "w-24", "w-28", "w-20", "w-24", "w-14"];
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">뉴스를 불러오는 중이에요</span>
      <div aria-hidden className="flex gap-2 overflow-hidden">
        {tabWidths.map((w, i) => (
          <div key={i} className={`h-9 shrink-0 animate-pulse rounded-full bg-surface-muted ${w}`} />
        ))}
      </div>
      <ul aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex animate-pulse flex-col gap-3">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-surface-muted" />
                <div className="h-5 w-24 rounded-full bg-surface-muted" />
              </div>
              <div className="flex flex-col gap-2 py-1">
                <div className="h-5 w-full rounded bg-surface-muted" />
                <div className="h-5 w-2/3 rounded bg-surface-muted" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-full rounded bg-surface-muted" />
                <div className="h-4 w-full rounded bg-surface-muted" />
                <div className="h-4 w-full rounded bg-surface-muted" />
                <div className="h-4 w-1/2 rounded bg-surface-muted" />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="h-4 w-20 rounded bg-surface-muted" />
                <div className="h-10 w-24 rounded-lg bg-surface-muted sm:h-8" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

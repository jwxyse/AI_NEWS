"use client";

import { useEffect, useRef, useState } from "react";

import { focusRing } from "@/components/ui/button-styles";
import type { DashboardCategory } from "@/db/queries";

import { AddCategoryButton } from "./add-category-button";

export const UNCATEGORIZED = "uncategorized";

// 카테고리를 바꾸면 페이지는 1로 돌아간다 (page 파라미터를 빼고 만든다).
export function categoryHref(key: string | null, page = 1) {
  const params = new URLSearchParams();
  if (key) params.set("category", key);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

type Tab = { key: string | null; label: string; count: number };

const tabBase = `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${focusRing}`;
const tabSelected = `${tabBase} bg-primary text-primary-fg hover:bg-primary-hover`;
const tabIdle = `${tabBase} border border-border bg-surface text-fg-muted hover:border-border-strong hover:bg-surface-muted hover:text-fg`;

// 뉴스 카드 목록 위의 카테고리 필터 (ui.md 4.3)
export function CategoryBar({
  categories,
  counts,
  total,
  uncategorizedCount,
  selected,
  showCounts,
}: {
  categories: DashboardCategory[];
  counts: Map<string, number>;
  total: number;
  uncategorizedCount: number;
  selected: string | null;
  showCounts: boolean;
}) {
  const tabs: Tab[] = [
    { key: null, label: "전체", count: total },
    ...categories.map((c) => ({ key: c.id, label: c.name, count: counts.get(c.id) ?? 0 })),
  ];
  if (uncategorizedCount > 0) {
    tabs.push({ key: UNCATEGORIZED, label: "미분류", count: uncategorizedCount });
  }

  const scrollerRef = useRef<HTMLElement>(null);
  const selectedRef = useRef<HTMLAnchorElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  // 모바일 가로 스크롤: 양 끝에 더 있는지 그라데이션으로 알려 준다.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () =>
      setFade({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [tabs.length]);

  // 처음 열 때 선택된 탭이 화면 밖에 있으면 보이도록 가로로만 스크롤한다.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const tab = selectedRef.current;
    if (!scroller || !tab) return;
    if (tab.offsetLeft + tab.offsetWidth > scroller.clientWidth) {
      scroller.scrollLeft = tab.offsetLeft - scroller.clientWidth / 2 + tab.offsetWidth / 2;
    }
    // 첫 렌더 때만 실행한다. 이후에는 사용자가 직접 누른 탭이므로 이미 보인다.
  }, []);

  function select(e: React.MouseEvent<HTMLAnchorElement>, key: string | null) {
    // 새 탭 열기(⌘/Ctrl/가운데 클릭)는 브라우저 기본 동작에 맡긴다.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.history.pushState(null, "", categoryHref(key));
  }

  return (
    <div className="relative -mx-4 sm:mx-0">
      <nav
        ref={scrollerRef}
        aria-label="카테고리"
        className="relative overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {tabs.map((tab) => {
            const isSelected = tab.key === selected;
            return (
              <li key={tab.key ?? "all"}>
                <a
                  ref={isSelected ? selectedRef : undefined}
                  href={categoryHref(tab.key)}
                  onClick={(e) => select(e, tab.key)}
                  aria-current={isSelected ? "page" : undefined}
                  className={isSelected ? tabSelected : tabIdle}
                >
                  {tab.label}
                  {showCounts && (
                    <span className={isSelected ? "text-xs opacity-70" : "text-xs text-fg-subtle"}>
                      {tab.count}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
          <li>
            <AddCategoryButton />
          </li>
        </ul>
      </nav>

      {/* 스크롤 힌트 (모바일에서만 생긴다. sm 이상은 줄바꿈이라 스크롤이 없다) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-background to-transparent transition-opacity ${fade.left ? "opacity-100" : "opacity-0"}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent transition-opacity ${fade.right ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

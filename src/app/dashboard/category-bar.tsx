import Link from "next/link";

import { focusRing } from "@/components/ui/button-styles";
import type { DashboardCategory } from "@/db/queries";

import { AddCategoryButton } from "./add-category-button";

export const UNCATEGORIZED = "uncategorized";

type Tab = { key: string; label: string; href: string; count: number };

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
}: {
  categories: DashboardCategory[];
  counts: Map<string, number>;
  total: number;
  uncategorizedCount: number;
  selected: string | null;
}) {
  const tabs: Tab[] = [
    { key: "all", label: "전체", href: "/dashboard", count: total },
    ...categories.map((c) => ({
      key: c.id,
      label: c.name,
      href: `/dashboard?category=${c.id}`,
      count: counts.get(c.id) ?? 0,
    })),
  ];
  if (uncategorizedCount > 0) {
    tabs.push({
      key: UNCATEGORIZED,
      label: "미분류",
      href: `/dashboard?category=${UNCATEGORIZED}`,
      count: uncategorizedCount,
    });
  }

  const selectedKey = selected ?? "all";

  return (
    <nav aria-label="카테고리" className="-mx-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {tabs.map((tab) => {
          const isSelected = tab.key === selectedKey;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                scroll={false}
                aria-current={isSelected ? "page" : undefined}
                className={isSelected ? tabSelected : tabIdle}
              >
                {tab.label}
                <span className={isSelected ? "text-xs opacity-70" : "text-xs text-fg-subtle"}>
                  {tab.count}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <AddCategoryButton />
        </li>
      </ul>
    </nav>
  );
}

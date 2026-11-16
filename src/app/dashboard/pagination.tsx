"use client";

import { focusRing } from "@/components/ui/button-styles";

// 현재 페이지 앞뒤로 보여 줄 페이지 수
const SIBLINGS = 2;

const itemBase = `inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${focusRing}`;
const itemIdle = `${itemBase} border border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg`;
const itemSelected = `${itemBase} bg-primary text-primary-fg`;
const itemDisabled = `${itemBase} border border-border bg-surface text-fg-subtle opacity-50`;

// 첫·마지막 페이지는 항상, 현재 페이지는 앞뒤 2페이지씩 보여 준다.
// 사이에 빠진 번호가 있을 때만 "…"을 넣는다. 예(100쪽 중 50쪽): 1 … 48 49 50 51 52 … 100
export function pageItems(current: number, total: number): (number | "gap")[] {
  const start = Math.max(1, current - SIBLINGS);
  const end = Math.min(total, current + SIBLINGS);
  const items: (number | "gap")[] = [];

  if (start > 1) {
    items.push(1);
    if (start > 2) items.push("gap");
  }
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total) {
    if (end < total - 1) items.push("gap");
    items.push(total);
  }
  return items;
}

// [처음][이전] / [다음][끝] 버튼. 모바일에서는 기호만 보여 준다.
function NavButton({
  href,
  onClick,
  disabled,
  label,
  symbol,
}: {
  href: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  disabled: boolean;
  label: string;
  symbol: string;
}) {
  const content = (
    <>
      <span aria-hidden className="sm:hidden">
        {symbol}
      </span>
      <span className="sr-only sm:not-sr-only">{label}</span>
    </>
  );
  if (disabled) {
    return (
      <span aria-disabled="true" className={itemDisabled}>
        {content}
      </span>
    );
  }
  return (
    <a href={href} onClick={onClick} className={itemIdle}>
      {content}
    </a>
  );
}

// 카드 그리드 아래 페이지 이동. 탭과 마찬가지로 주소만 바꾸고(pushState) 화면은 클라이언트에서 다시 그린다.
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  function go(e: React.MouseEvent<HTMLAnchorElement>, target: number) {
    // 새 탭 열기(⌘/Ctrl/가운데 클릭)는 브라우저 기본 동작에 맡긴다.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.history.pushState(null, "", hrefFor(target));
    window.scrollTo({ top: 0 });
  }

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav aria-label="페이지" className="flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          <NavButton href={hrefFor(1)} onClick={(e) => go(e, 1)} disabled={isFirst} label="처음" symbol="«" />
        </li>
        <li>
          <NavButton href={hrefFor(page - 1)} onClick={(e) => go(e, page - 1)} disabled={isFirst} label="이전" symbol="‹" />
        </li>

        {pageItems(page, totalPages).map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-sm text-fg-subtle">
              …
            </li>
          ) : (
            <li key={item}>
              <a
                href={hrefFor(item)}
                onClick={(e) => go(e, item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`${item}페이지`}
                className={item === page ? itemSelected : itemIdle}
              >
                {item}
              </a>
            </li>
          ),
        )}

        <li>
          <NavButton href={hrefFor(page + 1)} onClick={(e) => go(e, page + 1)} disabled={isLast} label="다음" symbol="›" />
        </li>
        <li>
          <NavButton href={hrefFor(totalPages)} onClick={(e) => go(e, totalPages)} disabled={isLast} label="끝" symbol="»" />
        </li>
      </ul>
    </nav>
  );
}

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

import { focusRing } from "@/components/ui/button-styles";

// ui.md 4.1 헤더. Notion 연결 상태는 FR-8 구현 때 오른쪽에 추가한다.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className={`rounded text-base font-semibold text-fg ${focusRing}`}>
          AI 뉴스 수집기
        </Link>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}

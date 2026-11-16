"use client";

import { createContext, use, useActionState, useEffect, useState } from "react";

import { primaryButton } from "@/components/ui/button-styles";
import type { ArticleSource } from "@/db/schema";

import { fetchNews, type FetchNewsState } from "./actions";

const SOURCE_LABELS: Record<ArticleSource, string> = {
  techcrunch: "TechCrunch",
  the_verge: "The Verge",
};

const TOAST_MS = 3000;

type FetchNewsContextValue = {
  state: FetchNewsState;
  action: (formData: FormData) => void;
  pending: boolean;
};

const FetchNewsContext = createContext<FetchNewsContextValue | null>(null);

function useFetchNews() {
  const ctx = use(FetchNewsContext);
  if (!ctx) throw new Error("FetchNewsProvider 안에서만 쓸 수 있어요.");
  return ctx;
}

// 툴바 버튼과 빈 상태 버튼이 같은 진행 상태·결과를 함께 쓰도록 한 곳에서 관리한다.
export function FetchNewsProvider({ children }: { children: React.ReactNode }) {
  const [state, action, pending] = useActionState(fetchNews, { ok: false });
  return <FetchNewsContext value={{ state, action, pending }}>{children}</FetchNewsContext>;
}

// "뉴스 가져오기" 버튼 (ui.md 4.6: 실행 중에는 비활성화하고 문구를 바꾼다)
export function FetchNewsButton({
  className = "",
  label = "뉴스 가져오기",
}: {
  className?: string;
  label?: string;
}) {
  const { action, pending } = useFetchNews();
  return (
    <form action={action} className={className}>
      <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
        {pending ? "가져오는 중…" : label}
      </button>
    </form>
  );
}

// 툴바 아래 안내 띠(부분 실패·오류)와 오른쪽 아래 완료 토스트 (ui.md 5)
export function FetchNewsFeedback() {
  const { state, pending } = useFetchNews();
  // 결과마다 새 객체가 오므로, 토스트를 닫은 결과를 기억해 두고 다음 결과가 오면 다시 띄운다.
  const [dismissed, setDismissed] = useState<FetchNewsState | null>(null);
  const showToast = state.ok && !pending && dismissed !== state;

  useEffect(() => {
    if (!state.ok) return;
    const timer = setTimeout(() => setDismissed(state), TOAST_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const toast = showToast
    ? state.newCount
      ? `새 기사 ${state.newCount}건을 가져왔어요`
      : "새로 올라온 기사가 없어요"
    : null;

  const failedNames = (state.failedSources ?? []).map((s) => SOURCE_LABELS[s] ?? s).join(", ");

  return (
    <>
      {!pending && state.error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger break-keep sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{state.error}</p>
          <FetchNewsButton label="다시 시도" className="shrink-0" />
        </div>
      )}

      {!pending && state.ok && failedNames && (
        <p role="status" className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning break-keep">
          {failedNames} 뉴스를 가져오지 못했어요. 나머지 뉴스는 정상적으로 가져왔어요.
        </p>
      )}

      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
        {toast && (
          <p className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-fg shadow-md">
            {toast}
          </p>
        )}
      </div>
    </>
  );
}

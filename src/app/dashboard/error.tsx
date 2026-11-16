"use client"; // Error boundary는 클라이언트 컴포넌트여야 한다.

import { useEffect } from "react";

import { secondaryButton } from "@/components/ui/button-styles";

// 대시보드 데이터를 불러오다 실패했을 때 (ui.md 5 오류 상태)
export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-lg bg-danger-soft px-4 py-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <p className="font-semibold">뉴스를 불러오지 못했어요.</p>
          <p className="leading-relaxed break-keep">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 인터넷 연결을 확인해 주세요.
          </p>
        </div>
        <button type="button" onClick={() => retry()} className={`${secondaryButton} shrink-0`}>
          다시 시도
        </button>
      </div>
    </main>
  );
}

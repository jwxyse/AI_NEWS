"use client";

import { useState, useTransition } from "react";

import { focusRing, secondaryButtonSm } from "@/components/ui/button-styles";

import { saveToNotion } from "./actions";

// 카드 하단 "뉴스 저장" 버튼 (ui.md 4.5: 기본 → 저장 중… → 저장됨 ✓ 배지 + Notion 페이지 링크)
export function SaveNewsButton({
  articleId,
  notionPageUrl,
}: {
  articleId: string;
  notionPageUrl: string | null;
}) {
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const url = notionPageUrl ?? savedUrl;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Notion에서 열기"
        className={`inline-flex h-10 items-center gap-1 rounded-full bg-success-soft px-3 text-xs font-medium text-success hover:underline sm:h-8 ${focusRing}`}
      >
        저장됨 <span aria-hidden>✓</span>
      </a>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await saveToNotion(articleId);
      if (result.ok && result.notionPageUrl) setSavedUrl(result.notionPageUrl);
      else setError(result.error ?? "Notion에 저장하지 못했어요. 다시 시도해 주세요.");
    });
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {error && (
        <p role="alert" className="text-right text-xs leading-snug text-danger break-keep">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`${secondaryButtonSm} shrink-0`}
      >
        {pending ? "저장 중…" : error ? "다시 시도" : "뉴스 저장"}
      </button>
    </div>
  );
}

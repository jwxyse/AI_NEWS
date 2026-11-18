import { focusRing } from "@/components/ui/button-styles";
import type { DashboardArticle } from "@/db/queries";
import type { ArticleSource } from "@/db/schema";

import { SaveNewsButton } from "./save-news-button";

const SOURCE_LABELS: Record<ArticleSource, string> = {
  techcrunch: "TechCrunch",
  the_verge: "The Verge",
};

const TIME_ZONE = "Asia/Seoul";
const yearFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", timeZone: TIME_ZONE });
const shortDate = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  timeZone: TIME_ZONE,
});
const longDate = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: TIME_ZONE,
});

// 올해 기사는 "11월 16일", 지난해 기사는 "2025년 3월 2일" (ui.md 4.5)
function formatDate(date: Date, now: Date) {
  return yearFormat.format(date) === yearFormat.format(now)
    ? shortDate.format(date)
    : longDate.format(date);
}

export function NewsCard({
  article,
  categoryName,
  now,
}: {
  article: DashboardArticle;
  categoryName: string | null;
  now: Date;
}) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
        {categoryName ? (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-medium text-fg-muted">
            {categoryName}
          </span>
        ) : (
          <span className="rounded-full border border-dashed border-border-strong px-2.5 py-0.5 font-medium">
            미분류
          </span>
        )}
        <span>{SOURCE_LABELS[article.source] ?? article.source}</span>
        {article.publishedAt && (
          <>
            <span aria-hidden>·</span>
            <time dateTime={article.publishedAt.toISOString()}>
              {formatDate(article.publishedAt, now)}
            </time>
          </>
        )}
      </div>

      {/* 모바일에서 가장 누르기 쉬운 제목을 원문 링크로 쓴다. 긴 영어 단어는 wrap-anywhere 로 줄바꿈. */}
      <h2 className="text-lg font-semibold leading-snug break-keep wrap-anywhere text-fg">
        <a
          href={article.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded hover:underline underline-offset-4 ${focusRing}`}
        >
          {article.titleKo}
        </a>
      </h2>

      <p className="line-clamp-4 text-[15px] leading-relaxed break-keep wrap-anywhere text-fg-muted">
        {article.summaryKo}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
        <a
          href={article.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`-ml-2 inline-flex h-10 items-center rounded-lg px-2 text-sm font-medium text-fg underline-offset-4 hover:underline sm:h-8 ${focusRing}`}
        >
          원문 보기 <span aria-hidden>&nbsp;↗</span>
        </a>

        <SaveNewsButton articleId={article.id} notionPageUrl={article.notionPageUrl} />
      </div>
    </article>
  );
}

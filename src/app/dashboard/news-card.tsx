import { focusRing, secondaryButtonSm } from "@/components/ui/button-styles";
import type { DashboardArticle } from "@/db/queries";
import type { ArticleSource } from "@/db/schema";

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

      <h2 className="text-lg font-semibold leading-snug break-keep text-fg">
        {article.titleKo}
      </h2>

      <p className="line-clamp-4 text-[15px] leading-relaxed break-keep text-fg-muted">
        {article.summaryKo}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
        <a
          href={article.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded text-sm font-medium text-fg underline-offset-4 hover:underline ${focusRing}`}
        >
          원문 보기 <span aria-hidden>↗</span>
        </a>

        {article.notionPageUrl ? (
          <a
            href={article.notionPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-8 items-center gap-1 rounded-full bg-success-soft px-3 text-xs font-medium text-success hover:underline ${focusRing}`}
          >
            저장됨 <span aria-hidden>✓</span>
          </a>
        ) : (
          // TODO: Notion 저장 (FR-9) 구현 후 활성화
          <button type="button" disabled title="준비 중이에요" className={secondaryButtonSm}>
            Notion 저장
          </button>
        )}
      </div>
    </article>
  );
}

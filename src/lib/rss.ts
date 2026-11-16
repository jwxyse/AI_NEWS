import "server-only";

import Parser from "rss-parser";

import type { ArticleSource, NewArticle } from "@/db/schema";

// PRD FR-2 수집 대상 피드
const FEEDS: { source: ArticleSource; url: string }[] = [
  { source: "techcrunch", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { source: "the_verge", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
];

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SUMMARY_LENGTH = 500;
// 원문 페이지를 못 받아올 때 Claude 요약 입력으로 쓰는 RSS 발췌 길이
const MAX_EXCERPT_LENGTH = 3000;

// The Verge(Atom)는 작성자를 item.author 로 준다. 기본 Item 타입에 없어서 추가한다.
type FeedItem = { author?: string };

const parser = new Parser<Record<string, never>, FeedItem>({
  timeout: 10_000,
  headers: { "User-Agent": "ai-news-collector/1.0" },
});

export type CollectResult = {
  items: NewArticle[];
  failedSources: ArticleSource[];
  // 모든 피드가 실패했으면 true
  allFailed: boolean;
};

// 모든 피드에서 최근 24시간 안에 발행된 기사를 모은다.
// 피드 하나가 실패해도 나머지 결과는 돌려주고, 실패한 피드는 failedSources 에 담는다.
export async function collectRecentArticles(now = new Date()): Promise<CollectResult> {
  const since = now.getTime() - WINDOW_MS;
  const results = await Promise.allSettled(FEEDS.map((feed) => parser.parseURL(feed.url)));

  // 정규화한 URL 기준으로 같은 기사는 하나만 남긴다.
  const byUrl = new Map<string, NewArticle>();
  const failedSources: ArticleSource[] = [];

  results.forEach((result, i) => {
    const { source } = FEEDS[i];
    if (result.status === "rejected") {
      console.error(`[rss] ${source} 피드 수집 실패`, result.reason);
      failedSources.push(source);
      return;
    }

    for (const item of result.value.items) {
      const article = toArticle(source, item, since);
      if (article && !byUrl.has(article.originalUrl)) {
        byUrl.set(article.originalUrl, article);
      }
    }
  });

  return {
    items: [...byUrl.values()],
    failedSources,
    allFailed: failedSources.length === FEEDS.length,
  };
}

function toArticle(
  source: ArticleSource,
  item: Parser.Item & FeedItem,
  since: number,
): NewArticle | null {
  const originalUrl = item.link ? normalizeUrl(item.link) : null;
  const title = cleanText(item.title ?? "");
  if (!originalUrl || !title) return null;

  // 발행일이 없거나 24시간보다 오래된 기사는 뺀다.
  const publishedAt = item.isoDate ? new Date(item.isoDate) : null;
  if (!publishedAt || Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() < since) {
    return null;
  }

  const excerpt = cleanText(item.contentSnippet ?? item.summary ?? "");
  const author = cleanText(item.creator ?? item.author ?? "") || null;

  return {
    source,
    originalUrl,
    originalTitle: title,
    author,
    originalExcerpt: truncate(excerpt, MAX_EXCERPT_LENGTH) || null,
    // Claude 번역·요약(summarizedAt)이 끝나기 전까지는 원문 제목·발췌를 임시로 보여준다.
    titleKo: title,
    summaryKo: truncate(excerpt, MAX_SUMMARY_LENGTH),
    publishedAt,
  };
}

// 같은 기사가 다른 URL로 들어오지 않도록 hash·utm_* 쿼리·끝 슬래시를 정리한다.
export function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

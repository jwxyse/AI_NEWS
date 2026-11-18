import "server-only";

import type { ArticleSource } from "@/db/schema";

// Notion REST API로 .env.local 의 NOTION_DATABASE_ID 데이터베이스("AI 뉴스 북마크")에 기사를 페이지로 저장한다.
// 데이터베이스 속성: 제목(title), 텍스트(text), 카테고리(select), 출처(select), 발행일(date), 원문링크(url)
// Internal integration(NOTION_API_KEY)이 Notion에서 이 데이터베이스에 연결(공유)되어 있어야 한다.

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";
// rich_text 한 덩어리의 최대 길이
const MAX_TEXT = 2000;

const SOURCE_LABELS: Record<ArticleSource, string> = {
  techcrunch: "TechCrunch",
  the_verge: "The Verge",
};

export class NotionError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function getConfig() {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new NotionError("NOTION_API_KEY 또는 NOTION_DATABASE_ID 환경 변수가 없습니다.");
  }
  return { token, databaseId };
}

async function notionFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = getConfig();
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new NotionError(`Notion API ${res.status} ${path}: ${body.slice(0, 500)}`, res.status);
  }
  return res.json() as Promise<T>;
}

// API 2025-09-03부터 페이지의 부모는 database가 아니라 data source다. 서버 프로세스 동안 한 번만 조회한다.
let dataSourceIdPromise: Promise<string> | null = null;

function getDataSourceId() {
  dataSourceIdPromise ??= notionFetch<{ data_sources?: { id: string }[] }>(
    `/databases/${getConfig().databaseId}`,
  )
    .then((db) => {
      const id = db.data_sources?.[0]?.id;
      if (!id) throw new NotionError("데이터베이스에서 data source를 찾지 못했습니다.");
      return id;
    })
    .catch((err) => {
      dataSourceIdPromise = null; // 실패는 캐시하지 않는다
      throw err;
    });
  return dataSourceIdPromise;
}

export type NotionArticle = {
  titleKo: string;
  summaryKo: string;
  categoryName: string | null;
  source: ArticleSource;
  publishedAt: Date | null;
  originalUrl: string;
};

const text = (content: string) => [{ type: "text", text: { content: content.slice(0, MAX_TEXT) } }];

// 기사를 Notion 페이지로 만들고 페이지 URL을 돌려준다.
export async function createNotionPage(article: NotionArticle): Promise<string> {
  const dataSourceId = await getDataSourceId();

  const properties: Record<string, unknown> = {
    제목: { title: text(article.titleKo) },
    텍스트: { rich_text: text(article.summaryKo) },
    출처: { select: { name: SOURCE_LABELS[article.source] ?? article.source } },
    원문링크: { url: article.originalUrl },
    카테고리: { select: { name: article.categoryName ?? "미분류" } },
  };
  if (article.publishedAt) {
    properties["발행일"] = { date: { start: article.publishedAt.toISOString() } };
  }

  const page = await notionFetch<{ url: string }>("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties,
      // 페이지 본문에도 요약을 넣어 열었을 때 바로 읽을 수 있게 한다.
      children: [
        { object: "block", type: "paragraph", paragraph: { rich_text: text(article.summaryKo) } },
        { object: "block", type: "bookmark", bookmark: { url: article.originalUrl } },
      ],
    }),
  });
  return page.url;
}

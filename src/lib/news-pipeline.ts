import "server-only";

import {
  getCategoriesWithDefaults,
  getClassifyCategories,
  getPendingSummaries,
  getUnclassifiedArticles,
  insertArticles,
  saveSummary,
  upsertUserCategories,
} from "@/db/queries";
import type { ArticleSource } from "@/db/schema";
import { classifyArticles } from "@/lib/ai/classify";
import { summarizeArticle } from "@/lib/ai/summarize";
import { fetchArticleText } from "@/lib/article-content";
import { collectRecentArticles } from "@/lib/rss";

// 한 번의 "뉴스 가져오기"에서 처리하는 상한. 남은 기사는 다음 요청에서 이어서 처리한다.
const MAX_SUMMARIES_PER_RUN = 30;
const SUMMARY_CONCURRENCY = 4;
const MAX_CLASSIFY_PER_RUN = 100;
const CLASSIFY_BATCH_SIZE = 20;

export type PipelineResult = {
  allFailed: boolean;
  failedSources: ArticleSource[];
  newCount: number;
  summarizedCount: number;
  summaryFailedCount: number;
  classifiedCount: number;
  classifyFailed: boolean;
};

// 수집 → 저장 → 번역·요약(공통) → 분류(이 사용자) 순서로 실행한다.
// 요약·분류는 일부가 실패해도 나머지 결과를 저장하고, 실패한 기사는 다음 요청 때 다시 처리된다.
export async function runNewsPipeline(userId: string): Promise<PipelineResult> {
  const { items, failedSources, allFailed } = await collectRecentArticles();

  const inserted = allFailed ? [] : await insertArticles(items);
  const summary = await summarizePendingArticles();
  const classify = await classifyForUser(userId);

  return {
    allFailed,
    failedSources,
    newCount: inserted.length,
    summarizedCount: summary.succeeded,
    summaryFailedCount: summary.failed,
    classifiedCount: classify.classified,
    classifyFailed: classify.failed,
  };
}

async function summarizePendingArticles() {
  const pending = await getPendingSummaries(MAX_SUMMARIES_PER_RUN);

  const results = await mapWithConcurrency(pending, SUMMARY_CONCURRENCY, async (article) => {
    // 원문 페이지 본문을 우선 쓰고, 못 받아오면 RSS 발췌로 요약한다.
    const body = (await fetchArticleText(article.originalUrl)) ?? article.originalExcerpt;
    if (!body) throw new Error("요약할 본문이 없어요");

    const result = await summarizeArticle({ originalTitle: article.originalTitle, body });
    await saveSummary(article.id, result);
  });

  let failed = 0;
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failed++;
      console.error(`[pipeline] 요약 실패 ${pending[i].originalUrl}`, r.reason);
    }
  });
  return { succeeded: results.length - failed, failed };
}

async function classifyForUser(userId: string) {
  // 첫 로그인 직후라면 기본 카테고리를 먼저 만든다.
  await getCategoriesWithDefaults(userId);
  const [categories, unclassified] = await Promise.all([
    getClassifyCategories(userId),
    getUnclassifiedArticles(userId, MAX_CLASSIFY_PER_RUN),
  ]);

  const batches = chunk(unclassified, CLASSIFY_BATCH_SIZE);
  const results = await Promise.allSettled(
    batches.map(async (batch) => {
      const assigned = await classifyArticles(batch, categories);
      const rows = [...assigned].map(([articleId, categoryId]) => ({ articleId, categoryId }));
      await upsertUserCategories(userId, rows);
      return rows.length;
    }),
  );

  let classified = 0;
  let failed = false;
  for (const r of results) {
    if (r.status === "fulfilled") classified += r.value;
    else {
      failed = true;
      console.error("[pipeline] 분류 실패", r.reason);
    }
  }
  return { classified, failed };
}

// 동시에 최대 limit 개씩 실행한다. 결과 순서는 입력 순서와 같다.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

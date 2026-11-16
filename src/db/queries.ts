import "server-only";

import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { articles, categories, userArticles, type NewArticle } from "@/db/schema";

// PRD FR-1: 첫 로그인 때 만들어 주는 기본 카테고리
const DEFAULT_CATEGORY_NAMES = [
  "LLM·모델",
  "투자·비즈니스",
  "정책·규제",
  "연구",
  "제품·서비스",
  "기타",
];

// 사용자의 카테고리를 만든 순서대로 가져온다. 하나도 없으면(첫 로그인) 기본 카테고리를 만든다.
export async function getCategoriesWithDefaults(userId: string) {
  const rows = await getCategories(userId);
  if (rows.length > 0) return rows;

  await db
    .insert(categories)
    .values(DEFAULT_CATEGORY_NAMES.map((name) => ({ userId, name })))
    // 동시에 두 요청이 들어와도 (userId, name) 유니크 인덱스로 중복을 막는다.
    .onConflictDoNothing();

  return getCategories(userId);
}

function getCategories(userId: string) {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.createdAt), asc(categories.name));
}

// 공통 기사 전체를 최신순(발행일 → 수집 시각)으로 가져오고, 이 사용자의 분류·Notion 저장 상태를 붙인다.
// 발행일이 없는 기사는 뒤로 보낸다. 이 사용자의 상태가 없으면 categoryId·notionPageUrl은 null(미분류)이다.
export function getArticles(userId: string) {
  return db
    .select({
      id: articles.id,
      source: articles.source,
      originalUrl: articles.originalUrl,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      publishedAt: articles.publishedAt,
      categoryId: userArticles.categoryId,
      notionPageUrl: userArticles.notionPageUrl,
    })
    .from(articles)
    .leftJoin(
      userArticles,
      and(eq(userArticles.articleId, articles.id), eq(userArticles.userId, userId)),
    )
    .orderBy(
      sql`${articles.publishedAt} desc nulls last`,
      desc(articles.createdAt),
    );
}

// 공통 기사로 저장한다. 이미 있는 원문 URL(articles_original_url_idx)은 건너뛴다.
// 동시에 여러 사용자가 가져와도 유니크 인덱스가 중복을 막는다. 새로 들어간 기사만 돌려준다.
export async function insertArticles(items: NewArticle[]) {
  if (items.length === 0) return [];
  return db
    .insert(articles)
    .values(items)
    .onConflictDoNothing({ target: articles.originalUrl })
    .returning({ id: articles.id });
}

// 아직 Claude 번역·요약을 하지 않은 공통 기사 (최신순)
export function getPendingSummaries(limit: number) {
  return db
    .select({
      id: articles.id,
      originalUrl: articles.originalUrl,
      originalTitle: articles.originalTitle,
      originalExcerpt: articles.originalExcerpt,
    })
    .from(articles)
    .where(isNull(articles.summarizedAt))
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.createdAt))
    .limit(limit);
}

export async function saveSummary(id: string, summary: { titleKo: string; summaryKo: string }) {
  await db
    .update(articles)
    .set({ ...summary, summarizedAt: new Date() })
    .where(eq(articles.id, id));
}

// 이 사용자 기준으로 아직 분류한 적 없는(user_articles 행이 없는) 요약 완료 기사
// 카테고리 삭제로 categoryId가 null이 된 행은 여기서 다시 고르지 않는다 (재분류 버튼에서 처리).
export function getUnclassifiedArticles(userId: string, limit: number) {
  return db
    .select({ id: articles.id, titleKo: articles.titleKo, summaryKo: articles.summaryKo })
    .from(articles)
    .leftJoin(
      userArticles,
      and(eq(userArticles.articleId, articles.id), eq(userArticles.userId, userId)),
    )
    .where(and(isNull(userArticles.articleId), isNotNull(articles.summarizedAt)))
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.createdAt))
    .limit(limit);
}

// 이 사용자의 카테고리(분류 기준 설명 포함)
export function getClassifyCategories(userId: string) {
  return db
    .select({ id: categories.id, name: categories.name, description: categories.description })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.createdAt), asc(categories.name));
}

// 분류 결과를 이 사용자의 user_articles 에 저장한다 (Notion 저장 상태는 건드리지 않는다).
// categoryId 는 getClassifyCategories(userId) 로 받은 같은 사용자의 카테고리 id 여야 한다.
export async function upsertUserCategories(
  userId: string,
  rows: { articleId: string; categoryId: string | null }[],
) {
  if (rows.length === 0) return;
  await db
    .insert(userArticles)
    .values(rows.map((r) => ({ userId, ...r })))
    .onConflictDoUpdate({
      target: [userArticles.userId, userArticles.articleId],
      set: { categoryId: sql`excluded.category_id`, updatedAt: new Date() },
    });
}

export type DashboardArticle = Awaited<ReturnType<typeof getArticles>>[number];
export type DashboardCategory = Awaited<
  ReturnType<typeof getCategoriesWithDefaults>
>[number];

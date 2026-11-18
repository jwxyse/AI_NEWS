"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db } from "@/db";
import { getArticleForNotion, setNotionPageUrl } from "@/db/queries";
import { categories, type ArticleSource } from "@/db/schema";
import { runNewsPipeline } from "@/lib/news-pipeline";
import { createNotionPage, NotionError } from "@/lib/notion";

export type FetchNewsState = {
  ok: boolean;
  newCount?: number;
  summarizedCount?: number;
  summaryFailedCount?: number;
  classifiedCount?: number;
  classifyFailed?: boolean;
  failedSources?: ArticleSource[];
  error?: string;
};

// "뉴스 가져오기" (FR-2, FR-3): 최근 24시간 RSS 기사를 공통 기사로 저장하고,
// 요약 전 기사를 Claude로 번역·요약한 뒤, 이 사용자 기준으로 아직 분류 안 된 기사를 분류한다.
// useActionState 가 넘기는 (이전 상태, FormData)는 쓰지 않는다.
export async function fetchNews(): Promise<FetchNewsState> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요해요." };

  try {
    const result = await runNewsPipeline(userId);
    const { allFailed, failedSources, ...counts } = result;

    if (counts.newCount + counts.summarizedCount + counts.classifiedCount > 0) refresh();

    if (allFailed) {
      return {
        ok: false,
        failedSources,
        error: "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
      };
    }
    return { ok: true, failedSources, ...counts };
  } catch (err) {
    console.error("[fetchNews] 실패", err);
    return { ok: false, error: "뉴스를 처리하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
}

export type AddCategoryState = { ok: boolean; error?: string };

const MAX_NAME_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 200;

export async function addCategory(
  _prev: AddCategoryState,
  formData: FormData,
): Promise<AddCategoryState> {
  // Server Action은 직접 POST로도 호출될 수 있으므로 여기서 다시 인증한다.
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요해요." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return { ok: false, error: "카테고리 이름을 입력해 주세요." };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `이름은 ${MAX_NAME_LENGTH}자 이하로 입력해 주세요.` };
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { ok: false, error: `설명은 ${MAX_DESCRIPTION_LENGTH}자 이하로 입력해 주세요.` };
  }

  const inserted = await db
    .insert(categories)
    .values({ userId, name, description: description || null })
    .onConflictDoNothing()
    .returning({ id: categories.id });

  if (inserted.length === 0) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.name, name)));
    return {
      ok: false,
      error: existing.length
        ? "이미 있는 카테고리 이름이에요."
        : "카테고리를 추가하지 못했어요. 다시 시도해 주세요.",
    };
  }

  refresh();
  return { ok: true };
}

export type SaveToNotionState = {
  ok: boolean;
  notionPageUrl?: string;
  alreadySaved?: boolean;
  error?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "뉴스 저장" (FR-9): 기사를 Notion 데이터베이스에 페이지로 저장하고, 이 사용자의 저장 상태를 기록한다.
export async function saveToNotion(articleId: string): Promise<SaveToNotionState> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요해요." };
  if (typeof articleId !== "string" || !UUID_RE.test(articleId)) {
    return { ok: false, error: "기사를 찾지 못했어요." };
  }

  try {
    const article = await getArticleForNotion(userId, articleId);
    if (!article) return { ok: false, error: "기사를 찾지 못했어요." };
    if (article.notionPageUrl) {
      return { ok: true, alreadySaved: true, notionPageUrl: article.notionPageUrl };
    }

    const notionPageUrl = await createNotionPage(article);
    await setNotionPageUrl(userId, articleId, notionPageUrl);
    refresh();
    return { ok: true, notionPageUrl };
  } catch (err) {
    console.error("[saveToNotion] 실패", err);
    if (err instanceof NotionError && (err.status === 401 || err.status === 403 || err.status === 404)) {
      return {
        ok: false,
        error: "Notion 데이터베이스에 접근할 수 없어요. 연결 설정을 확인해 주세요.",
      };
    }
    return { ok: false, error: "Notion에 저장하지 못했어요. 다시 시도해 주세요." };
  }
}

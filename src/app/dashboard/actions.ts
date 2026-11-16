"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db } from "@/db";
import { insertArticles } from "@/db/queries";
import { categories, type ArticleSource } from "@/db/schema";
import { collectRecentArticles } from "@/lib/rss";

export type FetchNewsState = {
  ok: boolean;
  newCount?: number;
  failedSources?: ArticleSource[];
  error?: string;
};

// "뉴스 가져오기" (FR-2): 최근 24시간 RSS 기사를 모아 공통 기사로 저장한다.
// useActionState 가 넘기는 (이전 상태, FormData)는 쓰지 않는다.
export async function fetchNews(): Promise<FetchNewsState> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요해요." };

  try {
    const { items, failedSources, allFailed } = await collectRecentArticles();

    if (allFailed) {
      return {
        ok: false,
        failedSources,
        error: "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
      };
    }

    const inserted = await insertArticles(items);
    if (inserted.length > 0) refresh();
    return { ok: true, newCount: inserted.length, failedSources };
  } catch (err) {
    console.error("[fetchNews] 저장 실패", err);
    return { ok: false, error: "뉴스를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
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

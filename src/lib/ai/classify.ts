import "server-only";

import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { anthropic, CLAUDE_MODEL, FALLBACK_OPTIONS, UnusableResponseError } from "./client";

// 어느 카테고리에도 맞지 않을 때 쓰는 값 → categoryId null ("미분류")
const NONE = "__none__";

export type ClassifyArticle = { id: string; titleKo: string; summaryKo: string };
export type ClassifyCategory = { id: string; name: string; description: string | null };

const SYSTEM_PROMPT = `당신은 AI 뉴스 기사를 사용자가 정한 카테고리로 분류합니다.
각 기사에 가장 알맞은 카테고리를 정확히 1개 고르세요.

- 카테고리 이름과 설명(있으면)을 기준으로 판단합니다. 설명은 사용자가 적은 분류 기준이므로 이름보다 우선합니다.
- 기사의 핵심 주제로 고릅니다. 기사에 잠깐 언급된 내용으로 고르지 않습니다.
- 어느 카테고리에도 맞지 않으면 "기타"처럼 나머지를 담는 카테고리가 있을 때 그것을 고르고, 없으면 "${NONE}"를 고릅니다.
- 입력의 모든 기사 index에 대해 결과를 하나씩 돌려줍니다.`;

// 기사 목록을 이 사용자의 카테고리로 분류한다. 결과: articleId → categoryId (맞는 게 없으면 null)
// 결과에서 빠진 기사는 Map에 넣지 않는다 (다음에 다시 분류된다).
export async function classifyArticles(
  articles: ClassifyArticle[],
  categories: ClassifyCategory[],
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (articles.length === 0 || categories.length === 0) return result;

  const names = categories.map((c) => c.name);
  const Schema = z.object({
    results: z.array(
      z.object({
        index: z.number().int(),
        category: z.enum([NONE, ...names] as [string, ...string[]]),
      }),
    ),
  });

  const categoryList = categories
    .map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`)
    .join("\n");
  const articleList = articles
    .map((a, i) => `<article index="${i}">\n제목: ${a.titleKo}\n요약: ${a.summaryKo}\n</article>`)
    .join("\n");

  const response = await anthropic.beta.messages.parse({
    ...FALLBACK_OPTIONS,
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    output_config: { effort: "low", format: betaZodOutputFormat(Schema) },
    messages: [
      {
        role: "user",
        content: `<categories>\n${categoryList}\n</categories>\n\n<articles>\n${articleList}\n</articles>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new UnusableResponseError(`분류 거절: ${response.stop_details?.category ?? "unknown"}`);
  }
  if (!response.parsed_output) {
    throw new UnusableResponseError(`분류 결과를 읽지 못했어요 (stop_reason: ${response.stop_reason})`);
  }

  const idByName = new Map(categories.map((c) => [c.name, c.id]));
  for (const { index, category } of response.parsed_output.results) {
    const article = articles[index];
    if (!article || result.has(article.id)) continue;
    result.set(article.id, category === NONE ? null : (idByName.get(category) ?? null));
  }
  return result;
}

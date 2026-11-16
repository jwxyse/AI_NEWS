import "server-only";

import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { anthropic, CLAUDE_MODEL, FALLBACK_OPTIONS, UnusableResponseError } from "./client";

const SummarySchema = z.object({
  titleKo: z.string().describe("기사 제목의 자연스러운 한국어 번역"),
  summaryKo: z.string().describe("기사 핵심을 담은 한국어 요약 3~4문장"),
});

export type ArticleSummary = z.infer<typeof SummarySchema>;

// 모든 기사 요청이 같은 시스템 프롬프트를 쓰므로 캐시로 공유된다.
const SYSTEM_PROMPT = `당신은 해외 AI 뉴스를 한국 독자에게 전하는 편집자입니다.
영문 기사의 제목과 본문을 받아 다음 두 가지를 만듭니다.

1. titleKo: 기사 제목을 한국어로 번역합니다. 직역보다 한국 뉴스 제목처럼 자연스럽게 쓰되, 원문에 없는 의미를 더하지 않습니다.
2. summaryKo: 기사 내용을 한국어 3~4문장으로 요약합니다.
   - 누가, 무엇을, 왜 중요한지가 드러나게 씁니다.
   - 기사에 없는 사실, 추측, 의견을 덧붙이지 않습니다.
   - 회사·제품·모델 이름은 원어 표기를 그대로 쓰거나 처음 한 번 괄호로 병기합니다. (예: 오픈AI(OpenAI))
   - 숫자, 금액, 날짜는 원문 그대로 옮깁니다.
   - "~했다", "~이다" 같은 평서문 뉴스 문체로 씁니다.

본문이 광고·구독 안내 등으로 섞여 있으면 기사 내용만 보고 요약합니다.`;

export type SummarizeInput = {
  originalTitle: string;
  // 원문 페이지에서 뽑은 본문, 없으면 RSS 발췌
  body: string;
};

export async function summarizeArticle({ originalTitle, body }: SummarizeInput): Promise<ArticleSummary> {
  const response = await anthropic.beta.messages.parse({
    ...FALLBACK_OPTIONS,
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    output_config: { effort: "low", format: betaZodOutputFormat(SummarySchema) },
    messages: [
      {
        role: "user",
        content: `<title>${originalTitle}</title>\n<body>\n${body}\n</body>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new UnusableResponseError(`요약 거절: ${response.stop_details?.category ?? "unknown"}`);
  }
  const parsed = response.parsed_output;
  if (!parsed || !parsed.titleKo.trim() || !parsed.summaryKo.trim()) {
    throw new UnusableResponseError(`요약 결과를 읽지 못했어요 (stop_reason: ${response.stop_reason})`);
  }
  return { titleKo: parsed.titleKo.trim(), summaryKo: parsed.summaryKo.trim() };
}

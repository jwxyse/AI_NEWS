import "server-only";

import Anthropic from "@anthropic-ai/sdk";

// ANTHROPIC_API_KEY 를 환경 변수에서 읽는다. 429·5xx는 SDK가 2회까지 자동 재시도한다.
export const anthropic = new Anthropic();

export const CLAUDE_MODEL = "claude-opus-5-5";

// 안전 분류기가 요청을 거절하면 서버에서 대체 모델로 다시 실행한다.
export const FALLBACK_OPTIONS: {
  betas: Anthropic.Beta.AnthropicBeta[];
  fallbacks: Anthropic.Beta.Messages.BetaFallbacksParam;
} = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

// 거절(refusal)이나 스키마 파싱 실패처럼 결과를 쓸 수 없는 응답
export class UnusableResponseError extends Error {}

import "server-only";

import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
// Claude에 보낼 본문 상한 (요약에는 충분하고 토큰 비용을 묶어 둔다)
const MAX_TEXT_LENGTH = 12_000;
// 이보다 짧으면 본문 추출에 실패한 것으로 본다 (쿠키 안내·로그인 벽 등)
const MIN_TEXT_LENGTH = 400;

// 기사 원문 페이지를 받아 본문 텍스트만 뽑는다. 실패하면 null (호출하는 쪽에서 RSS 발췌로 대체).
export async function fetchArticleText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ai-news-collector/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[article] ${res.status} ${url}`);
      return null;
    }
    if (!res.headers.get("content-type")?.includes("html")) return null;
    if (Number(res.headers.get("content-length") ?? 0) > MAX_HTML_BYTES) return null;

    const html = await res.text();
    if (html.length > MAX_HTML_BYTES) return null;

    const { document } = parseHTML(html);
    const parsed = new Readability(document as unknown as Document).parse();
    const text = (parsed?.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text.length < MIN_TEXT_LENGTH) return null;

    return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
  } catch (err) {
    console.warn(`[article] 본문을 가져오지 못했어요: ${url}`, err);
    return null;
  }
}

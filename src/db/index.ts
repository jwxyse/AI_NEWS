import "server-only";

import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL이 설정되지 않았습니다. .env.local을 확인하세요.");
}

// Neon serverless HTTP 드라이버: 요청마다 HTTP로 쿼리하므로 서버리스 환경에 적합하다.
export const db = drizzle(process.env.DATABASE_URL, { schema });

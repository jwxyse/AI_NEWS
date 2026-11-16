import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// articles(기사)는 모든 사용자가 함께 보는 공통 데이터다.
// 나머지 테이블(categories, user_articles, notion_connections)은 Clerk userId(text, 예: "user_...")로
// 사용자별 데이터를 격리하므로, 쿼리할 때 반드시 userId 조건을 함께 걸어야 한다.

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ─────────────────────────────────────────────
// 카테고리
// ─────────────────────────────────────────────
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    // 분류 기준 힌트 (선택)
    description: text("description"),
    createdAt: createdAt(),
  },
  (t) => [
    // 같은 사용자 안에서 카테고리 이름 중복 금지 (userId 조회도 이 인덱스가 커버)
    uniqueIndex("categories_user_id_name_idx").on(t.userId, t.name),
  ],
);

// ─────────────────────────────────────────────
// 기사 (공통) — 누가 수집했든 모든 사용자에게 보인다.
// 한국어 제목·요약은 기사당 한 번만 만든다.
// ─────────────────────────────────────────────
export type ArticleSource = "techcrunch" | "the_verge";

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").$type<ArticleSource>().notNull(),
    originalUrl: text("original_url").notNull(),
    originalTitle: text("original_title").notNull(),
    // 원문 기사 작성자 (RSS에 없을 수 있다)
    author: text("author"),
    titleKo: text("title_ko").notNull(),
    summaryKo: text("summary_ko").notNull(),
    // RSS에 발행일이 없을 수 있다.
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    // 누가 가져오든 같은 원문은 한 번만 저장한다.
    uniqueIndex("articles_original_url_idx").on(t.originalUrl),
    // 최신순 목록 조회
    index("articles_published_at_idx").on(t.publishedAt),
  ],
);

// ─────────────────────────────────────────────
// 사용자별 기사 상태 — 분류 결과와 Notion 저장 여부
// 행이 없거나 categoryId가 null이면 그 사용자에게 "미분류"로 보인다.
// ─────────────────────────────────────────────
export const userArticles = pgTable(
  "user_articles",
  {
    userId: text("user_id").notNull(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    // 카테고리가 삭제되면 null("미분류")이 되고 행은 남는다 (Notion 저장 상태 보존).
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    // 이 사용자의 Notion에 저장된 페이지 URL (값이 있으면 이미 저장됨)
    notionPageUrl: text("notion_page_url"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.articleId] }),
    // 카테고리 필터, 카테고리 삭제 시 set null
    index("user_articles_category_id_idx").on(t.categoryId),
  ],
);

// ─────────────────────────────────────────────
// Notion 연결 (사용자당 1개)
// ─────────────────────────────────────────────
export const notionConnections = pgTable("notion_connections", {
  userId: text("user_id").primaryKey(),
  // 토큰은 TOKEN_ENCRYPTION_KEY로 암호화한 문자열로 저장한다.
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  workspaceId: text("workspace_id"),
  workspaceName: text("workspace_name"),
  // 첫 저장 때 만든 "AI News" 데이터베이스 ID
  databaseId: text("database_id"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─────────────────────────────────────────────
// 관계 (db.query.* 관계형 쿼리용)
// ─────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  userArticles: many(userArticles),
}));

export const articlesRelations = relations(articles, ({ many }) => ({
  userArticles: many(userArticles),
}));

export const userArticlesRelations = relations(userArticles, ({ one }) => ({
  article: one(articles, {
    fields: [userArticles.articleId],
    references: [articles.id],
  }),
  category: one(categories, {
    fields: [userArticles.categoryId],
    references: [categories.id],
  }),
}));

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type UserArticle = typeof userArticles.$inferSelect;
export type NewUserArticle = typeof userArticles.$inferInsert;
export type NotionConnection = typeof notionConnections.$inferSelect;
export type NewNotionConnection = typeof notionConnections.$inferInsert;

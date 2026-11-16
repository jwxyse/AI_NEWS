CREATE TABLE "user_articles" (
	"user_id" text NOT NULL,
	"article_id" uuid NOT NULL,
	"category_id" uuid,
	"notion_page_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_articles_user_id_article_id_pk" PRIMARY KEY("user_id","article_id")
);
--> statement-breakpoint
ALTER TABLE "articles" DROP CONSTRAINT "articles_category_id_categories_id_fk";
--> statement-breakpoint
DROP INDEX "articles_user_id_original_url_idx";--> statement-breakpoint
DROP INDEX "articles_user_id_published_at_idx";--> statement-breakpoint
DROP INDEX "articles_category_id_idx";--> statement-breakpoint
-- [수동 추가] 기존 기사의 사용자별 상태(분류, Notion 저장)를 user_articles로 옮긴다.
-- 같은 원문 URL이 여러 사용자에게 중복 저장돼 있으면 가장 먼저 저장된 기사 하나로 모은다.
INSERT INTO "user_articles" ("user_id", "article_id", "category_id", "notion_page_url", "created_at")
SELECT a."user_id", keep."id", a."category_id", a."notion_page_url", a."created_at"
FROM "articles" a
CROSS JOIN LATERAL (
	SELECT b."id" FROM "articles" b
	WHERE b."original_url" = a."original_url"
	ORDER BY b."created_at", b."id"
	LIMIT 1
) keep
WHERE a."category_id" IS NOT NULL OR a."notion_page_url" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- [수동 추가] 공통 기사로 바뀌므로 같은 원문 URL의 중복 기사를 지운다 (위에서 상태는 이미 옮겼다).
DELETE FROM "articles" a
USING "articles" b
WHERE a."original_url" = b."original_url"
  AND (a."created_at", a."id") > (b."created_at", b."id");--> statement-breakpoint
ALTER TABLE "user_articles" ADD CONSTRAINT "user_articles_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_articles" ADD CONSTRAINT "user_articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_articles_category_id_idx" ON "user_articles" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_original_url_idx" ON "articles" USING btree ("original_url");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "notion_page_url";
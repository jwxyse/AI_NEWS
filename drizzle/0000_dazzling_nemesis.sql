CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"original_url" text NOT NULL,
	"original_title" text NOT NULL,
	"author" text,
	"title_ko" text NOT NULL,
	"summary_ko" text NOT NULL,
	"category_id" uuid,
	"published_at" timestamp with time zone,
	"notion_page_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notion_connections" (
	"user_id" text PRIMARY KEY NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"workspace_id" text,
	"workspace_name" text,
	"database_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_user_id_original_url_idx" ON "articles" USING btree ("user_id","original_url");--> statement-breakpoint
CREATE INDEX "articles_user_id_published_at_idx" ON "articles" USING btree ("user_id","published_at");--> statement-breakpoint
CREATE INDEX "articles_category_id_idx" ON "articles" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_id_name_idx" ON "categories" USING btree ("user_id","name");
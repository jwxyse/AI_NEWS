ALTER TABLE "articles" ADD COLUMN "original_excerpt" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "summarized_at" timestamp with time zone;
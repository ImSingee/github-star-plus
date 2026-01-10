ALTER TABLE "repos" ADD COLUMN "repo_name" text;--> statement-breakpoint
ALTER TABLE "repos" ADD COLUMN "repo_details" jsonb;--> statement-breakpoint
CREATE INDEX "repos_starred_at" ON "repos" ("starred_at");
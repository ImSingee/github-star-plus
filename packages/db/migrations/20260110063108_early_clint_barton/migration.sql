ALTER TABLE "repos" ADD COLUMN "repo_id" bigint;--> statement-breakpoint
CREATE INDEX "repos_repo_name" ON "repos" ("repo_name");
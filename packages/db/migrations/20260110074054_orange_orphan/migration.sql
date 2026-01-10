ALTER TABLE "repos" ADD COLUMN "initial_repo" text;--> statement-breakpoint
UPDATE "repos" SET "initial_repo" = "repo" WHERE "initial_repo" IS NULL;--> statement-breakpoint
ALTER TABLE "repos" ALTER COLUMN "initial_repo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repos" ALTER COLUMN "repo_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "repos_repo_id" ON "repos" ("repo_id");
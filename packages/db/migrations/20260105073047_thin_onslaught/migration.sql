CREATE TABLE "repos" (
	"id" serial PRIMARY KEY,
	"repo" text NOT NULL,
	"description" text,
	"initial_description" text,
	"readme" text DEFAULT '',
	"initial_readme" text,
	"starred_at" timestamp with time zone,
	"description_updated_at" timestamp with time zone,
	"readme_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "repos_repo" ON "repos" ("repo");
ALTER TABLE "repos" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS ((
        setweight(to_tsvector('english', coalesce("repos"."repo", '') || ' ' || coalesce("repos"."initial_repo", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("repos"."description", '') || ' ' || coalesce("repos"."initial_description", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("repos"."readme", '') || ' ' || coalesce("repos"."initial_readme", '')), 'C')
      )) STORED;--> statement-breakpoint
CREATE INDEX "repos_search_fts" ON "repos" USING gin ("search_vector");
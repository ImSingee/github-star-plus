import * as restate from '@restatedev/restate-sdk';
import { RequestError } from 'octokit';
import { eq, sql } from 'drizzle-orm';

import { db, schema } from '@proj/db';
import { getOctokit, hasNextPage } from '@proj/github';

type StarredRepoItem = {
  starred_at: string | Date;
  repo: {
    id: number;
    name: string;
    full_name: string;
    description?: string | null;
  };
};

type UpdateRepoReadmeInput = {
  repo: string;
};

export const githubJobs = restate.service({
  name: 'GithubJobs',
  handlers: {
    updateUserStarredRepos: async (
      ctx: restate.Context,
      input?: { force?: boolean },
    ) => {
      // Avoid spamming GitHub while developing locally.
      const force = input?.force ?? false;

      if (!force && process.env.NODE_ENV !== 'production') {
        return {
          skipped: true,
          reason: 'NODE_ENV is not production',
          pages: 0,
          totalStarred: 0,
          updatedRepos: 0,
          readmeUpdated: 0,
        };
      }

      const octokit = getOctokit();

      let page = 1;
      const per_page = 100;
      let totalStarred = 0;
      let updatedRepos = 0;
      let readmeUpdated = 0;

      while (true) {
        const { data, headers } = await ctx.run(
          `fetch-starred-page-${page}`,
          async () => {
            return await octokit.rest.activity.listReposStarredByAuthenticatedUser(
              {
                page,
                per_page,
                mediaType: { format: 'star' },
              },
            );
          },
        );

        // Octokit returns `repo` nested under `repo` when using `format: 'star'`.
        const items = (data as Array<any>).map((it) => ({
          starred_at: it.starred_at,
          repo: it.repo,
        })) as Array<StarredRepoItem>;

        totalStarred += items.length;

        // Process in the same service (durable step)
        const { processed, readmeUpdated: pageReadmeUpdated } = await ctx
          .serviceClient(githubJobs)
          .updateRepoInfo(items);
        updatedRepos += processed;
        readmeUpdated += pageReadmeUpdated;

        if (!hasNextPage(headers.link)) {
          break;
        }
        page += 1;
      }

      return { pages: page, totalStarred, updatedRepos, readmeUpdated };
    },

    updateRepoInfo: async (
      ctx: restate.Context,
      items: Array<StarredRepoItem>,
    ) => {
      let readmeUpdated = 0;
      for (const item of items) {
        const fullName = item.repo.full_name;
        const repoId = item.repo.id;
        const repoName = item.repo.name;
        const repoDetails = item.repo;
        const starredAt = new Date(item.starred_at);
        const description = item.repo.description ?? '';

        const { readmeUpdatedAtIso } = await ctx.run(
          `upsert-repo-${fullName}`,
          async () => {
            const [updatedRepo] = await db
              .update(schema.reposTable)
              .set({
                repoId,
                repoName,
                repoDetails,
                description,
                starredAt,
                descriptionUpdatedAt: sql`now()`,
              })
              .where(eq(schema.reposTable.repo, fullName))
              .returning({
                readmeUpdatedAt: schema.reposTable.readmeUpdatedAt,
              });

            let dbRepo = updatedRepo;
            if (!dbRepo) {
              const [insertedRepo] = await db
                .insert(schema.reposTable)
                .values({
                  repo: fullName,
                  repoId,
                  repoName,
                  repoDetails,
                  description,
                  initialDescription: description,
                  descriptionUpdatedAt: sql`now()`,
                  starredAt,
                })
                .returning({
                  readmeUpdatedAt: schema.reposTable.readmeUpdatedAt,
                });
              dbRepo = insertedRepo;
            }

            // ctx.run input/output is serialized (Date -> ISO string), so store a stable string.
            const raw = dbRepo?.readmeUpdatedAt ?? null;
            const iso = raw ? new Date(raw).toISOString() : null;
            return { readmeUpdatedAtIso: iso };
          },
        );

        const readmeUpdatedAt = readmeUpdatedAtIso
          ? new Date(readmeUpdatedAtIso)
          : null;

        // shouldUpdate() uses Math.random(), so we record the decision in a ctx.run step.
        const shouldUpdateReadme = await ctx.run(
          `should-update-readme-${fullName}`,
          () => shouldUpdate(readmeUpdatedAt, 30),
        );

        if (shouldUpdateReadme) {
          const result = await ctx
            .serviceClient(githubJobs)
            .updateRepoReadme({ repo: fullName });

          if ('updatedId' in result && result.updatedId !== null) {
            readmeUpdated += 1;
          }
        }
      }

      return { processed: items.length, readmeUpdated };
    },

    updateRepoReadme: async (
      ctx: restate.Context,
      { repo: fullName }: UpdateRepoReadmeInput,
    ) => {
      const [owner, repo] = fullName.split('/');

      const readme = await ctx.run('fetch-readme', async () => {
        const octokit = getOctokit();

        try {
          const resp = await octokit.rest.repos.getReadme({
            owner,
            repo,
            mediaType: { format: 'raw' },
          });
          return resp.data as unknown as string;
        } catch (error: unknown) {
          if (error instanceof RequestError) {
            if (error.message.includes('Not Found')) {
              return null;
            }
            if (error.message.includes('Repository access blocked')) {
              return null;
            }
          }
          throw error;
        }
      });

      if (readme === null) {
        return { skipped: true };
      }

      const [updated] = await ctx.run('update-readme-in-db', async () => {
        return db
          .update(schema.reposTable)
          .set({
            readme,
            initialReadme: sql`COALESCE(${schema.reposTable.initialReadme}, ${readme})`,
            readmeUpdatedAt: sql`now()`,
          })
          .where(eq(schema.reposTable.repo, fullName))
          .returning({ id: schema.reposTable.id });
      });

      return { updatedId: updated?.id ?? null };
    },
  },
});

export type GithubJobsService = typeof githubJobs;

function shouldUpdate(lastUpdatedAt: Date | null, maxOutdatedDays: number) {
  if (!lastUpdatedAt) return true;

  const maxOutdatedMs = maxOutdatedDays * 24 * 60 * 60 * 1000;
  const diffMs = Date.now() - lastUpdatedAt.getTime();

  if (diffMs > maxOutdatedMs) return true;

  // Gradually increase probability with time since last update (0..1)
  const w = diffMs / maxOutdatedMs;
  return Math.random() < w;
}

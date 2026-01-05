import * as restate from '@restatedev/restate-sdk';
import { RequestError } from 'octokit';
import { eq, sql } from 'drizzle-orm';

import { db, schema } from '@proj/db';
import { getOctokit, hasNextPage } from '@proj/github';

type StarredRepoItem = {
  starred_at: string | Date;
  repo: {
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
        return { skipped: true, reason: 'NODE_ENV is not production' };
      }

      const octokit = getOctokit();

      let page = 1;
      const per_page = 100;
      let totalStarred = 0;

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
        await ctx.serviceClient(githubJobs).updateRepoInfo(items);

        if (!hasNextPage(headers.link)) {
          break;
        }
        page += 1;
      }

      return { pages: page, totalStarred };
    },

    updateRepoInfo: async (
      ctx: restate.Context,
      items: Array<StarredRepoItem>,
    ) => {
      for (const item of items) {
        await ctx.run(`repo-${item.repo.full_name}`, async () => {
          const fullName = item.repo.full_name;
          const starredAt = new Date(item.starred_at);

          const [dbRepo] = await db
            .insert(schema.reposTable)
            .values({
              repo: fullName,
              description: item.repo.description ?? '',
              initialDescription: item.repo.description ?? '',
              starredAt,
            })
            .onConflictDoUpdate({
              target: schema.reposTable.repo,
              set: {
                description: item.repo.description ?? '',
                starredAt,
                updatedAt: sql`now()`,
                descriptionUpdatedAt: sql`now()`,
              },
            })
            .returning({
              id: schema.reposTable.id,
              readmeUpdatedAt: schema.reposTable.readmeUpdatedAt,
            });

          const shouldUpdateReadme = shouldUpdate(
            dbRepo?.readmeUpdatedAt ?? null,
            30,
          );
          if (shouldUpdateReadme) {
            ctx
              .serviceSendClient(githubJobs)
              .updateRepoReadme({ repo: fullName });
          }
        });
      }

      return { processed: items.length };
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
            updatedAt: sql`now()`,
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

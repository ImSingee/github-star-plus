import { createServerFn } from '@tanstack/react-start';
import type { schema } from '@proj/db';
import type { AnyColumn, SQL, SQLWrapper } from 'drizzle-orm';

// Types inferred from Drizzle schema
export type RepoItem = typeof schema.reposTable.$inferSelect;

// Lightweight type for list pages (excludes large fields like readme/repoDetails)
export type RepoListItem = Pick<
  RepoItem,
  'id' | 'repo' | 'repoId' | 'description' | 'starredAt' | 'ownerAvatarUrl'
>;

export type SortField = 'starredAt' | 'repo';
export type SortOrder = 'asc' | 'desc';

type OrderByExpr = AnyColumn | SQL;
type SqlTag = (strings: TemplateStringsArray, ...expr: Array<unknown>) => SQL;
type OrderFn = (column: SQLWrapper | AnyColumn) => SQL;

function buildOrderBy(args: {
  sortBy: SortField;
  sortOrder: SortOrder;
  schema: typeof schema;
  asc: OrderFn;
  desc: OrderFn;
  sql: SqlTag;
}): Array<OrderByExpr> {
  const { sortBy, sortOrder, schema, asc, desc, sql } = args;
  const orderFn = sortOrder === 'asc' ? asc : desc;

  if (sortBy === 'repo') {
    // Primary: repoName, fallback to full name when repoName is null
    // Secondary: full name (owner/repo)
    return [
      orderFn(
        sql`coalesce(${schema.reposTable.repoName}, ${schema.reposTable.repo})`,
      ),
      orderFn(schema.reposTable.repo),
    ];
  }

  // Primary: starredAt
  // Secondary: full name (owner/repo)
  return [
    orderFn(schema.reposTable.starredAt),
    orderFn(schema.reposTable.repo),
  ];
}

interface GetReposInput {
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export const getRepos = createServerFn({ method: 'GET' })
  .inputValidator((input: GetReposInput) => input)
  .handler(async ({ data }) => {
    const {
      query,
      limit = 30,
      offset = 0,
      sortBy = 'starredAt',
      sortOrder = 'desc',
    } = data;

    const trimmedQuery = query?.trim();
    const shouldSearch = !!trimmedQuery;

    // Dynamic import for server-side modules
    const { db, schema } = await import('@proj/db');
    const { count, desc, asc, ilike, or, sql } = await import('drizzle-orm');

    const whereClause = shouldSearch
      ? or(
          // repo full_name
          ilike(schema.reposTable.repo, `%${trimmedQuery}%`),
          ilike(schema.reposTable.initialRepo, `%${trimmedQuery}%`),
          // descriptions
          ilike(schema.reposTable.description, `%${trimmedQuery}%`),
          ilike(schema.reposTable.initialDescription, `%${trimmedQuery}%`),
          // readmes
          ilike(schema.reposTable.readme, `%${trimmedQuery}%`),
          ilike(schema.reposTable.initialReadme, `%${trimmedQuery}%`),
        )
      : undefined;

    const orderBy = buildOrderBy({ sortBy, sortOrder, schema, asc, desc, sql });

    // Select only fields needed for list view, avoiding large fields like readme/repoDetails
    const listBase = db
      .select({
        id: schema.reposTable.id,
        repo: schema.reposTable.repo,
        repoId: schema.reposTable.repoId,
        description: schema.reposTable.description,
        starredAt: schema.reposTable.starredAt,
        ownerAvatarUrl: schema.reposTable.ownerAvatarUrl,
      })
      .from(schema.reposTable);
    const listQuery = whereClause ? listBase.where(whereClause) : listBase;

    const countBase = db.select({ count: count() }).from(schema.reposTable);
    const countQuery = whereClause ? countBase.where(whereClause) : countBase;

    const [repos, totalResult] = await Promise.all([
      listQuery
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      countQuery,
    ]);

    const total = totalResult[0]?.count ?? 0;
    const hasMore = offset + repos.length < total;

    return {
      repos: repos as Array<RepoListItem>,
      total,
      hasMore,
      nextOffset: hasMore ? offset + limit : undefined,
    };
  });

interface GetRepoByIdInput {
  id: number;
}

export const getRepoById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetRepoByIdInput) => input)
  .handler(async ({ data }) => {
    const { id } = data;

    // Dynamic import for server-side modules
    const { db, schema } = await import('@proj/db');
    const { sql } = await import('drizzle-orm');

    const [repo] = await db
      .select()
      .from(schema.reposTable)
      .where(sql`${schema.reposTable.id} = ${id}`)
      .limit(1);

    return (repo as RepoItem) ?? null;
  });

interface GetRepoByNameInput {
  name: string;
}

export const getRepoByName = createServerFn({ method: 'GET' })
  .inputValidator((input: GetRepoByNameInput) => input)
  .handler(async ({ data }) => {
    const { name } = data;

    // Dynamic import for server-side modules
    const { db, schema } = await import('@proj/db');
    const { sql } = await import('drizzle-orm');

    const [repo] = await db
      .select()
      .from(schema.reposTable)
      .where(sql`${schema.reposTable.repo} = ${name}`)
      .limit(1);

    return (repo as RepoItem) ?? null;
  });

export const getReposCount = createServerFn({ method: 'GET' }).handler(
  async () => {
    // Dynamic import for server-side modules
    const { db, schema } = await import('@proj/db');
    const { count } = await import('drizzle-orm');

    const [result] = await db
      .select({ count: count() })
      .from(schema.reposTable);

    return result?.count ?? 0;
  },
);

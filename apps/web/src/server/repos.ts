import { createServerFn } from '@tanstack/react-start';

// 类型定义（这些可以安全地在客户端导入）
export interface RepoItem {
  id: number;
  repo: string;
  description: string | null;
  initialDescription: string | null;
  readme: string | null;
  initialReadme: string | null;
  starredAt: Date | null;
  descriptionUpdatedAt: Date | null;
  readmeUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SortField = 'starredAt' | 'repo';
export type SortOrder = 'asc' | 'desc';

interface SearchReposInput {
  query: string;
  limit?: number;
  offset?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export const searchRepos = createServerFn({ method: 'GET' })
  .inputValidator((input: SearchReposInput) => input)
  .handler(async ({ data }) => {
    const {
      query,
      limit = 20,
      offset = 0,
      sortBy = 'starredAt',
      sortOrder = 'desc',
    } = data;

    if (!query.trim()) {
      return { repos: [] as Array<RepoItem>, total: 0 };
    }

    // 动态导入服务端模块
    const { db, schema } = await import('@proj/db');
    const { count, desc, asc, ilike, or } = await import('drizzle-orm');

    const searchPattern = `%${query}%`;
    const whereClause = or(
      ilike(schema.reposTable.repo, searchPattern),
      ilike(schema.reposTable.description, searchPattern),
    );

    // 确定排序字段
    const sortColumn =
      sortBy === 'repo' ? schema.reposTable.repo : schema.reposTable.starredAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [repos, totalResult] = await Promise.all([
      db
        .select()
        .from(schema.reposTable)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(schema.reposTable).where(whereClause),
    ]);

    return {
      repos: repos as Array<RepoItem>,
      total: totalResult[0]?.count ?? 0,
    };
  });

interface GetReposInput {
  limit?: number;
  offset?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export const getRepos = createServerFn({ method: 'GET' })
  .inputValidator((input: GetReposInput) => input)
  .handler(async ({ data }) => {
    const {
      limit = 30,
      offset = 0,
      sortBy = 'starredAt',
      sortOrder = 'desc',
    } = data;

    // 动态导入服务端模块
    const { db, schema } = await import('@proj/db');
    const { desc, asc, count } = await import('drizzle-orm');

    // 确定排序字段
    const sortColumn =
      sortBy === 'repo' ? schema.reposTable.repo : schema.reposTable.starredAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [repos, totalResult] = await Promise.all([
      db
        .select()
        .from(schema.reposTable)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(schema.reposTable),
    ]);

    const total = totalResult[0]?.count ?? 0;
    const hasMore = offset + repos.length < total;

    return {
      repos: repos as Array<RepoItem>,
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

    // 动态导入服务端模块
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

    // 动态导入服务端模块
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
    // 动态导入服务端模块
    const { db, schema } = await import('@proj/db');
    const { count } = await import('drizzle-orm');

    const [result] = await db
      .select({ count: count() })
      .from(schema.reposTable);

    return result?.count ?? 0;
  },
);

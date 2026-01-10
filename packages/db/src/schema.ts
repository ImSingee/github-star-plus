import { sql } from 'drizzle-orm';
import {
  timestamp as _timestamp,
  bigint,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import type { JsonObject } from 'type-fest';

/** ================== utils ================== */
function timestamp(name?: string) {
  if (!name) {
    return _timestamp({ withTimezone: true, mode: 'date' });
  }
  return _timestamp(name, { withTimezone: true, mode: 'date' });
}

const createdAt = timestamp('created_at').notNull().defaultNow();
const updatedAt = timestamp('updated_at')
  .notNull()
  .defaultNow()
  .$onUpdate(() => sql`now()`);
// const deletedAt = timestamp("deleted_at");

// const RESTRICT = { onUpdate: "restrict", onDelete: "restrict" } as const;
// const CASCADE = { onUpdate: "cascade", onDelete: "cascade" } as const;

export const reposTable = pgTable(
  'repos',
  {
    id: serial('id').primaryKey(),
    repoId: bigint('repo_id', { mode: 'number' }).notNull(),
    repo: text('repo').notNull(),
    initialRepo: text('initial_repo').notNull(),
    repoName: text('repo_name').notNull(),
    repoDetails: jsonb('repo_details').$type<JsonObject>().notNull(),
    description: text('description').notNull(),
    initialDescription: text('initial_description').notNull(),
    readme: text('readme').default(''),
    initialReadme: text('initial_readme'),
    starredAt: timestamp('starred_at').notNull(),
    descriptionUpdatedAt: timestamp('description_updated_at').notNull(),
    readmeUpdatedAt: timestamp('readme_updated_at'),
    ownerAvatarUrl: text('owner_avatar_url').generatedAlwaysAs(
      (): SQL =>
        sql`nullif(${reposTable.repoDetails} -> 'owner' ->> 'avatar_url', '')`,
    ),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('repos_repo').on(table.repo),
    uniqueIndex('repos_repo_id').on(table.repoId),
    index('repos_starred_at').on(table.starredAt),
    index('repos_repo_name').on(table.repoName),
  ],
);

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
    repo: text('repo').notNull(),
    repoId: bigint('repo_id', { mode: 'number' }),
    repoName: text('repo_name'),
    repoDetails: jsonb('repo_details').$type<Record<string, unknown>>(),
    description: text('description'),
    initialDescription: text('initial_description'),
    readme: text('readme').default(''),
    initialReadme: text('initial_readme'),
    starredAt: timestamp('starred_at'),
    descriptionUpdatedAt: timestamp('description_updated_at'),
    readmeUpdatedAt: timestamp('readme_updated_at'),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex('repos_repo').on(table.repo),
    index('repos_starred_at').on(table.starredAt),
    index('repos_repo_name').on(table.repoName),
  ],
);

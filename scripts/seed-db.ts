import { db, schema } from '@proj/db';

// // Small reproducible PRNG for deterministic sampling (M2M/random votes/random subscriptions)
// function makePrng(seedNum = 42) {
//   let s = seedNum >>> 0;
//   return () => {
//     // xorshift32
//     s ^= s << 13;
//     s ^= s >>> 17;
//     s ^= s << 5;
//     return (s >>> 0) / 0xffffffff;
//   };
// }

// Clear the database in dependency-safe order
async function clearDatabase() {
  console.log('🧹 Clearing existing data...');

  await db.delete(schema.reposTable);

  console.log('✅ Database cleared');
}

const sampleRepos = [
  {
    repo: 'octocat/Hello-World',
    description: 'My first repository on GitHub!',
  },
  {
    repo: 'vercel/next.js',
    description: 'The React Framework',
  },
];

async function seedRepos() {
  console.log('📦 Inserting repos...');

  const seededRepos = await db
    .insert(schema.reposTable)
    .values(
      sampleRepos.map((repo) => ({
        repo: repo.repo,
        description: repo.description,
      })),
    )
    .returning({ id: schema.reposTable.id, repo: schema.reposTable.repo });

  console.log(`✅ Seeded ${seededRepos.length} repos`);
}

async function main() {
  await clearDatabase();

  await seedRepos();

  console.log('🎉 Finished seeding all apps!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

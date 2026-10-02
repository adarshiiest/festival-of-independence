/**
 * Verify Supabase state: CC10, CC11 clusters and college counts
 * Run: node scripts/verify-supabase.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

async function verify() {
  await sequelize.authenticate();
  console.log('✅ Connected to Supabase PostgreSQL\n');

  // Check clusters
  const [clusters] = await sequelize.query(
    `SELECT code, "facilitatorName", id FROM clusters WHERE code IN ('CC10','CC11') ORDER BY code`
  );
  console.log('=== CLUSTERS ===');
  clusters.forEach(c => console.log(` ${c.code} | ${c.facilitatorName} | ${c.id}`));

  // Check college counts per cluster
  const [counts] = await sequelize.query(
    `SELECT c.code, COUNT(col.id) AS college_count
     FROM clusters c
     LEFT JOIN colleges col ON col."clusterId" = c.id AND col."isPending" = false
     WHERE c.code IN ('CC10','CC11')
     GROUP BY c.code, c.id
     ORDER BY c.code`
  );
  console.log('\n=== COLLEGE COUNTS ===');
  counts.forEach(r => console.log(` ${r.code}: ${r.college_count} colleges`));

  // Check if CC11 exists
  if (clusters.length < 2) {
    console.log('\n⚠️  CC11 does NOT exist in Supabase yet! Run migrate-cc10-supabase.js');
  } else {
    console.log('\n✅ Both CC10 and CC11 exist in Supabase.');
  }

  await sequelize.close();
  process.exit(0);
}

verify().catch(e => { console.error('Error:', e.message); process.exit(1); });

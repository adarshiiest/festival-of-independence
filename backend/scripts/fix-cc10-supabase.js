/**
 * Fix CC10 facilitator name in Supabase (production DB)
 * Run: node scripts/fix-cc10-supabase.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Sequelize, DataTypes } = require('sequelize');

// Connect to the production DATABASE_URL from .env
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function fix() {
  await sequelize.authenticate();
  console.log('✅ Connected to Supabase PostgreSQL\n');

  // Read current value first
  const [before] = await sequelize.query(
    "SELECT code, \"facilitatorName\" FROM clusters WHERE code IN ('CC10', 'CC11') ORDER BY code"
  );
  console.log('BEFORE:');
  before.forEach(r => console.log(' ', r.code, '|', r.facilitatorName));

  // Apply the fix
  await sequelize.query(
    "UPDATE clusters SET \"facilitatorName\" = 'Utsav Prabhu', \"updatedAt\" = NOW() WHERE code = 'CC10'"
  );
  console.log('\nUpdate executed.');

  // Verify
  const [after] = await sequelize.query(
    "SELECT code, \"facilitatorName\" FROM clusters WHERE code IN ('CC10', 'CC11') ORDER BY code"
  );
  console.log('\nAFTER:');
  after.forEach(r => console.log(' ', r.code, '|', r.facilitatorName));

  await sequelize.close();
  process.exit(0);
}

fix().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

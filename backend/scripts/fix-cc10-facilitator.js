const sequelize = require('../src/config/db');
const { Cluster } = require('../src/models');

async function fix() {
  await sequelize.authenticate();

  // Use Sequelize update (handles timestamps correctly per dialect)
  const [count] = await Cluster.update(
    { facilitatorName: 'Utsav Prabhu' },
    { where: { code: 'CC10' } }
  );
  console.log('Rows updated:', count);

  // Verify by reading fresh from DB
  const cc10 = await Cluster.findOne({ where: { code: 'CC10' }, raw: true });
  console.log('CC10 facilitatorName now:', cc10.facilitatorName);

  process.exit(0);
}

fix().catch(e => { console.error(e.message); process.exit(1); });

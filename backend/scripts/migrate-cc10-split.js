/**
 * One-time Migration Script: Split CC10 into CC10 (Utsav Prabhu) + CC11 (Nitin Prabhu)
 *
 * What this script does:
 *  1. Updates CC10 facilitator → "Utsav Prabhu"
 *  2. Creates CC11 cluster with facilitator "Nitin Prabhu"
 *  3. Sorts all 66 CC10 colleges alphabetically
 *  4. Assigns first half → CC10, second half → CC11
 *
 * Run with: node scripts/migrate-cc10-split.js
 */

const crypto = require("crypto");
const path = require("path");

// Resolve paths relative to this script's location (backend/scripts/)
const srcPath = path.resolve(__dirname, "../src");
const sequelize = require(path.join(srcPath, "config/db"));
const { Cluster, College } = require(path.join(srcPath, "models"));

async function run() {
  await sequelize.authenticate();
  console.log("✅ DB connected.\n");

  // ── 1. Find CC10 ────────────────────────────────────────────────────────────
  const cc10 = await Cluster.findOne({ where: { code: "CC10" } });
  if (!cc10) {
    console.error("❌ CC10 cluster not found. Aborting.");
    process.exit(1);
  }
  console.log(`Found CC10: ${cc10.id} | current facilitator: "${cc10.facilitatorName}"`);

  // ── 2. Get all colleges currently in CC10, sorted alphabetically ─────────
  const cc10Colleges = await College.findAll({
    where: { clusterId: cc10.id },
    order: [["name", "ASC"]],
  });
  console.log(`\nCC10 has ${cc10Colleges.length} colleges.`);

  if (cc10Colleges.length === 0) {
    console.warn("⚠️  No colleges found in CC10. Nothing to split.");
    process.exit(0);
  }

  const midpoint = Math.ceil(cc10Colleges.length / 2);
  const forCC10 = cc10Colleges.slice(0, midpoint);
  const forCC11 = cc10Colleges.slice(midpoint);

  console.log(`\nSplit: ${forCC10.length} colleges → CC10  |  ${forCC11.length} colleges → CC11`);

  // ── 3. Update CC10 facilitator ───────────────────────────────────────────
  await Cluster.update({ facilitatorName: "Utsav Prabhu" }, { where: { code: "CC10" } });
  console.log(`\n✅ CC10 facilitator updated → "Utsav Prabhu"`);

  // ── 4. Create CC11 ───────────────────────────────────────────────────────
  const [cc11, wasCreated] = await Cluster.findOrCreate({
    where: { code: "CC11" },
    defaults: {
      facilitatorName: "Nitin Prabhu",
      accessToken: crypto.randomBytes(32).toString("hex"),
    },
  });

  if (!wasCreated) {
    // If CC11 already exists, just update facilitator
    cc11.facilitatorName = "Nitin Prabhu";
    await cc11.save();
    console.log(`✅ CC11 already existed — facilitator updated → "Nitin Prabhu"`);
  } else {
    console.log(`✅ CC11 created → "Nitin Prabhu" | ID: ${cc11.id}`);
  }

  // ── 5. Assign colleges ───────────────────────────────────────────────────
  console.log("\nAssigning colleges to CC10 (Utsav Prabhu):");
  for (const college of forCC10) {
    college.clusterId = cc10.id;
    await college.save();
    console.log(`   ✓ [CC10] ${college.name}`);
  }

  console.log("\nAssigning colleges to CC11 (Nitin Prabhu):");
  for (const college of forCC11) {
    college.clusterId = cc11.id;
    await college.save();
    console.log(`   ✓ [CC11] ${college.name}`);
  }

  // ── 6. Summary ───────────────────────────────────────────────────────────
  const cc10Count = await College.count({ where: { clusterId: cc10.id } });
  const cc11Count = await College.count({ where: { clusterId: cc11.id } });

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("MIGRATION COMPLETE");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`CC10 (Utsav Prabhu)   → ${cc10Count} colleges`);
  console.log(`CC11 (Nitin Prabhu)   → ${cc11Count} colleges`);
  console.log("\n⚠️  IMPORTANT: Restart your backend server after migration.");
  console.log("══════════════════════════════════════════════════════════\n");

  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});

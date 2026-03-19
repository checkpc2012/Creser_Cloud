const { MigrationOrchestratorService } = require('../src/services/migration-orchestrator.service');
const { PrismaClient } = require('../src/generated/client');

async function main() {
  const batchId = `CUTOVER_RECON_2026_${new Date().getTime()}`;
  console.log(`=== SYSTEM RECONSTRUCTION START ===`);
  console.log(`Target Database: creser_operational`);
  console.log(`Batch ID: ${batchId}`);
  
  try {
    const result = await MigrationOrchestratorService.runMigration(batchId);
    if (result.success) {
      console.log(`=== SYSTEM RECONSTRUCTION COMPLETED SUCCESSFULLY ===`);
      console.log(`Reconciliation Summary:`, result.report.summary);
    } else {
      console.error(`=== SYSTEM RECONSTRUCTION FAILED ===`, result.error);
    }
  } catch (err) {
    console.error(`=== FATAL ERROR DURING RECONSTRUCTION ===`, err);
  } finally {
    process.exit(0);
  }
}

main();

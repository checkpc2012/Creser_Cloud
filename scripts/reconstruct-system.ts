import { MigrationOrchestratorService } from '../src/services/migration-orchestrator.service';

/**
 * RECONSTRUCT SYSTEM SCRIPT
 * Performs a clean-slate migration from SQL Server CRESER to PostgreSQL.
 */
async function main() {
  const batchId = `CUTOVER_RECON_2026_${Date.now()}`;
  console.log(`=== SYSTEM RECONSTRUCTION START ===`);
  console.log(`Target Database: creser_operational`);
  console.log(`Batch ID: ${batchId}`);
  
  try {
    const result = await MigrationOrchestratorService.runMigration(batchId);
    if (result.success) {
      console.log(`=== SYSTEM RECONSTRUCTION COMPLETED SUCCESSFULLY ===`);
      console.log(`Summary:`, JSON.stringify(result.report.summary, null, 2));
    } else {
      console.error(`=== SYSTEM RECONSTRUCTION FAILED ===`);
      console.error(result.error);
    }
  } catch (err) {
    console.error(`=== FATAL ERROR DURING RECONSTRUCTION ===`);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

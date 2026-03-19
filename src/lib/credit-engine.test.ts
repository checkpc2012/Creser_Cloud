import { CreditEngine, InstallmentPlanParams } from './credit-engine';

async function runTests() {
  console.log("--- STARTING CREDIT ENGINE TESTS ---");

  // Test Case 1: French System - Standard
  const paramsFrench: InstallmentPlanParams = {
    principalAmount: 10000,
    annualRate: 60, // 60%
    termCount: 12,
    startDate: new Date("2024-03-16"),
    amortizationSystem: 'FRENCH',
    ivaRate: 0.22
  };

  const resultFrench = CreditEngine.generateInstallmentPlan(paramsFrench);
  
  const totalPrincipalFrench = resultFrench.installments.reduce((sum, i) => sum + i.principalAmount, 0);
  console.log(`French Total Principal: ${totalPrincipalFrench} (Expected: 10000)`);
  if (Math.abs(totalPrincipalFrench - 10000) > 0.01) throw new Error("French principal mismatch");

  console.log("French First Installment:", resultFrench.installments[0]);
  console.log("French Last Installment:", resultFrench.installments[11]);

  // Test Case 2: Direct System
  const paramsDirect: InstallmentPlanParams = {
    principalAmount: 10000,
    annualRate: 60,
    termCount: 12,
    startDate: new Date("2024-03-16"),
    amortizationSystem: 'DIRECT',
    ivaRate: 0.22
  };

  const resultDirect = CreditEngine.generateInstallmentPlan(paramsDirect);
  const totalPrincipalDirect = resultDirect.installments.reduce((sum, i) => sum + i.principalAmount, 0);
  console.log(`Direct Total Principal: ${totalPrincipalDirect} (Expected: 10000)`);
  if (Math.abs(totalPrincipalDirect - 10000) > 0.01) throw new Error("Direct principal mismatch");

  console.log("Direct First Installment:", resultDirect.installments[0]);

  // Test Case 3: Interest and VAT splitting
  const inst1 = resultFrench.installments[0];
  const expectedVAT = Math.round(inst1.interestAmount * 0.22 * 100) / 100;
  console.log(`Inst 1 VAT: ${inst1.taxAmount} (Expected approx: ${expectedVAT})`);
  if (Math.abs(inst1.taxAmount - expectedVAT) > 0.01) throw new Error("VAT mismatch");

  console.log("--- ALL CORE TESTS PASSED ---");
}

runTests().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});

import { ScheduleInstallment } from './legacySchedule';
import { LegacyInstallmentData } from './legacyMapper';

export interface ValidationResult {
  installment_number: number;
  payment_diff: number;
  interest_diff: number;
  principal_diff: number;
  remaining_balance_diff: number;
  is_valid: boolean;
}

export interface ValidationReport {
  is_valid_overall: boolean;
  total_payment_diff: number;
  total_interest_diff: number;
  max_diff_found: number;
  installments: ValidationResult[];
}

/**
 * Validates a calculated schedule against legacy installments.
 * Useful for automating finding the correct rounding configurations.
 */
export function validateLegacyMatch(
  calculated: ScheduleInstallment[],
  legacy: LegacyInstallmentData[],
  tolerance: number = 0.01 // Less than 0.01 allowed difference
): ValidationReport {
  const report: ValidationReport = {
    is_valid_overall: true,
    total_payment_diff: 0,
    total_interest_diff: 0,
    max_diff_found: 0,
    installments: []
  };

  const len = Math.max(calculated.length, legacy.length);

  for (let i = 0; i < len; i++) {
    const calcInst = calculated[i];
    const legInst = legacy[i];

    if (!calcInst || !legInst) {
      report.is_valid_overall = false;
      continue;
    }

    const payDiff = Math.abs(calcInst.payment_amount - legInst.payment);
    const intDiff = Math.abs(calcInst.interest_paid - legInst.interest);
    
    const princDiff = legInst.principal !== undefined 
      ? Math.abs(calcInst.principal_paid - legInst.principal) 
      : 0;
      
    const balDiff = legInst.balance !== undefined 
      ? Math.abs(calcInst.remaining_balance - legInst.balance) 
      : 0;

    const maxDiff = Math.max(payDiff, intDiff, princDiff, balDiff);
    if (maxDiff > report.max_diff_found) {
      report.max_diff_found = maxDiff;
    }

    const isValid = maxDiff <= tolerance;
    if (!isValid) {
      report.is_valid_overall = false;
    }

    report.total_payment_diff += payDiff;
    report.total_interest_diff += intDiff;

    report.installments.push({
      installment_number: calcInst.installment_number,
      payment_diff: payDiff,
      interest_diff: intDiff,
      principal_diff: princDiff,
      remaining_balance_diff: balDiff,
      is_valid: isValid
    });
  }

  return report;
}

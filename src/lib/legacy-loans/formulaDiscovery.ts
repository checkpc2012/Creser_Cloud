import { RoundingMode } from './rounding';

export type InterestMethod = 'monthly_rate' | 'daily_30' | 'daily_360' | 'simple_interest' | 'compound_interest';
export type AmortizationSystem = 'french' | 'german' | 'simple_declining';

export interface DiscoveredFormula {
  interestMethod: InterestMethod;
  amortizationSystem: AmortizationSystem;
  roundingMode: RoundingMode;
  currencyPrecision: number;
  confidenceScore: number; // 0 to 1
}

import { LegacyLoan } from './legacyMapper';
import { calculateAmortizationSchedule } from './legacyLoanEngine';
import { ValidationReport, validateLegacyMatch } from './compareLegacyLoans';

/**
 * Analyzes historical loans to infer the exact mathematical formula used.
 * It brute-forces combinations of interest models, amortization systems, and rounding rules.
 */
export function discoverLegacyFormula(loans: LegacyLoan[]): DiscoveredFormula {
  const interestMethods: InterestMethod[] = ['monthly_rate', 'daily_30', 'daily_360'];
  const amortizationSystems: AmortizationSystem[] = ['french', 'german', 'simple_declining'];
  const roundingModes: RoundingMode[] = ['round', 'floor', 'bankers', 'ceil'];
  const precisions = [0, 2];

  let bestFormula: DiscoveredFormula | null = null;
  let minTotalDiff = Infinity;

  // Brute force permutations
  for (const intMethod of interestMethods) {
    for (const amortSys of amortizationSystems) {
      for (const roundMode of roundingModes) {
        for (const precision of precisions) {
          
          let currentTotalDiff = 0;
          let allLoansValid = true;

          // Test this combination against a subset/all of the provided loans
          for (const loan of loans) {
            // Recalculate based on current permutation
            const calculatedSchedule = calculateAmortizationSchedule(
              loan.principal,
              loan.rate / 100, // Assuming db stores as percentage
              loan.term,
              {
                roundingMode: roundMode,
                currencyPrecision: precision,
                interestMethod: intMethod,
                amortizationSystem: amortSys
              }
            );

            // Compare
            const report = validateLegacyMatch(calculatedSchedule, loan.installments, 0.01);
            currentTotalDiff += (report.total_payment_diff + report.total_interest_diff);

            if (!report.is_valid_overall) {
              allLoansValid = false;
            }
          }

          // If this combination is better, keep it
          if (currentTotalDiff < minTotalDiff) {
            minTotalDiff = currentTotalDiff;
            bestFormula = {
              interestMethod: intMethod,
              amortizationSystem: amortSys,
              roundingMode: roundMode,
              currencyPrecision: precision,
              confidenceScore: allLoansValid ? 1.0 : (1 / (1 + currentTotalDiff))
            };
          }
          
          // Fast exit if we found a perfect match
          if (minTotalDiff === 0 && allLoansValid) {
            return bestFormula!;
          }
        }
      }
    }
  }

  return bestFormula || {
    interestMethod: 'monthly_rate',
    amortizationSystem: 'french',
    roundingMode: 'round',
    currencyPrecision: 2,
    confidenceScore: 0
  };
}

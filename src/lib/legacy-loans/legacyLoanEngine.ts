import { applyRounding, RoundingMode } from './rounding';
import { InterestMethod, AmortizationSystem } from './formulaDiscovery';
import { ScheduleInstallment } from './legacySchedule';

export interface CalculationOptions {
  roundingMode?: RoundingMode;
  currencyPrecision?: number; // e.g., 0 for UYU, 2 for USD
  interestRounding?: 'before' | 'after'; 
  interestMethod?: InterestMethod;
  amortizationSystem?: AmortizationSystem;
}

/**
 * Universal Legacy Loan Engine capable of adapting to inferred legacy configurations.
 * Handles French, German, or Simple Declining systems, testing various daily/monthly rules.
 */
export function calculateAmortizationSchedule(
  principal: number,
  periodicInterestRate: number, 
  installments: number,
  options: CalculationOptions = {}
): ScheduleInstallment[] {
  const {
    roundingMode = 'round',
    currencyPrecision = 2,
    interestRounding = 'after',
    interestMethod = 'monthly_rate',
    amortizationSystem = 'french'
  } = options;

  if (principal <= 0 || installments <= 0) return [];

  const round = (val: number) => applyRounding(val, roundingMode, currencyPrecision);

  const schedule: ScheduleInstallment[] = [];
  let currentBalance = principal;

  // INITIAL SETUP: Compute constant components dynamically based on Amortization System
  let paymentAmount = 0;
  let fixedPrincipalAmount = 0;

  if (periodicInterestRate === 0) {
    paymentAmount = round(principal / installments);
    fixedPrincipalAmount = round(principal / installments);
  } else {
     if (amortizationSystem === 'french') {
         const factor = Math.pow(1 + periodicInterestRate, installments);
         paymentAmount = round((principal * periodicInterestRate * factor) / (factor - 1));
     } else if (amortizationSystem === 'german') {
         fixedPrincipalAmount = round(principal / installments);
     }
  }

  // INSTALLMENT GENERATION
  for (let i = 1; i <= installments; i++) {
    // 1. Calculate Interest according to selected Method
    let rawInterest = 0;
    
    // Simplification: In a full daily model, you'd calculate days passed since the previous installment, 
    // but the generalized calculation behaves like this:
    switch (interestMethod) {
      case 'monthly_rate':
        rawInterest = currentBalance * periodicInterestRate;
        break;
      case 'daily_30':
        rawInterest = currentBalance * (periodicInterestRate * 12) * (30 / 360);
        break;
      case 'daily_360':
        // Without precise dates, generic daily behaves almost identically to daily_30 unless days differ, 
        // to implement properly the engine would require dates array.
        rawInterest = currentBalance * (periodicInterestRate * 12) * (30 / 360);
        break;
      case 'simple_interest':
        rawInterest = currentBalance * periodicInterestRate;
        break;
      case 'compound_interest':
        rawInterest = currentBalance * periodicInterestRate;
        break;
    }
    
    let interestPaid = 0;
    let principalPaid = 0;

    // 2. Perform Rounding Pipeline
    if (interestRounding === 'before') {
      interestPaid = round(rawInterest);
      
      if (amortizationSystem === 'french') {
         principalPaid = round(paymentAmount - interestPaid);
      } else if (amortizationSystem === 'german') {
         principalPaid = fixedPrincipalAmount;
         paymentAmount = round(principalPaid + interestPaid);
      } else if (amortizationSystem === 'simple_declining') {
         principalPaid = round(principal / installments); // Arbitrary constant logic
         paymentAmount = round(principalPaid + interestPaid);
      }

    } else {
      interestPaid = rawInterest;

      if (amortizationSystem === 'french') {
         principalPaid = paymentAmount - interestPaid;
      } else if (amortizationSystem === 'german') {
         principalPaid = fixedPrincipalAmount;
         paymentAmount = principalPaid + interestPaid;
      }

      interestPaid = round(interestPaid);
      principalPaid = round(principalPaid);
      paymentAmount = round(paymentAmount);
    }

    // 3. Last Installment Correction
    if (i === installments) {
      principalPaid = currentBalance;
      paymentAmount = principalPaid + interestPaid;
      paymentAmount = round(paymentAmount); 
    }

    // 4. Update Balance
    currentBalance = round(currentBalance - principalPaid);
    
    if (currentBalance < 0 || Math.abs(currentBalance) < 0.0001) {
      currentBalance = 0;
    }

    schedule.push({
      installment_number: i,
      payment_amount: paymentAmount,
      principal_paid: principalPaid,
      interest_paid: interestPaid,
      remaining_balance: currentBalance
    });
  }

  return schedule;
}

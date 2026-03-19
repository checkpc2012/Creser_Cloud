import { Decimal } from 'decimal.js'; // Note: I should check if decimal.js is available or use native BigInt/Math

/**
 * Advanced Credit Engine V1.2.0
 * Handles debt calculations for new loans and refinancings.
 * Ensures historical data integrity by being a standalone module.
 */

export type AmortizationSystem = 'FRENCH' | 'DIRECT';

export interface InstallmentPlanParams {
  principalAmount: number;
  annualRate: number;      // Percentage, e.g., 60 for 60%
  termCount: number;       // Number of installments
  startDate: Date;
  amortizationSystem: AmortizationSystem;
  ivaRate?: number;       // e.g., 0.22 for 22%
  roundingStrategy?: 'NEAREST' | 'FLOOR' | 'CEIL';
}

export interface InstallmentRow {
  number: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  taxAmount: number;
  totalAmount: number;
  balanceAmount: number;
}

export interface CreditEngineResult {
  installments: InstallmentRow[];
  metadata: {
    system: AmortizationSystem;
    totalInterest: number;
    totalTax: number;
    totalAmount: number;
    calculatedAt: string;
    version: string;
  };
}

export class CreditEngine {
  private static readonly VERSION = '1.2.0';

  /**
   * Generates a complete installment plan.
   */
  static generateInstallmentPlan(params: InstallmentPlanParams): CreditEngineResult {
    const {
      principalAmount,
      annualRate,
      termCount,
      startDate,
      amortizationSystem,
      ivaRate = 0.22,
    } = params;

    if (principalAmount <= 0) throw new Error("El capital debe ser mayor a 0");
    if (termCount <= 0) throw new Error("El número de cuotas debe ser mayor a 0");

    const monthlyRate = annualRate / 12 / 100;
    
    let installments: InstallmentRow[] = [];
    
    if (amortizationSystem === 'FRENCH') {
      installments = this.calculateFrench(principalAmount, monthlyRate, termCount, startDate, ivaRate);
    } else {
      installments = this.calculateDirect(principalAmount, annualRate, termCount, startDate, ivaRate);
    }

    // Final reconciliation of principal due to rounding
    this.reconcilePrincipal(installments, principalAmount);

    const totalInterest = installments.reduce((sum, inst) => sum + inst.interestAmount, 0);
    const totalTax = installments.reduce((sum, inst) => sum + inst.taxAmount, 0);
    const totalAmount = installments.reduce((sum, inst) => sum + inst.totalAmount, 0);

    return {
      installments,
      metadata: {
        system: amortizationSystem,
        totalInterest: this.round(totalInterest),
        totalTax: this.round(totalTax),
        totalAmount: this.round(totalAmount),
        calculatedAt: new Date().toISOString(),
        version: this.VERSION,
      }
    };
  }

  private static calculateFrench(
    principal: number,
    monthlyRate: number,
    term: number,
    startDate: Date,
    ivaRate: number
  ): InstallmentRow[] {
    const schedule: InstallmentRow[] = [];
    
    let monthlyPI: number;
    if (monthlyRate === 0) {
      monthlyPI = principal / term;
    } else {
      const factor = Math.pow(1 + monthlyRate, term);
      monthlyPI = (principal * monthlyRate * factor) / (factor - 1);
    }

    let remainingBalance = principal;

    for (let i = 1; i <= term; i++) {
      const interest = remainingBalance * monthlyRate;
      let principalPart = monthlyPI - interest;
      
      if (i === term) {
        principalPart = remainingBalance;
      }

      const tax = interest * ivaRate;
      const total = principalPart + interest + tax;
      
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        number: i,
        dueDate,
        principalAmount: this.round(principalPart),
        interestAmount: this.round(interest),
        taxAmount: this.round(tax),
        totalAmount: this.round(total),
        balanceAmount: this.round(Math.max(0, remainingBalance - principalPart))
      });

      remainingBalance -= principalPart;
    }

    return schedule;
  }

  private static calculateDirect(
    principal: number,
    annualRate: number,
    term: number,
    startDate: Date,
    ivaRate: number
  ): InstallmentRow[] {
    const schedule: InstallmentRow[] = [];
    
    const principalPart = principal / term;
    const monthlyRate = annualRate / 12 / 100;
    const interestPart = principal * monthlyRate;
    const taxPart = interestPart * ivaRate;
    const totalPart = principalPart + interestPart + taxPart;

    let remainingBalance = principal;

    for (let i = 1; i <= term; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        number: i,
        dueDate,
        principalAmount: this.round(principalPart),
        interestAmount: this.round(interestPart),
        taxAmount: this.round(taxPart),
        totalAmount: this.round(totalPart),
        balanceAmount: this.round(Math.max(0, remainingBalance - principalPart))
      });

      remainingBalance -= principalPart;
    }

    return schedule;
  }

  private static reconcilePrincipal(schedule: InstallmentRow[], originalPrincipal: number) {
    if (schedule.length === 0) return;

    const totalCalculatedPrincipal = schedule.reduce((sum, inst) => sum + inst.principalAmount, 0);
    const diff = originalPrincipal - totalCalculatedPrincipal;

    if (Math.abs(diff) > 0.001) {
      const last = schedule[schedule.length - 1];
      last.principalAmount = this.round(last.principalAmount + diff);
      last.totalAmount = this.round(last.principalAmount + last.interestAmount + last.taxAmount);
      last.balanceAmount = 0;
    }
  }

  private static round(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }
}

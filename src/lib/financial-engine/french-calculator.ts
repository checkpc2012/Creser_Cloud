/**
 * PENDING VALIDATION vs Legacy real data
 * French System Calculation (Amortización Francesa)
 */
export interface FrenchAmortizationRow {
  installmentNumber: number
  dueDate: Date
  principal: number
  interest: number
  iva: number
  total: number
  remainingPrincipal: number
}

export class FrenchCalculator {
  /**
   * Calculates a French system schedule.
   * Logic is structural; exact rounding and component splitting (principal/interest/taxes)
   * must be validated against legacy FSD011/FSH011 behavior.
   */
  static calculate(
    principal: number,
    annualRate: number,
    termMonths: number,
    startDate: Date,
    ivaRate: number = 0.22
  ): FrenchAmortizationRow[] {
    const monthlyRate = annualRate / 12 / 100
    const factor = Math.pow(1 + monthlyRate, termMonths)
    const monthlyTotal = (principal * monthlyRate * factor) / (factor - 1)

    let remaining = principal
    const schedule: FrenchAmortizationRow[] = []

    for (let i = 1; i <= termMonths; i++) {
      const interest = remaining * monthlyRate
      const principalPart = monthlyTotal - interest
      const iva = interest * ivaRate
      
      const dueDate = new Date(startDate)
      dueDate.setMonth(dueDate.getMonth() + i)

      schedule.push({
        installmentNumber: i,
        dueDate,
        principal: principalPart,
        interest,
        iva,
        total: principalPart + interest + iva,
        remainingPrincipal: Math.max(0, remaining - principalPart)
      })

      remaining -= principalPart
    }

    return schedule
  }
}

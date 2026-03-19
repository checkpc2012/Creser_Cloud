/**
 * PENDING VALIDATION vs Legacy real data
 * Mora / Penalty Interest Logic
 */
export class MoraLogic {
  /**
   * Calculates the penalty interest for an overdue installment.
   * Note: The legacy system might have grace periods or tiered rates.
   */
  static calculateMora(
    balanceAmount: number,
    dueDate: Date,
    moraRate: number, // Monthly rate
    currentDate: Date = new Date()
  ): number {
    if (currentDate <= dueDate) return 0

    const diffTime = Math.abs(currentDate.getTime() - dueDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Simplistic daily calculation (structural placeholder)
    const dailyRate = moraRate / 30 / 100
    return balanceAmount * dailyRate * diffDays
  }
}

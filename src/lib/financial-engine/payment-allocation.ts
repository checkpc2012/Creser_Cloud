/**
 * PENDING VALIDATION vs Legacy real data
 * Payment Allocation Engine
 */
export class PaymentAllocationEngine {
  /**
   * Allocates a payment amount across installment components.
   * Priority: Mora -> IVA(Mora) -> Interest -> IVA(Interest) -> Principal
   * This hierarchy is critical and must be confirmed with Creser financial rules.
   */
  static allocate(
    paymentAmount: number,
    installment: {
      principal_balance: number,
      interest_balance: number,
      iva_balance: number,
      mora_balance: number,
    }
  ) {
    let remaining = paymentAmount
    const allocation = {
      mora: 0,
      iva: 0,
      interest: 0,
      principal: 0,
    }

    // 1. Mora
    const moraPay = Math.min(remaining, installment.mora_balance)
    allocation.mora = moraPay
    remaining -= moraPay

    // 2. IVA/Taxes (Placeholder)
    const ivaPay = Math.min(remaining, installment.iva_balance)
    allocation.iva = ivaPay
    remaining -= ivaPay

    // 3. Interest
    const intPay = Math.min(remaining, installment.interest_balance)
    allocation.interest = intPay
    remaining -= intPay

    // 4. Principal
    const princPay = Math.min(remaining, installment.principal_balance)
    allocation.principal = princPay
    remaining -= princPay

    return {
      allocation,
      excess: remaining
    }
  }
}

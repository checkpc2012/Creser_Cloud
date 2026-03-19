export type Currency = "UYU" | "USD" | "EUR";

export class FinanceUtils {
    /**
     * Rounds an amount according to currency rules.
     * For UYU, it typically rounds to 2 decimal places, but some systems round to 0 (pesos) for final displays.
     * Standard financial rounding is to 2 decimal places.
     */
    static round(amount: number, currency: Currency = "UYU"): number {
        const factor = 100;
        return Math.round((amount + Number.EPSILON) * factor) / factor;
    }

    /**
     * Calculates interest over a period with precision support.
     */
    static calculatePeriodicInterest(principal: number, annualRate: number, days: number): number {
        // Interest = Principal * (Rate / 365) * Days
        const dailyRate = annualRate / 365 / 100;
        return this.round(principal * dailyRate * days);
    }

    /**
     * Calculates amortizable installment using French method.
     * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
     */
    static calculateFrenchInstallment(principal: number, monthlyRate: number, months: number): number {
        const r = monthlyRate / 100;
        const numerator = principal * r * Math.pow(1 + r, months);
        const denominator = Math.pow(1 + r, months) - 1;
        return this.round(numerator / denominator);
    }

    /**
     * Formats currency with local Uruguayan conventions.
     */
    static formatCurrency(amount: number, currency: Currency = "UYU"): string {
        const symbol = currency === "USD" ? "U$S" : currency === "EUR" ? "€" : "$";
        return `${symbol} ${amount.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

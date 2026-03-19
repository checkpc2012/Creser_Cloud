// Represents a parsed and normalized loan from the legacy database
export interface LegacyLoan {
  loanId: string;
  clientId: string;
  startDate: string;
  principal: number;
  rate: number;
  term: number;
  installments: LegacyInstallmentData[];
}

export interface LegacyInstallmentData {
  number: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  dueDate: string;
}

/**
 * Maps legacy database fields to the normalized LegacyLoan object.
 * Assuming raw records from FSH015 and FSH016.
 */
export function mapLegacyLoan(fsh015Record: any, fsh016Records: any[]): LegacyLoan {
  // Sort by installment number or date
  const sortedMovements = [...fsh016Records].sort((a, b) => {
    // Basic heuristic: sort by due date or a sequential ID
    const dateA = new Date(a.HhFven || a.HhFpago).getTime();
    const dateB = new Date(b.HhFven || b.HhFpago).getTime();
    return dateA - dateB;
  });

  const installments: LegacyInstallmentData[] = sortedMovements.map((mov, index) => {
    return {
      number: index + 1,
      payment: Number(mov.Hhimp1 || 0) + Number(mov.HhMora || 0), // Assuming total payment is principal + interest
      principal: Number(mov.Hhimp1 || 0),
      interest: Number(mov.HhMora || 0),
      balance: Number(mov.HhSaldo || 0), // Adjust based on actual legacy field for remaining balance
      dueDate: mov.HhFven ? new Date(mov.HhFven).toISOString().split('T')[0] : '',
    };
  });

  return {
    loanId: String(fsh015Record.Hhoper),
    clientId: String(fsh015Record.HhNrel),
    startDate: fsh015Record.HhFcon ? new Date(fsh015Record.HhFcon).toISOString().split('T')[0] : '',
    principal: Number(fsh015Record.HhSini || 0), // Assuming HhSini or similar is the starting principal
    rate: Number(fsh015Record.HhTasa || 0),
    term: installments.length, // Or use a specific term field if available (e.g., fsh015Record.HhPlazo)
    installments
  };
}

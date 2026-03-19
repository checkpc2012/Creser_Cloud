export type LoanStatus = 'PENDING' | 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Loan {
  id: string;
  clientId: string;
  amount: number;
  remainingAmount: number;
  interestRate: number; // Porcentaje mensual o anual
  termMonths: number;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Payment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: string;
  method: 'CASH' | 'TRANSFER' | 'CARD';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  notes?: string;
}

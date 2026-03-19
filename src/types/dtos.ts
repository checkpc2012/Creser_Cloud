
/**
 * Data Transfer Objects for Phase 9 Frontend/Backend Integration.
 * Normalizes PostgreSQL domain/audit schema for UI consumption.
 */


export interface ClientDTO {
  id: string;
  documentNumber: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  birthDate?: string | null;
  registrationDate?: string | null;
  nationality?: string | null;
  housingType?: string | null;
  workplaceName?: string | null;
  jobTitle?: string | null;
  employmentDescription?: string | null;
  alternatePhone?: string | null;
  spouseDocument?: string | null;
  remarkCategory?: string | null;
  isLegacy: boolean;
  legacyId?: string | null;
  branchId?: string | null;
  // Derived / UI Concepts
  status: 'ACTIVE' | 'IN_ARREARS' | 'CLOSED' | 'REFINANCED' | 'HISTORICAL' | 'FINALIZED';
  type: 'PERSONA' | 'EMPRESA';
  source: 'LEGACY' | 'NEW_SYSTEM';
  confidenceLevel?: 'ALTA' | 'MEDIA' | 'BAJA';
  nombreCompleto: string; // compatibility shim
  documento: string; // compatibility shim
  employerId?: string | null;
  employer?: EmployerDTO | null;
}

export interface EmployerDTO {
  id: string;
  employerCode: string;
  employerName: string;
  type: string;
  // Legacy fields
  legacyAddress?: string | null;
  legacyPhone?: string | null;
  legacyContact?: string | null;
  retentionFlag: boolean;
  closeDay?: number | null;
  collectionDay?: number | null;
  // Researched fields
  publicPhone?: string | null;
  publicMobile?: string | null;
  whatsapp?: string | null;
  publicEmail?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  notes?: string | null;
  researchStatus: string;
  verifiedAt?: string | null;
  isLegacy: boolean;
  clientCount?: number;
}

export interface LoanDTO {
  id: string;
  operationNumber: string;
  principalAmount: string;
  interestAmount: string;
  taxAmount: string;
  arrearsAmount: string;
  totalAmount: string;
  outstandingBalance: string;
  termCount: number;
  status: string;
  statusLabel: string;
  lifecycleState: 'ACTIVE' | 'FINALIZED' | 'REFINANCED';
  productType: 'LOAN' | 'CARD_UYU' | 'CARD_USD';
  isLegacy: boolean;
  isReadOnly: boolean;
  createdAt: string;
  branchId?: string | null;
  clientId: string;
  source: 'LEGACY' | 'NEW_SYSTEM';
  canIssueInvoice?: boolean;
  // Refinancing
  linkedOperationNumber?: string | null;
  // Operational permissions
  canCollect: boolean;
  canReprint: boolean;
  merchantName?: string | null;
  // Refinancing traceability
  refinancedFromId?: string | null;
  refinancedToId?: string | null;
  refinanceReason?: string | null;
  client?: ClientDTO;
}

export interface InstallmentDTO {
  id: string;
  number: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  taxAmount: string;
  arrearsAmount: string;
  totalAmount: string;
  balanceAmount: string;
  isPaid: boolean;
}

export interface HistoricalEventDTO {
  id: string;
  eventType: string;
  eventDate: string;
  legacyOperation?: string | null;
  installmentNumber?: number | null;
  paymentDate?: string | null;
  dueDate?: string | null;
  principalAmount: string;
  interestAmount: string;
  taxAmount: string;
  arrearsAmount: string;
  totalAmount: string;
  receiptNumber?: string | null;
  receiptLabel: string;
  isLegacy: boolean;
  source: 'LEGACY' | 'NEW_SYSTEM';
  isReadOnly: boolean;
  // UI Compatibility Shims
  type: string;
  date: string;
  label: string;
  amount: string;
  currency: 'UYU';
  badgeLabel?: string;
}

export interface ManagerReportDTO {
  stats: {
    clientsCount: number;
    activeCapital: string;
    legacyCapital: string;
    totalGlobalCapital: string;
    lentThisMonth: string;
    overdueTotalAmount: string; // Balance sum of overdue installments
    overdueCount: number;       // Number of overdue installments
    avgLoanAmount: string;
  };
  portfolioDistribution: {
    loans: { amount: string; count: number };
    cards: { amount: string; count: number };
  };
  arrearsSegments: {
    s1_30: number; // 1-30 days
    s31_60: number; // 31-60 days
    s61_plus: number; // 61+ days
  };
  topDebtors: Array<{
     id: string;
     name: string;
     amount: string;
     days: number;
  }>;
  topPayers: Array<{
     id: string;
     name: string;
     score: number; // calculated based on punctuality
     totalPaid: string;
  }>;
}


import { ClientDTO, LoanDTO, HistoricalEventDTO, InstallmentDTO, EmployerDTO } from "@/types/dtos";
import { formatDocument, normalizeDocument, sanitizeName } from '../utils';
import { EventType } from "@prisma/client";

/**
 * Maps a database Client (domain or virtual staging) to a unified ClientDTO.
 * Implements Rule C: Classification (PERSON vs MERCHANT).
 */
export function mapToClientDTO(client: any): ClientDTO {
  const isLegacy = client.isLegacy || client.source === 'LEGACY';
  const docNumber = client.documentNumber || '';
  const formattedDoc = formatDocument(docNumber);
  
  // Rule C: Classification logic
  const type: 'PERSONA' | 'EMPRESA' = docNumber.length >= 11 ? 'EMPRESA' : 'PERSONA';
  
  // Rule D: Segregation logic
  let status = client.status as ClientDTO['status'];
  if (isLegacy && !status) {
    status = 'HISTORICAL';
  }

  const sanitizedFullName = sanitizeName(client.fullName || client.nombreCompleto || `CLIENTE ${docNumber}`);

  return {
    id: client.id,
    documentNumber: formattedDoc,
    fullName: sanitizedFullName,
    email: client.email,
    phone: client.phone,
    address: client.address,
    gender: client.gender,
    maritalStatus: client.maritalStatus,
    birthDate: client.birthDate instanceof Date ? client.birthDate.toISOString() : client.birthDate,
    registrationDate: client.registrationDate instanceof Date ? client.registrationDate.toISOString() : client.registrationDate,
    nationality: client.nationality,
    housingType: client.housingType,
    workplaceName: client.workplaceName,
    jobTitle: client.jobTitle,
    employmentDescription: client.employmentDescription,
    alternatePhone: client.alternatePhone,
    spouseDocument: client.spouseDocument,
    remarkCategory: client.remarkCategory,
    isLegacy: !!isLegacy,
    legacyId: client.legacyId,
    branchId: client.branchId,
    employerId: client.employerId,
    employer: client.employer ? mapToEmployerDTO(client.employer) : null,
    status: status || 'ACTIVE',
    type: type,
    source: isLegacy ? 'LEGACY' : 'NEW_SYSTEM', // Bloque E requirement
    nombreCompleto: sanitizedFullName, // Standardized
    documento: formattedDoc // shim
  };
}

/**
 * Maps a database Loan to a unified LoanDTO.
 * Implements Rule D & E: Segregation and Serialization.
 * Updated to support Senior lifecycle states: ACTIVE, FINALIZED, REFINANCED.
 */
export function mapToLoanDTO(loan: any): LoanDTO {
  const isLegacy = !!loan.isLegacy;
  const outstanding = parseFloat(loan.outstandingBalance?.toString() || "0");
  const isPaid = outstanding <= 0;
  
  // Rule Senior: LifeCycle State
  let lifecycleState: LoanDTO['lifecycleState'] = 'ACTIVE';
  if (loan.status === 'REFINANCED') {
    lifecycleState = 'REFINANCED';
  } else if (isPaid || loan.status === 'CLOSED' || loan.status === 'FINALIZED') {
    lifecycleState = 'FINALIZED';
  }

  // productType detection (default to LOAN, can be expanded for CARDS)
  const productType: LoanDTO['productType'] = 'LOAN'; 

  // Rule D: Status derived label
  const statusLabel = formatStatusLabel(loan.status, isLegacy, lifecycleState);

  return {
    id: loan.id,
    operationNumber: loan.operationNumber,
    principalAmount: loan.principalAmount?.toString() || "0",
    interestAmount: loan.interestAmount?.toString() || "0",
    taxAmount: loan.taxAmount?.toString() || "0",
    arrearsAmount: loan.arrearsAmount?.toString() || "0",
    totalAmount: loan.totalAmount?.toString() || "0",
    outstandingBalance: outstanding.toString(),
    termCount: loan.termCount || 0,
    status: loan.status,
    statusLabel: statusLabel,
    lifecycleState,
    productType,
    isLegacy: isLegacy,
    isReadOnly: isLegacy || lifecycleState !== 'ACTIVE',
    createdAt: loan.createdAt instanceof Date ? loan.createdAt.toISOString() : new Date().toISOString(),
    branchId: loan.branchId,
    clientId: loan.clientId,
    source: isLegacy ? 'LEGACY' : 'NEW_SYSTEM',
    linkedOperationNumber: loan.linkedOperationNumber, // Traceability block
    canCollect: !isLegacy && lifecycleState === 'ACTIVE',
    canReprint: true,
    merchantName: loan.merchantName,
    client: loan.client ? mapToClientDTO(loan.client) : undefined
  };
}

function formatStatusLabel(status: string, isLegacy: boolean, lifecycleState: string): string {
  if (lifecycleState === 'REFINANCED') return 'REFINANCIADO';
  if (lifecycleState === 'FINALIZED') return 'FINALIZADO';
  
  const labels: Record<string, string> = {
    'ACTIVE': 'ACTIVO',
    'IN_ARREARS': 'EN MORA',
    'CLOSED': 'PAGO TOTAL',
  };
  let label = labels[status] || status;
  return isLegacy ? `${label} (LEGACY)` : label;
}

/**
 * Maps a database HistoricalEvent to a unified DTO for the frontend.
 * This handles both legacy records (which might rely on rawPayload) 
 * and new system events.
 */
export function mapToHistoricalEventDTO(event: any): HistoricalEventDTO {
  const isLegacy = !!event.isLegacy || !!event.legacyOperation;
  
  // Rule E: UI Compatibility & ReadOnly flags
  const dto: HistoricalEventDTO = {
    id: event.id,
    eventType: event.eventType as EventType,
    eventDate: event.eventDate instanceof Date ? event.eventDate.toISOString() : event.eventDate,
    principalAmount: event.principalAmount?.toString() || "0",
    interestAmount: event.interestAmount?.toString() || "0",
    taxAmount: event.taxAmount?.toString() || "0",
    arrearsAmount: event.arrearsAmount?.toString() || "0",
    totalAmount: event.totalAmount?.toString() || "0",
    receiptNumber: event.receiptNumber,
    receiptLabel: event.receiptNumber ? `${event.receiptSeries || ''}${event.receiptNumber}` : (isLegacy ? 'LEGACY-DOC' : 'N/A'),
    isLegacy: isLegacy,
    source: isLegacy ? 'LEGACY' : 'NEW_SYSTEM',
    label: formatEventLabel(event),
    badgeLabel: isLegacy ? 'LEGACY' : undefined,
    isReadOnly: true, // Historical is ALWAYS read-only
    type: event.eventType as string,
    date: event.eventDate instanceof Date ? event.eventDate.toISOString() : event.eventDate,
    amount: event.totalAmount?.toString() || "0",
    currency: 'UYU'
  };

  return dto;
}

function formatEventLabel(event: any): string {
  const typeLabels: Record<string, string> = {
    'CUSTOMER_RECEIPT': 'RECIBO DE PAGO',
    'LOAN_DISBURSEMENT': 'DESEMBOLSO',
    'TERM_REFINANCE': 'REFINANCIACIÓN',
    'WRITE_OFF': 'CASTIGO / CONDONACIÓN',
    'ADJUSTMENT': 'AJUSTE',
    'REVERSAL': 'REVERSIÓN',
    'CARD_PAYMENT': 'PAGO DE TARJETA' // Bloque F requirement
  };

  let label = typeLabels[event.eventType] || event.eventType;
  
  if (event.eventType === 'CUSTOMER_RECEIPT' && event.receiptNumber) {
    label += ` #${event.receiptNumber}`;
  }

  return label;
}

/**
 * Maps a legacy client record from Staging_CFE to a ClientDTO stub
 * to allow unified searching and navigation without full domain presence.
 * (Rule G/H: Traceability)
 */
export function mapStagingToClientDTO(staging: any): ClientDTO {
  const docNumber = staging.docR || '';
  let rawName = (staging.nombreR || `CLIENTE ${docNumber}`).trim();
  
  let remarkCategory: string | null = null;
  // Rule: Extract category BEFORE sanitization if possible, though sanitizeName handles some
  if (/\bC4\b/i.test(rawName)) remarkCategory = 'Clearing';
  else if (/\b200\b/i.test(rawName)) remarkCategory = 'Fallecido';
  else if (/\bPF\b/i.test(rawName) || /\*\*/.test(rawName)) remarkCategory = 'PF';

  const fullName = sanitizeName(rawName);
  const formattedDoc = formatDocument(docNumber);

  return {
    id: `v-${docNumber}`,
    documentNumber: formattedDoc,
    fullName: fullName,
    gender: staging.gender || null,
    maritalStatus: staging.maritalStatus || null,
    birthDate: staging.birthDate || null,
    registrationDate: staging.registrationDate || null,
    nationality: staging.nationality || null,
    housingType: staging.housingType || null,
    workplaceName: staging.workplaceName || null,
    jobTitle: staging.jobTitle || null,
    employmentDescription: staging.employmentDescription || null,
    alternatePhone: staging.alternatePhone || null,
    spouseDocument: staging.spouseDocument || null,
    remarkCategory: remarkCategory,
    isLegacy: true,
    legacyId: docNumber,
    type: docNumber.length >= 11 ? 'EMPRESA' : 'PERSONA',
    status: 'HISTORICAL',
    source: 'LEGACY',
    nombreCompleto: fullName,
    documento: formattedDoc
  };
}
export function mapToEmployerDTO(e: any): EmployerDTO {
  return {
    id: e.id,
    employerCode: e.employerCode,
    employerName: e.employerName,
    type: e.type,
    legacyAddress: e.legacyAddress,
    legacyPhone: e.legacyPhone,
    legacyContact: e.legacyContact,
    retentionFlag: e.retentionFlag,
    closeDay: e.closeDay,
    collectionDay: e.collectionDay,
    publicPhone: e.publicPhone,
    publicMobile: e.publicMobile,
    whatsapp: e.whatsapp,
    publicEmail: e.publicEmail,
    website: e.website,
    facebookUrl: e.facebookUrl,
    instagramUrl: e.instagramUrl,
    notes: e.notes,
    researchStatus: e.researchStatus,
    verifiedAt: e.verifiedAt ? e.verifiedAt.toISOString() : null,
    isLegacy: e.isLegacy,
    clientCount: e._count?.clients
  };
}

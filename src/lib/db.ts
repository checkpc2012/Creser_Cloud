import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

export const translationLayer = {
  /**
   * Translates a legacy document type string into the definitive Audit EventType enum.
   */
  classifyEventType(typeCode: string) {
    const mapping: Record<string, any> = {
      'REC': 'CUSTOMER_RECEIPT',
      'ORIG': 'LOAN_ORIGINATION_NOTE',
      'ASIENTO': 'ACCOUNTING_ENTRY',
      'CARD': 'CARD_VOUCHER',
      'ANUL': 'VOID_ENTRY',
    };
    return mapping[typeCode] || 'ACCOUNTING_ENTRY';
  },

  /**
   * Applies the verified rubro decomposition logic.
   * Principal = Total - (Interest + VAT)
   */
  decomposeRubros(total: number, interest: number, vat: number) {
    const principal = total - interest - vat;
    return {
      principal,
      interest,
      vat,
      total
    };
  }
};

export default prisma;

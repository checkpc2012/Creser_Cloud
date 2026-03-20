import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const translationLayer = {
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

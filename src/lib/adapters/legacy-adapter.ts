import { PrismaClient } from "../../generated/client";

const prisma = new PrismaClient();

export interface LegacyMatch {
  branch: string;
  operacion: string;
  rubro?: string;
}

export class LegacyAdapter {
  /**
   * Standardizes legacy ID components into the canonical BRANCH-ID string.
   */
  static standardizeId(branch: string, id: string): string {
    const cleanBranch = branch.trim();
    const cleanId = id.trim();
    return `${cleanBranch}-${cleanId}`;
  }

  /**
   * Resolves a legacy loan ID (from CSV or SQL) to its system UUID.
   */
  static async resolveLoanId(match: LegacyMatch): Promise<string | null> {
    const standardized = this.standardizeId(match.branch, match.operacion);
    
    // According to mapping matrix: FSH020.hSolOper -> Loan.operationNumber
    const loan = await prisma.loan.findFirst({
      where: {
        OR: [
          { operationNumber: standardized },
          { operationNumber: { endsWith: match.operacion.trim() } }
        ]
      },
      select: { id: true }
    });

    return loan?.id || null;
  }

  /**
   * Resolves a legacy client ID to its system UUID.
   */
  static async resolveClientId(legacyId: string): Promise<string | null> {
    // According to mapping matrix: FSD001.ctnro -> Client.legacyId
    const client = await prisma.client.findUnique({
      where: { legacyId: legacyId.trim() },
      select: { id: true }
    });
    return client?.id || null;
  }
}

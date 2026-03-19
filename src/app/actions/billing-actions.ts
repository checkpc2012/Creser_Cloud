"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { roundAmount } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// getClientsForInvoice
// ─────────────────────────────────────────────────────────────
export async function getClientsForInvoice() {
  try {
    // REGLA G: Solo clientes del sistema nuevo (isLegacy: false) pueden ser facturados operativamente.
    // Los registros legacy son HISTORICAL_READ_ONLY.
    return await prisma.client.findMany({
      where: { 
        isLegacy: false,
        // Opcional: Podríamos filtrar por status: 'ACTIVE' si fuera necesario, 
        // pero isLegacy es el discriminador primario de migración.
      },
      select: { 
        id: true, 
        fullName: true, 
        documentNumber: true, 
        phone: true, 
        address: true 
      },
      orderBy: { fullName: "asc" },
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatNumero(num: number) {
  return num.toString().padStart(9, "0");
}
function buildNumeroFormateado(serie: string, num: number) {
  return `${serie}-${formatNumero(num)}`;
}

// ─────────────────────────────────────────────────────────────
// SIMULACIÓN LOCAL — sin conexión a DGI
// Genera CAE, código de seguridad y fecha de vencimiento
// localmente. Cuando se disponga de certificado digital real
// y credenciales DGI, reemplazar esta función por la llamada
// oficial a https://efactura.dgi.gub.uy/
// ─────────────────────────────────────────────────────────────
function simulateDgiLocal(tipoDocumento: string, serie: string, numero: number) {
  const caeNum = Math.floor(90000000000 + Math.random() * 9900000000);
  const codSeg = String(Math.floor(100000 + Math.random() * 899999));
  const fechaVto = new Date();
  fechaVto.setFullYear(fechaVto.getFullYear() + 2);
  return {
    cae: `SIM${caeNum}`,
    codigoSeguridad: codSeg,
    fechaVencimientoCae: fechaVto,
    estadoDgi: "SIMULADO" as const,
    respuestaDgi: {
      modo: "SIMULACION_LOCAL",
      resultado: "PROCESADO_LOCAL",
      mensaje: "Comprobante generado localmente. No fue enviado a DGI.",
      serie,
      numero,
      tipo: tipoDocumento,
      timestamp: new Date().toISOString(),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Genera XML CFE (formato DGI Uruguay)
// ─────────────────────────────────────────────────────────────
function generateXml(data: { company: any; client: any; invoice: any; details: any[] }) {
  const { company, client, invoice, details } = data;
  const lines = details.map((d, i) => {
    // 1: Exento, 2: Tasa Mínima, 3: Tasa Básica, 6: No Gravado
    let indFact = 1;
    if (d.ivaRate === 22) indFact = 3;
    else if (d.ivaRate === 10) indFact = 2;
    else indFact = 1; // Para el capital consideramos exento o no gravado

    return `
    <Linea>
      <NroLinea>${i + 1}</NroLinea>
      <IndFact>${indFact}</IndFact>
      <NomItem>${d.concepto}</NomItem>
      <Cantidad>${d.cantidad}</Cantidad>
      <PrecioUnitario>${d.precioUnit.toFixed(2)}</PrecioUnitario>
      <MontoItem>${d.importe.toFixed(2)}</MontoItem>
    </Linea>`;
  }).join("");

  // DGI Tablas: 2=RUT, 3=C.I., 4=Otros, 5=Pasaporte, 6=DNI
  const isRut = client.documentType === "RUT";
  const isCi = client.documentType === "CI" || !client.documentType; 
  const tipoDocRecep = isRut ? "2" : (isCi ? "3" : "4");

  return `<?xml version="1.0" encoding="UTF-8"?>
<CFE version="1.0">
  <EFact>
    <TmstFirma>${new Date().toISOString()}</TmstFirma>
    <Encabezado>
      <IdDoc>
        <TipoCFE>${invoice.tipoDocumento === "E_TICKET" ? "101" : "111"}</TipoCFE>
        <Serie>${invoice.serie}</Serie>
        <Nro>${invoice.numero}</Nro>
        <FchEmis>${new Date(invoice.fecha).toISOString().split("T")[0]}</FchEmis>
        <FmaPago>1</FmaPago>
        <MntBruto>1</MntBruto>
        <TipoMoneda>${invoice.moneda}</TipoMoneda>
      </IdDoc>
      <Emisor>
        <RUCEmisor>${company.rut}</RUCEmisor>
        <RznSoc>${company.razonSocial}</RznSoc>
        <NomComercial>${company.nombreComercial || company.razonSocial}</NomComercial>
        <DomFiscal>${company.direccion}</DomFiscal>
        <Ciudad>${company.ciudad}</Ciudad>
        <CodPaisEmisor>UY</CodPaisEmisor>
        <Sucursal>${company.sucursal}</Sucursal>
        <EmiSucursal>${company.establecimiento}</EmiSucursal>
      </Emisor>
      <Receptor>
        <TipoDocRecep>${tipoDocRecep}</TipoDocRecep>
        <CodPaisRecep>UY</CodPaisRecep>
        <DocRecep>${client.documentNumber}</DocRecep>
        <RznSocRecep>${client.fullName}</RznSocRecep>
        <DirRecep>${client.address || "S/D"}</DirRecep>
        <CiudadRecep>${client.address || "S/D"}</CiudadRecep>
        <TelRecep>${client.phone || ""}</TelRecep>
      </Receptor>
      <Totales>
        <TpoMoneda>${invoice.moneda}</TpoMoneda>
        <MntNoGrvd>${invoice.subTotalNoGravado.toFixed(2)}</MntNoGrvd>
        <MntIVATasaMin>${invoice.totalIvaMinima.toFixed(2)}</MntIVATasaMin>
        <MntIVATasaBas>${invoice.totalIvaBasica.toFixed(2)}</MntIVATasaBas>
        <MntTotal>${invoice.total.toFixed(2)}</MntTotal>
        <CantLinDet>${details.length}</CantLinDet>
      </Totales>
    </Encabezado>
    <Detalle>${lines}
    </Detalle>
  </EFact>
</CFE>`;
}

// ─────────────────────────────────────────────────────────────
// Empresa Fiscal
// ─────────────────────────────────────────────────────────────
export async function getCompanyFiscal() {
  try {
    return await prisma.companyFiscal.findFirst({ orderBy: { createdAt: "asc" } });
  } catch {
    return null;
  }
}

export async function upsertCompanyFiscal(data: {
  rut: string; razonSocial: string; nombreComercial?: string;
  direccion: string; ciudad: string; telefono?: string; email?: string;
  sucursal?: string; establecimiento?: string; seriePorDefecto?: string; ambiente?: string;
}) {
  try {
    const existing = await prisma.companyFiscal.findFirst();
    const company = existing
      ? await prisma.companyFiscal.update({ where: { id: existing.id }, data: { ...data, updatedAt: new Date() } })
      : await prisma.companyFiscal.create({ data });
    revalidatePath("/dashboard/billing");
    return { success: true, data: company };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// Numeración secuencial atómica
// ─────────────────────────────────────────────────────────────
async function getNextNumber(tx: any, companyId: string, serie: string, tipo: any) {
  const seq = await tx.invoiceSequence.upsert({
    where: { companyId_serie_tipoDocumento: { companyId, serie, tipoDocumento: tipo } },
    create: { companyId, serie, tipoDocumento: tipo, ultimoNumero: 1 },
    update: { ultimoNumero: { increment: 1 } },
  });
  return seq.ultimoNumero;
}

// ─────────────────────────────────────────────────────────────
// createInvoice — genera factura completa con CAE simulado
// ─────────────────────────────────────────────────────────────
export async function createInvoice(data: {
  clientId: string;
  paymentId?: string;
  loanId?: string;
  installmentId?: string;
  tipoDocumento?: any;
  moneda?: string;
  details: Array<{ concepto: string; cantidad: number; precioUnit: number; ivaRate: number }>;
  notas?: string;
}) {
  try {
    const company = await prisma.companyFiscal.findFirst();
    if (!company) {
      return { success: false, error: "No hay empresa fiscal configurada. Configure los datos fiscales primero." };
    }

    const tipo  = data.tipoDocumento || "E_TICKET";
    const serie = company.seriePorDefecto;

    const invoice = await prisma.$transaction(async (tx) => {
      const numero = await getNextNumber(tx, company.id, serie, tipo);

      // Calcular montos
      let subTotalNoGravado = 0;
      let baseIvaBasica = 0;
      let baseIvaMinima = 0;

      const detailsCalc = data.details.map((d, i) => {
        const importe = roundAmount(d.cantidad * d.precioUnit);
        let ivaImporte = 0;
        if (d.ivaRate === 22) {
          const base = roundAmount(importe / 1.22);
          ivaImporte = roundAmount(importe - base);
          baseIvaBasica = roundAmount(baseIvaBasica + base);
        } else if (d.ivaRate === 10) {
          const base = roundAmount(importe / 1.10);
          ivaImporte = roundAmount(importe - base);
          baseIvaMinima = roundAmount(baseIvaMinima + base);
        } else {
          subTotalNoGravado = roundAmount(subTotalNoGravado + importe);
        }
        return { concepto: d.concepto, cantidad: d.cantidad, precioUnit: d.precioUnit, importe, ivaRate: d.ivaRate, ivaImporte, orden: i + 1 };
      });

      const totalIvaBasica  = roundAmount(baseIvaBasica * 0.22);
      const totalIvaMinima  = roundAmount(baseIvaMinima * 0.10);
      const subTotalGravado = roundAmount(baseIvaBasica + baseIvaMinima);
      const totalIva        = roundAmount(totalIvaBasica + totalIvaMinima);
      const total           = roundAmount(subTotalNoGravado + subTotalGravado + totalIva);

      // Crear factura
      const inv = await tx.invoice.create({
        data: {
          serie, numero,
          numeroFormateado: buildNumeroFormateado(serie, numero),
          tipoDocumento: tipo,
          companyId: company.id,
          clientId: data.clientId,
          paymentId: data.paymentId,
          loanId: data.loanId,
          installmentId: data.installmentId,
          moneda: data.moneda || "UYU",
          subTotalGravado, subTotalNoGravado, totalIvaBasica, totalIvaMinima, totalIva, total,
          estadoDgi: "PENDIENTE",
          notas: data.notas,
          details: { create: detailsCalc },
        },
        include: { details: true, client: true },
      });

      // Generar XML
      const xml = generateXml({ company, client: inv.client, invoice: inv, details: inv.details });

      // Simular respuesta DGI localmente
      const dgiResp = simulateDgiLocal(tipo, serie, numero);

      // Actualizar con CAE y XML
      const updated = await tx.invoice.update({
        where: { id: inv.id },
        data: {
          xmlGenerado: xml,
          cae: dgiResp.cae,
          codigoSeguridad: dgiResp.codigoSeguridad,
          fechaVencimientoCae: dgiResp.fechaVencimientoCae,
          estadoDgi: dgiResp.estadoDgi,
          respuestaDgi: dgiResp.respuestaDgi,
        },
        include: { details: true, client: true, company: true },
      });

      // Serialize for return
      return {
        ...updated,
        total: updated.total.toString(),
        subTotalGravado: updated.subTotalGravado.toString(),
        subTotalNoGravado: updated.subTotalNoGravado.toString(),
        totalIvaBasica: updated.totalIvaBasica.toString(),
        totalIvaMinima: updated.totalIvaMinima.toString(),
        totalIva: updated.totalIva.toString(),
        details: updated.details.map((d: any) => ({
          ...d,
          precioUnit: d.precioUnit.toString(),
          importe: d.importe.toString(),
          ivaImporte: d.ivaImporte.toString()
        }))
      };
    });

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/payments");

    return { success: true, data: invoice };
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return { success: false, error: error.message || "Error al generar la factura." };
  }
}

// ─────────────────────────────────────────────────────────────
// getInvoices — listado paginado con filtros
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export async function getInvoices(page = 1, filters?: { clientId?: string; estadoDgi?: string; search?: string }) {
  try {
    const skip = (page - 1) * PAGE_SIZE;
    const where: any = {};
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.estadoDgi) where.estadoDgi = filters.estadoDgi;
    if (filters?.search) {
      where.OR = [
        { numeroFormateado: { contains: filters.search, mode: "insensitive" } },
        { client: { fullName: { contains: filters.search, mode: "insensitive" } } },
        { cae: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        include: { client: true, details: true },
        orderBy: { fecha: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    const invoicesMapped = invoices.map((inv: any) => ({
      ...inv,
      total: inv.total.toString(),
      subTotalGravado: inv.subTotalGravado.toString(),
      subTotalNoGravado: inv.subTotalNoGravado.toString(),
      totalIvaBasica: inv.totalIvaBasica.toString(),
      totalIvaMinima: inv.totalIvaMinima.toString(),
      totalIva: inv.totalIva.toString(),
      details: inv.details.map((d: any) => ({
        ...d,
        precioUnit: d.precioUnit.toString(),
        importe: d.importe.toString(),
        ivaImporte: d.ivaImporte.toString()
      }))
    }));

    return { invoices: invoicesMapped, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return { invoices: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };
  }
}
export async function getInvoiceById(id: string) {
  try {
    const inv: any = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: true,
        details: { orderBy: { orden: "asc" } },
        payment: {
          select: {
            id: true, totalAmount: true, method: true, paymentDate: true,
            installment: { select: { number: true, loan: { select: { id: true, totalAmount: true, termCount: true } } } }
          },
        },
      },
    });

    if (!inv) return null;

    // Serialize Decimal to string
    return {
      ...inv,
      total: inv.total.toString(),
      subTotalGravado: inv.subTotalGravado.toString(),
      subTotalNoGravado: inv.subTotalNoGravado.toString(),
      totalIvaBasica: inv.totalIvaBasica.toString(),
      totalIvaMinima: inv.totalIvaMinima.toString(),
      totalIva: inv.totalIva.toString(),
      details: inv.details.map((d: any) => ({
        ...d,
        precioUnit: d.precioUnit.toString(),
        importe: d.importe.toString(),
        ivaImporte: d.ivaImporte.toString()
      })),
      payment: inv.payment ? {
        ...inv.payment,
        totalAmount: inv.payment.totalAmount.toString(),
        installment: inv.payment.installment ? {
          ...inv.payment.installment,
          loan: inv.payment.installment.loan ? {
            ...inv.payment.installment.loan,
            totalAmount: inv.payment.installment.loan.totalAmount.toString()
          } : null
        } : null
      } : null
    };
  } catch (error) {
    console.error("Error fetching invoice by id:", error);
    return null;
  }
}

export async function anularInvoice(id: string) {
  try {
    await prisma.invoice.update({ where: { id }, data: { estado: "ANULADA", estadoDgi: "CONTINGENCIA" } });
    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// createInvoiceFromPayment
// Llamado automáticamente desde processPayment.
// Vincula: pago → cuota → préstamo → cliente → empresa fiscal
// Genera las líneas de detalle en formato DGI:
//   Línea 1 — Capital (no gravado)
//   Línea 2 — Interés Financiación 22% IVA
//   Línea 3 — MORA 22% IVA (si aplica)
// ─────────────────────────────────────────────────────────────
export async function createInvoiceFromPayment(paymentId: string) {
  try {
    // 1. Cargar todos los datos vinculados al pago
    const payment: any = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        allocations: {
          include: {
            installment: true
          }
        },
        installment: {
          include: {
            loan: {
              include: {
                client: {
                  select: {
                    id: true,
                    fullName: true,
                    documentNumber: true,
                    documentType: true,
                    phone: true,
                    address: true,
                  }
                },
              },
            },
          },
        },
      },
    });

    if (!payment) return { success: false, error: "Pago no encontrado" };

    const installment = payment.installment;
    const loan        = installment.loan;
    const client      = loan.client;

    // Sucursal desde la empresa fiscal configurada
    const company = await prisma.companyFiscal.findFirst({
      select: { sucursal: true }
    });
    const sucNum = company?.sucursal || "001";

    // 2. Descomponer el pago en Capital + Interés proporcionados al total pagado
    const cuotaNominal        = Number(installment.totalAmount);
    const capitalProporcional = Number(loan.principalAmount) / loan.termCount;
    const totalPagado         = Number(payment.totalAmount);
    
    // Calculamos el equivalente en cuotas que está abonando (puede ser > 1 si paga varias o salda deuda)
    const factorPago = totalPagado / cuotaNominal;

    const capitalEfectivo = roundAmount(capitalProporcional * factorPago);
    // El resto del importe se toma como Interés (así cuadran los totales al centavo)
    const interesEfectivo = roundAmount(totalPagado - capitalEfectivo);

    // 3. Referencias para los conceptos del comprobante
    const loanRef    = loan.id.substring(0, 8).toUpperCase();
    const vtoStr     = new Date(installment.dueDate).toLocaleDateString("es-UY", {
      day: "2-digit", month: "2-digit", year: "2-digit"
    });
    const cuotaLabel = `${installment.number}/${loan.termCount}`;

    // 4. Armar líneas de detalle
    const details: any[] = [];

    if (payment.allocations && payment.allocations.length > 0) {
      // Use real allocations for detailing
      for (const alloc of payment.allocations) {
        const inst = alloc.installment;
        const prefix = `Cuota ${inst.number}/${loan.termCount} | `;
        
        if (alloc.capital > 0) {
          details.push({
            concepto  : `${prefix}Suc. ${sucNum} Capital cobrado`,
            cantidad  : 1,
            precioUnit: alloc.capital,
            ivaRate   : 0,
          });
        }
        if (alloc.interest > 0) {
          details.push({
            concepto  : `${prefix}Inter\u00e9s Financiaci\u00f3n (alloc)`,
            cantidad  : 1,
            precioUnit: alloc.interest,
            ivaRate   : 22,
          });
        }
        if (alloc.mora > 0) {
          details.push({
            concepto  : `${prefix}Recargo por Mora`,
            cantidad  : 1,
            precioUnit: alloc.mora + alloc.ivaMora,
            ivaRate   : 22,
          });
        }
      }
    } else {
      // Fallback to legacy calculation
      if (capitalEfectivo > 0) {
        details.push({
          concepto  : `Suc. ${sucNum} P/A N\u00ba ${loanRef} Vto ${vtoStr} Capital cobrado`,
          cantidad  : 1,
          precioUnit: capitalEfectivo,
          ivaRate   : 0,   // Capital no gravado
        });
      }

      if (interesEfectivo > 0) {
        details.push({
          concepto  : `Inter\u00e9s Financiaci\u00f3n`,
          cantidad  : 1,
          precioUnit: interesEfectivo,
          ivaRate   : 22,  // IVA Básica 22%
        });
      }
    }

    if (details.length === 0) {
      return { success: false, error: "Pago de monto cero, no se genera factura." };
    }

    // 5. Tipo de documento según el tipo de documento del cliente
    const tipoDocumento = client.documentType === "RUT" ? "FACTURA_ELECTRONICA" : "E_TICKET";

    // 6. Nota descriptiva
    const notaAuto = `Pago autom\u00e1tico | Cuota ${cuotaLabel} | Pr\u00e9stamo: ${loanRef}`;

    // 7. Crear la factura vinculando todos los IDs
    return await createInvoice({
      clientId     : client.id,
      paymentId    : payment.id,
      loanId       : loan.id,
      installmentId: installment.id,
      tipoDocumento,
      moneda       : loan.currency === "USD" ? "USD" : "UYU",
      details,
      notas        : notaAuto,
    });

  } catch (error: any) {
    console.error("Error creating invoice from payment:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// getBillingStats — estadísticas del módulo
// ─────────────────────────────────────────────────────────────
export async function getBillingStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalMes, totalEmitidas, pendientes, company] = await Promise.all([
      prisma.invoice.aggregate({ where: { fecha: { gte: startOfMonth }, estado: "EMITIDA" }, _sum: { total: true }, _count: true }),
      prisma.invoice.count({ where: { estado: "EMITIDA" } }),
      prisma.invoice.count({ where: { estadoDgi: "PENDIENTE" } }),
      prisma.companyFiscal.findFirst({ select: { razonSocial: true, rut: true } }),
    ]);
    return {
      totalMes: (totalMes._sum.total ?? 0).toString(),
      facturasMes: totalMes._count,
      totalEmitidas,
      pendientes,
      empresa: company,
    };
  } catch {
    return { totalMes: 0, facturasMes: 0, totalEmitidas: 0, pendientes: 0, empresa: null };
  }
}

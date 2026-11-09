import { DocumentoDTE, ItemCuerpo, ResumenDTE, TributoResumen } from '../types/dte';

/**
 * Motor Tributario Oficial para El Salvador
 * Precisión decimal estricta y cumplimiento normativo DGII
 */

export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function generateUUID(): string {
  // UUID v4 oficial con caracteres en MAYÚSCULAS
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

export function formatNumeroControl(
  tipoDte: string,
  establecimiento: string,
  puntoVenta: string,
  correlativo: number
): string {
  const est = establecimiento.padStart(4, '0').slice(-4);
  const pv = puntoVenta.padStart(4, '0').slice(-4);
  const corr = correlativo.toString().padStart(15, '0').slice(-15);
  return `DTE-${tipoDte}-${est}${pv}-${corr}`;
}

export function calculateDTEResumen(
  tipoDte: string,
  items: ItemCuerpo[],
  condicionOperacion: number = 1,
  aplicaRetencion1: boolean = false,
  aplicaRenta10: boolean = false
): ResumenDTE {
  let totalNoSuj = 0;
  let totalExenta = 0;
  let totalGravada = 0;
  let totalDescu = 0;

  for (const it of items) {
    totalNoSuj += it.ventaNoSuj || 0;
    totalExenta += it.ventaExenta || 0;
    totalGravada += it.ventaGravada || 0;
    totalDescu += it.montoDescu || 0;
  }

  totalNoSuj = round(totalNoSuj);
  totalExenta = round(totalExenta);
  totalGravada = round(totalGravada);
  totalDescu = round(totalDescu);

  const subTotalVentas = round(totalNoSuj + totalExenta + totalGravada);

  let ivaCalculado = 0;
  const tributos: TributoResumen[] = [];

  // En Comprobante de Crédito Fiscal (03), el IVA del 13% es sobre la base gravada y se desglosa
  if (tipoDte === '03') {
    ivaCalculado = round(totalGravada * 0.13);
    tributos.push({
      codigo: '20',
      descripcion: 'Impuesto al Valor Agregado 13%',
      valor: ivaCalculado,
    });
  }

  const subTotal = round(subTotalVentas + ivaCalculado);

  // Retención 1% IVA (si aplica por Gran Contribuyente en compras >= $100)
  let ivaRete1 = 0;
  if (aplicaRetencion1 && totalGravada >= 100) {
    ivaRete1 = round(totalGravada * 0.01);
  }

  // Retención 10% Renta (Factura de Sujeto Excluido 14)
  let reteRenta = 0;
  if (aplicaRenta10 || tipoDte === '14') {
    reteRenta = round(subTotalVentas * 0.10);
  }

  const montoTotalOperacion = subTotal;
  const totalPagar = round(subTotal - ivaRete1 - reteRenta);

  return {
    totalNoSuj,
    totalExenta,
    totalGravada,
    subTotalVentas,
    descuNoSuj: 0,
    descuExenta: 0,
    descuGravada: 0,
    porcMntDescu: 0,
    totalDescu,
    tributos: tributos.length > 0 ? tributos : undefined,
    subTotal,
    ivaRete1,
    reteRenta,
    montoTotalOperacion,
    totalNoGravado: 0,
    totalPagar,
    totalLetras: numeroALetras(totalPagar),
    saldoFavor: 0,
    condicionOperacion,
    pagos: [
      {
        codigo: '01',
        montoPago: totalPagar,
      },
    ],
  };
}

export function numeroALetras(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const centavosStr = centavos.toString().padStart(2, '0');

  const letras = convertirEnteroALetras(entero);
  return `SON: ${letras.trim()} ${centavosStr}/100 DÓLARES`;
}

function convertirEnteroALetras(n: number): string {
  if (n === 0) return 'CERO';
  if (n < 0) return 'MENOS ' + convertirEnteroALetras(-n);

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (n < 10) return unidades[n];
  if (n >= 10 && n < 20) return especiales[n - 10];
  if (n >= 20 && n < 30) {
    if (n === 20) return 'VEINTE';
    return 'VEINTI' + unidades[n - 20];
  }
  if (n >= 30 && n < 100) {
    const u = n % 10;
    const d = Math.floor(n / 10);
    return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`;
  }
  if (n === 100) return 'CIEN';
  if (n > 100 && n < 1000) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    return resto === 0 ? (c === 1 ? 'CIEN' : centenas[c]) : `${centenas[c]} ${convertirEnteroALetras(resto)}`;
  }
  if (n >= 1000 && n < 1000000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const milesStr = miles === 1 ? 'MIL' : `${convertirEnteroALetras(miles)} MIL`;
    return resto === 0 ? milesStr : `${milesStr} ${convertirEnteroALetras(resto)}`;
  }
  if (n >= 1000000 && n < 1000000000) {
    const millones = Math.floor(n / 1000000);
    const resto = n % 1000000;
    const millonesStr = millones === 1 ? 'UN MILLÓN' : `${convertirEnteroALetras(millones)} MILLONES`;
    return resto === 0 ? millonesStr : `${millonesStr} ${convertirEnteroALetras(resto)}`;
  }

  return n.toString();
}

export function validateDTEDocument(doc: DocumentoDTE): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!doc.identificacion.codigoGeneracion) {
    errors.push('El código de generación UUID es obligatorio.');
  }
  if (!doc.identificacion.numeroControl || !doc.identificacion.numeroControl.startsWith('DTE-')) {
    errors.push('El número de control debe cumplir el estándar DTE-XX-XXXX-XXXXXXXXXXXXXXX.');
  }
  if (!doc.emisor.nit || doc.emisor.nit.length < 9) {
    errors.push('El NIT del emisor es obligatorio.');
  }
  if (!doc.emisor.nrc) {
    errors.push('El NRC del emisor es obligatorio.');
  }
  if (doc.identificacion.tipoDte === '03' && (!doc.receptor.nrc || doc.receptor.nrc.trim() === '')) {
    errors.push('El NRC del receptor es requerido para Comprobante de Crédito Fiscal (03).');
  }
  if (!doc.cuerpoDocumento || doc.cuerpoDocumento.length === 0) {
    errors.push('El comprobante debe contener al menos una línea de ítem.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

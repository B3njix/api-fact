/**
 * Definiciones y Catálogos Oficiales de Facturación Electrónica (DTE) de El Salvador
 * Ministerio de Hacienda — DGII
 */

export interface Direccion {
  departamento: string; // CAT-012 (ej. "06" San Salvador)
  municipio: string;    // CAT-013 (ej. "14" San Salvador)
  complemento: string;
}

export interface Emisor {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;   // CAT-019
  descActividad: string;
  nombreComercial?: string;
  tipoEstablecimiento: string; // CAT-008 ("01" Casa Matriz, "02" Sucursal)
  direccion: Direccion;
  telefono: string;
  correo: string;
  codEstableMH?: string;
  codPuntoVentaMH?: string;
}

export interface Receptor {
  tipoDocumento?: string; // CAT-022 ("36" NIT, "13" DUI, "37" Otro, "03" Pasaporte)
  numDocumento?: string;
  nrc?: string;           // Obligatorio en CCFE (03)
  nombre: string;
  codActividad?: string;
  descActividad?: string;
  direccion?: Direccion;
  telefono?: string;
  correo: string;
}

export interface ItemCuerpo {
  numItem: number;
  tipoItem: number;       // CAT-011 (1: Bienes, 2: Servicios)
  cantidad: number;
  codigo?: string;
  uniMedida: number;      // CAT-014 (59: Unidad)
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos?: string[];    // ["20"] para IVA
}

export interface TributoResumen {
  codigo: string;
  descripcion: string;
  valor: number;
}

export interface PagoResumen {
  codigo: string;         // CAT-017 (01: Billetes/Efectivo, 02: Tarjeta Débito/Crédito, etc.)
  montoPago: number;
  referencia?: string;
  plazo?: string;
  periodo?: number;
}

export interface ResumenDTE {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  porcMntDescu: number;
  totalDescu: number;
  tributos?: TributoResumen[];
  subTotal: number;
  ivaRete1: number;
  reteRenta: number;
  montoTotalOperacion: number;
  totalNoGravado: number;
  totalPagar: number;
  totalLetras: string;
  saldoFavor: number;
  condicionOperacion: number; // CAT-016 (1: Contado, 2: Crédito)
  pagos?: PagoResumen[];
}

export interface IdentificacionDTE {
  version: number;
  ambiente: '00' | '01'; // '00' Sandbox, '01' Produccion
  tipoDte: string;       // CAT-002 ('01', '03', '05', '14', etc.)
  numeroControl: string; // DTE-XX-XXXX-XXXXXXXXXXXXXXX
  codigoGeneracion: string; // UUID v4 en mayúsculas
  tipoModelo: number;    // 1: Previo, 2: Diferido
  tipoOperacion: number; // 1: Normal, 2: Contingencia
  fecEmi: string;        // YYYY-MM-DD
  horEmi: string;        // HH:mm:ss
  tipoMoneda: string;    // "USD"
  tipoContingencia?: number;
  motivoContin?: string;
}

export interface DocumentoDTE {
  identificacion: IdentificacionDTE;
  emisor: Emisor;
  receptor: Receptor;
  cuerpoDocumento: ItemCuerpo[];
  resumen: ResumenDTE;
}

export type EstadoDTE = 'BORRADOR' | 'FIRMADO' | 'TRANSMITIDO' | 'PROCESADO' | 'RECHAZADO' | 'INVALIDADO';

export interface DTERecord {
  id: string;
  tenantId: string;
  ambiente: '00' | '01';
  tipoDte: string;
  codigoGeneracion: string;
  numeroControl: string;
  fechaEmision: string;
  horaEmision: string;
  receptorNombre: string;
  receptorNumDoc?: string;
  receptorCorreo?: string;
  totalPagar: number;
  totalGravada: number;
  totalIva: number;
  estado: EstadoDTE;
  selloRecibido?: string;
  fhProcesamiento?: string;
  codigoMsg?: string;
  descripcionMsg?: string;
  observaciones?: string[];
  dteJson: DocumentoDTE;
  jwsFirmado?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  nit: string;
  nrc: string;
  nombre: string;
  nombreComercial: string;
  codActividad: string;
  descActividad: string;
  correo: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  ambiente: '00' | '01';
  establecimientoCodigo: string;
  puntoVentaCodigo: string;
}

export interface ApiKeyItem {
  id: string;
  tenantId: string;
  nombre: string;
  keyPrefix: string;
  keySecret?: string; // Solo visible al crearse
  ambiente: '00' | '01';
  permisos: string[];
  ultimoUso?: string;
  activo: boolean;
  createdAt: string;
}

export interface WebhookItem {
  id: string;
  tenantId: string;
  url: string;
  eventos: string[];
  activo: boolean;
  createdAt: string;
  ultimoEstado?: 'SUCCESS' | 'FAILED';
  ultimoEnvio?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  usuarioOApiKey: string;
  ip: string;
  accion: string;
  recursoTipo: string;
  recursoId: string;
  detalles?: string;
}

export interface SandboxConfig {
  latenciaMs: number;
  simularError500: boolean;
  simularTimeout: boolean;
  simularRechazoMatematico: boolean;
  simularFalloFirma: boolean;
}

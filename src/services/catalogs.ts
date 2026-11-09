/**
 * Catálogos Oficiales del Ministerio de Hacienda de El Salvador
 */

export interface CatalogOption {
  codigo: string;
  descripcion: string;
}

export const CAT_002_TIPOS_DTE: CatalogOption[] = [
  { codigo: '01', descripcion: 'Factura Electrónica (FE)' },
  { codigo: '03', descripcion: 'Comprobante de Crédito Fiscal (CCFE)' },
  { codigo: '04', descripcion: 'Nota de Remisión (NRE)' },
  { codigo: '05', descripcion: 'Nota de Crédito (NCE)' },
  { codigo: '06', descripcion: 'Nota de Débito (NDE)' },
  { codigo: '07', descripcion: 'Comprobante de Retención (CRE)' },
  { codigo: '08', descripcion: 'Comprobante de Liquidación (CLE)' },
  { codigo: '09', descripcion: 'Documento Contable de Liquidación (DCLE)' },
  { codigo: '11', descripcion: 'Factura de Exportación (FEXE)' },
  { codigo: '14', descripcion: 'Factura de Sujeto Excluido (FSEE)' },
  { codigo: '15', descripcion: 'Comprobante de Donación (CDE)' },
];

export const CAT_012_DEPARTAMENTOS: CatalogOption[] = [
  { codigo: '01', descripcion: 'Ahuachapán' },
  { codigo: '02', descripcion: 'Santa Ana' },
  { codigo: '03', descripcion: 'Sonsonate' },
  { codigo: '04', descripcion: 'Chalatenango' },
  { codigo: '05', descripcion: 'La Libertad' },
  { codigo: '06', descripcion: 'San Salvador' },
  { codigo: '07', descripcion: 'Cuscatlán' },
  { codigo: '08', descripcion: 'La Paz' },
  { codigo: '09', descripcion: 'Cabañas' },
  { codigo: '10', descripcion: 'San Vicente' },
  { codigo: '11', descripcion: 'Usulután' },
  { codigo: '12', descripcion: 'San Miguel' },
  { codigo: '13', descripcion: 'Morazán' },
  { codigo: '14', descripcion: 'La Unión' },
];

export const CAT_013_MUNICIPIOS: Record<string, CatalogOption[]> = {
  '06': [
    { codigo: '14', descripcion: 'San Salvador Centro' },
    { codigo: '15', descripcion: 'San Salvador Este' },
    { codigo: '16', descripcion: 'San Salvador Oeste' },
    { codigo: '17', descripcion: 'San Salvador Norte' },
    { codigo: '18', descripcion: 'San Salvador Sur' },
    { codigo: '01', descripcion: 'Antiguo Cuscatlán' },
  ],
  '05': [
    { codigo: '01', descripcion: 'Santa Tecla' },
    { codigo: '02', descripcion: 'Antiguo Cuscatlán' },
    { codigo: '03', descripcion: 'Colón' },
  ],
};

export const CAT_017_FORMAS_PAGO: CatalogOption[] = [
  { codigo: '01', descripcion: 'Billetes y monedas (Efectivo)' },
  { codigo: '02', descripcion: 'Tarjeta de Débito' },
  { codigo: '03', descripcion: 'Tarjeta de Crédito' },
  { codigo: '05', descripcion: 'Transferencia electrónica (Bancaria / Chivo Wallet)' },
  { codigo: '08', descripcion: 'Cheque' },
  { codigo: '99', descripcion: 'Otros medios de pago' },
];

export const CAT_019_ACTIVIDADES_ECONOMICAS: CatalogOption[] = [
  { codigo: '93110', descripcion: 'Gestión de instalaciones deportivas y acondicionamiento físico (Gimnasios)' },
  { codigo: '62010', descripcion: 'Actividades de programación informática y desarrollo de software' },
  { codigo: '47111', descripcion: 'Venta al por menor en comercios no especializados' },
  { codigo: '47711', descripcion: 'Venta al por menor de prendas de vestir y calzado deportivo' },
  { codigo: '70200', descripcion: 'Actividades de consultoría de gestión empresarial' },
  { codigo: '85590', descripcion: 'Otros tipos de enseñanza y entrenamiento personal' },
];

export const CAT_022_TIPOS_DOCUMENTO: CatalogOption[] = [
  { codigo: '36', descripcion: 'NIT' },
  { codigo: '13', descripcion: 'DUI (Documento Único de Identidad)' },
  { codigo: '03', descripcion: 'Pasaporte' },
  { codigo: '02', descripcion: 'Carné de Residencia' },
  { codigo: '37', descripcion: 'Otro' },
];

export const CAT_024_MOTIVOS_INVALIDACION: CatalogOption[] = [
  { codigo: '1', descripcion: 'Rescisión del contrato o acuerdo de la operación' },
  { codigo: '2', descripcion: 'Rescisión parcial o devolución de mercadería' },
  { codigo: '3', descripcion: 'Error en la información del documento tributario electrónico' },
];

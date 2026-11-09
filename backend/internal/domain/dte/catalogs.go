package dte

// Catálogos Oficiales del Ministerio de Hacienda de El Salvador para DTE

// CAT-002: Tipos de Documento Tributario Electrónico
const (
	TipoDTEFactura                  = "01" // FE - Factura
	TipoDTECreditoFiscal            = "03" // CCFE - Comprobante de Crédito Fiscal
	TipoDTENotaRemision             = "04" // NRE - Nota de Remisión
	TipoDTENotaCredito              = "05" // NCE - Nota de Crédito
	TipoDTENotaDebito               = "06" // NDE - Nota de Débito
	TipoDTERetencion                = "07" // CRE - Comprobante de Retención
	TipoDTELiquidacion              = "08" // CLE - Comprobante de Liquidación
	TipoDTEDocContableLiquidacion   = "09" // DCLE - Documento Contable de Liquidación
	TipoDTEFacturaExportacion       = "11" // FEXE - Factura de Exportación
	TipoDTESujetoExcluido           = "14" // FSEE - Factura de Sujeto Excluido
	TipoDTEDonacion                 = "15" // CDE - Comprobante de Donación
)

// CAT-001: Ambiente de Destino
const (
	AmbienteSandbox    = "00" // Pruebas / Simulador
	AmbienteProduccion = "01" // Producción oficial
)

// CAT-003: Modelo de Facturación
const (
	ModeloPrevio   = 1 // Facturación previa a la entrega
	ModeloDiferido = 2 // Facturación posterior a la entrega
)

// CAT-004: Tipo de Transmisión
const (
	TransmisionNormal       = 1
	TransmisionContingencia = 2
)

// CAT-011: Tipo de Ítem
const (
	ItemBienes             = 1
	ItemServicios          = 2
	ItemBienesYServicios   = 3
	ItemTributosOtro       = 4
)

// CAT-015: Condición de la Operación
const (
	CondicionContado = 1
	CondicionCredito = 2
	CondicionOtro    = 3
)

// CAT-016: Tipos de Tributo
const (
	TributoIVA             = "20" // Impuesto al Valor Agregado 13%
	TributoFOVIAL          = "C8" // Fondo de Conservación Vial ($0.20/galón)
	TributoCOTRANS         = "D1" // Compensación Cotransporte ($0.10/galón)
	TributoTurismoPernocta = "59" // Turismo 5%
	TributoBebidas         = "C5" // Advalorem bebidas alcohólicas
)

// CAT-022: Tipo de Documento de Identificación del Receptor
const (
	DocIdentNIT        = "36"
	DocIdentDUI        = "13"
	DocIdentPasaporte  = "03"
	DocIdentCarnetRes  = "02"
	DocIdentOtro       = "37"
)

// CAT-024: Tipo de Invalidación
const (
	InvalRescisionCompleta = 1
	InvalRescisionParcial  = 2
	InvalPorErrorEnDatos   = 3
)

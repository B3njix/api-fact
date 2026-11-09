package dte

import (
	"github.com/shopspring/decimal"
)

// Estructuras oficiales de Documentos Tributarios Electrónicos (DTE) de El Salvador

type Identificacion struct {
	Version         int     `json:"version"`
	Ambiente        string  `json:"ambiente"`        // '00' Sandbox, '01' Prod
	TipoDte         string  `json:"tipoDte"`         // '01', '03', etc.
	NumeroControl   string  `json:"numeroControl"`   // DTE-XX-XXXX-XXXXXXXXXXXXXXX
	CodigoGeneracion string `json:"codigoGeneracion"` // UUID v4 en mayúsculas
	TipoModelo      int     `json:"tipoModelo"`      // 1: Previo, 2: Diferido
	TipoOperacion   int     `json:"tipoOperacion"`   // 1: Normal, 2: Contingencia
	FecEmi          string  `json:"fecEmi"`          // YYYY-MM-DD
	HorEmi          string  `json:"horEmi"`          // HH:mm:ss
	TipoMoneda      string  `json:"tipoMoneda"`      // "USD"
	TipoContingencia *int   `json:"tipoContingencia,omitempty"`
	MotivoContin    *string `json:"motivoContin,omitempty"`
}

type Direccion struct {
	Departamento string `json:"departamento"` // CAT-012 (2 dígitos)
	Municipio    string `json:"municipio"`    // CAT-013 (2 dígitos)
	Complemento  string `json:"complemento"`
}

type Emisor struct {
	Nit                 string    `json:"nit"`
	Nrc                 string    `json:"nrc"`
	Nombre              string    `json:"nombre"`
	CodActividad        string    `json:"codActividad"`
	DescActividad       string    `json:"descActividad"`
	NombreComercial     string    `json:"nombreComercial,omitempty"`
	TipoEstablecimiento string    `json:"tipoEstablecimiento"` // '01' Casa matriz
	Direccion           Direccion `json:"direccion"`
	Telefono            string    `json:"telefono"`
	Correo              string    `json:"correo"`
	CodEstableMH        *string   `json:"codEstableMH,omitempty"`
	CodPuntoVentaMH     *string   `json:"codPuntoVentaMH,omitempty"`
}

type Receptor struct {
	TipoDocumento string    `json:"tipoDocumento,omitempty"` // CAT-022 ('36', '13', etc.)
	NumDocumento  string    `json:"numDocumento,omitempty"`
	Nrc           *string   `json:"nrc,omitempty"`           // Requerido en CCFE
	Nombre        string    `json:"nombre"`
	CodActividad  *string   `json:"codActividad,omitempty"`
	DescActividad *string   `json:"descActividad,omitempty"`
	Direccion     *Direccion `json:"direccion,omitempty"`
	Telefono      *string   `json:"telefono,omitempty"`
	Correo        string    `json:"correo"`
}

type ItemCuerpo struct {
	NumItem      int             `json:"numItem"`
	TipoItem     int             `json:"tipoItem"` // 1: Bienes, 2: Servicios
	Cantidad     decimal.Decimal `json:"cantidad"`
	Codigo       string          `json:"codigo,omitempty"`
	UniMedida    int             `json:"uniMedida"` // CAT-014 (59: Unidad)
	Descripcion  string          `json:"descripcion"`
	PrecioUni    decimal.Decimal `json:"precioUni"`
	MontoDescu   decimal.Decimal `json:"montoDescu"`
	VentaNoSuj   decimal.Decimal `json:"ventaNoSuj"`
	VentaExenta  decimal.Decimal `json:"ventaExenta"`
	VentaGravada decimal.Decimal `json:"ventaGravada"`
	Tributos     []string        `json:"tributos,omitempty"` // ["20"] para IVA
}

type TributoResumen struct {
	Codigo      string          `json:"codigo"`
	Descripcion string          `json:"descripcion"`
	Valor       decimal.Decimal `json:"valor"`
}

type PagoResumen struct {
	Codigo    string          `json:"codigo"` // CAT-017 (01: Billetes/Monedas, 02: Tarjeta, etc.)
	MontoPago decimal.Decimal `json:"montoPago"`
	Referencia *string        `json:"referencia,omitempty"`
	Plazo     *string         `json:"plazo,omitempty"`
	Periodo   *int            `json:"periodo,omitempty"`
}

type Resumen struct {
	TotalNoSuj          decimal.Decimal  `json:"totalNoSuj"`
	TotalExenta         decimal.Decimal  `json:"totalExenta"`
	TotalGravada        decimal.Decimal  `json:"totalGravada"`
	SubTotalVentas      decimal.Decimal  `json:"subTotalVentas"`
	DescuNoSuj          decimal.Decimal  `json:"descuNoSuj"`
	DescuExenta         decimal.Decimal  `json:"descuExenta"`
	DescuGravada        decimal.Decimal  `json:"descuGravada"`
	PorcMntDescu        decimal.Decimal  `json:"porcMntDescu"`
	TotalDescu          decimal.Decimal  `json:"totalDescu"`
	Tributos            []TributoResumen `json:"tributos,omitempty"`
	SubTotal            decimal.Decimal  `json:"subTotal"`
	IvaRete1            decimal.Decimal  `json:"ivaRete1"`
	ReteRenta           decimal.Decimal  `json:"reteRenta"`
	MontoTotalOperacion decimal.Decimal  `json:"montoTotalOperacion"`
	TotalNoGravado      decimal.Decimal  `json:"totalNoGravado"`
	TotalPagar          decimal.Decimal  `json:"totalPagar"`
	TotalLetras         string           `json:"totalLetras"`
	SaldoFavor          decimal.Decimal  `json:"saldoFavor"`
	CondicionOperacion  int              `json:"condicionOperacion"` // 1: Contado, 2: Crédito
	Pagos               []PagoResumen    `json:"pagos,omitempty"`
}

// DTE Estructura Estándar Oficial (Factura Electrónica y Crédito Fiscal)
type DocumentoDTE struct {
	Identificacion  Identificacion `json:"identificacion"`
	Emisor          Emisor         `json:"emisor"`
	Receptor        Receptor       `json:"receptor"`
	CuerpoDocumento []ItemCuerpo   `json:"cuerpoDocumento"`
	Resumen         Resumen        `json:"resumen"`
}

// Payload de Recepción para la API de Hacienda
type RecepcionDTEPayload struct {
	Ambiente         string `json:"ambiente"`
	IdEnvio          int64  `json:"idEnvio"`
	Version          int    `json:"version"`
	TipoDte          string `json:"tipoDte"`
	Documento        string `json:"documento"` // JWS firmado
	CodigoGeneracion string `json:"codigoGeneracion"`
}

// Respuesta oficial del Ministerio de Hacienda
type RecepcionDTEResponse struct {
	Version          int      `json:"version"`
	Ambiente         string   `json:"ambiente"`
	VersionApp       int      `json:"versionApp"`
	Estado           string   `json:"estado"` // "PROCESADO", "RECHAZADO"
	CodigoGeneracion string   `json:"codigoGeneracion"`
	SelloRecibido    string   `json:"selloRecibido,omitempty"`
	FhProcesamiento  string   `json:"fhProcesamiento"`
	ClasificaMsg     string   `json:"clasificaMsg"`
	CodigoMsg        string   `json:"codigoMsg"`
	DescripcionMsg   string   `json:"descripcionMsg"`
	Observaciones    []string `json:"observaciones"`
}

package dte

import (
	"errors"
	"fmt"
	"regexp"

	"github.com/shopspring/decimal"
)

var (
	uuidRegex = regexp.MustCompile(`^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$`)
	ctrlRegex = regexp.MustCompile(`^DTE-(01|03|04|05|06|07|08|09|11|14|15)-[0-9]{8}-[0-9]{15}$`)
)

type ValidationError struct {
	Campo   string `json:"campo"`
	Mensaje string `json:"mensaje"`
	Codigo  string `json:"codigo"`
}

func ValidateDTE(doc *DocumentoDTE) []ValidationError {
	var errs []ValidationError

	// 1. Identificación
	if !uuidRegex.MatchString(doc.Identificacion.CodigoGeneracion) {
		errs = append(errs, ValidationError{
			Campo:   "identificacion.codigoGeneracion",
			Mensaje: "El código de generación debe ser un UUID v4 en mayúsculas válido",
			Codigo:  "VAL_001",
		})
	}

	if !ctrlRegex.MatchString(doc.Identificacion.NumeroControl) {
		errs = append(errs, ValidationError{
			Campo:   "identificacion.numeroControl",
			Mensaje: "Formato de número de control inválido. Se espera DTE-XX-XXXXXXXX-XXXXXXXXXXXXXXX",
			Codigo:  "VAL_002",
		})
	}

	if doc.Identificacion.TipoMoneda != "USD" {
		errs = append(errs, ValidationError{
			Campo:   "identificacion.tipoMoneda",
			Mensaje: "El tipo de moneda debe ser USD",
			Codigo:  "VAL_003",
		})
	}

	// 2. Emisor
	if doc.Emisor.Nit == "" || len(doc.Emisor.Nit) < 9 {
		errs = append(errs, ValidationError{
			Campo:   "emisor.nit",
			Mensaje: "NIT de emisor requerido y con longitud válida",
			Codigo:  "VAL_010",
		})
	}
	if doc.Emisor.Nrc == "" {
		errs = append(errs, ValidationError{
			Campo:   "emisor.nrc",
			Mensaje: "NRC de emisor es obligatorio",
			Codigo:  "VAL_011",
		})
	}

	// 3. Receptor (especialmente en CCFE - 03)
	if doc.Identificacion.TipoDte == TipoDTECreditoFiscal {
		if doc.Receptor.Nrc == nil || *doc.Receptor.Nrc == "" {
			errs = append(errs, ValidationError{
				Campo:   "receptor.nrc",
				Mensaje: "NRC del receptor es obligatorio para Comprobante de Crédito Fiscal (03)",
				Codigo:  "VAL_020",
			})
		}
	}

	// 4. Ítems
	if len(doc.CuerpoDocumento) == 0 {
		errs = append(errs, ValidationError{
			Campo:   "cuerpoDocumento",
			Mensaje: "El documento debe contener al menos un ítem",
			Codigo:  "VAL_030",
		})
	}

	// 5. Coherencia Matemática
	calc := CalculateDTE(doc.Identificacion.TipoDte, doc.CuerpoDocumento, doc.Resumen.IvaRete1.GreaterThan(decimal.Zero), doc.Resumen.ReteRenta.GreaterThan(decimal.Zero))

	if !calc.TotalPagar.Equal(doc.Resumen.TotalPagar) {
		errs = append(errs, ValidationError{
			Campo:   "resumen.totalPagar",
			Mensaje: fmt.Sprintf("Incoherencia matemática en total a pagar: calculado %s vs declarado %s", calc.TotalPagar.StringFixed(2), doc.Resumen.TotalPagar.StringFixed(2)),
			Codigo:  "VAL_040",
		})
	}

	return errs
}

func EnsureValid(doc *DocumentoDTE) error {
	errs := ValidateDTE(doc)
	if len(errs) > 0 {
		return errors.New(errs[0].Mensaje)
	}
	return nil
}

package dte

import (
	"fmt"
	"strings"

	"github.com/shopspring/decimal"
)

// Calculator implementa cálculos tributarios oficiales con precisión decimal estricta.

type CalculationResult struct {
	TotalNoSuj          decimal.Decimal
	TotalExenta         decimal.Decimal
	TotalGravada        decimal.Decimal
	SubTotalVentas      decimal.Decimal
	TotalDescu          decimal.Decimal
	IvaCalculado        decimal.Decimal
	IvaRete1            decimal.Decimal
	ReteRenta           decimal.Decimal
	MontoTotalOperacion decimal.Decimal
	TotalPagar          decimal.Decimal
	TotalLetras         string
	Tributos            []TributoResumen
}

func CalculateDTE(tipoDte string, items []ItemCuerpo, aplicaRetencion1 bool, aplicaRenta10 bool) CalculationResult {
	totalNoSuj := decimal.Zero
	totalExenta := decimal.Zero
	totalGravada := decimal.Zero
	totalDescu := decimal.Zero

	twoDec := int32(2)

	for _, item := range items {
		totalNoSuj = totalNoSuj.Add(item.VentaNoSuj)
		totalExenta = totalExenta.Add(item.VentaExenta)
		totalGravada = totalGravada.Add(item.VentaGravada)
		totalDescu = totalDescu.Add(item.MontoDescu)
	}

	subTotalVentas := totalNoSuj.Add(totalExenta).Add(totalGravada)
	ivaCalculado := decimal.Zero
	var tributos []TributoResumen

	if tipoDte == TipoDTECreditoFiscal {
		// En CCFE el IVA (13%) se calcula sobre la base gravada neta y se desglosa
		ivaCalculado = totalGravada.Mul(decimal.NewFromFloat(0.13)).Round(twoDec)
		tributos = append(tributos, TributoResumen{
			Codigo:      TributoIVA,
			Descripcion: "Impuesto al Valor Agregado 13%",
			Valor:       ivaCalculado,
		})
	}

	subTotal := subTotalVentas.Add(ivaCalculado)

	// Retención 1% IVA (aplicable en CCFE si el receptor es Gran Contribuyente y venta >= $100)
	ivaRete1 := decimal.Zero
	if aplicaRetencion1 && totalGravada.GreaterThanOrEqual(decimal.NewFromInt(100)) {
		ivaRete1 = totalGravada.Mul(decimal.NewFromFloat(0.01)).Round(twoDec)
	}

	// Retención 10% Renta (Factura de Sujeto Excluido - 14)
	reteRenta := decimal.Zero
	if aplicaRenta10 || tipoDte == TipoDTESujetoExcluido {
		reteRenta = subTotalVentas.Mul(decimal.NewFromFloat(0.10)).Round(twoDec)
	}

	montoTotalOperacion := subTotal
	totalPagar := subTotal.Sub(ivaRete1).Sub(reteRenta).Round(twoDec)

	totalLetras := NumeroALetras(totalPagar)

	return CalculationResult{
		TotalNoSuj:          totalNoSuj.Round(twoDec),
		TotalExenta:         totalExenta.Round(twoDec),
		TotalGravada:        totalGravada.Round(twoDec),
		SubTotalVentas:      subTotalVentas.Round(twoDec),
		TotalDescu:          totalDescu.Round(twoDec),
		IvaCalculado:        ivaCalculado,
		IvaRete1:            ivaRete1,
		ReteRenta:           reteRenta,
		MontoTotalOperacion: montoTotalOperacion.Round(twoDec),
		TotalPagar:          totalPagar,
		TotalLetras:         totalLetras,
		Tributos:            tributos,
	}
}

// NumeroALetras convierte una cifra monetaria al formato legal exigido por el Ministerio de Hacienda:
// "SON: [CANTIDAD EN LETRAS] [CENTAVOS]/100 DÓLARES"
func NumeroALetras(n decimal.Decimal) string {
	intPart := n.IntPart()
	decPart := n.Sub(decimal.NewFromInt(intPart)).Mul(decimal.NewFromInt(100)).IntPart()

	centavosStr := fmt.Sprintf("%02d", decPart)
	letras := enteroALetras(intPart)

	return fmt.Sprintf("SON: %s %s/100 DÓLARES", strings.TrimSpace(letras), centavosStr)
}

func enteroALetras(n int64) string {
	if n == 0 {
		return "CERO"
	}
	if n < 0 {
		return "MENOS " + enteroALetras(-n)
	}

	unidades := []string{"", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"}
	especiales := []string{"DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"}
	decenas := []string{"", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"}
	centenas := []string{"", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"}

	if n < 10 {
		return unidades[n]
	}
	if n >= 10 && n < 20 {
		return especiales[n-10]
	}
	if n >= 20 && n < 30 {
		if n == 20 {
			return "VEINTE"
		}
		return "VEINTI" + unidades[n-20]
	}
	if n >= 30 && n < 100 {
		u := n % 10
		d := n / 10
		if u == 0 {
			return decenas[d]
		}
		return decenas[d] + " Y " + unidades[u]
	}
	if n == 100 {
		return "CIEN"
	}
	if n > 100 && n < 1000 {
		c := n / 100
		resto := n % 100
		if resto == 0 {
			if c == 1 {
				return "CIEN"
			}
			return centenas[c]
		}
		return centenas[c] + " " + enteroALetras(resto)
	}
	if n >= 1000 && n < 1000000 {
		miles := n / 1000
		resto := n % 1000
		milesStr := "MIL"
		if miles > 1 {
			milesStr = enteroALetras(miles) + " MIL"
		}
		if resto == 0 {
			return milesStr
		}
		return milesStr + " " + enteroALetras(resto)
	}
	if n >= 1000000 && n < 1000000000 {
		millones := n / 1000000
		resto := n % 1000000
		millonesStr := "UN MILLON"
		if millones > 1 {
			millonesStr = enteroALetras(millones) + " MILLONES"
		}
		if resto == 0 {
			return millonesStr
		}
		return millonesStr + " " + enteroALetras(resto)
	}

	return fmt.Sprintf("%d", n)
}

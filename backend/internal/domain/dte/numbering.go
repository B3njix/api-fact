package dte

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// GenerarCodigoGeneracion produce un UUID v4 canónico en mayúsculas según normativa MH:
// XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX
func GenerarCodigoGeneracion() string {
	return strings.ToUpper(uuid.New().String())
}

// FormatearNumeroControl compone la cadena oficial:
// DTE-{tipoDte}-{establecimiento4}{puntoVenta4}-{correlativo15}
// Ejemplo: DTE-01-00010001-000000000000042
func FormatearNumeroControl(tipoDte string, establecimiento string, puntoVenta string, correlativo int64) string {
	est := padLeft(establecimiento, 4, '0')
	pv := padLeft(puntoVenta, 4, '0')
	correl := fmt.Sprintf("%015d", correlativo)

	return fmt.Sprintf("DTE-%s-%s%s-%s", tipoDte, est, pv, correl)
}

func padLeft(s string, length int, pad byte) string {
	if len(s) >= length {
		return s[:length]
	}
	return strings.Repeat(string(pad), length-len(s)) + s
}

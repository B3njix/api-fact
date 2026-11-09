package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/chivodevs/api-fact/internal/domain/dte"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// Servidor Sandbox independiente que simula fielmente la API del Ministerio de Hacienda de El Salvador
func main() {
	port := os.Getenv("SANDBOX_PORT")
	if port == "" {
		port = "8085"
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 1. Simulación de Autenticación
	r.Post("/seguridad/autenticar", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			User string `json:"user"`
			Pwd  string `json:"pwd"`
		}
		json.NewDecoder(r.Body).Decode(&req)

		w.Header().Set("Content-Type", "application/json")
		if req.User == "" || req.Pwd == "" {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":  "ERROR",
				"message": "Credenciales inválidas en simulador sandbox",
			})
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "OK",
			"body": map[string]interface{}{
				"token": fmt.Sprintf("SANDBOX_JWT_%d", time.Now().Unix()),
				"user":  req.User,
				"roles": []string{"EMISOR_DTE"},
			},
		})
	})

	// 2. Simulación de Recepción DTE
	r.Post("/fesv/recepciondte", func(w http.ResponseWriter, r *http.Request) {
		var payload dte.RecepcionDTEPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"estado":         "RECHAZADO",
				"descripcionMsg": "Payload JSON malformado",
				"codigoMsg":      "999",
			})
			return
		}

		// Validar que se haya enviado firma
		if payload.Documento == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"estado":         "RECHAZADO",
				"descripcionMsg": "El documento no contiene firma electrónica JWS",
				"codigoMsg":      "004",
			})
			return
		}

		// Generar sello simulado
		sello := fmt.Sprintf("SIMULATED-MH-%s-%06d", time.Now().Format("20060102150405"), rand.Intn(999999))

		resp := dte.RecepcionDTEResponse{
			Version:          2,
			Ambiente:         "00",
			VersionApp:       2,
			Estado:           "PROCESADO",
			CodigoGeneracion: payload.CodigoGeneracion,
			SelloRecibido:    sello,
			FhProcesamiento:  time.Now().Format("02/01/2006 15:04:05"),
			ClasificaMsg:     "1",
			CodigoMsg:        "001",
			DescripcionMsg:   "RECIBIDO CON EXITO (SIMULADO - SANDBOX CHIVODEVS)",
			Observaciones:    []string{},
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	})

	log.Printf("Simulador Sandbox MH API-Fact corriendo en puerto %s...", port)
	http.ListenAndServe(":"+port, r)
}

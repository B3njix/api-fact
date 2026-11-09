package mh

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/chivodevs/api-fact/internal/domain/dte"
)

type MHClient struct {
	baseURL    string
	httpClient *http.Client
	userNIT    string
	apiKey     string
	token      string
	tokenExp   time.Time
}

func NewMHClient(baseURL string, userNIT string, apiKey string) *MHClient {
	return &MHClient{
		baseURL: baseURL,
		userNIT: userNIT,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// Autenticar obtiene un Bearer token desde la DGII de Hacienda.
func (c *MHClient) Autenticar(ctx context.Context) error {
	reqBody, _ := json.Marshal(map[string]string{
		"user": c.userNIT,
		"pwd":  c.apiKey,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/seguridad/autenticar", bytes.NewBuffer(reqBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("fallo de conexión con Hacienda: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error de autenticación con Hacienda, HTTP %d", resp.StatusCode)
	}

	var authResp struct {
		Status string `json:"status"`
		Body   struct {
			Token string `json:"token"`
		} `json:"body"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return err
	}

	c.token = authResp.Body.Token
	c.tokenExp = time.Now().Add(23 * time.Hour)
	return nil
}

// TransmitirDTE envía el documento firmado al endpoint de recepción.
func (c *MHClient) TransmitirDTE(ctx context.Context, payload dte.RecepcionDTEPayload) (*dte.RecepcionDTEResponse, error) {
	if c.token == "" || time.Now().After(c.tokenExp) {
		if err := c.Autenticar(ctx); err != nil {
			return nil, err
		}
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/fesv/recepciondte", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error de comunicación transmitiendo DTE: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var mhResp dte.RecepcionDTEResponse
	if err := json.Unmarshal(respBytes, &mhResp); err != nil {
		return nil, fmt.Errorf("respuesta inválida de Hacienda: %s", string(respBytes))
	}

	if resp.StatusCode != http.StatusOK && mhResp.Estado == "" {
		return nil, fmt.Errorf("error HTTP %d de Hacienda: %s", resp.StatusCode, string(respBytes))
	}

	return &mhResp, nil
}

// ConsultarDTE verifica el estado de un DTE previamente transmitido evitando reintentos ciegos.
func (c *MHClient) ConsultarDTE(ctx context.Context, codigoGeneracion string) (*dte.RecepcionDTEResponse, error) {
	if c.token == "" || time.Now().After(c.tokenExp) {
		if err := c.Autenticar(ctx); err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/fesv/consultadte/%s", c.baseURL, codigoGeneracion), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, errors.New("documento no encontrado en Hacienda")
	}

	var docResp dte.RecepcionDTEResponse
	if err := json.NewDecoder(resp.Body).Decode(&docResp); err != nil {
		return nil, err
	}

	return &docResp, nil
}

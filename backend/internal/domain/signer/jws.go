package signer

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha512"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
)

// Signer gestiona la firma criptográfica JWS RS512 (SHA512withRSA) exigida por el Ministerio de Hacienda.
type Signer struct {
	privateKey *rsa.PrivateKey
	certPEM    string
}

func NewSignerFromPEM(privateKeyPEM string, certPEM string, password string) (*Signer, error) {
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, errors.New("no se pudo decodificar el bloque PEM de la llave privada")
	}

	var der []byte
	var err error

	if x509.IsEncryptedPEMBlock(block) {
		der, err = x509.DecryptPEMBlock(block, []byte(password))
		if err != nil {
			return nil, fmt.Errorf("error al desencriptar llave privada: %w", err)
		}
	} else {
		der = block.Bytes
	}

	// Probar PKCS#8 o PKCS#1
	key, err := x509.ParsePKCS8PrivateKey(der)
	if err != nil {
		pkcs1Key, errPkcs1 := x509.ParsePKCS1PrivateKey(der)
		if errPkcs1 != nil {
			return nil, fmt.Errorf("formato de llave privada no soportado: %v", err)
		}
		return &Signer{privateKey: pkcs1Key, certPEM: certPEM}, nil
	}

	rsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("la llave privada no es de tipo RSA")
	}

	return &Signer{privateKey: rsaKey, certPEM: certPEM}, nil
}

// SignJWS firma un objeto DTE produciendo un token JWS compacto (header.payload.signature) con algoritmo RS512.
func (s *Signer) SignJWS(dtePayload interface{}) (string, error) {
	payloadBytes, err := json.Marshal(dtePayload)
	if err != nil {
		return "", fmt.Errorf("error serializando payload DTE: %w", err)
	}

	header := map[string]interface{}{
		"alg": "RS512",
		"typ": "JWT",
	}

	headerBytes, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	encodedHeader := base64.RawURLEncoding.EncodeToString(headerBytes)
	encodedPayload := base64.RawURLEncoding.EncodeToString(payloadBytes)

	signingInput := fmt.Sprintf("%s.%s", encodedHeader, encodedPayload)

	hashed := sha512.Sum512([]byte(signingInput))
	signature, err := rsa.SignPKCS1v15(rand.Reader, s.privateKey, crypto.SHA512, hashed[:])
	if err != nil {
		return "", fmt.Errorf("error calculando firma RSA-SHA512: %w", err)
	}

	encodedSignature := base64.RawURLEncoding.EncodeToString(signature)

	return fmt.Sprintf("%s.%s", signingInput, encodedSignature), nil
}

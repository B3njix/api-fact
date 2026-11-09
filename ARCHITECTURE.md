# API-Fact — Arquitectura del Sistema
**Propiedad de ChivoDevs** · Facturación Electrónica para El Salvador (Ministerio de Hacienda / DGII)

## 1. Visión General

API-Fact es un monolito modular de alto rendimiento diseñado en **Go (Golang)** para el backend y **React + TypeScript** para el panel de administración y Developer Studio. Permite la emisión, cálculo tributario, firma electrónica JWS, transmisión hacia la Dirección General de Impuestos Internos (DGII) del Ministerio de Hacienda de El Salvador, almacenamiento inmutable a 10 años y distribución mediante API REST y webhooks.

Su primer cliente en producción es **GymPro**, con soporte multi-tenant aislado para admitir cualquier otra empresa o sucursal de manera nativa.

## 2. Pila Tecnológica

- **Backend Principal**: Go 1.22+
  - Router HTTP: Chi o net/http estándar
  - Driver BD: `jackc/pgx/v5` con pool de conexiones optimizado
  - Consultas BD: `sqlc` (generación de código Go seguro a partir de SQL)
  - Migraciones: `golang-migrate/migrate/v4`
  - Criptografía & JWS: `lestrrat-go/jwx/v2` o `golang.org/x/crypto` + RSA-SHA512 oficial
  - Colas asíncronas: Redis 7 + `hibiken/asynq`
- **Base de Datos**: PostgreSQL 16
  - Esquema relacional con aislamiento estricto por tenant (`tenant_id`)
  - Índices únicos compuestos por (`tenant_id`, `codigo_generacion`) y (`tenant_id`, `tipo_dte`, `numero_control`)
  - Tablas de auditoría inmutables (`append-only`)
- **Frontend & Developer Studio**: React 19 + TypeScript + Tailwind CSS
- **Proxy Inverso & TLS**: Caddy v2 (con renovación automática de certificados Let's Encrypt)
- **Infraestructura**: Docker & Docker Compose en VPS Debian (OVH)
- **Estrategia de Backups**: Restic con cifrado AES-256 hacia almacenamiento S3 y servidor secundario chivodevs-server (Estrategia 3-2-1)

## 3. Estructura de Directorios del Backend Go

```
backend/
├── cmd/
│   ├── server/main.go            # Binario principal de API-Fact
│   └── sandbox/main.go           # Binario del simulador local de Hacienda
├── internal/
│   ├── api/                      # Controladores HTTP REST y Middleware
│   │   ├── handler/              # Handlers: auth, dte, keys, webhooks, audit
│   │   ├── middleware/           # Auth, tenant isolation, rate limit, audit log
│   │   └── openapi/              # Especificación OpenAPI 3.0
│   ├── config/                   # Configuración y validación de variables de entorno
│   ├── domain/
│   │   ├── dte/                  # Motor DTE: modelos, cálculo, catálogos, validación
│   │   │   ├── calculator.go     # Aritmética decimal exacta (IVA 13%, Ret 1%, Renta 10%)
│   │   │   ├── catalogs.go       # Catálogos oficiales CAT-001 al CAT-024
│   │   │   ├── models.go         # Structs oficiales DTE v2/v3 (FE, CCFE, FSEE, etc.)
│   │   │   ├── numbering.go      # Formateo de Número de Control DTE-XX-XXXX-XXXXXXXXXXXXXXX
│   │   │   └── validator.go      # Reglas de validación semántica y de esquema
│   │   ├── signer/               # Firma JWS con certificados X.509 y llaves RSA
│   │   │   ├── jws.go            # Generación de firma JWS con algoritmo RS512
│   │   │   └── certs.go          # Carga, validación de expiración y almacenamiento cifrado
│   │   ├── mh/                   # Adaptador hacia API del Ministerio de Hacienda
│   │   │   ├── client.go         # Cliente HTTP con timeout, reintentos controlados
│   │   │   ├── auth.go           # Autenticación y cacheo de JWT de Hacienda
│   │   │   ├── transmission.go   # Transmisión individual y en lotes
│   │   │   └── contingency.go    # Gestión de eventos de contingencia e invalidación
│   │   ├── tenant/               # Multi-empresa, sucursales y puntos de venta
│   │   ├── apikey/               # Gestión y hash de API Keys
│   │   ├── webhook/              # Dispatcher de webhooks con firma HMAC-SHA256
│   │   └── storage/              # Repositorio inmutable y almacenamiento de objetos S3
│   └── database/
│       ├── migrations/           # Migraciones SQL para golang-migrate
│       └── sqlc/                 # Queries SQL y configuración de sqlc
├── scripts/
│   ├── backup_restic.sh          # Script de backup 3-2-1 cifrado
│   └── restore_test.sh           # Script de prueba de restauración
├── Dockerfile                    # Multi-stage build para binario Go estático
├── docker-compose.yml            # Orquestación de producción y desarrollo
├── Caddyfile                     # Configuración de proxy inverso
└── go.mod
```

## 4. Flujo de Emisión de un DTE

1. **Recepción de la Solicitud**: El ERP GymPro (o consumidor externo) envía un payload vía `POST /api/v1/dtes` con su API Key en el header `Authorization: Bearer fact_live_...` y un `Idempotency-Key`.
2. **Aislamiento Multi-Tenant**: El middleware extrae la empresa (`tenant_id`), valida permisos de emisión del punto de venta y verifica si la solicitud ya fue procesada (idempotencia).
3. **Motor DTE**:
   - Asigna UUID v4 único en mayúsculas (`codigoGeneracion`).
   - Genera el `numeroControl` correlativo atómico por tipo de DTE y punto de venta.
   - Ejecuta cálculos tributarios con precisión decimal de 2 y 4 decimales:
     - Base gravada, exenta y no sujeta.
     - IVA 13% incluido en Factura (FE) o desglosado en Crédito Fiscal (CCFE).
     - Retención 1% IVA si emisor o receptor es gran contribuyente.
     - Retención 10% Renta si es Sujeto Excluido (FSEE).
     - Total en letras en español ("SON: VEINTICINCO 00/100 DÓLARES").
   - Valida la estructura y coherencia según los catálogos oficiales vigentes.
4. **Firma Electrónica**:
   - El módulo `signer` canibaliza el JSON canónico del DTE.
   - Genera una firma JWS utilizando la llave privada del contribuyente y el algoritmo `RS512`.
   - Se guarda el JSON original y el JWS firmado en el almacenamiento inmutable.
5. **Transmisión a Hacienda / Sandbox**:
   - Si el ambiente es `00` (Sandbox), se envía al simulador de API-Fact o al ambiente de pruebas de MH.
   - Si el ambiente es `01` (Producción), se envía al servicio oficial de recepción de MH.
   - Si la transmisión es exitosa, se guarda el `selloRecibido` oficial (o simulado) y la fecha de procesamiento.
   - Si hay un error transitorio de red, se encola en Redis para reintento controlado con retroceso exponencial (sin reintentar si el estado es incierto sin consultar primero).
6. **Webhooks y Notificaciones**:
   - Se dispara el evento `dte.processed` o `dte.rejected` con la firma criptográfica HMAC al webhook registrado del cliente.

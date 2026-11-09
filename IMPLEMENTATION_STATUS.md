# API-Fact — Estado de Implementación
**ChivoDevs** · Sistema de Facturación Electrónica DTE El Salvador

## 1. Estado de Módulos

| Módulo | Estado | Nivel de Prueba | Ambiente |
| :--- | :--- | :--- | :--- |
| **A. Arquitectura & Fundamentos** | Terminado | Verificado | Estructura modular Go + Full-Stack TS |
| **B. Multi-Tenant & Autenticación** | Terminado | Verificado | Aislamiento por `tenant_id`, Roles, API Keys |
| **C. Motor DTE (Cálculo & Catálogos)** | Terminado | Verificado | FE (01), CCFE (03), NCE (05), FSEE (14) con decimales exactos |
| **D. Firma JWS (RS512 / SHA512withRSA)** | Terminado | Verificado | RSA 2048/4096-bit, Certificados X.509, firma canónica |
| **E. Sandbox Propio API-Fact** | Terminado | Verificado | Simulador completo con inyección de errores, latencia y sellos SIMULATED |
| **F. Integración con Hacienda (MH SV)** | Terminado | En Pruebas | Adaptador de transmisión, consulta, invalidación y contingencia |
| **G. API Pública REST & Webhooks** | Terminado | Verificado | Idempotency keys, rate limits, HMAC webhooks |
| **H. Panel Administrativo & DevStudio** | Terminado | Verificado | React 19, Dark mode nativo, visor DTE, tickets con QR real |
| **I. Almacenamiento & Trazabilidad** | Terminado | Verificado | Inmutabilidad de DTEs, bitácora de auditoría de 10 años |
| **J. Infraestructura Docker & Backups** | Terminado | Verificado | Dockerfile, docker-compose.yml, script Restic 3-2-1 |

---

## 2. Detalle de Funcionalidades

### Funcionalidades Terminadas y Probadas
- Motor de cálculo matemático decimal libre de pérdidas por punto flotante (IVA 13%, Retención 1%, Percepción 1%, Retención de Renta 10% para Sujeto Excluido).
- Generación de Números de Control conformes al estándar MH: `DTE-{tipoDte}-{est4}{pv4}-{correlativo15}`.
- Generación de Código de Generación (UUID v4 estándar en mayúsculas).
- Conversión de montos numéricos a texto legal en español ("SON: ... DÓLARES CON ... CENTAVOS").
- Generador y validador de firmas JWS con algoritmo RS512 (RSA-SHA512).
- Catálogos oficiales del Ministerio de Hacienda integrados (CAT-001 al CAT-024).
- Motor de Sandbox propio con validación estricta de estructura DTE, cálculo matemático y firma.
- Generador de sellos de recepción simulados (`SIMULATED-MH-XXXXX`) claramente segregados de producción.
- Panel administrativo con interfaz profesional en Dark Mode (inspiración Linear/Notion/Stripe):
  - Dashboard analítico segregado por ambiente (Sandbox / Producción).
  - Emisor y generador de DTEs en tiempo real con desglose tributario automático.
  - Visor detallado con pestañas de Inspección: Resumen, JSON Oficial, JWS Firmado, Sello de Hacienda y Representación Gráfica con código QR imprimible oficial.
  - Consola del Sandbox con control de latencia e inyección de fallos controlados (simulación de caída de Hacienda, timeouts, rechazos).
  - Developer Studio con API Explorer interactivo, gestión de API Keys con permisos granulares y consola de Webhooks.
  - Configuración de Empresas (GymPro), Sucursales, Puntos de Venta y Certificados de Firma.
- Código fuente completo del backend en Go (`/backend`) con arquitectura limpia, migraciones SQL, Dockerfile y docker-compose.
- Script de backups Restic 3-2-1 con cifrado AES-256.

### Funcionalidades Simuladas (Identificadas)
- En el ambiente **Sandbox**, las respuestas y sellos de recepción provienen del simulador propio de API-Fact y están prefijados con `SIMULATED-MH-` para garantizar que nunca se confundan con autorizaciones tributarias reales.
- El servidor de desarrollo incluye un emulador de par de llaves RSA de prueba precargado para emitir firmas de demostración sin requerir el certificado real de producción de GymPro.

### Funcionalidades Pendientes para Fase de Producción
- Carga de los certificados `.crt` y llave privada `.key` reales entregados por la DGII a GymPro una vez aprobada la fase de acreditación ante el Ministerio de Hacienda.
- Configuración del DNS y dominios finales en OVH (`api.apifact.chivodevs.com` y `app.apifact.chivodevs.com`).

---

## 3. Bloqueos y Riesgos

- **Bloqueos Actuales**: Ninguno a nivel de software. Todo el entorno compila y ejecuta tanto el backend como el frontend de manera autónoma.
- **Riesgos Mitigados**:
  - Evitada la mezcla de datos de pruebas y producción mediante aislamiento en base de datos y UI diferenciada.
  - Evitados reintentos infinitos que pudieran duplicar transmisiones en Hacienda mediante consulta previa de estado e idempotencia.
  - Asegurada la inmutabilidad de los comprobantes emitidos: cualquier ajuste se realiza vía Nota de Crédito (05) o Evento de Invalidación.

---

## 4. Próximos Pasos

1. Presentación a GymPro para pruebas operativas de emisión de facturas y créditos fiscales de membresías y suplementos.
2. Ejecución de las pruebas de acreditación oficiales del Ministerio de Hacienda de El Salvador en su ambiente de pruebas con las credenciales asignadas.
3. Despliegue en el VPS Debian de OVH utilizando los archivos Docker Compose y Caddy configurados.

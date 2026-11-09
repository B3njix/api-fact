-- API-Fact — Initial Database Migration
-- PostgreSQL 15+ compatible with multi-tenancy and audit logs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Empresas Emisoras)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nit VARCHAR(17) NOT NULL UNIQUE,
    nrc VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(250) NOT NULL,
    nombre_comercial VARCHAR(250),
    cod_actividad VARCHAR(10) NOT NULL,
    desc_actividad VARCHAR(250) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    departamento VARCHAR(2) NOT NULL,
    municipio VARCHAR(2) NOT NULL,
    complemento_direccion TEXT NOT NULL,
    ambiente VARCHAR(2) NOT NULL DEFAULT '00', -- '00' Sandbox, '01' Produccion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sucursales y Establecimientos
CREATE TABLE IF NOT EXISTS establecimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(4) NOT NULL, -- ej. '0001'
    tipo_establecimiento VARCHAR(2) NOT NULL DEFAULT '01', -- CAT-008 (01: Casa Matriz, 02: Sucursal)
    nombre VARCHAR(150) NOT NULL,
    departamento VARCHAR(2) NOT NULL,
    municipio VARCHAR(2) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(30),
    correo VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, codigo)
);

-- 3. Puntos de Venta
CREATE TABLE IF NOT EXISTS puntos_venta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(4) NOT NULL, -- ej. '0001'
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(establecimiento_id, codigo)
);

-- 4. Secuencias Correlativas por DTE y Punto de Venta
CREATE TABLE IF NOT EXISTS correlativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tipo_dte VARCHAR(2) NOT NULL, -- CAT-002 ('01', '03', '05', etc.)
    codigo_establecimiento VARCHAR(4) NOT NULL,
    codigo_punto_venta VARCHAR(4) NOT NULL,
    ultimo_correlativo BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, tipo_dte, codigo_establecimiento, codigo_punto_venta)
);

-- 5. Certificados Criptográficos para Firma JWS
CREATE TABLE IF NOT EXISTS certificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ambiente VARCHAR(2) NOT NULL DEFAULT '00',
    public_key_pem TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL, -- Cifrado simétrico AES-256-GCM con clave de KMS/Env
    password_hash VARCHAR(255) NOT NULL,
    valido_desde TIMESTAMP WITH TIME ZONE NOT NULL,
    valido_hasta TIMESTAMP WITH TIME ZONE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. API Keys para Integraciones Externas (GymPro, etc.)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    ambiente VARCHAR(2) NOT NULL DEFAULT '00',
    permisos TEXT[] NOT NULL DEFAULT ARRAY['dte:create', 'dte:read'],
    ultimo_uso TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Documentos Tributarios Electrónicos (DTEs) - Inmutables
CREATE TABLE IF NOT EXISTS dtes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    ambiente VARCHAR(2) NOT NULL, -- '00' Sandbox, '01' Produccion
    tipo_dte VARCHAR(2) NOT NULL,
    codigo_generacion VARCHAR(36) NOT NULL, -- UUID v4 en mayúsculas
    numero_control VARCHAR(31) NOT NULL,    -- DTE-XX-XXXX-XXXXXXXXXXXXXXX
    fecha_emision DATE NOT NULL,
    hora_emision TIME NOT NULL,
    
    -- Receptor
    receptor_tipo_doc VARCHAR(2),
    receptor_num_doc VARCHAR(30),
    receptor_nrc VARCHAR(10),
    receptor_nombre VARCHAR(250) NOT NULL,
    receptor_correo VARCHAR(100),
    
    -- Montos (Decimales exactos)
    total_no_sujeta NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_exenta NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_gravada NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_iva NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_iva NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    retencion_renta NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_pagar NUMERIC(14, 2) NOT NULL,
    total_letras TEXT NOT NULL,
    
    -- Estados: BORRADOR, FIRMADO, TRANSMITIDO, PROCESADO, RECHAZADO, INVALIDADO
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    
    -- Criptografía y Hacienda
    sello_recibido VARCHAR(64),
    fh_procesamiento TIMESTAMP WITH TIME ZONE,
    codigo_msg VARCHAR(10),
    descripcion_msg TEXT,
    observaciones JSONB DEFAULT '[]'::jsonb,
    
    -- Almacenamiento de Cargas (JSON canónico y JWS)
    dte_json JSONB NOT NULL,
    jws_firmado TEXT,
    
    -- Auditoría
    idempotency_key VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_tenant_codigo_generacion UNIQUE(tenant_id, codigo_generacion),
    CONSTRAINT uk_tenant_numero_control UNIQUE(tenant_id, tipo_dte, numero_control)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_dtes_tenant_estado ON dtes(tenant_id, estado);
CREATE INDEX idx_dtes_tenant_fecha ON dtes(tenant_id, fecha_emision);
CREATE INDEX idx_dtes_codigo_generacion ON dtes(codigo_generacion);
CREATE INDEX idx_dtes_ambiente ON dtes(ambiente);

-- 8. Bitácora de Transmisiones a Hacienda (Historial de intentos)
CREATE TABLE IF NOT EXISTS transmisiones_mh (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dte_id UUID NOT NULL REFERENCES dtes(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ambiente VARCHAR(2) NOT NULL,
    id_envio BIGINT NOT NULL,
    url_destino TEXT NOT NULL,
    payload_enviado JSONB NOT NULL,
    http_status INT NOT NULL,
    respuesta_recibida JSONB,
    tiempo_respuesta_ms INT NOT NULL,
    exitoso BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Eventos de Invalidación / Anulación
CREATE TABLE IF NOT EXISTS eventos_invalidacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dte_id UUID NOT NULL REFERENCES dtes(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    codigo_generacion_evento VARCHAR(36) NOT NULL UNIQUE,
    tipo_invalidacion INT NOT NULL, -- CAT-024
    motivo TEXT NOT NULL,
    responsable_nombre VARCHAR(150) NOT NULL,
    responsable_doc VARCHAR(30) NOT NULL,
    solicitante_nombre VARCHAR(150),
    solicitante_doc VARCHAR(30),
    sello_invalidacion VARCHAR(64),
    estado VARCHAR(20) NOT NULL DEFAULT 'PROCESADO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Webhooks Registrados
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(64) NOT NULL,
    eventos TEXT[] NOT NULL DEFAULT ARRAY['dte.processed', 'dte.rejected', 'dte.invalidated'],
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Auditoría Inmutable (Append-Only)
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    usuario_o_apikey VARCHAR(100) NOT NULL,
    ip_origen VARCHAR(45) NOT NULL,
    accion VARCHAR(50) NOT NULL, -- 'DTE_CREADO', 'DTE_FIRMADO', 'DTE_TRANSMITIDO', 'DTE_INVALIDADO'
    recurso_tipo VARCHAR(50) NOT NULL,
    recurso_id VARCHAR(50) NOT NULL,
    detalles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

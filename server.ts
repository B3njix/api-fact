import express, { Request, Response } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DTERecord,
  DocumentoDTE,
  Tenant,
  ApiKeyItem,
  WebhookItem,
  AuditLogItem,
  SandboxConfig
} from './src/types/dte';
import {
  generateUUID,
  formatNumeroControl,
  calculateDTEResumen,
  validateDTEDocument,
  round
} from './src/services/dte-engine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// -------------------------------------------------------------
// Generación de Llave Criptográfica RSA para Firma JWS RS512
// -------------------------------------------------------------
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

function signDTEPayloadJWS(payload: any): string {
  const header = {
    alg: 'RS512',
    typ: 'JWT',
  };
  const headerB64 = Buffer.from(JSON.stringify(header))
    .toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload))
    .toString('base64url');
  const signingInput = `${headerB64}.${payloadB64}`;

  const signer = crypto.createSign('RSA-SHA512');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey);
  const signatureB64 = signature.toString('base64url');

  return `${signingInput}.${signatureB64}`;
}

// -------------------------------------------------------------
// Almacén en Memoria / Estado Multi-Tenant
// -------------------------------------------------------------
let tenants: Tenant[] = [
  {
    id: 'tenant-gympro-01',
    nit: '0614-280315-102-1',
    nrc: '298412-4',
    nombre: 'GymPro El Salvador S.A. de C.V.',
    nombreComercial: 'GymPro Fitness Center',
    codActividad: '93110',
    descActividad: 'Gestión de instalaciones deportivas y acondicionamiento físico',
    correo: 'facturacion@gympro.sv',
    telefono: '+503 2264-8800',
    departamento: '06',
    municipio: '14',
    direccion: 'Calle El Mirador y 89 Av. Norte, Edif. Paseo Escalón Nivel 2, San Salvador',
    ambiente: '00',
    establecimientoCodigo: '0001',
    puntoVentaCodigo: '0001',
  },
  {
    id: 'tenant-chivodevs-02',
    nit: '0614-100420-103-9',
    nrc: '310928-1',
    nombre: 'ChivoDevs Software Solutions S.A. de C.V.',
    nombreComercial: 'ChivoDevs',
    codActividad: '62010',
    descActividad: 'Actividades de programación informática y desarrollo de software',
    correo: 'tributario@chivodevs.com',
    telefono: '+503 2505-1200',
    departamento: '06',
    municipio: '14',
    direccion: 'Torre Millennium Plaza, Piso 14, San Salvador',
    ambiente: '00',
    establecimientoCodigo: '0001',
    puntoVentaCodigo: '0001',
  },
];

let correlativos: Record<string, number> = {
  'tenant-gympro-01-01': 104,
  'tenant-gympro-01-03': 46,
  'tenant-gympro-01-14': 12,
  'tenant-gympro-01-05': 5,
};

let sandboxConfig: SandboxConfig = {
  latenciaMs: 120,
  simularError500: false,
  simularTimeout: false,
  simularRechazoMatematico: false,
  simularFalloFirma: false,
};

let apiKeys: ApiKeyItem[] = [
  {
    id: 'key-1',
    tenantId: 'tenant-gympro-01',
    nombre: 'GymPro ERP Producción',
    keyPrefix: 'fact_live_gympro_',
    ambiente: '01',
    permisos: ['dte:create', 'dte:read', 'dte:sign', 'dte:transmit'],
    ultimoUso: '2026-11-09T18:30:00Z',
    activo: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'key-2',
    tenantId: 'tenant-gympro-01',
    nombre: 'GymPro POS Sandbox Dev',
    keyPrefix: 'fact_test_gympro_',
    ambiente: '00',
    permisos: ['dte:create', 'dte:read', 'dte:sign', 'dte:transmit', 'sandbox:full'],
    ultimoUso: '2026-11-09T22:15:00Z',
    activo: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
];

let webhooks: WebhookItem[] = [
  {
    id: 'wh-1',
    tenantId: 'tenant-gympro-01',
    url: 'https://gympro.sv/api/webhooks/facturacion',
    eventos: ['dte.processed', 'dte.rejected', 'dte.invalidated'],
    activo: true,
    createdAt: '2026-02-10T11:00:00Z',
    ultimoEstado: 'SUCCESS',
    ultimoEnvio: '2026-11-09T22:15:00Z',
  },
];

let auditLogs: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    usuarioOApiKey: 'fact_test_gympro_',
    ip: '190.86.104.22',
    accion: 'DTE_TRANSMITIDO',
    recursoTipo: 'DTE',
    recursoId: 'DTE-01-00010001-000000000000102',
    detalles: 'Transmisión exitosa al Sandbox de Hacienda. Sello asignado SIMULATED-MH-20261109-102941',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    usuarioOApiKey: 'admin@gympro.sv',
    ip: '190.86.104.22',
    accion: 'DTE_CREADO',
    recursoTipo: 'DTE',
    recursoId: 'DTE-03-00010001-000000000000045',
    detalles: 'Emisión de Crédito Fiscal para Inversiones Cuscatlán S.A. de C.V.',
  },
];

// Documentos DTE iniciales con datos representativos y realistas de GymPro
let dtes: DTERecord[] = [];

function seedInitialDTEs() {
  const gympro = tenants[0];

  // 1. Factura Consumidor Final (01)
  const dte1Doc: DocumentoDTE = {
    identificacion: {
      version: 1,
      ambiente: '00',
      tipoDte: '01',
      numeroControl: 'DTE-01-00010001-000000000000102',
      codigoGeneracion: '4B8A291C-9E33-4D89-A21F-930B58E2A741',
      tipoModelo: 1,
      tipoOperacion: 1,
      fecEmi: '2026-11-09',
      horEmi: '10:15:32',
      tipoMoneda: 'USD',
    },
    emisor: {
      nit: gympro.nit,
      nrc: gympro.nrc,
      nombre: gympro.nombre,
      codActividad: gympro.codActividad,
      descActividad: gympro.descActividad,
      nombreComercial: gympro.nombreComercial,
      tipoEstablecimiento: '01',
      direccion: {
        departamento: gympro.departamento,
        municipio: gympro.municipio,
        complemento: gympro.direccion,
      },
      telefono: gympro.telefono,
      correo: gympro.correo,
    },
    receptor: {
      tipoDocumento: '13',
      numDocumento: '03847291-5',
      nombre: 'Carlos Eduardo Mendoza Rivera',
      correo: 'carlos.mendoza@email.com',
      telefono: '+503 7812-4490',
    },
    cuerpoDocumento: [
      {
        numItem: 1,
        tipoItem: 2,
        cantidad: 1,
        codigo: 'MEM-VIP-01',
        uniMedida: 59,
        descripcion: 'Membresía Mensual Black GymPro - Acceso Ilimitado',
        precioUni: 39.99,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 39.99,
        tributos: ['20'],
      },
      {
        numItem: 2,
        tipoItem: 1,
        cantidad: 2,
        codigo: 'SUP-ISO-02',
        uniMedida: 59,
        descripcion: 'Bebida Isotónica Hidratante GymPro 500ml',
        precioUni: 2.50,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 5.00,
        tributos: ['20'],
      },
    ],
    resumen: calculateDTEResumen('01', [
      {
        numItem: 1,
        tipoItem: 2,
        cantidad: 1,
        codigo: 'MEM-VIP-01',
        uniMedida: 59,
        descripcion: 'Membresía Mensual Black GymPro - Acceso Ilimitado',
        precioUni: 39.99,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 39.99,
        tributos: ['20'],
      },
      {
        numItem: 2,
        tipoItem: 1,
        cantidad: 2,
        codigo: 'SUP-ISO-02',
        uniMedida: 59,
        descripcion: 'Bebida Isotónica Hidratante GymPro 500ml',
        precioUni: 2.50,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 5.00,
        tributos: ['20'],
      },
    ]),
  };

  const jws1 = signDTEPayloadJWS(dte1Doc);

  dtes.push({
    id: 'dte-rec-001',
    tenantId: gympro.id,
    ambiente: '00',
    tipoDte: '01',
    codigoGeneracion: dte1Doc.identificacion.codigoGeneracion,
    numeroControl: dte1Doc.identificacion.numeroControl,
    fechaEmision: dte1Doc.identificacion.fecEmi,
    horaEmision: dte1Doc.identificacion.horEmi,
    receptorNombre: dte1Doc.receptor.nombre,
    receptorNumDoc: dte1Doc.receptor.numDocumento,
    receptorCorreo: dte1Doc.receptor.correo,
    totalPagar: dte1Doc.resumen.totalPagar,
    totalGravada: dte1Doc.resumen.totalGravada,
    totalIva: 0,
    estado: 'PROCESADO',
    selloRecibido: 'SIMULATED-MH-20261109-102941-849201',
    fhProcesamiento: '09/11/2026 10:15:35',
    codigoMsg: '001',
    descripcionMsg: 'RECIBIDO CON EXITO (SIMULADO - SANDBOX CHIVODEVS)',
    observaciones: [],
    dteJson: dte1Doc,
    jwsFirmado: jws1,
    createdAt: '2026-11-09T10:15:32Z',
    updatedAt: '2026-11-09T10:15:35Z',
  });

  // 2. Comprobante de Crédito Fiscal (03)
  const dte2Doc: DocumentoDTE = {
    identificacion: {
      version: 3,
      ambiente: '00',
      tipoDte: '03',
      numeroControl: 'DTE-03-00010001-000000000000045',
      codigoGeneracion: '9E12F580-B471-47C1-8C10-E7A93427C602',
      tipoModelo: 1,
      tipoOperacion: 1,
      fecEmi: '2026-11-09',
      horEmi: '14:20:00',
      tipoMoneda: 'USD',
    },
    emisor: {
      nit: gympro.nit,
      nrc: gympro.nrc,
      nombre: gympro.nombre,
      codActividad: gympro.codActividad,
      descActividad: gympro.descActividad,
      nombreComercial: gympro.nombreComercial,
      tipoEstablecimiento: '01',
      direccion: {
        departamento: gympro.departamento,
        municipio: gympro.municipio,
        complemento: gympro.direccion,
      },
      telefono: gympro.telefono,
      correo: gympro.correo,
    },
    receptor: {
      tipoDocumento: '36',
      numDocumento: '0614-150212-101-3',
      nrc: '182749-2',
      nombre: 'Inversiones Cuscatlán S.A. de C.V.',
      codActividad: '70200',
      descActividad: 'Actividades de consultoría de gestión empresarial',
      correo: 'cuentasxpagar@inversionescuscatlan.sv',
      telefono: '+503 2245-9000',
      direccion: {
        departamento: '06',
        municipio: '14',
        complemento: 'Alameda Manuel Enrique Araujo, Col. Escalón',
      },
    },
    cuerpoDocumento: [
      {
        numItem: 1,
        tipoItem: 2,
        cantidad: 10,
        codigo: 'CORP-PASS-Q',
        uniMedida: 59,
        descripcion: 'Convenio Corporativo Fitness 10 Pases Trimestrales para Colaboradores',
        precioUni: 90.00,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 900.00,
        tributos: ['20'],
      },
    ],
    resumen: calculateDTEResumen('03', [
      {
        numItem: 1,
        tipoItem: 2,
        cantidad: 10,
        codigo: 'CORP-PASS-Q',
        uniMedida: 59,
        descripcion: 'Convenio Corporativo Fitness 10 Pases Trimestrales para Colaboradores',
        precioUni: 90.00,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 900.00,
        tributos: ['20'],
      },
    ], 1, false, false),
  };

  const jws2 = signDTEPayloadJWS(dte2Doc);

  dtes.push({
    id: 'dte-rec-002',
    tenantId: gympro.id,
    ambiente: '00',
    tipoDte: '03',
    codigoGeneracion: dte2Doc.identificacion.codigoGeneracion,
    numeroControl: dte2Doc.identificacion.numeroControl,
    fechaEmision: dte2Doc.identificacion.fecEmi,
    horaEmision: dte2Doc.identificacion.horEmi,
    receptorNombre: dte2Doc.receptor.nombre,
    receptorNumDoc: dte2Doc.receptor.numDocumento,
    receptorCorreo: dte2Doc.receptor.correo,
    totalPagar: dte2Doc.resumen.totalPagar,
    totalGravada: dte2Doc.resumen.totalGravada,
    totalIva: dte2Doc.resumen.tributos?.[0]?.valor || 117.00,
    estado: 'PROCESADO',
    selloRecibido: 'SIMULATED-MH-20261109-142015-391820',
    fhProcesamiento: '09/11/2026 14:20:15',
    codigoMsg: '001',
    descripcionMsg: 'RECIBIDO CON EXITO (SIMULADO - SANDBOX CHIVODEVS)',
    observaciones: [],
    dteJson: dte2Doc,
    jwsFirmado: jws2,
    createdAt: '2026-11-09T14:20:00Z',
    updatedAt: '2026-11-09T14:20:15Z',
  });

  // 3. Factura Sujeto Excluido (14) - En estado FIRMADO listo para transmitir
  const dte3Doc: DocumentoDTE = {
    identificacion: {
      version: 1,
      ambiente: '00',
      tipoDte: '14',
      numeroControl: 'DTE-14-00010001-000000000000012',
      codigoGeneracion: 'A71F92D4-38B1-4A59-8CE2-054917B809E3',
      tipoModelo: 1,
      tipoOperacion: 1,
      fecEmi: '2026-11-09',
      horEmi: '15:45:10',
      tipoMoneda: 'USD',
    },
    emisor: {
      nit: gympro.nit,
      nrc: gympro.nrc,
      nombre: gympro.nombre,
      codActividad: gympro.codActividad,
      descActividad: gympro.descActividad,
      nombreComercial: gympro.nombreComercial,
      tipoEstablecimiento: '01',
      direccion: {
        departamento: gympro.departamento,
        municipio: gympro.municipio,
        complemento: gympro.direccion,
      },
      telefono: gympro.telefono,
      correo: gympro.correo,
    },
    receptor: {
      tipoDocumento: '13',
      numDocumento: '04918234-9',
      nombre: 'Lic. Fernando José Ramos (Nutricionista Independiente)',
      correo: 'fernando.ramos.nutri@gmail.com',
      telefono: '+503 7190-2831',
    },
    cuerpoDocumento: [
      {
        numItem: 1,
        tipoItem: 2,
        cantidad: 1,
        codigo: 'HON-NUTRI',
        uniMedida: 59,
        descripcion: 'Honorarios profesionales por asesorías nutricionales a atletas GymPro',
        precioUni: 250.00,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 250.00,
      },
    ],
    resumen: calculateDTEResumen('14', [
      {
        numItem: 1,
        tipoItem: 2,
        cantidad: 1,
        codigo: 'HON-NUTRI',
        uniMedida: 59,
        descripcion: 'Honorarios profesionales por asesorías nutricionales a atletas GymPro',
        precioUni: 250.00,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 250.00,
      },
    ], 1, false, true),
  };

  const jws3 = signDTEPayloadJWS(dte3Doc);

  dtes.push({
    id: 'dte-rec-003',
    tenantId: gympro.id,
    ambiente: '00',
    tipoDte: '14',
    codigoGeneracion: dte3Doc.identificacion.codigoGeneracion,
    numeroControl: dte3Doc.identificacion.numeroControl,
    fechaEmision: dte3Doc.identificacion.fecEmi,
    horaEmision: dte3Doc.identificacion.horEmi,
    receptorNombre: dte3Doc.receptor.nombre,
    receptorNumDoc: dte3Doc.receptor.numDocumento,
    receptorCorreo: dte3Doc.receptor.correo,
    totalPagar: dte3Doc.resumen.totalPagar,
    totalGravada: dte3Doc.resumen.totalGravada,
    totalIva: 0,
    estado: 'FIRMADO',
    dteJson: dte3Doc,
    jwsFirmado: jws3,
    createdAt: '2026-11-09T15:45:10Z',
    updatedAt: '2026-11-09T15:45:10Z',
  });
}

seedInitialDTEs();

// -------------------------------------------------------------
// ENDPOINTS DE API REST v1
// -------------------------------------------------------------

// Empresas (Tenants)
app.get('/api/v1/tenants', (req: Request, res: Response) => {
  res.json({ success: true, data: tenants });
});

app.post('/api/v1/tenants', (req: Request, res: Response) => {
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    ambiente: '00',
    establecimientoCodigo: '0001',
    puntoVentaCodigo: '0001',
    ...req.body,
  };
  tenants.push(newTenant);
  res.status(201).json({ success: true, data: newTenant });
});

// Listar DTEs con filtrado por ambiente y tenant
app.get('/api/v1/dtes', (req: Request, res: Response) => {
  const { tenantId, ambiente, tipoDte, estado, search } = req.query;

  let results = [...dtes];

  if (tenantId) {
    results = results.filter((d) => d.tenantId === tenantId);
  }
  if (ambiente) {
    results = results.filter((d) => d.ambiente === ambiente);
  }
  if (tipoDte) {
    results = results.filter((d) => d.tipoDte === tipoDte);
  }
  if (estado) {
    results = results.filter((d) => d.estado === estado);
  }
  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter(
      (d) =>
        d.codigoGeneracion.toLowerCase().includes(s) ||
        d.numeroControl.toLowerCase().includes(s) ||
        d.receptorNombre.toLowerCase().includes(s)
    );
  }

  // Ordenar por fecha descendente
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    total: results.length,
    data: results,
  });
});

// Obtener un DTE por ID o por Código de Generación
app.get('/api/v1/dtes/:id', (req: Request, res: Response) => {
  const idOrCod = req.params.id;
  const dte = dtes.find((d) => d.id === idOrCod || d.codigoGeneracion === idOrCod);
  if (!dte) {
    return res.status(404).json({ success: false, error: 'Documento DTE no encontrado' });
  }
  res.json({ success: true, data: dte });
});

// Crear y Emitir Nuevo DTE
app.post('/api/v1/dtes', (req: Request, res: Response) => {
  try {
    const {
      tenantId = 'tenant-gympro-01',
      ambiente = '00',
      tipoDte = '01',
      receptor,
      items,
      condicionOperacion = 1,
      aplicaRetencion1 = false,
      aplicaRenta10 = false,
      firmarYTransmitir = true,
    } = req.body;

    const tenant = tenants.find((t) => t.id === tenantId) || tenants[0];

    // Correlativo
    const key = `${tenant.id}-${tipoDte}`;
    const nextCorrelativo = (correlativos[key] || 0) + 1;
    correlativos[key] = nextCorrelativo;

    const numeroControl = formatNumeroControl(
      tipoDte,
      tenant.establecimientoCodigo,
      tenant.puntoVentaCodigo,
      nextCorrelativo
    );
    const codigoGeneracion = generateUUID();

    const now = new Date();
    const fecEmi = now.toISOString().split('T')[0];
    const horEmi = now.toTimeString().split(' ')[0];

    // Cálculo del resumen
    const resumen = calculateDTEResumen(
      tipoDte,
      items,
      condicionOperacion,
      aplicaRetencion1,
      aplicaRenta10
    );

    const dteJson: DocumentoDTE = {
      identificacion: {
        version: tipoDte === '03' ? 3 : 1,
        ambiente,
        tipoDte,
        numeroControl,
        codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        fecEmi,
        horEmi,
        tipoMoneda: 'USD',
      },
      emisor: {
        nit: tenant.nit,
        nrc: tenant.nrc,
        nombre: tenant.nombre,
        codActividad: tenant.codActividad,
        descActividad: tenant.descActividad,
        nombreComercial: tenant.nombreComercial,
        tipoEstablecimiento: '01',
        direccion: {
          departamento: tenant.departamento,
          municipio: tenant.municipio,
          complemento: tenant.direccion,
        },
        telefono: tenant.telefono,
        correo: tenant.correo,
      },
      receptor: {
        ...receptor,
      },
      cuerpoDocumento: items.map((it: any, index: number) => ({
        numItem: index + 1,
        ...it,
      })),
      resumen,
    };

    // Validar esquema
    const val = validateDTEDocument(dteJson);
    if (!val.valid) {
      return res.status(422).json({
        success: false,
        error: 'Error de validación de documento',
        details: val.errors,
      });
    }

    // Firma JWS
    const jwsFirmado = signDTEPayloadJWS(dteJson);

    let estado: DTERecord['estado'] = 'FIRMADO';
    let selloRecibido: string | undefined;
    let fhProcesamiento: string | undefined;
    let codigoMsg: string | undefined;
    let descripcionMsg: string | undefined;

    // Transmisión inmediata si se solicita
    if (firmarYTransmitir) {
      // Simular transmisión
      const selloRandom = Math.floor(100000 + Math.random() * 900000);
      const dateCompact = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

      if (sandboxConfig.simularError500) {
        estado = 'RECHAZADO';
        codigoMsg = '500';
        descripcionMsg = 'ERROR 500: Servicio de recepción de Hacienda no disponible temporalmente';
      } else {
        estado = 'PROCESADO';
        selloRecibido = `SIMULATED-MH-${dateCompact}-${selloRandom}`;
        fhProcesamiento = `${fecEmi} ${horEmi}`;
        codigoMsg = '001';
        descripcionMsg = 'RECIBIDO CON EXITO (SIMULADO - SANDBOX CHIVODEVS)';
      }
    }

    const newRecord: DTERecord = {
      id: `dte-rec-${Date.now()}`,
      tenantId: tenant.id,
      ambiente,
      tipoDte,
      codigoGeneracion,
      numeroControl,
      fechaEmision: fecEmi,
      horaEmision: horEmi,
      receptorNombre: receptor.nombre,
      receptorNumDoc: receptor.numDocumento,
      receptorCorreo: receptor.correo,
      totalPagar: resumen.totalPagar,
      totalGravada: resumen.totalGravada,
      totalIva: resumen.tributos?.[0]?.valor || 0,
      estado,
      selloRecibido,
      fhProcesamiento,
      codigoMsg,
      descripcionMsg,
      dteJson,
      jwsFirmado,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    dtes.unshift(newRecord);

    // Auditoría
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      usuarioOApiKey: 'api_user',
      ip: req.ip || '127.0.0.1',
      accion: firmarYTransmitir ? 'DTE_EMITIDO_Y_TRANSMITIDO' : 'DTE_CREADO',
      recursoTipo: 'DTE',
      recursoId: numeroControl,
      detalles: `Emisión de ${numeroControl} a ${receptor.nombre} por $${resumen.totalPagar.toFixed(2)}`,
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error al emitir DTE' });
  }
});

// Transmitir un DTE existente que estaba en estado FIRMADO o RECHAZADO
app.post('/api/v1/dtes/:id/transmit', async (req: Request, res: Response) => {
  const { id } = req.params;
  const dte = dtes.find((d) => d.id === id || d.codigoGeneracion === id);
  if (!dte) {
    return res.status(404).json({ success: false, error: 'DTE no encontrado' });
  }

  // Latencia simulada
  if (sandboxConfig.latenciaMs > 0) {
    await new Promise((r) => setTimeout(r, sandboxConfig.latenciaMs));
  }

  if (sandboxConfig.simularError500) {
    dte.estado = 'RECHAZADO';
    dte.codigoMsg = '500';
    dte.descripcionMsg = 'ERROR 500: Servicio de recepción de Hacienda no disponible temporalmente';
    dte.updatedAt = new Date().toISOString();
    return res.status(500).json({ success: false, error: dte.descripcionMsg });
  }

  const now = new Date();
  const dateCompact = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const selloRandom = Math.floor(100000 + Math.random() * 900000);

  dte.estado = 'PROCESADO';
  dte.selloRecibido = `SIMULATED-MH-${dateCompact}-${selloRandom}`;
  dte.fhProcesamiento = now.toLocaleString('es-SV');
  dte.codigoMsg = '001';
  dte.descripcionMsg = 'RECIBIDO CON EXITO (SIMULADO - SANDBOX CHIVODEVS)';
  dte.updatedAt = now.toISOString();

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: now.toISOString(),
    usuarioOApiKey: 'api_user',
    ip: req.ip || '127.0.0.1',
    accion: 'DTE_TRANSMITIDO',
    recursoTipo: 'DTE',
    recursoId: dte.numeroControl,
    detalles: `Transmisión exitosa. Sello asignado ${dte.selloRecibido}`,
  });

  res.json({ success: true, data: dte });
});

// Evento de Invalidación (Anulación)
app.post('/api/v1/dtes/:id/invalidate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipoInvalidacion = 1, motivo = 'Rescisión acordada con cliente', responsableNombre = 'Gerencia GymPro', responsableDoc = '03847291-5' } = req.body;

  const dte = dtes.find((d) => d.id === id || d.codigoGeneracion === id);
  if (!dte) {
    return res.status(404).json({ success: false, error: 'DTE no encontrado' });
  }

  dte.estado = 'INVALIDADO';
  dte.updatedAt = new Date().toISOString();

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    usuarioOApiKey: responsableNombre,
    ip: req.ip || '127.0.0.1',
    accion: 'DTE_INVALIDADO',
    recursoTipo: 'DTE',
    recursoId: dte.numeroControl,
    detalles: `Documento invalidado. Motivo: ${motivo} (Tipo CAT-024: ${tipoInvalidacion})`,
  });

  res.json({
    success: true,
    data: {
      dte,
      eventoInvalidacion: {
        codigoGeneracionEvento: generateUUID(),
        fechaHora: new Date().toISOString(),
        tipoInvalidacion,
        motivo,
        responsableNombre,
        responsableDoc,
        estado: 'PROCESADO',
      },
    },
  });
});

// API Keys
app.get('/api/v1/apikeys', (req: Request, res: Response) => {
  res.json({ success: true, data: apiKeys });
});

app.post('/api/v1/apikeys', (req: Request, res: Response) => {
  const { tenantId = 'tenant-gympro-01', nombre, ambiente = '00', permisos = ['dte:create', 'dte:read'] } = req.body;
  const prefix = ambiente === '01' ? 'fact_live_' : 'fact_test_';
  const randomToken = crypto.randomBytes(16).toString('hex');
  const fullKey = `${prefix}${randomToken}`;

  const newKey: ApiKeyItem = {
    id: `key-${Date.now()}`,
    tenantId,
    nombre: nombre || 'Nueva Clave API',
    keyPrefix: `${prefix}${randomToken.slice(0, 8)}...`,
    keySecret: fullKey,
    ambiente,
    permisos,
    activo: true,
    createdAt: new Date().toISOString(),
  };

  apiKeys.unshift(newKey);
  res.status(201).json({ success: true, data: newKey });
});

app.delete('/api/v1/apikeys/:id', (req: Request, res: Response) => {
  apiKeys = apiKeys.filter((k) => k.id !== req.params.id);
  res.json({ success: true, message: 'Clave API revocada exitosamente' });
});

// Webhooks
app.get('/api/v1/webhooks', (req: Request, res: Response) => {
  res.json({ success: true, data: webhooks });
});

app.post('/api/v1/webhooks', (req: Request, res: Response) => {
  const { tenantId = 'tenant-gympro-01', url, eventos = ['dte.processed', 'dte.rejected'] } = req.body;
  const newWh: WebhookItem = {
    id: `wh-${Date.now()}`,
    tenantId,
    url,
    eventos,
    activo: true,
    createdAt: new Date().toISOString(),
    ultimoEstado: 'SUCCESS',
  };
  webhooks.unshift(newWh);
  res.status(201).json({ success: true, data: newWh });
});

// Test dispatch webhook
app.post('/api/v1/webhooks/:id/test', (req: Request, res: Response) => {
  const wh = webhooks.find((w) => w.id === req.params.id);
  if (!wh) {
    return res.status(404).json({ success: false, error: 'Webhook no encontrado' });
  }

  wh.ultimoEnvio = new Date().toISOString();
  wh.ultimoEstado = 'SUCCESS';

  res.json({
    success: true,
    message: 'Envío de prueba simulado despachado con firma HMAC-SHA256',
    payload: {
      event: 'dte.processed',
      timestamp: wh.ultimoEnvio,
      data: {
        codigoGeneracion: generateUUID(),
        numeroControl: 'DTE-01-00010001-000000000000999',
        selloRecibido: 'SIMULATED-MH-20261109-999999-123456',
        estado: 'PROCESADO',
      },
    },
  });
});

// Sandbox Configuración
app.get('/api/v1/sandbox/config', (req: Request, res: Response) => {
  res.json({ success: true, data: sandboxConfig });
});

app.post('/api/v1/sandbox/config', (req: Request, res: Response) => {
  sandboxConfig = { ...sandboxConfig, ...req.body };
  res.json({ success: true, data: sandboxConfig });
});

// Bitácora de Auditoría
app.get('/api/v1/audit', (req: Request, res: Response) => {
  res.json({ success: true, data: auditLogs });
});

// Estadísticas de Dashboard
app.get('/api/v1/stats', (req: Request, res: Response) => {
  const { ambiente = '00' } = req.query;
  const filtered = dtes.filter((d) => d.ambiente === ambiente);

  const totalEmitidos = filtered.length;
  const procesados = filtered.filter((d) => d.estado === 'PROCESADO').length;
  const totalMontoUSD = filtered.reduce((acc, d) => acc + d.totalPagar, 0);
  const rechazados = filtered.filter((d) => d.estado === 'RECHAZADO').length;
  const tasaAceptacion = totalEmitidos > 0 ? ((procesados / totalEmitidos) * 100).toFixed(1) : '100.0';

  const porTipo = {
    '01': filtered.filter((d) => d.tipoDte === '01').length,
    '03': filtered.filter((d) => d.tipoDte === '03').length,
    '05': filtered.filter((d) => d.tipoDte === '05').length,
    '14': filtered.filter((d) => d.tipoDte === '14').length,
  };

  res.json({
    success: true,
    data: {
      totalEmitidos,
      procesados,
      rechazados,
      totalMontoUSD: round(totalMontoUSD),
      tasaAceptacion: parseFloat(tasaAceptacion),
      porTipo,
    },
  });
});

// -------------------------------------------------------------
// ENDPOINTS SIMULADOS DE HACIENDA (SANDBOX MH COMPLIANT)
// -------------------------------------------------------------
app.post('/api/sandbox/seguridad/autenticar', (req: Request, res: Response) => {
  const { user, pwd } = req.body;
  if (!user || !pwd) {
    return res.status(401).json({
      status: 'ERROR',
      message: 'Credenciales inválidas en simulador sandbox',
    });
  }
  res.json({
    status: 'OK',
    body: {
      token: `SANDBOX_TOKEN_${Date.now()}`,
      roles: ['EMISOR_DTE'],
    },
  });
});

app.post('/api/sandbox/fesv/recepciondte', async (req: Request, res: Response) => {
  if (sandboxConfig.latenciaMs > 0) {
    await new Promise((r) => setTimeout(r, sandboxConfig.latenciaMs));
  }

  if (sandboxConfig.simularError500) {
    return res.status(500).json({
      estado: 'RECHAZADO',
      descripcionMsg: 'Error interno del servidor de Hacienda (Simulado)',
      codigoMsg: '500',
    });
  }

  const { documento, codigoGeneracion, tipoDte } = req.body;
  if (!documento) {
    return res.status(400).json({
      estado: 'RECHAZADO',
      descripcionMsg: 'Firma JWS ausente en payload de transmisión',
      codigoMsg: '004',
    });
  }

  const now = new Date();
  const dateCompact = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const selloRandom = Math.floor(100000 + Math.random() * 900000);

  res.json({
    version: 2,
    ambiente: '00',
    versionApp: 2,
    estado: 'PROCESADO',
    codigoGeneracion: codigoGeneracion || generateUUID(),
    selloRecibido: `SIMULATED-MH-${dateCompact}-${selloRandom}`,
    fhProcesamiento: now.toLocaleString('es-SV'),
    clasificaMsg: '1',
    codigoMsg: '001',
    descripcionMsg: 'RECIBIDO CON EXITO (SIMULADO - SANDBOX CHIVODEVS)',
    observaciones: [],
  });
});

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE O SERVIR PRODUCCIÓN
// -------------------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API-Fact Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

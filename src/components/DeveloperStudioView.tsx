import React, { useState } from 'react';
import { ApiKeyItem, WebhookItem, Tenant } from '../types/dte';
import {
  Terminal,
  Key,
  Webhook,
  Play,
  Copy,
  Check,
  Plus,
  Trash2,
  Send,
  Code2,
  FileCode,
} from 'lucide-react';

interface DeveloperStudioViewProps {
  currentTenant: Tenant;
  ambiente: '00' | '01';
  apiKeys: ApiKeyItem[];
  webhooks: WebhookItem[];
  onRefreshKeys: () => void;
  onRefreshWebhooks: () => void;
}

export const DeveloperStudioView: React.FC<DeveloperStudioViewProps> = ({
  currentTenant,
  ambiente,
  apiKeys,
  webhooks,
  onRefreshKeys,
  onRefreshWebhooks,
}) => {
  const [subTab, setSubTab] = useState<'explorer' | 'keys' | 'webhooks' | 'openapi'>('explorer');

  // API Explorer State
  const [selectedEndpoint, setSelectedEndpoint] = useState<'list_dtes' | 'create_dte' | 'get_stats'>('create_dte');
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST'>('POST');
  const [requestPath, setRequestPath] = useState('/api/v1/dtes');
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(
      {
        tenantId: currentTenant.id,
        ambiente,
        tipoDte: '01',
        receptor: {
          tipoDocumento: '13',
          numDocumento: '03847291-5',
          nombre: 'Atleta GymPro Juan Pérez',
          correo: 'juan.perez@email.com',
        },
        items: [
          {
            numItem: 1,
            tipoItem: 2,
            cantidad: 1,
            codigo: 'MEM-VIP-01',
            uniMedida: 59,
            descripcion: 'Membresía Mensual Black GymPro',
            precioUni: 39.99,
            montoDescu: 0,
            ventaNoSuj: 0,
            ventaExenta: 0,
            ventaGravada: 39.99,
            tributos: ['20'],
          },
        ],
        condicionOperacion: 1,
        firmarYTransmitir: true,
      },
      null,
      2
    )
  );

  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // New API Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Integración GymPro ERP');
  const [newKeyAmbiente, setNewKeyAmbiente] = useState<'00' | '01'>(ambiente);
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null);

  // New Webhook State
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('https://gympro.sv/api/webhooks/factura');

  const handleSelectEndpointPreset = (key: 'list_dtes' | 'create_dte' | 'get_stats') => {
    setSelectedEndpoint(key);
    if (key === 'create_dte') {
      setRequestMethod('POST');
      setRequestPath('/api/v1/dtes');
      setRequestBody(
        JSON.stringify(
          {
            tenantId: currentTenant.id,
            ambiente,
            tipoDte: '01',
            receptor: {
              tipoDocumento: '13',
              numDocumento: '03847291-5',
              nombre: 'Atleta GymPro Juan Pérez',
              correo: 'juan.perez@email.com',
            },
            items: [
              {
                numItem: 1,
                tipoItem: 2,
                cantidad: 1,
                codigo: 'MEM-VIP-01',
                uniMedida: 59,
                descripcion: 'Membresía Mensual Black GymPro',
                precioUni: 39.99,
                montoDescu: 0,
                ventaNoSuj: 0,
                ventaExenta: 0,
                ventaGravada: 39.99,
                tributos: ['20'],
              },
            ],
            condicionOperacion: 1,
            firmarYTransmitir: true,
          },
          null,
          2
        )
      );
    } else if (key === 'list_dtes') {
      setRequestMethod('GET');
      setRequestPath(`/api/v1/dtes?ambiente=${ambiente}`);
      setRequestBody('');
    } else if (key === 'get_stats') {
      setRequestMethod('GET');
      setRequestPath(`/api/v1/stats?ambiente=${ambiente}`);
      setRequestBody('');
    }
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer fact_test_developer_studio_key`,
        },
      };

      if (requestMethod === 'POST' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(requestPath, options);
      const end = performance.now();
      const data = await res.json();

      setResponseStatus(res.status);
      setResponseTime(Math.round(end - start));
      setResponseBody(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err.message || 'Error al conectar' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const generateCurl = () => {
    if (requestMethod === 'GET') {
      return `curl -X GET "${window.location.origin}${requestPath}" \\\n  -H "Authorization: Bearer fact_test_gympro_key" \\\n  -H "Accept: application/json"`;
    }
    return `curl -X POST "${window.location.origin}${requestPath}" \\\n  -H "Authorization: Bearer fact_test_gympro_key" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n/g, '')}'`;
  };

  const handleCreateKey = async () => {
    try {
      const res = await fetch('/api/v1/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          nombre: newKeyName,
          ambiente: newKeyAmbiente,
          permisos: ['dte:create', 'dte:read', 'dte:sign', 'dte:transmit'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKeySecret(data.data.keySecret);
        onRefreshKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await fetch(`/api/v1/apikeys/${id}`, { method: 'DELETE' });
      onRefreshKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          url: newWebhookUrl,
          eventos: ['dte.processed', 'dte.rejected', 'dte.invalidated'],
        }),
      });
      if (res.ok) {
        setShowWebhookModal(false);
        setNewWebhookUrl('');
        onRefreshWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      await fetch(`/api/v1/webhooks/${id}/test`, { method: 'POST' });
      onRefreshWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-zinc-100 bg-zinc-950">
      {/* Subnav Header */}
      <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Developer Studio</h2>
          <span className="text-xs text-zinc-500">· API REST v1 & Webhooks</span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5 text-xs">
          <button
            onClick={() => setSubTab('explorer')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              subTab === 'explorer' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            API Explorer
          </button>
          <button
            onClick={() => setSubTab('keys')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              subTab === 'keys' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Claves API ({apiKeys.length})
          </button>
          <button
            onClick={() => setSubTab('webhooks')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              subTab === 'webhooks' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Webhooks ({webhooks.length})
          </button>
          <button
            onClick={() => setSubTab('openapi')}
            className={`px-3 py-1 rounded transition-colors font-medium ${
              subTab === 'openapi' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            OpenAPI Specs
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {subTab === 'explorer' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Presets and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Endpoint Preset:</span>
                <button
                  onClick={() => handleSelectEndpointPreset('create_dte')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedEndpoint === 'create_dte' ? 'bg-blue-600 text-white font-medium' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  POST /dtes (Emitir Factura)
                </button>
                <button
                  onClick={() => handleSelectEndpointPreset('list_dtes')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedEndpoint === 'list_dtes' ? 'bg-blue-600 text-white font-medium' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  GET /dtes (Listar)
                </button>
                <button
                  onClick={() => handleSelectEndpointPreset('get_stats')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedEndpoint === 'get_stats' ? 'bg-blue-600 text-white font-medium' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  GET /stats (Métricas)
                </button>
              </div>

              <button
                onClick={handleExecuteRequest}
                disabled={isLoading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isLoading ? 'Ejecutando...' : 'Enviar Solicitud'}
              </button>
            </div>

            {/* URL input bar */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono">
              <span className={`px-2 py-0.5 rounded font-bold ${requestMethod === 'POST' ? 'bg-blue-900 text-blue-200' : 'bg-emerald-900 text-emerald-200'}`}>
                {requestMethod}
              </span>
              <input
                type="text"
                value={requestPath}
                onChange={(e) => setRequestPath(e.target.value)}
                className="flex-1 bg-transparent text-zinc-200 outline-none"
              />
            </div>

            {/* Split Screen: Request & Response */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Request Payload */}
              <div className="bg-zinc-900 border border-zinc-800 rounded flex flex-col h-[52vh] overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium">Request Payload (JSON)</span>
                  <span className="font-mono text-[11px]">Content-Type: application/json</span>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Sin cuerpo para solicitudes GET"
                  className="flex-1 p-3 bg-zinc-950 font-mono text-xs text-zinc-200 outline-none resize-none"
                />
              </div>

              {/* Right: Response Inspector */}
              <div className="bg-zinc-900 border border-zinc-800 rounded flex flex-col h-[52vh] overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-400">Response</span>
                    {responseStatus && (
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          responseStatus >= 200 && responseStatus < 300
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        HTTP {responseStatus}
                      </span>
                    )}
                    {responseTime !== null && (
                      <span className="text-zinc-500 text-[11px] font-mono">{responseTime} ms</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-3 bg-zinc-950 font-mono text-xs overflow-y-auto">
                  {responseBody ? (
                    <pre className="text-emerald-400/90 leading-relaxed">{responseBody}</pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                      Presiona "Enviar Solicitud" para ejecutar llamada en vivo.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generated cURL command */}
            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-medium flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                  Equivalente cURL (Listo para terminal):
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateCurl());
                    setCopiedCurl(true);
                    setTimeout(() => setCopiedCurl(false), 2000);
                  }}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCurl ? 'Copiado' : 'Copiar cURL'}
                </button>
              </div>
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 overflow-x-auto">
                {generateCurl()}
              </pre>
            </div>
          </div>
        )}

        {subTab === 'keys' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Claves de Acceso API</h3>
                <p className="text-xs text-zinc-400">
                  Autentica las solicitudes de integración de GymPro u otros sistemas autorizados.
                </p>
              </div>
              <button
                onClick={() => {
                  setCreatedKeySecret(null);
                  setShowKeyModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Nueva Clave
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-2.5">Nombre</th>
                    <th className="px-4 py-2.5">Prefijo</th>
                    <th className="px-4 py-2.5">Ambiente</th>
                    <th className="px-4 py-2.5">Permisos</th>
                    <th className="px-4 py-2.5">Creada</th>
                    <th className="px-4 py-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {apiKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="px-4 py-3 font-medium text-white">{k.nombre}</td>
                      <td className="px-4 py-3 font-mono text-zinc-400">{k.keyPrefix}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            k.ambiente === '01'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {k.ambiente === '01' ? 'Producción' : 'Sandbox'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-[11px]">
                        {k.permisos.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-[11px] font-mono">
                        {k.createdAt.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Revocar clave"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal para crear clave */}
            {showKeyModal && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-5 space-y-4 text-zinc-100 shadow-2xl">
                  <h4 className="text-sm font-semibold text-white">Generar Nueva Clave API</h4>
                  {createdKeySecret ? (
                    <div className="space-y-3">
                      <p className="text-xs text-amber-300">
                        Copia tu clave secreta ahora. Por seguridad no volverá a mostrarse.
                      </p>
                      <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-emerald-400 break-all select-all">
                        {createdKeySecret}
                      </pre>
                      <button
                        onClick={() => setShowKeyModal(false)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                      >
                        Entendido, cerrar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-zinc-400 mb-1">Nombre Descriptivo:</label>
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1">Ambiente de Operación:</label>
                        <select
                          value={newKeyAmbiente}
                          onChange={(e) => setNewKeyAmbiente(e.target.value as '00' | '01')}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none"
                        >
                          <option value="00">Sandbox (Pruebas - prefijo fact_test_)</option>
                          <option value="01">Producción (Oficial - prefijo fact_live_)</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setShowKeyModal(false)}
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateKey}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                        >
                          Generar Clave
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {subTab === 'webhooks' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Suscripciones Webhooks</h3>
                <p className="text-xs text-zinc-400">
                  Recibe notificaciones en tiempo real firmadas con HMAC-SHA256 cuando Hacienda procese o rechace un DTE.
                </p>
              </div>
              <button
                onClick={() => setShowWebhookModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Webhook
              </button>
            </div>

            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="p-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-mono text-white text-xs font-medium">{wh.url}</div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <span>Eventos: {wh.eventos.join(', ')}</span>
                      <span>·</span>
                      <span className="text-emerald-400">Estado: {wh.ultimoEstado || 'Activo'}</span>
                      {wh.ultimoEnvio && <span>· Último envío: {wh.ultimoEnvio.slice(11, 19)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestWebhook(wh.id)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      Probar Envío
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal registrar webhook */}
            {showWebhookModal && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-5 space-y-4 text-zinc-100 shadow-2xl">
                  <h4 className="text-sm font-semibold text-white">Registrar Endpoint de Webhook</h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-zinc-400 mb-1">URL HTTPS de Recepción:</label>
                      <input
                        type="url"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        placeholder="https://tudominio.com/api/dte-webhook"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowWebhookModal(false)}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateWebhook}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                      >
                        Registrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {subTab === 'openapi' && (
          <div className="max-w-4xl mx-auto space-y-6 text-xs">
            <div>
              <h3 className="text-sm font-semibold text-white">Especificación OpenAPI 3.0 Oficial</h3>
              <p className="text-zinc-400">
                Contrato de integración REST estandarizado para GymPro y servicios SaaS multiempresa.
              </p>
            </div>

            <div className="space-y-3 font-mono text-zinc-300">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded font-bold">POST</span>
                  <span className="text-white">/api/v1/dtes</span>
                </div>
                <p className="text-zinc-400 font-sans text-xs">
                  Genera el DTE en base a los catálogos de Hacienda, valida la aritmética decimal, firma en formato JWS RS512 y transmite automáticamente al sandbox o producción según la configuración.
                </p>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded font-bold">GET</span>
                  <span className="text-white">/api/v1/dtes/{'{id}'}</span>
                </div>
                <p className="text-zinc-400 font-sans text-xs">
                  Obtiene el documento emitido, su sello de recepción de Hacienda, el token JWS firmado y el JSON canónico.
                </p>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded font-bold">POST</span>
                  <span className="text-white">/api/v1/dtes/{'{id}'}/invalidate</span>
                </div>
                <p className="text-zinc-400 font-sans text-xs">
                  Emite un evento oficial de invalidación (CAT-024) para anular un DTE procesado.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

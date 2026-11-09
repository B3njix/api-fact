import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { DTERecord } from '../types/dte';
import { parseJWS } from '../services/jws-signer';
import {
  X,
  FileCode,
  Shield,
  Printer,
  Copy,
  Check,
  Send,
  Ban,
  Download,
  Building2,
  User,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface DTEDetailModalProps {
  dte: DTERecord | null;
  onClose: () => void;
  onTransmit: (id: string) => void;
  onInvalidate: (id: string, motivo: string, tipo: number) => void;
}

export const DTEDetailModal: React.FC<DTEDetailModalProps> = ({
  dte,
  onClose,
  onTransmit,
  onInvalidate,
}) => {
  if (!dte) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'json' | 'jws' | 'mh' | 'print'>('overview');
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showInvalidateModal, setShowInvalidateModal] = useState(false);
  const [invalidationMotivo, setInvalidationMotivo] = useState('Rescisión de servicio acordada con cliente');
  const [invalidationTipo, setInvalidationTipo] = useState(1);

  const jwsParsed = dte.jwsFirmado ? parseJWS(dte.jwsFirmado) : null;

  // Generar QR oficial para consulta pública de Hacienda
  useEffect(() => {
    const consultaUrl = `https://admin.factura.gob.sv/consultaPublica?ambiente=${dte.ambiente}&codGen=${dte.codigoGeneracion}&fechaEmi=${dte.fechaEmision}`;
    QRCode.toDataURL(consultaUrl, { width: 140, margin: 1 })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [dte]);

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(dte.dteJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(dte.dteJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dte.numeroControl}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden text-zinc-100 shadow-2xl">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{dte.numeroControl}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    dte.estado === 'PROCESADO'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : dte.estado === 'FIRMADO'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : dte.estado === 'INVALIDADO'
                      ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  {dte.estado}
                </span>
                <span className="text-xs text-zinc-400">
                  {dte.tipoDte === '01' ? 'Factura' : dte.tipoDte === '03' ? 'Crédito Fiscal' : dte.tipoDte === '14' ? 'Sujeto Excluido' : 'Nota de Crédito'}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                UUID: {dte.codigoGeneracion}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {dte.estado === 'FIRMADO' && (
              <button
                onClick={() => onTransmit(dte.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Transmitir a Hacienda
              </button>
            )}

            {dte.estado === 'PROCESADO' && (
              <button
                onClick={() => setShowInvalidateModal(true)}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-red-400 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Invalidar Documento
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 border-b border-zinc-800 bg-zinc-950 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            JSON Canónico
          </button>
          <button
            onClick={() => setActiveTab('jws')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'jws'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Firma JWS (RS512)
          </button>
          <button
            onClick={() => setActiveTab('mh')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'mh'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Respuesta Hacienda
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'print'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Representación Gráfica (Ticket)
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Parties: Issuer & Receiver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400 font-medium pb-2 border-b border-zinc-800">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Emisor (Contribuyente)</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{dte.dteJson.emisor.nombre}</div>
                    <div className="text-zinc-400">{dte.dteJson.emisor.nombreComercial}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-zinc-500">NIT:</span> {dte.dteJson.emisor.nit}
                    </div>
                    <div>
                      <span className="text-zinc-500">NRC:</span> {dte.dteJson.emisor.nrc}
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Giro:</span> {dte.dteJson.emisor.descActividad}
                    </div>
                    <div className="col-span-2 text-zinc-400">
                      {dte.dteJson.emisor.direccion.complemento}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400 font-medium pb-2 border-b border-zinc-800">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Receptor (Cliente)</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{dte.dteJson.receptor.nombre}</div>
                    {dte.dteJson.receptor.correo && (
                      <div className="text-zinc-400">{dte.dteJson.receptor.correo}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-zinc-500">Doc:</span> {dte.dteJson.receptor.numDocumento || 'N/A'}
                    </div>
                    {dte.dteJson.receptor.nrc && (
                      <div>
                        <span className="text-zinc-500">NRC:</span> {dte.dteJson.receptor.nrc}
                      </div>
                    )}
                    {dte.dteJson.receptor.telefono && (
                      <div>
                        <span className="text-zinc-500">Teléfono:</span> {dte.dteJson.receptor.telefono}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 font-medium text-xs text-zinc-300">
                  Detalle de Ítems / Bienes y Servicios
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[11px]">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Descripción</th>
                      <th className="px-4 py-2 text-right">Cant.</th>
                      <th className="px-4 py-2 text-right">Precio Uni.</th>
                      <th className="px-4 py-2 text-right">Gravada</th>
                      <th className="px-4 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {dte.dteJson.cuerpoDocumento.map((it) => (
                      <tr key={it.numItem}>
                        <td className="px-4 py-2.5 font-mono text-zinc-500">{it.numItem}</td>
                        <td className="px-4 py-2.5 text-zinc-200">
                          <div>{it.descripcion}</div>
                          {it.codigo && <span className="text-[10px] text-zinc-500 font-mono">[{it.codigo}]</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{it.cantidad}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-300">${it.precioUni.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-300">${it.ventaGravada.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-white">${it.ventaGravada.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Legal Words */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Valor Legal en Letras
                    </span>
                    <p className="text-zinc-200 font-medium mt-1 leading-relaxed">
                      {dte.dteJson.resumen.totalLetras}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
                    Moneda Oficial: Dólares de los Estados Unidos de América (USD)
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs space-y-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal Ventas Gravadas:</span>
                    <span className="font-mono text-zinc-200">${dte.dteJson.resumen.totalGravada.toFixed(2)}</span>
                  </div>
                  {dte.dteJson.resumen.tributos?.map((trib) => (
                    <div key={trib.codigo} className="flex justify-between text-zinc-400">
                      <span>{trib.descripcion}:</span>
                      <span className="font-mono text-zinc-200">${trib.valor.toFixed(2)}</span>
                    </div>
                  ))}
                  {dte.dteJson.resumen.ivaRete1 > 0 && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Retención IVA 1%:</span>
                      <span className="font-mono text-red-400">-${dte.dteJson.resumen.ivaRete1.toFixed(2)}</span>
                    </div>
                  )}
                  {dte.dteJson.resumen.reteRenta > 0 && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Retención Renta 10%:</span>
                      <span className="font-mono text-red-400">-${dte.dteJson.resumen.reteRenta.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm text-white">
                    <span>Total a Pagar:</span>
                    <span className="font-mono text-emerald-400">${dte.dteJson.resumen.totalPagar.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-mono">
                  Schema DTE Oficial (JSON Canónico UTF-8)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyJSON}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs text-zinc-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs text-zinc-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .json
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[55vh]">
                {JSON.stringify(dte.dteJson, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'jws' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded flex items-center gap-2 text-blue-300">
                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>
                  Firma Electrónica generada con el algoritmo estándar <strong>RS512 (SHA512withRSA)</strong> y llave criptográfica privada del contribuyente.
                </span>
              </div>

              {jwsParsed ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-zinc-400 font-medium">Header JWS:</span>
                    <pre className="p-2.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 mt-1">
                      {JSON.stringify(jwsParsed.header, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-medium">Firma Criptográfica (Base64URL):</span>
                    <pre className="p-2.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[11px] text-purple-300 break-all mt-1">
                      {jwsParsed.signature}
                    </pre>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-medium">Token JWS Compacto Completo:</span>
                    <pre className="p-2.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[11px] text-zinc-400 break-all mt-1 max-h-36 overflow-y-auto">
                      {dte.jwsFirmado}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
                  Este comprobante aún no ha sido firmado.
                </div>
              )}
            </div>
          )}

          {activeTab === 'mh' && (
            <div className="space-y-4 text-xs">
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-semibold text-white">Sello Oficial de Recepción</span>
                  <span className="font-mono text-zinc-400">{dte.fhProcesamiento || 'Pendiente'}</span>
                </div>

                {dte.selloRecibido ? (
                  <>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-emerald-400 text-sm font-bold tracking-wider">
                      {dte.selloRecibido}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-zinc-400 pt-1">
                      <div>
                        <span className="text-zinc-500">Estado:</span> <span className="text-white font-medium">{dte.estado}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Código Respuesta:</span> <span className="text-white font-mono">{dte.codigoMsg || '001'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500">Descripción:</span> <span className="text-white">{dte.descripcionMsg || 'RECIBIDO CON EXITO'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-zinc-500">
                    El documento está en estado {dte.estado}. Aún no ha sido transmitido o recibido por Hacienda.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Comprobante
                </button>
              </div>

              {/* Graphic representation ticket (Exact printable look) */}
              <div className="max-w-md mx-auto bg-white text-black p-6 rounded shadow-lg font-mono text-xs space-y-3 border border-zinc-300">
                <div className="text-center space-y-0.5 border-b border-black pb-3">
                  <h1 className="font-bold text-sm tracking-tight">{dte.dteJson.emisor.nombre}</h1>
                  <p className="text-[11px]">{dte.dteJson.emisor.nombreComercial}</p>
                  <p className="text-[10px]">NIT: {dte.dteJson.emisor.nit} | NRC: {dte.dteJson.emisor.nrc}</p>
                  <p className="text-[10px]">{dte.dteJson.emisor.direccion.complemento}</p>
                  <p className="text-[10px]">Tel: {dte.dteJson.emisor.telefono}</p>
                </div>

                <div className="text-center font-bold text-xs pt-1">
                  {dte.tipoDte === '01' ? 'DOCUMENTO TRIBUTARIO ELECTRÓNICO\nFACTURA' : 'DOCUMENTO TRIBUTARIO ELECTRÓNICO\nCOMPROBANTE DE CRÉDITO FISCAL'}
                </div>

                <div className="text-[10px] space-y-0.5 border-t border-b border-black py-2">
                  <div><strong>NÚMERO DE CONTROL:</strong> {dte.numeroControl}</div>
                  <div className="break-all"><strong>CÓDIGO DE GENERACIÓN:</strong> {dte.codigoGeneracion}</div>
                  <div><strong>SELLO DE RECEPCIÓN:</strong> {dte.selloRecibido || 'EN PROCESO'}</div>
                  <div><strong>FECHA / HORA:</strong> {dte.fechaEmision} {dte.horaEmision}</div>
                </div>

                <div className="text-[10px] space-y-0.5 pb-2">
                  <div><strong>CLIENTE:</strong> {dte.dteJson.receptor.nombre}</div>
                  {dte.dteJson.receptor.numDocumento && (
                    <div><strong>DOC IDENT:</strong> {dte.dteJson.receptor.numDocumento}</div>
                  )}
                  {dte.dteJson.receptor.nrc && (
                    <div><strong>NRC:</strong> {dte.dteJson.receptor.nrc}</div>
                  )}
                </div>

                <table className="w-full text-[10px] text-left border-t border-black pt-1">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="py-1">CANT</th>
                      <th className="py-1">DESCRIPCIÓN</th>
                      <th className="py-1 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dte.dteJson.cuerpoDocumento.map((it) => (
                      <tr key={it.numItem}>
                        <td className="py-1 align-top">{it.cantidad}</td>
                        <td className="py-1">{it.descripcion}</td>
                        <td className="py-1 text-right align-top">${it.ventaGravada.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-black pt-2 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>SUMA:</span>
                    <span>${dte.dteJson.resumen.subTotalVentas.toFixed(2)}</span>
                  </div>
                  {dte.dteJson.resumen.tributos?.map((t) => (
                    <div key={t.codigo} className="flex justify-between">
                      <span>{t.descripcion}:</span>
                      <span>${t.valor.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
                    <span>TOTAL A PAGAR:</span>
                    <span>${dte.dteJson.resumen.totalPagar.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[9px] pt-1 leading-tight">
                  {dte.dteJson.resumen.totalLetras}
                </div>

                {qrCodeDataUrl && (
                  <div className="pt-3 border-t border-black flex flex-col items-center text-center">
                    <img src={qrCodeDataUrl} alt="QR Consulta Pública Hacienda" className="w-28 h-28" />
                    <span className="text-[8px] text-zinc-600 mt-1">
                      Consulte este documento en https://factura.gob.sv
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Invalidación */}
      {showInvalidateModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-5 space-y-4 text-zinc-100 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Invalidar Documento Tributario (CAT-024)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Esta acción emitirá un evento oficial de invalidación ante el Ministerio de Hacienda para el documento <strong className="text-white font-mono">{dte.numeroControl}</strong>. Los DTEs son inmutables y la invalidación quedará registrada con código hash y auditoría.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Tipo de Invalidación (CAT-024):</label>
                <select
                  value={invalidationTipo}
                  onChange={(e) => setInvalidationTipo(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
                >
                  <option value={1}>1 - Rescisión del contrato / acuerdo</option>
                  <option value={2}>2 - Rescisión parcial o devolución</option>
                  <option value={3}>3 - Error en la información del DTE</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Motivo / Justificación:</label>
                <textarea
                  rows={3}
                  value={invalidationMotivo}
                  onChange={(e) => setInvalidationMotivo(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                  placeholder="Describa el motivo de la anulación..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInvalidateModal(false)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs text-zinc-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onInvalidate(dte.id, invalidationMotivo, invalidationTipo);
                  setShowInvalidateModal(false);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs font-medium text-white transition-colors"
              >
                Confirmar Invalidación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

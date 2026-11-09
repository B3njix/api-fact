import React from 'react';
import { DTERecord, Tenant } from '../types/dte';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

interface DashboardViewProps {
  ambiente: '00' | '01';
  dtes: DTERecord[];
  currentTenant: Tenant;
  onSelectDTE: (dte: DTERecord) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  ambiente,
  dtes,
  currentTenant,
  onSelectDTE,
  onNavigateTab,
}) => {
  const filtered = dtes.filter((d) => d.ambiente === ambiente);
  const totalEmitidos = filtered.length;
  const procesados = filtered.filter((d) => d.estado === 'PROCESADO').length;
  const rechazados = filtered.filter((d) => d.estado === 'RECHAZADO').length;
  const firmados = filtered.filter((d) => d.estado === 'FIRMADO').length;
  const totalMonto = filtered.reduce((acc, d) => acc + d.totalPagar, 0);

  const tasaAceptacion = totalEmitidos > 0 ? ((procesados / totalEmitidos) * 100).toFixed(1) : '100.0';

  const countByTipo = {
    '01': filtered.filter((d) => d.tipoDte === '01').length,
    '03': filtered.filter((d) => d.tipoDte === '03').length,
    '05': filtered.filter((d) => d.tipoDte === '05').length,
    '14': filtered.filter((d) => d.tipoDte === '14').length,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-100">
      {/* Top Banner indicating Environment strictly */}
      <div
        className={`p-3.5 rounded border text-xs flex items-center justify-between ${
          ambiente === '00'
            ? 'bg-amber-950/20 border-amber-800/40 text-amber-200/90'
            : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200/90'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              ambiente === '00' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span>
            {ambiente === '00'
              ? 'Ambiente SANDBOX activo: Las transmisiones y sellos generados son simulados y cumplen con los esquemas de prueba de Hacienda.'
              : 'Ambiente PRODUCCIÓN activo: Transmisiones conectadas a los servidores oficiales de la DGII de El Salvador.'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-400">
          NIT Emisor: {currentTenant.nit}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">DTEs Emitidos</span>
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalEmitidos}</div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">{procesados} procesados</span>
            <span>·</span>
            <span>{firmados} pendientes</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Volumen Transaccionado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${totalMonto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>USD Facturado en {currentTenant.nombreComercial}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Tasa de Aprobación</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{tasaAceptacion}%</div>
          <div className="text-[11px] text-zinc-400 mt-2">
            {rechazados === 0 ? 'Sin rechazos tributarios' : `${rechazados} con observaciones`}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Firma Criptográfica</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-semibold text-zinc-200 tracking-tight">JWS RS512 / SHA512</div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Certificado Activo (Válido 2027)</span>
          </div>
        </div>
      </div>

      {/* Tipos de Documento breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
          Distribución por Tipo de Documento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-[11px]">Factura (01)</div>
              <div className="font-semibold text-white text-base">{countByTipo['01']}</div>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">FE</span>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-[11px]">Crédito Fiscal (03)</div>
              <div className="font-semibold text-white text-base">{countByTipo['03']}</div>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">CCFE</span>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-[11px]">Sujeto Excluido (14)</div>
              <div className="font-semibold text-white text-base">{countByTipo['14']}</div>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">FSEE</span>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-[11px]">Nota de Crédito (05)</div>
              <div className="font-semibold text-white text-base">{countByTipo['05']}</div>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">NCE</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Últimas Transmisiones Registradas</h3>
            <p className="text-xs text-zinc-400">Comprobantes tributarios emitidos con trazabilidad e inmutabilidad</p>
          </div>
          <button
            onClick={() => onNavigateTab('dtes')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            Ver todos los documentos
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            No hay documentos registrados en este ambiente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 font-medium border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-2.5">Número de Control</th>
                  <th className="px-4 py-2.5">Tipo</th>
                  <th className="px-4 py-2.5">Receptor</th>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5 text-right">Total USD</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.slice(0, 5).map((dte) => (
                  <tr
                    key={dte.id}
                    onClick={() => onSelectDTE(dte)}
                    className="hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-zinc-300 font-medium">
                      {dte.numeroControl}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {dte.tipoDte === '01' ? 'Factura' : dte.tipoDte === '03' ? 'Crédito Fiscal' : dte.tipoDte === '14' ? 'Sujeto Excluido' : 'Nota Crédito'}
                    </td>
                    <td className="px-4 py-3 text-zinc-200 max-w-[200px] truncate">
                      {dte.receptorNombre}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">
                      {dte.fechaEmision}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white font-mono">
                      ${dte.totalPagar.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium text-[11px] ${
                          dte.estado === 'PROCESADO'
                            ? 'text-emerald-400'
                            : dte.estado === 'FIRMADO'
                            ? 'text-blue-400'
                            : dte.estado === 'INVALIDADO'
                            ? 'text-zinc-400'
                            : 'text-red-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            dte.estado === 'PROCESADO'
                              ? 'bg-emerald-400'
                              : dte.estado === 'FIRMADO'
                              ? 'bg-blue-400'
                              : dte.estado === 'INVALIDADO'
                              ? 'bg-zinc-400'
                              : 'bg-red-400'
                          }`}
                        />
                        {dte.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-zinc-400 hover:text-white text-xs">
                        Inspeccionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

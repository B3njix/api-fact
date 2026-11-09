import React, { useState } from 'react';
import { DTERecord } from '../types/dte';
import {
  Search,
  Filter,
  Send,
  ExternalLink,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

interface DTEListViewProps {
  ambiente: '00' | '01';
  dtes: DTERecord[];
  onSelectDTE: (dte: DTERecord) => void;
  onTransmitDTE: (id: string) => void;
  onOpenCreate: () => void;
}

export const DTEListView: React.FC<DTEListViewProps> = ({
  ambiente,
  dtes,
  onSelectDTE,
  onTransmitDTE,
  onOpenCreate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('ALL');
  const [estadoFilter, setEstadoFilter] = useState('ALL');

  const filtered = dtes.filter((d) => {
    if (d.ambiente !== ambiente) return false;
    if (tipoFilter !== 'ALL' && d.tipoDte !== tipoFilter) return false;
    if (estadoFilter !== 'ALL' && d.estado !== estadoFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        d.codigoGeneracion.toLowerCase().includes(s) ||
        d.numeroControl.toLowerCase().includes(s) ||
        d.receptorNombre.toLowerCase().includes(s) ||
        (d.receptorNumDoc && d.receptorNumDoc.toLowerCase().includes(s))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-zinc-100 bg-zinc-950">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/50">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por UUID, Control o Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500"
            />
          </div>

          {/* Tipo DTE Filter */}
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="01">Factura (01)</option>
            <option value="03">Crédito Fiscal (03)</option>
            <option value="14">Sujeto Excluido (14)</option>
            <option value="05">Nota de Crédito (05)</option>
          </select>

          {/* Estado Filter */}
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PROCESADO">Procesados</option>
            <option value="FIRMADO">Firmados (Pendientes)</option>
            <option value="RECHAZADO">Rechazados</option>
            <option value="INVALIDADO">Invalidados</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-zinc-500 font-mono">
            {filtered.length} {filtered.length === 1 ? 'documento' : 'documentos'}
          </span>
          <button
            onClick={onOpenCreate}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
          >
            + Nuevo Documento
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-500">
              <Filter className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-zinc-300">No se encontraron comprobantes</p>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              No hay documentos tributarios que coincidan con los filtros aplicados en el ambiente de {ambiente === '00' ? 'Sandbox' : 'Producción'}.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 sticky top-0 z-10 text-zinc-400 font-medium border-b border-zinc-800">
              <tr>
                <th className="px-4 py-2.5">Número de Control</th>
                <th className="px-4 py-2.5">Código Generación (UUID)</th>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Receptor</th>
                <th className="px-4 py-2.5">Emisión</th>
                <th className="px-4 py-2.5 text-right">Total USD</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filtered.map((dte) => (
                <tr
                  key={dte.id}
                  onClick={() => onSelectDTE(dte)}
                  className="hover:bg-zinc-900/60 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-mono text-zinc-200 font-medium">
                    {dte.numeroControl}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-500 text-[11px] truncate max-w-[140px]">
                    {dte.codigoGeneracion}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <span className="font-medium">
                      {dte.tipoDte === '01' ? 'FE' : dte.tipoDte === '03' ? 'CCFE' : dte.tipoDte === '14' ? 'FSEE' : 'NCE'}
                    </span>
                    <span className="text-zinc-500 text-[10px] ml-1">
                      ({dte.tipoDte})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-200 max-w-[220px] truncate">
                    <div>{dte.receptorNombre}</div>
                    {dte.receptorNumDoc && (
                      <div className="text-[10px] text-zinc-500 font-mono">{dte.receptorNumDoc}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-[11px]">
                    {dte.fechaEmision}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white font-mono">
                    ${dte.totalPagar.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-[11px]">
                      {dte.estado === 'PROCESADO' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Procesado</span>
                        </>
                      ) : dte.estado === 'FIRMADO' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-blue-400">Firmado</span>
                        </>
                      ) : dte.estado === 'INVALIDADO' ? (
                        <>
                          <Ban className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-400">Invalidado</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-red-400">Rechazado</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {dte.estado === 'FIRMADO' && (
                        <button
                          onClick={() => onTransmitDTE(dte.id)}
                          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Transmitir documento a Hacienda"
                        >
                          <Send className="w-3 h-3" />
                          Transmitir
                        </button>
                      )}
                      <button
                        onClick={() => onSelectDTE(dte)}
                        className="p-1 text-zinc-400 hover:text-white transition-colors"
                        title="Ver detalle e inspección"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

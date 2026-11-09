import React from 'react';
import { AuditLogItem } from '../types/dte';
import { History, Shield, Lock } from 'lucide-react';

interface AuditViewProps {
  logs: AuditLogItem[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 text-zinc-100 bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Bitácora de Auditoría Inmutable
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Registro inalterable de operaciones criptográficas, emisiones y transmisiones a Hacienda (Conservación 10 años).
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-3 py-1.5 rounded">
            <Lock className="w-3.5 h-3.5" />
            <span>Append-Only Ledger Activo</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-medium border-b border-zinc-800">
              <tr>
                <th className="px-4 py-2.5">Fecha y Hora</th>
                <th className="px-4 py-2.5">Acción</th>
                <th className="px-4 py-2.5">Usuario / API Key</th>
                <th className="px-4 py-2.5">Recurso</th>
                <th className="px-4 py-2.5">IP Origen</th>
                <th className="px-4 py-2.5">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('es-SV')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-blue-400 text-[11px]">
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300 text-[11px]">
                    {log.usuarioOApiKey}
                  </td>
                  <td className="px-4 py-3 font-mono text-white text-[11px] whitespace-nowrap">
                    {log.recursoId}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-500 text-[11px]">
                    {log.ip}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs max-w-xs truncate">
                    {log.detalles}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

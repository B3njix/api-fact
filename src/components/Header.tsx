import React from 'react';
import { Tenant } from '../types/dte';
import { Building2, ShieldCheck, Plus, Terminal } from 'lucide-react';

interface HeaderProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (t: Tenant) => void;
  ambiente: '00' | '01';
  onToggleAmbiente: (amb: '00' | '01') => void;
  onOpenCreateModal: () => void;
  onOpenDevStudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  ambiente,
  onToggleAmbiente,
  onOpenCreateModal,
  onOpenDevStudio,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between text-zinc-100 select-none">
      {/* Brand & Tenant Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs tracking-wider">
            AF
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight tracking-tight text-white flex items-center gap-1.5">
              API-Fact
              <span className="text-[10px] text-zinc-500 font-normal">ChivoDevs</span>
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Tenant selector */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={currentTenant.id}
            onChange={(e) => {
              const selected = tenants.find((t) => t.id === e.target.value);
              if (selected) onSelectTenant(selected);
            }}
            className="bg-transparent text-zinc-200 outline-none cursor-pointer font-medium text-xs pr-1"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id} className="bg-zinc-900 text-zinc-200">
                {t.nombre} ({t.establecimientoCodigo}/{t.puntoVentaCodigo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Environment Segregation Switcher */}
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5 text-xs">
        <button
          onClick={() => onToggleAmbiente('00')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors font-medium ${
            ambiente === '00'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Sandbox (Pruebas)
        </button>
        <button
          onClick={() => onToggleAmbiente('01')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors font-medium ${
            ambiente === '01'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Producción MH
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenDevStudio}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          Developer Studio
        </button>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Emitir DTE
        </button>
      </div>
    </header>
  );
};

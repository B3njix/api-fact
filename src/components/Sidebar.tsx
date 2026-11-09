import React from 'react';
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  Terminal,
  Key,
  Webhook,
  Sliders,
  Building,
  BookOpen,
  History,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'dtes'
  | 'create-dte'
  | 'api-explorer'
  | 'api-keys'
  | 'webhooks'
  | 'sandbox-console'
  | 'company-settings'
  | 'catalogs'
  | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 0,
}) => {
  const navSections = [
    {
      title: 'Operaciones',
      items: [
        { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'dtes' as NavTab, label: 'Documentos DTE', icon: FileText, badge: pendingCount },
        { id: 'create-dte' as NavTab, label: 'Emitir Comprobante', icon: FilePlus2 },
      ],
    },
    {
      title: 'Developer Studio',
      items: [
        { id: 'api-explorer' as NavTab, label: 'API Explorer', icon: Terminal },
        { id: 'api-keys' as NavTab, label: 'Claves de API', icon: Key },
        { id: 'webhooks' as NavTab, label: 'Webhooks', icon: Webhook },
      ],
    },
    {
      title: 'Hacienda Sandbox',
      items: [
        { id: 'sandbox-console' as NavTab, label: 'Consola & Fallas', icon: Sliders },
      ],
    },
    {
      title: 'Configuración',
      items: [
        { id: 'company-settings' as NavTab, label: 'Empresa & Firma', icon: Building },
        { id: 'catalogs' as NavTab, label: 'Catálogos MH', icon: BookOpen },
        { id: 'audit' as NavTab, label: 'Bitácora & Auditoría', icon: History },
      ],
    },
  ];

  return (
    <aside className="w-56 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between select-none">
      <div className="py-3 px-2 flex flex-col gap-4">
        {navSections.map((sec) => (
          <div key={sec.title} className="flex flex-col gap-0.5">
            <span className="px-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              {sec.title}
            </span>
            {sec.items.map((it) => {
              const Icon = it.icon;
              const isActive = currentTab === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => onSelectTab(it.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors font-medium ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <span>{it.label}</span>
                  </div>
                  {it.badge && it.badge > 0 ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded">
                      {it.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Compliance footer indicator */}
      <div className="p-3 border-t border-zinc-900 bg-zinc-950/50 flex items-center gap-2 text-[11px] text-zinc-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <span className="truncate">Normativa DGII El Salvador</span>
      </div>
    </aside>
  );
};

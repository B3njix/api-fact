import React, { useState, useEffect } from 'react';
import {
  Tenant,
  DTERecord,
  ApiKeyItem,
  WebhookItem,
  AuditLogItem,
  SandboxConfig,
} from './types/dte';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DTEListView } from './components/DTEListView';
import { DTEDetailModal } from './components/DTEDetailModal';
import { CreateDTEView } from './components/CreateDTEView';
import { DeveloperStudioView } from './components/DeveloperStudioView';
import { SandboxConsoleView } from './components/SandboxConsoleView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { CatalogsView } from './components/CatalogsView';
import { AuditView } from './components/AuditView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [ambiente, setAmbiente] = useState<'00' | '01'>('00'); // '00' Sandbox por defecto

  // State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [dtes, setDtes] = useState<DTERecord[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [sandboxConfig, setSandboxConfig] = useState<SandboxConfig>({
    latenciaMs: 120,
    simularError500: false,
    simularTimeout: false,
    simularRechazoMatematico: false,
    simularFalloFirma: false,
  });

  const [selectedDTE, setSelectedDTE] = useState<DTERecord | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [tRes, dRes, kRes, wRes, aRes, sRes] = await Promise.all([
        fetch('/api/v1/tenants').then((r) => r.json()),
        fetch('/api/v1/dtes').then((r) => r.json()),
        fetch('/api/v1/apikeys').then((r) => r.json()),
        fetch('/api/v1/webhooks').then((r) => r.json()),
        fetch('/api/v1/audit').then((r) => r.json()),
        fetch('/api/v1/sandbox/config').then((r) => r.json()),
      ]);

      if (tRes.data && tRes.data.length > 0) {
        setTenants(tRes.data);
        if (!currentTenant) {
          setCurrentTenant(tRes.data[0]); // GymPro
        }
      }
      if (dRes.data) setDtes(dRes.data);
      if (kRes.data) setApiKeys(kRes.data);
      if (wRes.data) setWebhooks(wRes.data);
      if (aRes.data) setAuditLogs(aRes.data);
      if (sRes.data) setSandboxConfig(sRes.data);
    } catch (err) {
      console.error('Error fetching API-Fact data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Transmit DTE action
  const handleTransmitDTE = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/dtes/${id}/transmit`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        // Update selected if open
        if (selectedDTE && selectedDTE.id === id) {
          setSelectedDTE(data.data);
        }
      }
    } catch (err) {
      console.error('Error transmitting DTE:', err);
    }
  };

  // Invalidate DTE action
  const handleInvalidateDTE = async (id: string, motivo: string, tipo: number) => {
    try {
      const res = await fetch(`/api/v1/dtes/${id}/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, tipoInvalidacion: tipo }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        if (selectedDTE && selectedDTE.id === id) {
          setSelectedDTE(data.data.dte);
        }
      }
    } catch (err) {
      console.error('Error invalidating DTE:', err);
    }
  };

  // Update Sandbox config
  const handleUpdateSandboxConfig = async (newCfg: Partial<SandboxConfig>) => {
    try {
      const res = await fetch('/api/v1/sandbox/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCfg),
      });
      const data = await res.json();
      if (data.success) {
        setSandboxConfig(data.data);
      }
    } catch (err) {
      console.error('Error updating sandbox config:', err);
    }
  };

  if (!currentTenant) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs">
        Cargando API-Fact...
      </div>
    );
  }

  const pendingDTEs = dtes.filter((d) => d.ambiente === ambiente && d.estado === 'FIRMADO').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden select-none">
      {/* Top Application Header */}
      <Header
        tenants={tenants}
        currentTenant={currentTenant}
        onSelectTenant={setCurrentTenant}
        ambiente={ambiente}
        onToggleAmbiente={setAmbiente}
        onOpenCreateModal={() => setCurrentTab('create-dte')}
        onOpenDevStudio={() => setCurrentTab('api-explorer')}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingCount={pendingDTEs}
        />

        {/* Tab Content Panels */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {currentTab === 'dashboard' && (
            <DashboardView
              ambiente={ambiente}
              dtes={dtes}
              currentTenant={currentTenant}
              onSelectDTE={setSelectedDTE}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'dtes' && (
            <DTEListView
              ambiente={ambiente}
              dtes={dtes}
              onSelectDTE={setSelectedDTE}
              onTransmitDTE={handleTransmitDTE}
              onOpenCreate={() => setCurrentTab('create-dte')}
            />
          )}

          {currentTab === 'create-dte' && (
            <CreateDTEView
              currentTenant={currentTenant}
              ambiente={ambiente}
              onCreated={async () => {
                await fetchData();
                setCurrentTab('dtes');
              }}
            />
          )}

          {(currentTab === 'api-explorer' || currentTab === 'api-keys' || currentTab === 'webhooks') && (
            <DeveloperStudioView
              currentTenant={currentTenant}
              ambiente={ambiente}
              apiKeys={apiKeys}
              webhooks={webhooks}
              onRefreshKeys={fetchData}
              onRefreshWebhooks={fetchData}
            />
          )}

          {currentTab === 'sandbox-console' && (
            <SandboxConsoleView
              config={sandboxConfig}
              onUpdateConfig={handleUpdateSandboxConfig}
            />
          )}

          {currentTab === 'company-settings' && (
            <CompanySettingsView currentTenant={currentTenant} />
          )}

          {currentTab === 'catalogs' && <CatalogsView />}

          {currentTab === 'audit' && <AuditView logs={auditLogs} />}
        </main>
      </div>

      {/* DTE Detail and Printable Graphic Representation Modal */}
      {selectedDTE && (
        <DTEDetailModal
          dte={selectedDTE}
          onClose={() => setSelectedDTE(null)}
          onTransmit={handleTransmitDTE}
          onInvalidate={handleInvalidateDTE}
        />
      )}
    </div>
  );
}

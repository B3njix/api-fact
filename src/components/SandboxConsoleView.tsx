import React, { useState } from 'react';
import { SandboxConfig } from '../types/dte';
import {
  Sliders,
  AlertTriangle,
  Zap,
  Clock,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface SandboxConsoleViewProps {
  config: SandboxConfig;
  onUpdateConfig: (newCfg: Partial<SandboxConfig>) => void;
}

export const SandboxConsoleView: React.FC<SandboxConsoleViewProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof SandboxConfig, val: any) => {
    onUpdateConfig({ [key]: val });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    onUpdateConfig({
      latenciaMs: 120,
      simularError500: false,
      simularTimeout: false,
      simularRechazoMatematico: false,
      simularFalloFirma: false,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 text-zinc-100 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              Consola del Simulador Sandbox (Hacienda DGII)
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simula fielmente el comportamiento, validaciones y respuestas del Ministerio de Hacienda antes de solicitar acceso al ambiente oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Actualizado
              </span>
            )}
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              Valores por Defecto
            </button>
          </div>
        </div>

        {/* Legal Warning Notice */}
        <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-300">Aislamiento Criptográfico de Pruebas:</span>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              El sandbox de API-Fact nunca genera sellos oficiales del Ministerio de Hacienda. Todos los sellos asignados están estrictamente prefijados como <code className="font-mono bg-amber-900/40 px-1 py-0.5 rounded text-amber-200">SIMULATED-MH-XXXXX</code> para garantizar que ningún comprobante de prueba sea confundido con una obligación tributaria real.
            </p>
          </div>
        </div>

        {/* Latency Slider */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Latencia de Red Simulada
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-blue-400">
              {config.latenciaMs} ms
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="3000"
            step="50"
            value={config.latenciaMs}
            onChange={(e) => handleToggle('latenciaMs', parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>0 ms (Instantáneo)</span>
            <span>120 ms (Normal)</span>
            <span>1500 ms (Conexión lenta)</span>
            <span>3000 ms (Congestión)</span>
          </div>
        </div>

        {/* Chaos / Fault Injection Toggles */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Inyección de Fallos e Incertidumbre de Red
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <div className="text-xs font-medium text-white">Simular Caída del Servicio de Hacienda (HTTP 500)</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  El simulador responderá con error 500 de servidor para validar que el cliente no reintente a ciegas sin consultar el estado.
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.simularError500}
                onChange={(e) => handleToggle('simularError500', e.target.checked)}
                className="w-4 h-4 accent-red-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <div className="text-xs font-medium text-white">Simular Timeout de Conexión</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Fuerza que la petición supere el tiempo de espera configurado de 15 segundos para probar el circuito de contingencia.
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.simularTimeout}
                onChange={(e) => handleToggle('simularTimeout', e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <div className="text-xs font-medium text-white">Simular Rechazo por Fallo Criptográfico de Firma JWS</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Rechaza el payload con código 004 ("Firma criptográfica inválida o certificado revocado").
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.simularFalloFirma}
                onChange={(e) => handleToggle('simularFalloFirma', e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Simulator Endpoints reference */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5 space-y-3 text-xs">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
            Rutas de la API Simulada de Hacienda (Reemplazo local transparente)
          </span>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between p-2 bg-zinc-950 rounded">
              <span className="text-zinc-400">Autenticación (Obtener Token):</span>
              <span className="text-emerald-400">POST /api/sandbox/seguridad/autenticar</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-zinc-950 rounded">
              <span className="text-zinc-400">Recepción DTE (Firma JWS):</span>
              <span className="text-emerald-400">POST /api/sandbox/fesv/recepciondte</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

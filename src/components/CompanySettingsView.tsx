import React from 'react';
import { Tenant } from '../types/dte';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  FileCheck2,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';

interface CompanySettingsViewProps {
  currentTenant: Tenant;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({ currentTenant }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 text-zinc-100 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Configuración de Empresa & Certificados
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Datos fiscales registrados ante el Ministerio de Hacienda y llaves criptográficas de firma.
          </p>
        </div>

        {/* Company Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-white">{currentTenant.nombre}</h2>
              <p className="text-zinc-400">{currentTenant.nombreComercial}</p>
            </div>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[11px] font-mono">
              Casa Matriz ({currentTenant.establecimientoCodigo})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[11px]">NIT (Número de Identificación Tributaria):</span>
              <div className="font-mono text-zinc-200 text-sm font-medium">{currentTenant.nit}</div>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 text-[11px]">NRC (Registro de Contribuyente IVA):</span>
              <div className="font-mono text-zinc-200 text-sm font-medium">{currentTenant.nrc}</div>
            </div>

            <div className="col-span-2 space-y-1">
              <span className="text-zinc-500 text-[11px]">Actividad Económica (CAT-019):</span>
              <div className="text-zinc-200">
                <span className="font-mono text-blue-400 font-semibold">{currentTenant.codActividad}</span> · {currentTenant.descActividad}
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Dirección Fiscal:
              </span>
              <div className="text-zinc-300">
                {currentTenant.direccion} (Depto: {currentTenant.departamento}, Municipio: {currentTenant.municipio})
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Correo de Notificación Tributaria:
              </span>
              <div className="text-zinc-300">{currentTenant.correo}</div>
            </div>

            <div className="space-y-1">
              <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                Teléfono de Contacto:
              </span>
              <div className="text-zinc-300">{currentTenant.telefono}</div>
            </div>
          </div>
        </div>

        {/* Cryptographic JWS Certificate */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-white uppercase tracking-wider text-xs">
              Certificado de Firma Electrónica JWS (MH)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-1">
              <span className="text-zinc-500 text-[11px]">Algoritmo Criptográfico:</span>
              <div className="font-mono font-bold text-white text-xs">RS512 (SHA512withRSA)</div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-1">
              <span className="text-zinc-500 text-[11px]">Longitud de Llave:</span>
              <div className="font-mono font-bold text-white text-xs">RSA 2048-bit</div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-1">
              <span className="text-zinc-500 text-[11px]">Vigencia de Certificado:</span>
              <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Activo hasta Dic 2027
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-400 text-xs leading-relaxed">
            <p>
              La llave privada RSA de la empresa se encuentra resguardada en memoria protegida y nunca se expone fuera de las rutinas de firma. Toda firma generada incluye la cabecera canónica <code className="font-mono text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded">{"{\"alg\":\"RS512\",\"typ\":\"JWT\"}"}</code>.
            </p>
          </div>
        </div>

        {/* Branch & POS information */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-5 space-y-3 text-xs">
          <h3 className="font-semibold text-white uppercase tracking-wider text-xs">
            Establecimiento y Puntos de Venta
          </h3>
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Establecimiento {currentTenant.establecimientoCodigo} · Punto de Venta {currentTenant.puntoVentaCodigo}</div>
              <div className="text-zinc-500 text-[11px] mt-0.5">Asignado para facturación presencial y POS en recepción GymPro</div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[11px]">
              Operativo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

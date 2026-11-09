import React, { useState } from 'react';
import { Tenant, ItemCuerpo } from '../types/dte';
import { calculateDTEResumen } from '../services/dte-engine';
import {
  FilePlus2,
  Trash2,
  Plus,
  Send,
  Save,
  Building2,
  User,
  ShoppingBag,
} from 'lucide-react';

interface CreateDTEViewProps {
  currentTenant: Tenant;
  ambiente: '00' | '01';
  onCreated: () => void;
}

export const CreateDTEView: React.FC<CreateDTEViewProps> = ({
  currentTenant,
  ambiente,
  onCreated,
}) => {
  const [tipoDte, setTipoDte] = useState<'01' | '03' | '14' | '05'>('01');
  const [receptorTipoDoc, setReceptorTipoDoc] = useState('13'); // DUI default
  const [receptorNumDoc, setReceptorNumDoc] = useState('');
  const [receptorNrc, setReceptorNrc] = useState('');
  const [receptorNombre, setReceptorNombre] = useState('');
  const [receptorCorreo, setReceptorCorreo] = useState('');
  const [receptorTelefono, setReceptorTelefono] = useState('');
  const [condicionOperacion, setCondicionOperacion] = useState(1);
  const [aplicaRetencion1, setAplicaRetencion1] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<ItemCuerpo[]>([
    {
      numItem: 1,
      tipoItem: 2,
      cantidad: 1,
      codigo: 'MEM-VIP-01',
      uniMedida: 59,
      descripcion: 'Membresía Mensual Black GymPro - Acceso Ilimitado',
      precioUni: 39.99,
      montoDescu: 0,
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada: 39.99,
      tributos: ['20'],
    },
  ]);

  // Presets para agilizar pruebas en GymPro
  const presets = [
    {
      label: 'Membresía Black ($39.99)',
      codigo: 'MEM-VIP-01',
      descripcion: 'Membresía Mensual Black GymPro - Acceso Ilimitado',
      precio: 39.99,
      tipoItem: 2,
    },
    {
      label: 'Plan Trimestral ($105.00)',
      codigo: 'MEM-TRI-03',
      descripcion: 'Plan Trimestral GymPro con Evaluación Física Incluida',
      precio: 105.00,
      tipoItem: 2,
    },
    {
      label: 'Proteína Whey Isolate ($55.00)',
      codigo: 'SUP-PROT-5',
      descripcion: 'Proteína Whey Isolate 5lbs Vainilla',
      precio: 55.00,
      tipoItem: 1,
    },
    {
      label: 'Sesión Entrenador Personal ($25.00)',
      codigo: 'PT-SESSION',
      descripcion: 'Sesión de Entrenamiento Personalizado 1 a 1 (1 hora)',
      precio: 25.00,
      tipoItem: 2,
    },
  ];

  const handleAddItem = (preset?: (typeof presets)[0]) => {
    const nextNum = items.length + 1;
    if (preset) {
      setItems([
        ...items,
        {
          numItem: nextNum,
          tipoItem: preset.tipoItem,
          cantidad: 1,
          codigo: preset.codigo,
          uniMedida: 59,
          descripcion: preset.descripcion,
          precioUni: preset.precio,
          montoDescu: 0,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada: preset.precio,
          tributos: ['20'],
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          numItem: nextNum,
          tipoItem: 2,
          cantidad: 1,
          codigo: `ITEM-${nextNum}`,
          uniMedida: 59,
          descripcion: '',
          precioUni: 0,
          montoDescu: 0,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada: 0,
          tributos: ['20'],
        },
      ]);
    }
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };

    if (field === 'cantidad' || field === 'precioUni') {
      const cant = field === 'cantidad' ? parseFloat(val) || 0 : current.cantidad;
      const prec = field === 'precioUni' ? parseFloat(val) || 0 : current.precioUni;
      current.ventaGravada = Math.round(cant * prec * 100) / 100;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const filtered = items.filter((_, i) => i !== index).map((it, idx) => ({ ...it, numItem: idx + 1 }));
    setItems(filtered);
  };

  // Cálculo en tiempo real
  const resumen = calculateDTEResumen(
    tipoDte,
    items,
    condicionOperacion,
    aplicaRetencion1,
    tipoDte === '14'
  );

  const handleSubmit = async (transmitirDirecto: boolean) => {
    setErrorMsg(null);

    if (!receptorNombre.trim()) {
      setErrorMsg('El nombre o razón social del cliente es requerido.');
      return;
    }

    if (tipoDte === '03' && !receptorNrc.trim()) {
      setErrorMsg('El NRC del cliente es obligatorio para Comprobante de Crédito Fiscal (03).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        tenantId: currentTenant.id,
        ambiente,
        tipoDte,
        receptor: {
          tipoDocumento: receptorTipoDoc,
          numDocumento: receptorNumDoc,
          nrc: tipoDte === '03' ? receptorNrc : undefined,
          nombre: receptorNombre,
          correo: receptorCorreo,
          telefono: receptorTelefono,
        },
        items,
        condicionOperacion,
        aplicaRetencion1,
        aplicaRenta10: tipoDte === '14',
        firmarYTransmitir: transmitirDirecto,
      };

      const res = await fetch('/api/v1/dtes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al emitir el documento');
      }

      onCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la emisión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 text-zinc-100 bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-blue-500" />
              Emisión de Documento Tributario Electrónico (DTE)
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Genera la estructura oficial del Ministerio de Hacienda, firma con JWS RS512 y transmite al sandbox.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-300">
            Ambiente: {ambiente === '00' ? 'Sandbox (00)' : 'Producción (01)'}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/30 border border-red-800 text-red-300 rounded text-xs">
            {errorMsg}
          </div>
        )}

        {/* Tipo de Documento Selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
            1. Tipo de Documento Tributario
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setTipoDte('01');
                setReceptorTipoDoc('13');
              }}
              className={`p-3 rounded border text-left transition-colors ${
                tipoDte === '01'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-bold text-sm">Factura (FE)</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Ventas a consumidor final (CAT-002: 01)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoDte('03');
                setReceptorTipoDoc('36');
              }}
              className={`p-3 rounded border text-left transition-colors ${
                tipoDte === '03'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-bold text-sm">Crédito Fiscal (CCFE)</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Empresas con NRC y NIT (CAT-002: 03)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoDte('14');
                setReceptorTipoDoc('13');
              }}
              className={`p-3 rounded border text-left transition-colors ${
                tipoDte === '14'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-bold text-sm">Sujeto Excluido (FSEE)</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Personas naturales sin IVA (10% Renta)</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoDte('05');
                setReceptorTipoDoc('36');
              }}
              className={`p-3 rounded border text-left transition-colors ${
                tipoDte === '05'
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-bold text-sm">Nota de Crédito (NCE)</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Ajustes o rescisiones a CCFE (CAT-002: 05)</div>
            </button>
          </div>
        </div>

        {/* Receptor Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-400" />
            2. Datos del Receptor (Cliente / Contribuyente)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">Nombre o Razón Social *</label>
              <input
                type="text"
                value={receptorNombre}
                onChange={(e) => setReceptorNombre(e.target.value)}
                placeholder={tipoDte === '03' ? 'Inversiones Cuscatlán S.A. de C.V.' : 'Carlos Eduardo Mendoza'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Tipo de Documento</label>
              <select
                value={receptorTipoDoc}
                onChange={(e) => setReceptorTipoDoc(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none cursor-pointer"
              >
                <option value="13">DUI (13)</option>
                <option value="36">NIT (36)</option>
                <option value="03">Pasaporte (03)</option>
                <option value="37">Otro (37)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Número de Documento</label>
              <input
                type="text"
                value={receptorNumDoc}
                onChange={(e) => setReceptorNumDoc(e.target.value)}
                placeholder={receptorTipoDoc === '13' ? '03847291-5' : '0614-150212-101-3'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {tipoDte === '03' && (
              <div>
                <label className="block text-zinc-400 mb-1">NRC del Receptor (Obligatorio en CCFE) *</label>
                <input
                  type="text"
                  value={receptorNrc}
                  onChange={(e) => setReceptorNrc(e.target.value)}
                  placeholder="182749-2"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-zinc-400 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={receptorCorreo}
                onChange={(e) => setReceptorCorreo(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Teléfono</label>
              <input
                type="text"
                value={receptorTelefono}
                onChange={(e) => setReceptorTelefono(e.target.value)}
                placeholder="+503 7000-0000"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
              3. Detalle de Bienes y Servicios
            </label>

            {/* Presets GymPro */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-500 text-[11px]">Agregar rápido:</span>
              {presets.slice(0, 3).map((p) => (
                <button
                  key={p.codigo}
                  type="button"
                  onClick={() => handleAddItem(p)}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition-colors"
                >
                  + {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 bg-zinc-950 border border-zinc-800 rounded grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-1 text-center font-mono text-zinc-500">{idx + 1}</div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={it.codigo || ''}
                    onChange={(e) => handleUpdateItem(idx, 'codigo', e.target.value)}
                    placeholder="Código"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={it.descripcion}
                    onChange={(e) => handleUpdateItem(idx, 'descripcion', e.target.value)}
                    placeholder="Descripción del ítem *"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={it.cantidad}
                    onChange={(e) => handleUpdateItem(idx, 'cantidad', e.target.value)}
                    placeholder="Cant."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs text-right"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    value={it.precioUni}
                    onChange={(e) => handleUpdateItem(idx, 'precioUni', e.target.value)}
                    placeholder="Precio"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs text-right"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="text-zinc-500 hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleAddItem()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir otra línea
          </button>
        </div>

        {/* Real-time Summary Card & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs space-y-3">
            <span className="font-semibold text-zinc-300 uppercase tracking-wider block">
              Condición y Opciones
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={condicionOperacion === 2}
                  onChange={(e) => setCondicionOperacion(e.target.checked ? 2 : 1)}
                  className="rounded border-zinc-700 bg-zinc-800"
                />
                <span className="text-zinc-300">Venta a Crédito (por defecto Contado)</span>
              </label>

              {tipoDte === '03' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaRetencion1}
                    onChange={(e) => setAplicaRetencion1(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800"
                  />
                  <span className="text-zinc-300">Cliente es Gran Contribuyente (Retener 1% IVA si &ge; $100)</span>
                </label>
              )}
            </div>

            <div className="pt-2 text-[11px] text-zinc-500">
              {resumen.totalLetras}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal Ventas Gravadas:</span>
              <span className="font-mono text-zinc-200">${resumen.totalGravada.toFixed(2)}</span>
            </div>

            {resumen.tributos?.map((trib) => (
              <div key={trib.codigo} className="flex justify-between text-zinc-400">
                <span>{trib.descripcion}:</span>
                <span className="font-mono text-zinc-200">${trib.valor.toFixed(2)}</span>
              </div>
            ))}

            {resumen.ivaRete1 > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Retención 1% IVA:</span>
                <span className="font-mono text-red-400">-${resumen.ivaRete1.toFixed(2)}</span>
              </div>
            )}

            {resumen.reteRenta > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Retención 10% Renta (FSEE):</span>
                <span className="font-mono text-red-400">-${resumen.reteRenta.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm text-white">
              <span>Total a Pagar (USD):</span>
              <span className="font-mono text-emerald-400">${resumen.totalPagar.toFixed(2)}</span>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Solo Firmar (Borrador)
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Procesando...' : 'Emitir y Transmitir a Hacienda'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CAT_002_TIPOS_DTE,
  CAT_012_DEPARTAMENTOS,
  CAT_017_FORMAS_PAGO,
  CAT_019_ACTIVIDADES_ECONOMICAS,
  CAT_024_MOTIVOS_INVALIDACION,
} from '../services/catalogs';
import { BookOpen, Search } from 'lucide-react';

export const CatalogsView: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<'002' | '012' | '017' | '019' | '024'>('002');
  const [search, setSearch] = useState('');

  let currentItems: { codigo: string; descripcion: string }[] = [];
  let title = '';

  if (selectedCat === '002') {
    currentItems = CAT_002_TIPOS_DTE;
    title = 'CAT-002: Tipos de Documento Tributario Electrónico';
  } else if (selectedCat === '012') {
    currentItems = CAT_012_DEPARTAMENTOS;
    title = 'CAT-012: Departamentos de El Salvador';
  } else if (selectedCat === '017') {
    currentItems = CAT_017_FORMAS_PAGO;
    title = 'CAT-017: Formas de Pago';
  } else if (selectedCat === '019') {
    currentItems = CAT_019_ACTIVIDADES_ECONOMICAS;
    title = 'CAT-019: Actividades Económicas (Giros)';
  } else if (selectedCat === '024') {
    currentItems = CAT_024_MOTIVOS_INVALIDACION;
    title = 'CAT-024: Tipos de Invalidación / Anulación';
  }

  const filtered = currentItems.filter(
    (it) =>
      it.codigo.toLowerCase().includes(search.toLowerCase()) ||
      it.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 text-zinc-100 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="pb-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Catálogos Oficiales del Ministerio de Hacienda
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tablas de referencia técnica oficiales para validación de estructuras DTE.
          </p>
        </div>

        {/* Catalog Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setSelectedCat('002'); setSearch(''); }}
            className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${
              selectedCat === '002' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CAT-002 (Tipos DTE)
          </button>
          <button
            onClick={() => { setSelectedCat('017'); setSearch(''); }}
            className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${
              selectedCat === '017' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CAT-017 (Formas Pago)
          </button>
          <button
            onClick={() => { setSelectedCat('019'); setSearch(''); }}
            className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${
              selectedCat === '019' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CAT-019 (Actividades Económicas)
          </button>
          <button
            onClick={() => { setSelectedCat('012'); setSearch(''); }}
            className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${
              selectedCat === '012' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CAT-012 (Departamentos)
          </button>
          <button
            onClick={() => { setSelectedCat('024'); setSearch(''); }}
            className={`px-3 py-1.5 rounded text-xs transition-colors font-medium ${
              selectedCat === '024' ? 'bg-blue-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CAT-024 (Invalidación)
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por código o descripción en el catálogo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
          <div className="p-3 bg-zinc-950 border-b border-zinc-800 text-xs font-semibold text-white">
            {title} ({filtered.length} registros)
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-medium border-b border-zinc-800">
              <tr>
                <th className="px-4 py-2 w-28">Código Oficial</th>
                <th className="px-4 py-2">Descripción Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((item) => (
                <tr key={item.codigo} className="hover:bg-zinc-800/40">
                  <td className="px-4 py-2.5 font-mono text-blue-400 font-bold">{item.codigo}</td>
                  <td className="px-4 py-2.5 text-zinc-200">{item.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

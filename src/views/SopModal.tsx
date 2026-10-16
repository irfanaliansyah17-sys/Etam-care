import React, { useState } from 'react';
import { X, Search, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import { NursingSOP } from '../types';
import { NURSING_SOPS } from '../services/storageService';

interface SopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SopModal: React.FC<SopModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSop, setSelectedSop] = useState<NursingSOP | null>(null);

  if (!isOpen) return null;

  const filteredSops = NURSING_SOPS.filter(
    sop =>
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-xl max-h-[92vh] sm:rounded-2xl rounded-t-3xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="font-bold text-base text-white leading-tight">
                Standar Operasional Prosedur (SOP)
              </h2>
              <p className="text-[11px] text-blue-100">Pedoman Pelayanan Klinis Keperawatan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Tutup SOP"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {selectedSop ? (
            /* SOP Detail View */
            <div className="space-y-3 animate-in fade-in duration-150">
              <button
                onClick={() => setSelectedSop(null)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 min-h-[36px]"
              >
                ← Kembali ke Daftar SOP
              </button>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span className="font-mono text-[10px] bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded font-bold">
                  {selectedSop.code}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1.5">{selectedSop.title}</h3>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Kategori: {selectedSop.category}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Tujuan Prosedur:</span>
                <p className="text-slate-700 leading-relaxed">{selectedSop.purpose}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block px-1">
                  Langkah-Langkah Kerja:
                </span>
                <div className="space-y-2">
                  {selectedSop.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="text-slate-800 leading-snug flex-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* SOP Search & List */
            <>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari SOP (misal: SBAR, infus, obat, jatuh)..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                {filteredSops.map(sop => (
                  <div
                    key={sop.id}
                    onClick={() => setSelectedSop(sop)}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                          {sop.code}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {sop.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">
                        {sop.title}
                      </h4>
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                        {sop.purpose}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

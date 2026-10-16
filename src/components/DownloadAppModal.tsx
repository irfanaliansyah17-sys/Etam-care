import React from 'react';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Globe,
  WifiOff,
  Laptop,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin || window.location.href.split('#')[0] : '';

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center ring-2 ring-white/40">
              <img
                src="/logo-parikesit.svg"
                alt="Ikon Aplikasi RSUD AM Parikesit"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Download & Pasang Aplikasi</h3>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase">
                  PWA
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                ETAM CARE · Pasang di HP, Tablet, atau PC (Bisa Offline)
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status Banner */}
          {isInstalled ? (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Aplikasi Sudah Terpasang!</p>
                <p className="text-emerald-700 mt-0.5">
                  ETAM CARE sudah berjalan dalam mode aplikasi mandiri (*standalone*).
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Primary Install Button (Chrome / Android / Desktop) */}
              {isInstallable ? (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center space-y-3">
                  <p className="text-xs font-semibold text-blue-900">
                    Perangkat Anda mendukung instalasi langsung 1-klik:
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>Pasang Aplikasi Sekarang</span>
                  </button>
                  <span className="text-[11px] text-blue-700 block">
                    Tidak memerlukan Play Store / App Store, hemat memori (~2 MB).
                  </span>
                </div>
              ) : null}

              {/* iOS Safari Instructions */}
              {isIOS && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-amber-900">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <Smartphone className="w-4 h-4" />
                    <span>Petunjuk Pemasangan di iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="text-xs space-y-1.5 list-decimal list-inside text-amber-950 font-medium">
                    <li className="flex items-center gap-1.5">
                      1. Tekan tombol <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> <strong>Bagikan / Share</strong> di bawah browser Safari.
                    </li>
                    <li className="flex items-center gap-1.5">
                      2. Geser ke bawah lalu pilih <PlusSquare className="w-3.5 h-3.5 inline text-slate-800" /> <strong>Tambah ke Layar Utama / Add to Home Screen</strong>.
                    </li>
                    <li>
                      3. Tekan <strong>Tambah / Add</strong> di pojok kanan atas.
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Chrome Instructions (if prompt not yet triggered or manual fallback) */}
              {!isIOS && !isInstallable && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Pemasangan Cepat di Android / Chrome / Edge:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tekan ikon titik tiga <strong>(⋮)</strong> di sudut kanan atas browser Anda, lalu pilih <strong>"Pasang aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                <WifiOff className="w-4 h-4" />
                <span>Bisa Offline</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tetap bisa dibuka dan mengisi data asuhan walau sinyal rumah sakit terputus.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Real-Time Sync</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Otomatis tersinkronisasi langsung ke rekan perawat & DPJP lain.
              </p>
            </div>
          </div>

          {/* QR Code for colleague access */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="p-2 bg-white rounded-xl shadow-xs shrink-0 border border-slate-200">
              <QRCodeSVG value={appUrl} size={80} level="M" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900">Bagikan ke Perawat Lain</p>
              <p className="text-slate-500 text-[11px]">
                Arahkan kamera ponsel rekan perawat ke kode QR ini untuk langsung membuka & memasang aplikasi di ponsel mereka.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

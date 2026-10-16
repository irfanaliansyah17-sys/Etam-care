import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Printer,
  Share2,
  Building2,
  ShieldCheck,
  Download,
  CheckCircle2,
  PlusSquare,
  Sparkles,
  Laptop,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface DeviceAccessQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardName: string;
}

export const DeviceAccessQrModal: React.FC<DeviceAccessQrModalProps> = ({
  isOpen,
  onClose,
  wardName,
}) => {
  const [appUrl, setAppUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [qrDownloaded, setQrDownloaded] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ambil tautan asli tempat aplikasi berjalan langsung
      const url = window.location.origin || window.location.href.split('#')[0];
      setAppUrl(url);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!appUrl) return;
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    if (!appUrl) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ETAM CARE - Sistem Manajemen Keperawatan Terpadu',
          text: `Akses Sistem ETAM CARE (${wardName}) - UMKT & RSUD AM Parikesit:`,
          url: appUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleInstallApp = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(prev => !prev);
    }
  };

  const handleDownloadQrImage = () => {
    try {
      const svg = document.getElementById('etam-access-qr');
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `QR-ETAM-CARE-${wardName.replace(/\s+/g, '-')}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);

      setQrDownloaded(true);
      setTimeout(() => setQrDownloaded(false), 3000);
    } catch {
      // Fallback to print
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-xs">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg leading-tight">
                  Tautan &amp; QR Code Akses Sistem
                </h3>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Buka &amp; Download ETAM CARE di HP, Tablet, atau Laptop
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-700 patient-modal-scrollbar">
          
          {/* Institution Badges */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
              <img src="/logo-umkt.png" alt="UMKT" className="w-5 h-5 object-contain" />
              <span className="text-[11px] font-bold text-slate-800">UMKT</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
              <img src="/logo-parikesit.svg" alt="RSUD AM Parikesit" className="w-5 h-5 object-contain" />
              <span className="text-[11px] font-bold text-slate-800">RSUD AM Parikesit</span>
            </div>
          </div>

          {/* QR Code Presentation Box (Menggunakan Tautan Asli Aplikasi Langsung) */}
          <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-blue-50/70 to-slate-50 rounded-3xl border-2 border-dashed border-blue-200 text-center relative">
            <div className="p-3.5 bg-white rounded-2xl shadow-md border border-slate-200 inline-block mb-3">
              {appUrl ? (
                <QRCodeSVG
                  id="etam-access-qr"
                  value={appUrl}
                  size={200}
                  level="Q"
                  includeMargin={false}
                  imageSettings={{
                    src: '/logo-parikesit.svg',
                    x: undefined,
                    y: undefined,
                    height: 38,
                    width: 38,
                    excavate: true,
                  }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Memuat QR...
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full mb-3">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Arahkan Kamera HP / Tablet ke Kode QR Ini</span>
            </div>

            {/* Quick Action: Download / Pasang Aplikasi & Unduh QR */}
            <div className="flex items-center gap-2 w-full max-w-sm">
              <button
                type="button"
                onClick={handleInstallApp}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                title="Download / Pasang Aplikasi ETAM CARE"
              >
                <Download className="w-4 h-4 animate-bounce shrink-0" />
                <span>{isInstalled ? 'Aplikasi Terpasang ✓' : 'Download Aplikasi'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQrImage}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
                title="Unduh berkas gambar Kode QR"
              >
                {qrDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Unduh QR</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panduan Pemasangan / Download Aplikasi (Bisa Muncul Saat Tombol Diklik) */}
          {showInstallGuide && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border border-emerald-200 text-xs space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Petunjuk Download &amp; Pasang Aplikasi:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {isInstalled ? (
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Aplikasi sudah terpasang di perangkat Anda dan bisa dibuka langsung dari layar utama.</span>
                </div>
              ) : isIOS ? (
                <div className="space-y-1.5 text-slate-700 bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Untuk Pengguna iPhone / iPad (Safari):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
                    <li>Buka tautan ini di peramban <strong>Safari</strong>.</li>
                    <li>Tekan ikon <strong>Bagikan / Share</strong> (<Share2 className="w-3 h-3 inline text-blue-600" />) di bilah bawah.</li>
                    <li>Pilih <strong>"Tambah ke Layar Utama" / "Add to Home Screen"</strong> (<PlusSquare className="w-3 h-3 inline text-slate-700" />).</li>
                    <li>Tekan <strong>Tambah</strong> di kanan atas. Selesai!</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-1.5 text-slate-700 bg-white p-3 rounded-xl border border-emerald-100">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Untuk Pengguna Android &amp; Laptop (Chrome / Edge):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
                    <li>Klik tombol <strong>Download Aplikasi</strong> di atas.</li>
                    <li>Jika menu tidak muncul otomatis, tekan titik tiga <strong>(⋮)</strong> di sudut kanan atas peramban.</li>
                    <li>Pilih menu <strong>"Pasang aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                    <li>Aplikasi akan langsung muncul di beranda HP atau desktop PC Anda.</li>
                  </ol>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-emerald-800 pt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Bebas Play Store, hemat memori (~2 MB), dan bisa digunakan saat jaringan lambat/offline!</span>
              </div>
            </div>
          )}

          {/* Real Link URL & Copy / Share / Open */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Tautan Asli Aplikasi:
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Langsung Terbuka</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-900 select-all focus:outline-none shadow-2xs truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white active:scale-95'
                }`}
                title="Salin Tautan ke Papan Klip"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin'}</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer"
                title="Bagikan Tautan ke WhatsApp / Rekan"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>

          {/* Quick Notice Info */}
          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
            <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold text-blue-950">
                Akses Langsung Tanpa Install atau Download Sebagai App
              </p>
              <p className="text-[11px] text-blue-800/80">
                Aplikasi ini dapat digunakan langsung melalui peramban web atau di-download ke layar utama HP/Tablet untuk pengalaman aplikasi yang lebih cepat dan mandiri.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Bangsal: <strong>{wardName}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleInstallApp}
              type="button"
              className="flex-1 sm:flex-none min-h-[38px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Download & Pasang Aplikasi"
            >
              <Download className="w-4 h-4" />
              <span>Download App</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 sm:flex-none min-h-[38px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Cetak Lembar QR untuk ditempel di Nurse Station"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak QR</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="flex-1 sm:flex-none min-h-[38px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

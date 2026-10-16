import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  appName?: string;
  duration?: number; // ms, default 2400ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  appName = 'ETAM CARE',
  duration = 2400,
}) => {
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [statusText, setStatusText] = useState('Memuat sistem keperawatan...');

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 40;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct > 25 && pct <= 60) {
        setStatusText('Menyiapkan data pasien & bangsal...');
      } else if (pct > 60 && pct <= 85) {
        setStatusText('Sinkronisasi asuhan keperawatan terpadu...');
      } else if (pct > 85) {
        setStatusText('Selamat bertugas!');
      }

      if (elapsed >= duration) {
        clearInterval(timer);
        setIsClosing(true);
        setTimeout(() => {
          onFinish();
        }, 450);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, onFinish]);

  const handleSkip = () => {
    setIsClosing(true);
    setTimeout(() => {
      onFinish();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white select-none transition-all duration-500 ${
        isClosing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      role="dialog"
      aria-label="Layar Pembuka Aplikasi"
    >
      {/* Top Header Credential */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-sm">
          <HeartPulse className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-blue-100 tracking-wide">
            Praktik Profesi Ners
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs font-semibold text-blue-200/80 hover:text-white bg-white/5 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/10 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
        >
          <span>Masuk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Center Content: Official Hospital Emblem */}
      <div className="flex flex-col items-center text-center max-w-sm w-full my-auto space-y-6">
        {/* Glow & Emblem Wrapper */}
        <div className="relative group">
          {/* Subtle Ambient Back-Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 via-teal-400/30 to-blue-500/30 rounded-full blur-xl animate-pulse" />

          {/* Emblem Container with white backfill for crisp SVG vector visibility */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white p-2.5 shadow-2xl ring-4 ring-emerald-400/40 border border-white/40 flex items-center justify-center transform transition-transform hover:scale-105">
            <img
              src="/logo-parikesit.svg"
              alt="Logo Resmi RSUD AM Parikesit"
              className="w-full h-full object-contain filter drop-shadow-md animate-in zoom-in-75 duration-700"
            />
          </div>

          {/* Badge underneath */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-lg border border-white/30 uppercase tracking-widest whitespace-nowrap">
            RSUD AM PARIKESIT
          </div>
        </div>

        {/* Title & App Branding */}
        <div className="space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] font-bold tracking-wider text-cyan-200 uppercase">
              RSUD AM PARIKESIT &amp; UMKT
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {appName}
          </h1>

          <p className="text-xs sm:text-sm font-medium text-blue-200/90 max-w-xs mx-auto leading-relaxed">
            Sistem Manajemen Asuhan Keperawatan Terpadu
          </p>
        </div>

        {/* Institutional Partner Logos */}
        <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
          <div className="flex items-center gap-2">
            <img
              src="/logo-umkt.png"
              alt="UMKT"
              className="h-6 w-auto object-contain bg-white rounded p-0.5"
            />
            <span className="text-[10px] font-bold text-slate-200">UMKT</span>
          </div>
          <span className="text-white/30 text-xs">|</span>
          <div className="flex items-center gap-2">
            <img
              src="/logo-parikesit.svg"
              alt="RSUD AM Parikesit"
              className="h-6 w-auto object-contain"
            />
            <span className="text-[10px] font-bold text-slate-200">RSUD AM Parikesit</span>
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-xs">
            <div
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full transition-all duration-100 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-blue-200/80 font-mono">
            <span className="truncate">{statusText}</span>
            <span className="font-bold text-cyan-300 ml-2">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md flex items-center justify-center pb-2 text-center">
        <div className="flex items-center gap-1.5 text-[11px] text-blue-200/70 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Praktik Profesi Ners Stase Manajemen Keperawatan</span>
        </div>
      </div>
    </div>
  );
};

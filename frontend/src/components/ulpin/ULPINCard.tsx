import { Fingerprint, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { ULPIN } from '@/types/property';

interface ULPINCardProps {
  ulpin: ULPIN;
  floorLabel: string;
}

/**
 * Reusable Prototype 3D ULPIN display card.
 * Clearly labelled as a prototype representation.
 */
export function ULPINCard({ ulpin, floorLabel }: ULPINCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(ulpin.code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopy(ulpin.code);
        });
    } else {
      fallbackCopy(ulpin.code);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative glass-panel-tight p-4 animate-fade-in-up overflow-hidden">
      {/* Top accent glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent" />

      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
          <Fingerprint className="h-3.5 w-3.5 text-accent-400" />
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          3D ULPIN (Prototype)
        </span>
        <span className="ml-auto text-[9px] text-slate-600 border border-white/[0.06] rounded px-1.5 py-0.5 font-mono">
          Prototype
        </span>
      </div>

      {/* ULPIN Code */}
      <div className="flex items-center gap-2">
        <div className="font-mono text-base text-accent-300 tracking-wider break-all flex-1 leading-relaxed">
          {ulpin.code}
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 h-7 px-2 rounded-md border flex items-center gap-1.5 text-[11px] font-medium transition-all ${
            copied
              ? 'bg-success-500/15 border-success-500/30 text-success-400'
              : 'bg-base-700/50 border-white/[0.06] text-slate-400 hover:text-accent-300 hover:border-accent-500/25'
          }`}
          title="Copy 3D ULPIN to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-success-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="text-[9px] text-slate-600 mt-1">
        Vertical extension: Prototype representation
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <div className="text-slate-500 mb-0.5 text-[10px]">Floor Segment</div>
          <div className="text-slate-200 font-mono">{ulpin.floorSegment}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-0.5 text-[10px]">Level</div>
          <div className="text-slate-200">{ulpin.level}</div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/[0.04] text-[9px] text-slate-600 leading-relaxed">
        Prototype 3D ULPIN encoding — not an officially approved government ULPIN.
        Floor reference: {floorLabel}.
      </div>
    </div>
  );
}

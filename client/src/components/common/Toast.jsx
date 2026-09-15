import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const { type, message } = toast;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  const borderStyles = {
    success: 'border-emerald-500/30 bg-slate-900/95 text-emerald-200',
    error: 'border-rose-500/30 bg-slate-900/95 text-rose-200',
    warning: 'border-amber-500/30 bg-slate-900/95 text-amber-200',
    info: 'border-sky-500/30 bg-slate-900/95 text-sky-200',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all transform animate-in slide-in-from-bottom-2 duration-200 ${
        borderStyles[type] || borderStyles.info
      }`}
    >
      <div className="flex items-center space-x-3 pr-2">
        {icons[type] || icons.info}
        <span className="text-xs font-medium text-slate-200">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

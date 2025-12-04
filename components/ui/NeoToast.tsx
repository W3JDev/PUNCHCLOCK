import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const NeoToast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  const styles = {
    success: 'bg-green-600 border-white text-white',
    error: 'bg-red-600 border-white text-white',
    info: 'bg-blue-600 border-white text-white',
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div className={`
      flex items-center gap-4 p-6 rounded-xl border-4 shadow-[8px_8px_0_0_#000] mb-4 w-full max-w-md
      ${styles[type]}
    `}>
      <Icon className="w-8 h-8 shrink-0" strokeWidth={3} />
      <span className="font-bold text-lg">{message}</span>
      <button onClick={onClose} className="ml-auto p-2 bg-black/20 hover:bg-black/40 rounded-lg"><X className="w-6 h-6" strokeWidth={3} /></button>
    </div>
  );
};
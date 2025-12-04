import React from 'react';
import { X } from 'lucide-react';

export const NeoModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-[#121212] border-4 border-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b-4 border-white flex justify-between items-center bg-[#222]">
          <h3 className="text-2xl font-black text-white tracking-wide uppercase font-display">{title}</h3>
          <button onClick={onClose} className="text-white hover:bg-red-600 p-2 rounded-xl transition-colors border-2 border-transparent hover:border-white">
            <X className="w-8 h-8" strokeWidth={3} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
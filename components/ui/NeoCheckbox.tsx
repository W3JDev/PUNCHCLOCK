
import React from 'react';
import { Check } from 'lucide-react';

interface NeoCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
}

export const NeoCheckbox: React.FC<NeoCheckboxProps> = ({ checked, onChange, className = '', label }) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
      <div 
        onClick={() => onChange(!checked)}
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
          ${checked ? 'bg-blue-600 border-blue-500' : 'bg-black border-white/30 group-hover:border-white'}
        `}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
      </div>
      {label && <span className="text-sm font-bold text-gray-300 group-hover:text-white select-none">{label}</span>}
    </label>
  );
};


import React from 'react';

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const NeoInput: React.FC<NeoInputProps> = ({ className = '', label, ...props }) => (
  <div className="relative group w-full">
    {label && (
      <label className="block text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </label>
    )}
    <input
      className={`
        w-full 
        bg-white dark:bg-black
        border-2 border-gray-300 dark:border-white
        rounded-xl p-5
        focus:outline-none focus:border-blue-600 dark:focus:border-[#FFD700] focus:ring-1 focus:ring-blue-600 dark:focus:ring-[#FFD700]
        text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500
        font-bold text-lg
        transition-colors
        ${className}
      `}
      {...props}
    />
  </div>
);

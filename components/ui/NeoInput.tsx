import React from 'react';

export const NeoInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <div className="relative group w-full">
    <input
      className={`
        w-full bg-black
        border-2 border-white
        rounded-xl p-5
        focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]
        text-white placeholder-gray-500
        font-bold text-lg
        ${className}
      `}
      {...props}
    />
  </div>
);
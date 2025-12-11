
import React from 'react';

export const NeoButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' }> = ({ 
  children, 
  className = '', 
  variant = 'primary',
  ...props 
}) => {
  const baseStyles = "relative font-display font-black rounded-xl tracking-widest uppercase transition-all duration-100 active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap";

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border-t border-l border-white/20 shadow-[0_4px_0_0_#1e3a8a] hover:shadow-[0_2px_0_0_#1e3a8a] py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3', 
    secondary: 'bg-[#FFD700] hover:bg-yellow-400 text-black border-t border-l border-white/20 shadow-[0_4px_0_0_#b45309] hover:shadow-[0_2px_0_0_#b45309] py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3',
    danger: 'bg-red-600 hover:bg-red-500 text-white border-t border-l border-white/20 shadow-[0_4px_0_0_#991b1b] hover:shadow-[0_2px_0_0_#991b1b] py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3',
    ghost: 'bg-transparent border border-white/20 text-white hover:bg-white/5 py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3 backdrop-blur-sm',
    icon: 'bg-[#222] border border-white/20 text-white shadow-[0_2px_4px_rgba(0,0,0,0.5)] p-2 hover:bg-[#333] justify-center items-center',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

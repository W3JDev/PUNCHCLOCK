
import React from 'react';

export const NeoButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' }> = ({ 
  children, 
  className = '', 
  variant = 'primary',
  ...props 
}) => {
  const baseStyles = "relative font-display font-bold rounded-xl tracking-widest uppercase transition-transform duration-75 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap";

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border-2 border-white shadow-[4px_4px_0_0_#fff] py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3', 
    secondary: 'bg-[#FFD700] hover:bg-yellow-400 text-black border-2 border-white shadow-[4px_4px_0_0_#fff] py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3',
    danger: 'bg-red-600 hover:bg-red-500 text-white border-2 border-white shadow-[4px_4px_0_0_#fff] py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3',
    ghost: 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black py-3 px-5 md:py-4 md:px-8 text-xs md:text-sm lg:text-base gap-2 md:gap-3',
    icon: 'bg-[#222] border-2 border-white text-white shadow-[2px_2px_0_0_#fff] p-2 hover:bg-white hover:text-black justify-center items-center',
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

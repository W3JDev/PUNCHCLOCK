import React from 'react';

export const NeoButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' }> = ({ 
  children, 
  className = '', 
  variant = 'primary',
  ...props 
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border-2 border-white shadow-[4px_4px_0_0_#fff]', 
    secondary: 'bg-[#FFD700] hover:bg-yellow-400 text-black border-2 border-white shadow-[4px_4px_0_0_#fff]',
    danger: 'bg-red-600 hover:bg-red-500 text-white border-2 border-white shadow-[4px_4px_0_0_#fff]',
    ghost: 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black',
    icon: 'bg-[#222] border-2 border-white text-white shadow-[2px_2px_0_0_#fff] p-3 rounded-xl hover:bg-white hover:text-black',
  };

  return (
    <button
      className={`
        relative
        font-display font-bold py-4 px-8 rounded-xl
        tracking-widest uppercase text-base
        transition-transform duration-75
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-3
        ${variants[variant]} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
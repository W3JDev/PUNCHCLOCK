
import React from 'react';

export const NeoSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <div className="relative group w-full">
    <select
      className={`
        appearance-none w-full 
        bg-white dark:bg-black
        border-2 border-gray-300 dark:border-white
        rounded-xl p-5 pr-12
        focus:outline-none focus:border-blue-600 dark:focus:border-[#FFD700]
        font-bold text-black dark:text-white text-lg
        cursor-pointer
        transition-colors
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 bg-gray-100 dark:bg-white border-l-2 border-gray-300 dark:border-white text-black">
      <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  </div>
);

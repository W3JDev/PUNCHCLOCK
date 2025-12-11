
import React from 'react';
import { LucideIcon } from 'lucide-react';

export const NeoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  color?: 'yellow' | 'blue' | 'pink' | 'white' | 'green' | 'purple' | 'orange' | 'red';
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}> = ({ children, className = '', color = 'white', title, icon: Icon, action }) => {
  
  // Clean, flat headers for professional look
  const headerColors = {
    yellow: 'text-yellow-600 dark:text-yellow-500',
    blue: 'text-blue-600 dark:text-blue-500',
    pink: 'text-pink-600 dark:text-pink-500',
    green: 'text-green-600 dark:text-green-500',
    purple: 'text-purple-600 dark:text-purple-500',
    orange: 'text-orange-600 dark:text-orange-500',
    red: 'text-red-600 dark:text-red-500',
    white: 'text-gray-800 dark:text-white',
  };

  return (
    <div className={`
      relative group flex flex-col
      bg-white dark:bg-[#121212]
      border border-gray-200 dark:border-white/10
      rounded-2xl overflow-hidden
      shadow-sm dark:shadow-[4px_4px_16px_rgba(0,0,0,0.5),-1px_-1px_2px_rgba(255,255,255,0.05)]
      hover:border-gray-300 dark:hover:border-white/30 transition-all duration-300
      h-full
      ${className}
    `}>
      {title && (
        <div className={`
          relative z-10
          flex items-center justify-between px-5 py-4
          shrink-0
          border-b border-gray-100 dark:border-white/5 
          bg-gray-50 dark:bg-white/5
        `}>
          <div className="flex items-center gap-3">
            {Icon && (
              <Icon className={`w-5 h-5 ${headerColors[color]} drop-shadow-sm`} strokeWidth={2.5} />
            )}
            <h3 className="font-sans font-black text-sm tracking-wide text-gray-800 dark:text-white uppercase leading-none mt-0.5">
              {title}
            </h3>
          </div>
          {action && <div className="flex items-center">{action}</div>}
        </div>
      )}
      <div className="relative z-10 p-5 text-gray-800 dark:text-white flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

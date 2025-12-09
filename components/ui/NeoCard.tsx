
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
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    pink: 'text-pink-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
    white: 'text-white',
  };

  return (
    <div className={`
      relative group flex flex-col
      bg-[#121212]
      border border-white/10
      rounded-2xl overflow-hidden
      shadow-sm
      hover:border-white/20 transition-colors
      h-full
      ${className}
    `}>
      {title && (
        <div className={`
          relative z-10
          flex items-center justify-between px-5 py-4
          shrink-0
          border-b border-white/5 bg-[#161616]
        `}>
          <div className="flex items-center gap-3">
            {Icon && (
              <Icon className={`w-5 h-5 ${headerColors[color]}`} strokeWidth={2.5} />
            )}
            <h3 className="font-sans font-bold text-sm tracking-wide text-white uppercase leading-none mt-0.5">
              {title}
            </h3>
          </div>
          {action && <div className="flex items-center">{action}</div>}
        </div>
      )}
      <div className="relative z-10 p-5 text-white flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

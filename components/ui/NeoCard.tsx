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
  
  const headerColors = {
    yellow: 'bg-yellow-600 text-white border-b-2 border-white',
    blue: 'bg-blue-600 text-white border-b-2 border-white',
    pink: 'bg-pink-600 text-white border-b-2 border-white',
    green: 'bg-green-600 text-white border-b-2 border-white',
    purple: 'bg-purple-600 text-white border-b-2 border-white',
    orange: 'bg-orange-600 text-white border-b-2 border-white',
    red: 'bg-red-600 text-white border-b-2 border-white',
    white: 'bg-[#222] text-white border-b-2 border-white',
  };

  const isColored = color !== 'white';

  return (
    <div className={`
      relative group flex flex-col
      bg-[#121212]
      border-[3px] border-white/20
      rounded-2xl overflow-hidden
      shadow-[4px_4px_0_0_rgba(255,255,255,0.15)]
      h-full
      ${className}
    `}>
      {title && (
        <div className={`
          relative z-10
          flex items-center justify-between px-6 py-5
          shrink-0
          ${isColored ? headerColors[color] : 'bg-[#1a1a1a] border-b-2 border-white/20'}
        `}>
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-2 bg-black rounded-lg border border-white/30">
                <Icon className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
            )}
            <h3 className="font-display font-bold text-xl tracking-wide text-white uppercase leading-none pt-1">
              {title}
            </h3>
          </div>
          {action && <div className="flex items-center">{action}</div>}
        </div>
      )}
      <div className="relative z-10 p-6 text-white flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
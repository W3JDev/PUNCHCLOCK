import React from 'react';

export const NeoBadge: React.FC<{ children: React.ReactNode, variant?: 'neutral' | 'success' | 'warning' | 'danger' }> = ({ children, variant = 'neutral' }) => {
  const styles = {
    neutral: 'bg-gray-700 text-white border-white',
    success: 'bg-green-600 text-white border-white',
    warning: 'bg-orange-600 text-white border-white',
    danger: 'bg-red-600 text-white border-white',
  };

  return (
    <span className={`
      px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border-2
      ${styles[variant]}
    `}>
      {children}
    </span>
  );
};
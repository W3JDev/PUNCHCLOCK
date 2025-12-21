
import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { NeoButton, NeoCard } from './NeoComponents';

export const OfflineFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto border-2 border-red-500 animate-pulse">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>
        
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Connection Lost</h1>
          <p className="text-gray-400">
            PUNCHCLOCK is designed to work offline, but we couldn't load this specific page. 
            Check your internet connection and try again.
          </p>
        </div>

        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/10 text-left">
          <h3 className="font-bold text-sm mb-2 text-white">While offline, you can still:</h3>
          <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
            <li>Use the <strong>Smart Kiosk</strong> to clock in/out.</li>
            <li>View previously loaded <strong>Dashboard</strong> stats.</li>
            <li>Draft documents (will sync when online).</li>
          </ul>
        </div>

        <NeoButton onClick={() => window.location.reload()} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </NeoButton>
      </div>
    </div>
  );
};

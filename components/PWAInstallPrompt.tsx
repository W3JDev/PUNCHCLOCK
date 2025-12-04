import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import { NeoButton } from './NeoComponents';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[100] animate-in slide-in-from-bottom-10 duration-500">
       <div className="bg-[#1a1a1a] border-2 border-blue-500 p-6 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] max-w-sm relative">
          <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
          <div className="flex items-start gap-4">
             <div className="bg-blue-600 p-3 rounded-xl text-white">
                <Smartphone className="w-6 h-6" />
             </div>
             <div>
                <h4 className="text-white font-black uppercase text-lg">Install App</h4>
                <p className="text-gray-400 text-xs mb-4">Install PUNCHCLOCK for a better experience, offline access, and push notifications.</p>
                <NeoButton onClick={handleInstall} variant="primary" className="py-2 px-4 text-xs">
                   Install Now
                </NeoButton>
             </div>
          </div>
       </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { NeoCard, NeoButton } from '../components/NeoComponents';
import { BookOpen, Monitor, DollarSign, ShieldCheck, Clock, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserGuide: React.FC = () => {
  const { currentUser } = useGlobal();
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState('getting-started');

  const topics = [
    { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
    { id: 'attendance', label: 'Smart Kiosk', icon: Monitor },
    { id: 'payroll', label: 'Payroll & EPF', icon: DollarSign },
    { id: 'compliance', label: 'Legal & Compliance', icon: ShieldCheck },
    { id: 'shifts', label: 'Rostering', icon: Clock },
  ];

  const renderContent = () => {
    switch(activeTopic) {
        case 'getting-started':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h2 className="text-3xl font-black text-white uppercase">Welcome to PUNCHCLOCK</h2>
                    <p className="text-gray-400 text-lg">Your role is: <span className="text-white font-bold">{currentUser?.role}</span></p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <NeoCard title="For Admins & HR">
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Configure Company Profile in Compliance tab.</li>
                                <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Add employees and register Face IDs.</li>
                                <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Set up Payroll Statutory Rates.</li>
                            </ul>
                        </NeoCard>
                        <NeoCard title="For Staff">
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-blue-500"/> Complete Onboarding steps first.</li>
                                <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-blue-500"/> Check your roster in 'Schedule'.</li>
                                <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-blue-500"/> View and download payslips monthly.</li>
                            </ul>
                        </NeoCard>
                    </div>
                </div>
            );
        case 'attendance':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h2 className="text-3xl font-black text-white uppercase">Smart Kiosk & Attendance</h2>
                    <div className="p-6 bg-[#1a1a1a] rounded-xl border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-2">How to launch the Kiosk</h3>
                        <p className="text-gray-400 mb-4">Go to the "Smart Kiosk" tab. On a tablet device, mount it at the entrance. Click "Launch Kiosk Mode" to lock the interface.</p>
                        <div className="flex gap-2">
                             <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/30">Face ID</span>
                             <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-lg text-xs font-bold border border-green-500/30">PIN Code</span>
                             <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-lg text-xs font-bold border border-yellow-500/30">Anti-Spoofing</span>
                        </div>
                    </div>
                </div>
            );
        case 'payroll':
            return (
                <div className="space-y-6 animate-in fade-in">
                    <h2 className="text-3xl font-black text-white uppercase">Payroll Engine</h2>
                    <p className="text-gray-400">Automated calculation based on Employment Act 1955.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-white/5 p-4 rounded-xl">
                             <h4 className="font-bold text-white mb-2">1. Settings</h4>
                             <p className="text-sm text-gray-400">Configure global allowances (Transport/Meal) and EPF rates in the "Configuration" tab.</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-xl">
                             <h4 className="font-bold text-white mb-2">2. Processing</h4>
                             <p className="text-sm text-gray-400">Go to "Run Payroll". The system auto-calculates OT based on approved shifts and attendance.</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-xl">
                             <h4 className="font-bold text-white mb-2">3. Banking Files</h4>
                             <p className="text-sm text-gray-400">Export KWSP (Form A), SOCSO, and LHDN text files for bank upload.</p>
                         </div>
                    </div>
                </div>
            );
        default:
            return <div className="text-gray-500">Select a topic.</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
       <div className="mb-8 flex items-center gap-4">
          <NeoButton variant="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-6 h-6" />
          </NeoButton>
          <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">User Manual</h1>
              <p className="text-gray-500 font-bold">Comprehensive guide for {currentUser?.role}</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Sidebar */}
           <div className="space-y-2">
               {topics.map(topic => (
                   <button
                      key={topic.id}
                      onClick={() => setActiveTopic(topic.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold uppercase text-sm transition-all
                        ${activeTopic === topic.id ? 'bg-white text-black shadow-lg scale-105' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white'}
                      `}
                   >
                       <topic.icon className="w-5 h-5" />
                       {topic.label}
                   </button>
               ))}
           </div>

           {/* Content */}
           <div className="lg:col-span-3">
               <NeoCard className="min-h-[600px]">
                   {renderContent()}
               </NeoCard>
           </div>
       </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, Zap, Bot, ArrowRight, Play, 
  Pause, CheckCircle, Search, DollarSign, Clock, 
  Fingerprint, ChevronRight, LayoutTemplate, MessageSquare,
  FileText, TrendingUp, Siren
} from 'lucide-react';
import { NeoButton, NeoCard, NeoBadge } from '../components/NeoComponents';
import { useGlobal } from '../context/GlobalContext';

const DEMO_STEPS = [
  {
    id: 'intro',
    title: 'Workforce Intelligence',
    subtitle: 'The Quantum HR Operating System',
    description: 'PUNCHCLOCK Malaysia replaces fragmented tools with a single, high-fidelity core. Built for speed, compliance, and total authority.',
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'ai-agent',
    title: 'The AI Agent Deck',
    subtitle: 'Your 24/7 Expert Consultant',
    description: 'Powered by Gemini 3. It performs forensic audits, identifies financial leaks, and suggests context-aware actions. No more manual log reviews.',
    icon: Bot,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    id: 'biometrics',
    title: 'Zero-Trust Biometrics',
    subtitle: 'Absolute Attendance Integrity',
    description: 'Liveness detection and GPS pinning stop "buddy punching" forever. Secure, hardware-agnostic, and lightning fast.',
    icon: Fingerprint,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    id: 'payroll',
    title: 'Statutory Auto-Pilot',
    subtitle: '3-Click LHDN/EPF Compliance',
    description: 'Automated 2025 tax tiers, statutory ceilings, and direct bank batch generation. What used to take days now takes seconds.',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  }
];

export const Showcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const { employees, attendanceRecords } = useGlobal();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % DEMO_STEPS.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const step = DEMO_STEPS[activeStep];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 opacity-20 blur-[150px] transition-all duration-1000 ${step.bg}`} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left: Narrative Content */}
        <div className="space-y-8 animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-white/5 border-2 border-white/10 ${step.color}`}>
              <step.icon className="w-10 h-10" />
            </div>
            <div>
              <NeoBadge variant="neutral" className="mb-1 text-[10px] tracking-[0.3em]">Module Showcase</NeoBadge>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
                {step.title.split(' ')[0]}<br/>
                <span className={step.color}>{step.title.split(' ').slice(1).join(' ')}</span>
              </h1>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <h3 className="text-2xl font-bold text-gray-300">{step.subtitle}</h3>
            <p className="text-xl text-gray-500 leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="flex items-center gap-6 pt-8">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-4 rounded-full bg-white/5 border-2 border-white/10 hover:bg-white/10 transition-all"
            >
              {isPlaying ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6"/>}
            </button>
            <div className="flex gap-2">
              {DEMO_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 transition-all duration-500 rounded-full ${i === activeStep ? 'w-12 bg-white' : 'w-3 bg-white/20'}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-12 flex gap-4">
             <NeoButton onClick={() => navigate('/login')} className="py-6 px-12 text-xl bg-white text-black hover:bg-blue-600 hover:text-white border-none shadow-2xl">
                Experience System <ArrowRight className="ml-3 w-6 h-6" />
             </NeoButton>
          </div>
        </div>

        {/* Right: Immersive Visuals */}
        <div className="relative flex justify-center items-center h-[600px] lg:h-[800px] animate-in slide-in-from-right duration-1000">
           {/* Step specific UI Mockups */}
           {activeStep === 0 && (
             <div className="w-full max-w-lg bg-[#111] border-4 border-white/10 rounded-[3rem] p-10 shadow-[40px_40px_100px_#000] rotate-3 hover:rotate-0 transition-transform duration-700">
                <div className="flex justify-between items-center mb-10">
                   <LayoutTemplate className="w-8 h-8 text-blue-500" />
                   <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-32 bg-white/5 rounded-2xl border border-white/10 p-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Identity Node</p>
                      <p className="text-2xl font-black">92.4%</p>
                   </div>
                   <div className="h-32 bg-white/5 rounded-2xl border border-white/10 p-4">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-1">OT Flux</p>
                      <p className="text-2xl font-black text-green-500">OPTIMAL</p>
                   </div>
                   <div className="col-span-2 h-48 bg-black rounded-3xl border border-white/10 overflow-hidden relative">
                      <div className="absolute inset-0 bg-blue-600/5 animate-pulse" />
                      <div className="p-6 h-full flex items-end">
                         <div className="flex gap-2 items-end w-full">
                            {[40, 70, 45, 90, 60, 80].map((h, i) => <div key={i} className="flex-1 bg-blue-600 rounded-t-lg shadow-glow" style={{ height: `${h}%` }} />)}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeStep === 1 && (
             <div className="w-full max-w-lg space-y-4">
                <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] border-4 border-blue-400 shadow-2xl animate-in slide-in-from-bottom-8">
                   <div className="flex items-center gap-4 mb-4">
                      <Bot className="w-8 h-8" />
                      <p className="text-xs font-black uppercase tracking-widest">Agent Logic Active</p>
                   </div>
                   <p className="text-xl font-bold">"Ali Bin Abu has been late 4 times this cycle. Suggest adjusting his Friday roster?"</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                   {['Adjust Roster', 'Send Warning', 'Ignore Pattern'].map((s, i) => (
                      <div key={i} className="px-6 py-3 rounded-2xl bg-white/10 border-2 border-white/10 text-xs font-black uppercase tracking-widest animate-in zoom-in" style={{ animationDelay: `${i * 150}ms` }}>{s}</div>
                   ))}
                </div>
                <div className="bg-[#111] border-2 border-white/10 p-6 rounded-3xl opacity-50 blur-[2px]">
                   <TrendingUp className="w-12 h-12 text-blue-500 mb-4" />
                   <p className="text-sm font-mono tracking-tighter">DATASET: H1_2025_FORENSIC_SNAPSHOT</p>
                </div>
             </div>
           )}

           {activeStep === 2 && (
             <div className="relative group">
                <div className="w-[340px] h-[680px] bg-black border-8 border-gray-900 rounded-[4rem] shadow-2xl relative overflow-hidden ring-4 ring-white/10">
                   <div className="absolute inset-x-12 top-0 h-8 bg-gray-900 rounded-b-3xl z-20" />
                   <div className="p-8 h-full bg-white flex flex-col items-center justify-center text-black">
                      <div className="w-48 h-48 rounded-full border-8 border-blue-600 relative overflow-hidden mb-12 shadow-glow animate-pulse">
                         <div className="absolute inset-0 bg-gray-100 flex items-center justify-center"><Fingerprint className="w-24 h-24 text-gray-400" /></div>
                         <div className="absolute top-0 left-0 w-full h-2 bg-blue-500 shadow-xl animate-[scanLine_2s_infinite_linear]" />
                      </div>
                      <h4 className="text-3xl font-black uppercase tracking-tighter italic">SCANNING...</h4>
                      <p className="text-xs font-black text-gray-500 tracking-[0.4em] mt-4">MULTI-VECTOR SHIELD ON</p>
                   </div>
                </div>
                <div className="absolute -right-20 top-20 bg-green-600 text-white p-8 rounded-3xl border-4 border-white shadow-2xl rotate-6 animate-in zoom-in duration-500 delay-300">
                   <div className="flex items-center gap-4"><CheckCircle className="w-8 h-8" /><h4 className="text-2xl font-black uppercase">Verified</h4></div>
                </div>
             </div>
           )}

           {activeStep === 3 && (
              <div className="w-full max-w-lg bg-white p-12 rounded-[3rem] shadow-[20px_20px_0_0_#10B981] border-4 border-black text-black">
                 <div className="flex justify-between items-center mb-12">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black italic text-2xl rotate-3">P.</div>
                    <div className="text-right">
                       <h4 className="font-black text-2xl uppercase tracking-tighter">Payslip</h4>
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cycle: May 2025</p>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between border-b-2 border-black/5 pb-2">
                       <span className="font-bold text-gray-500 uppercase text-xs">Gross Pay</span>
                       <span className="font-mono font-black text-xl">RM 5,800.00</span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black/5 pb-2">
                       <span className="font-bold text-gray-500 uppercase text-xs">KWSP (11%)</span>
                       <span className="font-mono font-black text-xl text-red-600">- RM 638.00</span>
                    </div>
                    <div className="bg-green-100 p-6 rounded-2xl flex justify-between items-center">
                       <span className="font-black uppercase text-sm">Net Payable</span>
                       <span className="font-mono font-black text-3xl text-green-700">RM 5,162.00</span>
                    </div>
                 </div>
                 <div className="mt-12 flex justify-center">
                    <NeoBadge variant="success" className="bg-green-600 text-white border-none shadow-glow">DISBURSED VIA MAYBANK BATCH</NeoBadge>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Footer Navigation Overlay */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl z-50">
         {DEMO_STEPS.map((s, i) => (
           <button 
             key={i} 
             onClick={() => { setActiveStep(i); setIsPlaying(false); }}
             className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${i === activeStep ? 'bg-white text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white'}`}
           >
              <s.icon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{s.id}</span>
           </button>
         ))}
      </div>

      {/* Corporate Badge */}
      <div className="fixed top-8 left-8 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
         <span className="text-gray-400 text-[9px] font-black uppercase tracking-[0.4em]">Enterprise Showcase v2.5</span>
      </div>
      
      <button onClick={() => navigate('/')} className="fixed top-8 right-8 text-gray-500 hover:text-white uppercase font-black text-xs tracking-widest">
         Skip Demo
      </button>
    </div>
  );
};

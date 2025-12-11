import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ScanFace, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Lock, 
  Smartphone,
  Fingerprint,
  FileText,
  Bot,
  User
} from 'lucide-react';

export const ProductDemo: React.FC = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState<'kiosk' | 'payroll' | 'ai'>('kiosk');

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-yellow-400 selection:text-black overflow-x-hidden">
      
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black italic tracking-tighter text-xl transform -rotate-3">P.</div>
           <span className="font-black text-xl tracking-tighter uppercase">PUNCH<span className="text-blue-600">CLOCK</span></span>
        </div>
        <div className="flex gap-4">
           <button onClick={() => navigate('/login')} className="px-6 py-2 font-bold uppercase text-sm hover:underline">Login</button>
           <button onClick={() => navigate('/login')} className="px-6 py-2 bg-[#FFD700] border-2 border-black shadow-[4px_4px_0_0_#000] font-black uppercase text-sm hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all">
             Get Early Access
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 pt-16 pb-24 text-center px-4 max-w-5xl mx-auto">
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-gray-100 mb-6 animate-in slide-in-from-top-4 fade-in duration-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">v2.0 Now Live in Malaysia</span>
         </div>
         <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
            The <span className="text-blue-600">HR Operating</span><br/>
            System for <span className="relative inline-block">SMEs<svg className="absolute w-full h-3 -bottom-1 left-0 text-[#FFD700]" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg></span>
         </h1>
         <p className="text-xl md:text-2xl font-medium text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Forget spreadsheets. We combine <span className="text-black font-bold">Biometric Attendance</span>, <span className="text-black font-bold">Automated Payroll</span>, and <span className="text-black font-bold">AI Compliance</span> into one radical interface.
         </p>
         <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button onClick={() => navigate('/login')} className="px-8 py-4 bg-black text-white border-2 border-transparent text-lg font-black uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-all flex items-center gap-2 group">
               Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
            </button>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No credit card required</p>
         </div>
      </header>

      {/* INTERACTIVE DEMO ENGINE */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 pb-32">
         <div className="bg-white border-4 border-black rounded-[3rem] p-4 md:p-8 shadow-[12px_12px_0_0_#000] relative overflow-hidden">
            
            {/* Control Panel */}
            <div className="flex flex-col md:flex-row justify-center gap-4 mb-12 relative z-20">
               {[
                 { id: 'kiosk', label: 'Smart Kiosk', icon: ScanFace, color: 'bg-blue-600' },
                 { id: 'payroll', label: 'Auto Payroll', icon: DollarSign, color: 'bg-green-500' },
                 { id: 'ai', label: 'AI Legal', icon: ShieldCheck, color: 'bg-red-500' }
               ].map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id as any)}
                    className={`
                      px-6 py-4 rounded-xl border-2 border-black flex items-center gap-3 transition-all
                      ${activeFeature === feature.id 
                        ? `${feature.color} text-white shadow-[4px_4px_0_0_#000] translate-y-[-2px]` 
                        : 'bg-white text-gray-500 hover:bg-gray-50'}
                    `}
                  >
                     <feature.icon className="w-5 h-5" strokeWidth={3} />
                     <span className="font-black uppercase text-sm tracking-wide">{feature.label}</span>
                  </button>
               ))}
            </div>

            {/* The Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               
               {/* Left: Dynamic Description */}
               <div className="space-y-6 lg:pl-12">
                  <div className="inline-block p-3 bg-black text-white rounded-lg font-mono text-xs mb-2">
                     // SYSTEM_PREVIEW: {activeFeature.toUpperCase()}
                  </div>
                  
                  {activeFeature === 'kiosk' && (
                     <div className="animate-in slide-in-from-left fade-in duration-500">
                        <h3 className="text-4xl font-black uppercase mb-4">Hardware Agnostic <br/>Face ID.</h3>
                        <p className="text-lg text-gray-600 mb-6">Turn any iPad, Android tablet, or webcam into a secure punch clock. We use liveness detection and geofencing to prevent "buddy punching".</p>
                        <ul className="space-y-3">
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-blue-600"/> Works offline</li>
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-blue-600"/> Anti-spoofing technology</li>
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-blue-600"/> GPS Geofencing</li>
                        </ul>
                     </div>
                  )}

                  {activeFeature === 'payroll' && (
                     <div className="animate-in slide-in-from-left fade-in duration-500">
                        <h3 className="text-4xl font-black uppercase mb-4">Payroll in <br/>3 Clicks.</h3>
                        <p className="text-lg text-gray-600 mb-6">Forget Excel. We auto-calculate OT, EPF, SOCSO, and PCB based on attendance records. Export bank files instantly.</p>
                        <ul className="space-y-3">
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-green-600"/> LHDN Compliant (MT5)</li>
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-green-600"/> Automated Payslip PDF</li>
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-green-600"/> Bank Batch Files (Form A)</li>
                        </ul>
                     </div>
                  )}

                  {activeFeature === 'ai' && (
                     <div className="animate-in slide-in-from-left fade-in duration-500">
                        <h3 className="text-4xl font-black uppercase mb-4">Your 24/7 <br/>Legal Advisor.</h3>
                        <p className="text-lg text-gray-600 mb-6">Powered by Google Gemini 2.5. Ask about the Employment Act 1955, generate warning letters, or audit your roster for compliance risks.</p>
                        <ul className="space-y-3">
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-red-600"/> Generates Contracts</li>
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-red-600"/> Flags OT Violations</li>
                           <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-red-600"/> Voice-to-Text Support</li>
                        </ul>
                     </div>
                  )}
               </div>

               {/* Right: The Mockup Visualizer */}
               <div className="relative flex justify-center">
                   {/* Background Blob */}
                   <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 transition-colors duration-500 ${activeFeature === 'kiosk' ? 'bg-blue-500' : activeFeature === 'payroll' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                   
                   {/* Phone Frame */}
                   <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden ring-4 ring-black/10">
                      
                      {/* Notch */}
                      <div className="absolute top-0 inset-x-0 h-8 bg-gray-900 rounded-b-2xl z-30 mx-16"></div>

                      {/* Screen Content */}
                      <div className="w-full h-full bg-white relative flex flex-col pt-12">
                         
                         {/* KIOSK DEMO SCREEN */}
                         {activeFeature === 'kiosk' && (
                             <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
                                 <div className="w-32 h-32 rounded-3xl border-4 border-black relative overflow-hidden mb-6">
                                     <div className="absolute inset-0 bg-gray-200">
                                         <User className="w-full h-full text-gray-400 p-2" />
                                     </div>
                                     <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-[scanLine_1.5s_infinite_linear]"></div>
                                     <div className="absolute top-4 left-4 w-4 h-4 border-t-4 border-l-4 border-blue-600"></div>
                                     <div className="absolute top-4 right-4 w-4 h-4 border-t-4 border-r-4 border-blue-600"></div>
                                     <div className="absolute bottom-4 left-4 w-4 h-4 border-b-4 border-l-4 border-blue-600"></div>
                                     <div className="absolute bottom-4 right-4 w-4 h-4 border-b-4 border-r-4 border-blue-600"></div>
                                 </div>
                                 <h4 className="font-black text-2xl uppercase mb-2">Identifying...</h4>
                                 <div className="bg-green-100 text-green-700 font-bold px-4 py-1 rounded-full text-sm border border-green-200 flex items-center gap-2">
                                     <Fingerprint className="w-4 h-4"/> 98% Match
                                 </div>
                                 <div className="mt-8 w-full space-y-3">
                                     <div className="h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold uppercase shadow-[4px_4px_0_0_#ccc]">Clock In</div>
                                     <div className="h-12 bg-white text-black border-2 border-black rounded-xl flex items-center justify-center font-bold uppercase">Break</div>
                                 </div>
                             </div>
                         )}

                         {/* PAYROLL DEMO SCREEN */}
                         {activeFeature === 'payroll' && (
                             <div className="flex-1 p-6 animate-in zoom-in duration-500 bg-gray-50">
                                 <div className="flex justify-between items-center mb-6">
                                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white"><DollarSign/></div>
                                    <span className="font-black text-xl">PAYSLIP</span>
                                 </div>
                                 <div className="bg-white border-2 border-dashed border-gray-300 p-4 rounded-xl space-y-4 shadow-sm">
                                     <div className="flex justify-between text-sm">
                                         <span className="text-gray-500 font-bold">Basic</span>
                                         <span className="font-mono font-bold">RM 4,500</span>
                                     </div>
                                     <div className="flex justify-between text-sm">
                                         <span className="text-gray-500 font-bold">Allowance</span>
                                         <span className="font-mono font-bold text-green-600">+ RM 300</span>
                                     </div>
                                     <div className="flex justify-between text-sm">
                                         <span className="text-gray-500 font-bold">EPF (11%)</span>
                                         <span className="font-mono font-bold text-red-500">- RM 495</span>
                                     </div>
                                     <div className="h-px bg-gray-200 my-2"></div>
                                     <div className="flex justify-between text-lg">
                                         <span className="font-black uppercase">Net Pay</span>
                                         <span className="font-mono font-black">RM 4,205</span>
                                     </div>
                                 </div>
                                 <div className="mt-6 flex gap-2">
                                     <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center text-white"><FileText className="w-5 h-5"/></div>
                                     <div className="h-10 flex-1 bg-green-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-[2px_2px_0_0_#000]">Disburse Now</div>
                                 </div>
                             </div>
                         )}

                         {/* AI DEMO SCREEN */}
                         {activeFeature === 'ai' && (
                             <div className="flex-1 flex flex-col p-6 animate-in zoom-in duration-500">
                                 <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
                                     <Bot className="w-6 h-6 text-red-500" />
                                     <div>
                                         <p className="text-xs font-bold text-red-400 uppercase">AI Assistant</p>
                                         <p className="text-xs font-bold">Scanning Compliance...</p>
                                     </div>
                                 </div>
                                 <div className="flex-1 space-y-3">
                                     <div className="bg-gray-100 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl text-xs font-medium text-gray-600">
                                         Detected: Employee "Ali" has worked 106 hours OT this month.
                                     </div>
                                     <div className="bg-blue-600 text-white p-3 rounded-tl-xl rounded-bl-xl rounded-br-xl text-xs font-medium self-end ml-8">
                                         Is this a violation?
                                     </div>
                                     <div className="bg-gray-100 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl text-xs font-medium text-gray-600">
                                         <span className="font-bold text-red-500 block mb-1">⚠️ RISK FLAG</span>
                                         Yes. Employment Act 1955 caps OT at 104 hours/month. Recommendation: Adjust roster immediately.
                                     </div>
                                 </div>
                                 <div className="mt-4 h-12 border-2 border-black rounded-full flex items-center px-4">
                                     <span className="text-xs text-gray-400 font-bold animate-pulse">Listening...</span>
                                 </div>
                             </div>
                         )}

                      </div>
                   </div>
               </div>
            </div>
         </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 bg-gray-50 border-t-2 border-black">
         <div className="max-w-7xl mx-auto px-6">
             <div className="text-center mb-16">
                 <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Why PunchClock?</h2>
                 <p className="text-xl text-gray-500">Built for the modern Malaysian workforce.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-8 bg-white border-2 border-black rounded-3xl shadow-[8px_8px_0_0_#000]">
                     <div className="w-12 h-12 bg-[#FFD700] border-2 border-black rounded-xl flex items-center justify-center mb-6">
                        <Zap className="w-6 h-6"/>
                     </div>
                     <h3 className="text-2xl font-black uppercase mb-2">Lightning Fast</h3>
                     <p className="text-gray-600">Built on React 19 & Vite. Pages load in under 100ms. Offline-first architecture ensures Kiosk works even when WiFi drops.</p>
                 </div>
                 <div className="p-8 bg-white border-2 border-black rounded-3xl shadow-[8px_8px_0_0_#000]">
                     <div className="w-12 h-12 bg-blue-500 text-white border-2 border-black rounded-xl flex items-center justify-center mb-6">
                        <Globe className="w-6 h-6"/>
                     </div>
                     <h3 className="text-2xl font-black uppercase mb-2">Localized</h3>
                     <p className="text-gray-600">We don't just "support" MYR. We know about Friday Prayers lunch extension, public holidays in Sabah/Sarawak, and Eis.</p>
                 </div>
                 <div className="p-8 bg-white border-2 border-black rounded-3xl shadow-[8px_8px_0_0_#000]">
                     <div className="w-12 h-12 bg-black text-white border-2 border-black rounded-xl flex items-center justify-center mb-6">
                        <Lock className="w-6 h-6"/>
                     </div>
                     <h3 className="text-2xl font-black uppercase mb-2">Enterprise Secure</h3>
                     <p className="text-gray-600">Biometric data is encrypted. Role-based access control (RBAC) keeps payroll data visible only to HR Managers.</p>
                 </div>
             </div>
         </div>
      </section>

      {/* Pricing Sketch */}
      <section className="py-24 max-w-5xl mx-auto px-6">
         <div className="text-center mb-16">
             <h2 className="text-5xl font-black uppercase tracking-tighter">Simple Pricing</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
             {/* Starter */}
             <div className="p-8 border-2 border-black rounded-3xl bg-white hover:-translate-y-2 transition-transform">
                 <h3 className="font-black text-xl uppercase mb-2">Starter</h3>
                 <p className="text-4xl font-black mb-6">Free</p>
                 <ul className="space-y-3 mb-8 text-sm font-bold text-gray-500">
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-black"/> Up to 5 Staff</li>
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-black"/> Basic Payroll</li>
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-black"/> Kiosk Mode</li>
                 </ul>
                 <button className="w-full py-3 border-2 border-black rounded-xl font-bold uppercase hover:bg-gray-100">Start Free</button>
             </div>
             
             {/* SME - Featured */}
             <div className="p-8 border-4 border-black rounded-3xl bg-[#FFD700] shadow-[12px_12px_0_0_#000] relative transform scale-105">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Most Popular</div>
                 <h3 className="font-black text-xl uppercase mb-2">Growth</h3>
                 <p className="text-4xl font-black mb-6">RM 150<span className="text-base font-normal">/mo</span></p>
                 <ul className="space-y-3 mb-8 text-sm font-bold text-black">
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4"/> Up to 50 Staff</li>
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4"/> AI Compliance Audit</li>
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4"/> Bank File Export</li>
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4"/> Priority Support</li>
                 </ul>
                 <button className="w-full py-3 bg-black text-white rounded-xl font-bold uppercase hover:bg-gray-800">Get Growth</button>
             </div>

             {/* Enterprise */}
             <div className="p-8 border-2 border-black rounded-3xl bg-white hover:-translate-y-2 transition-transform">
                 <h3 className="font-black text-xl uppercase mb-2">Enterprise</h3>
                 <p className="text-4xl font-black mb-6">Custom</p>
                 <ul className="space-y-3 mb-8 text-sm font-bold text-gray-500">
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-black"/> Unlimited Staff</li>
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-black"/> Custom Integrations</li>
                     <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-black"/> Dedicated Manager</li>
                 </ul>
                 <button className="w-full py-3 border-2 border-black rounded-xl font-bold uppercase hover:bg-gray-100">Contact Sales</button>
             </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-8 border-[#FFD700]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black italic">P.</div>
                 <span className="font-bold tracking-tight">PUNCHCLOCK MALAYSIA</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">© 2025 MN Jewel Sdn Bhd. All rights reserved.</p>
              <div className="flex gap-6 text-sm font-bold text-gray-400">
                  <a href="#" className="hover:text-white">Privacy</a>
                  <a href="#" className="hover:text-white">Terms</a>
                  <a href="#" className="hover:text-white">Support</a>
              </div>
          </div>
      </footer>
    </div>
  );
};
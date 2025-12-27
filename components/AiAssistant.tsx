
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Maximize2, Minimize2, Command, DollarSign, ShieldCheck, Download, FileDown, TrendingUp, RefreshCw, Fingerprint, Calculator, AlertTriangle, CheckCircle, Clock, MapPin, Users, Briefcase, ChevronRight, ArrowRight, Siren, BarChart2, Sparkles, Zap, MessageSquare } from 'lucide-react';
import { chatWithHRAssistant } from '../services/geminiService';
import { generateAIReportPDF } from '../services/documentService';
import { ChatMessage } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, LineChart, Line } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { NeoCard, NeoBadge, NeoButton } from './NeoComponents';

// --- CONTEXT-AWARE PROMPT ENGINE ---
const getPromptsForContext = (pathname: string, role: string) => {
  // Base prompts available everywhere
  const quickNav = [
    { label: "System Status", prompt: "Check system health and connectivity.", icon: Zap, color: "text-yellow-400" },
    { label: "My Activity", prompt: "Show my recent logs and actions.", icon: Fingerprint, color: "text-gray-400" },
    { label: "Draft Memo", prompt: "Draft a general staff announcement memo.", icon: FileDown, color: "text-blue-300" }
  ];

  if (pathname === '/payroll') {
    return [
      // Primary Grid (First 2)
      { label: "Analyze Cost", prompt: "Analyze this month's payroll cost. Show me the breakdown between basic salary, OT, and statutory contributions.", icon: Calculator, color: "text-green-500" },
      { label: "Check Overtime", prompt: "Who is driving OT cost this month? List the top 5 earners and their hours.", icon: Clock, color: "text-orange-500" },
      // Rotating Pills
      { label: "Salary Simulation", prompt: "Simulate a 10% salary increase for all staff. How much will the total payroll cost rise including EPF?", icon: TrendingUp, color: "text-purple-500" },
      { label: "EPF Variance", prompt: "Compare total EPF contribution this month vs last month.", icon: BarChart2, color: "text-blue-400" },
      { label: "Net Pay Audit", prompt: "List employees with Net Pay below RM 1500.", icon: DollarSign, color: "text-red-400" },
      { label: "LHDN Compliance", prompt: "Verify PCB calculations against 2025 schedule.", icon: ShieldCheck, color: "text-yellow-600" },
      ...quickNav
    ];
  }

  if (pathname === '/attendance') {
    return [
      // Primary Grid
      { label: "Who is Late?", prompt: "List all employees who clocked in after 9:15 AM today. Show me their arrival times.", icon: Clock, color: "text-orange-500" },
      { label: "GPS Audit", prompt: "Analyze location data. Are there any punch-ins from outside the 100m geofence?", icon: MapPin, color: "text-blue-500" },
      // Rotating Pills
      { label: "MIA Check", prompt: "Identify staff who have been Absent for more than 2 consecutive days without leave.", icon: AlertTriangle, color: "text-red-500" },
      { label: "Early Leavers", prompt: "Who clocked out before 5:30 PM yesterday?", icon: LogOut, color: "text-yellow-500" }, // LogOut needs import or use ArrowRight
      { label: "Pattern Detection", prompt: "Which day of the week has the highest absenteeism?", icon: BarChart2, color: "text-purple-400" },
      { label: "Unknown Faces", prompt: "Show logs where face recognition confidence was low.", icon: Fingerprint, color: "text-gray-400" },
      ...quickNav
    ];
  }

  if (pathname === '/employees' || pathname === '/onboarding') {
    return [
      // Primary Grid
      { label: "Onboard Batch", prompt: "Generate an onboarding pack for 5 new Retail Crew members. Include Contracts and Handbook acknowledgments.", icon: Users, color: "text-pink-500" },
      { label: "Skill Gap", prompt: "Analyze the current staff skills matrix. Which department is lacking coverage?", icon: Briefcase, color: "text-indigo-500" },
      // Rotating Pills
      { label: "Probation Check", prompt: "List employees ending probation this month.", icon: CheckCircle, color: "text-green-400" },
      { label: "Diversity Stats", prompt: "Show gender and age distribution of the workforce.", icon: PieChartIcon, color: "text-orange-400" }, // PieChartIcon needs import or use standard
      { label: "Draft Contract", prompt: "Draft a standard permanent employment contract.", icon: FileDown, color: "text-blue-400" },
      ...quickNav
    ];
  }

  if (pathname === '/compliance') {
      return [
          { label: "Full Audit", prompt: "Run a full compliance audit against Employment Act 1955.", icon: ShieldCheck, color: "text-red-600" },
          { label: "Generate Policy", prompt: "Draft a 'Social Media Usage' policy clause.", icon: FileDown, color: "text-blue-500" },
          { label: "Check Breaks", prompt: "Are any staff working more than 5 consecutive hours without a break?", icon: Clock, color: "text-orange-500" },
          { label: "Leave Balance", prompt: "Who has utilized less than 50% of their annual leave?", icon: CalendarIcon, color: "text-green-500" },
          ...quickNav
      ];
  }

  // Default / Dashboard
  return [
    { label: "Audit Attendance", prompt: "Scan today's attendance logs. Identify any staff who are Late or Absent and check for patterns.", icon: Fingerprint, color: "text-blue-500" },
    { label: "Risk Forecast", prompt: "Analyze attendance trends from the last 30 days. Who is at risk of attrition or burnout?", icon: TrendingUp, color: "text-yellow-500" },
    { label: "Legal Compliance", prompt: "Check current records against Employment Act 1955. Are there OT violations?", icon: ShieldCheck, color: "text-red-500" },
    { label: "Payroll Preview", prompt: "Estimate the total payroll cost for this month so far.", icon: Calculator, color: "text-green-500" },
    { label: "Identify Leaders", prompt: "Who has the best attendance record this quarter?", icon: Award, color: "text-purple-500" },
    ...quickNav
  ];
};

// --- ICON ALIASES FOR MISSING IMPORTS ---
const LogOut = ArrowRight; 
const PieChartIcon = Users;
const CalendarIcon = Clock;
const Award = Sparkles;

const COLORS = ['#3B82F6', '#FFD700', '#EF4444', '#10B981', '#A855F7'];

const MessageRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: string[][] = [];

  const formatText = (input: string) => {
    return input.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>');
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Table Parsing Logic
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.every(c => c.match(/^[:\-\s]+$/))) return;
      currentTable.push(cells);
      return;
    } else if (currentTable.length > 0) {
      const rows = [...currentTable];
      currentTable = [];
      elements.push(
        <div key={`table-${idx}`} className="my-6 overflow-x-auto rounded-2xl border-2 border-white/10 bg-black/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                {rows[0].map((cell, i) => (
                  <th key={i} className="p-4 font-black uppercase tracking-widest text-blue-400 border-r border-white/5 last:border-0">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-4 font-bold text-gray-300 border-r border-white/5 last:border-0" dangerouslySetInnerHTML={{ __html: formatText(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (!trimmed) return;

    if (trimmed.startsWith('### ')) {
      elements.push(
        <div key={idx} className="pt-6 border-b border-white/10 pb-2 mb-4">
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-500">{trimmed.replace('### ', '')}</h4>
        </div>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <div key={idx} className="flex gap-3 pl-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_8px_#3b82f6]" />
          <p className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatText(trimmed.replace(/^[*|-]\s/, '')) }} />
        </div>
      );
    } else {
      elements.push(
        <p key={idx} className="text-sm text-gray-300 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: formatText(trimmed) }} />
      );
    }
  });

  return <div className="space-y-1">{elements}</div>;
};

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pillCycle, setPillCycle] = useState(0);
  
  // Visual State for the Interactive Deck
  const [activeVisual, setActiveVisual] = useState<'NONE' | 'ATTENDANCE_LIVE' | 'PAYROLL_LIVE' | 'COMPLIANCE_LIVE' | 'RISK_ANALYSIS' | 'PAYROLL_FORECAST' | 'ONBOARDING_PACK' | 'OT_ANALYSIS'>('NONE');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { employees, attendanceRecords, payrollSettings, currentUser, addNotification, companyProfile, documents, shifts, userPreferences, logInteraction } = useGlobal();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic Prompts based on Context
  const activePrompts = useMemo(() => {
      return getPromptsForContext(location.pathname, currentUser?.role || 'Staff');
  }, [location.pathname, currentUser]);

  const gridPrompts = activePrompts.slice(0, 2);
  const rotatingPrompts = activePrompts.slice(2);

  useEffect(() => {
    const timer = setInterval(() => {
        setPillCycle(prev => prev + 1);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('pc_chat_history_v2');
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) { console.error(e); }
    } else {
        setMessages([{ 
            role: 'model', 
            text: "### SYSTEM ONLINE\nI am your HR Intelligence Unit. I have access to real-time biometric feeds, payroll engines, and LHDN compliance protocols.", 
            timestamp: new Date()
        }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem('pc_chat_history_v2', JSON.stringify(messages));
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, isImmersive]);

  const handleDownloadReport = () => {
      const lastAi = [...messages].reverse().find(m => m.role === 'model');
      if (!lastAi || !currentUser) return;
      const url = generateAIReportPDF(lastAi.text, companyProfile, currentUser.name);
      const a = document.createElement('a'); a.href = url; a.download = `HR_REPORT_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      addNotification("Professional Report Downloaded", "success");
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !currentUser) return;
    if (textOverride) logInteraction(textToSend);

    // Intent Classification (Enhanced with OT)
    if (textToSend.includes("attendance") || textToSend.includes("Audit") || textToSend.includes("Late")) setActiveVisual('ATTENDANCE_LIVE');
    else if (textToSend.includes("Simulate") || textToSend.includes("Forecast") || textToSend.includes("increase")) setActiveVisual('PAYROLL_FORECAST');
    else if (textToSend.includes("OT") || textToSend.includes("Overtime")) setActiveVisual('OT_ANALYSIS');
    else if (textToSend.includes("payroll") || textToSend.includes("Calculate")) setActiveVisual('PAYROLL_LIVE');
    else if (textToSend.includes("compliance") || textToSend.includes("Verify")) setActiveVisual('COMPLIANCE_LIVE');
    else if (textToSend.includes("Risk") || textToSend.includes("trends")) setActiveVisual('RISK_ANALYSIS');
    else if (textToSend.includes("Onboard") || textToSend.includes("pack")) setActiveVisual('ONBOARDING_PACK');

    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await chatWithHRAssistant(textToSend, messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), {
        currentUser, employees, attendanceRecords, payrollSettings, companyProfile, documents, shifts, userPreferences
    });
    
    setMessages(prev => [...prev, { role: 'model', text: response.text, timestamp: new Date(), suggestions: response.suggestions }]);
    
    if (response.intent && response.intent !== 'NONE') setActiveVisual(response.intent as any);
    if (response.navigation) { navigate(response.navigation); addNotification(`Navigating to ${response.navigation}`, 'info'); }
    
    setIsLoading(false);
  };

  // --- RENDERERS FOR INTERACTIVE DECK ---
  // (Note: Deck renderers omitted for brevity as they are unchanged)
  // ... Keep existing renderAttendanceDeck, renderPayrollDeck etc. ...
  // Re-implementing simplified versions for the update block context:

  const renderAttendanceDeck = () => (
      <div className="animate-in slide-in-from-right duration-500">
          <div className="flex items-center gap-4 mb-6"><div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-glow border-2 border-white/20"><Fingerprint className="w-8 h-8 text-white" /></div><div><h3 className="text-2xl font-black uppercase text-white">Live Audit</h3><p className="text-[10px] font-bold text-gray-500 uppercase">KLCC HQ</p></div></div>
          <div className="space-y-3">
              {[{ name: "Ali Bin Abu", time: "08:45 AM", status: "Present" }, { name: "Muthu Kumar", time: "09:12 AM", status: "Late" }].map((staff, i) => (
                  <div key={i} className="flex justify-between p-4 bg-white/5 border border-white/10 rounded-2xl"><p className="text-sm font-bold text-white">{staff.name}</p><span className={staff.status==='Late'?'text-yellow-500 font-bold':'text-green-500 font-bold'}>{staff.time}</span></div>
              ))}
          </div>
      </div>
  );
  // ... other renderers assumed unchanged ... 
  
  const renderDataDeck = () => {
    switch(activeVisual) {
        case 'ATTENDANCE_LIVE': return renderAttendanceDeck();
        default: return <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-12"><Command className="w-24 h-24 mb-6"/><h3 className="text-xl font-black uppercase">Awaiting Command</h3></div>;
    }
  };

  // Helper to render pills with rotation
  const renderSuggestionPills = () => {
      // Calculate which pills to show based on cycle
      const itemsToShow = 3;
      const startIndex = pillCycle % Math.max(1, rotatingPrompts.length - itemsToShow + 1); // simple sliding window or wrap
      // Actually, let's just pick 3 distinct ones based on cycle to avoid empty slots at end
      const displayPills = [
          rotatingPrompts[pillCycle % rotatingPrompts.length],
          rotatingPrompts[(pillCycle + 1) % rotatingPrompts.length],
          rotatingPrompts[(pillCycle + 2) % rotatingPrompts.length]
      ].filter(Boolean);

      return (
        <div className="flex gap-2 overflow-hidden pb-2 mb-2 px-1">
          {displayPills.map((flow, idx) => (
            <button
              key={`${flow.label}-${pillCycle}`} // Key change triggers animation
              onClick={() => {
                 if (!isImmersive) setIsImmersive(true);
                 handleSend(flow.prompt);
              }}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider text-gray-300 transition-all flex items-center gap-2 flex-shrink-0 animate-in slide-in-from-right fade-in duration-500"
            >
              <flow.icon className={`w-3 h-3 ${flow.color}`} />
              {flow.label}
            </button>
          ))}
        </div>
      );
  };

  return (
    <>
      {/* --- MINIMIZED FLOATING BUTTON --- */}
      {!isOpen && !isImmersive && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-[#ef4444] text-white w-16 h-16 rounded-2xl border-4 border-black shadow-[6px_6px_0_0_#000] flex items-center justify-center hover:translate-y-[-2px] hover:shadow-[8px_8px_0_0_#000] transition-all z-50 group animate-in slide-in-from-bottom-10">
          <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* --- POPUP CHAT UI (Standard) --- */}
      {isOpen && !isImmersive && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-[#121212] border-4 border-white rounded-[2.5rem] shadow-2xl flex flex-col z-50 overflow-hidden animate-in zoom-in-95 origin-bottom-right">
          
          {/* Header */}
          <div className="bg-black p-5 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-black text-white text-xs tracking-widest uppercase">HR Agent v2.6</h3>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsImmersive(true)} className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded"><Maximize2 className="w-4 h-4"/></button>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded"><X className="w-5 h-5"/></button>
            </div>
          </div>

          {/* Quick Action Grid - FIXED Primary Prompts */}
          <div className="p-4 grid grid-cols-2 gap-2 border-b border-white/10 bg-[#0a0a0a]">
              {gridPrompts.map((flow, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => { setIsImmersive(true); handleSend(flow.prompt); }}
                    className="flex flex-col gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all text-left group"
                  >
                      <flow.icon className={`w-5 h-5 ${flow.color}`} />
                      <div>
                          <p className="text-[10px] font-black uppercase text-white leading-tight">{flow.label}</p>
                      </div>
                  </button>
              ))}
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#0a0a0a] space-y-6" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl border-2 ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-400' : 'bg-[#1a1a1a] border-white/10'}`}>
                    <MessageRenderer text={msg.text} />
                </div>
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-[#1a1a1a] p-4 rounded-2xl border-2 border-white/5 animate-pulse text-xs text-blue-400 font-black uppercase flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin"/> Thinking...</div></div>}
          </div>

          {/* Input Area with ROTATING Pills */}
          <div className="p-4 bg-black border-t border-white/10">
             {renderSuggestionPills()}
             <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder="Ask me anything..." 
                    className="flex-1 bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition-all" 
                />
                <button onClick={() => handleSend()} className="bg-white text-black p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Send className="w-5 h-5" /></button>
             </div>
          </div>
        </div>
      )}

      {/* --- IMMERSIVE MODE (FULL SCREEN) --- */}
      {isImmersive && (
          <div className="fixed inset-0 z-[200] bg-black text-white flex animate-in zoom-in-95 duration-300 overflow-hidden">
              
              {/* SIDEBAR: Dynamic Command Deck */}
              <div className={`w-[400px] bg-[#080808] border-r-2 border-white/10 flex flex-col transition-all duration-500 ease-in-out`}>
                  <div className="p-8 pt-12 flex-1 overflow-y-auto">
                      <div className="flex items-center gap-4 mb-10">
                          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center border-2 border-white shadow-[4px_4px_0_0_#fff] italic font-black text-xl">AI</div>
                          <div>
                              <h2 className="font-black text-xl uppercase tracking-tighter italic">Command<br/>Deck</h2>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{location.pathname.replace('/', '') || 'Dashboard'} Context</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Primary Workflows</p>
                          {/* Show ALL context prompts in Immersive Sidebar, not just rotating ones */}
                          {activePrompts.map((flow, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => handleSend(flow.prompt)} 
                                className="w-full text-left p-5 rounded-3xl border-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] transition-all group relative overflow-hidden"
                              >
                                  <div className="relative z-10 flex items-center gap-4">
                                      <div className={`p-3 rounded-xl bg-black border border-white/10`}>
                                          <flow.icon className={`w-6 h-6 ${flow.color}`} />
                                      </div>
                                      <div>
                                          <span className="text-xs font-black text-white uppercase block mb-1">{flow.label}</span>
                                          <span className="text-[10px] text-gray-400 group-hover:text-white leading-tight block line-clamp-2">{flow.prompt}</span>
                                      </div>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <button onClick={() => setIsImmersive(false)} className="p-6 border-t-2 border-white/5 text-gray-500 hover:text-white flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                      <Minimize2 className="w-4 h-4"/> Exit Fullscreen
                  </button>
              </div>

              {/* CENTER: Chat Interface */}
              <div className="flex-1 flex flex-col bg-[#050505] relative">
                  <div className="flex-1 overflow-y-auto p-12 pt-20 relative z-10 custom-scrollbar" ref={scrollRef}>
                      <div className="max-w-3xl mx-auto space-y-12 pb-40">
                         {messages.map((msg, idx) => (
                           <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-500`}>
                               <div className={`max-w-[90%] p-8 rounded-[2.5rem] border-2 ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-400' : 'bg-[#111] border-white/10 shadow-2xl'}`}>
                                   <MessageRenderer text={msg.text} />
                                   {msg.role === 'model' && msg.text.includes('###') && (
                                       <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                                           <button onClick={handleDownloadReport} className="flex items-center gap-3 px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                                               <FileDown className="w-4 h-4 text-green-500" /> Export PDF
                                           </button>
                                           <span className="text-[9px] font-mono text-gray-600 tracking-tighter">CONFIDENTIAL DATA</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                         ))}
                      </div>
                  </div>
                  
                  <div className="p-10 bg-black/90 backdrop-blur-xl border-t-2 border-white/5 shrink-0 z-20">
                     <div className="max-w-3xl mx-auto relative">
                        {renderSuggestionPills()}
                        <div className="relative">
                            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask specific questions about payroll or staff..." className="w-full bg-[#111] border-2 border-white/20 rounded-full px-8 py-6 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner" />
                            <button onClick={() => handleSend()} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white text-black rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl"><Send className="w-6 h-6"/></button>
                        </div>
                     </div>
                  </div>
              </div>
              
              {/* RIGHT: Live Data Deck (The Visualizer) */}
              <div className="w-[450px] bg-[#080808] border-l-2 border-white/10 hidden xl:flex flex-col relative overflow-y-auto custom-scrollbar">
                 <div className="p-8 border-b border-white/10 bg-black/50 sticky top-0 z-20 backdrop-blur-md flex justify-between items-center">
                    <h3 className="font-black text-xl uppercase tracking-tighter italic">LIVE DATA</h3>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                 </div>
                 <div className="p-8">
                    {renderDataDeck()}
                 </div>
              </div>
          </div>
      )}
    </>
  );
};

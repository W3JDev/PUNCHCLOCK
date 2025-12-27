
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Sparkles, Maximize2, Minimize2, Command, DollarSign, Activity, Plus, FileText, Table as TableIcon, ShieldCheck, Scale, Download, FileDown, TrendingUp, RefreshCw, PanelLeft, ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import { chatWithHRAssistant } from '../services/geminiService';
import { generateAIReportPDF } from '../services/documentService';
import { ChatMessage } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

const POWER_PROMPTS = [
  { label: "6-Month Audit", desc: "Audit attendance cycles for H1 2025", icon: ShieldCheck, prompt: "Perform a comprehensive audit of all attendance records for the last 180 days. Identify the top 5 staff with the best punctuality, calculate cumulative productivity loss from lateness, and flag anyone with >10% absence rate. Output a table showing the data." },
  { label: "OT Forecast", desc: "Predict salary impact for next month", icon: DollarSign, prompt: "Based on the 6-month OT trends, forecast the expected payroll expenditure for next month. Identify which department has the highest OT volatility." },
  { label: "Legal Check", desc: "Check compliance with EA 1955", icon: Scale, prompt: "Scan current shift rosters and attendance for Section 60A violations. Are there any employees exceeding the 104-hour monthly OT limit?" },
  { label: "Staff Pulse", desc: "Identify top performers and risks", icon: TrendingUp, prompt: "Analyze staff engagement. Who are our most consistent workers? Identify any 'Flight Risk' employees showing recent behavioral shifts in clock-in times." }
];

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
      // Skip separator rows
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeVisual, setActiveVisual] = useState<'NONE' | 'PAYROLL_CHART' | 'ATTENDANCE_CHART' | 'STAFF_TABLE' | 'POLICY_DOC'>('NONE');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { employees, attendanceRecords, payrollSettings, currentUser, addNotification, companyProfile, documents, shifts, userPreferences, logInteraction } = useGlobal();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('pc_chat_history_v2');
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) { console.error(e); }
    } else {
        setMessages([{ role: 'model', text: "### SYSTEM STANDBY\nI am connected to **MN JEWEL SDN BHD**'s half-yearly data lake. I can perform forensic audits, salary forecasts, or legal drafting.\n\nSelect a **Power Analysis** or ask me anything.", timestamp: new Date(), suggestions: ['Audit 6 Months', 'OT Trends', 'Legal Compliance'] }]);
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

    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await chatWithHRAssistant(textToSend, messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), {
        currentUser, employees, attendanceRecords, payrollSettings, companyProfile, documents, shifts, userPreferences
    });
    
    setMessages(prev => [...prev, { role: 'model', text: response.text, timestamp: new Date(), suggestions: response.suggestions }]);
    if (response.intent) setActiveVisual(response.intent as any);
    if (response.navigation) { navigate(response.navigation); addNotification(`Navigating to ${response.navigation}`, 'info'); }
    setIsLoading(false);
    if (isSidebarOpen && window.innerWidth < 1024) setIsSidebarOpen(false); 
  };

  const renderDataDeck = () => {
    if (activeVisual === 'NONE') return (
        <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-12">
            <Command className="w-24 h-24 mb-6" strokeWidth={1} />
            <h3 className="text-xl font-black uppercase tracking-widest">Awaiting Analysis</h3>
        </div>
    );
    const isPayroll = activeVisual === 'PAYROLL_CHART';
    return (
        <div className="p-8 space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${isPayroll ? 'bg-green-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20`}>
                    {isPayroll ? <DollarSign className="w-7 h-7 text-white" /> : <Activity className="w-7 h-7 text-white" />}
                </div>
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">{isPayroll ? 'Financial Deck' : 'Ops Vector'}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Multi-Month Aggregation</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-gray-500 text-[9px] uppercase font-black mb-1">Punctuality Score</p>
                    <p className="text-4xl font-black text-white">92.4%</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-gray-500 text-[9px] uppercase font-black mb-1">OT Efficiency</p>
                    <p className="text-4xl font-black text-green-500">Optimum</p>
                </div>
            </div>
            <div className="h-[300px] w-full bg-black border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {isPayroll ? (
                        <AreaChart data={[ {m: 'Jan', v: 45000}, {m: 'Feb', v: 42000}, {m: 'Mar', v: 48000}, {m: 'Apr', v: 46000} ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="m" stroke="#555" fontSize={10} />
                            <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                            <Area type="monotone" dataKey="v" stroke="#10B981" fill="#10B98133" strokeWidth={4} />
                        </AreaChart>
                    ) : (
                        <PieChart>
                            <Pie data={[{n:'On Time',v:85},{n:'Late',v:10},{n:'Absent',v:5}]} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="v" stroke="none">
                                {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '15px'}} />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
  };

  return (
    <>
      {!isOpen && !isImmersive && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-[#ef4444] text-white w-16 h-16 rounded-2xl border-4 border-black shadow-[6px_6px_0_0_#000] flex items-center justify-center hover:translate-y-[-2px] hover:shadow-[8px_8px_0_0_#000] transition-all z-50 group">
          <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && !isImmersive && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[700px] bg-[#121212] border-4 border-white rounded-[2.5rem] shadow-2xl flex flex-col z-50 overflow-hidden animate-in zoom-in-95 origin-bottom-right">
          <div className="bg-black p-5 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-black text-white text-xs tracking-widest uppercase">Intelligence Engine</h3>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsImmersive(true)} className="text-white/50 hover:text-white"><Maximize2 className="w-4 h-4"/></button>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 bg-[#0a0a0a] space-y-6" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl border-2 ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-400' : 'bg-[#1a1a1a] border-white/10'}`}>
                    <MessageRenderer text={msg.text} />
                </div>
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-[#1a1a1a] p-4 rounded-2xl border-2 border-white/5 animate-pulse text-xs text-blue-400 font-black uppercase flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin"/> Processing State...</div></div>}
          </div>
          <div className="p-5 bg-black border-t border-white/10 space-y-4">
             <div className="flex flex-wrap gap-2">
                {messages[messages.length-1]?.suggestions?.map((s, i) => (
                    <button key={i} onClick={() => handleSend(s)} className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all">{s}</button>
                ))}
             </div>
             <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask HR AI..." className="flex-1 bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
                <button onClick={() => handleSend()} className="bg-white text-black p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Send className="w-5 h-5" /></button>
             </div>
          </div>
        </div>
      )}

      {isImmersive && (
          <div className="fixed inset-0 z-[200] bg-black text-white flex animate-in zoom-in-95 duration-300 overflow-hidden">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`absolute top-8 left-8 z-[210] p-4 bg-[#111] border-2 border-white/10 rounded-2xl text-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-glow flex items-center gap-3 group`}
              >
                <PanelLeft className={`w-6 h-6 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">{isSidebarOpen ? 'Hide Controls' : 'Show Controls'}</span>
              </button>

              <div className={`
                ${isSidebarOpen ? 'w-85 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full'} 
                bg-[#080808] border-r-2 border-white/10 flex flex-col transition-all duration-500 ease-in-out overflow-hidden
              `}>
                  <div className="flex flex-col p-8 pt-24 h-full min-w-[340px]">
                      <div className="flex items-center justify-between mb-12">
                          <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-blue-600 rounded-[1.2rem] flex items-center justify-center border-4 border-white shadow-[4px_4px_0_0_#000] italic font-black text-xl">AI</div>
                              <h2 className="font-black text-2xl uppercase tracking-tighter italic">AGENT<br/>DECK.</h2>
                          </div>
                      </div>
                      <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          <button onClick={() => { setMessages([]); setActiveVisual('NONE'); }} className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-white/5 transition-all"><Plus className="w-4 h-4 text-blue-500"/> New Audit</button>
                          <div className="pt-8">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">— FORENSIC SCENARIOS —</h4>
                            <div className="space-y-3">
                                {POWER_PROMPTS.map((pp, i) => (
                                    <button key={i} onClick={() => handleSend(pp.prompt)} className="w-full text-left p-4 rounded-2xl bg-white/5 border-2 border-white/5 hover:border-blue-500/50 transition-all group">
                                        <div className="flex items-center gap-3 mb-1">
                                            <pp.icon className="w-4 h-4 text-blue-400" />
                                            <span className="text-[11px] font-black text-gray-200 group-hover:text-white uppercase">{pp.label}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-500 leading-relaxed line-clamp-1">{pp.desc}</p>
                                    </button>
                                ))}
                            </div>
                          </div>
                      </div>
                      <button onClick={() => setIsImmersive(false)} className="mt-8 flex items-center justify-center gap-2 p-4 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest border-t-2 border-white/5"><Minimize2 className="w-4 h-4"/> Close Deck</button>
                  </div>
              </div>

              <div className="flex-1 flex flex-col bg-[#050505] relative">
                  <div className="flex-1 overflow-y-auto p-12 pt-32 relative z-10 custom-scrollbar" ref={scrollRef}>
                      <div className="max-w-4xl mx-auto space-y-12 pb-40">
                         {messages.map((msg, idx) => (
                           <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 duration-500`}>
                               <div className={`max-w-[95%] p-10 rounded-[3rem] border-4 ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-400' : 'bg-[#111] border-white/10 shadow-[20px_20px_60px_#000]'}`}>
                                   <MessageRenderer text={msg.text} />
                                   {msg.role === 'model' && msg.text.includes('###') && (
                                       <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center">
                                           <button onClick={handleDownloadReport} className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-white/10 transition-all">
                                               <FileDown className="w-5 h-5 text-green-500" /> Export Professional PDF
                                           </button>
                                           <span className="text-[10px] font-mono text-gray-600 tracking-tighter">DATASET: H1_2025_FULL_CYCLE</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                         ))}
                         {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="p-10 rounded-[3rem] bg-white/5 border-4 border-white/5 flex items-center gap-6">
                                    <TrendingUp className="w-10 h-10 text-blue-500 animate-bounce" />
                                    <div><h4 className="font-black text-xl uppercase italic">Quantum Data Scan</h4><p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Aggregating 6-month workforce logs...</p></div>
                                </div>
                            </div>
                         )}
                      </div>
                  </div>
                  <div className="p-12 bg-black/80 backdrop-blur-3xl border-t-2 border-white/5 shrink-0 z-20">
                     <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex flex-wrap gap-3 justify-center">
                            {messages[messages.length-1]?.suggestions?.map((s, i) => (
                                <button key={i} onClick={() => handleSend(s)} className="px-6 py-3 rounded-2xl bg-white/5 border-2 border-white/10 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:border-blue-400 transition-all">{s}</button>
                            ))}
                        </div>
                        <div className="relative">
                            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Consult the HR Intelligence Agent..." className="w-full bg-black border-4 border-white/10 rounded-[3rem] px-12 py-8 text-white text-2xl font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner" />
                            <button onClick={() => handleSend()} className="absolute right-6 top-1/2 -translate-y-1/2 p-6 bg-white text-black rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-2xl"><Send className="w-8 h-8"/></button>
                        </div>
                     </div>
                  </div>
              </div>
              
              <div className="w-[500px] bg-[#050505] border-l-2 border-white/10 hidden xl:flex flex-col relative overflow-y-auto custom-scrollbar">
                 <div className="p-10 border-b border-white/10 bg-black/50 sticky top-0 z-20 backdrop-blur-md flex justify-between items-center">
                    <h3 className="font-black text-3xl uppercase tracking-tighter italic">DATA DECK</h3>
                    <Activity className="w-7 h-7 text-blue-500" />
                 </div>
                 {renderDataDeck()}
              </div>
          </div>
      )}
    </>
  );
};

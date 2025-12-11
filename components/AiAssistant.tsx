
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Sparkles, Mic, MicOff, Maximize2, Minimize2, Command, Users, DollarSign, Activity, Plus, RefreshCw, FileText, Table as TableIcon, TrendingUp, AlertTriangle, ArrowRight, Zap, ShieldCheck, Scale } from 'lucide-react';
import { chatWithHRAssistant } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

// POWER PROMPTS: Designed to show off specific capabilities
const POWER_PROMPTS = [
  { 
    label: "Forensic Audit", 
    desc: "Scan attendance for chronic lateness & risks",
    icon:  ShieldCheck,
    prompt: "Audit attendance for the last 30 days. Identify chronic latecomers (more than 3 times), calculate total minutes lost, and draft a strict memo to the Operations Department addressing this issue." 
  },
  { 
    label: "Payroll Forecast", 
    desc: "Predict next month's OT & costs",
    icon: DollarSign,
    prompt: "Analyze the current payroll run. Visualize the split between Basic Salary vs. Overtime. Who is the highest earner including OT? Predict next month's cost if we hire 2 more senior staff." 
  },
  { 
    label: "Legal Scan", 
    desc: "Check roster against Employment Act 1955",
    icon: Scale,
    prompt: "Check our roster against Employment Act 1955. Are there any staff working > 45 hours/week? Draft a formal Warning Letter template for staff who are MIA (Absent > 2 days)." 
  },
  { 
    label: "Onboarding Bot", 
    desc: "Identify bottlenecks in hiring pipeline",
    icon: Users,
    prompt: "List all employees currently in Onboarding. What is the bottleneck step? Generate a welcome email for new hires explaining the 'Friday Prayers' long lunch policy." 
  }
];

// High Contrast Colors for Charts
const COLORS = ['#3B82F6', '#FFD700', '#EF4444', '#10B981'];

// --- MARKDOWN RENDERER COMPONENT ---
// Updated to accept `isDarkBg` to decouple text color from user role.
const MessageRenderer: React.FC<{ text: string, isDarkBg: boolean }> = ({ text, isDarkBg }) => {
  const lines = text.split('\n');
  
  // Dynamic colors based on container background brightness
  // isDarkBg=true  => Light Text (For Dark Bubbles)
  // isDarkBg=false => Dark Text (For White Bubbles)
  const headerColor = isDarkBg ? 'text-blue-400' : 'text-blue-600';
  const boldColor = isDarkBg ? 'text-white' : 'text-black';
  const textColor = isDarkBg ? 'text-gray-300' : 'text-gray-700';
  const listMarker = isDarkBg ? 'text-blue-500' : 'text-blue-600';

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
            return <h4 key={idx} className={`text-lg font-black uppercase mt-4 mb-2 border-b ${isDarkBg ? 'border-white/10' : 'border-black/10'} pb-1 ${headerColor}`}>{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
             return <p key={idx} className={`font-bold text-md ${boldColor}`}>{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            return (
                <div key={idx} className="flex gap-3 pl-2 items-start">
                    <span className={`${listMarker} font-bold mt-1`}>•</span>
                    <span className={textColor} dangerouslySetInnerHTML={{ __html: line.replace(/^[\*\-]\s/, '').replace(/\*\*(.*?)\*\*/g, `<b class="${boldColor}">$1</b>`) }} />
                </div>
            );
        }
        return <p key={idx} className={`${textColor} leading-relaxed`} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, `<b class="${boldColor}">$1</b>`) }} />;
      })}
    </div>
  );
};

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '### SYSTEM ONLINE\nI am your **HR Operations Agent**. I have full access to Payroll, Biometrics, and Legal Statutes.\n\nSelect a **Power Prompt** below to see what I can do.', timestamp: new Date() }
  ]);
  
  // AI Learning State
  const [userPreferences, setUserPreferences] = useState<Record<string, number>>({});

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Visual/Agentic State
  const [activeVisual, setActiveVisual] = useState<'NONE' | 'PAYROLL_CHART' | 'ATTENDANCE_CHART' | 'STAFF_TABLE' | 'POLICY_DOC'>('NONE');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { employees, attendanceRecords, payrollSettings, currentUser, addNotification, companyProfile, documents, shifts } = useGlobal();
  const navigate = useNavigate();

  // --- PERSISTENCE & LEARNING ---
  useEffect(() => {
    const saved = localStorage.getItem('pc_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        setMessages(hydrated);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) localStorage.setItem('pc_chat_history', JSON.stringify(messages));
  }, [messages]);

  const startNewChat = () => {
      setMessages([{ role: 'model', text: 'Context cleared. Ready for next task.', timestamp: new Date() }]);
      setActiveVisual('NONE');
      localStorage.removeItem('pc_chat_history');
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, isImmersive]);

  // --- DATA COMPUTATION FOR VISUALS ---
  const visualData = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const present = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Present').length;
      const late = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Late').length;
      const absent = employees.filter(e => e.status === 'Active').length - (present + late);
      
      const totalSalary = employees.reduce((acc, curr) => acc + curr.baseSalary, 0);
      const estEPF = totalSalary * 0.13;
      const estOT = totalSalary * 0.08; // Mock OT

      let tableHeaders: string[] = [];
      let tableRows: any[] = [];
      let tableTitle = "";

      if (activeVisual === 'STAFF_TABLE' || activeVisual === 'ATTENDANCE_CHART') {
          const lateRecords = attendanceRecords.filter(r => r.status === 'Late' || r.status === 'Absent').slice(0, 10);
          tableTitle = "Risk Audit: Late/Absent";
          tableHeaders = ["Name", "Status", "Time", "Risk Score"];
          tableRows = lateRecords.map(r => {
              const emp = employees.find(e => e.id === r.employeeId);
              return [emp?.name || 'Unknown', r.status, r.checkIn || 'N/A', `${r.riskScore}%`];
          });
      } else if (activeVisual === 'PAYROLL_CHART') {
          tableTitle = "Top OT Earners";
          tableHeaders = ["Name", "Base", "OT Hours", "Est. Payout"];
          tableRows = employees.slice(0, 5).map(e => [e.name, `RM ${e.baseSalary}`, `${(Math.random() * 10).toFixed(1)}h`, `RM ${(e.baseSalary * 1.1).toFixed(0)}`]);
      }

      return { 
          attendanceChart: [
              { name: 'On Time', value: present },
              { name: 'Late', value: late },
              { name: 'Absent', value: absent }
          ],
          payrollChart: [
              { name: 'Basic Wages', amount: totalSalary },
              { name: 'EPF (13%)', amount: estEPF },
              { name: 'Overtime', amount: estOT } 
          ],
          tableData: { title: tableTitle, headers: tableHeaders, rows: tableRows },
          totalStaff: employees.length 
      };
  }, [attendanceRecords, employees, activeVisual]);

  // --- TEXT CHAT HANDLER ---
  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    if (!currentUser) return;

    const response = await chatWithHRAssistant(textToSend, history, {
        currentUser, employees, attendanceRecords, payrollSettings,
        companyProfile, documents, shifts, userPreferences
    });
    
    setMessages(prev => [...prev, { role: 'model', text: response.text, timestamp: new Date() }]);
    
    if (response.intent) {
        setActiveVisual(response.intent as any);
        if (!isImmersive) setIsImmersive(true); 
    }

    if (response.navigation) {
        addNotification(`Navigating to ${response.navigation}...`, 'info');
        navigate(response.navigation);
        setIsImmersive(false);
        if (isOpen) setIsOpen(false);
    }

    setIsLoading(false);
  };

  // --- RENDER VISUALS ---
  const renderDataDeck = () => {
      if (activeVisual === 'NONE') {
          return (
              <div className="flex flex-col items-center justify-center h-full opacity-30 text-center p-8">
                  <Command className="w-24 h-24 mb-6 text-white" strokeWidth={1} />
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest">Agent Ready</h3>
                  <p className="text-sm text-gray-400 mt-2">Awaiting complex data query...</p>
              </div>
          );
      }

      if (activeVisual === 'POLICY_DOC') {
          return (
              <div className="p-8 space-y-6 animate-in slide-in-from-right duration-500">
                  <div className="flex items-center gap-3 mb-4 text-pink-500">
                      <FileText className="w-8 h-8" />
                      <h3 className="text-xl font-black text-white uppercase">Generated Document</h3>
                  </div>
                  <div className="bg-[#1a1a1a] border-l-4 border-pink-500 p-6 rounded-r-xl shadow-lg">
                      <h4 className="text-lg font-bold text-white mb-2">Legal Draft</h4>
                      <p className="text-gray-300 leading-relaxed font-serif text-sm whitespace-pre-wrap">
                          {`TO: ALL STAFF\nFROM: HR DEPT\n\nRE: COMPLIANCE NOTICE\n\nThis memo serves as a formal reminder regarding Section 60A of the Employment Act 1955. Please be advised that work hours must not exceed 45 hours per week without approved OT.\n\nStrict adherence is required immediately.`}
                      </p>
                  </div>
              </div>
          );
      }

      if (activeVisual === 'STAFF_TABLE') {
          return (
              <div className="p-6 space-y-4 animate-in slide-in-from-right duration-500 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-2 text-blue-400">
                      <TableIcon className="w-6 h-6" />
                      <h3 className="text-lg font-black text-white uppercase">{visualData.tableData.title}</h3>
                  </div>
                  <div className="flex-1 overflow-auto border border-white/10 rounded-xl bg-[#111]">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-[#222] text-gray-400 sticky top-0 font-bold uppercase text-xs">
                              <tr>
                                  {visualData.tableData.headers.map((h, i) => <th key={i} className="p-3">{h}</th>)}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-gray-300">
                              {visualData.tableData.rows.map((row, i) => (
                                  <tr key={i} className="hover:bg-white/5">
                                      {row.map((cell: any, j: number) => (
                                          <td key={j} className="p-3 font-mono">{cell}</td>
                                      ))}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          );
      }

      const isPayroll = activeVisual === 'PAYROLL_CHART';
      const chartTitle = isPayroll ? 'Financial Forecast' : 'Attendance Audit';
      const Icon = isPayroll ? DollarSign : Activity;

      return (
          <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${isPayroll ? 'bg-green-600' : 'bg-red-600'} rounded-lg flex items-center justify-center text-white`}>
                      <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase">{chartTitle}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/10">
                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{isPayroll ? 'Proj. Cost' : 'Risk Factor'}</p>
                      <p className="text-2xl font-black text-white">{isPayroll ? 'RM ' + (visualData.payrollChart.reduce((a,b)=>a+b.amount,0)/1000).toFixed(1) + 'k' : 'High'}</p>
                  </div>
                  <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/10">
                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{isPayroll ? 'Var. Ratio' : 'Absent Rate'}</p>
                      <p className={`text-2xl font-black ${isPayroll ? 'text-green-500' : 'text-red-500'}`}>
                          {isPayroll ? '18%' : Math.round((visualData.attendanceChart[2].value / visualData.totalStaff) * 100) + '%'}
                      </p>
                  </div>
              </div>
              
              <div className="h-64 w-full border border-white/5 rounded-xl bg-black/20 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                      {isPayroll ? (
                          <BarChart data={visualData.payrollChart} layout="vertical">
                              <XAxis type="number" hide />
                              <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333'}} cursor={{fill:'transparent'}} />
                              <Bar dataKey="amount" fill="#10B981" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: '#fff', fontSize: 10 }} />
                          </BarChart>
                      ) : (
                          <PieChart>
                              <Pie data={visualData.attendanceChart} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {visualData.attendanceChart.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                              </Pie>
                              <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333'}} />
                          </PieChart>
                      )}
                  </ResponsiveContainer>
              </div>
              
              {/* Contextual Table below chart */}
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Key Drivers</h4>
                  <div className="space-y-2 text-xs">
                      {visualData.tableData.rows?.slice(0,3).map((r, i) => (
                          <div key={i} className="flex justify-between text-gray-300 border-b border-white/5 pb-1">
                              <span>{r[0]}</span>
                              <span className="font-mono">{r[2] || r[3]}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <>
      {!isOpen && !isImmersive && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 bg-[#ef4444] text-white w-16 h-16 rounded-2xl border-2 border-white/20 shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] flex items-center justify-center hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.2)] transition-all z-50 group">
          <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && !isImmersive && (
        <div className="fixed bottom-8 right-8 w-96 h-[700px] bg-[#121212] border-2 border-white/20 shadow-2xl rounded-3xl flex flex-col z-50 overflow-hidden animate-in zoom-in-95 origin-bottom-right duration-200">
          <div className="bg-[#ef4444] p-4 border-b-2 border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h3 className="font-black text-white text-lg tracking-wide uppercase">AI AGENT</h3>
            </div>
            <div className="flex gap-1">
                <button onClick={startNewChat} className="text-white/80 hover:text-white p-1 rounded" title="New Chat"><Plus className="w-5 h-5"/></button>
                <button onClick={() => setIsImmersive(true)} className="text-white/80 hover:text-white p-1 rounded"><Maximize2 className="w-5 h-5"/></button>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded"><X className="w-6 h-6"/></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] space-y-4" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm border ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#1a1a1a] text-gray-200 border-white/10'}`}>
                  {/* POP-OVER MODE: Both AI (bg-1a1a1a) and User (bg-blue-600) have dark backgrounds. Pass true. */}
                  <MessageRenderer text={msg.text} isDarkBg={true} />
                </div>
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-[#1a1a1a] p-3 rounded-2xl text-xs text-gray-400 animate-pulse">Running analysis...</div></div>}
          </div>

          <div className="p-4 bg-[#121212] border-t border-white/10 flex flex-col gap-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Power Scenarios</p>
            <div className="grid grid-cols-1 gap-2 mb-2">
                {POWER_PROMPTS.map((pp, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => handleSend(pp.prompt)} 
                        className="text-left px-3 py-2 rounded-lg bg-[#222] border border-white/5 hover:bg-[#333] hover:border-blue-500/50 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-300 group-hover:text-white">{pp.label}</span>
                            <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-blue-500"/>
                        </div>
                    </button>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask HR..." className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                <button onClick={() => handleSend()} disabled={isLoading} className="bg-white text-black p-2.5 rounded-xl hover:bg-gray-200"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Immersive Mode */}
      {isImmersive && (
          <div className="fixed inset-0 z-[200] bg-black text-white font-sans flex animate-in zoom-in-95 duration-300">
              {/* Sidebar */}
              <div className="w-72 bg-[#0a0a0a] border-r border-white/10 flex flex-col p-6 hidden md:flex">
                  <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center text-black shadow-[4px_4px_0_0_#fff]"><Bot className="w-6 h-6"/></div>
                      <h2 className="font-black text-xl uppercase tracking-tighter">Agent<br/>Console</h2>
                  </div>
                  <button onClick={startNewChat} className="w-full flex items-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold mb-6 transition-all shadow-lg"><Plus className="w-4 h-4"/> New Session</button>
                  
                  <div className="space-y-2 flex-1 overflow-y-auto">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Execute Scenario</h4>
                      {POWER_PROMPTS.map((pp, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => handleSend(pp.prompt)} 
                            className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                            <span className="text-xs font-bold text-gray-300 group-hover:text-white block">{pp.label}</span>
                        </button>
                      ))}
                  </div>
                  
                  <button onClick={() => setIsImmersive(false)} className="mt-auto flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold"><Minimize2 className="w-4 h-4"/> Exit Fullscreen</button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col bg-black relative">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 relative z-10" ref={scrollRef}>
                      {/* START STATE: Prompt Capsules */}
                      {messages.length === 1 && (
                          <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-10 fade-in duration-700">
                              {POWER_PROMPTS.map((pp, idx) => (
                                  <button
                                      key={idx}
                                      onClick={() => handleSend(pp.prompt)}
                                      className="group p-6 bg-[#1a1a1a] border border-white/10 hover:border-blue-500 hover:bg-[#222] rounded-2xl text-left transition-all hover:scale-[1.02] shadow-xl"
                                  >
                                      <div className="flex items-center gap-4 mb-2">
                                          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                              <pp.icon className="w-5 h-5" />
                                          </div>
                                          <h4 className="font-black text-lg text-white uppercase">{pp.label}</h4>
                                      </div>
                                      <p className="text-sm text-gray-400 group-hover:text-gray-300">{pp.desc}</p>
                                  </button>
                              ))}
                          </div>
                      )}

                      {/* Message Loop */}
                      {messages.map((msg, idx) => (
                          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${msg.role === 'user' ? 'bg-white border-gray-200 text-black' : 'bg-[#FFD700] border-yellow-600 text-black'}`}>
                                  {msg.role === 'user' ? <Users className="w-5 h-5"/> : <Bot className="w-5 h-5"/>}
                              </div>
                              <div className={`max-w-2xl p-6 rounded-3xl text-lg leading-relaxed shadow-lg border-2 ${msg.role === 'user' ? 'bg-[#1a1a1a] text-white border-white/20' : 'bg-white text-black border-gray-200'}`}>
                                  {/* IMMERSIVE MODE: User is dark (bg-1a1a1a), AI is light (bg-white). Dynamic logic needed. */}
                                  <MessageRenderer text={msg.text} isDarkBg={msg.role === 'user'} />
                              </div>
                          </div>
                      ))}
                      {isLoading && <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center shrink-0 animate-pulse"><Bot className="w-5 h-5 text-black"/></div><div className="bg-white/10 p-4 rounded-xl text-gray-400 text-sm">Processing...</div></div>}
                  </div>

                  <div className="p-6 bg-black border-t border-white/10 relative z-20">
                      <div className="flex gap-4 max-w-4xl mx-auto">
                          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Command the agent..." className="flex-1 bg-[#1a1a1a] border-2 border-white/20 rounded-2xl px-6 py-4 text-xl text-white focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all placeholder-gray-600" autoFocus />
                          <button onClick={() => handleSend()} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl transition-all shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] active:translate-y-1 active:shadow-none border-2 border-blue-400"><Send className="w-6 h-6" /></button>
                      </div>
                  </div>
              </div>

              {/* Data Deck */}
              <div className="w-[450px] bg-[#050505] border-l border-white/10 flex flex-col hidden lg:flex transition-all">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
                      <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Live Visual Deck</h3>
                      <div className="flex gap-2"><div className={`w-3 h-3 rounded-full ${activeVisual !== 'NONE' ? 'bg-green-500 animate-pulse' : 'bg-gray-800'}`}></div></div>
                  </div>
                  <div className="flex-1 overflow-y-auto relative">{renderDataDeck()}</div>
                  <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex justify-between items-center text-xs font-mono">
                      <span className="text-gray-500">POWERED BY GEMINI 2.5</span>
                      <span className="text-[#FFD700] font-bold">MADE BY W3JDEV</span>
                  </div>
              </div>
              <button onClick={() => setIsImmersive(false)} className="absolute top-4 right-4 md:hidden bg-red-600 text-white p-2 rounded-full z-50"><X className="w-6 h-6"/></button>
          </div>
      )}
    </>
  );
};

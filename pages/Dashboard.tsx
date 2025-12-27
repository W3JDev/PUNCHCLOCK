
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoModal, NeoSelect } from '../components/NeoComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { 
  Users, Clock, AlertTriangle, TrendingUp, ArrowRight, Download, 
  FileText, Briefcase, DollarSign, Calendar, Check, X, Plus, Play,
  Activity, UploadCloud, Megaphone, Bell, ClipboardList, Info, CheckCircle, XCircle,
  Plane, Banknote, CalendarDays, User, HelpCircle, FileCheck, LogIn, Filter, GripVertical, RotateCcw, LayoutTemplate, ShieldCheck, Eye, EyeOff, ScanFace
} from 'lucide-react';
import { analyzeAttendancePatterns } from '../services/geminiService';
import { useGlobal } from '../context/GlobalContext';
import { Link, useNavigate } from 'react-router-dom';

const COLORS = ['#3B82F6', '#FFD700', '#EF4444', '#10B981'];

type WidgetType = 'kpi' | 'weekly-trend' | 'team-pulse' | 'manager-actions' | 'quick-launch' | 'bulletin' | 'security-pass';

interface DashboardWidget {
    id: string;
    type: WidgetType;
    colSpan: 1 | 2 | 3 | 4;
    minHeight: string;
}

const DEFAULT_LAYOUT: DashboardWidget[] = [
    { id: '1', type: 'kpi', colSpan: 4, minHeight: 'auto' },
    { id: '2', type: 'weekly-trend', colSpan: 2, minHeight: '400px' },
    { id: '4', type: 'manager-actions', colSpan: 2, minHeight: '400px' },
    { id: '3', type: 'team-pulse', colSpan: 1, minHeight: '350px' },
    { id: '6', type: 'bulletin', colSpan: 2, minHeight: '350px' },
    { id: '5', type: 'quick-launch', colSpan: 1, minHeight: '350px' },
    { id: '7', type: 'security-pass', colSpan: 1, minHeight: '350px' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border-2 border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
          <p className="font-black text-white mb-2 uppercase text-[10px] tracking-[0.2em] border-b border-white/10 pb-2">{label}</p>
          <div className="space-y-2">
              {payload.map((p: any) => (
                <div key={p.name} className="flex items-center justify-between gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: p.color, color: p.color }}></div>
                        <span className="text-gray-400 capitalize">{p.name}</span>
                    </div>
                    <span className="text-white font-mono">{p.value}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
};

export const Dashboard: React.FC = () => {
  const { currentUser, addNotification, attendanceRecords, employees, leaveRequests, updateLeaveRequest, generalRequests, updateGeneralRequestStatus, addGeneralRequest, announcements, companyProfile } = useGlobal();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<{riskLevel: string, suggestion: string} | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const [layout, setLayout] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState<'Attendance' | 'Leave' | 'Finance'>('Attendance');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [approvalTab, setApprovalTab] = useState<'leaves' | 'claims'>('leaves');
  
  const [requestForm, setRequestForm] = useState({ date: '', details: '', attachment: '' });

  useEffect(() => {
      const savedLayout = localStorage.getItem('pc_dashboard_layout_v2');
      if (savedLayout) {
          try { setLayout(JSON.parse(savedLayout)); } catch(e) { console.error(e); }
      }
  }, []);

  useEffect(() => {
      localStorage.setItem('pc_dashboard_layout_v2', JSON.stringify(layout));
  }, [layout]);

  const handleResetLayout = () => {
      setLayout(DEFAULT_LAYOUT);
      addNotification("Dashboard layout reset to default.", "info");
      setIsEditingLayout(false);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
      dragItem.current = position;
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
      dragOverItem.current = position;
      e.preventDefault();
      if (dragItem.current !== null && dragItem.current !== dragOverItem.current) {
          const newLayout = [...layout];
          const draggedItemContent = newLayout[dragItem.current];
          newLayout.splice(dragItem.current, 1);
          newLayout.splice(dragOverItem.current, 0, draggedItemContent);
          dragItem.current = dragOverItem.current;
          setLayout(newLayout);
      }
  };

  const handleDragEnd = () => {
      dragItem.current = null;
      dragOverItem.current = null;
  };

  const emp = employees.find(e => e.id === currentUser.id);
  const showOnboardingNudge = emp && (emp.onboardingStep || 0) < 4;

  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Present').length;
    const lateToday = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Late').length;
    const activeStaff = employees.filter(e => e.status === 'Active').length;
    const absentToday = activeStaff - (presentToday + lateToday);

    const chartData = [];
    for(let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const recs = attendanceRecords.filter(r => r.date === dStr);
      chartData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        present: recs.filter(r => r.status === 'Present').length,
        late: recs.filter(r => r.status === 'Late').length,
      });
    }

    return { 
        presentToday, lateToday, absentToday, chartData, 
        pie: [
            { name: 'On Time', value: presentToday },
            { name: 'Late', value: lateToday },
            { name: 'Absent', value: Math.max(0, absentToday) },
        ] 
    };
  }, [attendanceRecords, employees]);

  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
  const pendingClaims = generalRequests.filter(r => r.status === 'Pending' && r.type === 'Claim');

  const fetchAiInsight = async () => {
    setLoadingInsight(true);
    const result = await analyzeAttendancePatterns(dashboardStats.chartData);
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleSubmitRequest = () => {
      if (!requestForm.date || !requestForm.details) return addNotification("All fields required", "error");
      addGeneralRequest({
        id: Math.random().toString(36).substr(2, 9),
        employeeId: currentUser.id, employeeName: currentUser.name,
        type: requestCategory === 'Attendance' ? 'Missing Punch' : requestCategory === 'Finance' ? 'Claim' : 'General',
        details: requestForm.details, date: requestForm.date, status: 'Pending'
      });
      addNotification("Request Submitted", "success");
      setIsRequestModalOpen(false);
      setRequestForm({ date: '', details: '', attachment: '' });
  };

  const quickActions = [
      { id: 'clock_in', label: 'Terminal', icon: LogIn, color: 'bg-green-600', action: () => navigate('/attendance') },
      { id: 'leave', label: 'Apply Leave', icon: Plane, color: 'bg-blue-600', action: () => { setRequestCategory('Leave'); setIsRequestModalOpen(true); } },
      { id: 'claim', label: 'Submit Claim', icon: Banknote, color: 'bg-yellow-500', action: () => { setRequestCategory('Finance'); setIsRequestModalOpen(true); } },
      { id: 'payslip', label: 'Payslip', icon: FileCheck, color: 'bg-purple-600', action: () => navigate('/payroll') },
  ];

  const renderWidget = (type: WidgetType) => {
      switch(type) {
          case 'kpi':
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 h-full w-full">
                    <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-white/20 shadow-2xl flex flex-col justify-between p-8 transition-all duration-500 hover:scale-[1.02] backdrop-blur-xl min-h-[220px]">
                        <div className="flex justify-between items-start"><p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">Identity Verified</p><Users className="w-5 h-5 text-blue-500" /></div>
                        <div><h3 className="text-6xl font-black text-white tracking-tighter tabular-nums mb-2">{dashboardStats.presentToday}</h3><NeoBadge variant="success">Present</NeoBadge></div>
                    </div>
                    <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-white/20 shadow-2xl flex flex-col justify-between p-8 transition-all duration-500 hover:scale-[1.02] backdrop-blur-xl min-h-[220px]">
                        <div className="flex justify-between items-start"><p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em]">Behavior Anomaly</p><Clock className="w-5 h-5 text-yellow-500" /></div>
                        <div><h3 className="text-6xl font-black text-white tracking-tighter tabular-nums mb-2">{dashboardStats.lateToday}</h3><NeoBadge variant="warning">Late Arrival</NeoBadge></div>
                    </div>
                    <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-red-500/10 to-red-500/5 border border-white/20 shadow-2xl flex flex-col justify-between p-8 transition-all duration-500 hover:scale-[1.02] backdrop-blur-xl min-h-[220px]">
                        <div className="flex justify-between items-start"><p className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em]">Compliance Gap</p><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                        <div><h3 className="text-6xl font-black text-white tracking-tighter tabular-nums mb-2">{dashboardStats.absentToday}</h3><NeoBadge variant="danger">Absent / MIA</NeoBadge></div>
                    </div>
                </div>
              );
          case 'weekly-trend':
              return (
                <NeoCard title="Forensic Trend" className="h-full border-l-4 border-blue-500">
                    <div className="flex-1 w-full pt-4 min-h-[280px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={dashboardStats.chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" tick={{fill: '#666', fontSize: 10, fontWeight: '900'}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fill: '#666', fontSize: 10, fontWeight: '900'}} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="present" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="late" fill="#FFD700" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </NeoCard>
              );
          case 'manager-actions':
              return (
                  <NeoCard title="Operational Queue" className="h-full border-l-4 border-pink-500 flex flex-col">
                      <div className="flex gap-2 border-b border-white/10 pb-4 mb-4 shrink-0 overflow-x-auto no-scrollbar">
                          {['leaves', 'claims'].map(tab => (
                              <button key={tab} onClick={() => setApprovalTab(tab as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${approvalTab === tab ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                                  {tab} ({tab === 'leaves' ? pendingLeaves.length : pendingClaims.length})
                              </button>
                          ))}
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[250px]">
                          {approvalTab === 'leaves' && pendingLeaves.map(l => (
                              <div key={l.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">{l.name.charAt(0)}</div><div><p className="font-bold text-xs">{l.name}</p><span className="text-[9px] text-blue-400 uppercase font-black">{l.type}</span></div></div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => updateLeaveRequest(l.id, 'Approved')} className="p-2 bg-green-500/20 text-green-500 rounded-lg"><Check className="w-4 h-4"/></button><button onClick={() => updateLeaveRequest(l.id, 'Rejected')} className="p-2 bg-red-500/20 text-red-500 rounded-lg"><X className="w-4 h-4"/></button></div>
                              </div>
                          ))}
                          {approvalTab === 'leaves' && pendingLeaves.length === 0 && <div className="h-full flex items-center justify-center opacity-20"><p className="text-[10px] font-black uppercase tracking-widest">Queue Empty</p></div>}
                      </div>
                  </NeoCard>
              );
          case 'team-pulse':
              return (
                <NeoCard title="Pulse" className="h-full border-l-4 border-green-500">
                    <div className="flex-1 relative flex items-center justify-center pt-2 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart><Pie data={dashboardStats.pie} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">{dashboardStats.pie.map((e, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4"><p className="text-4xl font-black text-white tabular-nums leading-none">{employees.length}</p><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Staff</p></div>
                    </div>
                </NeoCard>
              );
          case 'bulletin':
              return (
                 <NeoCard title="Bulletin" className="h-full border-l-4 border-red-500">
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 min-h-[250px]">
                       {announcements.map(ann => (
                          <div key={ann.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/30 transition-all">
                             <div className="flex justify-between items-start mb-2"><h4 className="font-black text-[10px] uppercase text-blue-400">{ann.title}</h4><span className="text-[8px] text-gray-600 font-black">{ann.date}</span></div>
                             <p className="text-[11px] text-gray-400 leading-tight line-clamp-2">{ann.content}</p>
                          </div>
                       ))}
                       {announcements.length === 0 && <div className="h-full flex items-center justify-center opacity-20"><p className="text-[10px] font-black uppercase tracking-widest">No Notices</p></div>}
                    </div>
                 </NeoCard>
              );
          case 'quick-launch':
              return (
                 <NeoCard title="Launch" className="h-full">
                     <div className="grid grid-cols-2 gap-3 h-full min-h-[250px]">
                        {quickActions.map(a => (
                            <button key={a.id} onClick={a.action} className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500 transition-all group aspect-square">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${a.color} shadow-lg group-hover:scale-110 transition-transform`}><a.icon className="w-5 h-5 text-white" /></div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white text-center leading-none">{a.label}</span>
                            </button>
                        ))}
                     </div>
                 </NeoCard>
              );
          case 'security-pass':
              return (
                  <NeoCard title="Sec-Identity" className="h-full border-l-4 border-yellow-500 bg-black/40">
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-4 min-h-[250px]">
                          <div className={`p-6 rounded-3xl border-2 ${emp?.faceRegistered ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} shadow-glow transition-all`}>
                               {emp?.faceRegistered ? <ScanFace className="w-12 h-12 text-green-500" /> : <ShieldCheck className="w-12 h-12 text-red-500" />}
                          </div>
                          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4"><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Internal PIN</span><div className="flex items-center justify-center gap-4"><span className="text-2xl font-black text-white font-mono tracking-widest">{showPin ? emp?.pin : '••••••'}</span><button onClick={() => setShowPin(!showPin)} className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white">{showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                      </div>
                  </NeoCard>
              );
          default: return null;
      }
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 bg-black/40 border border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[150px] pointer-events-none"></div>
        <div className="relative z-10"><h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">COMMAND<br/><span className="text-blue-500">DECK.</span></h2><p className="text-xs font-black text-gray-500 uppercase tracking-[0.5em]">{new Date().toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})}</p></div>
        <div className="flex flex-wrap gap-4 relative z-10">
           <NeoButton variant="ghost" className="border-white/10 hover:bg-white/5 py-4 px-8" onClick={() => setIsEditingLayout(!isEditingLayout)}>{isEditingLayout ? 'Lock System' : 'Modify Grid'}</NeoButton>
           {currentUser.role !== 'Staff' && !isEditingLayout && (<NeoButton variant="secondary" onClick={fetchAiInsight} className="py-4 px-8">{loadingInsight ? 'Auditing...' : 'Agent Audit'}</NeoButton>)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 auto-rows-min">
          {layout.map((widget, index) => {
              if (currentUser.role === 'Staff' && (widget.type === 'manager-actions' || widget.type === 'team-pulse')) return null;
              if (currentUser.role !== 'Staff' && widget.type === 'security-pass') return null;
              const colClass = widget.colSpan === 4 ? 'md:col-span-2 xl:col-span-4' : widget.colSpan === 2 ? 'md:col-span-2 xl:col-span-2' : 'md:col-span-1 xl:col-span-1';
              return (
                  <div key={widget.id} draggable={isEditingLayout} onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} 
                       className={`${colClass} transition-all duration-300 relative ${isEditingLayout ? 'cursor-move ring-2 ring-blue-500 ring-offset-8 ring-offset-black rounded-[2.5rem] opacity-60' : ''}`} style={{ minHeight: widget.minHeight }}>
                      {isEditingLayout && (<div className="absolute -top-4 -right-4 z-50 bg-blue-500 text-white p-2 rounded-xl border-4 border-black animate-bounce"><GripVertical className="w-5 h-5" /></div>)}
                      {renderWidget(widget.type)}
                  </div>
              );
          })}
      </div>

      <NeoModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Operational Intent">
           <div className="space-y-8"><div className="flex gap-2 p-1.5 bg-black rounded-2xl border border-white/10">{['Attendance', 'Leave', 'Finance'].map(cat => (<button key={cat} onClick={() => setRequestCategory(cat as any)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${requestCategory === cat ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>{cat}</button>))}</div><div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block px-1">Effective Date</label><NeoInput type="date" value={requestForm.date} onChange={e => setRequestForm({...requestForm, date: e.target.value})} className="rounded-2xl" /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block px-1">Context / Amount</label><NeoInput value={requestForm.details} onChange={e => setRequestForm({...requestForm, details: e.target.value})} placeholder="Describe or enter RM..." className="rounded-2xl"/></div></div><NeoButton onClick={handleSubmitRequest} className="w-full py-5 rounded-2xl bg-blue-600">Transmit to HQ</NeoButton></div>
      </NeoModal>
    </div>
  );
};

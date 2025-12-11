
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NeoCard, NeoButton, NeoBadge, NeoInput, NeoModal, NeoSelect } from '../components/NeoComponents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Users, Clock, AlertTriangle, TrendingUp, ArrowRight, Download, 
  FileText, Briefcase, DollarSign, Calendar, Check, X, Plus, Play,
  Activity, UploadCloud, Megaphone, Bell, ClipboardList, Info, CheckCircle, XCircle,
  Plane, Banknote, CalendarDays, User, HelpCircle, FileCheck, LogIn, Filter, GripVertical, RotateCcw, LayoutTemplate
} from 'lucide-react';
import { analyzeAttendancePatterns } from '../services/geminiService';
import { useGlobal } from '../context/GlobalContext';
import { Link, useNavigate } from 'react-router-dom';

// High Contrast Colors
const COLORS = ['#3B82F6', '#FFD700', '#EF4444'];

// --- WIDGET TYPES & DEFAULTS ---
type WidgetType = 'kpi' | 'weekly-trend' | 'team-pulse' | 'manager-actions' | 'quick-launch' | 'bulletin';

interface DashboardWidget {
    id: string;
    type: WidgetType;
    colSpan: 1 | 2 | 3 | 4;
}

const DEFAULT_LAYOUT: DashboardWidget[] = [
    { id: '1', type: 'kpi', colSpan: 3 },
    { id: '2', type: 'team-pulse', colSpan: 1 },
    { id: '3', type: 'weekly-trend', colSpan: 2 },
    { id: '4', type: 'manager-actions', colSpan: 2 },
    { id: '5', type: 'quick-launch', colSpan: 1 },
    { id: '6', type: 'bulletin', colSpan: 3 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#050505]/95 border border-gray-200 dark:border-white/20 p-4 rounded-xl shadow-xl dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <p className="font-black text-black dark:text-white mb-2 uppercase text-xs tracking-wider">{label}</p>
          <div className="space-y-1">
              {payload.map((p: any) => (
                <div key={p.name} className="flex items-center gap-2 text-xs font-bold">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                    <span className="text-gray-500 dark:text-gray-300 capitalize">{p.name}:</span>
                    <span className="text-black dark:text-white">{p.value}</span>
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
  
  // Layout State
  const [layout, setLayout] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState<'Attendance' | 'Leave' | 'Finance'>('Attendance');
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  
  // Manager Approval Tab
  const [approvalTab, setApprovalTab] = useState<'leaves' | 'claims' | 'corrections'>('leaves');
  
  const [requestForm, setRequestForm] = useState({
    date: '', details: '', attachment: ''
  });

  // Load Layout Preference
  useEffect(() => {
      const savedLayout = localStorage.getItem('pc_dashboard_layout');
      if (savedLayout) {
          try {
              setLayout(JSON.parse(savedLayout));
          } catch(e) { console.error(e); }
      }
  }, []);

  // Save Layout Preference
  useEffect(() => {
      localStorage.setItem('pc_dashboard_layout', JSON.stringify(layout));
  }, [layout]);

  const handleResetLayout = () => {
      setLayout(DEFAULT_LAYOUT);
      addNotification("Dashboard layout reset to default.", "info");
      setIsEditingLayout(false);
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
      dragItem.current = position;
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
      dragOverItem.current = position;
      e.preventDefault();
      
      // Real-time swapping visual effect
      if (dragItem.current !== null && dragItem.current !== dragOverItem.current) {
          const newLayout = [...layout];
          const draggedItemContent = newLayout[dragItem.current];
          newLayout.splice(dragItem.current, 1);
          newLayout.splice(dragOverItem.current, 0, draggedItemContent);
          dragItem.current = dragOverItem.current; // Update drag index to new position
          setLayout(newLayout);
      }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      dragItem.current = null;
      dragOverItem.current = null;
  };

  const emp = employees.find(e => e.id === currentUser.id);
  const showOnboardingNudge = emp && (emp.onboardingStep || 0) < 4;

  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Present').length;
    const lateToday = attendanceRecords.filter(r => r.date === todayStr && r.status === 'Late').length;
    const absentToday = employees.filter(e => e.status === 'Active').length - (presentToday + lateToday);

    const chartData = [];
    for(let i=4; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const recs = attendanceRecords.filter(r => r.date === dStr);
      chartData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        present: recs.filter(r => r.status === 'Present').length,
        late: recs.filter(r => r.status === 'Late').length,
      });
    }

    const pie = [
      { name: 'On Time', value: attendanceRecords.filter(r => r.status === 'Present').length },
      { name: 'Late', value: attendanceRecords.filter(r => r.status === 'Late').length },
      { name: 'Absent', value: attendanceRecords.filter(r => r.status === 'Absent').length },
    ];
    
    return { presentToday, lateToday, absentToday, chartData, pie };
  }, [attendanceRecords, employees]);

  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
  const pendingClaims = generalRequests.filter(r => r.status === 'Pending' && r.type === 'Claim');
  const pendingCorrections = generalRequests.filter(r => r.status === 'Pending' && r.type === 'Missing Punch');

  const fetchAiInsight = async () => {
    setLoadingInsight(true);
    const result = await analyzeAttendancePatterns(dashboardStats.chartData);
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleSubmitRequest = () => {
      if (!requestForm.date || !requestForm.details) return addNotification("All fields required", "error");
      
      let typeName: string = requestCategory;
      if (requestCategory === 'Leave') {
          const policy = companyProfile.leavePolicies?.find(p => p.id === selectedPolicyId);
          if (!policy) return addNotification("Please select a leave type", "error");
          typeName = policy.name;
      } 

      let reqType = typeName;
      if (requestCategory === 'Attendance') reqType = 'Missing Punch';
      if (requestCategory === 'Finance') reqType = 'Claim';

      addGeneralRequest({
        id: Math.random().toString(36).substr(2, 9),
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        type: reqType,
        details: requestForm.details,
        date: requestForm.date,
        status: 'Pending',
        policyId: selectedPolicyId
      });
      
      addNotification(`${reqType} Request Submitted`, "success");
      setIsRequestModalOpen(false);
      setRequestForm({ date: '', details: '', attachment: '' });
      setSelectedPolicyId('');
  };

  const quickActions = [
      { id: 'clock_in', label: 'Clock In/Out', icon: LogIn, color: 'bg-green-600', action: () => navigate('/attendance') },
      { id: 'leave', label: 'Apply Leave', icon: Plane, color: 'bg-blue-600', action: () => { setRequestCategory('Leave'); setIsRequestModalOpen(true); } },
      { id: 'claim', label: 'Submit Claim', icon: Banknote, color: 'bg-yellow-500', action: () => { setRequestCategory('Finance'); setIsRequestModalOpen(true); } },
      { id: 'payslip', label: 'My Payslips', icon: FileCheck, color: 'bg-purple-600', action: () => navigate('/payroll') },
      { id: 'roster', label: 'My Roster', icon: CalendarDays, color: 'bg-pink-600', action: () => navigate('/shifts') },
      { id: 'profile', label: 'Update Profile', icon: User, color: 'bg-indigo-600', action: () => navigate('/employees') },
      { id: 'documents', label: 'Documents', icon: FileText, color: 'bg-teal-600', action: () => navigate('/documents') },
      { id: 'help', label: 'Help & Guide', icon: HelpCircle, color: 'bg-gray-600', action: () => navigate('/help') },
  ];

  // --- RENDER WIDGET CONTENT ---
  const renderWidget = (type: WidgetType) => {
      switch(type) {
          case 'kpi':
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                    {/* KPI Cards: Refined 3D Crystal Style - Responsive for Day/Dark Mode */}
                    <div className="
                        relative group overflow-hidden rounded-3xl 
                        bg-white dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:to-black
                        border border-gray-200 dark:border-white/20
                        shadow-lg dark:shadow-[10px_10px_20px_#000,-2px_-2px_6px_rgba(255,255,255,0.1)]
                        flex flex-col justify-between p-6 min-h-[220px]
                        transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl
                        backdrop-blur-xl
                    ">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-black uppercase tracking-[0.2em]">Present</p>
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3B82F6] animate-pulse"></div>
                        </div>
                        <div className="z-10 mt-auto">
                            <h3 className="text-7xl font-black text-black dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-2xl">{dashboardStats.presentToday}</h3>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 mt-4 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                <div className="h-full bg-blue-500 shadow-[0_0_10px_#3B82F6]" style={{width: `${(dashboardStats.presentToday / employees.length) * 100}%`}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="
                        relative group overflow-hidden rounded-3xl 
                        bg-white dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:to-black
                        border border-gray-200 dark:border-white/20
                        shadow-lg dark:shadow-[10px_10px_20px_#000,-2px_-2px_6px_rgba(255,255,255,0.1)]
                        flex flex-col justify-between p-6 min-h-[220px]
                        transition-all duration-300 hover:border-yellow-500/50 hover:shadow-xl
                        backdrop-blur-xl
                    ">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-yellow-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-black uppercase tracking-[0.2em]">Late</p>
                            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_#EAB308] animate-pulse"></div>
                        </div>
                        <div className="z-10 mt-auto">
                            <h3 className="text-7xl font-black text-black dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-2xl">{dashboardStats.lateToday}</h3>
                            <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 mt-2 flex items-center gap-1 bg-yellow-100 dark:bg-yellow-500/10 w-fit px-2 py-1 rounded border border-yellow-200 dark:border-yellow-500/20">
                                <AlertTriangle className="w-4 h-4" /> Attention Needed
                            </p>
                        </div>
                    </div>

                    <div className="
                        relative group overflow-hidden rounded-3xl 
                        bg-white dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:to-black
                        border border-gray-200 dark:border-white/20
                        shadow-lg dark:shadow-[10px_10px_20px_#000,-2px_-2px_6px_rgba(255,255,255,0.1)]
                        flex flex-col justify-between p-6 min-h-[220px]
                        transition-all duration-300 hover:border-red-500/50 hover:shadow-xl
                        backdrop-blur-xl
                    ">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-red-500/20 transition-colors"></div>
                        <div className="flex justify-between items-start z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-black uppercase tracking-[0.2em]">Absent</p>
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#EF4444] animate-pulse"></div>
                        </div>
                        <div className="z-10 mt-auto">
                            <h3 className="text-7xl font-black text-black dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-2xl">{dashboardStats.absentToday}</h3>
                            <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">MIA / Planned Leave</p>
                        </div>
                    </div>
                </div>
              );
          case 'weekly-trend':
              return (
                <NeoCard title="Attendance Trend" className="h-full">
                    <div className="w-full h-full min-h-[300px] flex items-center justify-center pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardStats.chartData} barSize={30} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                <XAxis dataKey="name" tick={{fill: '#666', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{fill: '#888', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                                <Bar dataKey="present" name="Present" fill="#3B82F6" radius={[6, 6, 0, 0]} stackId="a" />
                                <Bar dataKey="late" name="Late" fill="#FFD700" radius={[6, 6, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </NeoCard>
              );
          case 'team-pulse':
              return (
                <NeoCard title="Live Team Pulse" className="h-full">
                    <div className="w-full h-full min-h-[300px] relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dashboardStats.pie} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                                    {dashboardStats.pie.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-5xl font-black text-black dark:text-white drop-shadow-md">{employees.length}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Staff</p>
                        </div>
                    </div>
                </NeoCard>
              );
          case 'manager-actions':
              return (
                  <NeoCard title="Manager Action Center" className="h-full border-l-4 border-l-blue-500 flex flex-col">
                      <div className="flex gap-2 border-b border-gray-100 dark:border-white/10 pb-4 overflow-x-auto mb-4 shrink-0">
                          <button onClick={() => setApprovalTab('leaves')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${approvalTab === 'leaves' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-white/5'}`}>Leaves ({pendingLeaves.length})</button>
                          <button onClick={() => setApprovalTab('claims')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${approvalTab === 'claims' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-white/5'}`}>Claims ({pendingClaims.length})</button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-[250px]">
                          {approvalTab === 'leaves' && pendingLeaves.map(leave => (
                              <div key={leave.id} className="bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-xl flex items-center justify-between border border-gray-200 dark:border-white/5">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">{leave.name.charAt(0)}</div>
                                      <div><h4 className="text-black dark:text-white font-bold text-xs">{leave.name}</h4><span className="text-blue-500 dark:text-blue-400 text-[10px] uppercase font-bold">{leave.type}</span></div>
                                  </div>
                                  <div className="flex gap-1">
                                      <button onClick={() => updateLeaveRequest(leave.id, 'Approved')} className="p-1.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded hover:bg-green-500/30"><CheckCircle className="w-4 h-4"/></button>
                                      <button onClick={() => updateLeaveRequest(leave.id, 'Rejected')} className="p-1.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded hover:bg-red-500/30"><XCircle className="w-4 h-4"/></button>
                                  </div>
                              </div>
                          ))}
                          {approvalTab === 'leaves' && pendingLeaves.length === 0 && <div className="text-center py-4 text-gray-500 text-xs">No pending leaves.</div>}
                          
                          {approvalTab === 'claims' && pendingClaims.map(claim => (
                              <div key={claim.id} className="bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-xl flex items-center justify-between border border-gray-200 dark:border-white/5">
                                  <div><h4 className="text-black dark:text-white font-bold text-xs">{claim.employeeName}</h4><span className="text-yellow-600 dark:text-yellow-400 text-[10px] uppercase font-bold">{claim.details}</span></div>
                                  <div className="flex gap-1">
                                      <button onClick={() => updateGeneralRequestStatus(claim.id, 'Approved')} className="p-1.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded hover:bg-green-500/30"><CheckCircle className="w-4 h-4"/></button>
                                      <button onClick={() => updateGeneralRequestStatus(claim.id, 'Rejected')} className="p-1.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded hover:bg-red-500/30"><XCircle className="w-4 h-4"/></button>
                                  </div>
                              </div>
                          ))}
                          {approvalTab === 'claims' && pendingClaims.length === 0 && <div className="text-center py-4 text-gray-500 text-xs">No pending claims.</div>}
                      </div>
                  </NeoCard>
              );
          case 'quick-launch':
              return (
                 <NeoCard title="Quick Launch" icon={Activity} className="h-full">
                     <div className="grid grid-cols-2 gap-2 h-full content-start">
                        {quickActions.map(action => (
                            <button key={action.id} onClick={action.action} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222] group h-24 transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white shadow-lg ${action.color} group-hover:scale-110 transition-transform`}><action.icon className="w-4 h-4" /></div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase group-hover:text-black dark:group-hover:text-white text-center leading-tight truncate w-full">{action.label}</span>
                            </button>
                        ))}
                     </div>
                 </NeoCard>
              );
          case 'bulletin':
              return (
                 <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-5 flex flex-col h-full shadow-sm">
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100 dark:border-white/5 shrink-0">
                       <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/30"><Megaphone className="w-4 h-4" /></div>
                       <h3 className="font-black text-black dark:text-white text-sm uppercase tracking-wider">Bulletin</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative min-h-[200px]">
                       <div className="absolute left-[15px] top-2 bottom-0 w-0.5 bg-gray-200 dark:bg-white/10"></div>
                       {announcements.map((ann, index) => (
                          <div key={ann.id} className="relative pl-10 group">
                             <div className={`absolute left-2.5 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#121212] z-10 ${ann.type === 'Alert' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                             <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 group-hover:border-gray-300 dark:group-hover:border-white/10 transition-colors">
                                 <h4 className="font-bold text-black dark:text-white text-sm mb-1 flex justify-between">
                                     {ann.title}
                                     <span className="text-[10px] text-gray-500 font-normal">{ann.date}</span>
                                 </h4>
                                 <p className="text-gray-600 dark:text-gray-400 text-xs">{ann.content}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              );
          default: return null;
      }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-[4px_4px_10px_rgba(0,0,0,0.2)]">
        <div>
           <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white uppercase tracking-tight">Good Morning, {currentUser.name.split(' ')[0]}</h2>
           <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})}</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <NeoButton variant="ghost" className="py-2 px-4 text-xs text-black dark:text-white border-gray-200 dark:border-white/20" onClick={() => setIsEditingLayout(!isEditingLayout)}>
               {isEditingLayout ? 'Done Editing' : 'Edit Layout'} <LayoutTemplate className="w-4 h-4 ml-2"/>
           </NeoButton>
           {isEditingLayout && (
               <NeoButton variant="danger" className="py-2 px-4 text-xs" onClick={handleResetLayout}>
                   Reset <RotateCcw className="w-4 h-4 ml-2"/>
               </NeoButton>
           )}
           {currentUser.role !== 'Staff' && !isEditingLayout && (
               <NeoButton variant="secondary" onClick={fetchAiInsight} className="py-2 px-4 text-sm">
                  {loadingInsight ? 'Running AI...' : 'AI Analysis'}
               </NeoButton>
           )}
           {!isEditingLayout && (
               <NeoButton onClick={() => setIsRequestModalOpen(true)} className="py-2 px-4 text-sm"><Plus className="w-4 h-4" /> Quick Request</NeoButton>
           )}
        </div>
      </div>

      {showOnboardingNudge && currentUser.role === 'Staff' && (
        <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-4 rounded-xl flex items-center justify-between shadow-lg gap-4">
           <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shrink-0"><ClipboardList className="w-5 h-5 text-pink-600" /></div>
              <div><h3 className="text-white font-bold text-sm">Setup Required</h3><p className="text-white/80 text-xs">Complete your profile to unlock all features.</p></div>
           </div>
           <Link to="/onboarding"><button className="px-4 py-2 bg-white text-pink-600 font-bold text-xs uppercase rounded-lg hover:bg-gray-100">Complete</button></Link>
        </div>
      )}

      {/* DRAGGABLE BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-min">
          {layout.map((widget, index) => {
              // Hide manager widgets for staff
              if (currentUser.role === 'Staff' && (widget.type === 'manager-actions' || widget.type === 'team-pulse')) return null;

              // Responsive Col Spans
              const colClass = widget.colSpan === 4 ? 'md:col-span-2 xl:col-span-4' :
                               widget.colSpan === 3 ? 'md:col-span-2 xl:col-span-3' : 
                               widget.colSpan === 2 ? 'md:col-span-2 xl:col-span-2' : 
                               'md:col-span-1 xl:col-span-1';

              return (
                  <div 
                    key={widget.id}
                    draggable={isEditingLayout}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`
                        ${colClass} 
                        transition-all duration-200 
                        ${isEditingLayout ? 'cursor-move hover:scale-[1.02] ring-2 ring-blue-500 ring-offset-4 ring-offset-black rounded-2xl opacity-90' : ''}
                        h-full flex flex-col
                    `}
                  >
                      {isEditingLayout && (
                          <div className="absolute top-2 right-2 z-50 bg-black text-white p-1 rounded">
                              <GripVertical className="w-4 h-4" />
                          </div>
                      )}
                      {renderWidget(widget.type)}
                  </div>
              );
          })}
      </div>

      {/* Modal remains the same... */}
      <NeoModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Submit Request">
           <div className="space-y-6">
             <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10">
               {['Attendance', 'Leave', 'Finance'].map(cat => (
                 <button key={cat} onClick={() => setRequestCategory(cat as any)} className={`flex-1 py-3 px-3 rounded-lg font-bold text-xs uppercase tracking-wide transition-all whitespace-nowrap ${requestCategory === cat ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>{cat}</button>
               ))}
             </div>
             <div className="space-y-4">
                 <div><label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Date</label><NeoInput type="date" value={requestForm.date} onChange={e => setRequestForm({...requestForm, date: e.target.value})} className="text-sm p-3" /></div>
                 {requestCategory === 'Leave' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                         <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Leave Type</label>
                         <NeoSelect value={selectedPolicyId} onChange={(e) => setSelectedPolicyId(e.target.value)} className="text-sm p-3">
                             <option value="">Select Policy...</option>
                             {companyProfile.leavePolicies?.map(policy => (<option key={policy.id} value={policy.id}>{policy.name} ({policy.daysPerYear} days/yr)</option>))}
                         </NeoSelect>
                     </div>
                 )}
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">{requestCategory === 'Attendance' ? 'Reason' : requestCategory === 'Finance' ? 'Amount (RM)' : 'Details'}</label>
                    <NeoInput value={requestForm.details} onChange={e => setRequestForm({...requestForm, details: e.target.value})} placeholder={requestCategory === 'Finance' ? 'e.g. 50.00' : 'Enter details...'} className="text-sm p-3"/>
                 </div>
             </div>
             <NeoButton onClick={handleSubmitRequest} className="w-full text-sm py-3 bg-blue-600 border-blue-400">Submit Request</NeoButton>
           </div>
      </NeoModal>
    </div>
  );
};

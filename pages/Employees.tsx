
import React, { useState } from 'react';
import { Plus, Search, X, Clock, MapPin, Calendar as CalendarIcon, CheckCircle, AlertTriangle, XCircle, ArrowRight, User, Briefcase, Hash, Filter, MoreHorizontal, Trash2, ChevronLeft, ChevronRight, Lock, Download, ScanFace, GitFork, Camera, RefreshCcw, LayoutList, History, Award, BookOpen } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Employee, AttendanceRecord } from '../types';
import { NeoButton, NeoCard, NeoInput, NeoBadge } from '../components/NeoComponents';

// Predefined skills for quick selection
const COMMON_SKILLS = [
  "Management", "Labor Law", "Payroll", "Recruitment", // HR
  "React", "Node.js", "Python", "AWS", "Figma", // IT
  "Sales", "Negotiation", "CRM", "Marketing", "Mandarin", // Sales
  "Electrical", "Safety", "Maintenance", "Logistics" // Ops
];

export const Employees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, getEmployeeAttendance, t, theme, currentUser, addNotification, updateOnboardingStep } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFaceRegMode, setIsFaceRegMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'org'>('list');
  
  // Tab State for Detail Modal
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'onboarding'>('overview');

  // Edit Form State
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [newSkillInput, setNewSkillInput] = useState('');

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.id.includes(searchTerm) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedEmp(null);
    setFormData({
      status: 'Active',
      role: 'Employee',
      department: 'General',
      skills: [],
      reportsTo: ''
    });
    setIsEditMode(true);
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmp(emp);
    setFormData({ ...emp });
    setIsEditMode(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.id) return alert("Name and ID required");
    
    if (selectedEmp && selectedEmp.id === formData.id) {
      updateEmployee(formData as Employee);
    } else {
      addEmployee(formData as Employee);
    }
    setIsEditMode(false);
    if (!selectedEmp) setSelectedEmp(null); 
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Are you sure? This action is irreversible.")) {
      deleteEmployee(id);
      setSelectedEmp(null);
    }
  };

  const registerFace = () => {
     addNotification("Initiating Face Scan...", "info");
     setTimeout(() => {
        setFormData(prev => ({ ...prev, faceRegistered: true }));
        setIsFaceRegMode(false);
        addNotification("Face ID Biometrics Captured & Encrypted", "success");
     }, 2500);
  };

  const handleResetOnboarding = (empId: string) => {
    if (window.confirm("Reset onboarding progress for this employee?")) {
        updateOnboardingStep(empId, 0);
        addNotification("Onboarding reset to Step 0.", "info");
        // Update local selected state
        if (selectedEmp) setSelectedEmp({ ...selectedEmp, onboardingStep: 0 });
    }
  };

  const handleCompleteOnboarding = (empId: string) => {
    updateOnboardingStep(empId, 4);
    if (selectedEmp) setSelectedEmp({ ...selectedEmp, onboardingStep: 4 });
  };

  // Skills Logic
  const toggleSkill = (skill: string) => {
    const currentSkills = formData.skills || [];
    if (currentSkills.includes(skill)) {
      setFormData({ ...formData, skills: currentSkills.filter(s => s !== skill) });
    } else {
      setFormData({ ...formData, skills: [...currentSkills, skill] });
    }
  };

  const addCustomSkill = () => {
    if (newSkillInput.trim()) {
       const currentSkills = formData.skills || [];
       if (!currentSkills.includes(newSkillInput.trim())) {
         setFormData({ ...formData, skills: [...currentSkills, newSkillInput.trim()] });
       }
       setNewSkillInput('');
    }
  };

  const getDeptStyle = (dept: string) => {
    switch(dept) {
      case 'HR': return 'from-red-500 to-pink-600';
      case 'IT': return 'from-blue-500 to-indigo-600';
      case 'Sales': return 'from-orange-500 to-yellow-500';
      case 'Ops': return 'from-purple-500 to-violet-600';
      default: return 'from-slate-500 to-zinc-500';
    }
  };

  // Recursive Org Chart
  const renderOrgTree = (managerId: string) => {
     const reports = employees.filter(e => e.reportsTo === managerId);
     if (reports.length === 0) return null;
     return (
        <div className="flex flex-col items-center">
           <div className="w-px h-6 bg-white/20"></div>
           <div className="flex gap-8 border-t border-white/20 pt-6 px-4">
              {reports.map(emp => (
                 <div key={emp.id} className="flex flex-col items-center">
                    <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-lg flex flex-col items-center min-w-[150px] cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedEmp(emp)}>
                       <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white mb-2">{emp.name.charAt(0)}</div>
                       <span className="font-bold text-white text-xs text-center">{emp.name}</span>
                       <span className="text-[10px] text-gray-500 uppercase">{emp.role}</span>
                    </div>
                    {renderOrgTree(emp.id)}
                 </div>
              ))}
           </div>
        </div>
     );
  };

  const attendanceHistory = selectedEmp ? getEmployeeAttendance(selectedEmp.id) : [];

  return (
    <div className={`min-h-full transition-colors duration-300`}>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className={`absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 animate-blob bg-purple-900`}></div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto pb-20">
        
        <div className="relative overflow-hidden flex flex-col md:flex-row justify-between md:items-end gap-6 bg-[#121212]/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-glossy-card mb-10">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>
           <div>
             <div className="flex items-center gap-3 mb-2">
               <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-400 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
               <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 drop-shadow-sm">Human Resources</h2>
             </div>
             <h1 className="text-6xl font-black tracking-tighter leading-none mb-2 text-white drop-shadow-md">
               TEAM<span className="text-blue-500">.</span>
             </h1>
           </div>
           
           <div className="flex gap-4">
             <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl border ${viewMode === 'list' ? 'bg-white text-black' : 'text-white border-white/10'}`}><User className="w-5 h-5" /></button>
             <button onClick={() => setViewMode('org')} className={`p-3 rounded-xl border ${viewMode === 'org' ? 'bg-white text-black' : 'text-white border-white/10'}`}><GitFork className="w-5 h-5" /></button>
             {currentUser.role !== 'Manager' && (
               <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-sm">
                 <Plus className="w-5 h-5" /> New Hire
               </button>
             )}
           </div>
        </div>

        {/* View Switching */}
        {viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
            {filteredEmployees.map((emp) => (
                <div 
                key={emp.id} 
                onClick={() => { setSelectedEmp(emp); setActiveTab('overview'); }}
                className="group relative cursor-pointer rounded-3xl p-6 border transition-all duration-300 backdrop-blur-lg shadow-glossy-card bg-[#121212]/60 border-white/10 hover:border-white/20 hover:translate-y-[-4px] flex flex-col h-full"
                >
                <div className={`absolute top-0 inset-x-0 h-1.5 rounded-t-3xl bg-gradient-to-r opacity-80 ${getDeptStyle(emp.department)}`}></div>
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border border-white/10 shadow-inner bg-zinc-900/80 text-white">
                    {emp.name.charAt(0)}
                    </div>
                    {emp.faceRegistered && <ScanFace className="w-5 h-5 text-green-400" title="Face ID Registered" />}
                </div>

                <h3 className="relative z-10 text-xl font-black mb-1 truncate text-white">{emp.name}</h3>
                <p className="relative z-10 text-xs font-black uppercase tracking-widest mb-6 text-blue-400">{emp.role}</p>

                <div className="relative z-10 pt-4 border-t border-white/10 mt-auto flex flex-wrap gap-2">
                    {emp.skills?.slice(0, 2).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400">{skill}</span>
                    ))}
                    {emp.skills && emp.skills.length > 2 && <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400">+{emp.skills.length - 2}</span>}
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="overflow-auto p-12 bg-[#121212] rounded-3xl border border-white/10 min-h-[600px] flex justify-center">
                 {/* Root (CEO/Admin) */}
                 <div className="flex flex-col items-center">
                    {employees.filter(e => !e.reportsTo).map(root => (
                        <div key={root.id} className="flex flex-col items-center">
                             <div className="p-6 rounded-2xl bg-blue-900/20 border-2 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] flex flex-col items-center min-w-[180px] cursor-pointer" onClick={() => { setSelectedEmp(root); setActiveTab('overview'); }}>
                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-lg font-black text-white mb-2">{root.name.charAt(0)}</div>
                                <span className="font-black text-white text-sm">{root.name}</span>
                                <span className="text-xs text-blue-300 uppercase tracking-wider">{root.role}</span>
                             </div>
                             {renderOrgTree(root.id)}
                        </div>
                    ))}
                 </div>
            </div>
        )}
      </div>

      {/* Detail Modal */}
      {(selectedEmp && !isEditMode) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setSelectedEmp(null)}></div>
          <div className="relative w-full md:w-[900px] h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-white/10 bg-[#0a0a0a] backdrop-blur-xl">
             
             {/* Modal Header */}
             <div className="p-6 border-b border-white/10 bg-[#121212]">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedEmp.name}</h2>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">{selectedEmp.role} • {selectedEmp.department}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => handleEdit(selectedEmp)} className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10"><MoreHorizontal className="w-5 h-5" /></button>
                        <button onClick={() => setSelectedEmp(null)} className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
                     </div>
                 </div>

                 {/* Tab Navigation */}
                 <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <LayoutList className="w-4 h-4" /> Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('attendance')}
                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'attendance' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <History className="w-4 h-4" /> Attendance Log
                    </button>
                    <button 
                        onClick={() => setActiveTab('onboarding')}
                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'onboarding' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <BookOpen className="w-4 h-4" /> Onboarding
                    </button>
                 </div>
             </div>

             {/* Modal Content */}
             <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-[#0a0a0a]">
                 
                 {/* TAB: OVERVIEW */}
                 {activeTab === 'overview' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                         <div className="grid grid-cols-2 gap-4">
                             <NeoCard title="Skills Matrix" className="min-h-[150px]">
                                 <div className="flex flex-wrap gap-2">
                                     {selectedEmp.skills?.map(s => <NeoBadge key={s}>{s}</NeoBadge>) || <p className="text-gray-500 text-xs">No skills listed.</p>}
                                 </div>
                             </NeoCard>
                             <NeoCard title="Biometrics" className="min-h-[150px]">
                                 <div className="flex items-center gap-4 h-full">
                                     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedEmp.faceRegistered ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                         <ScanFace className="w-6 h-6" />
                                     </div>
                                     <div>
                                         <p className="font-bold text-white text-sm">{selectedEmp.faceRegistered ? 'Face ID Active' : 'Not Registered'}</p>
                                         <p className="text-xs text-gray-500">Last updated: {selectedEmp.faceRegistered ? '2023-10-01' : '-'}</p>
                                     </div>
                                 </div>
                             </NeoCard>
                         </div>
                         
                         <div className="p-6 rounded-2xl border border-white/10 bg-[#121212]">
                            <h3 className="font-black text-white uppercase text-sm mb-4">Contact & Employment</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="block text-gray-500 text-xs uppercase font-bold">Email</span><span className="text-white">{selectedEmp.email || 'N/A'}</span></div>
                                <div><span className="block text-gray-500 text-xs uppercase font-bold">Join Date</span><span className="text-white">{selectedEmp.joinDate}</span></div>
                                <div><span className="block text-gray-500 text-xs uppercase font-bold">Reports To</span><span className="text-white">{employees.find(e => e.id === selectedEmp.reportsTo)?.name || 'None'}</span></div>
                                <div><span className="block text-gray-500 text-xs uppercase font-bold">Status</span><span className={`font-bold ${selectedEmp.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>{selectedEmp.status}</span></div>
                            </div>
                         </div>
                     </div>
                 )}

                 {/* TAB: ATTENDANCE HISTORY */}
                 {activeTab === 'attendance' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="font-black text-white uppercase text-sm">Records ({attendanceHistory.length})</h3>
                            <button className="text-xs text-blue-400 font-bold uppercase hover:underline">Download CSV</button>
                         </div>
                         
                         <div className="rounded-2xl border border-white/10 bg-[#121212] overflow-hidden">
                             <table className="w-full text-left border-collapse">
                                 <thead>
                                     <tr className="bg-white/5 border-b border-white/10 text-xs text-gray-400 uppercase font-black tracking-wider">
                                         <th className="p-4">Date</th>
                                         <th className="p-4">Check In</th>
                                         <th className="p-4">Check Out</th>
                                         <th className="p-4 text-center">Method</th>
                                         <th className="p-4 text-center">Risk</th>
                                         <th className="p-4 text-right">Status</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5 text-sm font-bold text-white">
                                     {attendanceHistory.length === 0 ? (
                                         <tr><td colSpan={6} className="p-8 text-center text-gray-500">No records found.</td></tr>
                                     ) : (
                                         attendanceHistory.map(record => (
                                             <tr key={record.id} className="hover:bg-white/5 transition-colors">
                                                 <td className="p-4 font-mono text-gray-300">{record.date}</td>
                                                 <td className="p-4">{record.checkIn || '-'}</td>
                                                 <td className="p-4">{record.checkOut || '-'}</td>
                                                 <td className="p-4 text-center">
                                                     {record.method === 'Face' && <ScanFace className="w-4 h-4 mx-auto text-blue-400" />}
                                                     {record.method === 'QR' && <RefreshCcw className="w-4 h-4 mx-auto text-yellow-400" />}
                                                     {record.method === 'PIN' && <Hash className="w-4 h-4 mx-auto text-gray-400" />}
                                                 </td>
                                                 <td className="p-4 text-center">
                                                     <div className={`
                                                         inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase
                                                         ${(record.riskScore || 0) > 50 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}
                                                     `}>
                                                         {record.riskScore || 0}%
                                                     </div>
                                                 </td>
                                                 <td className="p-4 text-right">
                                                     <span className={`
                                                         ${record.status === 'Present' ? 'text-green-400' : record.status === 'Late' ? 'text-yellow-400' : 'text-red-400'}
                                                     `}>
                                                         {record.status}
                                                     </span>
                                                 </td>
                                             </tr>
                                         ))
                                     )}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 )}

                 {/* TAB: ONBOARDING MANAGEMENT */}
                 {activeTab === 'onboarding' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                         <div className="p-6 rounded-2xl bg-[#121212] border border-white/10 flex items-center gap-6">
                             <div className="relative w-24 h-24 flex items-center justify-center">
                                 <svg className="w-full h-full transform -rotate-90">
                                     <circle cx="48" cy="48" r="40" stroke="#333" strokeWidth="8" fill="none" />
                                     <circle 
                                         cx="48" cy="48" r="40" stroke="#db2777" strokeWidth="8" fill="none" 
                                         strokeDasharray="251.2" 
                                         strokeDashoffset={251.2 - (251.2 * ((selectedEmp.onboardingStep || 0) / 4))} 
                                         className="transition-all duration-1000 ease-out"
                                     />
                                 </svg>
                                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                                     <span className="text-2xl font-black text-white">{selectedEmp.onboardingStep || 0}/4</span>
                                     <span className="text-[10px] text-gray-500 uppercase font-bold">Steps</span>
                                 </div>
                             </div>
                             <div>
                                 <h3 className="font-black text-white uppercase text-lg mb-1">Onboarding Progress</h3>
                                 <p className="text-gray-400 text-sm mb-4">
                                     Current status of {selectedEmp.name}'s onboarding journey.
                                 </p>
                                 <div className="flex gap-2">
                                     {selectedEmp.onboardingStep === 4 ? (
                                         <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30 flex items-center gap-2">
                                             <CheckCircle className="w-3 h-3" /> Completed
                                         </span>
                                     ) : (
                                         <span className="bg-pink-500/20 text-pink-400 px-3 py-1 rounded text-xs font-bold border border-pink-500/30 flex items-center gap-2">
                                             <Clock className="w-3 h-3" /> In Progress
                                         </span>
                                     )}
                                 </div>
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                             <button 
                                onClick={() => handleResetOnboarding(selectedEmp.id)}
                                className="p-4 rounded-xl border-2 border-dashed border-red-500/30 hover:bg-red-500/10 text-red-400 font-bold uppercase text-xs transition-colors flex flex-col items-center justify-center gap-2"
                             >
                                 <RefreshCcw className="w-6 h-6" />
                                 Reset Progress
                             </button>
                             <button 
                                onClick={() => handleCompleteOnboarding(selectedEmp.id)}
                                className="p-4 rounded-xl border-2 border-dashed border-green-500/30 hover:bg-green-500/10 text-green-400 font-bold uppercase text-xs transition-colors flex flex-col items-center justify-center gap-2"
                             >
                                 <CheckCircle className="w-6 h-6" />
                                 Mark Complete
                             </button>
                         </div>

                         <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                             <h4 className="font-bold text-white text-xs uppercase mb-2">Step Log</h4>
                             <ul className="space-y-2 text-xs text-gray-400">
                                 <li className={(selectedEmp.onboardingStep || 0) > 0 ? 'text-green-400' : ''}>1. Profile Setup & Banking Info</li>
                                 <li className={(selectedEmp.onboardingStep || 0) > 1 ? 'text-green-400' : ''}>2. Document Submission (IC/Certs)</li>
                                 <li className={(selectedEmp.onboardingStep || 0) > 2 ? 'text-green-400' : ''}>3. Handbook Acknowledgement</li>
                                 <li className={(selectedEmp.onboardingStep || 0) > 3 ? 'text-green-400' : ''}>4. Final Review</li>
                             </ul>
                         </div>
                     </div>
                 )}
             </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditMode && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsEditMode(false)}></div>
            <div className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10 backdrop-blur-xl bg-[#121212]">
               <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-black text-lg text-white uppercase">{selectedEmp ? 'Edit Profile' : 'New Employee'}</h3>
                  <button onClick={() => setIsEditMode(false)}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               
               <div className="p-8 overflow-y-auto space-y-6">
                  {/* Face Registration UI */}
                  {isFaceRegMode ? (
                      <div className="bg-black p-8 rounded-2xl border-[4px] border-white text-center shadow-2xl">
                          <h4 className="text-white font-black uppercase text-xl mb-6">Biometric Enrollment</h4>
                          <div className="w-64 h-64 mx-auto bg-gray-900 rounded-3xl mb-6 relative overflow-hidden border-[6px] border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-scan z-10"></div>
                             {/* Simulated Camera View */}
                             <div className="absolute inset-0 flex items-center justify-center text-gray-700">
                                <ScanFace className="w-32 h-32 opacity-20" />
                             </div>
                             <div className="absolute bottom-4 inset-x-0 text-center z-20">
                                <span className="bg-black/80 text-white text-xs px-3 py-1 rounded-full border border-white/30">Position Face in Center</span>
                             </div>
                          </div>
                          <div className="flex justify-center gap-4">
                              <NeoButton onClick={() => setIsFaceRegMode(false)} variant="danger">Cancel</NeoButton>
                              <NeoButton onClick={registerFace} variant="primary" className="bg-[#FFD700] text-black border-white hover:bg-yellow-400">
                                <Camera className="w-5 h-5 mr-2" /> Capture Face
                              </NeoButton>
                          </div>
                      </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                           <label className="text-xs text-gray-500 font-black uppercase">Name</label>
                           <NeoInput value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-xs text-gray-500 font-black uppercase">ID</label>
                           <NeoInput value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-xs text-gray-500 font-black uppercase">NRIC / Passport</label>
                           <NeoInput value={formData.nric || ''} onChange={e => setFormData({...formData, nric: e.target.value})} placeholder="e.g. 850101-14-1234" />
                        </div>
                        <div>
                           <label className="text-xs text-gray-500 font-black uppercase">Role</label>
                           <NeoInput value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-xs text-gray-500 font-black uppercase">Manager (Reports To)</label>
                           <select 
                             className="w-full bg-[#0a0a0a] border-2 border-white/10 rounded-xl p-4 text-white text-sm font-bold"
                             value={formData.reportsTo || ''}
                             onChange={e => setFormData({...formData, reportsTo: e.target.value})}
                           >
                              <option value="">None (Root)</option>
                              {employees.filter(e => e.id !== formData.id).map(e => (
                                  <option key={e.id} value={e.id}>{e.name}</option>
                              ))}
                           </select>
                        </div>
                        
                        {/* Skills Multi-Select */}
                        <div className="col-span-2">
                            <label className="text-xs text-gray-500 font-black uppercase block mb-2">Skills & Competencies</label>
                            <div className="p-4 rounded-xl border-2 border-white/10 bg-[#050505]">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(formData.skills || []).map(skill => (
                                        <span key={skill} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                            {skill}
                                            <button onClick={() => toggleSkill(skill)} className="hover:text-black"><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="mb-4">
                                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-2">Quick Add</div>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_SKILLS.filter(s => !formData.skills?.includes(s)).map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => toggleSkill(s)}
                                                className="px-2 py-1 border border-white/20 rounded-full text-xs text-gray-400 hover:bg-white hover:text-black transition-colors"
                                            >
                                                + {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        value={newSkillInput}
                                        onChange={e => setNewSkillInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                                        placeholder="Add custom skill..."
                                        className="flex-1 bg-transparent border-b border-white/30 text-sm py-1 focus:outline-none focus:border-white text-white"
                                    />
                                    <button onClick={addCustomSkill} className="text-xs font-bold uppercase text-blue-400 hover:text-blue-300">Add</button>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                           <label className="text-xs text-gray-500 font-black uppercase mb-2 block">Face Biometrics</label>
                           <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                               <div className={`w-3 h-3 rounded-full ${formData.faceRegistered ? 'bg-green-500' : 'bg-red-500'}`}></div>
                               <span className="text-white font-bold text-sm flex-1">{formData.faceRegistered ? 'Registered' : 'Not Registered'}</span>
                               <NeoButton variant="secondary" onClick={() => setIsFaceRegMode(true)}>
                                   <ScanFace className="w-4 h-4 mr-2" />
                                   {formData.faceRegistered ? 'Re-Enroll Face' : 'Enroll Face ID'}
                               </NeoButton>
                           </div>
                        </div>
                    </div>
                  )}
               </div>

               {!isFaceRegMode && (
                   <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#0a0a0a]">
                      <button onClick={() => setIsEditMode(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-white hover:bg-white/10">Cancel</button>
                      <button onClick={handleSave} className="px-6 py-3 rounded-xl font-black text-sm bg-blue-600 text-white hover:bg-blue-700">Save</button>
                   </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

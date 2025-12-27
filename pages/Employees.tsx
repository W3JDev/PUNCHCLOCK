
import React, { useState } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoSelect, NeoBadge, NeoModal } from '../components/NeoComponents';
import { Search, Plus, User, MapPin, Phone, Mail, Calendar, Briefcase, Trash2, CheckCircle, Clock, LayoutGrid, List, MoreHorizontal, FileText, UserPlus, Filter } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Employee } from '../types';

export const Employees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, addNotification, currentUser } = useGlobal();
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Employee for Details View
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'onboarding'>('details');

  // Add/Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formEmp, setFormEmp] = useState<Partial<Employee>>({});

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (emp: Employee) => {
      setFormEmp(emp);
      setIsEditModalOpen(true);
  };

  const handleAddNewClick = () => {
      setFormEmp({
          status: 'Active',
          role: 'Staff',
          employmentType: 'Permanent',
          department: 'General',
          joinDate: new Date().toISOString().split('T')[0]
      });
      setIsEditModalOpen(true);
  };

  const handleSaveEmployee = () => {
      if (!formEmp.name || !formEmp.email) {
          addNotification("Name and Email are required.", "error");
          return;
      }

      const empPayload: Employee = {
          id: formEmp.id || `EMP-${Math.floor(Math.random() * 100000)}`,
          name: formEmp.name!,
          email: formEmp.email!,
          role: formEmp.role || 'Staff',
          department: formEmp.department || 'General',
          status: formEmp.status || 'Active',
          employmentType: formEmp.employmentType || 'Permanent',
          baseSalary: formEmp.baseSalary || 2000,
          joinDate: formEmp.joinDate || new Date().toISOString().split('T')[0],
          nric: formEmp.nric,
          phone: formEmp.phone || '', // Assuming phone exists in Employee type or used as placeholder
          // Preserve existing fields if editing
          ...(formEmp.id ? employees.find(e => e.id === formEmp.id) : {}),
          ...formEmp
      } as Employee;

      if (formEmp.id) {
          updateEmployee(empPayload);
      } else {
          addEmployee(empPayload);
      }
      setIsEditModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if (confirm("Are you sure you want to remove this employee?")) {
          deleteEmployee(id);
          if (selectedEmp?.id === id) setSelectedEmp(null);
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 w-full max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-[#121212] p-8 rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-sm">
            <div>
                <h1 className="text-5xl font-black text-black dark:text-white uppercase tracking-tighter">Team<span className="text-purple-600">.</span></h1>
                <p className="text-gray-500 font-bold mt-2">Manage your workforce profile.</p>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                    <button onClick={() => setViewMode('List')} className={`p-3 rounded-lg transition-all ${viewMode === 'List' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}><List className="w-5 h-5"/></button>
                    <button onClick={() => setViewMode('Grid')} className={`p-3 rounded-lg transition-all ${viewMode === 'Grid' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}><LayoutGrid className="w-5 h-5"/></button>
                </div>
                {currentUser?.role !== 'Staff' && (
                    <NeoButton onClick={handleAddNewClick} className="px-6 gap-2">
                        <UserPlus className="w-5 h-5" /> Add Talent
                    </NeoButton>
                )}
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search by name, role, or department..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-purple-500 font-bold text-sm"
                />
            </div>
            <div className="flex gap-2">
                <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-black uppercase tracking-wider border border-purple-200 dark:border-purple-500/30 flex items-center">
                    Total: {employees.length}
                </div>
                <div className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-black uppercase tracking-wider border border-green-200 dark:border-green-500/30 flex items-center">
                    Active: {employees.filter(e => e.status === 'Active').length}
                </div>
            </div>
        </div>

        {/* Employee Grid/List */}
        {viewMode === 'Grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEmployees.map(emp => (
                    <div key={emp.id} onClick={() => { setSelectedEmp(emp); setActiveTab('details'); }} className="group relative bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-6 hover:border-purple-500 transition-all cursor-pointer shadow-sm hover:shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-2xl font-black text-gray-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                {emp.name.charAt(0)}
                            </div>
                            <NeoBadge variant={emp.status === 'Active' ? 'success' : 'danger'}>{emp.status}</NeoBadge>
                        </div>
                        <h3 className="font-bold text-lg text-black dark:text-white mb-1 truncate">{emp.name}</h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{emp.role}</p>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> {emp.department}
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" /> <span className="truncate">{emp.email}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                            <th className="p-6">Employee</th>
                            <th className="p-6">Role</th>
                            <th className="p-6">Department</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Joined</th>
                            <th className="p-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredEmployees.map(emp => (
                            <tr key={emp.id} onClick={() => { setSelectedEmp(emp); setActiveTab('details'); }} className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer group">
                                <td className="p-6 font-bold flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center text-xs font-black">{emp.name.charAt(0)}</div>
                                    {emp.name}
                                </td>
                                <td className="p-6 text-sm font-medium">{emp.role}</td>
                                <td className="p-6 text-sm text-gray-500">{emp.department}</td>
                                <td className="p-6"><NeoBadge variant={emp.status === 'Active' ? 'success' : 'danger'}>{emp.status}</NeoBadge></td>
                                <td className="p-6 text-sm font-mono text-gray-500">{emp.joinDate}</td>
                                <td className="p-6 text-right">
                                    <button onClick={(e) => { e.stopPropagation(); handleEditClick(emp); }} className="p-2 text-gray-400 hover:text-black dark:hover:text-white"><MoreHorizontal className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Employee Details Modal */}
        <NeoModal isOpen={!!selectedEmp} onClose={() => setSelectedEmp(null)} title={selectedEmp?.name || 'Details'}>
            {selectedEmp && (
                <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-white/10">
                        <button onClick={() => setActiveTab('details')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'details' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Profile</button>
                        <button onClick={() => setActiveTab('onboarding')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'onboarding' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Onboarding</button>
                    </div>

                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <p className="text-xs font-black text-gray-500 uppercase mb-1">Role</p>
                                    <p className="font-bold">{selectedEmp.role}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <p className="text-xs font-black text-gray-500 uppercase mb-1">Department</p>
                                    <p className="font-bold">{selectedEmp.department}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <p className="text-xs font-black text-gray-500 uppercase mb-1">Email</p>
                                    <p className="font-bold truncate">{selectedEmp.email}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <p className="text-xs font-black text-gray-500 uppercase mb-1">Employment Type</p>
                                    <p className="font-bold">{selectedEmp.employmentType}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 dark:border-white/10 pt-6 flex justify-between">
                                <NeoButton variant="secondary" onClick={() => { setIsEditModalOpen(true); setFormEmp(selectedEmp); setSelectedEmp(null); }}>Edit Profile</NeoButton>
                                {currentUser?.role === 'Admin' && (
                                    <button onClick={() => handleDelete(selectedEmp.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" /> Terminate
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: ONBOARDING MANAGEMENT */}
                    {activeTab === 'onboarding' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 flex items-center gap-6 overflow-hidden">
                                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                                        <circle cx="48" cy="48" r="40" stroke="#333" strokeWidth="8" fill="none" className="stroke-gray-300 dark:stroke-[#333]" />
                                        <circle 
                                            cx="48" cy="48" r="40" stroke="#db2777" strokeWidth="8" fill="none" 
                                            strokeDasharray="251.2" 
                                            strokeDashoffset={251.2 - (251.2 * ((selectedEmp.onboardingStep || 0) / 4))} 
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-2xl font-black text-black dark:text-white">{selectedEmp.onboardingStep || 0}/4</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Steps</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-black dark:text-white uppercase text-lg mb-1 truncate">Onboarding Progress</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                        Current status of {selectedEmp.name}'s onboarding journey.
                                    </p>
                                    <div className="flex gap-2">
                                        {selectedEmp.onboardingStep === 4 ? (
                                            <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded text-xs font-bold border border-green-500/30 flex items-center gap-2">
                                                <CheckCircle className="w-3 h-3" /> Completed
                                            </span>
                                        ) : (
                                            <span className="bg-pink-500/20 text-pink-600 dark:text-pink-400 px-3 py-1 rounded text-xs font-bold border border-pink-500/30 flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> In Progress
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {[
                                    { step: 1, label: "Profile Setup" },
                                    { step: 2, label: "Document Upload" },
                                    { step: 3, label: "Handbook Sign-off" },
                                    { step: 4, label: "Completed" }
                                ].map((s) => (
                                    <div key={s.step} className={`flex items-center gap-4 p-3 rounded-xl border ${ (selectedEmp.onboardingStep || 0) >= s.step ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 opacity-50' }`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${ (selectedEmp.onboardingStep || 0) >= s.step ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-white/20 text-gray-500' }`}>
                                            { (selectedEmp.onboardingStep || 0) >= s.step ? <CheckCircle className="w-4 h-4" /> : s.step }
                                        </div>
                                        <span className="text-sm font-bold">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </NeoModal>

        {/* Add/Edit Modal */}
        <NeoModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={formEmp.id ? 'Edit Employee' : 'New Hire'}>
            <div className="space-y-4">
                <NeoInput label="Full Name" value={formEmp.name || ''} onChange={e => setFormEmp({...formEmp, name: e.target.value})} placeholder="e.g. Ali Bin Abu" />
                <NeoInput label="Email Address" value={formEmp.email || ''} onChange={e => setFormEmp({...formEmp, email: e.target.value})} placeholder="email@company.com" />
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black uppercase text-gray-500 mb-2 block">Role</label>
                        <NeoSelect value={formEmp.role || 'Staff'} onChange={e => setFormEmp({...formEmp, role: e.target.value})}>
                            <option value="Staff">Staff</option>
                            <option value="Manager">Manager</option>
                            <option value="HR">HR</option>
                            <option value="Admin">Admin</option>
                        </NeoSelect>
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase text-gray-500 mb-2 block">Employment Type</label>
                        <NeoSelect value={formEmp.employmentType || 'Permanent'} onChange={e => setFormEmp({...formEmp, employmentType: e.target.value as any})}>
                            <option value="Permanent">Permanent</option>
                            <option value="Contract">Contract</option>
                            <option value="Intern">Intern</option>
                            <option value="Part-Time">Part-Time</option>
                        </NeoSelect>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <NeoInput label="Department" value={formEmp.department || ''} onChange={e => setFormEmp({...formEmp, department: e.target.value})} />
                    <NeoInput label="Basic Salary (RM)" type="number" value={formEmp.baseSalary || 0} onChange={e => setFormEmp({...formEmp, baseSalary: parseFloat(e.target.value)})} />
                </div>

                <NeoInput label="Join Date" type="date" value={formEmp.joinDate || ''} onChange={e => setFormEmp({...formEmp, joinDate: e.target.value})} />

                <NeoButton onClick={handleSaveEmployee} className="w-full mt-4">
                    {formEmp.id ? 'Save Changes' : 'Onboard Employee'}
                </NeoButton>
            </div>
        </NeoModal>

    </div>
  );
};

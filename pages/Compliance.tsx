
import React, { useState } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoSelect, NeoCheckbox } from '../components/NeoComponents';
import { FileText, ShieldAlert, Check, Lock, Download, FilePlus, Building2, Upload, Eye, BrainCircuit, AlertTriangle, Info, Siren, ShieldCheck, Clock, Settings, Trash2, Plus, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { generateProfessionalPDF } from '../services/documentService';
import { runComplianceAudit, generateHRDocument } from '../services/geminiService';
import { ComplianceFlag, LeavePolicy } from '../types';
import { useNavigate } from 'react-router-dom';

export const Compliance: React.FC = () => {
  const { currentUser, addNotification, companyProfile, updateCompanyProfile, employees, attendanceRecords, leaveRequests } = useGlobal();
  const [activeTab, setActiveTab] = useState<'profile' | 'monitor'>('monitor');
  const navigate = useNavigate();

  // Monitor State
  const [isAuditing, setIsAuditing] = useState(false);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>([]);

  // Leave Policy State
  const [newPolicy, setNewPolicy] = useState<Partial<LeavePolicy>>({
      name: '', daysPerYear: 0, allowCarryForward: false, maxCarryForwardDays: 0, minNoticeDays: 0, requireDocument: false
  });

  // Policy Generator State
  const [policyTopic, setPolicyTopic] = useState('');
  const [isGeneratingPolicy, setIsGeneratingPolicy] = useState(false);

  if (currentUser.role === 'Staff' || currentUser.role === 'Manager') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10">
          <Lock className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-3xl font-black text-black dark:text-white mb-2 uppercase tracking-wide">Access Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400">You do not have permission to view Legal & Compliance tools.</p>
      </div>
    );
  }

  const handleRunAudit = async () => {
    setIsAuditing(true);
    addNotification("AI Audit Initialized. Scanning records...", "info");
    const flags = await runComplianceAudit(employees, attendanceRecords, leaveRequests);
    setComplianceFlags(flags);
    setIsAuditing(false);
    if(flags.length > 0) {
        addNotification(`Audit Complete. ${flags.length} issues found.`, "error");
    } else {
        addNotification("Audit Complete. No issues found.", "success");
    }
  };

  const addLeavePolicy = () => {
      if (!newPolicy.name) return addNotification("Policy Name required", "error");
      const policy: LeavePolicy = {
          id: Math.random().toString(36).substr(2, 9),
          name: newPolicy.name,
          daysPerYear: newPolicy.daysPerYear || 0,
          allowCarryForward: newPolicy.allowCarryForward || false,
          maxCarryForwardDays: newPolicy.maxCarryForwardDays || 0,
          minNoticeDays: newPolicy.minNoticeDays || 0,
          requireDocument: newPolicy.requireDocument || false
      };
      const updatedPolicies = [...(companyProfile.leavePolicies || []), policy];
      updateCompanyProfile({ ...companyProfile, leavePolicies: updatedPolicies });
      setNewPolicy({ name: '', daysPerYear: 0, allowCarryForward: false, maxCarryForwardDays: 0, minNoticeDays: 0, requireDocument: false });
      addNotification("Leave Policy Added", "success");
  };

  const deleteLeavePolicy = (id: string) => {
      const updatedPolicies = (companyProfile.leavePolicies || []).filter(p => p.id !== id);
      updateCompanyProfile({ ...companyProfile, leavePolicies: updatedPolicies });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCompanyProfile({ ...companyProfile, logoUrl: reader.result as string });
        addNotification("Logo uploaded successfully", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePolicy = async () => {
      if (!policyTopic) return addNotification("Please enter a policy topic", "error");
      setIsGeneratingPolicy(true);
      try {
          const generatedText = await generateHRDocument(
              "Company Policy Clause", 
              `Topic: ${policyTopic}. Requirements: Compliant with Employment Act 1955 (Malaysia). Tone: Professional, clear, and legally sound.`
          );
          
          const currentPolicies = companyProfile.policies || '';
          const newSection = `\n\n### ${policyTopic}\n${generatedText}`;
          updateCompanyProfile({ ...companyProfile, policies: currentPolicies + newSection });
          
          setPolicyTopic('');
          addNotification("Policy section generated and added to Handbook.", "success");
      } catch (error) {
          addNotification("Failed to generate policy.", "error");
      } finally {
          setIsGeneratingPolicy(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Compliance & Legal</h2>
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10">
           <button onClick={() => setActiveTab('monitor')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider ${activeTab === 'monitor' ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}>AI Monitor</button>
           <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider ${activeTab === 'profile' ? 'bg-yellow-500 text-black' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}>Policy Settings</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* LEFT PANEL */}
        <div className="space-y-6 h-full flex flex-col">
          
          {activeTab === 'profile' && (
             <div className="space-y-8">
             <NeoCard title="Company Details" className="border-l-4 border-l-yellow-500">
                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="flex items-center gap-6">
                       <div className="w-24 h-24 bg-gray-50 dark:bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-white/20">
                          {companyProfile.logoUrl ? (
                            <img src={companyProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-8 h-8 text-gray-300" />
                          )}
                       </div>
                       <div className="flex-1">
                          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Company Logo</label>
                          <div className="relative">
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <NeoButton variant="secondary" className="w-full text-xs py-2">
                               <Upload className="w-4 h-4 mr-2" /> Upload Logo (PNG/JPG)
                            </NeoButton>
                          </div>
                       </div>
                    </div>

                    <div>
                        <label className="font-black block mb-2 text-gray-500 text-xs uppercase tracking-wider">Company Name</label>
                        <NeoInput value={companyProfile.name} onChange={e => updateCompanyProfile({...companyProfile, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="font-black block mb-2 text-gray-500 text-xs uppercase tracking-wider">Registration No.</label>
                        <NeoInput value={companyProfile.regNo} onChange={e => updateCompanyProfile({...companyProfile, regNo: e.target.value})} />
                    </div>
                    <div>
                        <label className="font-black block mb-2 text-gray-500 text-xs uppercase tracking-wider">Full Address</label>
                        <textarea 
                            value={companyProfile.address} 
                            onChange={e => updateCompanyProfile({...companyProfile, address: e.target.value})}
                            className="w-full h-24 bg-white dark:bg-[#0a0a0a] border-2 border-gray-300 dark:border-white/10 rounded-xl p-4 text-black dark:text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                    </div>
                </div>
             </NeoCard>

             <NeoCard title="AI Policy Generator" className="border-l-4 border-l-purple-500">
                 <div className="space-y-4">
                     <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-500/30 flex items-start gap-3">
                         <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1" />
                         <div>
                             <h4 className="font-bold text-black dark:text-white text-sm">Smart Drafter</h4>
                             <p className="text-xs text-gray-600 dark:text-gray-300">
                                 Automatically draft compliant HR policy sections based on Malaysian Labour Law.
                             </p>
                         </div>
                     </div>

                     <div className="flex gap-2">
                         <div className="flex-1">
                             <NeoInput 
                                placeholder="Enter Topic (e.g. Whistleblowing, WFH)" 
                                value={policyTopic} 
                                onChange={e => setPolicyTopic(e.target.value)} 
                             />
                         </div>
                         <NeoButton onClick={handleGeneratePolicy} disabled={isGeneratingPolicy} className="w-auto px-6">
                             {isGeneratingPolicy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                             {isGeneratingPolicy ? 'Drafting...' : 'Generate'}
                         </NeoButton>
                     </div>

                     <div>
                         <label className="font-black block mb-2 text-gray-500 text-xs uppercase tracking-wider">Handbook Content</label>
                         <textarea 
                             value={companyProfile.policies || ''} 
                             onChange={e => updateCompanyProfile({...companyProfile, policies: e.target.value})}
                             className="w-full h-64 bg-white dark:bg-[#0a0a0a] border-2 border-gray-300 dark:border-white/10 rounded-xl p-4 text-black dark:text-white text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono leading-relaxed"
                             placeholder="Generated policies will appear here..."
                         />
                     </div>
                 </div>
             </NeoCard>

             <NeoCard title="Leave Policy Configuration" className="border-l-4 border-l-green-500">
                 <div className="space-y-6">
                     <p className="text-xs text-gray-500 dark:text-gray-400">Configure entitlements, rules, and restrictions for employee leave types.</p>
                     
                     <div className="space-y-2">
                         {(companyProfile.leavePolicies || []).map(policy => (
                             <div key={policy.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 flex justify-between items-center group">
                                 <div>
                                     <h4 className="font-bold text-black dark:text-white text-sm">{policy.name}</h4>
                                     <div className="flex gap-2 text-[10px] text-gray-500 uppercase mt-1">
                                         <span>{policy.daysPerYear} Days/Year</span> • 
                                         <span>{policy.minNoticeDays} Days Notice</span> • 
                                         <span>{policy.requireDocument ? 'Doc Req' : 'No Doc'}</span>
                                     </div>
                                 </div>
                                 <button onClick={() => deleteLeavePolicy(policy.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-600 dark:text-red-400"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         ))}
                     </div>

                     <div className="p-4 bg-gray-100 dark:bg-black/40 rounded-xl border border-dashed border-gray-300 dark:border-white/20">
                         <h4 className="font-black text-xs uppercase text-gray-500 mb-3">Add New Policy</h4>
                         <div className="space-y-3">
                             <NeoInput placeholder="Policy Name (e.g. Maternity)" value={newPolicy.name} onChange={e => setNewPolicy({...newPolicy, name: e.target.value})} className="text-sm p-3" />
                             <div className="grid grid-cols-2 gap-3">
                                 <NeoInput type="number" placeholder="Days/Year" value={newPolicy.daysPerYear || ''} onChange={e => setNewPolicy({...newPolicy, daysPerYear: parseInt(e.target.value)})} className="text-sm p-3" />
                                 <NeoInput type="number" placeholder="Min Notice (Days)" value={newPolicy.minNoticeDays || ''} onChange={e => setNewPolicy({...newPolicy, minNoticeDays: parseInt(e.target.value)})} className="text-sm p-3" />
                             </div>
                             <div className="flex gap-4">
                                <NeoCheckbox label="Allow Carry Forward" checked={newPolicy.allowCarryForward || false} onChange={c => setNewPolicy({...newPolicy, allowCarryForward: c})} />
                                <NeoCheckbox label="Require Document" checked={newPolicy.requireDocument || false} onChange={c => setNewPolicy({...newPolicy, requireDocument: c})} />
                             </div>
                             <NeoButton onClick={addLeavePolicy} variant="secondary" className="w-full text-xs py-3"><Plus className="w-4 h-4 mr-2" /> Add Policy</NeoButton>
                         </div>
                     </div>
                 </div>
             </NeoCard>
             </div>
          )}

          {activeTab === 'monitor' && (
              <NeoCard title="AI Policy Monitor" className="flex-1 border-l-4 border-l-red-500">
                  <div className="space-y-6">
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex gap-4 items-start">
                          <BrainCircuit className="w-8 h-8 text-red-600 dark:text-red-500 shrink-0" />
                          <div>
                              <h4 className="font-bold text-black dark:text-white text-sm mb-1">Automated Compliance Scan</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                  Gemini AI scans all attendance records, leave requests, and employee profiles against the 
                                  <span className="text-black dark:text-white font-bold"> Employment Act 1955</span> and 
                                  <span className="text-black dark:text-white font-bold"> Company SOPs</span>. 
                                  It flags lateness, missing MCs, OT violations, and probation irregularities.
                              </p>
                          </div>
                      </div>

                      <NeoButton onClick={handleRunAudit} variant="danger" className="w-full" disabled={isAuditing}>
                          {isAuditing ? 'Scanning Records...' : 'Run Compliance Audit'}
                      </NeoButton>

                      {complianceFlags.length > 0 && (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                              {complianceFlags.map((flag) => (
                                  <div key={flag.id} className={`
                                      p-4 rounded-xl border-l-4 bg-gray-50 dark:bg-[#1a1a1a] shadow-sm
                                      ${flag.severity === 'Critical' ? 'border-l-red-500' : flag.severity === 'Warning' ? 'border-l-yellow-500' : 'border-l-blue-500'}
                                  `}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                              {flag.severity === 'Critical' ? <Siren className="w-4 h-4 text-red-600 dark:text-red-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />}
                                              <span className="font-black text-sm text-black dark:text-white uppercase">{flag.issue}</span>
                                          </div>
                                          <span className="text-[10px] bg-white dark:bg-white/10 px-2 py-1 rounded text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-transparent">{flag.severity}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                          <span className="font-bold text-black dark:text-white">{flag.employeeName}</span> - {flag.actionItem}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                          <Info className="w-3 h-3" />
                                          Ref: {flag.policyReference}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                      
                      {complianceFlags.length === 0 && !isAuditing && (
                          <div className="text-center py-10 opacity-30">
                              <ShieldCheck className="w-16 h-16 mx-auto mb-2 text-gray-400 dark:text-white" />
                              <p className="font-bold uppercase tracking-widest text-gray-500 dark:text-white">System Compliant</p>
                          </div>
                      )}
                  </div>
              </NeoCard>
          )}

        </div>

        {/* RIGHT PANEL - CONTEXT */}
        <div className="bg-gray-100 dark:bg-[#222] rounded-3xl p-8 border border-gray-200 dark:border-white/10 relative shadow-inner flex flex-col transition-colors">
             <div className="mb-8 p-6 bg-blue-600 rounded-2xl shadow-lg text-white">
                 <h3 className="font-black text-xl uppercase mb-2">Document Generator</h3>
                 <p className="text-sm opacity-90 mb-4">Create Warnings, Contracts, and Memos instantly using the Document Hub.</p>
                 <button 
                    onClick={() => navigate('/documents')}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors"
                 >
                     Go to Document Hub <ArrowRight className="w-4 h-4" />
                 </button>
             </div>

             <h3 className="text-black dark:text-white font-black uppercase tracking-wider mb-6">Regional Compliance Context</h3>
             
             <div className="grid grid-cols-1 gap-4 overflow-y-auto flex-1">
                 <div className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                     <div className="flex items-center gap-3 mb-2 text-blue-600 dark:text-blue-400">
                         <Clock className="w-5 h-5" />
                         <h4 className="font-bold uppercase">Working Hours (Malaysia)</h4>
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                         Per Employment Act 2022 Amendment, maximum working hours are reduced from 48 to <span className="text-black dark:text-white font-bold">45 hours/week</span>. 
                         Overtime (OT) is capped at 104 hours/month.
                     </p>
                 </div>

                 <div className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                     <div className="flex items-center gap-3 mb-2 text-green-600 dark:text-green-400">
                         <Check className="w-5 h-5" />
                         <h4 className="font-bold uppercase">Friday Prayers (SOP)</h4>
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                         Standard practice in Malaysia/Indonesia: Lunch break is extended on Fridays (12:30 PM - 2:30 PM) to accommodate Solat Jumaat. The AI ignores "Late after lunch" flags during this window.
                     </p>
                 </div>

                 <div className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                     <div className="flex items-center gap-3 mb-2 text-yellow-600 dark:text-yellow-400">
                         <FileText className="w-5 h-5" />
                         <h4 className="font-bold uppercase">Payslip Regulations</h4>
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                         Regulation 5 (Employment Regulations 1957) requires distinct separation of Basic Wages, Allowances (Travel/Meal), Overtime Rates (1.5x/2.0x/3.0x), and Statutory Deductions (EPF/SOCSO/EIS/PCB).
                     </p>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

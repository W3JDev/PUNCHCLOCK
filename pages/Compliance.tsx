

import React, { useState } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoSelect, NeoCheckbox } from '../components/NeoComponents';
import { FileText, ShieldAlert, Check, Lock, Download, FilePlus, Building2, Upload, Eye, BrainCircuit, AlertTriangle, Info, Siren, ShieldCheck, Clock, Settings, Trash2, Plus } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { generateProfessionalPDF } from '../services/documentService';
import { runComplianceAudit } from '../services/geminiService';
import { ComplianceFlag, LeavePolicy } from '../types';

export const Compliance: React.FC = () => {
  const { currentUser, addNotification, companyProfile, updateCompanyProfile, employees, attendanceRecords, leaveRequests } = useGlobal();
  const [activeTab, setActiveTab] = useState<'docs' | 'profile' | 'monitor'>('profile');
  
  // Doc Gen State
  const [selectedDocType, setSelectedDocType] = useState<'Warning' | 'Contract' | 'Probation'>('Warning');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [docDetails, setDocDetails] = useState({
      date: new Date().toISOString().split('T')[0],
      incidentDate: '',
      incidentTime: '',
      misconductDescription: '',
      customClause: ''
  });
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // Monitor State
  const [isAuditing, setIsAuditing] = useState(false);
  const [complianceFlags, setComplianceFlags] = useState<ComplianceFlag[]>([]);

  // Leave Policy State
  const [newPolicy, setNewPolicy] = useState<Partial<LeavePolicy>>({
      name: '', daysPerYear: 0, allowCarryForward: false, maxCarryForwardDays: 0, minNoticeDays: 0, requireDocument: false
  });

  if (currentUser.role === 'Staff' || currentUser.role === 'Manager') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Lock className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">Access Restricted</h2>
        <p className="text-gray-400">You do not have permission to view Legal & Compliance tools.</p>
      </div>
    );
  }

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

  const handleGeneratePDF = () => {
    if (!targetEmployeeId) return addNotification("Please select an employee", "error");
    
    const employee = employees.find(e => e.id === targetEmployeeId);
    if (!employee) return addNotification("Employee not found", "error");

    try {
        const pdfBlobUrl = generateProfessionalPDF(
            selectedDocType,
            companyProfile,
            employee,
            {
                date: docDetails.date,
                incidentDate: docDetails.incidentDate,
                incidentTime: docDetails.incidentTime,
                misconductDescription: docDetails.misconductDescription,
                customClause: docDetails.customClause
            }
        );
        setGeneratedPdfUrl(pdfBlobUrl);
        addNotification("Document Generated Successfully", "success");
    } catch (error) {
        console.error(error);
        addNotification("Failed to generate PDF", "error");
    }
  };

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

  const selectedEmployeeData = employees.find(e => e.id === targetEmployeeId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Compliance & Legal</h2>
        <div className="flex gap-2 p-1 bg-white/10 rounded-xl border border-white/10">
           <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider ${activeTab === 'profile' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}>Company Profile</button>
           <button onClick={() => setActiveTab('docs')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider ${activeTab === 'docs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Document Hub</button>
           <button onClick={() => setActiveTab('monitor')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider ${activeTab === 'monitor' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>AI Monitor</button>
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
                       <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-white/20">
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
                        <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Company Name</label>
                        <NeoInput value={companyProfile.name} onChange={e => updateCompanyProfile({...companyProfile, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Registration No.</label>
                        <NeoInput value={companyProfile.regNo} onChange={e => updateCompanyProfile({...companyProfile, regNo: e.target.value})} />
                    </div>
                    <div>
                        <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Full Address</label>
                        <textarea 
                            value={companyProfile.address} 
                            onChange={e => updateCompanyProfile({...companyProfile, address: e.target.value})}
                            className="w-full h-24 bg-[#0a0a0a] border-2 border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-yellow-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Phone</label>
                            <NeoInput value={companyProfile.phone} onChange={e => updateCompanyProfile({...companyProfile, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Email</label>
                            <NeoInput value={companyProfile.email} onChange={e => updateCompanyProfile({...companyProfile, email: e.target.value})} />
                        </div>
                    </div>
                </div>
             </NeoCard>

             <NeoCard title="Leave Policy Configuration" className="border-l-4 border-l-green-500">
                 <div className="space-y-6">
                     <p className="text-xs text-gray-400">Configure entitlements, rules, and restrictions for employee leave types.</p>
                     
                     <div className="space-y-2">
                         {(companyProfile.leavePolicies || []).map(policy => (
                             <div key={policy.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center group">
                                 <div>
                                     <h4 className="font-bold text-white text-sm">{policy.name}</h4>
                                     <div className="flex gap-2 text-[10px] text-gray-500 uppercase mt-1">
                                         <span>{policy.daysPerYear} Days/Year</span> • 
                                         <span>{policy.minNoticeDays} Days Notice</span> • 
                                         <span>{policy.requireDocument ? 'Doc Req' : 'No Doc'}</span>
                                     </div>
                                 </div>
                                 <button onClick={() => deleteLeavePolicy(policy.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         ))}
                     </div>

                     <div className="p-4 bg-black/40 rounded-xl border border-dashed border-white/20">
                         <h4 className="font-black text-xs uppercase text-gray-400 mb-3">Add New Policy</h4>
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

          {activeTab === 'docs' && (
             <NeoCard title="Onboarding & Issues" className="flex-1 border-l-4 border-l-blue-500">
                <div className="space-y-4">
                  <div>
                    <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Document Type</label>
                    <NeoSelect value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value as any)}>
                      <option value="Contract">Employment Contract (Onboarding)</option>
                      <option value="Probation">Probation Confirmation</option>
                      <option value="Warning">Warning Letter (Misconduct)</option>
                    </NeoSelect>
                  </div>
                  
                  <div>
                    <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Employee</label>
                    <NeoSelect value={targetEmployeeId} onChange={(e) => setTargetEmployeeId(e.target.value)}>
                        <option value="">Select Employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </NeoSelect>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Date of Issue</label>
                        <NeoInput type="date" value={docDetails.date} onChange={e => setDocDetails({...docDetails, date: e.target.value})} />
                     </div>
                     
                     {selectedDocType === 'Warning' && (
                        <div>
                            <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Incident Date</label>
                            <NeoInput type="date" value={docDetails.incidentDate} onChange={e => setDocDetails({...docDetails, incidentDate: e.target.value})} />
                        </div>
                     )}
                  </div>

                  {selectedDocType === 'Warning' && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Misconduct Details</label>
                        <textarea 
                            className="w-full h-32 bg-[#0a0a0a] border-2 border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Describe what happened clearly (e.g. Arrived late 3 times in a row without notice)..."
                            value={docDetails.misconductDescription}
                            onChange={e => setDocDetails({...docDetails, misconductDescription: e.target.value})}
                        />
                      </div>
                  )}

                  {selectedDocType === 'Contract' && selectedEmployeeData && (
                      <div className="animate-in slide-in-from-top-2 space-y-4">
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <p className="text-blue-200 text-xs font-bold mb-2">Data Verification (Will appear in contract):</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                                  <div>
                                     <span className="block text-gray-500">Position</span>
                                     <span className="font-bold text-white">{selectedEmployeeData.role}</span>
                                  </div>
                                  <div>
                                     <span className="block text-gray-500">Department</span>
                                     <span className="font-bold text-white">{selectedEmployeeData.department}</span>
                                  </div>
                                  <div>
                                     <span className="block text-gray-500">Monthly Salary</span>
                                     <span className="font-bold text-white">RM {selectedEmployeeData.baseSalary.toLocaleString()}</span>
                                  </div>
                                  <div>
                                     <span className="block text-gray-500">Start Date</span>
                                     <span className="font-bold text-white">{selectedEmployeeData.joinDate}</span>
                                  </div>
                              </div>
                          </div>
                          
                          <div>
                            <label className="font-black block mb-2 text-gray-400 text-xs uppercase tracking-wider">Custom Clause (Optional)</label>
                            <textarea 
                                className="w-full h-24 bg-[#0a0a0a] border-2 border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-500"
                                placeholder="E.g., 'The Employee is entitled to a relocation allowance of RM 2,000 upon commencement.' (Will be added as Clause 9)"
                                value={docDetails.customClause}
                                onChange={e => setDocDetails({...docDetails, customClause: e.target.value})}
                            />
                          </div>
                      </div>
                  )}

                  <NeoButton onClick={handleGeneratePDF} className="w-full mt-4">
                    <FileText className="w-5 h-5" /> Generate & Preview
                  </NeoButton>
                </div>
             </NeoCard>
          )}

          {activeTab === 'monitor' && (
              <NeoCard title="AI Policy Monitor" className="flex-1 border-l-4 border-l-red-500">
                  <div className="space-y-6">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4 items-start">
                          <BrainCircuit className="w-8 h-8 text-red-500 shrink-0" />
                          <div>
                              <h4 className="font-bold text-white text-sm mb-1">Automated Compliance Scan</h4>
                              <p className="text-xs text-gray-300 leading-relaxed">
                                  Gemini AI scans all attendance records, leave requests, and employee profiles against the 
                                  <span className="text-white font-bold"> Employment Act 1955</span> and 
                                  <span className="text-white font-bold"> Company SOPs</span>. 
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
                                      p-4 rounded-xl border-l-4 bg-[#1a1a1a] shadow-md
                                      ${flag.severity === 'Critical' ? 'border-l-red-500' : flag.severity === 'Warning' ? 'border-l-yellow-500' : 'border-l-blue-500'}
                                  `}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                              {flag.severity === 'Critical' ? <Siren className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                              <span className="font-black text-sm text-white uppercase">{flag.issue}</span>
                                          </div>
                                          <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-400">{flag.severity}</span>
                                      </div>
                                      <div className="text-xs text-gray-300 mb-2">
                                          <span className="font-bold text-white">{flag.employeeName}</span> - {flag.actionItem}
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
                              <ShieldCheck className="w-16 h-16 mx-auto mb-2 text-white" />
                              <p className="font-bold uppercase tracking-widest text-white">System Compliant</p>
                          </div>
                      )}
                  </div>
              </NeoCard>
          )}

        </div>

        {/* RIGHT PANEL - PREVIEW */}
        <div className="bg-[#222] rounded-3xl p-8 border border-white/10 relative shadow-2xl flex flex-col items-center justify-center min-h-[600px] overflow-hidden">
             {generatedPdfUrl && activeTab !== 'monitor' ? (
                 <div className="w-full h-full flex flex-col animate-in zoom-in-95 duration-300">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-white font-bold uppercase tracking-wider">PDF Ready</h3>
                         <a href={generatedPdfUrl} download={`${selectedDocType}_${targetEmployeeId}.pdf`} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                             <Download className="w-4 h-4" /> Download PDF
                         </a>
                     </div>
                     <iframe src={generatedPdfUrl} className="w-full flex-1 rounded-xl shadow-2xl border-none bg-white" title="PDF Preview"></iframe>
                 </div>
             ) : activeTab === 'monitor' ? (
                 <div className="w-full h-full p-4 flex flex-col">
                     <h3 className="text-white font-black uppercase tracking-wider mb-6">Regional Compliance Context</h3>
                     
                     <div className="grid grid-cols-1 gap-4 overflow-y-auto">
                         <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                             <div className="flex items-center gap-3 mb-2 text-blue-400">
                                 <Clock className="w-5 h-5" />
                                 <h4 className="font-bold uppercase">Working Hours (Malaysia)</h4>
                             </div>
                             <p className="text-sm text-gray-400 leading-relaxed">
                                 Per Employment Act 2022 Amendment, maximum working hours are reduced from 48 to <span className="text-white font-bold">45 hours/week</span>. 
                                 Overtime (OT) is capped at 104 hours/month.
                             </p>
                         </div>

                         <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                             <div className="flex items-center gap-3 mb-2 text-green-400">
                                 <Check className="w-5 h-5" />
                                 <h4 className="font-bold uppercase">Friday Prayers (SOP)</h4>
                             </div>
                             <p className="text-sm text-gray-400 leading-relaxed">
                                 Standard practice in Malaysia/Indonesia: Lunch break is extended on Fridays (12:30 PM - 2:30 PM) to accommodate Solat Jumaat. The AI ignores "Late after lunch" flags during this window.
                             </p>
                         </div>

                         <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                             <div className="flex items-center gap-3 mb-2 text-yellow-400">
                                 <FileText className="w-5 h-5" />
                                 <h4 className="font-bold uppercase">Payslip Regulations</h4>
                             </div>
                             <p className="text-sm text-gray-400 leading-relaxed">
                                 Regulation 5 (Employment Regulations 1957) requires distinct separation of Basic Wages, Allowances (Travel/Meal), Overtime Rates (1.5x/2.0x/3.0x), and Statutory Deductions (EPF/SOCSO/EIS/PCB).
                             </p>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="text-center opacity-30">
                     <Building2 className="w-24 h-24 mx-auto mb-4 text-white" />
                     <p className="text-white font-bold text-xl uppercase tracking-widest">Document Preview Area</p>
                     <p className="text-gray-400 text-sm mt-2">Generated PDFs will appear here automatically.</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};
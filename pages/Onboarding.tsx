

import React, { useState } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoBadge } from '../components/NeoComponents';
import { CheckCircle, Upload, FileText, UserCheck, ArrowRight, ShieldCheck, Gift, Award, Lock, BookOpen } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

export const Onboarding: React.FC = () => {
  const { currentUser, employees, updateEmployee, updateOnboardingStep, addNotification } = useGlobal();
  
  // Find current employee record based on login
  const emp = employees.find(e => e.id === currentUser.id);
  const currentStep = emp?.onboardingStep || 0;

  // Form States
  const [bankDetails, setBankDetails] = useState({
      bankName: emp?.bankName || '',
      bankAccount: emp?.bankAccount || '',
      epfNo: emp?.epfNo || '',
      taxNo: emp?.taxNo || ''
  });
  
  const [handbookAgreed, setHandbookAgreed] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  if (!emp) return <div className="p-10 text-center text-white">Error: User profile not linked to employee record.</div>;

  const handleStep1Save = () => {
     if (!bankDetails.bankName || !bankDetails.bankAccount) return addNotification("Please fill in bank details", "error");
     
     updateEmployee({ ...emp, ...bankDetails, onboardingStep: 1 });
     updateOnboardingStep(emp.id, 1);
  };

  const handleFileUpload = (type: 'nric' | 'certificates', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(type);
      const reader = new FileReader();
      reader.onloadend = () => {
         const currentDocs = emp.documents || {};
         const newDocs = { ...currentDocs, [type]: reader.result as string };
         updateEmployee({ ...emp, documents: newDocs });
         addNotification(`${type === 'nric' ? 'ID' : 'Certificate'} uploaded successfully.`, "success");
         setIsUploading(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentsContinue = () => {
      // Basic validation: Require at least one doc if this was real, but soft check here
      if (!emp.documents?.nric) {
          addNotification("Please upload your NRIC/Passport copy first.", "error");
          return;
      }
      updateOnboardingStep(emp.id, 2);
  };

  const handleStep3Agree = () => {
      if (!handbookAgreed) return addNotification("Please agree to the handbook policies", "error");
      updateOnboardingStep(emp.id, 3);
  };

  const handleFinish = () => {
      updateOnboardingStep(emp.id, 4); // Complete
  };

  const steps = [
      { title: "Profile Setup", icon: UserCheck, desc: "Verify Personal & Banking Info" },
      { title: "Documents", icon: Upload, desc: "Upload IC & Certificates" },
      { title: "Handbook", icon: BookOpen, desc: "Review Company Policies" },
      { title: "Complete", icon: Award, desc: "You are all set!" }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
       {/* Header */}
       <div className="mb-10 text-center">
           <div className="inline-block p-4 rounded-full bg-pink-600/20 border border-pink-500/50 mb-4 animate-pulse">
               <Gift className="w-8 h-8 text-pink-500" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tighter mb-4">Welcome to the Team!</h1>
           <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
               We're excited to have you on board, <span className="text-black dark:text-white font-bold">{emp.name}</span>. 
               Please complete these 4 steps to finalize your employment setup.
           </p>
       </div>

       {/* Progress Bar */}
       <div className="relative flex justify-between items-center mb-12 max-w-3xl mx-auto px-4">
           {/* Line */}
           <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 dark:bg-white/10 -z-10"></div>
           <div className="absolute top-1/2 left-0 h-1 bg-pink-500 -z-10 transition-all duration-500" style={{ width: `${(currentStep / 3) * 100}%` }}></div>

           {steps.map((s, idx) => {
               const isActive = idx === currentStep;
               const isCompleted = idx < currentStep;
               const Icon = s.icon;
               return (
                   <div key={idx} className="flex flex-col items-center gap-2">
                       <div className={`
                           w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-all z-10
                           ${isCompleted ? 'bg-green-500 border-green-500' : isActive ? 'bg-pink-600 border-pink-500 shadow-[0_0_20px_#db2777]' : 'bg-gray-200 dark:bg-[#121212] border-gray-400 dark:border-white/20'}
                       `}>
                           {isCompleted ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />}
                       </div>
                       <span className={`hidden md:block text-xs font-bold uppercase tracking-widest ${isActive ? 'text-pink-600 dark:text-white' : 'text-gray-500'}`}>{s.title}</span>
                   </div>
               );
           })}
       </div>

       {/* Content Card */}
       <div className="bg-white dark:bg-[#121212] border-2 border-black/10 dark:border-white/10 rounded-3xl p-6 md:p-12 shadow-glossy-card min-h-[500px] flex flex-col relative overflow-hidden transition-colors duration-300">
           
           {/* Step 0: Profile */}
           {currentStep === 0 && (
               <div className="animate-in fade-in slide-in-from-right duration-500 space-y-6 max-w-2xl mx-auto w-full">
                   <div className="text-center mb-8">
                       <h2 className="text-3xl font-black text-black dark:text-white uppercase">Banking & Statutory</h2>
                       <p className="text-gray-500 dark:text-gray-400">We need this for your payroll processing.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="text-xs text-gray-500 font-black uppercase mb-2 block">Bank Name</label>
                           <NeoInput placeholder="e.g. Maybank" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
                       </div>
                       <div>
                           <label className="text-xs text-gray-500 font-black uppercase mb-2 block">Account Number</label>
                           <NeoInput placeholder="e.g. 1122334455" value={bankDetails.bankAccount} onChange={e => setBankDetails({...bankDetails, bankAccount: e.target.value})} />
                       </div>
                       <div>
                           <label className="text-xs text-gray-500 font-black uppercase mb-2 block">EPF No. (KWSP)</label>
                           <NeoInput placeholder="e.g. 12345678" value={bankDetails.epfNo} onChange={e => setBankDetails({...bankDetails, epfNo: e.target.value})} />
                       </div>
                       <div>
                           <label className="text-xs text-gray-500 font-black uppercase mb-2 block">Income Tax No. (LHDN)</label>
                           <NeoInput placeholder="e.g. OG12345678" value={bankDetails.taxNo} onChange={e => setBankDetails({...bankDetails, taxNo: e.target.value})} />
                       </div>
                   </div>

                   <div className="pt-8 flex justify-end">
                       <NeoButton onClick={handleStep1Save} className="bg-pink-600 border-pink-400 hover:bg-pink-500">
                           Save & Continue <ArrowRight className="w-5 h-5" />
                       </NeoButton>
                   </div>
               </div>
           )}

           {/* Step 1: Uploads */}
           {currentStep === 1 && (
               <div className="animate-in fade-in slide-in-from-right duration-500 space-y-8 max-w-2xl mx-auto w-full text-center">
                    <div className="mb-8">
                       <h2 className="text-3xl font-black text-black dark:text-white uppercase">Document Submission</h2>
                       <p className="text-gray-500 dark:text-gray-400">Please upload clear copies of the following.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* NRIC Upload */}
                       <label className={`
                           border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group relative overflow-hidden
                           ${emp.documents?.nric ? 'border-green-500 bg-green-500/5' : 'border-gray-300 dark:border-white/20 hover:border-pink-500 hover:bg-pink-500/5'}
                       `}>
                           <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload('nric', e)} />
                           <div className="relative z-10">
                               <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-500/20">
                                   {emp.documents?.nric ? <CheckCircle className="w-8 h-8 text-green-500" /> : <FileText className="w-8 h-8 text-gray-400 group-hover:text-pink-400" />}
                               </div>
                               <h3 className="text-black dark:text-white font-bold mb-1">NRIC / Passport Copy</h3>
                               <p className="text-xs text-gray-500">{emp.documents?.nric ? 'Uploaded Successfully' : 'Front and Back (Click to Browse)'}</p>
                           </div>
                           {isUploading === 'nric' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">Uploading...</div>}
                       </label>
                       
                       {/* Cert Upload */}
                       <label className={`
                           border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group relative overflow-hidden
                           ${emp.documents?.certificates ? 'border-green-500 bg-green-500/5' : 'border-gray-300 dark:border-white/20 hover:border-pink-500 hover:bg-pink-500/5'}
                       `}>
                           <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload('certificates', e)} />
                           <div className="relative z-10">
                               <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-500/20">
                                   {emp.documents?.certificates ? <CheckCircle className="w-8 h-8 text-green-500" /> : <Award className="w-8 h-8 text-gray-400 group-hover:text-pink-400" />}
                               </div>
                               <h3 className="text-black dark:text-white font-bold mb-1">Certificates</h3>
                               <p className="text-xs text-gray-500">{emp.documents?.certificates ? 'Uploaded Successfully' : 'Academic / Professional (Click to Browse)'}</p>
                           </div>
                           {isUploading === 'certificates' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">Uploading...</div>}
                       </label>
                   </div>

                   <div className="pt-8 flex justify-center">
                       <NeoButton onClick={handleDocumentsContinue} className="bg-pink-600 border-pink-400 hover:bg-pink-500">
                           Save & Continue <ArrowRight className="w-5 h-5 ml-2" />
                       </NeoButton>
                   </div>
               </div>
           )}

           {/* Step 2: Handbook */}
           {currentStep === 2 && (
               <div className="animate-in fade-in slide-in-from-right duration-500 space-y-6 h-full flex flex-col">
                   <div className="text-center mb-4">
                       <h2 className="text-3xl font-black text-black dark:text-white uppercase">Company Handbook</h2>
                       <p className="text-gray-500 dark:text-gray-400">Please read and acknowledge the following policies.</p>
                   </div>
                   
                   <div className="flex-1 bg-gray-50 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl p-6 overflow-y-auto max-h-[300px] text-sm text-gray-700 dark:text-gray-300 space-y-4">
                       <h3 className="text-black dark:text-white font-bold text-lg">1. Code of Conduct</h3>
                       <p>All employees are expected to maintain professionalism, integrity, and respect in the workplace. Harassment of any kind will not be tolerated.</p>
                       
                       <h3 className="text-black dark:text-white font-bold text-lg">2. Working Hours</h3>
                       <p>Standard working hours are 9:00 AM to 6:00 PM, Monday to Friday. Punctuality is monitored via the PUNCHCLOCK system.</p>
                       
                       <h3 className="text-black dark:text-white font-bold text-lg">3. Confidentiality</h3>
                       <p>Employees must not disclose sensitive company data to external parties. Violation of this policy may lead to termination.</p>
                       
                       <h3 className="text-black dark:text-white font-bold text-lg">4. Leave Policy</h3>
                       <p>Annual leave entitlement is 12 days per year. Medical certificates must be submitted within 24 hours of absence.</p>
                   </div>

                   <div className="pt-4 flex flex-col items-center gap-4">
                       <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                           <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${handbookAgreed ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                               {handbookAgreed && <CheckCircle className="w-4 h-4 text-white" />}
                           </div>
                           <input type="checkbox" className="hidden" checked={handbookAgreed} onChange={e => setHandbookAgreed(e.target.checked)} />
                           <span className="text-black dark:text-white font-bold">I have read and agree to the Company Handbook & Policies.</span>
                       </label>
                       
                       <NeoButton onClick={handleStep3Agree} disabled={!handbookAgreed} className={handbookAgreed ? 'bg-pink-600 border-pink-400' : 'opacity-50 cursor-not-allowed'}>
                           Acknowledge & Sign <ShieldCheck className="w-5 h-5 ml-2" />
                       </NeoButton>
                   </div>
               </div>
           )}

           {/* Step 3: Complete */}
           {currentStep >= 3 && (
               <div className="animate-in zoom-in duration-500 flex flex-col items-center justify-center h-full text-center">
                   <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_#22c55e]">
                       <CheckCircle className="w-20 h-20 text-white" />
                   </div>
                   <h2 className="text-5xl font-black text-black dark:text-white uppercase tracking-tighter mb-4">You're All Set!</h2>
                   <p className="text-xl text-gray-500 dark:text-gray-300 max-w-lg mb-10">
                       Thank you for completing the onboarding process. Your profile is now active and you can access all staff features.
                   </p>
                   
                   {currentStep === 3 ? (
                       <NeoButton onClick={handleFinish} className="bg-white text-black hover:bg-gray-200 border-black dark:border-white text-lg px-10 py-4">
                           Go to Dashboard <ArrowRight className="w-6 h-6 ml-2" />
                       </NeoButton>
                   ) : (
                       <div className="bg-green-100 dark:bg-white/10 px-6 py-3 rounded-full text-green-600 dark:text-green-400 font-bold border border-green-500/30">
                           Onboarding Status: COMPLETED
                       </div>
                   )}
               </div>
           )}

       </div>
    </div>
  );
};
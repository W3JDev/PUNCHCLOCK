
import React, { useState, useRef } from 'react';
import { NeoButton, NeoInput, NeoSelect, NeoBadge, NeoModal, NeoCheckbox } from '../components/NeoComponents';
import { FileText, Download, CheckCircle, UploadCloud, Trash2, PenTool, Eraser, Type, Filter, Search, Plus, Printer, RefreshCw, Briefcase, UserCheck, AlertTriangle, LogOut, FileBadge, Eye, Loader2, Sparkles } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { CompanyDocument, DocumentCategory, Employee } from '../types';
import { generateHRDocument } from '../services/geminiService';

// --- A-Z LIFECYCLE TEMPLATE LIBRARY (METADATA ONLY) ---
// Actual content is now generated dynamically by AI for maximum robustness
const TEMPLATE_LIBRARY: Record<string, { title: string, category: DocumentCategory, hint: string }> = {
    'OFFER_LETTER': {
        title: 'Official Job Offer',
        category: 'Recruitment',
        hint: 'Standard employment offer including probation, salary, and benefits.'
    },
    'NDA': {
        title: 'Non-Disclosure Agreement',
        category: 'Onboarding',
        hint: 'Strict confidentiality regarding trade secrets and client data.'
    },
    'CONFIRMATION': {
        title: 'Confirmation of Employment',
        category: 'Performance',
        hint: 'Letter confirming successful completion of probation period.'
    },
    'WARNING_LETTER': {
        title: 'Disciplinary Warning',
        category: 'Disciplinary',
        hint: 'Formal warning for misconduct/lateness citing Employment Act 1955.'
    },
    'INCREMENT': {
        title: 'Salary Increment Notice',
        category: 'Performance',
        hint: 'Official notice of salary revision and performance bonus.'
    },
    'RESIGNATION_ACCEPTANCE': {
        title: 'Acceptance of Resignation',
        category: 'Offboarding',
        hint: 'Formal acceptance of resignation and final date calculation.'
    }
};

const CATEGORIES: { id: DocumentCategory | 'All', label: string, icon: any }[] = [
    { id: 'All', label: 'All Files', icon: FileBadge },
    { id: 'Recruitment', label: 'Recruitment', icon: UserCheck },
    { id: 'Onboarding', label: 'Onboarding', icon: Briefcase },
    { id: 'Policy', label: 'Policies', icon: FileText },
    { id: 'Performance', label: 'Performance', icon: UploadCloud },
    { id: 'Disciplinary', label: 'Disciplinary', icon: AlertTriangle },
    { id: 'Offboarding', label: 'Offboarding', icon: LogOut },
];

export const Documents: React.FC = () => {
  const { currentUser, documents, addDocument, updateDocument, employees, addNotification, companyProfile } = useGlobal();
  
  // UI State
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Creation Flow
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creationStep, setCreationStep] = useState<'Type' | 'Details'>('Type');
  const [newDocData, setNewDocData] = useState<{
      templateKey: string;
      targetEmployeeId: string;
      customTitle: string;
      customContext: string; // New field for specific instructions
      isRecurring: boolean;
      recurrenceInterval: 'Yearly' | 'Monthly';
  }>({
      templateKey: '',
      targetEmployeeId: '',
      customTitle: '',
      customContext: '',
      isRecurring: false,
      recurrenceInterval: 'Yearly'
  });

  // Signing State
  const [signingDoc, setSigningDoc] = useState<CompanyDocument | null>(null);
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- FILTERING ---
  const filteredDocs = documents.filter(d => {
      // 1. Role Filter
      const hasAccess = 
          currentUser?.role === 'Admin' || 
          currentUser?.role === 'HR' || 
          d.assignedTo === currentUser?.id || 
          d.assignedTo === 'ALL' || 
          d.assignedTo === `ROLE:${currentUser?.role}`;
      
      if (!hasAccess) return false;

      // 2. Category Filter
      if (activeCategory !== 'All' && d.category !== activeCategory) return false;

      // 3. Search Filter
      if (searchTerm && !d.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
  }).sort((a,b) => new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime());

  // --- GENERATION LOGIC ---
  const handleGenerate = async () => {
      if (!newDocData.templateKey && !newDocData.customTitle) return addNotification("Please select a template or enter a title", "error");
      
      const emp = employees.find(e => e.id === newDocData.targetEmployeeId);
      
      setIsGenerating(true);
      let finalContent = "";
      let finalTitle = newDocData.customTitle;
      let finalCategory: DocumentCategory = 'Policy';

      try {
          if (newDocData.templateKey) {
              const template = TEMPLATE_LIBRARY[newDocData.templateKey];
              finalTitle = `${template.title} - ${emp?.name || 'General'}`;
              finalCategory = template.category;
              
              // CALL AI ENGINE
              finalContent = await generateHRDocument(template.title, {
                  company: companyProfile,
                  employee: emp,
                  additionalDetails: newDocData.customContext || template.hint
              });
          } else {
              // Custom Document
              finalContent = await generateHRDocument(newDocData.customTitle, {
                  company: companyProfile,
                  employee: emp,
                  additionalDetails: newDocData.customContext
              });
          }

          // Calculate Expiry if Recurring
          let expiryDate: string | undefined = undefined;
          if (newDocData.isRecurring) {
              const now = new Date();
              if (newDocData.recurrenceInterval === 'Yearly') now.setFullYear(now.getFullYear() + 1);
              if (newDocData.recurrenceInterval === 'Monthly') now.setMonth(now.getMonth() + 1);
              expiryDate = now.toISOString().split('T')[0];
          }

          addDocument({
              id: Math.random().toString(36).substr(2, 9),
              title: finalTitle,
              category: finalCategory,
              type: 'Contract', 
              content: finalContent,
              assignedTo: newDocData.targetEmployeeId || 'ALL',
              assignedBy: currentUser?.name || 'System',
              dateUploaded: new Date().toISOString().split('T')[0],
              status: 'Pending',
              isRecurring: newDocData.isRecurring,
              recurrenceInterval: newDocData.isRecurring ? newDocData.recurrenceInterval : undefined,
              expiryDate: expiryDate
          });

          addNotification("Document generated successfully.", "success");
          setIsCreatorOpen(false);
          // Reset
          setNewDocData({ templateKey: '', targetEmployeeId: '', customTitle: '', customContext: '', isRecurring: false, recurrenceInterval: 'Yearly' });
          setCreationStep('Type');

      } catch (error) {
          addNotification("Generation failed. Please try again.", "error");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              addDocument({
                  id: Math.random().toString(36).substr(2, 9),
                  title: file.name,
                  category: 'Policy',
                  type: 'Memo',
                  url: reader.result as string,
                  assignedTo: 'ALL',
                  assignedBy: currentUser?.name || 'System',
                  dateUploaded: new Date().toISOString().split('T')[0],
                  status: 'Pending'
              });
              addNotification("File uploaded.", "success");
              setIsCreatorOpen(false);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- SIGNING LOGIC ---
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX, clientY;
      
      if ((e as React.TouchEvent).touches && (e as React.TouchEvent).touches.length > 0) {
          clientX = (e as React.TouchEvent).touches[0].clientX;
          clientY = (e as React.TouchEvent).touches[0].clientY;
      } else if ((e as React.TouchEvent).changedTouches && (e as React.TouchEvent).changedTouches.length > 0) {
          // For touch end
          clientX = (e as React.TouchEvent).changedTouches[0].clientX;
          clientY = (e as React.TouchEvent).changedTouches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      // e.preventDefault(); // Don't prevent default here to allow scrolling if not on canvas?
      // Actually better to prevent default for touch to stop scroll
      if(e.type.startsWith('touch')) e.preventDefault();

      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const { x, y } = getCoordinates(e);
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000000';
      ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !canvasRef.current) return;
      if(e.type.startsWith('touch')) e.preventDefault();
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDrawing = () => { setIsDrawing(false); canvasRef.current?.getContext('2d')?.closePath(); };
  const clearCanvas = () => { canvasRef.current?.getContext('2d')?.clearRect(0, 0, 500, 200); };

  const submitSignature = () => {
      if (!signingDoc) return;
      let signatureData = '';
      if (signMode === 'draw' && canvasRef.current) signatureData = canvasRef.current.toDataURL();
      else {
          if (!typedSignature.trim()) return addNotification("Please type name", "error");
          signatureData = `TEXT:${typedSignature}`;
      }
      updateDocument(signingDoc.id, { status: 'Signed', signature: signatureData, signedDate: new Date().toISOString() });
      addNotification("Document Signed & Locked", "success");
      setSigningDoc(null); setTypedSignature('');
  };

  // --- PRINTING LOGIC ---
  const handlePrint = () => {
      const printWindow = window.open('', '', 'height=600,width=800');
      if(printWindow && signingDoc?.content) {
          printWindow.document.write('<html><head><title>Print</title>');
          printWindow.document.write('<style>body{font-family:serif; padding:40px; line-height:1.6;}</style>');
          printWindow.document.write('</head><body>');
          if(companyProfile.logoUrl) printWindow.document.write(`<img src="${companyProfile.logoUrl}" width="100" style="margin-bottom:20px"/>`);
          printWindow.document.write(signingDoc.content);
          if(signingDoc.status === 'Signed') {
              printWindow.document.write('<br/><br/><div style="border-top:1px solid #000; display:inline-block; padding-top:10px; margin-top:40px"><strong>Digitally Signed</strong><br/>Date: ' + new Date(signingDoc.signedDate || '').toLocaleDateString() + '</div>');
          }
          printWindow.document.write('</body></html>');
          printWindow.document.close();
          printWindow.print();
      }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
       
       {/* SIDEBAR FILTER */}
       <div className="w-64 flex flex-col gap-2 shrink-0 overflow-y-auto">
           <NeoButton onClick={() => { setIsCreatorOpen(true); setCreationStep('Type'); }} className="mb-4">
               <Plus className="w-5 h-5 mr-2" /> New Document
           </NeoButton>
           
           <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2 mb-2">Lifecycle</h3>
           {CATEGORIES.map(cat => (
               <button 
                 key={cat.id} 
                 onClick={() => setActiveCategory(cat.id as any)}
                 className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                    ${activeCategory === cat.id 
                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}
                 `}
               >
                   <cat.icon className="w-4 h-4" /> {cat.label}
               </button>
           ))}
       </div>

       {/* MAIN CONTENT */}
       <div className="flex-1 flex flex-col gap-6">
           
           {/* Header / Stats */}
           <div className="flex justify-between items-center bg-white dark:bg-[#121212] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
               <div>
                   <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Document Hub</h2>
                   <p className="text-sm text-gray-500">Managing {filteredDocs.length} files across lifecycle.</p>
               </div>
               <div className="flex gap-4">
                   <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                         placeholder="Search docs..." 
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
                       />
                   </div>
               </div>
           </div>

           {/* Document Grid/List */}
           <div className="flex-1 overflow-y-auto pr-2">
               {filteredDocs.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                       <FileText className="w-16 h-16 mb-4" />
                       <p className="font-bold">No documents found in this category.</p>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 gap-3">
                       {filteredDocs.map(doc => (
                           <div key={doc.id} className="group bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                   <div className={`
                                       w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                                       ${doc.status === 'Signed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                                   `}>
                                       {doc.type === 'Contract' ? <Briefcase className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                                   </div>
                                   <div>
                                       <h4 className="font-bold text-black dark:text-white text-base">{doc.title}</h4>
                                       <div className="flex gap-2 text-xs text-gray-500 mt-1 items-center">
                                           <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{doc.category}</span>
                                           <span>• {doc.dateUploaded}</span>
                                           {doc.expiryDate && <span className="text-red-500 font-bold">• Exp: {doc.expiryDate}</span>}
                                           {doc.isRecurring && <span className="flex items-center gap-1 text-orange-500"><RefreshCw className="w-3 h-3"/> {doc.recurrenceInterval}</span>}
                                       </div>
                                   </div>
                               </div>

                               <div className="flex items-center gap-2">
                                   {doc.status === 'Signed' && <NeoBadge variant="success">Signed</NeoBadge>}
                                   {doc.status === 'Pending' && <NeoBadge variant="warning">Pending</NeoBadge>}
                                   
                                   <NeoButton variant="ghost" onClick={() => setSigningDoc(doc)} className="text-xs py-2 px-3">
                                       {doc.status === 'Signed' ? <Eye className="w-4 h-4 mr-2"/> : <PenTool className="w-4 h-4 mr-2"/>}
                                       {doc.status === 'Signed' ? 'View' : 'Sign/View'}
                                   </NeoButton>
                                   
                                   {(currentUser?.role === 'Admin' || currentUser?.role === 'HR') && (
                                       <button onClick={() => updateDocument(doc.id, {status: 'Read'}) /* Mock Delete for now */} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                           <Trash2 className="w-4 h-4"/>
                                       </button>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       </div>

       {/* CREATOR MODAL */}
       <NeoModal isOpen={isCreatorOpen} onClose={() => setIsCreatorOpen(false)} title="Document Factory">
           {creationStep === 'Type' ? (
               <div className="grid grid-cols-2 gap-4">
                   <div onClick={() => setCreationStep('Details')} className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group">
                       <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><Sparkles className="w-8 h-8"/></div>
                       <h3 className="font-bold text-center">AI Generator</h3>
                       <p className="text-xs text-center text-gray-500">Draft professional legal documents using Gemini 2.5 Flash.</p>
                   </div>
                   <label className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer flex flex-col items-center justify-center gap-4 transition-all relative group">
                       <input type="file" onChange={handleUpload} className="hidden" />
                       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform"><UploadCloud className="w-8 h-8"/></div>
                       <h3 className="font-bold text-center">Upload File</h3>
                       <p className="text-xs text-center text-gray-500">Upload existing PDF/Images for digital signing.</p>
                   </label>
               </div>
           ) : (
               <div className="space-y-4">
                   <div>
                       <label className="text-xs font-black uppercase text-gray-500 mb-1 block">Document Type</label>
                       <NeoSelect value={newDocData.templateKey} onChange={e => setNewDocData({...newDocData, templateKey: e.target.value})}>
                           <option value="">-- Custom Document --</option>
                           {Object.entries(TEMPLATE_LIBRARY).map(([key, tpl]) => (
                               <option key={key} value={key}>{tpl.title} ({tpl.category})</option>
                           ))}
                       </NeoSelect>
                   </div>

                   {!newDocData.templateKey && (
                       <div className="animate-in slide-in-from-top-2">
                           <label className="text-xs font-black uppercase text-gray-500 mb-1 block">Custom Title</label>
                           <NeoInput value={newDocData.customTitle} onChange={e => setNewDocData({...newDocData, customTitle: e.target.value})} placeholder="e.g. Internship Agreement" />
                       </div>
                   )}
                   
                   <div>
                       <label className="text-xs font-black uppercase text-gray-500 mb-1 block">Assign To Employee</label>
                       <NeoSelect value={newDocData.targetEmployeeId} onChange={e => setNewDocData({...newDocData, targetEmployeeId: e.target.value})}>
                           <option value="">-- Select Staff --</option>
                           {employees.map(e => (
                               <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                           ))}
                       </NeoSelect>
                   </div>

                   <div>
                       <label className="text-xs font-black uppercase text-gray-500 mb-1 block">Specific Instructions (Optional)</label>
                       <textarea 
                           className="w-full bg-white dark:bg-black border-2 border-gray-300 dark:border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                           rows={3}
                           placeholder="E.g. Add a clause about remote work..."
                           value={newDocData.customContext}
                           onChange={e => setNewDocData({...newDocData, customContext: e.target.value})}
                       />
                   </div>

                   <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                       <NeoCheckbox 
                           label="Recurring Document?" 
                           checked={newDocData.isRecurring} 
                           onChange={c => setNewDocData({...newDocData, isRecurring: c})} 
                       />
                       {newDocData.isRecurring && (
                           <div className="mt-2 ml-7">
                               <NeoSelect value={newDocData.recurrenceInterval} onChange={e => setNewDocData({...newDocData, recurrenceInterval: e.target.value as any})}>
                                   <option value="Yearly">Renew Yearly</option>
                                   <option value="Monthly">Renew Monthly</option>
                               </NeoSelect>
                           </div>
                       )}
                   </div>

                   <div className="flex gap-2 pt-4">
                       <NeoButton variant="ghost" onClick={() => setCreationStep('Type')} className="flex-1 text-gray-500">Back</NeoButton>
                       <NeoButton onClick={handleGenerate} className="flex-1" disabled={isGenerating}>
                           {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                           {isGenerating ? 'Drafting...' : 'Generate & Assign'}
                       </NeoButton>
                   </div>
               </div>
           )}
       </NeoModal>

       {/* SIGNING / VIEWING MODAL */}
       <NeoModal isOpen={!!signingDoc} onClose={() => setSigningDoc(null)} title={signingDoc?.title || 'Document'}>
           <div className="space-y-6">
               
               {/* Document Preview Area */}
               <div className="bg-gray-50 dark:bg-white p-8 rounded-xl border border-gray-300 shadow-inner min-h-[400px] max-h-[600px] overflow-y-auto text-black">
                   {signingDoc?.url ? (
                       <iframe src={signingDoc.url} className="w-full h-[500px]" title="Doc Preview"></iframe>
                   ) : signingDoc?.content ? (
                       <div className="prose max-w-none font-serif leading-relaxed" dangerouslySetInnerHTML={{ __html: signingDoc.content }}></div>
                   ) : (
                       <div className="text-center pt-20 text-gray-400">Content unavailable</div>
                   )}
                   
                   {/* Render Signature if Signed */}
                   {signingDoc?.status === 'Signed' && signingDoc.signature && (
                       <div className="mt-12 pt-6 border-t-2 border-black/10 flex justify-between items-end break-inside-avoid">
                           <div>
                               <p className="text-xs font-bold uppercase text-gray-500 mb-2">Signed By:</p>
                               {signingDoc.signature.startsWith('TEXT:') ? (
                                   <p className="font-script text-3xl text-blue-900 italic">{signingDoc.signature.replace('TEXT:', '')}</p>
                               ) : (
                                   <img src={signingDoc.signature} alt="Sig" className="h-20" />
                               )}
                               <p className="text-[10px] text-gray-400 mt-1">Date: {new Date(signingDoc.signedDate || '').toLocaleString()}</p>
                           </div>
                           <div className="text-right">
                               <div className="w-24 h-24 border-4 border-double border-green-600 rounded-full flex items-center justify-center transform -rotate-12 opacity-80">
                                   <span className="text-green-800 font-black uppercase text-xs text-center leading-tight">Digitally<br/>Signed<br/>Verified</span>
                               </div>
                           </div>
                       </div>
                   )}
               </div>

               {/* Action Toolbar */}
               <div className="flex justify-between items-center">
                   <button onClick={handlePrint} className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white font-bold text-xs uppercase">
                       <Printer className="w-4 h-4"/> Print Copy
                   </button>
                   <div className="text-xs text-gray-400">ID: {signingDoc?.id}</div>
               </div>

               {/* Signing Interface (Only if Pending) */}
               {signingDoc?.status === 'Pending' && (
                   <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                       <h4 className="font-bold text-sm mb-4 uppercase">Sign this document</h4>
                       
                       <div className="flex gap-2 mb-4">
                           <button onClick={() => setSignMode('draw')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${signMode === 'draw' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-500'}`}>Draw</button>
                           <button onClick={() => setSignMode('type')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${signMode === 'type' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-500'}`}>Type</button>
                       </div>

                       {signMode === 'draw' ? (
                           <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl relative h-40 touch-none overflow-hidden">
                               <canvas 
                                   ref={canvasRef} 
                                   width={500} 
                                   height={160} 
                                   className="w-full h-full cursor-crosshair"
                                   style={{ touchAction: 'none' }}
                                   onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                   onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                               />
                               <button onClick={clearCanvas} className="absolute top-2 right-2 p-1 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"><Eraser className="w-4 h-4"/></button>
                               <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 pointer-events-none">Sign above</div>
                           </div>
                       ) : (
                           <input 
                               type="text" 
                               value={typedSignature} 
                               onChange={e => setTypedSignature(e.target.value)} 
                               placeholder="Type your full name to sign..."
                               className="w-full p-4 text-center text-3xl font-serif italic border-b-2 border-gray-300 bg-transparent focus:border-blue-600 outline-none placeholder-gray-300"
                           />
                       )}

                       <NeoButton onClick={submitSignature} className="w-full mt-4">Confirm & Sign</NeoButton>
                   </div>
               )}
           </div>
       </NeoModal>

    </div>
  );
};

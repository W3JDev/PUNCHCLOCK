
import React, { useState } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoSelect } from '../components/NeoComponents';
import { Building2, FileText, Calendar, Plus, Trash2, Save, Image, Upload, Sparkles, Loader2, RefreshCw, Settings } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { CompanyEvent } from '../types';
import { generateHRDocument, generateDashboardWallpaper } from '../services/geminiService';

export const Organization: React.FC = () => {
  const { currentUser, companyProfile, updateCompanyProfile, events, addEvent, deleteEvent, addNotification } = useGlobal();
  const [activeTab, setActiveTab] = useState<'branding' | 'policy' | 'events' | 'rules'>('branding');
  const [newEvent, setNewEvent] = useState<Partial<CompanyEvent>>({ type: 'Meeting' });
  const [isGeneratingPolicy, setIsGeneratingPolicy] = useState(false);
  const [policyTopic, setPolicyTopic] = useState('');
  
  const [isGeneratingWallpaper, setIsGeneratingWallpaper] = useState(false);
  const [wallpaperPrompt, setWallpaperPrompt] = useState('Abstract circuit lines and geometric blocks representing data flow');

  // Access Control
  if (currentUser?.role === 'Staff' || currentUser?.role === 'Manager') {
      return <div className="p-10 text-center text-gray-500">Access Restricted. Admin/HR only.</div>;
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateCompanyProfile({ ...companyProfile, logoUrl: reader.result as string });
              addNotification("Logo updated", "success");
          };
          reader.readAsDataURL(file);
      }
  };

  const handleLetterheadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateCompanyProfile({ ...companyProfile, letterheadUrl: reader.result as string });
              addNotification("Letterhead updated", "success");
          };
          reader.readAsDataURL(file);
      }
  };

  const handleEventSubmit = () => {
      if (!newEvent.title || !newEvent.date) return addNotification("Title and Date required", "error");
      addEvent({
          id: Math.random().toString(36).substr(2, 9),
          title: newEvent.title!,
          date: newEvent.date!,
          description: newEvent.description || '',
          type: newEvent.type as any,
          imageUrl: newEvent.imageUrl
      });
      setNewEvent({ type: 'Meeting' });
      addNotification("Event published", "success");
  };

  const handleEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setNewEvent({ ...newEvent, imageUrl: reader.result as string });
          reader.readAsDataURL(file);
      }
  };

  const handleAiPolicyDraft = async () => {
      if (!policyTopic) return addNotification("Please enter a topic", "error");
      setIsGeneratingPolicy(true);
      const text = await generateHRDocument("Company Policy Section", `Topic: ${policyTopic}. Tone: Professional and Compliance-focused.`);
      
      const newPolicies = (companyProfile.policies || '') + `\n\n### ${policyTopic}\n${text}`;
      updateCompanyProfile({ ...companyProfile, policies: newPolicies });
      
      setIsGeneratingPolicy(false);
      setPolicyTopic('');
      addNotification("Policy clause appended", "success");
  };

  const handleGenerateWallpaper = async () => {
    setIsGeneratingWallpaper(true);
    addNotification("AI is crafting your custom workspace...", "info");
    const imgUrl = await generateDashboardWallpaper(wallpaperPrompt);
    if (imgUrl) {
      updateCompanyProfile({ ...companyProfile, dashboardBgUrl: imgUrl });
      addNotification("New Dashboard Wallpaper Applied!", "success");
    } else {
      addNotification("Wallpaper generation failed.", "error");
    }
    setIsGeneratingWallpaper(false);
  };

  const updateRule = (key: string, value: number) => {
      const currentRules = companyProfile.attendanceRules || {
          gracePeriodMins: 15,
          latePenalty: 0,
          otMultiplierNormal: 1.5,
          otMultiplierWeekend: 2.0,
          otMultiplierHoliday: 3.0
      };
      updateCompanyProfile({
          ...companyProfile,
          attendanceRules: { ...currentRules, [key]: value }
      });
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Organization Setup</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage branding, policies, and company-wide events.</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl border border-gray-200 dark:border-white/10">
                {['branding', 'rules', 'policy', 'events'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {activeTab === 'branding' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <NeoCard title="Brand Assets" className="border-l-4 border-indigo-500">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Company Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 bg-gray-50 dark:bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-white/20 overflow-hidden">
                                        {companyProfile.logoUrl ? <img src={companyProfile.logoUrl} className="w-full h-full object-contain"/> : <Building2 className="w-8 h-8 text-gray-300"/>}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 px-4 py-2 rounded-lg text-sm text-black dark:text-white font-bold transition-colors">
                                            <Upload className="w-4 h-4" /> Upload Logo
                                        </label>
                                        <p className="text-[10px] text-gray-500 mt-2">Recommended: 512x512 PNG transparent.</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Document Letterhead</label>
                                <div className="w-full h-32 bg-gray-50 dark:bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-white/20 overflow-hidden relative">
                                    {companyProfile.letterheadUrl && <img src={companyProfile.letterheadUrl} className="absolute inset-0 w-full h-full object-cover opacity-50"/>}
                                    <input type="file" id="head-upload" className="hidden" accept="image/*" onChange={handleLetterheadUpload} />
                                    <label htmlFor="head-upload" className="cursor-pointer z-10 inline-flex items-center gap-2 bg-black/50 hover:bg-black/70 px-4 py-2 rounded-lg text-sm text-white font-bold backdrop-blur-sm transition-colors">
                                        <Image className="w-4 h-4" /> Upload Banner
                                    </label>
                                </div>
                            </div>
                        </div>
                    </NeoCard>

                    <NeoCard title="AI Workspace Engine" className="border-l-4 border-pink-500 overflow-hidden relative">
                        <div className="space-y-4">
                            <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-100 dark:border-pink-500/20">
                                <h4 className="font-bold text-pink-600 dark:text-pink-400 text-sm mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Custom AI Wallpaper</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Generate a unique Neo-Brutalist background for your SME dashboard.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <textarea 
                                    value={wallpaperPrompt} 
                                    onChange={e => setWallpaperPrompt(e.target.value)}
                                    className="w-full bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold focus:border-pink-500 outline-none"
                                    rows={2}
                                    placeholder="Enter visual theme..."
                                />
                                <NeoButton 
                                    onClick={handleGenerateWallpaper} 
                                    disabled={isGeneratingWallpaper}
                                    className="bg-pink-600 border-pink-400 hover:bg-pink-500 py-3"
                                >
                                    {isGeneratingWallpaper ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
                                    {isGeneratingWallpaper ? 'Crafting Image...' : 'Generate Wallpaper'}
                                </NeoButton>
                            </div>

                            {companyProfile.dashboardBgUrl && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Current Active Skin</p>
                                    <div className="aspect-video w-full rounded-xl border-2 border-black dark:border-white overflow-hidden relative shadow-lg">
                                        <img src={companyProfile.dashboardBgUrl} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => updateCompanyProfile({ ...companyProfile, dashboardBgUrl: undefined })}
                                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg shadow-xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </NeoCard>
                </div>

                <NeoCard title="Company Details" className="border-l-4 border-blue-500">
                    <div className="space-y-4">
                        <NeoInput placeholder="Company Name" value={companyProfile.name} onChange={e => updateCompanyProfile({...companyProfile, name: e.target.value})} />
                        <NeoInput placeholder="Registration No." value={companyProfile.regNo} onChange={e => updateCompanyProfile({...companyProfile, regNo: e.target.value})} />
                        <NeoInput placeholder="Website" value={companyProfile.website} onChange={e => updateCompanyProfile({...companyProfile, website: e.target.value})} />
                        <textarea 
                            className="w-full bg-white dark:bg-[#0a0a0a] border-2 border-gray-300 dark:border-white rounded-xl p-4 text-black dark:text-white font-bold focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-colors"
                            rows={4}
                            value={companyProfile.address}
                            onChange={e => updateCompanyProfile({...companyProfile, address: e.target.value})}
                            placeholder="Full Address"
                        />
                    </div>
                </NeoCard>
            </div>
        )}

        {activeTab === 'rules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <NeoCard title="Attendance Logic" className="border-l-4 border-orange-500">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase text-gray-500 mb-2">Grace Period (Minutes)</label>
                            <NeoInput 
                                type="number" 
                                value={companyProfile.attendanceRules?.gracePeriodMins || 15} 
                                onChange={e => updateRule('gracePeriodMins', parseInt(e.target.value))}
                            />
                            <p className="text-[10px] text-gray-500 mt-2">Time allowed after shift start before marked 'Late'.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-gray-500 mb-2">Late Penalty (RM/Min)</label>
                            <NeoInput 
                                type="number" 
                                value={companyProfile.attendanceRules?.latePenalty || 0} 
                                onChange={e => updateRule('latePenalty', parseFloat(e.target.value))}
                            />
                            <p className="text-[10px] text-gray-500 mt-2">Deduction amount per minute late (Optional).</p>
                        </div>
                    </div>
                </NeoCard>

                <NeoCard title="Overtime Multipliers" className="border-l-4 border-green-500">
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Normal Day</label>
                                <NeoInput 
                                    type="number" step="0.5"
                                    value={companyProfile.attendanceRules?.otMultiplierNormal || 1.5} 
                                    onChange={e => updateRule('otMultiplierNormal', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Rest Day</label>
                                <NeoInput 
                                    type="number" step="0.5"
                                    value={companyProfile.attendanceRules?.otMultiplierWeekend || 2.0} 
                                    onChange={e => updateRule('otMultiplierWeekend', parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Public Holiday</label>
                                <NeoInput 
                                    type="number" step="0.5"
                                    value={companyProfile.attendanceRules?.otMultiplierHoliday || 3.0} 
                                    onChange={e => updateRule('otMultiplierHoliday', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Standard rates per Employment Act 1955: 1.5x (Normal), 2.0x (Rest Day), 3.0x (Public Holiday).</p>
                    </div>
                </NeoCard>
            </div>
        )}

        {activeTab === 'policy' && (
            <div className="flex flex-col h-full gap-4">
                <div className="flex gap-4 items-center bg-gray-100 dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-200 dark:border-white/10">
                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                    <input 
                        type="text" 
                        value={policyTopic} 
                        onChange={e => setPolicyTopic(e.target.value)} 
                        placeholder="Draft new clause: e.g. 'Work From Home' or 'Social Media Usage'..." 
                        className="flex-1 bg-transparent text-black dark:text-white font-bold outline-none placeholder-gray-500 dark:placeholder-gray-600"
                    />
                    <button 
                        onClick={handleAiPolicyDraft} 
                        disabled={isGeneratingPolicy}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGeneratingPolicy ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} 
                        {isGeneratingPolicy ? 'Drafting...' : 'Generate with AI'}
                    </button>
                </div>

                <NeoCard title="Company Handbook & Policies" className="border-l-4 border-yellow-500 h-[600px]">
                    <div className="flex flex-col h-full">
                        <div className="flex-1 relative">
                            <textarea 
                                className="w-full h-full bg-gray-50 dark:bg-[#0a0a0a] p-6 text-gray-700 dark:text-gray-300 font-mono text-sm leading-relaxed border-none resize-none focus:ring-0 transition-colors"
                                value={companyProfile.policies || ''}
                                onChange={e => updateCompanyProfile({...companyProfile, policies: e.target.value})}
                                placeholder="# Code of Conduct..."
                            />
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
                            <NeoButton className="w-auto" onClick={() => addNotification("Policies Saved", "success")}><Save className="w-4 h-4 mr-2"/> Save Changes</NeoButton>
                        </div>
                    </div>
                </NeoCard>
            </div>
        )}

        {activeTab === 'events' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <NeoCard title="Create Event">
                        <div className="space-y-4">
                            <NeoInput placeholder="Event Title" value={newEvent.title || ''} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                            <NeoInput type="date" value={newEvent.date || ''} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                            <NeoSelect value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}>
                                <option value="Meeting">Meeting</option>
                                <option value="Celebration">Celebration</option>
                                <option value="Holiday">Holiday</option>
                                <option value="Training">Training</option>
                            </NeoSelect>
                            <textarea 
                                className="w-full bg-white dark:bg-black border-2 border-gray-300 dark:border-white rounded-xl p-4 text-black dark:text-white text-sm"
                                rows={3}
                                placeholder="Description..."
                                value={newEvent.description || ''}
                                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                            />
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-2">Event Image</label>
                                <input type="file" accept="image/*" onChange={handleEventImageUpload} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 dark:file:bg-white/10 file:text-black dark:file:text-white hover:file:bg-gray-200 dark:hover:file:bg-white/20"/>
                            </div>
                            <NeoButton onClick={handleEventSubmit} className="w-full">Publish Event</NeoButton>
                        </div>
                    </NeoCard>
                </div>
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {events.map(event => (
                            <div key={event.id} className="relative group bg-white dark:bg-[#121212] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                                <div className="h-32 bg-gray-200 dark:bg-gray-800 relative">
                                    {event.imageUrl && <img src={event.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />}
                                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold uppercase text-white backdrop-blur-sm">{event.type}</div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-black dark:text-white text-lg">{event.title}</h3>
                                        <button onClick={() => deleteEvent(event.id)} className="text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-2">{event.date}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
                                </div>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div className="col-span-2 py-12 text-center text-gray-500 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No upcoming events.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

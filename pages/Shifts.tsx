
import React, { useState, useEffect } from 'react';
import { NeoCard, NeoButton, NeoModal, NeoSelect, NeoInput, NeoBadge, NeoCheckbox } from '../components/NeoComponents';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, Plus, Trash2, Check, Bell, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Shift } from '../types';

export const Shifts: React.FC = () => {
  const { employees, shifts, addShift, deleteShift, currentUser, addNotification, updateShiftStatus } = useGlobal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOTModalOpen, setIsOTModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Form State
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formType, setFormType] = useState<'Morning' | 'Afternoon' | 'Night' | 'Custom'>('Morning');
  const [customStart, setCustomStart] = useState('09:00');
  const [customEnd, setCustomEnd] = useState('18:00');

  // Bulk Action State
  const [selectedShiftIds, setSelectedShiftIds] = useState<Set<string>>(new Set());

  // Pending OT Shifts
  const pendingOvertimeShifts = shifts.filter(s => s.approvalStatus === 'Pending');

  useEffect(() => {
    // Reset selection when modal closes
    if (!isOTModalOpen) setSelectedShiftIds(new Set());
  }, [isOTModalOpen]);

  // Notifications Simulation
  useEffect(() => {
    const checkUpcomingShifts = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcoming = shifts.filter(s => {
         const shiftDate = new Date(s.date);
         return shiftDate >= now && shiftDate <= tomorrow;
      });

      if (upcoming.length > 0) {
         const hasNotified = localStorage.getItem(`notified-${new Date().toISOString().split('T')[0]}`);
         if (!hasNotified) {
            addNotification(`Reminder: ${upcoming.length} upcoming shifts starting soon. Notifications sent to staff.`, 'info');
            localStorage.setItem(`notified-${new Date().toISOString().split('T')[0]}`, 'true');
         }
      }
    };
    checkUpcomingShifts();
  }, [shifts, addNotification]);

  const handleManualNotify = () => {
     addNotification("Push notifications sent to all scheduled staff for tomorrow.", "success");
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleCellClick = (day: number) => {
    if (currentUser.role === 'Staff') return; 
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    setIsModalOpen(true);
  };

  const calculateHours = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 + m2/60) - (h1 + m1/60);
    if (diff < 0) diff += 24; 
    return diff;
  };

  const handleAssignShift = () => {
    if (!selectedDay || !formEmployeeId) return;

    let startTime = '09:00';
    let endTime = '18:00';
    let color = 'blue';

    if (formType === 'Afternoon') {
       startTime = '14:00';
       endTime = '23:00';
       color = 'orange';
    } else if (formType === 'Night') {
       startTime = '22:00';
       endTime = '07:00';
       color = 'purple';
    } else if (formType === 'Custom') {
       startTime = customStart;
       endTime = customEnd;
       color = 'green';
    }

    const duration = calculateHours(startTime, endTime);
    const standardHours = 9; 
    const isOvertime = duration > standardHours;
    const overtimeHours = isOvertime ? duration - standardHours : 0;

    const newShift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: formEmployeeId,
      date: selectedDay,
      type: formType,
      startTime,
      endTime,
      color,
      isOvertime,
      overtimeHours,
      approvalStatus: isOvertime ? 'Pending' : 'Approved'
    };

    addShift(newShift);
    if (isOvertime) {
        addNotification(`Shift flagged as potential Overtime (+${overtimeHours.toFixed(1)}h). Pending approval.`, 'info');
    }
    setIsModalOpen(false);
  };

  const toggleShiftSelection = (id: string) => {
     const newSet = new Set(selectedShiftIds);
     if (newSet.has(id)) newSet.delete(id);
     else newSet.add(id);
     setSelectedShiftIds(newSet);
  };

  const handleBulkAction = (action: 'Approved' | 'Rejected') => {
      if (selectedShiftIds.size === 0) return;
      selectedShiftIds.forEach(id => updateShiftStatus(id, action));
      addNotification(`Bulk ${action} for ${selectedShiftIds.size} shifts completed.`, 'success');
      setSelectedShiftIds(new Set());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    return { daysInMonth, firstDay };
  };

  const { daysInMonth, firstDay } = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 bg-[#121212]/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-glossy-card">
         <div>
           <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Shift Schedule</h2>
           <p className="text-gray-400 font-bold text-sm uppercase tracking-wide">Manage workforce allocation & timing</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
               <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
               <span className="px-4 py-2 font-black text-white uppercase min-w-[150px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
               <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            {currentUser.role !== 'Staff' && (
              <>
                 <div className="relative">
                    <NeoButton 
                        className={`h-12 ${pendingOvertimeShifts.length > 0 ? 'bg-orange-500 hover:bg-orange-600 border-orange-400' : ''}`} 
                        onClick={() => setIsOTModalOpen(true)}
                        disabled={pendingOvertimeShifts.length === 0}
                    >
                        <AlertTriangle className="w-4 h-4" /> 
                        Review OT
                        {pendingOvertimeShifts.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center border-2 border-[#121212] font-black">
                                {pendingOvertimeShifts.length}
                            </span>
                        )}
                    </NeoButton>
                 </div>

                 <NeoButton className="h-12" onClick={() => { setSelectedDay(null); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4" /> Auto-Fill
                 </NeoButton>
              </>
            )}
         </div>
      </div>

      {/* Calendar Grid */}
      <NeoCard className="p-0 overflow-visible bg-[#0a0a0a] z-0">
         {/* Days Header */}
         <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-4 text-center font-black uppercase text-xs text-gray-500 tracking-widest">{d}</div>
            ))}
         </div>

         <div className="grid grid-cols-7 auto-rows-fr bg-[#121212]">
            {/* Blanks */}
            {blanks.map(i => (
              <div key={`blank-${i}`} className="min-h-[160px] border-b border-r border-white/5 bg-[#0a0a0a]/50"></div>
            ))}

            {/* Days */}
            {daysArray.map(day => {
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayShifts = shifts.filter(s => s.date === dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div 
                  key={day} 
                  onClick={() => handleCellClick(day)}
                  className={`
                    min-h-[160px] p-3 border-b border-r border-white/5 relative group transition-colors overflow-visible
                    ${isToday ? 'bg-blue-900/10' : 'hover:bg-white/5 cursor-pointer'}
                  `}
                >
                   <div className="flex justify-between items-start mb-2">
                     <span className={`
                       text-sm font-bold
                       ${isToday ? 'text-blue-400 scale-110 origin-top-left' : 'text-gray-400'}
                     `}>{day}</span>
                     
                     {dayShifts.length > 0 && (
                       <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse"></div>
                     )}
                   </div>

                   <div className="space-y-1.5">
                     {dayShifts.map(shift => {
                        const emp = employees.find(e => e.id === shift.employeeId);
                        const isPending = shift.approvalStatus === 'Pending';
                        const isRejected = shift.approvalStatus === 'Rejected';
                        
                        return (
                          <div key={shift.id} className={`p-1.5 rounded-lg border text-[10px] font-bold flex justify-between items-center group/shift bg-white/5 border-white/10 relative ${isPending ? 'border-dashed border-orange-400 bg-orange-500/10' : ''} ${isRejected ? 'opacity-50 line-through' : ''}`}>
                             <div className="truncate pr-1">
                               <span className="block truncate">
                                   {emp?.name.split(' ')[0]}
                                   {isPending && <AlertTriangle className="w-3 h-3 text-orange-400 inline ml-1" />}
                               </span>
                               <span className="opacity-70 text-[9px]">{shift.startTime}-{shift.endTime}</span>
                             </div>
                          </div>
                        );
                     })}
                   </div>

                   {/* Add Button on Hover */}
                   {currentUser.role !== 'Staff' && (
                     <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                           <Plus className="w-3 h-3" />
                        </div>
                     </div>
                   )}
                </div>
              );
            })}
         </div>
      </NeoCard>

      {/* Assignment Modal */}
      <NeoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Shift">
         <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
               <CalendarDays className="w-5 h-5 text-gray-400" />
               <span className="font-bold text-white">{selectedDay || 'Auto-Fill Mode'}</span>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-wider text-gray-500">Employee</label>
               <NeoSelect value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)}>
                  <option value="">Select Staff...</option>
                  {employees.filter(e => e.status === 'Active').map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
               </NeoSelect>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-wider text-gray-500">Shift Type</label>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Morning', 'Afternoon', 'Night', 'Custom'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setFormType(type as any)}
                      className={`
                        p-3 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all
                        ${formType === type 
                          ? 'bg-white text-black border-white shadow-lg scale-105' 
                          : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'}
                      `}
                    >
                       {type}
                    </button>
                  ))}
               </div>
            </div>
            
            {formType === 'Custom' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Start Time</label>
                        <NeoInput type="time" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">End Time</label>
                        <NeoInput type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                    </div>
                </div>
            )}

            <NeoButton className="w-full" onClick={handleAssignShift}>Confirm Assignment</NeoButton>
         </div>
      </NeoModal>

      {/* Overtime Review Modal */}
      <NeoModal isOpen={isOTModalOpen} onClose={() => setIsOTModalOpen(false)} title="Overtime Approvals">
         <div className="space-y-4">
            {pendingOvertimeShifts.length > 0 && (
                <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10 mb-4">
                    <div className="text-sm font-bold text-gray-300">
                        {selectedShiftIds.size} Selected
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => handleBulkAction('Approved')}
                            disabled={selectedShiftIds.size === 0}
                            className="bg-green-600/20 text-green-400 px-3 py-1 rounded-lg text-xs font-black uppercase border border-green-600/30 disabled:opacity-30"
                         >
                            Approve All
                         </button>
                         <button 
                            onClick={() => handleBulkAction('Rejected')}
                            disabled={selectedShiftIds.size === 0}
                            className="bg-red-600/20 text-red-400 px-3 py-1 rounded-lg text-xs font-black uppercase border border-red-600/30 disabled:opacity-30"
                         >
                            Reject All
                         </button>
                    </div>
                </div>
            )}

            <div className="max-h-[400px] overflow-y-auto space-y-2">
                {pendingOvertimeShifts.length === 0 ? (
                    <div className="text-center p-8 text-gray-500 font-bold">No pending overtime requests.</div>
                ) : (
                    pendingOvertimeShifts.map(shift => {
                        const emp = employees.find(e => e.id === shift.employeeId);
                        const isSelected = selectedShiftIds.has(shift.id);

                        return (
                            <div key={shift.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isSelected ? 'bg-blue-600/10 border-blue-500' : 'bg-white/5 border-white/10'}`}>
                                <NeoCheckbox checked={isSelected} onChange={() => toggleShiftSelection(shift.id)} />
                                
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-lg">{emp?.name}</h4>
                                    <p className="text-xs text-gray-400 font-mono">{shift.date} • {shift.startTime}-{shift.endTime}</p>
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-black uppercase">
                                        <Clock className="w-3 h-3" /> +{shift.overtimeHours?.toFixed(1)}h Overtime
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => updateShiftStatus(shift.id, 'Approved')}
                                        className="p-3 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/50 rounded-xl transition-all"
                                        title="Approve"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => updateShiftStatus(shift.id, 'Rejected')}
                                        className="p-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 rounded-xl transition-all"
                                        title="Reject"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <NeoButton variant="ghost" className="w-full" onClick={() => setIsOTModalOpen(false)}>Close</NeoButton>
         </div>
      </NeoModal>
    </div>
  );
};

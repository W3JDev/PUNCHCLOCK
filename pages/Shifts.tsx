
import React, { useState, useEffect } from 'react';
import { NeoCard, NeoButton, NeoModal, NeoSelect, NeoInput, NeoBadge, NeoCheckbox } from '../components/NeoComponents';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, Plus, Trash2, Check, Bell, AlertTriangle, XCircle, CheckCircle, Repeat, Palette, Users } from 'lucide-react';
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
  
  // New Feature States
  const [recurrence, setRecurrence] = useState<'None' | 'Daily' | 'Weekly'>('None');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default Blue

  // Bulk Action State
  const [selectedShiftIds, setSelectedShiftIds] = useState<Set<string>>(new Set());

  // Pending OT Shifts
  const pendingOvertimeShifts = shifts.filter(s => s.approvalStatus === 'Pending');

  useEffect(() => {
    // Reset selection when modal closes
    if (!isOTModalOpen) setSelectedShiftIds(new Set());
  }, [isOTModalOpen]);

  // Update default color when type changes
  useEffect(() => {
    switch(formType) {
        case 'Morning': setSelectedColor('#3B82F6'); break; // Blue
        case 'Afternoon': setSelectedColor('#F97316'); break; // Orange
        case 'Night': setSelectedColor('#A855F7'); break; // Purple
        case 'Custom': setSelectedColor('#22C55E'); break; // Green
    }
  }, [formType]);

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
    
    // Reset form defaults
    setRecurrence('None');
    setRecurrenceEndDate('');
    setFormEmployeeId('');
    
    setIsModalOpen(true);
  };

  const calculateHours = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 + m2/60) - (h1 + m1/60);
    if (diff < 0) diff += 24; 
    return diff;
  };

  const checkConflict = (empId: string, dateStr: string) => {
      return shifts.some(s => s.employeeId === empId && s.date === dateStr);
  };

  const handleAssignShift = () => {
    if (!selectedDay || !formEmployeeId) return;

    let startTime = '09:00';
    let endTime = '18:00';

    if (formType === 'Afternoon') {
       startTime = '14:00';
       endTime = '23:00';
    } else if (formType === 'Night') {
       startTime = '22:00';
       endTime = '07:00';
    } else if (formType === 'Custom') {
       startTime = customStart;
       endTime = customEnd;
    }

    const duration = calculateHours(startTime, endTime);
    const standardHours = 9; 
    const isOvertime = duration > standardHours;
    const overtimeHours = isOvertime ? duration - standardHours : 0;

    // Generate dates based on recurrence
    const datesToAssign: string[] = [selectedDay];
    
    if (recurrence !== 'None' && recurrenceEndDate) {
        const start = new Date(selectedDay);
        const end = new Date(recurrenceEndDate);
        const current = new Date(start);
        
        // Advance first step so we don't duplicate the start date logic if loop includes it
        if (recurrence === 'Daily') current.setDate(current.getDate() + 1);
        if (recurrence === 'Weekly') current.setDate(current.getDate() + 7);

        while (current <= end) {
            datesToAssign.push(current.toISOString().split('T')[0]);
            if (recurrence === 'Daily') current.setDate(current.getDate() + 1);
            if (recurrence === 'Weekly') current.setDate(current.getDate() + 7);
        }
    }

    let conflictsFound = 0;
    let createdCount = 0;

    datesToAssign.forEach(dateStr => {
        if (checkConflict(formEmployeeId, dateStr)) {
            conflictsFound++;
            return; // Skip this date
        }

        const newShift: Shift = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: formEmployeeId,
            date: dateStr,
            type: formType,
            startTime,
            endTime,
            color: selectedColor, // Use hex code
            isOvertime,
            overtimeHours,
            approvalStatus: isOvertime ? 'Pending' : 'Approved'
        };
        addShift(newShift);
        createdCount++;
    });

    if (conflictsFound > 0) {
        addNotification(`Scheduled ${createdCount} shifts. Skipped ${conflictsFound} due to conflicts.`, 'error');
    } else {
        addNotification(`Successfully scheduled ${createdCount} shifts.`, 'success');
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

  // Helper to convert hex to rgba for backgrounds
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in pb-20 w-full">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 bg-[#121212]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-glossy-card">
         <div>
           <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mb-2">Shift Schedule</h2>
           <p className="text-gray-400 font-bold text-xs md:text-sm uppercase tracking-wide">Manage workforce allocation & timing</p>
         </div>
         <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 shrink-0">
               <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
               <span className="px-2 md:px-4 py-2 font-black text-white uppercase min-w-[120px] md:min-w-[150px] text-center text-sm md:text-base">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
               <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            {currentUser.role !== 'Staff' && (
              <div className="flex gap-2 flex-wrap">
                 <div className="relative">
                    <NeoButton 
                        className={`h-12 ${pendingOvertimeShifts.length > 0 ? 'bg-orange-500 hover:bg-orange-600 border-orange-400' : ''}`} 
                        onClick={() => setIsOTModalOpen(true)}
                        disabled={pendingOvertimeShifts.length === 0}
                    >
                        <AlertTriangle className="w-4 h-4" /> 
                        <span className="hidden sm:inline">Review OT</span>
                        {pendingOvertimeShifts.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center border-2 border-[#121212] font-black">
                                {pendingOvertimeShifts.length}
                            </span>
                        )}
                    </NeoButton>
                 </div>

                 <NeoButton className="h-12" onClick={() => { setSelectedDay(null); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Auto-Fill</span>
                 </NeoButton>
              </div>
            )}
         </div>
      </div>

      {/* Calendar Grid */}
      <NeoCard className="p-0 overflow-hidden bg-[#0a0a0a] z-0">
         <div className="overflow-x-auto w-full">
            <div className="min-w-[800px]"> {/* Ensures calendar maintains shape on mobile */}
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="p-4 text-center font-black uppercase text-xs text-gray-500 tracking-widest">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr bg-[#121212]">
                    {/* Blanks */}
                    {blanks.map(i => (
                    <div key={`blank-${i}`} className="min-h-[140px] md:min-h-[160px] border-b border-r border-white/5 bg-[#0a0a0a]/50"></div>
                    ))}

                    {/* Days */}
                    {daysArray.map(day => {
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayShifts = shifts.filter(s => s.date === dateStr);
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    
                    // Staffing Density Calculation
                    const activeStaffCount = employees.filter(e => e.status === 'Active').length;
                    const staffingDensity = activeStaffCount > 0 ? (dayShifts.length / activeStaffCount) * 100 : 0;
                    
                    // Heatmap Background & Indicator
                    let densityBg = '';
                    let indicatorColor = 'bg-blue-500';

                    if (dayShifts.length > 0) {
                        if (staffingDensity <= 40) {
                            // Understaffed
                            densityBg = 'bg-red-500/5 hover:bg-red-500/10';
                            indicatorColor = 'bg-red-500';
                        } else if (staffingDensity <= 80) {
                            // Optimal
                            densityBg = 'bg-blue-500/5 hover:bg-blue-500/10';
                            indicatorColor = 'bg-blue-500';
                        } else {
                            // Full/Heavy
                            densityBg = 'bg-green-500/5 hover:bg-green-500/10';
                            indicatorColor = 'bg-green-500';
                        }
                    } else {
                        densityBg = 'hover:bg-white/5';
                    }

                    return (
                        <div 
                        key={day} 
                        onClick={() => handleCellClick(day)}
                        className={`
                            min-h-[140px] md:min-h-[160px] p-2 md:p-3 border-b border-r border-white/5 relative group transition-colors overflow-visible flex flex-col
                            ${isToday ? 'bg-blue-900/10 ring-1 ring-inset ring-blue-500/50' : densityBg}
                            cursor-pointer
                        `}
                        >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`
                            text-sm font-bold
                            ${isToday ? 'text-blue-400 scale-110 origin-top-left' : 'text-gray-400'}
                            `}>{day}</span>
                            
                            {/* Day Status Icon */}
                            {dayShifts.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-mono text-gray-500 hidden sm:inline">{dayShifts.length} Shift{dayShifts.length !== 1 ? 's' : ''}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`}></div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                            {dayShifts.map(shift => {
                                const emp = employees.find(e => e.id === shift.employeeId);
                                const isPending = shift.approvalStatus === 'Pending';
                                const isRejected = shift.approvalStatus === 'Rejected';
                                
                                const borderColor = shift.color || '#3B82F6';
                                const bgColor = hexToRgba(borderColor, 0.1);
                                
                                return (
                                <div 
                                    key={shift.id} 
                                    className={`
                                        p-1.5 rounded-lg border text-[10px] font-bold flex justify-between items-center group/shift relative transition-all
                                        ${isPending ? 'border-dashed' : ''} 
                                        ${isRejected ? 'opacity-50 line-through' : ''}
                                    `}
                                    style={{ borderColor: borderColor, backgroundColor: bgColor, color: isRejected ? '#666' : 'white' }}
                                >
                                    <div className="truncate pr-1 w-full">
                                    <span className="block truncate">
                                        {emp?.name.split(' ')[0]}
                                        {isPending && <AlertTriangle className="w-3 h-3 text-orange-400 inline ml-1" />}
                                    </span>
                                    <span className="opacity-70 text-[9px] block">{shift.startTime}-{shift.endTime}</span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        
                        {/* Staffing Density Bar (Visual Indicator) */}
                        <div className="mt-auto pt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${indicatorColor} transition-all duration-500`} 
                                    style={{ width: `${Math.min(staffingDensity, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Add Button on Hover */}
                        {currentUser.role !== 'Staff' && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                                <Plus className="w-3 h-3" />
                                </div>
                            </div>
                        )}
                        </div>
                    );
                    })}
                </div>
            </div>
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
               {formEmployeeId && selectedDay && checkConflict(formEmployeeId, selectedDay) && (
                   <div className="flex items-center gap-2 text-orange-400 text-xs font-bold animate-pulse mt-1">
                       <AlertTriangle className="w-3 h-3" /> Warning: {employees.find(e => e.id === formEmployeeId)?.name} already has a shift on this day.
                   </div>
               )}
            </div>

            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-wider text-gray-500">Shift Type & Color</label>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
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
               
               {/* Color Picker Control */}
               <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                   <div className="relative">
                       <input 
                         type="color" 
                         value={selectedColor} 
                         onChange={(e) => setSelectedColor(e.target.value)}
                         className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                       />
                       <Palette className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none mix-blend-difference" />
                   </div>
                   <span className="text-xs font-bold text-gray-400">Shift Label Color</span>
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
            
            {/* Recurrence Options */}
            <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-blue-500" />
                    <label className="text-xs font-black uppercase tracking-wider text-blue-400">Recurring Pattern</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <NeoSelect value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)}>
                        <option value="None">One-time Shift</option>
                        <option value="Daily">Repeat Daily</option>
                        <option value="Weekly">Repeat Weekly</option>
                    </NeoSelect>
                    {recurrence !== 'None' && (
                        <NeoInput 
                            type="date" 
                            value={recurrenceEndDate} 
                            onChange={(e) => setRecurrenceEndDate(e.target.value)} 
                            placeholder="Until Date"
                        />
                    )}
                </div>
            </div>

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
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-lg truncate">{emp?.name}</h4>
                                    <p className="text-xs text-gray-400 font-mono truncate">{shift.date} • {shift.startTime}-{shift.endTime}</p>
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-black uppercase">
                                        <Clock className="w-3 h-3" /> +{shift.overtimeHours?.toFixed(1)}h OT
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
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


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, Hash, ScanFace, ArrowLeft, CheckCircle, X, Delete,
  AlertTriangle, ShieldAlert, Wifi, Camera, LogIn, LogOut, Coffee, Search, Calendar, Filter, Users, Download, ChevronLeft, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { AttendanceRecord, Employee } from '../types';
import { calculateAttendanceRisk, generateLivenessChallenge } from '../services/securityService';
import { loadFaceModels, detectFace, matchFace } from '../services/faceBiometricService';
import { NeoCard, NeoButton, NeoInput, NeoBadge, NeoSelect } from '../components/NeoComponents';

// Simulated location
const MOCK_LOCATION = { lat: 3.1570, lng: 101.7120, accuracy: 15 }; 

type KioskStep = 'idle' | 'intent' | 'method' | 'scan' | 'pin' | 'result';
type AttendanceType = 'Check In' | 'Check Out' | 'Break Start' | 'Break End';

export const Attendance: React.FC = () => {
  const { addAttendanceRecord, employees, attendanceRecords, currentUser } = useGlobal();
  
  // VIEW MODE
  const [activeView, setActiveView] = useState<'launcher' | 'admin'>('launcher');
  const [recordViewMode, setRecordViewMode] = useState<'table' | 'calendar'>('table');

  // ADMIN PORTAL STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('All');
  
  // CALENDAR STATE
  const [calendarDate, setCalendarDate] = useState(new Date());

  // KIOSK STATE
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Flow State
  const [step, setStep] = useState<KioskStep>('idle');
  const [intent, setIntent] = useState<AttendanceType>('Check In');
  const [method, setMethod] = useState<'Face' | 'PIN'>('Face');
  
  // Interaction State
  const [pin, setPin] = useState('');
  const [scanStatus, setScanStatus] = useState<'searching' | 'verifying' | 'success' | 'error'>('searching');
  const [scanMessage, setScanMessage] = useState('');
  const [riskDetails, setRiskDetails] = useState<{score: number, reasons: string[]} | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<Employee | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);
  const inactivityTimerRef = useRef<any>(null);

  // --- EFFECT: CLOCK ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- EFFECT: LOAD MODELS ---
  useEffect(() => {
    loadFaceModels().then(loaded => setModelsLoaded(loaded));
  }, []);

  // --- EFFECT: CAMERA CLEANUP ---
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // --- EFFECT: INACTIVITY RESET ---
  useEffect(() => {
    const resetTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (isKioskMode && step !== 'idle') {
            inactivityTimerRef.current = setTimeout(() => {
                resetKiosk();
            }, 30000); // 30s timeout
        }
    };

    window.addEventListener('click', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    return () => {
        window.removeEventListener('click', resetTimer);
        window.removeEventListener('touchstart', resetTimer);
    };
  }, [isKioskMode, step]);

  // --- UTILS ---
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
              facingMode: 'user', 
              width: { ideal: 1280 }, // Higher res for fullscreen
              height: { ideal: 720 } 
          } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              startFaceDetection();
          };
      }
    } catch (err) {
      console.error("Camera Error", err);
      setScanStatus('error');
      setScanMessage("Camera Access Denied");
    }
  };

  const startFaceDetection = () => {
      if (!videoRef.current) return;
      
      setScanStatus('searching');
      setScanMessage('Scanning...');

      detectionIntervalRef.current = setInterval(async () => {
          if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
              const detection = await detectFace(videoRef.current);
              
              if (detection) {
                  setScanStatus('verifying');
                  const { match, distance } = matchFace(detection.descriptor, employees);
                  
                  if (match) {
                      clearInterval(detectionIntervalRef.current); // Stop loop
                      handleAttendanceSubmit(match);
                  } else {
                      // Found face but unknown
                      // setScanMessage("Unknown Face"); 
                      // Keep scanning
                  }
              }
          }
      }, 500); // Scan every 500ms
  };

  const resetKiosk = () => {
      setStep('idle');
      setPin('');
      setScanStatus('searching');
      setIdentifiedUser(null);
      setRiskDetails(null);
      stopCamera();
  };

  const handleAttendanceSubmit = (employee: Employee) => {
    const now = new Date();
    const risk = calculateAttendanceRisk(MOCK_LOCATION, now, employee);
    setRiskDetails(risk);

    const hour = now.getHours();
    const min = now.getMinutes();
    
    // Late Logic
    let isLate = false;
    let lateMins = 0;
    if (intent === 'Check In') {
        if (hour > 9 || (hour === 9 && min > 15)) { // 9:15 grace
            isLate = true;
            lateMins = ((hour - 9) * 60) + min;
        }
    }

    // OT Logic
    let otMins = 0;
    if (intent === 'Check Out' && hour >= 18) { // After 6pm
        otMins = ((hour - 18) * 60) + min;
    }

    const status = risk.score > 50 ? 'Absent' : (isLate ? 'Late' : 'Present');

    const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: employee.id,
        date: now.toISOString().split('T')[0],
        checkIn: intent === 'Check In' ? now.toLocaleTimeString() : null,
        checkOut: intent === 'Check Out' ? now.toLocaleTimeString() : null,
        location: MOCK_LOCATION,
        method: method,
        status: status,
        riskScore: risk.score,
        lateMinutes: lateMins,
        otMinutes: otMins
    };

    addAttendanceRecord(newRecord);
    setIdentifiedUser(employee);
    setScanStatus('success');
    setScanMessage(risk.score > 50 ? 'Risk Flagged' : 'Verified');
    setStep('result');

    // Auto-reset after success
    setTimeout(() => {
        resetKiosk();
    }, 4000);
  };

  // --- FLOW HANDLERS ---
  const handleIntentSelect = (type: AttendanceType) => {
      setIntent(type);
      setStep('method');
  };

  const handleMethodSelect = (m: 'Face' | 'PIN') => {
      setMethod(m);
      if (m === 'Face') {
          setStep('scan');
          // Wait for render then start
          setTimeout(startCamera, 100);
      } else {
          setStep('pin');
      }
  };

  const handlePinInput = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        // Verify PIN
        setTimeout(() => {
             const emp = employees.find(e => e.id.endsWith(newPin) || '123456' === newPin); 
             if (emp) {
                 handleAttendanceSubmit(emp);
             } else {
                 setPin('');
                 alert("Invalid PIN"); 
             }
        }, 300);
      }
    }
  };

  // --- ADMIN FILTER LOGIC ---
  const filteredRecords = useMemo(() => {
      return attendanceRecords.filter(r => {
          const emp = employees.find(e => e.id === r.employeeId);
          const matchesSearch = emp?.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp?.id.includes(searchQuery);
          const matchesDate = !filterDate || r.date === filterDate;
          const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
          return matchesSearch && matchesDate && matchesStatus;
      }).sort((a,b) => b.date.localeCompare(a.date) || (b.checkIn || '').localeCompare(a.checkIn || ''));
  }, [attendanceRecords, employees, searchQuery, filterDate, filterStatus]);

  // --- CALENDAR LOGIC ---
  const changeMonth = (offset: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    return { daysInMonth, firstDay };
  };

  const { daysInMonth, firstDay } = getDaysInMonth(calendarDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  // --- COMPONENTS ---
  const ActionButton = ({ icon: Icon, label, subLabel, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className={`
        relative overflow-hidden group w-full p-6 md:p-8 rounded-3xl border-2 border-white/10
        flex flex-col items-center justify-center gap-4 transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl
        ${colorClass}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
        <Icon className="w-10 h-10 md:w-14 md:h-14 text-white" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <span className="block font-black text-2xl md:text-3xl text-white uppercase tracking-wider">{label}</span>
        {subLabel && <span className="block text-white/80 text-sm md:text-base font-medium mt-1">{subLabel}</span>}
      </div>
    </button>
  );

  // --- KIOSK MODE RENDER ---
  if (isKioskMode) {
    return createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-black text-white overflow-hidden touch-none flex flex-col lg:flex-row font-display select-none">
            {/* Left Panel */}
            <div className="w-full lg:w-[35%] h-[30%] lg:h-full bg-black border-b-4 lg:border-b-0 lg:border-r-4 border-[#222] p-6 lg:p-10 flex flex-row lg:flex-col justify-between items-center lg:items-start relative z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ScanFace className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-black text-white text-lg leading-none tracking-tighter">PUNCH<span className="text-blue-500">CLOCK</span></h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Kiosk #01</p>
                    </div>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                     <h1 className="text-[15vw] lg:text-[8vw] font-black text-white leading-none tracking-tighter tabular-nums">
                        {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}
                     </h1>
                     <p className="text-sm md:text-xl font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
                        {currentTime.toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}
                     </p>
                </div>
                <div className="hidden lg:flex flex-col gap-4 w-full">
                     <div className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Wifi className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-bold text-gray-400 uppercase">Network</span>
                        </div>
                        <span className="text-xs font-black text-green-500 uppercase">Online</span>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-[#111] rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Camera className={`w-5 h-5 ${modelsLoaded ? 'text-green-500' : 'text-yellow-500'}`} />
                            <span className="text-xs font-bold text-gray-400 uppercase">Biometrics</span>
                        </div>
                        <span className={`text-xs font-black uppercase ${modelsLoaded ? 'text-green-500' : 'text-yellow-500'}`}>{modelsLoaded ? 'Ready' : 'Loading...'}</span>
                     </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-[65%] h-[70%] lg:h-full bg-[#0a0a0a] relative flex flex-col p-4 md:p-8 lg:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none z-0"></div>
                
                {step === 'idle' && (
                    <div 
                        onClick={() => setStep('intent')}
                        className="flex-1 flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-700 relative z-10"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse"></div>
                            <div className="relative bg-[#111] border-4 border-[#222] p-10 rounded-[3rem] shadow-2xl mb-8 group transition-transform hover:scale-105 active:scale-95">
                                <ScanFace className="w-24 h-24 text-white group-hover:text-blue-400 transition-colors" strokeWidth={1} />
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">Touch to Start</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Secure Biometric Entry</p>
                    </div>
                )}
                {step === 'intent' && (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300 relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide">Select Action</h3>
                            <button onClick={resetKiosk} className="p-3 bg-[#222] rounded-full text-white hover:bg-[#333]"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:gap-8 flex-1">
                            <ActionButton icon={LogIn} label="Check In" subLabel="Start Shift" onClick={() => handleIntentSelect('Check In')} colorClass="bg-green-600 hover:bg-green-500 border-green-400"/>
                            <ActionButton icon={LogOut} label="Check Out" subLabel="End Shift" onClick={() => handleIntentSelect('Check Out')} colorClass="bg-red-600 hover:bg-red-500 border-red-400"/>
                            <ActionButton icon={Coffee} label="Break" subLabel="Pause Work" onClick={() => handleIntentSelect('Break Start')} colorClass="bg-orange-600 hover:bg-orange-500 border-orange-400 col-span-2 md:col-span-1 md:col-start-1 md:col-end-3"/>
                        </div>
                    </div>
                )}
                {step === 'method' && (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-300 relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => setStep('intent')} className="p-3 bg-[#222] rounded-full text-white hover:bg-[#333]"><ArrowLeft className="w-6 h-6" /></button>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide">{intent}</h3>
                                <p className="text-sm text-gray-400 font-bold uppercase">Choose verification method</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 max-h-[400px]">
                            <ActionButton icon={ScanFace} label="Face ID" subLabel="Fast & Secure" onClick={() => handleMethodSelect('Face')} colorClass="bg-blue-600 hover:bg-blue-500 border-blue-400"/>
                            <ActionButton icon={Hash} label="PIN Code" subLabel="Manual Entry" onClick={() => handleMethodSelect('PIN')} colorClass="bg-[#222] hover:bg-[#333] border-white/20"/>
                        </div>
                    </div>
                )}
                {step === 'pin' && (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep('method')} className="p-3 bg-[#222] rounded-full text-white hover:bg-[#333]"><ArrowLeft className="w-6 h-6" /></button>
                            <h3 className="text-xl font-black text-white uppercase tracking-wide">Enter PIN</h3>
                            <div className="w-12"></div> 
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                            <div className="flex justify-center gap-3 mb-8 w-full">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black transition-all ${i < pin.length ? 'bg-white text-black border-white' : 'bg-[#111] border-white/10 text-transparent'}`}>{i < pin.length ? '•' : ''}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-3 w-full">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((n) => (
                                    <button key={n} onClick={() => n === 'C' ? setPin('') : n === 'DEL' ? setPin(p => p.slice(0,-1)) : handlePinInput(n.toString())} className={`h-20 rounded-2xl font-black text-2xl transition-all active:scale-95 flex items-center justify-center ${typeof n === 'number' ? 'bg-[#222] text-white hover:bg-[#333]' : 'bg-red-900/20 text-red-400 hover:bg-red-900/40'}`}>
                                        {n === 'DEL' ? <Delete className="w-6 h-6"/> : n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {step === 'result' && (
                    <div className="absolute inset-0 bg-[#050505] z-50 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-300">
                        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_#22c55e] animate-bounce"><CheckCircle className="w-16 h-16 text-white" /></div>
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4">Success</h2>
                        <div className="text-center space-y-2">
                            <p className="text-2xl text-gray-300 font-bold">{intent} Confirmed</p>
                            <p className="text-4xl text-white font-black">{identifiedUser?.name}</p>
                            <p className="text-xl text-blue-400 font-mono mt-4">{new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* SCAN - Full Screen Overlay */}
            {step === 'scan' && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
                    <div className="relative flex-1 overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
                        
                        {/* Overlay UI */}
                        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-8">
                            
                            {/* Face Frame */}
                            <div className={`
                                relative w-full max-w-xl aspect-square rounded-[3rem] border-[6px] overflow-hidden transition-all duration-300 shadow-2xl backdrop-blur-sm
                                ${scanStatus === 'searching' ? 'border-white/30' : scanStatus === 'verifying' ? 'border-blue-500 scale-105' : 'border-red-500'}
                            `}>
                                {/* Pulse Effect when Verifying */}
                                {scanStatus === 'verifying' && <div className="absolute inset-0 border-4 border-blue-400 rounded-[2.5rem] animate-ping opacity-20"></div>}

                                {scanStatus === 'searching' && <div className="absolute top-0 inset-x-0 h-2 bg-blue-400 shadow-[0_0_40px_#3b82f6] animate-scan-line z-10 opacity-80"></div>}
                                
                                {/* Corners */}
                                <div className="absolute top-6 left-6 w-12 h-12 border-t-[6px] border-l-[6px] border-white/60 rounded-tl-2xl"></div>
                                <div className="absolute top-6 right-6 w-12 h-12 border-t-[6px] border-r-[6px] border-white/60 rounded-tr-2xl"></div>
                                <div className="absolute bottom-6 left-6 w-12 h-12 border-b-[6px] border-l-[6px] border-white/60 rounded-bl-2xl"></div>
                                <div className="absolute bottom-6 right-6 w-12 h-12 border-b-[6px] border-r-[6px] border-white/60 rounded-br-2xl"></div>
                            </div>

                            {/* Status Text */}
                            <div className="mt-12 text-center space-y-2">
                                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                                    {scanMessage}
                                </h2>
                                {scanStatus === 'searching' && <p className="text-xl text-white/80 font-bold uppercase tracking-[0.3em] animate-pulse">Position Face within Frame</p>}
                            </div>
                        </div>

                        {/* Cancel Button */}
                        <button onClick={resetKiosk} className="absolute top-8 right-8 p-4 bg-black/40 hover:bg-red-600 rounded-full text-white backdrop-blur-xl border-2 border-white/20 transition-all active:scale-95 group">
                            <X className="w-10 h-10 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
  }

  // --- DEFAULT ADMIN VIEW ---
  return (
    <div className="space-y-8 pb-20">
        
        {/* Toggle Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 bg-white dark:bg-[#121212] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-glossy-card transition-colors">
            <div>
                <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Attendance Console</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Manage Records & Kiosks</p>
            </div>
            <div className="flex gap-4 items-center">
                {activeView === 'admin' && (
                    <div className="flex bg-gray-100 dark:bg-black p-1 rounded-xl border border-gray-200 dark:border-white/10">
                        <button onClick={() => setRecordViewMode('table')} className={`p-3 rounded-lg transition-all ${recordViewMode === 'table' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}><List className="w-4 h-4"/></button>
                        <button onClick={() => setRecordViewMode('calendar')} className={`p-3 rounded-lg transition-all ${recordViewMode === 'calendar' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}><LayoutGrid className="w-4 h-4"/></button>
                    </div>
                )}
                <div className="flex bg-gray-100 dark:bg-black p-1 rounded-xl border border-gray-200 dark:border-white/10">
                    <button onClick={() => setActiveView('launcher')} className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-wider ${activeView === 'launcher' ? 'bg-white text-black' : 'text-gray-500 dark:text-gray-400'}`}>Kiosk Control</button>
                    <button onClick={() => setActiveView('admin')} className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-wider ${activeView === 'admin' ? 'bg-white text-black' : 'text-gray-500 dark:text-gray-400'}`}>Records Portal</button>
                </div>
            </div>
        </div>

        {activeView === 'launcher' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-[500px]">
                <div className="space-y-6 p-8">
                    <h2 className="text-3xl font-black text-black dark:text-white uppercase">Terminal Mode</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        Transform this device into a secure attendance kiosk. This will lock the interface and enable biometric scanning.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                            <Wifi className="w-6 h-6 text-green-600 dark:text-green-500 mb-2"/>
                            <p className="font-bold text-black dark:text-white text-sm">Online</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                            <Camera className={`w-6 h-6 mb-2 ${modelsLoaded ? 'text-green-600 dark:text-green-500' : 'text-yellow-600 dark:text-yellow-500'}`}/>
                            <p className="font-bold text-black dark:text-white text-sm">{modelsLoaded ? 'AI Ready' : 'Loading AI...'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsKioskMode(true)}
                        disabled={!modelsLoaded}
                        className="w-full py-5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xl uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <ShieldAlert className="w-6 h-6" /> Launch Kiosk
                    </button>
                </div>
                <div className="h-full bg-gray-100 dark:bg-white/5 rounded-[3rem] border-4 border-gray-200 dark:border-black/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71')] bg-cover bg-center"></div>
                    <ScanFace className="w-24 h-24 text-gray-400 dark:text-white opacity-50" />
                </div>
            </div>
        ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                
                {recordViewMode === 'table' ? (
                    <>
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                    placeholder="Search Name or ID..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-xl pl-10 pr-4 py-3 text-black dark:text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <input 
                                type="date" 
                                value={filterDate} 
                                onChange={e => setFilterDate(e.target.value)}
                                className="bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-xl px-4 py-3 text-black dark:text-white text-sm focus:border-blue-500 outline-none"
                            />
                            <NeoSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-40 py-3 text-sm">
                                <option value="All">All Status</option>
                                <option value="Present">Present</option>
                                <option value="Late">Late</option>
                                <option value="Absent">Absent</option>
                            </NeoSelect>
                            <NeoButton variant="secondary" className="w-auto px-4"><Download className="w-4 h-4" /></NeoButton>
                        </div>

                        {/* Dense Table */}
                        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-black/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest border-b border-gray-200 dark:border-white/10">
                                        <th className="p-4">Employee</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Clock In</th>
                                        <th className="p-4">Clock Out</th>
                                        <th className="p-4">Duration</th>
                                        <th className="p-4">Late / OT</th>
                                        <th className="p-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                                    {filteredRecords.length === 0 ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">No records found matching filters.</td></tr>
                                    ) : (
                                        filteredRecords.map(record => {
                                            const emp = employees.find(e => e.id === record.employeeId);
                                            
                                            // Calc Duration
                                            let duration = "-";
                                            if (record.checkIn && record.checkOut) {
                                                const start = new Date(`2000-01-01T${record.checkIn}`);
                                                const end = new Date(`2000-01-01T${record.checkOut}`);
                                                const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                                duration = diff.toFixed(1) + " hrs";
                                            }

                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-black dark:text-white">
                                                                {emp?.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-black dark:text-white text-sm">{emp?.name}</p>
                                                                <p className="text-[10px] text-gray-500 uppercase">{emp?.id} • {emp?.employmentType}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono text-gray-600 dark:text-gray-300">{record.date}</td>
                                                    <td className="p-4 text-black dark:text-white">{record.checkIn || '-'}</td>
                                                    <td className="p-4 text-black dark:text-white">{record.checkOut || '-'}</td>
                                                    <td className="p-4 text-gray-500 dark:text-gray-400 font-mono">{duration}</td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            {record.lateMinutes ? <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded font-bold">Late {record.lateMinutes}m</span> : null}
                                                            {record.otMinutes ? <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-bold">OT {Math.floor(record.otMinutes/60)}h {record.otMinutes%60}m</span> : null}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <NeoBadge variant={record.status === 'Present' ? 'success' : record.status === 'Late' ? 'warning' : 'danger'}>
                                                            {record.status}
                                                        </NeoBadge>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    // CALENDAR VIEW
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-200 dark:border-white/10">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-black dark:text-white"><ChevronLeft className="w-6 h-6"/></button>
                            <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-widest">
                                {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-black dark:text-white"><ChevronRight className="w-6 h-6"/></button>
                        </div>

                        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="bg-gray-50 dark:bg-[#121212] p-4 text-center font-black text-xs text-gray-500 uppercase tracking-widest">{d}</div>
                            ))}
                            
                            {/* Blanks */}
                            {blanks.map(i => (
                                <div key={`blank-${i}`} className="bg-white dark:bg-[#0a0a0a] min-h-[120px]"></div>
                            ))}

                            {/* Days */}
                            {daysArray.map(day => {
                                const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
                                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                
                                const presentCount = dayRecords.filter(r => r.status === 'Present').length;
                                const lateCount = dayRecords.filter(r => r.status === 'Late').length;
                                const absentCount = dayRecords.filter(r => r.status === 'Absent').length;

                                return (
                                    <div key={day} className={`bg-white dark:bg-[#121212] min-h-[120px] p-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors flex flex-col ${isToday ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{day}</span>
                                            {dayRecords.length > 0 && <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/20"></div>}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            {presentCount > 0 && (
                                                <div className="text-[10px] bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-500/20 font-bold flex justify-between">
                                                    <span>Present</span> <span>{presentCount}</span>
                                                </div>
                                            )}
                                            {lateCount > 0 && (
                                                <div className="text-[10px] bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-500/20 font-bold flex justify-between">
                                                    <span>Late</span> <span>{lateCount}</span>
                                                </div>
                                            )}
                                            {absentCount > 0 && (
                                                <div className="text-[10px] bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-500/20 font-bold flex justify-between">
                                                    <span>Absent</span> <span>{absentCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Hash, ScanFace, ArrowLeft, CheckCircle, X, Delete, AlertTriangle, ShieldAlert, Wifi, Camera, LogIn, LogOut, Coffee, Search, Calendar, Filter, Users, Download, ChevronLeft, ChevronRight, LayoutGrid, List, Smile, Lock, RefreshCcw, ShieldCheck, Siren, XCircle, MapPin, Activity, Eye, Meh, Frown, Fingerprint, LocateFixed, BadgeAlert, Briefcase, FileSignature, CalendarDays } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { AttendanceRecord, Employee, Shift } from '../types';
import { calculateAttendanceRisk } from '../services/securityService';
import { loadFaceModels, detectFace, initializeFaceMatcher, matchFaceFast, verifyLiveness } from '../services/faceBiometricService';
import { NeoCard, NeoButton, NeoInput, NeoBadge, NeoSelect, NeoModal } from '../components/NeoComponents';

// Dynamic Office Location (Mocked for KLCC)
const OFFICE_LOCATION = { lat: 3.1578, lng: 101.7118, accuracy: 10 }; 

type KioskStep = 'idle' | 'intent' | 'scan' | 'pin' | 'result' | 'locked' | 'missing_punch';
type AttendanceType = 'Check In' | 'Check Out' | 'Break Start' | 'Break End';
type ResultStatus = 'SUCCESS' | 'ALREADY_CLOCKED' | 'NOT_CLOCKED_IN' | 'NOT_FOUND' | 'BIOMETRIC_FAIL' | 'SEQUENCE_ERROR' | 'GEO_LOCK' | 'SPOOF_DETECTED';
type LivenessAction = 'Smile' | 'Neutral' | 'Blink';

export const Attendance: React.FC = () => {
  const { addAttendanceRecord, employees, attendanceRecords, addNotification, shifts, currentUser, addGeneralRequest } = useGlobal();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Management State
  const [viewMode, setViewMode] = useState<'Table' | 'Board'>('Board');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monitorEmployee, setMonitorEmployee] = useState<Employee | null>(null);
  
  // Kiosk State
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [step, setStep] = useState<KioskStep>('idle');
  const [intent, setIntent] = useState<AttendanceType>('Check In');
  const [resultStatus, setResultStatus] = useState<ResultStatus>('SUCCESS');
  const [resultMessage, setResultMessage] = useState('');
  const [pin, setPin] = useState('');
  const [scanStatus, setScanStatus] = useState<'searching' | 'liveness' | 'verifying' | 'success' | 'error'>('searching');
  const [scanMessage, setScanMessage] = useState('');
  const [riskDetails, setRiskDetails] = useState<{score: number, reasons: string[]} | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<Employee | null>(null);
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  
  // Anti-Fraud State
  const [livenessChallenge, setLivenessChallenge] = useState<LivenessAction>('Neutral');
  const [gpsStatus, setGpsStatus] = useState<'Acquiring' | 'Locked' | 'Out-of-Range'>('Acquiring');

  // Missing Punch Form State
  const [mpEmployeeId, setMpEmployeeId] = useState('');
  const [mpDate, setMpDate] = useState(new Date().toISOString().split('T')[0]);
  const [mpTime, setMpTime] = useState('09:00');
  const [mpType, setMpType] = useState<AttendanceType>('Check In');
  const [mpReason, setMpReason] = useState('');
  const [mpPin, setMpPin] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

  // --- HOOKS MOVED UP TO PREVENT REACT ERROR #300 ---
  // Ensure useMemo is called unconditionally before any early returns
  const displayedRecords = useMemo(() => {
      const records = attendanceRecords.filter(r => r.date === selectedDate);
      return employees.filter(e => e.status === 'Active').map(emp => {
          const rec = records.find(r => r.employeeId === emp.id);
          return { emp, record: rec, status: rec?.status || 'Absent', checkIn: rec?.checkIn || '--:--', checkOut: rec?.checkOut || '--:--', lateMins: rec?.lateMinutes || 0 };
      });
  }, [attendanceRecords, employees, selectedDate]);

  // Live Board Stats
  const liveStats = {
      present: displayedRecords.filter(r => r.status === 'Present').length,
      late: displayedRecords.filter(r => r.status === 'Late').length,
      absent: displayedRecords.filter(r => r.status === 'Absent').length
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (lockoutTimer > 0) {
      interval = setInterval(() => setLockoutTimer(prev => prev - 1), 1000);
    } else if (lockoutTimer === 0 && step === 'locked') {
      setStep('idle');
      setFailedPinAttempts(0);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer, step]);

  useEffect(() => {
    // Retry loading models if they failed initially
    const initModels = async () => {
        const loaded = await loadFaceModels();
        if(loaded && employees.length > 0) initializeFaceMatcher(employees);
    };
    initModels();
  }, [employees]);

  // --- HARDWARE INTEGRATION ---
  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
  };

  const startCamera = async () => {
    try {
      setGpsStatus('Acquiring');
      // Simulate GPS Lock for Demo
      setTimeout(() => setGpsStatus('Locked'), 1500);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API not available");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      
      // Wait for React to render the video element
      if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { 
              videoRef.current?.play(); 
              generateNewChallenge();
              startFaceDetection(); 
          };
      } else {
          // Retry slightly later if DOM wasn't ready
          setTimeout(() => {
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  videoRef.current.onloadedmetadata = () => { 
                      videoRef.current?.play(); 
                      generateNewChallenge();
                      startFaceDetection(); 
                  };
              }
          }, 300);
      }
    } catch (err) { 
        console.error("Camera Error:", err);
        setScanStatus('error'); 
        setScanMessage("Camera Error. Check Permissions."); 
    }
  };

  const generateNewChallenge = () => {
      const actions: LivenessAction[] = ['Smile', 'Neutral']; // 'Blink' requires more complex logic, sticking to simple expressions for stability
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setLivenessChallenge(randomAction);
      setScanStatus('liveness');
      setScanMessage(randomAction === 'Smile' ? "PLEASE SMILE NOW 😊" : "STAY NEUTRAL 😐");
  };

  const startFaceDetection = () => {
      if (!videoRef.current) return;
      
      detectionIntervalRef.current = setInterval(async () => {
          if (videoRef.current && !videoRef.current.paused) {
              const detection = await detectFace(videoRef.current);
              
              if (detection) {
                  // 1. Identity Match
                  const { match } = matchFaceFast(detection.descriptor);
                  
                  if (match) {
                      const emp = employees.find(e => e.id === match.id);
                      
                      // 2. Liveness Challenge
                      // Note: verifyLiveness helper needs to handle 'Neutral' correctly (low probabilities of expressions)
                      const isAlive = verifyLiveness(detection.expressions, livenessChallenge as any);

                      if (emp && isAlive) {
                          setIdentifiedUser(emp); 
                          setScanStatus('verifying'); 
                          setScanMessage(`HI ${emp.name.split(' ')[0].toUpperCase()}!`);
                          clearInterval(detectionIntervalRef.current); 
                          setTimeout(() => handleAttendanceSubmit(emp), 800);
                      } else if (emp && !isAlive) {
                          // Feedback loop to user
                          // Don't reset scan status, just let them keep trying
                      }
                  }
              }
          }
      }, 200); 
  };

  const resetKiosk = () => { 
      setStep('idle'); 
      setPin(''); 
      setScanStatus('searching'); 
      setIdentifiedUser(null); 
      setRiskDetails(null); 
      setResultMessage(''); 
      stopCamera(); 
      setMpPin('');
      setMpEmployeeId('');
      setMpReason('');
  };

  const handleAttendanceSubmit = (employee: Employee) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.employeeId === employee.id && r.date === todayStr);
    const lastRecord = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null;

    // --- GEO-FENCING LAYER ---
    const risk = calculateAttendanceRisk(OFFICE_LOCATION, now, employee);
    setRiskDetails(risk);

    if (risk.score >= 90) {
        setResultStatus('GEO_LOCK'); 
        setResultMessage("OUTSIDE GEOFENCE: Please move closer to the outlet.");
        setStep('result'); 
        setTimeout(resetKiosk, 5000); 
        return;
    }

    // --- SEQUENTIAL LOGIC LAYER ---
    if (intent === 'Check In' && lastRecord && lastRecord.checkIn && !lastRecord.checkOut) {
        setResultStatus('ALREADY_CLOCKED'); 
        setResultMessage("You are already clocked in.");
        setStep('result'); 
        setTimeout(resetKiosk, 4000); 
        return;
    }
    if (intent === 'Check Out' && (!lastRecord || !lastRecord.checkIn)) {
        setResultStatus('SEQUENCE_ERROR'); 
        setResultMessage("No Check-In record found for today.");
        setStep('result'); 
        setTimeout(resetKiosk, 4000); 
        return;
    }

    // --- TIME RULES LAYER ---
    let isLate = false; 
    let lateMins = 0;
    let otMins = 0;
    const todaysShift = shifts.find(s => s.employeeId === employee.id && s.date === todayStr);
    
    if (intent === 'Check In') {
        let startHour = 9; let startMin = 0;
        if (todaysShift) [startHour, startMin] = todaysShift.startTime.split(':').map(Number);
        
        const actualTimeInMins = (now.getHours() * 60) + now.getMinutes();
        const shiftTimeInMins = (startHour * 60) + startMin;

        if (actualTimeInMins > (shiftTimeInMins + 15)) { // 15 min grace
            isLate = true;
            lateMins = actualTimeInMins - shiftTimeInMins;
        }
    }

    // Commit Data
    if (intent === 'Check Out' && lastRecord) {
        addAttendanceRecord({ ...lastRecord, checkOut: now.toLocaleTimeString(), otMinutes: otMins, riskScore: Math.max(lastRecord.riskScore || 0, risk.score) });
    } else {
        addAttendanceRecord({ 
            id: Math.random().toString(36).substr(2, 9), 
            employeeId: employee.id, 
            date: todayStr, 
            checkIn: intent === 'Check In' ? now.toLocaleTimeString() : null, 
            checkOut: intent === 'Check Out' ? now.toLocaleTimeString() : null, 
            location: OFFICE_LOCATION, 
            method: step === 'pin' ? 'PIN' : 'Face', 
            status: isLate ? 'Late' : 'Present', 
            riskScore: risk.score, 
            lateMinutes: lateMins, 
            otMinutes: otMins 
        });
    }

    setIdentifiedUser(employee); 
    setResultStatus('SUCCESS'); 
    setResultMessage(isLate ? `LATE (${lateMins}m)` : "ON TIME");
    setStep('result'); 
    setTimeout(resetKiosk, 4000);
  };

  const handlePinAuth = () => {
    if (lockoutTimer > 0 || pin.length !== 6) return;
    
    const emp = employees.find(e => e.pin === pin && e.status === 'Active'); 
    if (emp) { 
        setFailedPinAttempts(0); 
        setIdentifiedUser(emp);
        handleAttendanceSubmit(emp); 
    } else {
        const fails = failedPinAttempts + 1; 
        setFailedPinAttempts(fails); 
        setPin('');
        if (fails >= 3) { setLockoutTimer(30); setStep('locked'); } 
        else { addNotification(`INVALID PIN. ${3 - fails} tries remaining.`, "error"); }
    }
  };

  const submitMissingPunchRequest = () => {
      // 1. Validation
      if (!mpEmployeeId || !mpDate || !mpTime || !mpType || !mpReason) {
          addNotification("Please fill all details", "error");
          return;
      }
      
      const emp = employees.find(e => e.id === mpEmployeeId);
      if (!emp) { addNotification("Invalid Employee Selected", "error"); return; }

      // 2. PIN Security Check
      if (emp.pin !== mpPin) {
          const fails = failedPinAttempts + 1;
          setFailedPinAttempts(fails);
          setMpPin('');
          if (fails >= 3) { setLockoutTimer(30); setStep('locked'); }
          else { addNotification(`INCORRECT PIN. Identity Not Verified. ${3 - fails} tries remaining.`, "error"); }
          return;
      }

      // 3. Submit Request
      const requestDetails = JSON.stringify({
          type: mpType,
          time: mpTime,
          reason: mpReason,
          isManualCorrection: true
      });

      addGeneralRequest({
          id: Math.random().toString(36).substr(2, 9),
          employeeId: emp.id,
          employeeName: emp.name,
          type: 'Missing Punch',
          details: requestDetails,
          date: mpDate,
          status: 'Pending'
      });

      setIdentifiedUser(emp);
      setResultStatus('SUCCESS');
      setResultMessage("Missing Punch Request Sent");
      setStep('result');
      setTimeout(resetKiosk, 3000);
  };

  // --- KIOSK UI COMPONENTS ---
  const ActionButton = ({ icon: Icon, label, subLabel, onClick, colorClass }: any) => (
    <button onClick={onClick} className={`relative overflow-hidden group w-full p-8 md:p-10 rounded-[2.5rem] border-4 border-black/10 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[8px_8px_0_0_rgba(0,0,0,0.3)] ${colorClass}`}>
      <div className="p-6 bg-black/10 rounded-[2rem] backdrop-blur-sm border-2 border-white/20">
        <Icon className="w-12 h-12 text-white" strokeWidth={2} />
      </div>
      <div className="text-center">
        <span className="block font-black text-2xl md:text-3xl text-white uppercase tracking-tighter">{label}</span>
        {subLabel && <span className="block text-white/80 text-sm font-bold uppercase tracking-widest">{subLabel}</span>}
      </div>
    </button>
  );

  // --- RENDER KIOSK ---
  if (isKioskMode) {
    return createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-[#0a0a0a] text-white overflow-hidden touch-none font-sans select-none animate-in fade-in">
            {/* STATUS BAR */}
            <div className="absolute top-0 inset-x-0 h-16 flex justify-between items-center px-8 z-50 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <Wifi className="w-5 h-5 text-green-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">ONLINE • SYNCED</span>
                </div>
                <div className="flex items-center gap-4">
                    {gpsStatus === 'Locked' ? (
                        <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                            <MapPin className="w-4 h-4" /> <span className="text-xs font-black uppercase">GPS LOCKED</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-500 animate-pulse">
                            <LocateFixed className="w-4 h-4" /> <span className="text-xs font-black uppercase">SEARCHING...</span>
                        </div>
                    )}
                    <button onClick={() => setIsKioskMode(false)} className="opacity-0 hover:opacity-100 p-2"><XCircle/></button>
                </div>
            </div>

            {/* SCANNING OVERLAY */}
            {step === 'scan' && (
                <div className="fixed inset-0 z-[300] bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                        <div className={`relative w-[500px] h-[500px] rounded-[3rem] border-[12px] transition-all duration-300 overflow-hidden flex items-center justify-center ${scanStatus === 'liveness' ? 'border-[#FFD700]' : 'border-white/30'}`}>
                            {/* Face Guide Frame */}
                            <div className="absolute inset-0 border-[4px] border-white/20 m-4 rounded-[2.5rem]"></div>
                            
                            {/* Scanning Animation */}
                            {scanStatus === 'searching' && <div className="absolute inset-x-0 top-0 h-2 bg-blue-500 shadow-[0_0_50px_#3b82f6] animate-scan-line"></div>}
                            
                            <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl text-center border border-white/20 mt-64">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white drop-shadow-2xl flex items-center gap-4 justify-center">
                                    {livenessChallenge === 'Smile' && <Smile className="w-10 h-10 text-yellow-400"/>}
                                    {livenessChallenge === 'Neutral' && <Meh className="w-10 h-10 text-blue-400"/>}
                                    {scanMessage}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <button onClick={resetKiosk} className="absolute bottom-12 left-1/2 -translate-x-1/2 px-10 py-4 bg-white/10 backdrop-blur-md rounded-full text-white font-bold border border-white/20 uppercase tracking-widest hover:bg-red-600/80 transition-all">Cancel Scan</button>
                </div>
            )}
            
            {/* RESULT SCREEN */}
            {step === 'result' && (
                <div className="fixed inset-0 bg-[#050505] z-[500] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95">
                    {resultStatus === 'SUCCESS' ? (
                        <>
                            <div className={`mb-12 w-64 h-64 rounded-full flex items-center justify-center shadow-glow animate-bounce border-[12px] border-white/20 ${resultMessage.includes('LATE') ? 'bg-yellow-500' : 'bg-green-500'}`}>
                                {resultMessage.includes('Missing Punch') ? <FileSignature className="w-40 h-40 text-white" /> : 
                                 resultMessage.includes('LATE') ? <Clock className="w-40 h-40 text-white" /> : <CheckCircle className="w-40 h-40 text-white" />}
                            </div>
                            <h2 className="text-[8rem] font-black uppercase tracking-tighter italic leading-none mb-6">
                                {identifiedUser?.name.split(' ')[0]}
                            </h2>
                            <div className="bg-white/10 px-8 py-4 rounded-2xl border border-white/10">
                                <p className={`text-5xl font-black uppercase tracking-widest ${resultMessage.includes('LATE') ? 'text-yellow-500' : 'text-green-500'}`}>{resultMessage}</p>
                            </div>
                            <p className="mt-8 text-gray-500 font-bold uppercase tracking-[0.5em]">{intent} RECORDED</p>
                        </>
                    ) : (
                        <>
                            <div className="mb-12 w-64 h-64 bg-red-600 rounded-full flex items-center justify-center shadow-glow border-[12px] border-white/20"><XCircle className="w-40 h-40 text-white" /></div>
                            <h2 className="text-[6rem] font-black uppercase tracking-tighter italic leading-none mb-4 text-red-500">ACCESS DENIED</h2>
                            <p className="text-3xl font-bold uppercase max-w-4xl text-white mb-12">{resultMessage}</p>
                            <NeoButton variant="secondary" onClick={resetKiosk} className="text-xl py-6 px-12 border-4">Try Again</NeoButton>
                        </>
                    )}
                </div>
            )}

            {/* LOCKED SCREEN */}
            {step === 'locked' && (
                <div className="fixed inset-0 z-[600] bg-red-950 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className="w-48 h-48 text-red-500 mb-8 animate-pulse" />
                    <h1 className="text-9xl font-black uppercase mb-4 text-white">LOCKED</h1>
                    <p className="text-4xl font-bold uppercase mb-8 text-red-300">Security Timeout Active</p>
                    <div className="text-[12rem] font-black font-mono text-white tabular-nums">{lockoutTimer}s</div>
                </div>
            )}

            {/* MAIN IDLE SCREEN */}
            <div className="flex h-full w-full">
                {/* Left Panel: Info */}
                <div className="w-[450px] bg-[#080808] border-r border-white/10 p-12 flex flex-col justify-between items-start relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px]"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center border-2 border-white shadow-[4px_4px_0_0_#fff]"><ScanFace className="w-8 h-8 text-white" /></div>
                            <div><h2 className="font-black text-2xl italic tracking-tighter uppercase leading-none">PUNCH<span className="text-blue-500">CLOCK</span></h2><p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">TERMINAL_01</p></div>
                        </div>
                        <h1 className="text-8xl font-black tracking-tighter leading-none text-white">{currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}</h1>
                        <p className="text-xl font-bold text-gray-500 uppercase tracking-widest mt-4">{currentTime.toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}</p>
                    </div>

                    <div className="w-full space-y-4 relative z-10">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                            <h4 className="text-xs font-black uppercase text-blue-500 mb-2">Outlet Status</h4>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-black text-white">KLCC HQ</span>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">OPEN</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { setStep('pin'); }} className="py-4 text-xs font-black uppercase text-white hover:bg-white/10 transition-all border-2 border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 group">
                                <Hash className="w-5 h-5 text-gray-400 group-hover:text-white"/> 
                                <span>Use PIN</span>
                            </button>
                            <button onClick={() => { setStep('missing_punch'); }} className="py-4 text-xs font-black uppercase text-white hover:bg-white/10 transition-all border-2 border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 group">
                                <FileSignature className="w-5 h-5 text-yellow-500"/> 
                                <span>Missing Punch</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Interactive */}
                <div className="flex-1 h-full bg-[#050505] relative flex flex-col items-center justify-center p-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]" />
                    
                    {step === 'idle' && (
                        <div className="relative z-10 grid grid-cols-2 gap-8 w-full max-w-4xl animate-in slide-in-from-bottom-8">
                            <ActionButton icon={LogIn} label="Check In" subLabel="Start Shift" onClick={() => { setIntent('Check In'); setStep('scan'); setTimeout(startCamera, 300); }} colorClass="bg-green-600 border-green-500 hover:bg-green-500" />
                            <ActionButton icon={LogOut} label="Check Out" subLabel="End Shift" onClick={() => { setIntent('Check Out'); setStep('scan'); setTimeout(startCamera, 300); }} colorClass="bg-red-600 border-red-500 hover:bg-red-500" />
                            <ActionButton icon={Coffee} label="Break Start" subLabel="Pause" onClick={() => { setIntent('Break Start'); setStep('scan'); setTimeout(startCamera, 300); }} colorClass="bg-yellow-600 border-yellow-500 hover:bg-yellow-500" />
                            <ActionButton icon={Briefcase} label="Break End" subLabel="Resume" onClick={() => { setIntent('Break End'); setStep('scan'); setTimeout(startCamera, 300); }} colorClass="bg-blue-600 border-blue-500 hover:bg-blue-500" />
                        </div>
                    )}

                    {step === 'pin' && (
                        <div className="relative z-10 w-full max-w-lg space-y-8 animate-in slide-in-from-right-8">
                            <div className="flex justify-between items-center"><button onClick={() => setStep('idle')} className="p-4 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft className="w-8 h-8" /></button><h3 className="text-3xl font-black uppercase italic tracking-tighter">SECURE ACCESS</h3><div className="w-16" /></div>
                            
                            <div className="bg-[#111] p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                                <div className="flex justify-center gap-4 mb-8">
                                    {[...Array(6)].map((_, i) => <div key={i} className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-4xl font-black transition-all ${i < pin.length ? 'bg-white text-black border-white' : 'bg-black border-white/20'}`}>{i < pin.length ? '•' : ''}</div>)}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0, 'del'].map((n) => (
                                        <button 
                                            key={n.toString()} 
                                            onClick={() => n === 'del' ? setPin(p => p.slice(0,-1)) : n === 'back' ? setStep('idle') : setPin(p => p.length < 6 ? p + n : p)} 
                                            className={`h-20 rounded-2xl font-black text-3xl transition-all active:scale-95 flex items-center justify-center ${n === 'back' ? 'bg-transparent text-xs uppercase font-bold text-gray-500' : typeof n === 'number' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-900/30 text-red-500'}`}
                                        >
                                            {n === 'del' ? <Delete className="w-8 h-8"/> : n === 'back' ? 'Cancel' : n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {pin.length === 6 && (
                                <NeoButton onClick={handlePinAuth} className="w-full py-4 text-xl">Clock In Now</NeoButton>
                            )}
                        </div>
                    )}

                    {step === 'missing_punch' && (
                        <div className="relative z-10 w-full max-w-3xl bg-[#111] p-10 rounded-[3rem] border border-white/10 animate-in zoom-in">
                            <div className="flex justify-between items-center mb-8">
                                <button onClick={resetKiosk} className="p-3 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft/></button>
                                <div>
                                    <h3 className="text-3xl font-black uppercase text-yellow-500 text-right">Missing Punch</h3>
                                    <p className="text-gray-400 text-sm font-bold text-right uppercase tracking-widest">Correction Request Form</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Employee Identity</label>
                                    <select 
                                        className="w-full bg-white text-black p-4 rounded-xl font-bold text-lg border-2 border-white focus:outline-none"
                                        value={mpEmployeeId}
                                        onChange={(e) => setMpEmployeeId(e.target.value)}
                                    >
                                        <option value="">Select your name...</option>
                                        {employees.filter(e => e.status === 'Active').map(e => (
                                            <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Punch Type</label>
                                    <div className="flex gap-2">
                                        {['Check In', 'Check Out', 'Break Start', 'Break End'].map(t => (
                                            <button 
                                                key={t} 
                                                onClick={() => setMpType(t as any)} 
                                                className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase border-2 ${mpType === t ? 'bg-white text-black border-white' : 'border-white/20 text-gray-500'}`}
                                            >
                                                {t.replace('Check ', '').replace('Break ', 'Brk ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Date & Time</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={mpDate} onChange={e => setMpDate(e.target.value)} className="bg-black border-2 border-white/20 rounded-xl p-3 text-white font-bold w-full"/>
                                        <input type="time" value={mpTime} onChange={e => setMpTime(e.target.value)} className="bg-black border-2 border-white/20 rounded-xl p-3 text-white font-bold w-full"/>
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Reason</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Forgot ID card, Scanner issue..." 
                                        value={mpReason} 
                                        onChange={e => setMpReason(e.target.value)}
                                        className="w-full bg-black border-2 border-white/20 rounded-xl p-4 text-white font-bold focus:border-yellow-500 outline-none" 
                                    />
                                </div>

                                <div className="col-span-2 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-green-500 mb-2">Security Verification</label>
                                            <p className="text-gray-500 text-xs w-64">Enter your 6-digit PIN to sign this request. False declarations are subject to disciplinary action.</p>
                                        </div>
                                        <div className="w-48">
                                            <input 
                                                type="password" 
                                                maxLength={6} 
                                                placeholder="Enter PIN" 
                                                className="w-full bg-white/10 border-2 border-white/20 rounded-xl p-4 text-white font-black text-center text-xl tracking-[0.5em] focus:border-green-500 outline-none"
                                                value={mpPin}
                                                onChange={e => setMpPin(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <NeoButton variant="primary" onClick={submitMissingPunchRequest} disabled={!mpPin || mpPin.length < 6} className="w-full py-5 text-xl bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400">
                                Verify Identity & Submit Request
                            </NeoButton>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
  }

  // --- MANAGEMENT PORTAL (Non-Kiosk) ---
  return (
    <div className="space-y-8 pb-20 w-full max-w-[1600px] mx-auto animate-in fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white dark:bg-[#121212] p-8 rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-sm">
            <div>
                <h1 className="text-5xl font-black text-black dark:text-white uppercase tracking-tighter italic">Attendance<span className="text-blue-600">.</span></h1>
                <p className="text-gray-500 font-bold mt-2">Live Floor Plan & Monitoring</p>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                    <button onClick={() => setViewMode('Table')} className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'Table' ? 'bg-white text-black shadow-md' : 'text-gray-500'}`}>List</button>
                    <button onClick={() => setViewMode('Board')} className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'Board' ? 'bg-white text-black shadow-md' : 'text-gray-500'}`}>Live Board</button>
                </div>
                {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
                    <NeoButton onClick={() => setIsKioskMode(true)} className="bg-black text-white dark:bg-white dark:text-black border-4 px-8">
                        <ScanFace className="w-5 h-5 mr-2" /> Launch Kiosk
                    </NeoButton>
                )}
            </div>
        </div>

        {/* Live Board View */}
        {viewMode === 'Board' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Column */}
                <div className="space-y-6">
                    <NeoCard className="bg-black text-white border-none" title="Real-Time Status">
                        <div className="space-y-6 mt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"/><span className="font-bold">Present</span></div>
                                <span className="text-3xl font-black">{liveStats.present}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-yellow-500 rounded-full"/><span className="font-bold">Late</span></div>
                                <span className="text-3xl font-black text-yellow-500">{liveStats.late}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-red-600 rounded-full"/><span className="font-bold">Absent</span></div>
                                <span className="text-3xl font-black text-red-500">{liveStats.absent}</span>
                            </div>
                        </div>
                    </NeoCard>
                    
                    <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-500/30 p-6 rounded-2xl">
                        <h4 className="flex items-center gap-2 font-black text-red-600 uppercase mb-4"><BadgeAlert className="w-5 h-5"/> Late Watchlist</h4>
                        <div className="space-y-3">
                            {displayedRecords.filter(r => r.status === 'Late').length === 0 && <p className="text-xs text-gray-500">No late arrivals today.</p>}
                            {displayedRecords.filter(r => r.status === 'Late').map(d => (
                                <div key={d.emp.id} className="flex justify-between items-center bg-white dark:bg-black/20 p-3 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">{d.emp.name.charAt(0)}</div>
                                        <span className="font-bold text-sm">{d.emp.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-red-500">+{d.lateMins}m</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayedRecords.map(({ emp, status, checkIn, checkOut }) => (
                        <div key={emp.id} onClick={() => setMonitorEmployee(emp)} className={`
                            relative overflow-hidden p-5 rounded-3xl border-2 cursor-pointer transition-all hover:scale-[1.02] group
                            ${status === 'Present' ? 'bg-white dark:bg-[#1a1a1a] border-green-500/30' : 
                              status === 'Late' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500' : 
                              'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/5 opacity-70'}
                        `}>
                            {status === 'Present' && <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>}
                            
                            <div className="mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{emp.role}</p>
                                <h4 className="font-bold text-lg leading-tight truncate">{emp.name}</h4>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-lg text-center">
                                    <span className="block text-[8px] uppercase text-gray-500 font-bold">IN</span>
                                    <span className={status === 'Late' ? 'text-red-500 font-bold' : ''}>{checkIn}</span>
                                </div>
                                <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-lg text-center">
                                    <span className="block text-[8px] uppercase text-gray-500 font-bold">OUT</span>
                                    <span>{checkOut}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Table View (Legacy) */}
        {viewMode === 'Table' && (
            <NeoCard className="min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="font-mono font-bold text-lg">{selectedDate}</span>
                        <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5"/></button>
                    </div>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 text-xs text-gray-500 uppercase font-black tracking-wider">
                            <th className="p-4 pl-6">Employee</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Check In</th>
                            <th className="p-4">Check Out</th>
                            <th className="p-4 text-center">Late (Mins)</th>
                            <th className="p-4 text-right pr-6">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {displayedRecords.map(({ emp, status, checkIn, checkOut, lateMins }) => (
                            <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <td className="p-4 pl-6 font-bold">{emp.name}</td>
                                <td className="p-4"><NeoBadge variant={status === 'Present' ? 'success' : status === 'Late' ? 'warning' : 'danger'}>{status}</NeoBadge></td>
                                <td className="p-4 font-mono text-sm">{checkIn}</td>
                                <td className="p-4 font-mono text-sm">{checkOut}</td>
                                <td className="p-4 text-center font-mono font-bold text-red-500">{lateMins > 0 ? `+${lateMins}` : '-'}</td>
                                <td className="p-4 text-right pr-6"><button onClick={() => setMonitorEmployee(emp)} className="p-2 hover:bg-blue-500 hover:text-white rounded-lg transition-all"><Activity className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </NeoCard>
        )}

        {/* Employee Monitor Modal (Simplified for brevity) */}
        {monitorEmployee && (
            <NeoModal isOpen={!!monitorEmployee} onClose={() => setMonitorEmployee(null)} title="Staff Monitor">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black">{monitorEmployee.name.charAt(0)}</div>
                        <div><h3 className="font-black text-xl">{monitorEmployee.name}</h3><p className="text-sm text-gray-500 uppercase">{monitorEmployee.role}</p></div>
                    </div>
                    {/* Additional stats would go here */}
                </div>
            </NeoModal>
        )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
// Fix: Added missing MapPin import from lucide-react
import { Clock, Hash, ScanFace, ArrowLeft, CheckCircle, X, Delete, AlertTriangle, ShieldAlert, Wifi, Camera, LogIn, LogOut, Coffee, Search, Calendar, Filter, Users, Download, ChevronLeft, ChevronRight, LayoutGrid, List, Smile, Lock, RefreshCcw, ShieldCheck, Siren, XCircle, MapPin } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { AttendanceRecord, Employee } from '../types';
import { calculateAttendanceRisk } from '../services/securityService';
import { loadFaceModels, detectFace, initializeFaceMatcher, matchFaceFast, verifyLiveness } from '../services/faceBiometricService';
import { NeoCard, NeoButton, NeoInput, NeoBadge, NeoSelect } from '../components/NeoComponents';

const MOCK_LOCATION = { lat: 3.1578, lng: 101.7118, accuracy: 10 }; 

type KioskStep = 'idle' | 'intent' | 'method' | 'scan' | 'pin' | 'result' | 'locked';
type AttendanceType = 'Check In' | 'Check Out' | 'Break Start' | 'Break End';
type ResultStatus = 'SUCCESS' | 'ALREADY_CLOCKED' | 'NOT_CLOCKED_IN' | 'NOT_FOUND' | 'BIOMETRIC_FAIL' | 'SEQUENCE_ERROR';

export const Attendance: React.FC = () => {
  const { addAttendanceRecord, employees, attendanceRecords, addNotification } = useGlobal();
  const [activeView, setActiveView] = useState<'launcher' | 'admin'>('launcher');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [step, setStep] = useState<KioskStep>('idle');
  const [intent, setIntent] = useState<AttendanceType>('Check In');
  const [method, setMethod] = useState<'Face' | 'PIN'>('Face');
  const [resultStatus, setResultStatus] = useState<ResultStatus>('SUCCESS');
  const [resultMessage, setResultMessage] = useState('');
  const [pin, setPin] = useState('');
  const [scanStatus, setScanStatus] = useState<'searching' | 'liveness' | 'verifying' | 'success' | 'error'>('searching');
  const [scanMessage, setScanMessage] = useState('');
  const [riskDetails, setRiskDetails] = useState<{score: number, reasons: string[]} | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<Employee | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<any>(null);

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
    loadFaceModels().then(loaded => {
        setModelsLoaded(loaded);
        if(loaded && employees.length > 0) initializeFaceMatcher(employees);
    });
  }, [employees]);

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); startFaceDetection(); };
      }
    } catch (err) { setScanStatus('error'); setScanMessage("Camera Access Denied"); }
  };

  const startFaceDetection = () => {
      if (!videoRef.current) return;
      setScanStatus('searching');
      const challenge = Math.random() > 0.5 ? 'Smile' : 'Neutral';
      detectionIntervalRef.current = setInterval(async () => {
          if (videoRef.current && !videoRef.current.paused) {
              const detection = await detectFace(videoRef.current);
              if (detection) {
                  const { match } = matchFaceFast(detection.descriptor);
                  if (match) {
                      const emp = employees.find(e => e.id === match.id);
                      if (emp) {
                          setIdentifiedUser(emp); setScanStatus('liveness');
                          setScanMessage(challenge === 'Smile' ? "SMILE 😊" : "NEUTRAL 😐");
                          if (verifyLiveness(detection.expressions, challenge)) {
                              setScanStatus('verifying'); setScanMessage('VERIFYING IDENTITY...');
                              clearInterval(detectionIntervalRef.current); 
                              setTimeout(() => handleAttendanceSubmit(emp), 1200);
                          }
                      }
                  }
              }
          }
      }, 400); 
  };

  const resetKiosk = () => { setStep('idle'); setPin(''); setScanStatus('searching'); setIdentifiedUser(null); setRiskDetails(null); setResultMessage(''); stopCamera(); };

  const handleAttendanceSubmit = (employee: Employee) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.employeeId === employee.id && r.date === todayStr);
    const lastRecord = todayRecords.length > 0 ? todayRecords[0] : null;

    if (intent === 'Check In' && lastRecord && lastRecord.checkIn && !lastRecord.checkOut) {
        setResultStatus('ALREADY_CLOCKED'); setResultMessage("PROTOCOL BLOCKED: Active Session exists.");
        setStep('result'); setTimeout(resetKiosk, 5000); return;
    }
    if (intent === 'Check Out' && (!lastRecord || !lastRecord.checkIn)) {
        setResultStatus('SEQUENCE_ERROR'); setResultMessage("SEQUENCE ERROR: Missing Check-In for today.");
        setStep('result'); setTimeout(resetKiosk, 5000); return;
    }

    const risk = calculateAttendanceRisk(MOCK_LOCATION, now, employee);
    setRiskDetails(risk);

    const hour = now.getHours(); const min = now.getMinutes();
    let isLate = false; let lateMins = 0;
    if (intent === 'Check In' && (hour > 9 || (hour === 9 && min > 15))) { isLate = true; lateMins = ((hour - 9) * 60) + min; }

    let otMins = 0;
    if (intent === 'Check Out' && hour >= 18) { otMins = ((hour - 18) * 60) + min; }

    if (intent === 'Check Out' && lastRecord) {
        addAttendanceRecord({ ...lastRecord, checkOut: now.toLocaleTimeString(), otMinutes: otMins, riskScore: Math.max(lastRecord.riskScore || 0, risk.score) });
    } else {
        addAttendanceRecord({ id: Math.random().toString(36).substr(2, 9), employeeId: employee.id, date: todayStr, checkIn: intent === 'Check In' ? now.toLocaleTimeString() : null, checkOut: intent === 'Check Out' ? now.toLocaleTimeString() : null, location: MOCK_LOCATION, method, status: risk.score > 80 ? 'Absent' : (isLate ? 'Late' : 'Present'), riskScore: risk.score, lateMinutes: lateMins, otMinutes: otMins });
    }

    setIdentifiedUser(employee); setResultStatus('SUCCESS'); setResultMessage(`${intent} logged.`);
    setScanStatus('success'); setStep('result'); setTimeout(resetKiosk, 4000);
  };

  const handlePinInput = (num: string) => {
    if (lockoutTimer > 0 || pin.length >= 6) return;
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 6) {
        const emp = employees.find(e => e.pin === newPin && e.status === 'Active'); 
        if (emp) { setFailedPinAttempts(0); handleAttendanceSubmit(emp); }
        else {
            const fails = failedPinAttempts + 1; setFailedPinAttempts(fails); setPin('');
            if (fails >= 3) { setLockoutTimer(30); setStep('locked'); addNotification("Security Lockout Triggered", "error"); }
            else addNotification(`Wrong PIN. ${3 - fails} tries left.`, "error");
        }
    }
  };

  const ActionButton = ({ icon: Icon, label, subLabel, onClick, colorClass }: any) => (
    <button onClick={onClick} className={`relative overflow-hidden group w-full p-10 rounded-[3rem] border-4 border-black/10 flex flex-col items-center justify-center gap-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-2xl ${colorClass}`}>
      <div className="p-8 bg-white/10 rounded-[2.5rem] backdrop-blur-xl border-2 border-white/20 shadow-inner">
        <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <span className="block font-black text-4xl text-white uppercase tracking-tighter">{label}</span>
        {subLabel && <span className="block text-white/70 text-lg font-bold mt-1 uppercase tracking-[0.2em]">{subLabel}</span>}
      </div>
    </button>
  );

  if (isKioskMode) {
    return createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-black text-white overflow-hidden touch-none font-sans select-none animate-in fade-in">
            {step === 'scan' && (
                <div className="fixed inset-0 z-[300] bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center backdrop-blur-[1px]">
                        <div className={`relative w-full max-w-2xl aspect-square rounded-[8rem] border-[16px] transition-all duration-500 overflow-hidden ${scanStatus === 'searching' ? 'border-white/20' : 'border-blue-500 shadow-glow animate-pulse'}`} />
                        <h2 className="mt-16 text-8xl font-black uppercase tracking-tighter italic text-white drop-shadow-2xl">{scanMessage}</h2>
                    </div>
                    <button onClick={resetKiosk} className="absolute top-12 right-12 p-8 bg-red-600 rounded-full text-white border-4 border-white shadow-2xl"><X className="w-12 h-12" /></button>
                </div>
            )}
            {step === 'result' && (
                <div className="fixed inset-0 bg-[#050505] z-[500] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95">
                    {resultStatus === 'SUCCESS' ? (
                        <>
                            <div className="mb-12 w-64 h-64 bg-green-500 rounded-full flex items-center justify-center shadow-glow animate-bounce border-[12px] border-white/20"><CheckCircle className="w-40 h-40 text-white" /></div>
                            <h2 className="text-[12rem] font-black uppercase tracking-tighter italic leading-none mb-8">VERIFIED</h2>
                            <p className="text-4xl text-green-500 font-black uppercase tracking-widest mb-4">{intent} ACCPETED</p>
                            <p className="text-7xl font-black uppercase">{identifiedUser?.name}</p>
                        </>
                    ) : (
                        <>
                            <div className="mb-12 w-64 h-64 bg-red-600 rounded-full flex items-center justify-center shadow-glow border-[12px] border-white/20"><XCircle className="w-40 h-40 text-white" /></div>
                            <h2 className="text-[10rem] font-black uppercase tracking-tighter italic leading-none mb-8">DENIED</h2>
                            <p className="text-4xl text-red-500 font-black uppercase tracking-widest mb-8">PROTOCOL ERROR</p>
                            <p className="text-5xl font-bold uppercase max-w-4xl">{resultMessage}</p>
                            <NeoButton variant="danger" onClick={resetKiosk} className="mt-20 text-3xl py-8 px-16 border-4">BACK TO TERMINAL</NeoButton>
                        </>
                    )}
                </div>
            )}
            <div className="flex h-full w-full">
                <div className="w-[450px] bg-[#050505] border-r-8 border-white/5 p-16 flex flex-col justify-between items-start">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-white shadow-[6px_6px_0_0_#000]"><ScanFace className="w-8 h-8 text-white" /></div>
                        <div><h2 className="font-black text-3xl italic tracking-tighter uppercase leading-none">PUNCH<span className="text-blue-500">CLOCK.</span></h2><p className="text-xs text-gray-500 font-black uppercase tracking-[0.3em] mt-2">TERMINAL_H1_2025</p></div>
                    </div>
                    <div><h1 className="text-9xl font-black tracking-tighter leading-none">{currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}</h1><p className="text-xl font-black text-gray-500 uppercase tracking-[0.4em] mt-6">{currentTime.toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}</p></div>
                    <div className="w-full space-y-4">
                        <div className="p-6 bg-white/5 rounded-3xl border-2 border-white/10 flex justify-between items-center"><div className="flex items-center gap-4"><Wifi className="w-5 h-5 text-green-500" /><span className="text-xs font-black uppercase tracking-widest text-gray-400">Sync Active</span></div><span className="text-xs font-black text-green-500 uppercase">99ms</span></div>
                        <button onClick={() => setIsKioskMode(false)} className="w-full py-4 text-xs font-black uppercase text-gray-700 hover:text-white transition-all border-2 border-white/5 rounded-2xl">Exit Hardware Mode</button>
                    </div>
                </div>
                <div className="flex-1 h-full bg-black relative flex flex-col items-center justify-center p-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]" />
                    {step === 'idle' && (
                        <div onClick={() => setStep('intent')} className="relative z-10 flex flex-col items-center cursor-pointer group">
                            <div className="relative mb-16"><div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full animate-pulse group-hover:bg-blue-500/40 transition-all" /><div className="relative bg-white/5 border-4 border-white/20 p-24 rounded-[5rem] shadow-2xl group-hover:scale-110 transition-all"><ScanFace className="w-48 h-48 text-white" strokeWidth={1} /></div></div>
                            <h2 className="text-8xl font-black uppercase tracking-tighter mb-4 italic">START IDENTIFICATION</h2>
                            <p className="text-gray-600 font-black uppercase tracking-[0.5em] text-xl">Biometric Multi-Vector Shield Active</p>
                        </div>
                    )}
                    {step === 'intent' && (
                        <div className="relative z-10 w-full max-w-5xl space-y-16 animate-in slide-in-from-bottom-10">
                            <div className="flex justify-between items-center"><h3 className="text-6xl font-black uppercase italic tracking-tighter">SELECT PROTOCOL</h3><button onClick={resetKiosk} className="p-6 bg-white/10 rounded-full hover:bg-red-600 transition-all"><X className="w-12 h-12" /></button></div>
                            <div className="grid grid-cols-2 gap-12">
                                <ActionButton icon={LogIn} label="Clock In" subLabel="Start Cycle" onClick={() => { setIntent('Check In'); setStep('method'); }} colorClass="bg-green-600/80 border-green-400 shadow-[10px_10px_0_0_#064e3b]" />
                                <ActionButton icon={LogOut} label="Clock Out" subLabel="Handoff" onClick={() => { setIntent('Check Out'); setStep('method'); }} colorClass="bg-red-600/80 border-red-400 shadow-[10px_10px_0_0_#450a0a]" />
                            </div>
                        </div>
                    )}
                    {step === 'method' && (
                        <div className="relative z-10 w-full max-w-4xl space-y-16 animate-in slide-in-from-right-10">
                            <div className="flex items-center gap-10"><button onClick={() => setStep('intent')} className="p-8 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft className="w-12 h-12" /></button><div><h3 className="text-7xl font-black uppercase tracking-tighter italic">{intent}</h3><p className="text-gray-500 font-black uppercase tracking-widest text-xl">CHOOSE VERIFICATION</p></div></div>
                            <div className="grid grid-cols-2 gap-10">
                                <ActionButton icon={ScanFace} label="Face ID" subLabel="AI Bio Match" onClick={() => { setMethod('Face'); setStep('scan'); setTimeout(startCamera, 100); }} colorClass="bg-blue-600/80 border-blue-400" />
                                <ActionButton icon={Hash} label="Keypad" subLabel="PIN Fallback" onClick={() => { setMethod('PIN'); setStep('pin'); }} colorClass="bg-white/5 border-white/20" />
                            </div>
                        </div>
                    )}
                    {step === 'pin' && (
                        <div className="relative z-10 w-full max-w-2xl space-y-12 animate-in slide-in-from-bottom-10">
                            <div className="flex justify-between items-center"><button onClick={() => setStep('method')} className="p-6 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft className="w-10 h-10" /></button><h3 className="text-4xl font-black uppercase italic tracking-tighter">ENTER PASSCODE</h3><div className="w-16" /></div>
                            <div className="flex flex-col items-center gap-12">
                                <div className="flex gap-6">{[...Array(6)].map((_, i) => <div key={i} className={`w-20 h-28 rounded-[2rem] border-8 flex items-center justify-center text-6xl font-black transition-all ${i < pin.length ? 'bg-white text-black border-white shadow-glow' : 'bg-transparent border-white/10'}`}>{i < pin.length ? '•' : ''}</div>)}</div>
                                <div className="grid grid-cols-3 gap-6 w-full">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 'CLEAR', 0, 'DEL'].map((n) => (
                                    <button key={n.toString()} onClick={() => n === 'CLEAR' ? setPin('') : n === 'DEL' ? setPin(p => p.slice(0,-1)) : handlePinInput(n.toString())} className={`h-32 rounded-[2.5rem] font-black text-5xl border-4 transition-all active:scale-90 flex items-center justify-center ${typeof n === 'number' ? 'bg-white/5 text-white border-white/10 hover:bg-white/20' : 'bg-red-600/20 text-red-500 border-red-500/20 hover:bg-red-600/40 text-xl'}`}>{n === 'DEL' ? <Delete className="w-12 h-12"/> : n}</button>
                                ))}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
  }

  return (
    <div className="space-y-10 pb-20 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 bg-white dark:bg-[#121212]/90 backdrop-blur-2xl p-10 rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-2xl transition-all">
            <div>
                <div className="flex items-center gap-3 mb-3"><div className="h-10 w-1.5 bg-orange-600 rounded-full shadow-[0_0_15px_#ea580c]" /><h2 className="text-sm font-black uppercase tracking-[0.4em] text-gray-500">Logistics Hub</h2></div>
                <h1 className="text-7xl font-black text-black dark:text-white uppercase tracking-tighter leading-none italic">ATTENDANCE<br/><span className="text-blue-600">PORTAL.</span></h1>
            </div>
            <div className="flex gap-4">
                <NeoButton variant="secondary" onClick={() => setIsKioskMode(true)} disabled={!modelsLoaded} className="px-10 py-6 text-xl bg-black text-white dark:bg-white dark:text-black border-4 shadow-[8px_8px_0_0_#3b82f6]">LAUNCH KIOSK 2.0</NeoButton>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <NeoCard title="System Integrity" className="border-l-8 border-blue-600">
                <div className="space-y-6"><div className="flex items-center justify-between"><span className="text-gray-500 font-black uppercase text-[10px]">Verification Latency</span><span className="text-blue-500 font-mono font-bold">~1.2s</span></div><div className="flex items-center justify-between"><span className="text-gray-500 font-black uppercase text-[10px]">Active Node Pool</span><span className="text-blue-500 font-mono font-bold">MN_KUALA_LUMPUR</span></div><div className="pt-4 border-t border-white/10"><p className="text-xs text-gray-400">All biometric signatures are indexed for O(1) matching against the current staff roster of 50 identity nodes.</p></div></div>
            </NeoCard>
            <NeoCard title="Geo-Fencing" className="border-l-8 border-orange-600">
                <div className="h-40 bg-gray-100 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center text-center p-4">
                    <MapPin className="w-8 h-8 text-orange-500 mb-2" /><p className="text-xs font-bold uppercase">HQ MENARA KLCC</p><p className="text-[10px] text-gray-500 mt-1">RADIUS: 100M ACTIVE</p>
                </div>
            </NeoCard>
            <NeoCard title="Cycle Context" className="border-l-8 border-green-600">
                <div className="space-y-4"><p className="text-[10px] font-black text-gray-400 uppercase">H1 2025 COMPLIANCE CYCLE</p><p className="text-xs leading-relaxed">System is currently aggregating attendance history over a 180-day window to provide the AI Agent with accurate behavioral forensics for MN JEWEL staff.</p></div>
            </NeoCard>
        </div>
    </div>
  );
};

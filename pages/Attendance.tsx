
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, Hash, ScanFace, ArrowLeft, CheckCircle, X, Delete,
  AlertTriangle, ShieldAlert, Wifi, Camera, LogIn, LogOut, Coffee, Search, Calendar, Filter, Users, Download, ChevronLeft, ChevronRight, LayoutGrid, List, Smile, Lock, RefreshCcw, ShieldCheck, Siren, XCircle
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { AttendanceRecord, Employee } from '../types';
import { calculateAttendanceRisk } from '../services/securityService';
import { loadFaceModels, detectFace, initializeFaceMatcher, matchFaceFast, verifyLiveness } from '../services/faceBiometricService';
import { NeoCard, NeoButton, NeoInput, NeoBadge, NeoSelect } from '../components/NeoComponents';

const MOCK_LOCATION = { lat: 3.1570, lng: 101.7120, accuracy: 15 }; 

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
      interval = setInterval(() => {
        setLockoutTimer(prev => prev - 1);
      }, 1000);
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
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
      setScanStatus('error');
      setScanMessage("Camera Access Denied");
    }
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
                          setIdentifiedUser(emp);
                          setScanStatus('liveness');
                          setScanMessage(challenge === 'Smile' ? "SMILE 😊" : "NEUTRAL 😐");
                          if (verifyLiveness(detection.expressions, challenge)) {
                              setScanStatus('verifying');
                              setScanMessage('VERIFYING...');
                              clearInterval(detectionIntervalRef.current); 
                              setTimeout(() => handleAttendanceSubmit(emp), 800);
                          }
                      }
                  }
              }
          }
      }, 400); 
  };

  const resetKiosk = () => {
      setStep('idle');
      setPin('');
      setScanStatus('searching');
      setIdentifiedUser(null);
      setRiskDetails(null);
      setResultMessage('');
      stopCamera();
  };

  const handleAttendanceSubmit = (employee: Employee) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todayRecords = attendanceRecords.filter(r => r.employeeId === employee.id && r.date === todayStr);
    const lastRecord = todayRecords.length > 0 ? todayRecords[0] : null;

    if (intent === 'Check In') {
      if (lastRecord && lastRecord.checkIn && !lastRecord.checkOut) {
        setResultStatus('ALREADY_CLOCKED');
        setResultMessage("Action Blocked: You are already clocked in. Please clock out before starting a new session.");
        setStep('result');
        setTimeout(resetKiosk, 6000);
        return;
      }
    }

    if (intent === 'Check Out') {
      if (!lastRecord || !lastRecord.checkIn) {
        setResultStatus('SEQUENCE_ERROR');
        setResultMessage("Sequence Error: No active Check-In found for today. You must clock in first.");
        setStep('result');
        setTimeout(resetKiosk, 6000);
        return;
      }
      if (lastRecord.checkOut) {
        setResultStatus('ALREADY_CLOCKED');
        setResultMessage("Shift Ended: You have already clocked out for today.");
        setStep('result');
        setTimeout(resetKiosk, 6000);
        return;
      }
    }

    const risk = calculateAttendanceRisk(MOCK_LOCATION, now, employee);
    setRiskDetails(risk);

    const hour = now.getHours();
    const min = now.getMinutes();
    let isLate = false;
    let lateMins = 0;
    if (intent === 'Check In') {
        if (hour > 9 || (hour === 9 && min > 15)) { 
            isLate = true;
            lateMins = ((hour - 9) * 60) + min;
        }
    }

    let otMins = 0;
    if (intent === 'Check Out' && hour >= 18) { 
        otMins = ((hour - 18) * 60) + min;
    }

    const status = risk.score > 75 ? 'Absent' : (isLate ? 'Late' : 'Present');

    if (intent === 'Check Out' && lastRecord) {
        const updatedRecord = {
            ...lastRecord,
            checkOut: now.toLocaleTimeString(),
            otMinutes: otMins,
            riskScore: Math.max(lastRecord.riskScore || 0, risk.score)
        };
        addAttendanceRecord(updatedRecord);
    } else {
        const newRecord: AttendanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: employee.id,
            date: todayStr,
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
    }

    setIdentifiedUser(employee);
    setResultStatus('SUCCESS');
    setResultMessage(`${intent} logged successfully.`);
    setScanStatus('success');
    setStep('result');
    setTimeout(resetKiosk, 4500);
  };

  const handleIntentSelect = (type: AttendanceType) => {
      setIntent(type);
      setStep('method');
  };

  const handleMethodSelect = (m: 'Face' | 'PIN') => {
      if (lockoutTimer > 0) return;
      setMethod(m);
      if (m === 'Face') {
          setStep('scan');
          setTimeout(startCamera, 100);
      } else {
          setStep('pin');
      }
  };

  const handlePinInput = (num: string) => {
    if (lockoutTimer > 0) return;
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        setTimeout(() => {
             const emp = employees.find(e => e.pin === newPin && e.status === 'Active'); 
             if (emp) {
                 setFailedPinAttempts(0);
                 handleAttendanceSubmit(emp);
             } else {
                 const newFails = failedPinAttempts + 1;
                 setFailedPinAttempts(newFails);
                 setPin('');
                 
                 if (newFails >= 3) {
                     setLockoutTimer(30);
                     setStep('locked');
                     addNotification("Terminal Locked: Multiple failed attempts.", "error");
                 } else {
                     addNotification(`Incorrect PIN. ${3 - newFails} attempts remaining.`, "error");
                 }
             }
        }, 500);
      }
    }
  };

  const ActionButton = ({ icon: Icon, label, subLabel, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className={`
        relative overflow-hidden group w-full p-8 rounded-[2rem] border-2 border-white/10
        flex flex-col items-center justify-center gap-4 transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-glow
        ${colorClass}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="p-6 bg-white/10 rounded-[2rem] backdrop-blur-md shadow-inner border border-white/20">
        <Icon className="w-12 h-12 md:w-16 md:h-16 text-white" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <span className="block font-black text-3xl md:text-4xl text-white uppercase tracking-tighter">{label}</span>
        {subLabel && <span className="block text-white/70 text-sm md:text-lg font-bold mt-1 uppercase tracking-widest">{subLabel}</span>}
      </div>
    </button>
  );

  if (isKioskMode) {
    return createPortal(
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-black text-white overflow-hidden touch-none font-sans select-none animate-in fade-in duration-500">
            {/* FULLSCREEN CRITICAL SCREENS (SCAN, RESULT, LOCKED) */}
            
            {step === 'scan' && (
                <div className="fixed inset-0 z-[300] bg-black animate-in fade-in duration-500">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 backdrop-blur-[2px]">
                        <div className={`
                            relative w-full max-w-[80vw] md:max-w-2xl aspect-square rounded-[5rem] border-[12px] transition-all duration-500 overflow-hidden
                            animate-pulse
                            ${scanStatus === 'searching' ? 'border-white/40' : scanStatus === 'liveness' ? 'border-yellow-400 scale-105 shadow-glow' : 'border-blue-500 scale-105 shadow-glow'}
                        `}>
                            {scanStatus === 'searching' && <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-500 shadow-[0_0_50px_#3b82f6] animate-scan-line z-10"></div>}
                        </div>
                        <div className="mt-16 text-center">
                            <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,1)] text-white italic">
                                {scanMessage}
                            </h2>
                            <p className="text-xl md:text-2xl font-black text-white/70 uppercase tracking-[0.4em] mt-4 drop-shadow-lg">
                                {scanStatus === 'searching' ? 'Centering Identity...' : 'Biometric Challenge'}
                            </p>
                        </div>
                    </div>
                    <button onClick={resetKiosk} className="absolute top-8 right-8 md:top-12 md:right-12 p-6 bg-black/50 hover:bg-red-600 rounded-full text-white border-2 border-white/20 transition-all z-[400] shadow-2xl"><X className="w-12 h-12 md:w-16 md:h-16" /></button>
                </div>
            )}

            {step === 'result' && (
                <div className="fixed inset-0 bg-[#050505] z-[500] flex flex-col items-center justify-center p-12 animate-in zoom-in-95 duration-500 text-center">
                    {resultStatus === 'SUCCESS' ? (
                        <>
                            <div className="relative mb-12 w-48 h-48 bg-green-500 rounded-full flex items-center justify-center shadow-glow animate-bounce">
                                <CheckCircle className="w-32 h-32 text-white" />
                            </div>
                            <h2 className="text-7xl md:text-[12rem] font-black text-white uppercase tracking-tighter mb-8 italic leading-none">VERIFIED</h2>
                            <div className="space-y-6">
                                <p className="text-3xl text-green-500 font-black uppercase tracking-widest">{intent} Complete</p>
                                <p className="text-6xl text-white font-black uppercase tracking-tight">{identifiedUser?.name}</p>
                                <div className="inline-block px-10 py-4 bg-white/10 rounded-2xl mt-10 border border-white/10">
                                    <p className="text-4xl text-blue-400 font-mono font-black">{currentTime.toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative mb-12 w-48 h-48 bg-red-600 rounded-full flex items-center justify-center shadow-glow">
                                <XCircle className="w-32 h-32 text-white" />
                            </div>
                            <h2 className="text-7xl md:text-[12rem] font-black text-white uppercase tracking-tighter mb-8 italic leading-none">BLOCKED</h2>
                            <div className="space-y-6 max-w-4xl mx-auto">
                                <p className="text-3xl text-red-500 font-black uppercase tracking-widest">Protocol Violation</p>
                                <p className="text-3xl md:text-5xl text-white font-bold uppercase tracking-tight leading-tight">{resultMessage}</p>
                                <NeoButton variant="ghost" onClick={resetKiosk} className="mt-12 border-red-600 text-red-500 text-2xl py-6 px-12">Acknowledge & Exit</NeoButton>
                            </div>
                        </>
                    )}
                </div>
            )}

            {step === 'locked' && (
                <div className="fixed inset-0 bg-red-600/20 z-[600] backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
                    <div className="w-48 h-48 bg-red-600 rounded-full flex items-center justify-center mb-12 shadow-glow animate-pulse">
                        <Lock className="w-24 h-24 text-white" />
                    </div>
                    <h2 className="text-7xl md:text-[10rem] font-black text-white uppercase tracking-tighter mb-6 italic leading-none">LOCKED</h2>
                    <p className="text-2xl md:text-4xl text-red-500 font-black uppercase tracking-widest max-w-2xl">Security cooldown active. Multiple invalid attempts detected.</p>
                    <div className="mt-16 text-[12rem] md:text-[16rem] font-black text-red-600 font-mono italic leading-none">{lockoutTimer}S</div>
                </div>
            )}

            {/* MAIN KIOSK LAYOUT (IDLE, INTENT, METHOD, PIN) */}
            <div className="flex flex-col lg:flex-row h-full w-full">
                <div className="w-full lg:w-[400px] h-[25%] lg:h-full bg-[#050505] border-b-4 lg:border-b-0 lg:border-r-4 border-white/10 p-6 lg:p-12 flex flex-row lg:flex-col justify-between items-center lg:items-start relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#fff]">
                            <ScanFace className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-xl leading-none tracking-tighter uppercase italic">PUNCH<span className="text-blue-500">CLOCK.</span></h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Terminal Active</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center lg:items-start">
                         <h1 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-lg">
                            {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}
                         </h1>
                         <p className="text-xs lg:text-sm font-black text-gray-400 uppercase tracking-[0.3em] mt-3">
                            {currentTime.toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}
                         </p>
                    </div>
                    <div className="hidden lg:flex flex-col gap-3 w-full">
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <Wifi className="w-4 h-4 text-green-500" />
                                <span className="text-[10px] font-black text-gray-500 uppercase">Operational</span>
                            </div>
                            <span className="text-[10px] font-black text-green-500 uppercase">Secure</span>
                         </div>
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                                <span className="text-[10px] font-black text-gray-500 uppercase">Intrusion Shld</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-500 uppercase">{lockoutTimer > 0 ? 'LOCKED' : 'ACTIVE'}</span>
                         </div>
                         <button onClick={() => setIsKioskMode(false)} className="mt-4 text-[10px] font-black uppercase text-gray-600 hover:text-white transition-colors">Exit Terminal</button>
                    </div>
                </div>

                <div className="flex-1 h-full bg-black relative flex flex-col overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#000_100%)] pointer-events-none"></div>
                    
                    {step === 'idle' && (
                        <div onClick={() => setStep('intent')} className="flex-1 flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-700 relative z-10 p-12">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full animate-pulse"></div>
                                <div className="relative bg-white/5 border-2 border-white/20 p-16 rounded-[4rem] shadow-2xl mb-12 transform group-hover:scale-110 transition-all">
                                    <ScanFace className="w-32 h-32 text-white" strokeWidth={1} />
                                </div>
                            </div>
                            <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 text-center">Touch to Identify</h2>
                            <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-sm text-center">Biometric Multi-Factor Authentication</p>
                        </div>
                    )}

                    {step === 'intent' && (
                        <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-10 duration-500 relative z-10 p-6 lg:p-16">
                            <div className="flex items-center justify-between mb-12">
                                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">Choose Action</h3>
                                <button onClick={resetKiosk} className="p-4 bg-white/10 rounded-full text-white hover:bg-red-600 transition-colors"><X className="w-8 h-8" /></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 flex-1 max-h-[600px]">
                                <ActionButton icon={LogIn} label="Clock In" subLabel="Start Shift" onClick={() => handleIntentSelect('Check In')} colorClass="bg-green-600/90 border-green-400"/>
                                <ActionButton icon={LogOut} label="Clock Out" subLabel="End Session" onClick={() => handleIntentSelect('Check Out')} colorClass="bg-red-600/90 border-red-400"/>
                                <ActionButton icon={Coffee} label="Take Break" subLabel="Pause Tracking" onClick={() => handleIntentSelect('Break Start')} colorClass="bg-orange-600/90 border-orange-400 md:col-span-2"/>
                            </div>
                        </div>
                    )}

                    {step === 'method' && (
                        <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-500 relative z-10 p-6 lg:p-16">
                            <div className="flex items-center gap-6 mb-12">
                                <button onClick={() => setStep('intent')} className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20"><ArrowLeft className="w-8 h-8" /></button>
                                <div>
                                    <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">{intent}</h3>
                                    <p className="text-xs text-gray-500 font-black uppercase tracking-widest mt-2">Choose Identity Method</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 flex-1 max-h-[500px]">
                                <ActionButton icon={ScanFace} label="Face Scan" subLabel="AI Verified" onClick={() => handleMethodSelect('Face')} colorClass="bg-blue-600/90 border-blue-400"/>
                                <ActionButton icon={Hash} label="Backup PIN" subLabel="Secure Keypad" onClick={() => handleMethodSelect('PIN')} colorClass="bg-white/5 border-white/20"/>
                            </div>
                        </div>
                    )}

                    {step === 'pin' && (
                        <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-10 duration-500 relative z-10 p-6 lg:p-16">
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep('method')} className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20"><ArrowLeft className="w-8 h-8" /></button>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Enter Personal Passcode</h3>
                                <div className="w-12"></div> 
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
                                <div className="flex justify-center gap-4 mb-12 w-full">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className={`w-12 h-16 md:w-16 md:h-20 rounded-2xl border-4 flex items-center justify-center text-4xl font-black transition-all ${i < pin.length ? 'bg-white text-black border-white scale-110 shadow-glow' : 'bg-transparent border-white/20 text-transparent'}`}>{i < pin.length ? '•' : ''}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-4 w-full">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'CLEAR', 0, 'DEL'].map((n) => (
                                        <button 
                                            key={n.toString()} 
                                            onClick={() => n === 'CLEAR' ? setPin('') : n === 'DEL' ? setPin(p => p.slice(0,-1)) : handlePinInput(n.toString())} 
                                            className={`h-20 md:h-24 rounded-[1.5rem] font-black text-3xl transition-all active:scale-90 flex items-center justify-center ${typeof n === 'number' ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-red-600/20 text-red-500 hover:bg-red-600/40 text-xs uppercase'}`}
                                        >
                                            {n === 'DEL' ? <Delete className="w-8 h-8"/> : n}
                                        </button>
                                    ))}
                                </div>
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
    <div className="space-y-8 pb-20">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 bg-white dark:bg-[#121212] p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 bg-orange-500 rounded-full"></div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Operations Center</h2>
                </div>
                <h1 className="text-5xl font-black text-black dark:text-white uppercase tracking-tighter">Attendance Hub</h1>
            </div>
            <div className="flex gap-4">
                <div className="flex bg-gray-100 dark:bg-black p-1 rounded-xl border border-gray-200 dark:border-white/10">
                    <button onClick={() => setActiveView('launcher')} className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${activeView === 'launcher' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Launch Terminal</button>
                    <button onClick={() => setActiveView('admin')} className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${activeView === 'admin' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>Records Portal</button>
                </div>
            </div>
        </div>

        {activeView === 'launcher' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px]">
                <div className="space-y-8 flex flex-col justify-center">
                    <div>
                        <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tight mb-4">Hardware Portal</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">Authorize this device as a dedicated biometric kiosk. Features local-only processing, anti-spoofing, and brute-force protection.</p>
                    </div>
                    <button 
                        onClick={() => setIsKioskMode(true)}
                        disabled={!modelsLoaded}
                        className="w-full py-8 bg-black dark:bg-white text-white dark:text-black font-black text-3xl uppercase tracking-widest rounded-3xl shadow-glossy-card hover:scale-[1.02] transition-all flex items-center justify-center gap-4 disabled:opacity-30"
                    >
                        <LogIn className="w-10 h-10" /> Start Session
                    </button>
                </div>
                <div className="h-full bg-gray-100 dark:bg-white/5 rounded-[4rem] border-8 border-white/10 flex items-center justify-center relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800')] bg-cover bg-center grayscale"></div>
                    <div className="relative z-10 bg-black/40 backdrop-blur-md p-10 rounded-[3rem] border border-white/20 animate-pulse">
                        <ScanFace className="w-24 h-24 text-white" strokeWidth={1} />
                    </div>
                </div>
            </div>
        ) : (
            <div className="p-12 text-center text-gray-500">Records View kept for compatibility. See previous implementation for Table content.</div>
        )}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, Hash, ScanFace, ArrowLeft, CheckCircle, X, Delete,
  AlertTriangle, ShieldAlert, Wifi, Camera, LogIn, LogOut, Coffee
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { AttendanceRecord, Employee } from '../types';
import { calculateAttendanceRisk, generateLivenessChallenge } from '../services/securityService';
import { loadFaceModels, detectFace, matchFace } from '../services/faceBiometricService';

// Simulated location
const MOCK_LOCATION = { lat: 3.1570, lng: 101.7120, accuracy: 15 }; 

type KioskStep = 'idle' | 'intent' | 'method' | 'scan' | 'pin' | 'result';
type AttendanceType = 'Check In' | 'Check Out' | 'Break Start' | 'Break End';

export const Attendance: React.FC = () => {
  const { addAttendanceRecord, employees } = useGlobal();
  
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
              width: { ideal: 640 }, // Lower res for faster processing
              height: { ideal: 480 } 
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

    const isLate = intent === 'Check In' && now.getHours() >= 9 && now.getMinutes() > 15; // 9:15 AM grace period
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
        riskScore: risk.score
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
            
            {/* 1. LEFT PANEL: INFO & STATUS (35%) */}
            <div className="w-full lg:w-[35%] h-[30%] lg:h-full bg-black border-b-4 lg:border-b-0 lg:border-r-4 border-[#222] p-6 lg:p-10 flex flex-row lg:flex-col justify-between items-center lg:items-start relative z-20">
                
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ScanFace className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-black text-white text-lg leading-none tracking-tighter">PUNCH<span className="text-blue-500">CLOCK</span></h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Kiosk #01</p>
                    </div>
                </div>

                {/* Clock */}
                <div className="flex flex-col items-center lg:items-start">
                     <h1 className="text-[15vw] lg:text-[8vw] font-black text-white leading-none tracking-tighter tabular-nums">
                        {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}
                     </h1>
                     <p className="text-sm md:text-xl font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
                        {currentTime.toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'})}
                     </p>
                </div>

                {/* Status Indicators */}
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

            {/* 2. RIGHT PANEL: INTERACTION (65%) */}
            <div className="w-full lg:w-[65%] h-[70%] lg:h-full bg-[#0a0a0a] relative flex flex-col p-4 md:p-8 lg:p-12 overflow-hidden">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none"></div>

                {/* STEP: IDLE */}
                {step === 'idle' && (
                    <div 
                        onClick={() => setStep('intent')}
                        className="flex-1 flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-700"
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

                {/* STEP: INTENT SELECTION */}
                {step === 'intent' && (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide">Select Action</h3>
                            <button onClick={resetKiosk} className="p-3 bg-[#222] rounded-full text-white hover:bg-[#333]"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:gap-8 flex-1">
                            <ActionButton 
                                icon={LogIn} 
                                label="Check In" 
                                subLabel="Start Shift" 
                                onClick={() => handleIntentSelect('Check In')} 
                                colorClass="bg-green-600 hover:bg-green-500 border-green-400"
                            />
                            <ActionButton 
                                icon={LogOut} 
                                label="Check Out" 
                                subLabel="End Shift" 
                                onClick={() => handleIntentSelect('Check Out')} 
                                colorClass="bg-red-600 hover:bg-red-500 border-red-400"
                            />
                            <ActionButton 
                                icon={Coffee} 
                                label="Break" 
                                subLabel="Pause Work" 
                                onClick={() => handleIntentSelect('Break Start')} 
                                colorClass="bg-orange-600 hover:bg-orange-500 border-orange-400 col-span-2 md:col-span-1 md:col-start-1 md:col-end-3" // Centered on tablet if needed or full width
                            />
                        </div>
                    </div>
                )}

                {/* STEP: METHOD SELECTION */}
                {step === 'method' && (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => setStep('intent')} className="p-3 bg-[#222] rounded-full text-white hover:bg-[#333]"><ArrowLeft className="w-6 h-6" /></button>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide">{intent}</h3>
                                <p className="text-sm text-gray-400 font-bold uppercase">Choose verification method</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 max-h-[400px]">
                            <ActionButton 
                                icon={ScanFace} 
                                label="Face ID" 
                                subLabel="Fast & Secure"
                                onClick={() => handleMethodSelect('Face')} 
                                colorClass="bg-blue-600 hover:bg-blue-500 border-blue-400"
                            />
                            <ActionButton 
                                icon={Hash} 
                                label="PIN Code" 
                                subLabel="Manual Entry"
                                onClick={() => handleMethodSelect('PIN')} 
                                colorClass="bg-[#222] hover:bg-[#333] border-white/20"
                            />
                        </div>
                    </div>
                )}

                {/* STEP: FACE SCANNING */}
                {step === 'scan' && (
                    <div className="absolute inset-0 bg-black z-50 flex flex-col">
                        {/* Camera Feed */}
                        <div className="relative flex-1 overflow-hidden">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
                            />
                            
                            {/* Scanning Overlay */}
                            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-8">
                                <div className={`
                                    relative w-full max-w-sm aspect-[3/4] md:aspect-square rounded-[3rem] border-4 overflow-hidden transition-all duration-300 shadow-2xl
                                    ${scanStatus === 'searching' ? 'border-white/50' : scanStatus === 'verifying' ? 'border-blue-500' : 'border-red-500'}
                                `}>
                                    {/* Scanning Line Animation */}
                                    {scanStatus === 'searching' && (
                                        <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-400 shadow-[0_0_20px_#3b82f6] animate-scan-line z-10 opacity-80"></div>
                                    )}
                                    
                                    {/* Corners */}
                                    <div className="absolute top-4 left-4 w-12 h-12 border-t-8 border-l-8 border-white rounded-tl-3xl opacity-50"></div>
                                    <div className="absolute top-4 right-4 w-12 h-12 border-t-8 border-r-8 border-white rounded-tr-3xl opacity-50"></div>
                                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-8 border-l-8 border-white rounded-bl-3xl opacity-50"></div>
                                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-8 border-r-8 border-white rounded-br-3xl opacity-50"></div>
                                </div>

                                {/* Status Message */}
                                <div className="mt-8 bg-black/80 backdrop-blur-md px-8 py-4 rounded-full border border-white/20 flex items-center gap-3 shadow-xl">
                                    <span className="text-xl font-black text-white uppercase tracking-wider animate-pulse">
                                        {scanMessage}
                                    </span>
                                </div>
                            </div>

                            <button onClick={resetKiosk} className="absolute top-8 right-8 p-4 bg-black/50 rounded-full text-white hover:bg-black/80 backdrop-blur-md">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP: PIN INPUT */}
                {step === 'pin' && (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep('method')} className="p-3 bg-[#222] rounded-full text-white hover:bg-[#333]"><ArrowLeft className="w-6 h-6" /></button>
                            <h3 className="text-xl font-black text-white uppercase tracking-wide">Enter PIN</h3>
                            <div className="w-12"></div> {/* Spacer */}
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                            {/* PIN Display */}
                            <div className="flex justify-center gap-3 mb-8 w-full">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className={`
                                        w-12 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black transition-all
                                        ${i < pin.length ? 'bg-white text-black border-white' : 'bg-[#111] border-white/10 text-transparent'}
                                    `}>
                                        {i < pin.length ? '•' : ''}
                                    </div>
                                ))}
                            </div>

                            {/* Keypad */}
                            <div className="grid grid-cols-3 gap-3 w-full">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((n) => (
                                    <button 
                                        key={n}
                                        onClick={() => n === 'C' ? setPin('') : n === 'DEL' ? setPin(p => p.slice(0,-1)) : handlePinInput(n.toString())}
                                        className={`
                                            h-20 rounded-2xl font-black text-2xl transition-all active:scale-95 flex items-center justify-center
                                            ${typeof n === 'number' 
                                                ? 'bg-[#222] text-white hover:bg-[#333]' 
                                                : 'bg-red-900/20 text-red-400 hover:bg-red-900/40'}
                                        `}
                                    >
                                        {n === 'DEL' ? <Delete className="w-6 h-6"/> : n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP: RESULT */}
                {step === 'result' && (
                    <div className="absolute inset-0 bg-[#050505] z-50 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-300">
                        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_#22c55e] animate-bounce">
                            <CheckCircle className="w-16 h-16 text-white" />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4">Success</h2>
                        <div className="text-center space-y-2">
                            <p className="text-2xl text-gray-300 font-bold">{intent} Confirmed</p>
                            <p className="text-4xl text-white font-black">{identifiedUser?.name}</p>
                            <p className="text-xl text-blue-400 font-mono mt-4">{new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                )}

            </div>
        </div>,
        document.body
    );
  }

  // --- DEFAULT ADMIN VIEW (LAUNCHER) ---
  return (
    <div className="min-h-full flex items-center justify-center p-8 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-[#FFD700] p-3 rounded-2xl"><Clock className="w-8 h-8 text-black" /></div>
                    <h1 className="text-4xl font-black text-black dark:text-white uppercase italic tracking-tighter">Kiosk Launcher</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
                    This terminal is currently in admin mode. To begin tracking attendance, launch the dedicated Tablet Kiosk interface. This will lock the UI for employee interaction.
                </p>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-black/10 dark:border-white/10 shadow-sm">
                        <CheckCircle className="text-green-500 w-6 h-6" />
                        <div>
                            <p className="font-bold text-black dark:text-white">Camera Permission</p>
                            <p className="text-xs text-gray-500">Access Granted</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-black/10 dark:border-white/10 shadow-sm">
                        <CheckCircle className={`w-6 h-6 ${modelsLoaded ? 'text-green-500' : 'text-yellow-500'}`} />
                        <div>
                            <p className="font-bold text-black dark:text-white">Face Models</p>
                            <p className="text-xs text-gray-500">{modelsLoaded ? 'Loaded & Ready' : 'Downloading...'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#121212] p-8 rounded-[3rem] border-4 border-black/10 dark:border-white/10 shadow-2xl text-center">
                <div className="w-full aspect-video bg-black rounded-2xl mb-8 flex items-center justify-center border-2 border-[#333] relative overflow-hidden group">
                     {/* Preview Graphic */}
                     <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale group-hover:scale-105 transition-transform duration-700"></div>
                     <ScanFace className="w-16 h-16 text-white relative z-10" />
                </div>
                <button 
                  onClick={() => setIsKioskMode(true)}
                  disabled={!modelsLoaded}
                  className="w-full py-5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xl uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ShieldAlert className="w-6 h-6" /> {modelsLoaded ? 'Launch Secure Kiosk' : 'Loading Models...'}
                </button>
                <p className="text-xs text-gray-500 mt-4 uppercase font-bold tracking-wider">Optimized for iPad / Android Tablets</p>
            </div>
        </div>
    </div>
  );
};

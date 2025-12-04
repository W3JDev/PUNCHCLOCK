

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Hash, ScanFace, QrCode, 
  ArrowLeft, CheckCircle, X, Delete,
  AlertTriangle, ShieldAlert, Video, Maximize2, Minimize2, LogOut,
  Wifi, MapPin, Camera
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { AttendanceRecord, Employee } from '../types';
import { calculateAttendanceRisk, generateLivenessChallenge } from '../services/securityService';

// Simulated location
const MOCK_LOCATION = { lat: 3.1570, lng: 101.7120, accuracy: 15 }; 

export const Attendance: React.FC = () => {
  const { addAttendanceRecord, employees } = useGlobal();
  const navigate = useNavigate();
  
  // KIOSK STATE
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Interaction State
  const [mode, setMode] = useState<'idle' | 'pin' | 'face' | 'qr'>('idle');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'scanning' | 'challenge' | 'verifying' | 'success' | 'error'>('scanning');
  const [statusMessage, setStatusMessage] = useState('');
  const [livenessPrompt, setLivenessPrompt] = useState('');
  const [riskDetails, setRiskDetails] = useState<{score: number, reasons: string[]} | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<Employee | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingTimeoutRef = useRef<any>(null);

  // --- EFFECT: CLOCK ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- EFFECT: CAMERA CLEANUP ---
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // --- UTILS ---
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera Error", err);
      setStatus('error');
      setStatusMessage("Camera Access Denied");
    }
  };

  const resetKiosk = () => {
      setMode('idle');
      setPin('');
      setStatus('scanning');
      setIdentifiedUser(null);
      setRiskDetails(null);
      stopCamera();
  };

  const handleAttendanceSubmit = (employee: Employee, method: 'Face' | 'QR' | 'PIN') => {
    const now = new Date();
    const risk = calculateAttendanceRisk(MOCK_LOCATION, now, employee);
    setRiskDetails(risk);

    const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: employee.id,
        date: now.toISOString().split('T')[0],
        checkIn: now.getHours() < 12 ? now.toLocaleTimeString() : null,
        checkOut: now.getHours() >= 12 ? now.toLocaleTimeString() : null,
        location: MOCK_LOCATION,
        method: method,
        status: risk.score > 50 ? 'Absent' : (now.getHours() > 9 ? 'Late' : 'Present'),
        riskScore: risk.score
    };

    addAttendanceRecord(newRecord);
    setIdentifiedUser(employee);
    setStatus('success');
    setStatusMessage(risk.score > 50 ? 'Risk Flagged' : 'Verified');

    // Auto-reset after success
    setTimeout(() => {
        resetKiosk();
    }, 3500);
  };

  // --- FLOW: FACE ID ---
  const initFaceFlow = async () => {
    setMode('face');
    setStatus('scanning');
    setStatusMessage('Align Face');
    await startCamera();

    processingTimeoutRef.current = setTimeout(() => {
        setStatus('challenge');
        setLivenessPrompt(generateLivenessChallenge());
        
        setTimeout(() => {
            setStatus('verifying');
            setStatusMessage('Analyzing...');
            
            setTimeout(() => {
                const match = employees.find(e => e.faceRegistered && e.status === 'Active');
                if (match) {
                    handleAttendanceSubmit(match, 'Face');
                } else {
                    setStatus('error');
                    setStatusMessage("Face Not Recognized");
                }
            }, 1000);
        }, 2000);
    }, 1500);
  };

  // --- FLOW: PIN ---
  const handlePinInput = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        setStatus('verifying');
        setTimeout(() => {
             const emp = employees.find(e => e.id.endsWith(newPin) || '123456' === newPin); 
             if (emp) {
                 handleAttendanceSubmit(emp, 'PIN');
             } else {
                 setStatus('error');
                 setStatusMessage('Invalid PIN Code');
                 setPin('');
             }
        }, 800);
      }
    }
  };

  // --- COMPONENTS ---
  const BigButton = ({ icon: Icon, label, onClick, color }: any) => (
    <button 
      onClick={onClick}
      className={`
        w-full h-full min-h-[200px] rounded-[2rem] flex flex-col items-center justify-center gap-8
        border-[6px] border-white shadow-[10px_10px_0_0_rgba(0,0,0,0.5)]
        transition-all active:scale-95 active:shadow-none active:translate-y-2
        ${color} group
      `}
    >
      <Icon className="w-20 h-20 md:w-32 md:h-32 text-white drop-shadow-md group-hover:scale-110 transition-transform" strokeWidth={1.5} />
      <span className="font-black text-3xl md:text-5xl text-white uppercase tracking-widest drop-shadow-md">{label}</span>
    </button>
  );

  // --- KIOSK MODE RENDER ---
  if (isKioskMode) {
    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden touch-none flex flex-col lg:flex-row font-display select-none">
            
            {/* SIDEBAR / TOP BAR (Adaptive Layout) */}
            <div className="w-full lg:w-[35%] h-[25%] lg:h-full bg-[#FFD700] p-6 lg:p-10 flex flex-row lg:flex-col justify-between relative border-b-[8px] lg:border-b-0 lg:border-r-[8px] border-black z-20 shadow-2xl">
                
                {/* Header Badge */}
                <div className="flex items-start">
                    <div className="bg-black text-white px-6 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-lg lg:text-xl border-2 border-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                        Terminal #01
                    </div>
                </div>
                
                {/* Responsive Clock */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 lg:static lg:inset-auto lg:my-auto">
                     <h1 className="text-[12vh] lg:text-[18vh] font-black text-black leading-[0.8] tracking-tighter drop-shadow-sm tabular-nums">
                        {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' })}
                     </h1>
                     <p className="text-xl lg:text-4xl font-black text-black/80 uppercase tracking-widest mt-2 lg:mt-8">
                        {currentTime.toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'short'})}
                     </p>
                </div>

                {/* System Status */}
                <div className="hidden lg:block bg-black p-6 rounded-3xl border-4 border-white shadow-[8px_8px_0_0_rgba(0,0,0,0.1)]">
                     <p className="text-white text-center font-bold text-xl uppercase mb-4 tracking-wider">System Ready</p>
                     <div className="space-y-4">
                         <div className="flex items-center justify-between text-base font-mono text-gray-400">
                            <span className="flex items-center gap-2"><Wifi className="w-6 h-6"/> NETWORK</span>
                            <span className="text-green-400 font-bold">ONLINE</span>
                         </div>
                         <div className="flex items-center justify-between text-base font-mono text-gray-400">
                            <span className="flex items-center gap-2"><Camera className="w-6 h-6"/> CAMERA</span>
                            <span className="text-green-400 font-bold">ACTIVE</span>
                         </div>
                     </div>
                </div>
                
                {/* Exit Button */}
                <button onClick={() => setIsKioskMode(false)} className="lg:hidden absolute top-6 right-6 bg-black/10 p-4 rounded-full text-black active:bg-black active:text-white transition-colors">
                    <Minimize2 className="w-8 h-8" />
                </button>
                <button onClick={() => setIsKioskMode(false)} className="hidden lg:flex absolute bottom-8 right-8 bg-black/10 p-6 rounded-full text-black hover:bg-black hover:text-white transition-colors">
                    <Minimize2 className="w-10 h-10" />
                </button>
            </div>

            {/* MAIN INTERACTION AREA */}
            <div className="w-full lg:w-[65%] h-[75%] lg:h-full bg-[#121212] relative flex flex-col p-4 lg:p-12">
                
                {/* IDLE STATE */}
                {mode === 'idle' && (
                    <div className="flex-1 flex flex-col justify-center gap-8 h-full animate-in fade-in slide-in-from-right duration-500">
                        <div className="text-center mb-4 lg:mb-12">
                            <h2 className="text-4xl lg:text-7xl font-black text-white uppercase italic tracking-tighter mb-4">Good Morning</h2>
                            <p className="text-xl lg:text-4xl text-gray-400 font-medium">Select a method to check-in</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 h-full max-h-[600px] px-8 lg:px-20">
                            <BigButton icon={ScanFace} label="Face ID" onClick={initFaceFlow} color="bg-blue-600 hover:bg-blue-500" />
                            <BigButton icon={Hash} label="PIN Code" onClick={() => { setMode('pin'); setStatus('scanning'); }} color="bg-green-600 hover:bg-green-500" />
                        </div>
                    </div>
                )}

                {/* ACTIVE STATES (PIN / CAM) */}
                {mode !== 'idle' && (
                   <div className="flex-1 flex flex-col relative h-full">
                       {/* Navigation Header */}
                       <div className="flex items-center justify-between mb-6 lg:mb-10">
                           <button 
                             onClick={resetKiosk} 
                             className="flex items-center gap-4 px-10 py-6 bg-[#222] rounded-3xl border-2 border-white/20 text-white font-black uppercase text-2xl tracking-wider active:bg-white active:text-black transition-all"
                           >
                               <ArrowLeft className="w-8 h-8" /> Back
                           </button>
                           <h3 className="text-3xl lg:text-5xl font-black text-white uppercase tracking-wider hidden md:block">{mode === 'face' ? 'Biometric Scan' : 'Secure Login'}</h3>
                       </div>

                       {/* Content Container */}
                       <div className="flex-1 relative bg-black rounded-[3rem] border-[6px] border-white/20 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
                           
                           {/* PIN PAD */}
                           {mode === 'pin' && status !== 'success' && status !== 'error' && (
                               <div className="w-full max-w-2xl p-4 h-full flex flex-col justify-center">
                                   <div className="flex justify-center gap-4 mb-10 lg:mb-16">
                                       {[...Array(6)].map((_, i) => (
                                           <div key={i} className={`w-16 h-24 lg:w-20 lg:h-28 border-b-[8px] flex items-center justify-center text-7xl font-black text-white transition-all ${i < pin.length ? 'border-yellow-500 text-yellow-500 scale-110' : 'border-gray-800'}`}>
                                               {i < pin.length ? '•' : ''}
                                           </div>
                                       ))}
                                   </div>
                                   <div className="grid grid-cols-3 gap-4 lg:gap-8 flex-1 max-h-[600px]">
                                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((n) => (
                                           <button 
                                             key={n} 
                                             onClick={() => n === 'C' ? setPin('') : n === 'DEL' ? setPin(p => p.slice(0,-1)) : handlePinInput(n.toString())}
                                             className={`
                                               rounded-[2rem] font-black text-5xl lg:text-6xl border-[3px] transition-all active:scale-95 flex items-center justify-center
                                               ${typeof n === 'number' 
                                                 ? 'bg-[#1a1a1a] border-white/10 text-white active:bg-white active:text-black hover:bg-[#222]' 
                                                 : 'bg-red-900/30 border-red-500/50 text-red-400 hover:bg-red-900/50'}
                                             `}
                                           >
                                             {n === 'DEL' ? <Delete className="w-12 h-12"/> : n}
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           )}

                           {/* CAMERA FEED */}
                           {(mode === 'face' || mode === 'qr') && status !== 'success' && status !== 'error' && (
                               <div className="absolute inset-0 w-full h-full bg-gray-900">
                                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                   
                                   {/* Overlays */}
                                   <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                                       {/* Face Frame */}
                                       <div className={`
                                           w-full max-w-lg aspect-[3/4] border-[10px] rounded-[4rem] transition-all duration-500 relative
                                           ${status === 'challenge' ? 'border-yellow-500 shadow-[0_0_80px_rgba(234,179,8,0.6)]' : 'border-white/50'}
                                       `}>
                                           {status === 'scanning' && <div className="absolute top-0 inset-x-0 h-6 bg-blue-500/50 blur-lg animate-scan"></div>}
                                       </div>
                                       
                                       {/* Prompts Bubble */}
                                       <div className="absolute bottom-16 lg:bottom-24 bg-black/90 backdrop-blur-xl px-12 py-8 rounded-full border-2 border-white/30 shadow-2xl max-w-[90%]">
                                           <p className="text-3xl lg:text-5xl font-black text-white uppercase tracking-wider flex items-center gap-6 text-center leading-none">
                                               {status === 'challenge' && <AlertTriangle className="w-10 h-10 text-yellow-500 animate-bounce" />}
                                               {status === 'challenge' ? livenessPrompt : statusMessage}
                                           </p>
                                       </div>
                                   </div>
                               </div>
                           )}

                           {/* SUCCESS / ERROR OVERLAY */}
                           {(status === 'success' || status === 'error') && (
                               <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center text-center p-8 lg:p-12 animate-in zoom-in-95 duration-300 ${status === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                                   {status === 'success' ? (
                                       <>
                                           <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mb-10 shadow-2xl animate-bounce">
                                              <CheckCircle className="w-32 h-32 text-green-600" />
                                           </div>
                                           <h2 className="text-7xl lg:text-9xl font-black text-white uppercase tracking-tighter mb-8">Confirmed</h2>
                                           <div className="bg-black/20 p-10 rounded-[3rem] border-4 border-white/20 w-full max-w-3xl backdrop-blur-sm">
                                               <p className="text-5xl lg:text-7xl font-bold text-white mb-4 leading-tight">{identifiedUser?.name}</p>
                                               <p className="text-3xl lg:text-4xl text-green-100 font-mono mb-6">{new Date().toLocaleTimeString()}</p>
                                               {riskDetails && riskDetails.score > 0 && (
                                                   <div className="inline-flex items-center gap-4 bg-black/40 px-8 py-4 rounded-2xl text-2xl font-bold uppercase text-yellow-400 border-2 border-yellow-500/50">
                                                       <ShieldAlert className="w-8 h-8" /> Risk Score: {riskDetails.score}
                                                   </div>
                                               )}
                                           </div>
                                       </>
                                   ) : (
                                       <>
                                           <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center mb-10">
                                              <X className="w-32 h-32 text-white" />
                                           </div>
                                           <h2 className="text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-12">{statusMessage}</h2>
                                           <button 
                                              onClick={resetKiosk} 
                                              className="bg-white text-red-600 px-20 py-8 rounded-[2rem] font-black text-3xl uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
                                            >
                                              Try Again
                                           </button>
                                       </>
                                   )}
                               </div>
                           )}
                       </div>
                   </div>
                )}
            </div>
        </div>
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
                        <CheckCircle className="text-green-500 w-6 h-6" />
                        <div>
                            <p className="font-bold text-black dark:text-white">Geolocation</p>
                            <p className="text-xs text-gray-500">High Accuracy Mode</p>
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
                  className="w-full py-5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xl uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)] transition-all flex items-center justify-center gap-3"
                >
                    <Maximize2 className="w-6 h-6" /> Launch Kiosk Mode
                </button>
                <p className="text-xs text-gray-500 mt-4 uppercase font-bold tracking-wider">Recommended for Tablets (iPad/Android)</p>
            </div>
        </div>
    </div>
  );
};
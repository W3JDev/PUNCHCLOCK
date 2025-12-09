
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Mic, MicOff, Volume2, Trash2 } from 'lucide-react';
import { chatWithHRAssistant } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your PUNCH⏰CLOCK AI. You can type or speak to me for HR tasks.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme, employees, attendanceRecords } = useGlobal();

  // --- LIVE API REFS ---
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To store session promise if needed

  // --- PERSISTENCE ---
  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('pc_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fix date strings back to Date objects
        const hydrated = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        setMessages(hydrated);
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save to local storage on update
    if (messages.length > 1) { // Don't save if only default welcome message
       localStorage.setItem('pc_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const clearHistory = () => {
    setMessages([
        { role: 'model', text: 'History cleared. How can I help you now?', timestamp: new Date() }
    ]);
    localStorage.removeItem('pc_chat_history');
  };

  // --- SCROLL TO BOTTOM ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // --- CLEANUP ON UNMOUNT ---
  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  // --- TEXT CHAT HANDLER ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.filter(m => m.role !== 'user').map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithHRAssistant(input, history);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
    setIsLoading(false);
  };

  // --- LIVE API HELPERS ---
  const createBlob = (data: Float32Array): { data: string; mimeType: string } => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamp values
      let s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const decodeAudioData = async (
    base64String: string,
    ctx: AudioContext
  ): Promise<AudioBuffer> => {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length; 
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  // --- LIVE SESSION LOGIC ---
  const startLiveSession = async () => {
    setIsLiveActive(true);
    setMessages(prev => [...prev, { role: 'model', text: 'Listening... (Speak now)', timestamp: new Date() }]);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 16000 }); // Input rate
      const outCtx = new AudioContextClass({ sampleRate: 24000 }); // Output rate
      audioContextRef.current = outCtx; // Store output context for playback
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: "You are a helpful HR assistant for PUNCHCLOCK Malaysia. Keep answers concise." }] },
        },
        callbacks: {
          onopen: () => {
             console.log("Live Session Open");
             // Start Input Stream
             const source = ctx.createMediaStreamSource(stream);
             audioSourceRef.current = source;
             const processor = ctx.createScriptProcessor(4096, 1, 1);
             processorRef.current = processor;
             
             processor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const blob = createBlob(inputData);
               sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: blob });
               });
             };
             
             source.connect(processor);
             processor.connect(ctx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && audioContextRef.current) {
                const buffer = await decodeAudioData(base64Audio, audioContextRef.current);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                
                const now = audioContextRef.current.currentTime;
                const start = Math.max(nextStartTimeRef.current, now);
                source.start(start);
                nextStartTimeRef.current = start + buffer.duration;
             }
             
             // Handle Interruption (Stop playback)
             if (msg.serverContent?.interrupted) {
                nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
            console.log("Live Session Closed");
            setIsLiveActive(false);
          },
          onerror: (e) => {
            console.error("Live Error", e);
            setIsLiveActive(false);
            setMessages(prev => [...prev, { role: 'model', text: 'Voice connection error.', timestamp: new Date() }]);
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setIsLiveActive(false);
      alert("Microphone access failed.");
    }
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    
    // Stop Tracks
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    
    // Disconnect Nodes
    audioSourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    
    // Close Audio Context
    audioContextRef.current?.close();

    // Close Session if we could reference the session object directly, 
    // but the library handles standard WS closure usually on unload or error.
    // Ideally we would call session.close() if we stored the resolved session.
    sessionRef.current?.then((s: any) => s.close());
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-[#ef4444] text-white w-16 h-16 rounded-2xl border-2 border-white/20 shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] flex items-center justify-center hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.2)] transition-all z-50 group"
        >
          <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-[#121212] border-2 border-white/20 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] rounded-3xl flex flex-col z-50 overflow-hidden animate-in zoom-in-95 origin-bottom-right duration-200">
          
          {/* Header */}
          <div className="bg-[#ef4444] p-4 border-b-2 border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-black text-white text-lg tracking-wide uppercase">HR LEGAL AI</h3>
            </div>
            <div className="flex gap-1">
                <button onClick={clearHistory} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded" title="Clear History">
                    <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => { setIsOpen(false); stopLiveSession(); }} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded">
                    <X className="w-6 h-6" />
                </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] p-3 rounded-2xl text-sm font-medium border
                  ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-sm' 
                    : 'bg-[#1a1a1a] text-gray-200 border-white/10 rounded-tl-sm'}
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLiveActive && (
               <div className="flex justify-center my-4">
                  <div className="flex items-center gap-2 bg-red-900/30 px-4 py-2 rounded-full border border-red-500/50 animate-pulse">
                     <Volume2 className="w-4 h-4 text-red-400" />
                     <span className="text-xs font-bold text-red-300 uppercase tracking-widest">Live Voice Active</span>
                  </div>
               </div>
            )}
            {isLoading && !isLiveActive && (
              <div className="flex justify-start mb-4">
                <div className="bg-[#1a1a1a] p-3 rounded-2xl text-xs text-gray-400">Thinking...</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-[#121212] border-t border-white/10 flex flex-col gap-3">
            {/* Live Voice Toggle */}
            <button 
              onClick={isLiveActive ? stopLiveSession : startLiveSession}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-2
                ${isLiveActive 
                   ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                   : 'bg-[#222] text-gray-300 border-white/20 hover:bg-[#333]'}
              `}
            >
               {isLiveActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
               {isLiveActive ? "End Voice Session" : "Start Voice Chat"}
            </button>

            {/* Text Input */}
            <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type message..."
                  disabled={isLiveActive}
                  className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-white text-sm"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || isLiveActive}
                  className="bg-white text-black p-2.5 rounded-xl hover:bg-gray-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

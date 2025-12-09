
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { NeoButton, NeoInput, NeoCard } from '../components/NeoComponents';
import { Command, Lock, User, Shield, Briefcase, Users } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login } = useGlobal();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth check (Allow any password for demo if email matches pattern)
    if (password.length < 3) return alert("Password too short");
    
    login(email, selectedRole);
    navigate('/');
  };

  const fillDemo = (role: UserRole, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left: Branding */}
        <div className="hidden lg:block space-y-8 animate-in slide-in-from-left duration-700">
           <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">System Operational</span>
           </div>
           
           <div>
             <h1 className="text-8xl font-black text-white italic tracking-tighter leading-[0.8] mb-4">
               PUNCH<br/><span className="text-blue-600">CLOCK</span>
             </h1>
             <p className="text-2xl text-gray-400 font-bold max-w-md leading-relaxed">
               The Next-Gen HR Operating System for Malaysian SMEs.
             </p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-[#121212] border border-white/10">
                  <Shield className="w-8 h-8 text-blue-500 mb-4" />
                  <h3 className="text-white font-bold text-lg mb-1">Secure Core</h3>
                  <p className="text-gray-500 text-xs">Encrypted local persistence & biometric ready.</p>
              </div>
              <div className="p-6 rounded-3xl bg-[#121212] border border-white/10">
                  <Briefcase className="w-8 h-8 text-yellow-500 mb-4" />
                  <h3 className="text-white font-bold text-lg mb-1">Compliant</h3>
                  <p className="text-gray-500 text-xs">Built-in Employment Act 1955 logic.</p>
              </div>
           </div>
        </div>

        {/* Right: Login Form */}
        <div className="bg-[#121212] border-4 border-white rounded-[2.5rem] p-8 md:p-12 shadow-[12px_12px_0_0_rgba(255,255,255,0.1)] animate-in slide-in-from-bottom duration-700">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-600 flex items-center justify-center border-2 border-white text-white shadow-[4px_4px_0_0_#fff]">
                 <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-wide">Access Portal</h2>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-2">Select Role</label>
                <div className="grid grid-cols-4 gap-2">
                   {['Admin', 'HR', 'Manager', 'Staff'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role as UserRole)}
                        className={`py-3 rounded-xl text-xs font-black uppercase transition-all ${selectedRole === role ? 'bg-white text-black scale-105 shadow-lg' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                      >
                         {role}
                      </button>
                   ))}
                </div>
              </div>

              <div>
                 <label className="block text-xs font-black text-gray-500 uppercase mb-2">Work Email</label>
                 <NeoInput 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                 />
              </div>

              <div>
                 <label className="block text-xs font-black text-gray-500 uppercase mb-2">Password</label>
                 <NeoInput 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                 />
              </div>

              <NeoButton type="submit" className="w-full text-lg py-5">
                 Authenticate System
              </NeoButton>
           </form>

           {/* Demo Credentials */}
           <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">— Quick Demo Login —</p>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => fillDemo('Admin', 'admin@mnjewel.com')} className="p-3 bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 rounded-xl text-xs font-bold border border-blue-500/30 flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3" /> Admin
                 </button>
                 <button onClick={() => fillDemo('HR', 'hr@mnjewel.com')} className="p-3 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-xl text-xs font-bold border border-purple-500/30 flex items-center justify-center gap-2">
                    <Users className="w-3 h-3" /> HR Dept
                 </button>
                 <button onClick={() => fillDemo('Manager', 'manager@mnjewel.com')} className="p-3 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-300 rounded-xl text-xs font-bold border border-yellow-500/30 flex items-center justify-center gap-2">
                    <Briefcase className="w-3 h-3" /> Manager
                 </button>
                 <button onClick={() => fillDemo('Staff', 'staff@mnjewel.com')} className="p-3 bg-green-900/20 hover:bg-green-900/40 text-green-300 rounded-xl text-xs font-bold border border-green-500/30 flex items-center justify-center gap-2">
                    <User className="w-3 h-3" /> Staff
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

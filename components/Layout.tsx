

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  Banknote, 
  ShieldAlert, 
  LogOut,
  Command,
  UserCircle,
  Menu,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { UserRole } from '../types';
import { NeoToast } from './ui/NeoToast';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  colorClass: string;
  onClick?: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, colorClass, onClick, isCollapsed }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-4 py-5 mb-3 rounded-xl transition-all duration-100 group relative
        ${isCollapsed ? 'justify-center px-2' : 'px-6'}
        border-2
        ${isActive 
          ? `bg-white border-white text-black shadow-[4px_4px_0_0_#ccc] dark:shadow-[4px_4px_0_0_#ccc]` 
          : 'bg-transparent border-transparent text-gray-500 dark:text-gray-300 hover:bg-[#222] hover:border-black/50 dark:hover:border-white/50 hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon 
            className={`w-8 h-8 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} 
            strokeWidth={isActive ? 3 : 2}
          />
          
          {!isCollapsed && (
            <span className={`
              font-display font-bold uppercase tracking-wide text-lg relative z-10 whitespace-nowrap
              ${isActive ? 'text-black' : 'text-gray-500 dark:text-gray-300 group-hover:text-white'}
            `}>
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

// Updated Configuration: Onboarding is strictly for Staff (New Hires) to see in sidebar.
// Admins manage it via Employees page.
const NAV_CONFIG = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ['Admin', 'HR', 'Manager', 'Staff'], color: "bg-blue-500" },
  { to: "/attendance", icon: Clock, label: "Smart Kiosk", roles: ['Admin', 'Manager'], color: "bg-orange-500" },
  { to: "/employees", icon: Users, label: "Employees", roles: ['Admin', 'HR', 'Manager'], color: "bg-purple-500" },
  { to: "/shifts", icon: CalendarDays, label: "Schedule", roles: ['Admin', 'HR', 'Manager', 'Staff'], color: "bg-green-500" },
  { to: "/payroll", icon: Banknote, label: "Payroll", roles: ['Admin', 'HR'], color: "bg-yellow-500" },
  { to: "/compliance", icon: ShieldAlert, label: "Compliance", roles: ['Admin', 'HR'], color: "bg-red-500" },
  { to: "/onboarding", icon: BookOpen, label: "Onboarding", roles: ['Staff'], color: "bg-pink-500" },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, t, currentUser, switchRole, notifications, removeNotification, theme, toggleTheme } = useGlobal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredNav = NAV_CONFIG.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="flex min-h-screen font-sans text-black dark:text-white relative bg-gray-100 dark:bg-black transition-colors duration-300">
      
      {/* Notifications */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col items-end pointer-events-none w-full max-w-md px-4">
        <div className="pointer-events-auto w-full">
          {notifications.map(n => (
            <NeoToast 
              key={n.id} 
              message={n.message} 
              type={n.type} 
              onClose={() => removeNotification(n.id)} 
            />
          ))}
        </div>
      </div>

      <PWAInstallPrompt />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-24 bg-white dark:bg-black border-b-2 border-black dark:border-white z-30 flex items-center justify-between px-6">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 border-2 border-black dark:border-white flex items-center justify-center text-white">
               <Command className="w-6 h-6" />
             </div>
             <h1 className="text-2xl font-black italic tracking-tighter text-black dark:text-white">PUNCH<span className="text-blue-500">⏰CLOCK</span></h1>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 border-2 border-black dark:border-white rounded-lg text-black dark:text-white active:bg-black active:text-white dark:active:bg-white dark:active:text-black">
            <Menu className="w-8 h-8" />
         </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/90 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col transform transition-all duration-300 ease-in-out md:translate-x-0 md:static border-r-2 border-black dark:border-white bg-gray-50 dark:bg-black
        ${isMobileMenuOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-32' : 'md:w-80'}
      `}>
          
          {/* Mobile Close Button */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-white md:hidden p-2 border-2 border-white rounded-lg bg-red-600">
            <X className="w-6 h-6" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-5 top-12 bg-white border-2 border-black text-black rounded-full p-2 hover:bg-blue-500 hover:text-white transition-colors z-50 shadow-md"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Logo Area */}
          <div className={`relative z-10 flex items-center gap-4 border-b-2 border-black/10 dark:border-white/20 transition-all duration-300 ${isCollapsed ? 'p-6 justify-center' : 'p-8'}`}>
              <div className="w-12 h-12 shrink-0 bg-blue-600 border-2 border-black dark:border-white flex items-center justify-center shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                 <Command className="w-8 h-8 text-white" />
               </div>
               {!isCollapsed && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <h1 className="text-2xl font-display font-black italic tracking-tighter text-black dark:text-white leading-none">
                     PUNCH<span className="text-blue-600">⏰</span><br/>CLOCK
                   </h1>
                 </div>
               )}
               {isCollapsed && (
                 <div className="sr-only">PUNCH⏰</div>
               )}
          </div>
          
          <div className="md:hidden h-20"></div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-2 relative z-10 scrollbar-hide">
            {filteredNav.map(item => (
              <NavItem 
                key={item.to} 
                to={item.to} 
                icon={item.icon} 
                label={item.to === '/' ? t.dashboard : item.label === 'Schedule' ? t.shifts : item.label === 'Onboarding' ? t.onboarding : item.label} 
                colorClass={item.color} 
                onClick={() => setIsMobileMenuOpen(false)}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* Footer Controls */}
          <div className={`bg-gray-100 dark:bg-[#111] border-t-2 border-black/10 dark:border-white/20 relative z-10 transition-all duration-300 ${isCollapsed ? 'p-4' : 'p-6'}`}>
             <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-12 h-12 shrink-0 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-md overflow-hidden">
                   {currentUser.avatar ? <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" /> : <UserCircle className="w-8 h-8 text-black" />}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                     <p className="text-lg font-bold text-black dark:text-white truncate w-40">{currentUser.name}</p>
                     <select 
                        className="text-sm text-blue-600 dark:text-blue-400 bg-transparent border-none p-0 cursor-pointer focus:ring-0 font-bold uppercase tracking-wider w-full"
                        value={currentUser.role}
                        onChange={(e) => switchRole(e.target.value as UserRole)}
                     >
                       <option value="Admin">Admin</option>
                       <option value="HR">HR Dept</option>
                       <option value="Manager">Manager</option>
                       <option value="Staff">Staff</option>
                     </select>
                  </div>
                )}
             </div>
             
             {!isCollapsed && (
               <div className="flex flex-col gap-2 mt-4">
                 <div className="flex gap-2">
                   <div className="flex-1 relative">
                     <select 
                       className="w-full appearance-none bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-2 text-sm font-bold text-center focus:outline-none text-black dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-white dark:hover:text-black transition-colors"
                       value={language}
                       onChange={(e) => setLanguage(e.target.value as any)}
                     >
                       <option value="en">EN</option>
                       <option value="ms">BM</option>
                       <option value="zh">CN</option>
                     </select>
                   </div>
                   
                   <button 
                     onClick={toggleTheme}
                     className="flex-1 flex items-center justify-center p-2 rounded-lg border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-gray-200 dark:hover:bg-white dark:hover:text-black transition-all"
                   >
                      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                   </button>
                 </div>

                 <button className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-600 border-2 border-black dark:border-white text-white hover:bg-red-500 transition-all text-sm font-bold uppercase shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                   <LogOut className="w-4 h-4" /> {t.logout}
                 </button>
               </div>
             )}
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:p-10 pt-28 p-6 overflow-y-auto h-screen relative z-10 bg-gray-100 dark:bg-black">
        <div className="max-w-[1800px] mx-auto pb-20">
           {children}
        </div>
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { NavLink, useLocation, Navigate } from 'react-router-dom';
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
  Moon,
  HelpCircle,
  Building,
  FileText,
  Github,
  Linkedin,
  Globe,
  MonitorPlay
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { UserRole } from '../types';
import { NeoToast } from './ui/NeoToast';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { PunchClockLogo } from './ui/BrutalistIcons';

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
        flex items-center gap-3 py-3 mb-2 rounded-lg transition-all duration-200 group relative
        ${isCollapsed ? 'justify-center px-2' : 'px-4'}
        border border-transparent
        ${isActive 
          ? `bg-white text-black shadow-md` 
          : 'text-gray-500 dark:text-gray-400 hover:bg-[#222] hover:text-white'}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon 
            className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} 
            strokeWidth={isActive ? 2.5 : 2}
          />
          
          {!isCollapsed && (
            <span className={`
              font-sans font-semibold text-sm relative z-10 whitespace-nowrap
              ${isActive ? 'text-black' : 'text-gray-500 dark:text-gray-300 group-hover:text-white'}
            `}>
              {label}
            </span>
          )}
          
          {/* Tooltip for collapsed state */}
          {isCollapsed && (
             <div className="absolute left-full ml-4 px-2 py-1 bg-white text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                {label}
             </div>
          )}
        </>
      )}
    </NavLink>
  );
};

const NAV_CONFIG = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ['Admin', 'HR', 'Manager', 'Staff'], color: "bg-blue-500" },
  { to: "/attendance", icon: Clock, label: "Smart Kiosk", roles: ['Admin', 'Manager'], color: "bg-orange-500" },
  { to: "/employees", icon: Users, label: "Employees", roles: ['Admin', 'HR', 'Manager'], color: "bg-purple-500" },
  { to: "/shifts", icon: CalendarDays, label: "Schedule", roles: ['Admin', 'HR', 'Manager', 'Staff'], color: "bg-green-500" },
  { to: "/payroll", icon: Banknote, label: "Payroll", roles: ['Admin', 'HR'], color: "bg-yellow-500" },
  { to: "/compliance", icon: ShieldAlert, label: "Compliance", roles: ['Admin', 'HR'], color: "bg-red-500" },
  { to: "/documents", icon: FileText, label: "Documents", roles: ['Admin', 'HR', 'Manager', 'Staff'], color: "bg-teal-500" },
  { to: "/organization", icon: Building, label: "Organization", roles: ['Admin', 'HR'], color: "bg-indigo-500" },
  { to: "/onboarding", icon: BookOpen, label: "Onboarding", roles: ['Staff'], color: "bg-pink-500" },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, t, currentUser, logout, notifications, removeNotification, theme, toggleTheme } = useGlobal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Redirect if not logged in (unless on login page)
  if (!currentUser && location.pathname !== '/login' && location.pathname !== '/showcase') {
      return <Navigate to="/login" replace />;
  }

  // Hide Layout for Login/Showcase Page
  if (location.pathname === '/login' || location.pathname === '/showcase') {
      return (
          <>
             <div className="fixed top-6 right-6 z-[100] flex flex-col items-end pointer-events-none w-full max-w-md px-4">
                <div className="pointer-events-auto w-full">
                {notifications.map(n => (
                    <NeoToast key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
                ))}
                </div>
            </div>
            {children}
          </>
      );
  }

  // Filter Nav based on Role
  const filteredNav = NAV_CONFIG.filter(item => item.roles.includes(currentUser!.role));

  return (
    <div className="flex h-screen font-sans text-black dark:text-white relative bg-gray-100 dark:bg-black overflow-hidden">
      
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-black border-b border-white/10 z-30 flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
             <div className="w-10 h-10">
               <PunchClockLogo size={40} />
             </div>
             <div>
                <h1 className="text-lg font-black italic tracking-tighter text-black dark:text-white leading-none">PUNCH<span className="text-blue-500">CLOCK</span></h1>
                <a href="https://w3jdev.com" target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block leading-none">by w3jdev</a>
             </div>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 border border-white/20 rounded-lg text-black dark:text-white">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-50 dark:bg-[#050505] border-r border-white/10 transition-all duration-300 ease-in-out md:static
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
          
          {/* Mobile Close Button */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-white md:hidden p-2 bg-red-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-8 bg-white text-black border border-gray-200 rounded-full p-1 hover:bg-blue-500 hover:text-white transition-colors z-50 shadow-md"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Logo Area */}
          <div className={`flex items-center gap-3 h-24 px-6 border-b border-white/5 ${isCollapsed ? 'justify-center px-0' : ''}`}>
              <div className="w-12 h-12 shrink-0">
                 <PunchClockLogo size={48} />
               </div>
               {!isCollapsed && (
                 <div className="overflow-hidden whitespace-nowrap">
                   <h1 className="text-xl font-black italic tracking-tighter text-black dark:text-white leading-none">
                     PUNCH<span className="text-blue-600">.</span><br/>CLOCK
                   </h1>
                   <a href="https://w3jdev.com" target="_blank" rel="noopener noreferrer" className="block text-[10px] font-bold text-gray-500 hover:text-blue-500 transition-colors uppercase tracking-widest mt-1">by w3jdev</a>
                 </div>
               )}
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-1 relative scrollbar-hide">
            <NavItem 
                to="/showcase"
                icon={MonitorPlay}
                label="Product Showcase"
                colorClass="bg-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
                isCollapsed={isCollapsed}
            />
            <div className="my-2 border-t border-white/5"></div>
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
            
            <div className="my-4 border-t border-white/5"></div>

            {/* Help Link */}
            <NavItem 
                to="/help"
                icon={HelpCircle}
                label="User Guide"
                colorClass="bg-gray-500"
                onClick={() => setIsMobileMenuOpen(false)}
                isCollapsed={isCollapsed}
            />
          </nav>

          {/* Footer Controls */}
          <div className={`bg-gray-100 dark:bg-[#0a0a0a] border-t border-white/5 p-4`}>
             <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 overflow-hidden">
                   {currentUser?.avatar ? <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-400" />}
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden min-w-0 flex-1">
                     <p className="text-sm font-bold text-black dark:text-white truncate">{currentUser?.name}</p>
                     <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{currentUser?.role}</p>
                  </div>
                )}
             </div>
             
             {!isCollapsed && (
               <>
               <div className="flex gap-2 mt-4">
                 <button 
                   onClick={toggleTheme}
                   className="flex-1 flex items-center justify-center p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-transparent dark:border-white/10"
                   title="Toggle Theme"
                 >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                 </button>

                 <button 
                   onClick={() => logout()}
                   className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all text-xs font-bold uppercase border border-red-600/20"
                 >
                   <LogOut className="w-4 h-4" /> {t.logout}
                 </button>
               </div>
               
               <div className="mt-4 flex justify-between items-center px-1">
                   <a href="https://w3jdev.com" target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-gray-500 hover:text-white transition-colors">© {new Date().getFullYear()} w3jdev</a>
                   <div className="flex gap-2">
                       <a href="https://github.com/w3jdev" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><Github className="w-3 h-3"/></a>
                       <a href="https://linkedin.com/in/w3jdev" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-3 h-3"/></a>
                   </div>
               </div>
               </>
             )}
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0 overflow-y-auto bg-white dark:bg-black relative">
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 pb-24 min-h-full">
           {children}
        </div>
      </main>
    </div>
  );
};

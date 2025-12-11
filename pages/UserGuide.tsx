
import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { NeoCard, NeoButton, NeoBadge } from '../components/NeoComponents';
import { 
  BookOpen, Monitor, DollarSign, ShieldCheck, Clock, ArrowLeft, 
  FileText, CheckCircle, Users, Sparkles, Smartphone, Wifi, 
  AlertTriangle, Fingerprint, Briefcase, Calculator, Building, 
  CalendarDays, Siren, PenTool, LayoutTemplate, Search, Image, Megaphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserGuide: React.FC = () => {
  const { currentUser } = useGlobal();
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState('introduction');

  const topics = [
    { id: 'introduction', label: 'Getting Started', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard & Widgets', icon: LayoutTemplate },
    { id: 'kiosk', label: 'Smart Kiosk & Time', icon: Monitor },
    { id: 'organization', label: 'Organization & Brand', icon: Building },
    { id: 'people', label: 'People & Org Chart', icon: Users },
    { id: 'shifts', label: 'AI Roster & Shifts', icon: CalendarDays },
    { id: 'payroll', label: 'Payroll Engine', icon: DollarSign },
    { id: 'documents', label: 'Legal Documents', icon: FileText },
    { id: 'compliance', label: 'Compliance Audit', icon: ShieldCheck },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  ];

  const renderContent = () => {
    switch(activeTopic) {
        case 'introduction':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div className="border-b border-gray-200 dark:border-white/10 pb-6">
                        <h2 className="text-4xl font-black text-black dark:text-white uppercase mb-4">System Overview</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                            <strong>PUNCH⏰CLOCK Malaysia</strong> is a unified Human Resource Operating System designed to automate the complex labor laws and operational needs of Malaysian SMEs. 
                            It integrates biometric attendance, statutory payroll (EPF/SOCSO/LHDN), and AI-driven workforce planning into a single, offline-first interface.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NeoCard title="Core Capabilities" className="h-full">
                            <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex gap-3">
                                    <Fingerprint className="w-5 h-5 text-blue-500 shrink-0"/>
                                    <span><strong>Biometric Security:</strong> Face ID with liveness detection ensures physical presence.</span>
                                </li>
                                <li className="flex gap-3">
                                    <Calculator className="w-5 h-5 text-green-500 shrink-0"/>
                                    <span><strong>Statutory Auto-Pilot:</strong> Automated calculations for EPF, SOCSO, EIS, and PCB (MTD).</span>
                                </li>
                                <li className="flex gap-3">
                                    <Sparkles className="w-5 h-5 text-purple-500 shrink-0"/>
                                    <span><strong>AI Workforce Planner:</strong> Auto-generate rosters and draft legal contracts instantly.</span>
                                </li>
                                <li className="flex gap-3">
                                    <Wifi className="w-5 h-5 text-orange-500 shrink-0"/>
                                    <span><strong>Offline Architecture:</strong> Functions without internet; syncs data when connection is restored.</span>
                                </li>
                            </ul>
                        </NeoCard>

                        <NeoCard title="Role-Based Access Control (RBAC)" className="h-full">
                            <div className="space-y-4">
                                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                    <h4 className="font-bold text-red-700 dark:text-red-400 text-xs uppercase mb-1">Admin & HR</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Full access to Payroll, Settings, Compliance, and all Employee data.</p>
                                </div>
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                                    <h4 className="font-bold text-yellow-700 dark:text-yellow-400 text-xs uppercase mb-1">Manager</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Can view/edit own team, approve leaves, and manage shifts. No access to Payroll configuration.</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <h4 className="font-bold text-blue-700 dark:text-blue-400 text-xs uppercase mb-1">Staff</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Restricted view. Can only see own profile, payslips, roster, and sign documents.</p>
                                </div>
                            </div>
                        </NeoCard>
                    </div>

                    <div className="bg-black text-white p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold uppercase mb-1">Install as App</h3>
                            <p className="text-sm text-gray-400">For the best experience on iPad or Android tablets.</p>
                        </div>
                        <div className="flex gap-4 text-xs font-bold uppercase">
                            <div className="flex flex-col items-center gap-1">
                                <Smartphone className="w-6 h-6"/>
                                <span>iOS: Share &rarr; Add to Home Screen</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Smartphone className="w-6 h-6"/>
                                <span>Android: Menu &rarr; Install App</span>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'dashboard':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">Bento Dashboard</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Your customizable command center. Drag, drop, and configure widgets to suit your daily workflow.
                        </p>
                    </div>

                    <NeoCard title="Customization Guide">
                        <ol className="list-decimal pl-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                            <li>Click the <strong>Edit Layout</strong> button in the top header.</li>
                            <li>The widgets will pulse, indicating they are ready to move.</li>
                            <li><strong>Drag and Drop</strong> any widget to a new position. The grid will auto-adjust.</li>
                            <li>Click <strong>Done Editing</strong> to save your layout. </li>
                            <li><span className="text-blue-500 font-bold">Note:</span> Your layout is saved to your browser's local storage and persists between sessions.</li>
                        </ol>
                    </NeoCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h3 className="font-bold text-black dark:text-white uppercase text-sm">Key Widgets</h3>
                            <div className="p-4 border rounded-xl bg-white dark:bg-[#121212] dark:border-white/10">
                                <h4 className="font-bold text-sm mb-1">Live KPI Cards</h4>
                                <p className="text-xs text-gray-500">Shows real-time Present, Late, and Absent counts based on today's attendance logs.</p>
                            </div>
                            <div className="p-4 border rounded-xl bg-white dark:bg-[#121212] dark:border-white/10">
                                <h4 className="font-bold text-sm mb-1">Attendance Trend</h4>
                                <p className="text-xs text-gray-500">Bar chart visualizing the last 5 days of attendance reliability.</p>
                            </div>
                            <div className="p-4 border rounded-xl bg-white dark:bg-[#121212] dark:border-white/10">
                                <h4 className="font-bold text-sm mb-1">Bulletin Board</h4>
                                <p className="text-xs text-gray-500">Displays company announcements, holidays, and events created in Organization settings.</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-black dark:text-white uppercase text-sm">Action Bar</h3>
                            <div className="p-4 border rounded-xl bg-white dark:bg-[#121212] dark:border-white/10">
                                <h4 className="font-bold text-sm mb-1">AI Analysis</h4>
                                <p className="text-xs text-gray-500">Triggers Gemini to analyze current attendance patterns and generate a summary insight.</p>
                            </div>
                            <div className="p-4 border rounded-xl bg-white dark:bg-[#121212] dark:border-white/10">
                                <h4 className="font-bold text-sm mb-1">Quick Request</h4>
                                <p className="text-xs text-gray-500">Shortcut to submit Missing Punch, Leave Application, or Expense Claims without navigating away.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'kiosk':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">Smart Kiosk & Time</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Setting up the biometric terminal and managing daily attendance records.
                        </p>
                    </div>

                    <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
                        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2"><Monitor className="w-6 h-6"/> User Flow</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-4">
                                <ol className="list-decimal pl-4 space-y-3 text-sm text-gray-300">
                                    <li><strong>Touch to Start:</strong> Tap anywhere on the idle screen to wake the kiosk.</li>
                                    <li><strong>Select Intent:</strong> Choose between <span className="text-green-400">Check In</span>, <span className="text-red-400">Check Out</span>, or <span className="text-orange-400">Break</span>.</li>
                                    <li><strong>Verification Method:</strong>
                                        <ul className="pl-4 mt-1 list-disc text-gray-400">
                                            <li><strong>Face ID:</strong> Position face within the frame. Auto-scans in 1 second.</li>
                                            <li><strong>PIN Code:</strong> Enter 6-digit backup PIN if biometrics fail.</li>
                                        </ul>
                                    </li>
                                    <li><strong>Confirmation:</strong> Screen flashes Green for success or Red for risk/failure.</li>
                                </ol>
                            </div>
                            <div className="space-y-4 border-l border-white/20 pl-8">
                                <h4 className="font-bold text-blue-400 uppercase text-sm">Anti-Spoofing Measures</h4>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> <strong>Liveness Check:</strong> Detects if user is a real person or a photo/video.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> <strong>Geo-Fencing:</strong> Uses GPS to reject clock-ins > 300m from office coordinates.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> <strong>Time Shield:</strong> Prevents system clock manipulation.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <NeoCard title="Admin Portal" icon={Search}>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            HR Admins can switch the Kiosk view to "Records Portal" to manage logs.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-white/5">
                                <h4 className="font-bold text-sm mb-1">Calendar View</h4>
                                <p className="text-xs text-gray-500">Visual heatmap of attendance. Spot patterns of absenteeism quickly.</p>
                            </div>
                            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-white/5">
                                <h4 className="font-bold text-sm mb-1">Risk Scores</h4>
                                <p className="text-xs text-gray-500">Each punch is assigned a risk score (0-100). Scores > 50 indicate late arrival or location mismatch.</p>
                            </div>
                            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-white/5">
                                <h4 className="font-bold text-sm mb-1">Filters</h4>
                                <p className="text-xs text-gray-500">Filter logs by Department, Late Status, or specific Date ranges for export.</p>
                            </div>
                        </div>
                    </NeoCard>
                </div>
            );

        case 'organization':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">Organization & Branding</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Configure company identity, public holidays, and internal events.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NeoCard title="Branding Assets" icon={Image}>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Customize how documents and the app look.
                            </p>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <li><strong>Company Logo:</strong> Upload a high-res PNG. This appears on the Payslip, Dashboard, and Login screen.</li>
                                <li><strong>Letterhead:</strong> Upload a full-width banner image. This is used as the header background for generated Contracts and Warning Letters.</li>
                            </ul>
                        </NeoCard>

                        <NeoCard title="Events & Bulletin" icon={Megaphone}>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Manage the Company Bulletin widget on the Dashboard.
                            </p>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <li><strong>Create Event:</strong> Go to the "Events" tab. Add Title, Date, and Description.</li>
                                <li><strong>Types:</strong>
                                    <ul className="pl-4 mt-1 list-disc text-gray-500 text-xs">
                                        <li><span className="text-blue-500 font-bold">Meeting:</span> General townhalls.</li>
                                        <li><span className="text-red-500 font-bold">Holiday:</span> Public holidays (Affects OT calculation).</li>
                                        <li><span className="text-purple-500 font-bold">Celebration:</span> Company parties/Birthdays.</li>
                                    </ul>
                                </li>
                            </ul>
                        </NeoCard>
                    </div>

                    <NeoCard title="Policy Drafting" icon={Sparkles} className="border-l-4 border-purple-500">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            Use AI to expand your Company Handbook in the "Policy" tab.
                        </p>
                        <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li>Enter a topic (e.g., "Work From Home" or "Dress Code").</li>
                            <li>Click <strong>Generate with AI</strong>.</li>
                            <li>Gemini will draft a compliant clause. Click <strong>Save Changes</strong> to publish it to all staff via the Onboarding module.</li>
                        </ol>
                    </NeoCard>
                </div>
            );

        case 'people':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">People & Org Chart</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Complete lifecycle management: Recruitment, Biometric Enrollment, and Organization structure.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NeoCard title="Biometric Enrollment" icon={Fingerprint}>
                            <ol className="list-decimal pl-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <li>Go to <strong>Employees</strong> and click <strong>+ New Hire</strong> (or edit existing).</li>
                                <li>Fill in basic details (Name, ID, Role).</li>
                                <li>Click the <strong>Enroll Face ID</strong> button.</li>
                                <li>
                                    <span className="font-bold text-black dark:text-white">Important:</span> Ensure the employee is facing the camera directly in good lighting.
                                </li>
                                <li>Once the system captures the face descriptor, it will show "Registered". Save the profile.</li>
                            </ol>
                        </NeoCard>

                        <NeoCard title="Interactive Org Chart" icon={Users}>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Switch the view mode from "List" to "Org" in the top right corner of the Employees page.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li>• <strong>Hierarchy:</strong> Visualizes the reporting lines based on the "Reports To" field in employee profiles.</li>
                                <li>• <strong>Navigation:</strong> Click on any manager node to expand/collapse their direct reports.</li>
                                <li>• <strong>Quick Edit:</strong> Click a profile card in the chart to open their full details modal.</li>
                            </ul>
                        </NeoCard>
                    </div>

                    <div className="p-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10">
                        <h3 className="font-black text-xl uppercase mb-4">Onboarding Tracking</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Monitor the progress of new hires through the 4-stage digital onboarding process.
                        </p>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {['Profile Setup', 'Document Upload', 'Handbook Sign-off', 'Completed'].map((step, i) => (
                                <div key={i} className="flex-1 min-w-[150px] p-3 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white/10 text-center">
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Step {i+1}</div>
                                    <div className="font-bold text-sm">{step}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'shifts':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">AI Roster & Shifts</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Intelligent scheduling with conflict detection and emergency replacement handling.
                        </p>
                    </div>

                    <NeoCard title="AI Auto-Roster" icon={Sparkles} className="border-l-4 border-purple-500">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Instead of manually assigning shifts, let Gemini AI plan for you based on your business type.
                        </p>
                        <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li>Go to <strong>Schedule</strong> page.</li>
                            <li>Select your <strong>Business Mode</strong> (e.g., F&B, Retail, Corporate) in the header dropdown.</li>
                            <li>Click <strong>Auto-Plan</strong>.</li>
                            <li>The AI analyzes approved leaves and business rules (e.g., "F&B needs more staff on weekends") to generate a conflict-free roster.</li>
                        </ol>
                    </NeoCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NeoCard title="Multi-Date Assignment" icon={CalendarDays}>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Bulk assign shifts efficiently:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li>1. Click <strong>Bulk Select</strong> in the header.</li>
                                <li>2. Tap multiple dates on the calendar (they will turn blue).</li>
                                <li>3. Click <strong>Assign [X] Days</strong>.</li>
                                <li>4. Choose Employee and Shift Type. The system will skip days with conflicts automatically.</li>
                            </ul>
                        </NeoCard>

                        <NeoCard title="SOS Emergency Mode" icon={Siren} className="border-l-4 border-red-500">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Handle last-minute no-shows:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li>1. Click the <strong>SOS</strong> button.</li>
                                <li>2. Select the Date and the Missing Employee.</li>
                                <li>3. Click <strong>Find Replacements</strong>.</li>
                                <li>4. AI suggests staff based on:
                                    <ul className="pl-4 mt-1 text-xs text-gray-500 list-disc">
                                        <li>Role Match (Same skill set)</li>
                                        <li>OT Cost (Prioritizes staff with low OT)</li>
                                        <li>Availability (Not on leave/shift)</li>
                                    </ul>
                                </li>
                            </ul>
                        </NeoCard>
                    </div>
                </div>
            );

        case 'payroll':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">Payroll Engine</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Automated calculation of Malaysian statutory requirements (Employment Act 1955).
                        </p>
                    </div>

                    <NeoCard title="The Calculation Logic" icon={Calculator}>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 font-mono text-sm">
                                <p className="mb-2"><strong className="text-green-600">GROSS PAY</strong> = Basic + Fixed Allowances + OT (1.5x/2.0x/3.0x) + Claims</p>
                                <p className="mb-2"><strong className="text-red-600">DEDUCTIONS</strong> = EPF (11%) + SOCSO (Tiered) + EIS (Tiered) + PCB (Tax) + Late Penalty</p>
                                <p><strong className="text-blue-600">NET PAY</strong> = GROSS - DEDUCTIONS</p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                                <strong>Note:</strong> OT Rates are auto-determined based on the day type (Normal vs Rest Day vs Public Holiday).
                            </div>
                        </div>
                    </NeoCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NeoCard title="Configuration" className="border-l-4 border-yellow-500">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Go to <strong>Payroll > Config</strong> to set global parameters.
                            </p>
                            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                                <li>• <strong>Statutory Rates:</strong> Adjust EPF Employee/Employer % if government announces changes.</li>
                                <li>• <strong>Global Allowances:</strong> Set fixed monthly allowances (e.g., Transport RM150) applied to all permanent staff.</li>
                                <li>• <strong>Foreigners:</strong> Toggle EPF contribution for non-citizens.</li>
                            </ul>
                        </NeoCard>

                        <NeoCard title="Bank & LHDN Export" className="border-l-4 border-green-500">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                After generating a payroll run, click the <strong>Download</strong> icon to get batch files compatible with banking portals.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <NeoBadge variant="neutral">KWSP (Form A .txt)</NeoBadge>
                                <NeoBadge variant="neutral">SOCSO (Assist .txt)</NeoBadge>
                                <NeoBadge variant="neutral">LHDN (CP39 .txt)</NeoBadge>
                            </div>
                        </NeoCard>
                    </div>
                </div>
            );

        case 'documents':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">Legal Documents</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Generate, sign, and store HR documents securely.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NeoCard title="AI Document Generator" icon={FileText}>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Create professional documents in seconds using the "New Document" button.
                            </p>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <li><strong>1. Choose Template:</strong> Select from Offer Letter, Warning Letter, Probation Confirmation, etc.</li>
                                <li><strong>2. Context Injection:</strong> Select the target employee. The system injects their Name, IC, Role, and Salary automatically.</li>
                                <li><strong>3. Custom Instructions:</strong> Add specific details (e.g., "Include a clause about remote work on Fridays").</li>
                                <li><strong>4. Generate:</strong> Gemini drafts a legally sound HTML document.</li>
                            </ul>
                        </NeoCard>

                        <NeoCard title="Digital Signing" icon={PenTool}>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Paperless workflow for approvals and acknowledgments.
                            </p>
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <li>• <strong>Assign:</strong> Documents appear in the assigned employee's dashboard.</li>
                                <li>• <strong>Sign:</strong> Users can sign by drawing on screen (touch-supported) or typing their name.</li>
                                <li>• <strong>Lock:</strong> Once signed, the document is timestamped and locked from editing.</li>
                                <li>• <strong>Recurring:</strong> Set docs to renew yearly (e.g., NDA) and track expiry dates automatically.</li>
                            </ul>
                        </NeoCard>
                    </div>
                </div>
            );

        case 'compliance':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">Compliance & Legal</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Monitor adherence to Malaysian Employment Act 1955 and company policies.
                        </p>
                    </div>

                    <NeoCard title="AI Policy Monitor" icon={ShieldCheck} className="border-l-4 border-red-500">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            The system continuously scans attendance and request logs for violations.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/10 rounded">
                                <AlertTriangle className="w-4 h-4 text-red-600"/>
                                <span className="text-xs font-bold text-red-700 dark:text-red-400">OT Violation:</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Flags if employee exceeds 104 hours/month.</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded">
                                <AlertTriangle className="w-4 h-4 text-yellow-600"/>
                                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">MIA Risk:</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Flags 2+ days consecutive absence without leave.</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                                <AlertTriangle className="w-4 h-4 text-blue-600"/>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Probation:</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Alerts HR 2 weeks before probation ends.</span>
                            </div>
                        </div>
                    </NeoCard>

                    <NeoCard title="Policy Generator" icon={BookOpen}>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            Need to update the Employee Handbook?
                        </p>
                        <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            <li>Go to <strong>Compliance > Policy Settings</strong>.</li>
                            <li>Enter a topic (e.g., "Whistleblowing Policy" or "Social Media Usage").</li>
                            <li>Click <strong>Generate</strong>.</li>
                            <li>AI writes a formal, compliant clause and appends it to your company handbook.</li>
                        </ol>
                    </NeoCard>
                </div>
            );

        case 'ai':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <h2 className="text-3xl font-black text-black dark:text-white uppercase mb-2">AI Copilot</h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Your 24/7 Intelligent HR Assistant powered by Gemini 2.5 Flash.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <NeoCard title="Capabilities">
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                    <li className="flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500 mt-1"/>
                                        <span><strong>Deep Analysis:</strong> Ask "Who was late this week?" or "What is the total projected payroll cost?"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <FileText className="w-4 h-4 text-purple-500 mt-1"/>
                                        <span><strong>Visual Responses:</strong> The AI can render live Charts (Bar/Pie) and Data Tables in the chat window.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ShieldCheck className="w-4 h-4 text-purple-500 mt-1"/>
                                        <span><strong>Context Aware:</strong> It knows your user role. Staff only get answers about their own data; Admins get company-wide insights.</span>
                                    </li>
                                </ul>
                            </NeoCard>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0"/>
                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                    <strong>Learning Mode:</strong> The AI tracks which features you use most (e.g., Payroll vs Shifts) and adapts its suggestions to your workflow.
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 bg-black rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center items-center text-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50"></div>
                            <Sparkles className="w-16 h-16 text-white mb-4 relative z-10" />
                            <h3 className="text-2xl font-black text-white relative z-10">Try it now</h3>
                            <p className="text-gray-300 text-sm mb-6 relative z-10">Click the robot icon in the bottom right corner.</p>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
       <div className="mb-8 flex items-center gap-4">
          <NeoButton variant="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-6 h-6" />
          </NeoButton>
          <div>
              <h1 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">User Manual</h1>
              <p className="text-gray-500 dark:text-gray-400 font-bold">Comprehensive guide for {currentUser?.role}</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Sidebar Navigation */}
           <div className="space-y-2 lg:sticky lg:top-8 h-fit">
               {topics.map(topic => (
                   <button
                      key={topic.id}
                      onClick={() => setActiveTopic(topic.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold uppercase text-xs md:text-sm transition-all border
                        ${activeTopic === topic.id 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg translate-x-2' 
                            : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#222]'}
                      `}
                   >
                       <topic.icon className="w-5 h-5" />
                       {topic.label}
                   </button>
               ))}
               
               <div className="pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
                   <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
                       <h4 className="font-bold text-sm mb-1">Need Support?</h4>
                       <p className="text-xs opacity-90 mb-3">Contact our IT helpdesk for technical issues.</p>
                       <button className="text-xs font-black bg-white text-blue-600 px-3 py-2 rounded-lg uppercase w-full">Contact IT</button>
                   </div>
               </div>
           </div>

           {/* Content Area */}
           <div className="lg:col-span-3 min-h-[600px]">
               {renderContent()}
           </div>
       </div>
    </div>
  );
};

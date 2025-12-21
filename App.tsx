
import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AiAssistant } from './components/AiAssistant';
import { GlobalProvider } from './context/GlobalContext';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages to reduce initial bundle size (Performance)
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Attendance = React.lazy(() => import('./pages/Attendance').then(module => ({ default: module.Attendance })));
const Payroll = React.lazy(() => import('./pages/Payroll').then(module => ({ default: module.Payroll })));
const Compliance = React.lazy(() => import('./pages/Compliance').then(module => ({ default: module.Compliance })));
const Employees = React.lazy(() => import('./pages/Employees').then(module => ({ default: module.Employees })));
const Shifts = React.lazy(() => import('./pages/Shifts').then(module => ({ default: module.Shifts })));
const Onboarding = React.lazy(() => import('./pages/Onboarding').then(module => ({ default: module.Onboarding })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const UserGuide = React.lazy(() => import('./pages/UserGuide').then(module => ({ default: module.UserGuide })));
const ProductDemo = React.lazy(() => import('./pages/ProductDemo').then(module => ({ default: module.ProductDemo })));
const Organization = React.lazy(() => import('./pages/Organization').then(module => ({ default: module.Organization })));
const Documents = React.lazy(() => import('./pages/Documents').then(module => ({ default: module.Documents })));

// Loading Component
const PageLoader = () => (
  <div className="h-full w-full flex flex-col items-center justify-center min-h-[60vh]">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Module...</p>
  </div>
);

function App() {
  return (
    <GlobalProvider>
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes without Layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/demo" element={<ProductDemo />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/*" element={
                <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/attendance" element={<Attendance />} />
                          <Route path="/payroll" element={<Payroll />} />
                          <Route path="/compliance" element={<Compliance />} />
                          <Route path="/employees" element={<Employees />} />
                          <Route path="/shifts" element={<Shifts />} />
                          <Route path="/onboarding" element={<Onboarding />} />
                          <Route path="/organization" element={<Organization />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/help" element={<UserGuide />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                    <AiAssistant />
                </Layout>
            } />
          </Routes>
        </Suspense>
      </HashRouter>
    </GlobalProvider>
  );
}

export default App;


import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { Payroll } from './pages/Payroll';
import { Compliance } from './pages/Compliance';
import { Employees } from './pages/Employees';
import { Shifts } from './pages/Shifts';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { UserGuide } from './pages/UserGuide';
import { ProductDemo } from './pages/ProductDemo';
import { Organization } from './pages/Organization';
import { Documents } from './pages/Documents';
import { AiAssistant } from './components/AiAssistant';
import { GlobalProvider } from './context/GlobalContext';

function App() {
  return (
    <GlobalProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes without Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/demo" element={<ProductDemo />} />
          
          {/* Protected Routes with Layout */}
          <Route path="/*" element={
              <Layout>
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
                  <AiAssistant />
              </Layout>
          } />
        </Routes>
      </HashRouter>
    </GlobalProvider>
  );
}

export default App;

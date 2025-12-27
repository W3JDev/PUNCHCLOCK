
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Fixed SW registration for sandbox environments
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    // Using relative path to ensure origin matching in sandboxed previews
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      // Log as info to avoid alarming red errors in non-standard preview environments
      console.info('SW registration skipped or failed (Standard for sandbox previews): ', registrationError.message);
    });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

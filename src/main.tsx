import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import { SapReconPage } from './components/SapReconPage';
import { AccessProvider } from './auth/AccessProvider';
import { startTracking } from './lib/track';
import './index.css';

startTracking();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessProvider>
      {/^\/sap-bank-reconciliation\/?$/.test(window.location.pathname) ? <SapReconPage /> : <App />}
    </AccessProvider>
    <Analytics />
  </StrictMode>,
);

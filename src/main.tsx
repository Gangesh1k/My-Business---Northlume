import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import { AccessProvider } from './auth/AccessProvider';
import { startTracking } from './lib/track';
import './index.css';

startTracking();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessProvider>
      <App />
    </AccessProvider>
    <Analytics />
  </StrictMode>,
);

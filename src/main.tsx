import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { StoreProvider } from './state/StoreContext';
import { RestTimerProvider } from './state/RestTimer';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <RestTimerProvider>
        <App />
      </RestTimerProvider>
    </StoreProvider>
  </StrictMode>
);

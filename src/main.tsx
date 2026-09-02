import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registro automático del Service Worker (PWA)
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[HIPOTECALY PWA] Nueva versión disponible.');
  },
  onOfflineReady() {
    console.info('[HIPOTECALY PWA] Aplicación lista para navegación en caché.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// Configure native Android/iOS status bar
if (Capacitor.isNativePlatform()) {
  try {
    StatusBar.setStyle({ style: Style.Dark }); // Style.Dark = Light/White icons on dark status bar
    StatusBar.setBackgroundColor({ color: '#050608' });
    StatusBar.setOverlaysWebView({ overlay: false }); // Pushes webview below status bar so screen is never inside the time/battery
  } catch (e) {
    console.warn('StatusBar plugin initialization:', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

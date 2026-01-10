import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'
import { ensureThemeApplied } from './lib/theme'
import { ErrorBoundary } from './components/ErrorBoundary'

try {
  ensureThemeApplied();
} catch (error) {
  console.error('Error applying theme:', error);
}

// Handle GitHub Pages deep links
// If URL has ?p= parameter, redirect to that path
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParam = urlParams.get('p');
  if (pathParam) {
    const decodedPath = decodeURIComponent(pathParam);
    // Remove /capsula prefix if present in path
    const cleanPath = decodedPath.startsWith('/capsula') 
      ? decodedPath.substring('/capsula'.length) || '/'
      : decodedPath;
    
    // Update URL without reload
    const newUrl = window.location.origin + '/capsula' + cleanPath + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

// Register Service Worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/capsula/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, show update prompt
                if (confirm('Доступна новая версия приложения. Обновить?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
  
  // Handle SW messages (e.g., from push notifications)
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('SW message received:', event.data);
    if (event.data.type === 'DOSE_ACTION') {
      // Dispatch custom event for the app to handle
      window.dispatchEvent(new CustomEvent('sw-dose-action', { 
        detail: event.data 
      }));
    }
  });
}

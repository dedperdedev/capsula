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


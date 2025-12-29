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


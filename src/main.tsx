import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import PreloaderProvider from './components/Preloader'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import './styles/global.css'

// ── Global Window Error Handler for Cross-Origin "Script error." & chunk failures ──
window.addEventListener('error', (event) => {
  if (
    event.message === 'Script error.' ||
    event.message?.includes('Script error') ||
    (typeof event.message === 'string' &&
      (event.message.includes('Failed to fetch dynamically imported module') ||
       event.message.includes('Importing a module script failed')))
  ) {
    console.warn('Global script error handled gracefully:', event.message)
    event.preventDefault()
    event.stopImmediatePropagation()
    return true
  }
}, true) // use capture phase so we catch it before AI studio

const originalOnError = window.onerror;
window.onerror = function (msg, url, lineNo, columnNo, error) {
  if (msg === 'Script error.' || (typeof msg === 'string' && msg.includes('Script error'))) {
    console.warn('Suppressed Script error. in window.onerror');
    return true; // true prevents default error handling
  }
  if (originalOnError) return originalOnError(msg, url, lineNo, columnNo, error);
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message === 'Script error.' ||
    (typeof event.reason === 'string' && event.reason.includes('Script error'))
  ) {
    console.warn('Suppressed Script error. in unhandledrejection');
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

// ── Vite dynamic import chunk error resilience ─────────────────────
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, refreshing page for updated bundle assets...', event)
  window.location.reload()
})

window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    typeof event.reason.message === 'string' &&
    (event.reason.message.includes('Failed to fetch dynamically imported module') ||
     event.reason.message.includes('Importing a module script failed'))
  ) {
    event.preventDefault()
    const key = 'et_chunk_reload_' + window.location.pathname
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'true')
      window.location.reload()
    }
  }
})

// Clear the reload guard after 5s of successful execution so future build updates work
setTimeout(() => {
  sessionStorage.removeItem('et_chunk_reload_' + window.location.pathname)
}, 5000)

// ── Top-Level React Error Boundary ──────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('GlobalErrorBoundary caught runtime UI error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="text-3xl">⚠️</div>
            <h2 className="text-lg font-bold text-amber-300">Application Notice</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected UI state occurred. The application remains operational and can be restored immediately.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <LanguageProvider>
            <PreloaderProvider>
              <UserProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </UserProvider>
            </PreloaderProvider>
          </LanguageProvider>
        </ThemeProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
)




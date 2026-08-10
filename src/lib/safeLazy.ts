import React, { lazy, ComponentType } from 'react'

/**
 * Fallback component rendered if a dynamic import chunk completely fails to load.
 */
function ComponentChunkFallback({ componentName }: { componentName?: string }) {
  return React.createElement(
    'div',
    { className: 'p-6 my-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 font-sans text-xs' },
    React.createElement(
      'p',
      { className: 'text-amber-400 font-semibold mb-2' },
      componentName ? `${componentName} module` : 'Component',
      ' is updating or temporarily unavailable.'
    ),
    React.createElement(
      'button',
      {
        onClick: () => {
          if (typeof window !== 'undefined') {
            sessionStorage.clear()
            window.location.reload()
          }
        },
        className: 'px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors',
      },
      'Reload Page'
    )
  )
}

/**
 * Robust wrapper around React.lazy that catches module fetch errors
 * (e.g. stale chunk hashes after re-build/deploy) and retries or reloads
 * cleanly instead of crashing the UI with uncaught TypeErrors.
 */
export function safeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  componentName?: string
) {
  return lazy(async () => {
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const module = await factory()
        return module
      } catch (error: any) {
        attempts++
        console.warn(`SafeLazy: Dynamic import attempt ${attempts} for ${componentName || 'module'} failed:`, error)

        if (attempts >= maxAttempts) {
          const isChunkError =
            error &&
            (typeof error?.message === 'string'
              ? error.message.includes('Failed to fetch dynamically imported module') ||
                error.message.includes('Importing a module script failed') ||
                error.message.includes('dynamically imported module')
              : true)

          if (isChunkError && typeof window !== 'undefined') {
            const key = 'et_chunk_reload_' + window.location.pathname
            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, 'true')
              window.location.reload()
              return new Promise<{ default: T }>(() => {}) // prevent unhandled rejection while reloading
            }
          }

          // Return graceful fallback component instead of throwing unhandled error
          const FallbackComponent: ComponentType<any> = () => React.createElement(ComponentChunkFallback, { componentName })
          return { default: FallbackComponent as unknown as T }
        }

        // Wait before retrying (200ms, 400ms)
        await new Promise((resolve) => setTimeout(resolve, 200 * attempts))
      }
    }

    const FallbackComponent: ComponentType<any> = () => React.createElement(ComponentChunkFallback, { componentName })
    return { default: FallbackComponent as unknown as T }
  })
}

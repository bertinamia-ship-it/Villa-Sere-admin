'use client'

import { useEffect } from 'react'

/**
 * Client component to initialize fetch interceptor
 * Silences telemetry/analytics 400 errors
 */
export default function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
      
      // Check if this is a telemetry/analytics request
      const isTelemetryRequest = 
        url.includes('/telemetry') ||
        url.includes('/analytics') ||
        url.includes('/track') ||
        url.includes('/ping') ||
        url.includes('/metrics') ||
        (url.includes('supabase.co') && (
          url.includes('/rest/v1/') === false && // Exclude actual API calls
          url.includes('/auth/v1/') === false &&
          url.includes('/storage/v1/') === false &&
          url.includes('/realtime/v1/') === false &&
          url.includes('/functions/v1/') === false
        ))

      try {
        const response = await originalFetch.apply(this, args)
        
        // If it's a telemetry request and it failed, don't log the error
        if (isTelemetryRequest && !response.ok) {
          // Silently ignore telemetry errors (don't log to console)
          return response
        }
        
        return response
      } catch (error) {
        // If it's a telemetry request, don't log the error
        if (isTelemetryRequest) {
          // Silently ignore telemetry errors
          return new Response(null, { status: 200, statusText: 'OK' })
        }
        
        // Re-throw non-telemetry errors
        throw error
      }
    }

    // Cleanup on unmount (restore original fetch)
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null // This component doesn't render anything
}


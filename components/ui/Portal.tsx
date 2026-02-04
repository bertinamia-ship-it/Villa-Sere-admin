'use client'

import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
  containerId?: string
}

export function Portal({ children, containerId = 'portal-root' }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Create portal container if it doesn't exist
    if (!document.getElementById(containerId)) {
      const container = document.createElement('div')
      container.id = containerId
      document.body.appendChild(container)
    }

    return () => {
      // Don't remove container on unmount, it might be used by other portals
    }
  }, [containerId])

  if (!mounted) return null

  const container = document.getElementById(containerId)
  if (!container) return null

  return createPortal(children, container)
}



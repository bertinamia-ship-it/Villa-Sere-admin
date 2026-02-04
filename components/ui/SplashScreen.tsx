'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [splashImageLoaded, setSplashImageLoaded] = useState(false)
  const [splashImageError, setSplashImageError] = useState(false)

  useEffect(() => {
    // Try to load splash image
    const img = new window.Image()
    img.onload = () => setSplashImageLoaded(true)
    img.onerror = () => setSplashImageError(true)
    img.src = '/splash-screen.png'
  }, [])

  useEffect(() => {
    // Show splash for minimum 1.5 seconds
    const minDisplayTimer = setTimeout(() => {
      setIsAnimating(true)
    }, 1500)

    // Complete after fade animation
    const completeTimer = setTimeout(() => {
      setIsVisible(false)
      onComplete()
    }, 2000)

    return () => {
      clearTimeout(minDisplayTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  if (!isVisible) return null

  // If splash image exists, use it
  if (splashImageLoaded) {
    return (
      <div
        className={`
          fixed inset-0 z-[9999] 
          bg-slate-900
          flex items-center justify-center
          transition-opacity duration-500 ease-out
          ${isAnimating ? 'opacity-0' : 'opacity-100'}
        `}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src="/splash-screen.png"
            alt="CasaPilot"
            fill
            className="object-contain"
            priority
            quality={95}
            sizes="100vw"
          />
        </div>
      </div>
    )
  }

  // Fallback: Default splash with logo
  return (
    <div
      className={`
        fixed inset-0 z-[9999] 
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        flex items-center justify-center
        safe-area-y safe-area-x
        transition-opacity duration-500 ease-out
        ${isAnimating ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div className="flex flex-col items-center justify-center space-y-6 px-6">
        {/* Logo/Icon */}
        <div className="relative">
          <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-2xl shadow-blue-500/30 transform transition-all duration-700 ease-out">
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-full h-full text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* App Name */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            CasaPilot
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium">
            Gestión de Propiedades
          </p>
        </div>

        {/* Loading indicator */}
        <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
            style={{
              animation: 'loading 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}


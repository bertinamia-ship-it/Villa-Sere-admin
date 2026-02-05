'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { t } from '@/lib/i18n/es'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Basic validation
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Check if email confirmation is required
      if (data.user.identities && data.user.identities.length === 0) {
        // User already exists
        setError('Ya existe una cuenta con este email. Por favor inicia sesión.')
        setLoading(false)
      } else if (data.user.confirmed_at) {
        // User is confirmed - redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        // Email confirmation required
        setError(null)
        setSuccess('¡Cuenta creada! Por favor revisa tu email para confirmar tu cuenta. Después de confirmar, puedes iniciar sesión aquí.')
        setLoading(false)
        // Keep user on the same page with message
        setEmail('')
        setPassword('')
        setFullName('')
      }
    } else {
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
      {/* Background Image - Full Screen */}
      <div className="fixed inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dpmozdkfh/image/upload/v1770192156/homeapp_j2epyo.png"
          alt="CasaPilot"
          fill
          priority
          quality={90}
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Login Form - Centered */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[#0F172A] mb-1.5">CasaPilot</h1>
            <p className="text-sm text-[#64748B]">Sistema de Gestión de Propiedades</p>
          </div>

        {success && (
          <div className="mb-6 rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-xs text-[#22C55E]">
            {success}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] px-4 py-3 rounded-md text-xs">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-[#0F172A] mb-1.5">
                Nombre Completo {t('common.optional')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all duration-150 text-[#0F172A] placeholder-[#64748B]"
                placeholder="Juan Pérez"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[#0F172A] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all duration-150 text-[#0F172A] placeholder-[#64748B]"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[#0F172A] mb-1.5">
              Contraseña {isSignUp && <span className="text-[#64748B] font-normal">(mín. 6 caracteres)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all duration-150 text-[#0F172A] placeholder-[#64748B]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F172A] text-white py-2.5 rounded-md text-sm font-medium hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-out"
          >
            {loading ? (isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...') : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setFullName('')
            }}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors duration-150"
          >
            {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

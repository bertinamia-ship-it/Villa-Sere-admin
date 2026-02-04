/**
 * Design System - CasaPilot
 * Sistema de diseño consistente para toda la aplicación
 */

// Espaciado consistente
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}

// Tipografía
export const typography = {
  h1: 'text-2xl font-semibold text-[#0F172A] tracking-tight',
  h2: 'text-xl font-semibold text-[#0F172A] tracking-tight',
  h3: 'text-lg font-semibold text-[#0F172A] tracking-tight',
  subtitle: 'text-sm text-[#64748B]',
  body: 'text-sm text-[#0F172A]',
  bodyMuted: 'text-sm text-[#64748B]',
  caption: 'text-xs text-[#64748B]',
}

// Colores del sistema
export const colors = {
  primary: {
    bg: 'bg-[#0F172A]',
    text: 'text-[#0F172A]',
    hover: 'hover:bg-[#1E293B]',
  },
  secondary: {
    bg: 'bg-white',
    text: 'text-[#64748B]',
    hover: 'hover:bg-[#F8FAFC]',
  },
  success: {
    bg: 'bg-[#10B981]',
    text: 'text-[#10B981]',
    light: 'bg-[#10B981]/10 text-[#10B981]',
  },
  danger: {
    bg: 'bg-[#EF4444]',
    text: 'text-[#EF4444]',
    light: 'bg-[#EF4444]/10 text-[#EF4444]',
  },
  warning: {
    bg: 'bg-[#F59E0B]',
    text: 'text-[#F59E0B]',
    light: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  },
  info: {
    bg: 'bg-[#2563EB]',
    text: 'text-[#2563EB]',
    light: 'bg-[#2563EB]/10 text-[#2563EB]',
  },
}

// Bordes y sombras
export const borders = {
  default: 'border border-[#E2E8F0]',
  hover: 'hover:border-[#CBD5E1]',
  rounded: 'rounded-xl',
  roundedSm: 'rounded-lg',
}

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  hover: 'hover:shadow-md',
}

// Transiciones
export const transitions = {
  default: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-300 ease-out',
}

// Layout
export const layout = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'space-y-6',
  sectionLarge: 'space-y-8',
  card: 'bg-white rounded-xl border border-[#E2E8F0] shadow-sm',
}


"use client"

import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react'
import { ArrowRight, CalendarDays, ShoppingBag, Sparkles, TrendingUp, Wallet2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { t } from '@/lib/i18n/es'

const heroImages = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80&sat=-30',
]

const upcomingBookings = [
  { guest: 'Isabella R.', platform: 'Airbnb', dates: 'Jan 12 - Jan 16', value: '$1,280' },
  { guest: 'Chen + Family', platform: 'Booking.com', dates: 'Jan 20 - Jan 25', value: '$1,950' },
  { guest: 'Corporate Stay', platform: 'Direct', dates: 'Jan 28 - Feb 2', value: '$2,400' },
]

const quickCards = [
  { title: 'Upcoming bookings', value: '3 in the next 30 days', icon: CalendarDays, tone: 'from-emerald-500/15 to-emerald-400/10', badge: '+2 new' },
  { title: 'This month expenses', value: '$4,820', icon: Wallet2, tone: 'from-amber-500/15 to-amber-400/10', badge: 'on track' },
  { title: 'Inventory low-stock', value: '6 items', icon: AlertTriangle, tone: 'from-rose-500/15 to-rose-400/10', badge: 'action needed' },
  { title: 'To-buy items', value: '9 queued', icon: ShoppingBag, tone: 'from-indigo-500/15 to-indigo-400/10', badge: 'curated' },
]

export default function LandingHome() {
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length)
    }, 5500)
    return () => clearInterval(id)
  }, [])

  const backgroundStyle = useMemo(() => ({
    backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.45)), url(${heroImages[activeImage]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }), [activeImage])

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section className="relative overflow-hidden rounded-xl bg-white border border-[#E2E8F0] shadow-lg">
          <div className="absolute inset-0 transition-[background-image] duration-700 ease-in-out" style={backgroundStyle} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/75 via-[#0F172A]/60 to-[#0F172A]/45" />
          <div className="relative grid gap-6 px-6 py-8 md:grid-cols-2 lg:px-10">
            <div className="space-y-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur">
                <Sparkles className="h-3 w-3 stroke-[1.5]" /> Operaciones Premium
              </div>
              <div className="space-y-2.5">
                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">CasaPilot, siempre listo para huéspedes.</h1>
                <p className="max-w-xl text-sm text-white/90 sm:text-base">
                  Controla reservas, gastos, inventario y tu lista de compras. Un centro de control elegante para tu propiedad.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="sm" onClick={() => window.location.href = '/login'}>
                  <span className="inline-flex items-center gap-1.5 text-xs">Ir a Iniciar Sesión <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" /></span>
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.location.href = '/dashboard'}>
                  <span className="inline-flex items-center gap-1.5 text-xs">Abrir Dashboard</span>
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/80">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> Ocupación en vivo
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" /> Alertas inteligentes
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" /> Reservas por calendario
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Card className="bg-white/95 backdrop-blur-lg shadow-lg border-[#E2E8F0]" padding="sm">
                <CardHeader>
                  <CardTitle className="text-sm">Vista General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Metric label="Ocupación" value="82%" trend="up" detail="Este mes" />
                    <Metric label="ADR" value="$245" trend="up" detail="+6% vs mes pasado" />
                    <Metric label="Ganancia Neta" value="$8.4k" trend="up" detail="Proyectado" />
                    <Metric label="Gastos" value="$4.8k" trend="down" detail="Mes actual" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-lg shadow-lg border-[#E2E8F0]" padding="sm">
                <CardHeader>
                  <CardTitle className="text-sm">Próximas Estancias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.guest} className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-[#0F172A]">{booking.guest}</p>
                          <p className="text-[10px] text-[#64748B]">{booking.platform} · {booking.dates}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#2563EB]">{booking.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {quickCards.map(({ title, value, icon: Icon, tone, badge }) => (
            <Card key={title} className={`border border-[#E2E8F0] bg-white shadow-sm`} padding="sm">
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[#64748B]">{title}</p>
                  <span className="text-[9px] rounded-full bg-[#2563EB]/10 px-1.5 py-0.5 text-[#2563EB] font-semibold">
                    {badge}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-[#0F172A]">{value}</p>
                  <div className="rounded-md bg-[#F8FAFC] p-1.5 text-[#2563EB]">
                    <Icon className="h-3.5 w-3.5 stroke-[1.5]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm border-[#E2E8F0]" padding="sm">
            <CardHeader>
              <CardTitle className="text-sm">Dashboard de Operaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2.5 md:grid-cols-2">
                <MiniFeature icon={CalendarDays} title="Calendario primero" description="Reserva, edita e inspecciona estancias directamente en un calendario codificado por colores." />
                <MiniFeature icon={TrendingUp} title="Claridad de ganancias" description="Vista instantánea de ADR, ocupación y tendencias de ganancias." />
                <MiniFeature icon={ShoppingBag} title="Stock inteligente" description="Señales de stock bajo y una cola de compras curada." />
                <MiniFeature icon={Sparkles} title="UI Premium" description="Interacciones rápidas y limpias con animaciones hover/press." />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white shadow-lg border-[#0F172A]" padding="sm">
            <CardHeader>
              <CardTitle className="text-sm text-white">Próximos Pasos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
                  <p className="text-xs font-semibold">Desplegar</p>
                  <p className="text-[10px] text-white/80 mt-0.5">Configura variables de entorno en Vercel y ejecuta la migración de reservas.</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
                  <p className="text-xs font-semibold">Verificar reservas</p>
                  <p className="text-[10px] text-white/80 mt-0.5">Agrega una reserva y confirma que aparece en el calendario instantáneamente.</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
                  <p className="text-xs font-semibold">Mantén el control</p>
                  <p className="text-[10px] text-white/80 mt-0.5">Rastrea gastos e inventario con estados de UI unificados.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>

function Metric({ label, value, trend, detail }: { label: string; value: string; trend: 'up' | 'down'; detail: string }) {
  return (
    <div className="rounded-md border border-[#E2E8F0] bg-white px-2.5 py-2 shadow-sm">
      <div className="flex items-center justify-between text-[10px] font-medium text-[#64748B]">
        <span>{label}</span>
        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] ${trend === 'up' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
          {trend === 'up' ? '↑' : '↓'} {trend === 'up' ? 'arriba' : 'abajo'}
        </span>
      </div>
      <p className="mt-1.5 text-base font-bold text-[#0F172A]">{value}</p>
      <p className="text-[9px] text-[#64748B]">{detail}</p>
    </div>
  )
}

function MiniFeature({ icon: Icon, title, description }: { icon: IconType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2563EB]/10 text-[#2563EB]">
        <Icon className="h-4 w-4 stroke-[1.5]" />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#0F172A]">{title}</p>
        <p className="text-[10px] text-[#64748B] mt-0.5">{description}</p>
      </div>
    </div>
  )
}

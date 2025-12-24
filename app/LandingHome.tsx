"use client"

import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react'
import { ArrowRight, CalendarDays, ShoppingBag, Sparkles, TrendingUp, Wallet2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-12 page-soft">
        <section className="relative overflow-hidden rounded-3xl bg-white/70 shadow-2xl ring-1 ring-indigo-100">
          <div className="absolute inset-0 transition-[background-image] duration-700 ease-in-out" style={backgroundStyle} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/55 to-slate-900/35" />
          <div className="relative grid gap-8 px-8 py-12 md:grid-cols-2 lg:px-12">
            <div className="space-y-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Premium villa ops
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Villa Serena, always guest-ready.</h1>
                <p className="max-w-xl text-base text-white/80 sm:text-lg">
                  Stay on top of bookings, expenses, inventory, and your to-buy list. A single, elegant control center for your villa.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="shadow-lg shadow-indigo-300/40" onClick={() => window.location.href = '/login'}>
                  <span className="inline-flex items-center gap-2">Go to Login <ArrowRight className="h-4 w-4" /></span>
                </Button>
                <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
                  <span className="inline-flex items-center gap-2">Open Dashboard</span>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" /> Live occupancy
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-300" /> Smart to-buy alerts
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-sky-300" /> Calendar-first bookings
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="bg-white/90 backdrop-blur-lg shadow-xl shadow-indigo-200/40 border-indigo-50">
                <CardHeader className="border-0 pb-2">
                  <CardTitle>At a glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Occupancy" value="82%" trend="up" detail="This month" />
                    <Metric label="ADR" value="$245" trend="up" detail="+6% vs last month" />
                    <Metric label="Net profit" value="$8.4k" trend="up" detail="Projected" />
                    <Metric label="Expenses" value="$4.8k" trend="down" detail="Month-to-date" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-indigo-50/60 border-indigo-100 shadow-lg shadow-indigo-100/60">
                <CardHeader className="border-0 pb-1">
                  <CardTitle>Upcoming stays</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.guest} className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white/80 px-4 py-3 shadow-sm">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{booking.guest}</p>
                        <p className="text-xs text-slate-500">{booking.platform} · {booking.dates}</p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">{booking.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickCards.map(({ title, value, icon: Icon, tone, badge }) => (
            <Card key={title} className={`border-0 bg-gradient-to-br ${tone} shadow-lg shadow-gray-200/40`}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{title}</p>
                  <span className="text-[11px] rounded-full bg-white/70 px-2 py-0.5 text-indigo-700 font-semibold">
                    {badge}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <div className="rounded-full bg-white/70 p-2 text-indigo-700 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-lg shadow-slate-200/60">
            <CardHeader>
              <CardTitle>Stay operations dashboard</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <MiniFeature icon={CalendarDays} title="Calendar-first" description="Book, edit, and inspect stays directly on a color-coded calendar." />
              <MiniFeature icon={TrendingUp} title="Profit clarity" description="Instant view of ADR, occupancy, and profit trends." />
              <MiniFeature icon={ShoppingBag} title="Smart stock" description="Low-stock signals and a curated to-buy queue." />
              <MiniFeature icon={Sparkles} title="Premium UI" description="Fast, clean interactions with hover/press animations." />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-300/50">
            <CardHeader className="border-0">
              <CardTitle className="text-white">What’s next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold">Deploy</p>
                <p className="text-sm text-white/80">Set Vercel env vars and run the bookings migration.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold">Verify rentals</p>
                <p className="text-sm text-white/80">Add a booking and confirm it appears in the calendar instantly.</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold">Stay in control</p>
                <p className="text-sm text-white/80">Track expenses and inventory with unified UI states.</p>
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
    <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{label}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {trend === 'up' ? '↑' : '↓'} {trend === 'up' ? 'up' : 'down'}
        </span>
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  )
}

function MiniFeature({ icon: Icon, title, description }: { icon: IconType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 shadow-inner">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

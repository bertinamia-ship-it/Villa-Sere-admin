import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MaintenancePlanList from './MaintenancePlanList'

export default async function MaintenancePlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <MaintenancePlanList />
}



import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MaintenanceList from './MaintenanceList'

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <MaintenanceList />
}

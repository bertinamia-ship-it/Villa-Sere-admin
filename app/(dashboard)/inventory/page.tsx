import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InventoryList from './InventoryList'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <InventoryList />
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: tenant } = await supabase
    .from('lojas')
    .select('*')
    .eq('proprietario_id', session.user.id)
    .single()

  if (!tenant) {
    redirect('/auth/signup')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar tenant={tenant} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader tenant={tenant} user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

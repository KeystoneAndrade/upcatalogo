'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, ExternalLink } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface DashboardHeaderProps {
  tenant: { name: string; subdomain: string }
  user: User
}

export function DashboardHeader({ tenant, user }: DashboardHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-900 md:hidden">{tenant.name}</h2>
      </div>
      <div className="flex items-center space-x-3">
        <a
          href={`https://${tenant.subdomain}.upcatalogo.com.br`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          Ver loja
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

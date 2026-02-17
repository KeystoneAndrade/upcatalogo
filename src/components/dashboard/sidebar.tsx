'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Truck,
  CreditCard,
  Tag,
  TicketPercent,
  Store,
  Image as ImageIcon,
} from 'lucide-react'

interface SidebarProps {
  tenant: {
    id: string
    name: string
    subdomain: string
    logo_url: string | null
  }
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produtos', href: '/dashboard/products', icon: Package },
  { name: 'Categorias', href: '/dashboard/categories', icon: Tag },
  { name: 'Cupons', href: '/dashboard/coupons', icon: TicketPercent },
  { name: 'Banners', href: '/dashboard/banners', icon: ImageIcon },
  { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Entrega', href: '/dashboard/shipping', icon: Truck },
  { name: 'Pagamentos', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Configuracoes', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ tenant }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r">
      <div className="flex items-center h-16 px-6 border-b">
        <Store className="h-6 w-6 text-blue-600 mr-2" />
        <span className="font-semibold text-lg truncate">{tenant.name}</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          {tenant.subdomain}.upcatalogo.com.br
        </p>
      </div>
    </aside>
  )
}

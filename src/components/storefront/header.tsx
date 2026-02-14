'use client'

import Link from 'next/link'
import { Store, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { Button } from '@/components/ui/button'

interface StorefrontHeaderProps {
  tenant: {
    name: string
    logo_url: string | null
    primary_color: string
  }
}

export function StorefrontHeader({ tenant }: StorefrontHeaderProps) {
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 object-contain" />
          ) : (
            <Store className="h-6 w-6" style={{ color: tenant.primary_color }} />
          )}
          <span className="font-bold text-lg">{tenant.name}</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/produtos" className="text-sm text-gray-600 hover:text-gray-900">
            Produtos
          </Link>
          <Link href="/checkout">
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Carrinho
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

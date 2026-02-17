'use client'

import Link from 'next/link'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useTenantSettings } from '@/components/storefront/tenant-settings-provider'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    image_url: string | null
    is_active: boolean
    variants?: any
  }
}

function productHasVariants(variants: any): boolean {
  if (!variants) return false
  if (Array.isArray(variants) && variants.length === 0) return false
  return !!(variants.attributes && Array.isArray(variants.attributes) && variants.attributes.length > 0 && variants.items?.length > 0)
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openMiniCart = useCartStore((s) => s.openMiniCart)
  const settings = useTenantSettings()
  const hasVariants = productHasVariants(product.variants)
  const discount = product.compare_at_price
    ? calculateDiscount(product.compare_at_price, product.price)
    : 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (hasVariants) {
      // Redirecionar para pagina de detalhe para escolher variacao
      window.location.href = `/produtos/${product.slug}`
      return
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
    })
    toast.success('Adicionado ao carrinho!')
    if (settings.open_cart_on_add) {
      setTimeout(() => openMiniCart(), 300)
    }
  }

  return (
    <Link href={`/produtos/${product.slug}`} className="group">
      <div className="bg-white rounded-lg border overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-square relative bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart className="h-12 w-12" />
            </div>
          )}
          {discount > 0 && !hasVariants && (
            <Badge className="absolute top-2 left-2 bg-red-500">-{discount}%</Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
          <div className="flex items-center space-x-2">
            {hasVariants && (
              <span className="text-xs text-muted-foreground">A partir de</span>
            )}
            <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
            {product.compare_at_price && !hasVariants && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {hasVariants ? 'Ver opcoes' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </Link>
  )
}

'use client'

import { useCartStore } from '@/store/cart-store'
import { useTenantSettings } from '@/components/storefront/tenant-settings-provider'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

export function AddToCartButton({ product }: { product: any }) {
  const addItem = useCartStore((s) => s.addItem)
  const openMiniCart = useCartStore((s) => s.openMiniCart)
  const settings = useTenantSettings()

  function handleAdd() {
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
    <Button size="lg" className="w-full" onClick={handleAdd}>
      <ShoppingCart className="mr-2 h-5 w-5" />
      Adicionar ao carrinho
    </Button>
  )
}

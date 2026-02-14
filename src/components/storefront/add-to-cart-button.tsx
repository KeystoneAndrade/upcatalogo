'use client'

import { useCartStore } from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

export function AddToCartButton({ product }: { product: any }) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
    })
    toast.success('Adicionado ao carrinho!')
  }

  return (
    <Button size="lg" className="w-full" onClick={handleAdd}>
      <ShoppingCart className="mr-2 h-5 w-5" />
      Adicionar ao carrinho
    </Button>
  )
}

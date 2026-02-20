'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'

export function MiniCart() {
  const [mounted, setMounted] = useState(false)
  const { items, isOpen, closeMiniCart, removeItem, updateQuantity, total, itemCount } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fechar com ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMiniCart()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeMiniCart])

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={closeMiniCart}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho
            {itemCount() > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount()} {itemCount() === 1 ? 'item' : 'itens'})
              </span>
            )}
          </h2>
          <button
            onClick={closeMiniCart}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground">Seu carrinho esta vazio</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={closeMiniCart}
              >
                Continuar comprando
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const key = item.variant
                  ? `${item.productId}-${item.variant}`
                  : item.productId
                return (
                  <div key={key} className="flex gap-3">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">{item.variant}</p>
                      )}
                      <p className="text-sm font-semibold mt-0.5">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variant)
                          }
                          className="h-6 w-6 rounded border flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variant)
                          }
                          disabled={item.manage_stock && item.stock_quantity !== undefined && item.quantity >= item.stock_quantity}
                          className="h-6 w-6 rounded border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={item.manage_stock && item.stock_quantity !== undefined && item.quantity >= item.stock_quantity ? 'Limite de estoque atingido' : ''}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId, item.variant)}
                          className="ml-auto p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal</span>
              <span className="text-lg font-bold">{formatCurrency(total())}</span>
            </div>
            <Link href="/checkout" onClick={closeMiniCart}>
              <Button className="w-full" size="lg">
                Finalizar pedido
              </Button>
            </Link>
            <button
              onClick={closeMiniCart}
              className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuar comprando
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

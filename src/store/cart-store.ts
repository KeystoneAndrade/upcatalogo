import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'

export interface CartItem {
  productId: string
  variacaoId?: string | null
  sku?: string | null
  name: string
  price: number
  quantity: number
  image: string | null
  variant?: string
  stock_quantity?: number
  manage_stock?: boolean
  weight?: number | null
  height?: number | null
  width?: number | null
  length?: number | null
  attributes?: any
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, variant?: string) => void
  updateQuantity: (productId: string, quantity: number, variant?: string) => void
  clearCart: () => void
  openMiniCart: () => void
  closeMiniCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const state = get()
        const key = item.variant ? `${item.productId}-${item.variant}` : item.productId
        const existing = state.items.find(
          (i) => (i.variant ? `${i.productId}-${i.variant}` : i.productId) === key
        )

        if (existing) {
          const newQuantity = existing.quantity + 1

          if (item.manage_stock && item.stock_quantity !== undefined) {
            if (newQuantity > item.stock_quantity) {
              toast.error(`Desculpe, temos apenas ${item.stock_quantity} unidades em estoque.`)
              return
            }
          }

          set({
            items: state.items.map((i) =>
              (i.variant ? `${i.productId}-${i.variant}` : i.productId) === key
                ? { ...i, quantity: newQuantity }
                : i
            ),
          })
        } else {
          if (item.manage_stock && item.stock_quantity !== undefined && item.stock_quantity <= 0) {
            toast.error('Produto esgotado.')
            return
          }

          set({
            items: [...state.items, { ...item, quantity: 1 }],
          })
        }
      },

      removeItem: (productId, variant) => {
        set((state) => ({
          items: state.items.filter((i) => {
            const key = variant ? `${productId}-${variant}` : productId
            const itemKey = i.variant ? `${i.productId}-${i.variant}` : i.productId
            return itemKey !== key
          }),
        }))
      },

      updateQuantity: (productId, quantity, variant) => {
        if (quantity <= 0) {
          get().removeItem(productId, variant)
          return
        }

        const state = get()
        const key = variant ? `${productId}-${variant}` : productId
        const item = state.items.find((i) => (i.variant ? `${i.productId}-${i.variant}` : i.productId) === key)

        if (item && item.manage_stock && item.stock_quantity !== undefined) {
          if (quantity > item.stock_quantity) {
            toast.error(`Apenas ${item.stock_quantity} disponivéis no estoque.`)
            return
          }
        }

        set((state) => ({
          items: state.items.map((i) => {
            const itemKey = i.variant ? `${i.productId}-${i.variant}` : i.productId
            return itemKey === key ? { ...i, quantity } : i
          }),
        }))
      },

      clearCart: () => set({ items: [] }),

      openMiniCart: () => set({ isOpen: true }),

      closeMiniCart: () => set({ isOpen: false }),

      total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

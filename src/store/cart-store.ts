import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string | null
  variant?: string
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
        set((state) => {
          const key = item.variant ? `${item.productId}-${item.variant}` : item.productId
          const existing = state.items.find(
            (i) => (i.variant ? `${i.productId}-${i.variant}` : i.productId) === key
          )

          if (existing) {
            return {
              items: state.items.map((i) =>
                (i.variant ? `${i.productId}-${i.variant}` : i.productId) === key
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }

          return {
            items: [...state.items, { ...item, quantity: 1 }],
          }
        })
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
        set((state) => ({
          items: state.items.map((i) => {
            const key = variant ? `${productId}-${variant}` : productId
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

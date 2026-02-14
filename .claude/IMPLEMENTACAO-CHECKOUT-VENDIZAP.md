# 🎯 Guia de Implementação - Checkout Estilo Vendizap

## 📋 Objetivo

Implementar checkout **rápido e intuitivo** igual ao da Vendizap:
- ✅ Modal centralizado (não nova página)
- ✅ Formulário minimalista
- ✅ Sidebar com resumo
- ✅ Tudo em uma única tela
- ✅ Finalização direto para WhatsApp

---

## 🎨 Análise Visual da Vendizap

### Layout Desktop
```
┌────────────────────────────────────────────────────────────┐
│                   [X] Checkout                              │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │  Suas Informações    │  │  Confirma seu pedido     │   │
│  │                      │  │                          │   │
│  │  Nome: [________]    │  │  🛍️ 4x VESTIDO CLEIDE   │   │
│  │  Tel:  [________]    │  │                          │   │
│  │                      │  │  Subtotal: R$ 480,00     │   │
│  │  Pagamento           │  │                          │   │
│  │  [PIX ▼]            │  │  Cupom: [______]         │   │
│  │                      │  │                          │   │
│  │                      │  │  Entrega:                │   │
│  │                      │  │  ⚪ Retirar na loja      │   │
│  │                      │  │  ⚪ Entregar             │   │
│  │                      │  │                          │   │
│  │                      │  │  Total: R$ 480,00        │   │
│  │                      │  │                          │   │
│  │                      │  │  Obs: [________]         │   │
│  │                      │  │                          │   │
│  │                      │  │  [FINALIZAR PEDIDO]      │   │
│  └──────────────────────┘  └──────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Layout Mobile
```
┌─────────────────────────┐
│  [<] Checkout           │
│                         │
│  📦 Resumo do pedido    │
│  4x itens - R$ 480,00  │
│  [ver detalhes ▼]      │
├─────────────────────────┤
│  Suas Informações       │
│  Nome: [__________]    │
│  Tel:  [__________]    │
│                         │
│  Pagamento: [PIX ▼]    │
│                         │
│  Entrega:               │
│  ⚪ Retirar na loja    │
│  ⚪ Entregar           │
│                         │
│  [FINALIZAR PEDIDO]     │
└─────────────────────────┘
```

---

## 🏗️ Estrutura de Arquivos

```
src/
├── components/storefront/checkout/
│   ├── QuickCheckoutButton.tsx      # Botão flutuante
│   ├── QuickCheckoutModal.tsx       # Modal principal
│   ├── CheckoutFormSection.tsx      # Formulário (esquerda)
│   ├── OrderSummarySection.tsx      # Resumo (direita)
│   ├── PaymentMethodSelect.tsx      # Dropdown pagamento
│   ├── DeliveryOptions.tsx          # Radio buttons entrega
│   ├── CouponInput.tsx              # Input de cupom
│   └── OrderItemsList.tsx           # Lista de itens
├── hooks/
│   ├── useCheckout.ts               # Lógica do checkout
│   └── useCart.ts                   # Estado do carrinho
└── store/
    └── checkoutStore.ts             # Zustand store
```

---

## 💻 Implementação Passo a Passo

### Passo 1: Criar Store do Checkout

```typescript
// src/store/checkoutStore.ts

import { create } from 'zustand'

interface CheckoutStore {
  // Modal
  isOpen: boolean
  openCheckout: () => void
  closeCheckout: () => void
  
  // Dados do formulário
  customerName: string
  customerPhone: string
  paymentMethodId: string
  deliveryMethod: 'pickup' | 'delivery' | 'shipping' | null
  address: Address | null
  couponCode: string
  notes: string
  
  // Ações
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setPaymentMethod: (id: string) => void
  setDeliveryMethod: (method: string) => void
  setAddress: (address: Address) => void
  setCoupon: (code: string) => void
  setNotes: (notes: string) => void
  reset: () => void
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  isOpen: false,
  openCheckout: () => set({ isOpen: true }),
  closeCheckout: () => set({ isOpen: false }),
  
  customerName: '',
  customerPhone: '',
  paymentMethodId: '',
  deliveryMethod: null,
  address: null,
  couponCode: '',
  notes: '',
  
  setCustomerName: (name) => set({ customerName: name }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setPaymentMethod: (id) => set({ paymentMethodId: id }),
  setDeliveryMethod: (method) => set({ deliveryMethod: method as any }),
  setAddress: (address) => set({ address }),
  setCoupon: (code) => set({ couponCode: code }),
  setNotes: (notes) => set({ notes }),
  
  reset: () => set({
    customerName: '',
    customerPhone: '',
    paymentMethodId: '',
    deliveryMethod: null,
    address: null,
    couponCode: '',
    notes: '',
  }),
}))
```

### Passo 2: Botão Flutuante do Carrinho

```typescript
// src/components/storefront/checkout/QuickCheckoutButton.tsx

'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCheckoutStore } from '@/store/checkoutStore'

export function QuickCheckoutButton() {
  const cart = useCartStore()
  const checkout = useCheckoutStore()

  if (cart.itemCount === 0) return null

  return (
    <button
      onClick={checkout.openCheckout}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Abrir carrinho"
    >
      <div className="relative">
        {/* Botão principal */}
        <div className="bg-rose-600 hover:bg-rose-700 text-white rounded-full p-4 shadow-2xl transition-all group-hover:scale-110">
          <ShoppingCart className="w-6 h-6" />
        </div>

        {/* Badge de quantidade */}
        {cart.itemCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg animate-bounce">
            {cart.itemCount}
          </div>
        )}

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Ver carrinho ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'})
        </div>
      </div>
    </button>
  )
}
```

### Passo 3: Modal Principal do Checkout

```typescript
// src/components/storefront/checkout/QuickCheckoutModal.tsx

'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useCheckoutStore } from '@/store/checkoutStore'
import { useCartStore } from '@/store/cartStore'
import { CheckoutFormSection } from './CheckoutFormSection'
import { OrderSummarySection } from './OrderSummarySection'
import { X } from 'lucide-react'

export function QuickCheckoutModal() {
  const checkout = useCheckoutStore()
  const cart = useCartStore()

  if (cart.itemCount === 0) return null

  return (
    <Dialog open={checkout.isOpen} onOpenChange={checkout.closeCheckout}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        {/* Header mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Finalizar Pedido</h2>
          <button
            onClick={checkout.closeCheckout}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout principal */}
        <div className="grid md:grid-cols-[1fr,420px] h-full">
          {/* Formulário (esquerda) */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <CheckoutFormSection />
          </div>

          {/* Resumo (direita) - gradient rosa/roxo estilo Vendizap */}
          <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 text-white p-6 overflow-y-auto">
            <OrderSummarySection />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Passo 4: Seção do Formulário

```typescript
// src/components/storefront/checkout/CheckoutFormSection.tsx

'use client'

import { useState, useEffect } from 'react'
import { useCheckoutStore } from '@/store/checkoutStore'
import { Input } from '@/components/ui/input'
import { PaymentMethodSelect } from './PaymentMethodSelect'
import { formatPhone } from '@/lib/utils'

export function CheckoutFormSection() {
  const checkout = useCheckoutStore()
  const [paymentMethods, setPaymentMethods] = useState([])

  useEffect(() => {
    // Buscar formas de pagamento
    fetch('/api/payment-methods')
      .then(r => r.json())
      .then(setPaymentMethods)
  }, [])

  return (
    <div className="space-y-8">
      {/* Header desktop */}
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-gray-900">
          Suas Informações
        </h2>
        <p className="text-gray-600 mt-1">
          Preencha seus dados para finalizar
        </p>
      </div>

      {/* Nome completo */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <Input
          value={checkout.customerName}
          onChange={(e) => checkout.setCustomerName(e.target.value)}
          placeholder="Seu nome completo"
          required
          autoComplete="name"
          className="h-12 text-base"
        />
      </div>

      {/* Telefone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Telefone <span className="text-red-500">*</span>
        </label>
        <Input
          value={checkout.customerPhone}
          onChange={(e) => {
            const formatted = formatPhone(e.target.value)
            checkout.setCustomerPhone(formatted)
          }}
          placeholder="(00) 00000-0000"
          required
          autoComplete="tel"
          maxLength={15}
          className="h-12 text-base"
        />
      </div>

      {/* Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Pagamento
        </h3>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Forma de pagamento <span className="text-red-500">*</span>
          </label>
          <PaymentMethodSelect
            methods={paymentMethods}
            value={checkout.paymentMethodId}
            onChange={checkout.setPaymentMethod}
          />
        </div>

        {/* Instruções do método selecionado */}
        {checkout.paymentMethodId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              {getPaymentInstructions(checkout.paymentMethodId, paymentMethods)}
            </p>
          </div>
        )}
      </div>

      {/* Botão mobile (no desktop fica na sidebar) */}
      <div className="md:hidden sticky bottom-0 bg-white border-t pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-lg text-lg transition"
        >
          Finalizar Pedido
        </button>
      </div>
    </div>
  )
}

function getPaymentInstructions(methodId: string, methods: any[]) {
  const method = methods.find(m => m.id === methodId)
  return method?.instructions || 'Instruções serão enviadas após finalizar o pedido.'
}
```

### Passo 5: Seção do Resumo (Sidebar)

```typescript
// src/components/storefront/checkout/OrderSummarySection.tsx

'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useCheckoutStore } from '@/store/checkoutStore'
import { formatCurrency } from '@/lib/utils'
import { OrderItemsList } from './OrderItemsList'
import { DeliveryOptions } from './DeliveryOptions'
import { CouponInput } from './CouponInput'
import { Share2, ChevronDown, ChevronUp } from 'lucide-react'

export function OrderSummarySection() {
  const cart = useCartStore()
  const checkout = useCheckoutStore()
  const [showItems, setShowItems] = useState(true)

  async function handleFinalize() {
    // Validações
    if (!checkout.customerName || !checkout.customerPhone) {
      toast.error('Preencha nome e telefone')
      return
    }

    if (!checkout.paymentMethodId) {
      toast.error('Selecione a forma de pagamento')
      return
    }

    if (!checkout.deliveryMethod) {
      toast.error('Selecione a forma de entrega')
      return
    }

    if (checkout.deliveryMethod === 'delivery' && !checkout.address) {
      toast.error('Informe o endereço de entrega')
      return
    }

    // Criar pedido
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: checkout.customerName,
            phone: checkout.customerPhone,
          },
          items: cart.items,
          payment_method_id: checkout.paymentMethodId,
          delivery_method: checkout.deliveryMethod,
          address: checkout.address,
          subtotal: cart.subtotal,
          shipping_cost: cart.shippingCost,
          discount: cart.discount,
          total: cart.total,
          coupon_code: checkout.couponCode,
          notes: checkout.notes,
        }),
      })

      const order = await response.json()

      // Gerar mensagem do WhatsApp
      const message = generateWhatsAppMessage(order)
      const whatsappLink = `https://wa.me/${getTenantWhatsApp()}?text=${encodeURIComponent(message)}`

      // Limpar e redirecionar
      cart.clearCart()
      checkout.reset()
      checkout.closeCheckout()
      
      window.location.href = whatsappLink
    } catch (error) {
      toast.error('Erro ao finalizar pedido')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Confirma seu pedido</h2>
        <button
          className="p-2 hover:bg-white/10 rounded-full transition"
          onClick={() => {/* compartilhar */}}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Itens (expansível) */}
      <div className="space-y-2">
        <button
          onClick={() => setShowItems(!showItems)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-semibold">
            {cart.itemCount}x {cart.itemCount === 1 ? 'item' : 'itens'}
          </span>
          {showItems ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showItems && <OrderItemsList items={cart.items} />}
      </div>

      {/* Subtotal */}
      <div className="flex justify-between text-lg">
        <span>Subtotal:</span>
        <span className="font-bold">{formatCurrency(cart.subtotal)}</span>
      </div>

      {/* Adicionar mais itens */}
      <button
        onClick={() => checkout.closeCheckout()}
        className="w-full py-3 border-2 border-white/30 rounded-lg hover:bg-white/10 transition font-medium"
      >
        + Adicionar mais itens
      </button>

      {/* Cupom */}
      <CouponInput />

      {/* Entrega */}
      <DeliveryOptions />

      {/* Desconto */}
      {cart.discount > 0 && (
        <div className="flex justify-between text-green-300">
          <span>Desconto:</span>
          <span className="font-semibold">-{formatCurrency(cart.discount)}</span>
        </div>
      )}

      {/* Frete */}
      {cart.shippingCost > 0 && (
        <div className="flex justify-between">
          <span>Frete:</span>
          <span className="font-semibold">{formatCurrency(cart.shippingCost)}</span>
        </div>
      )}

      {/* Total */}
      <div className="pt-4 border-t border-white/30">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">Total:</span>
          <span className="text-3xl font-bold">{formatCurrency(cart.total)}</span>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Observações</label>
        <textarea
          value={checkout.notes}
          onChange={(e) => checkout.setNotes(e.target.value)}
          placeholder="Detalhes do seu pedido"
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 placeholder:text-white/50 resize-none focus:ring-2 focus:ring-white/50"
        />
      </div>

      {/* Botão finalizar (desktop) */}
      <button
        onClick={handleFinalize}
        className="hidden md:block w-full bg-white text-rose-600 hover:bg-gray-100 font-bold py-4 rounded-lg text-lg transition shadow-lg hover:shadow-xl"
      >
        Finalizar Pedido
      </button>
    </div>
  )
}

function generateWhatsAppMessage(order: any): string {
  let message = `🛍️ *Novo Pedido #${order.order_number}*\n\n`
  
  message += `*Itens:*\n`
  order.items.forEach((item: any) => {
    message += `• ${item.quantity}x ${item.name}`
    if (item.variant_name) message += ` (${item.variant_name})`
    message += ` - ${formatCurrency(item.price * item.quantity)}\n`
  })
  
  message += `\n*Cliente:* ${order.customer_name}\n`
  message += `*Telefone:* ${order.customer_phone}\n`
  message += `*Pagamento:* ${order.payment_method}\n`
  message += `*Entrega:* ${order.delivery_method}\n`
  
  if (order.address) {
    message += `*Endereço:* ${formatAddress(order.address)}\n`
  }
  
  message += `\n*Total:* ${formatCurrency(order.total)}\n`
  
  if (order.notes) {
    message += `\n*Observações:* ${order.notes}\n`
  }
  
  message += `\n_Pedido realizado via ${window.location.host}_`
  
  return message
}
```

### Passo 6: Componentes Auxiliares

```typescript
// src/components/storefront/checkout/DeliveryOptions.tsx

export function DeliveryOptions() {
  const checkout = useCheckoutStore()

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Entrega</h3>

      <div className="space-y-2">
        {/* Retirar na loja */}
        <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer hover:bg-white/10 transition border-2 border-transparent has-[:checked]:border-white/50">
          <input
            type="radio"
            name="delivery"
            value="pickup"
            checked={checkout.deliveryMethod === 'pickup'}
            onChange={(e) => checkout.setDeliveryMethod(e.target.value)}
            className="mt-1"
          />
          <div>
            <div className="font-medium">Retirar na loja</div>
            <div className="text-sm text-white/80">Sem custo de entrega</div>
          </div>
        </label>

        {/* Entrega no endereço */}
        <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer hover:bg-white/10 transition border-2 border-transparent has-[:checked]:border-white/50">
          <input
            type="radio"
            name="delivery"
            value="delivery"
            checked={checkout.deliveryMethod === 'delivery'}
            onChange={(e) => checkout.setDeliveryMethod(e.target.value)}
            className="mt-1"
          />
          <div>
            <div className="font-medium">Entregar no meu endereço</div>
            <div className="text-sm text-white/80">Calcularemos o frete</div>
          </div>
        </label>

        {/* Formulário de endereço (se delivery) */}
        {checkout.deliveryMethod === 'delivery' && (
          <div className="ml-7 space-y-3 mt-3">
            <Input
              placeholder="CEP"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
            />
            {/* mais campos... */}
          </div>
        )}

        {/* Retirar em ponto de envio */}
        <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer hover:bg-white/10 transition border-2 border-transparent has-[:checked]:border-white/50">
          <input
            type="radio"
            name="delivery"
            value="shipping"
            checked={checkout.deliveryMethod === 'shipping'}
            onChange={(e) => checkout.setDeliveryMethod(e.target.value)}
            className="mt-1"
          />
          <div>
            <div className="font-medium">Retirar em Envio por excursão</div>
            <div className="text-sm text-white/80">Consulte disponibilidade</div>
          </div>
        </label>
      </div>
    </div>
  )
}
```

---

## 🎨 Estilo Vendizap (Tailwind)

```typescript
// Gradient rosa/roxo da sidebar
className="bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600"

// Botão finalizar (branco sobre gradiente)
className="bg-white text-rose-600 hover:bg-gray-100 font-bold"

// Inputs na sidebar (transparentes)
className="bg-white/10 border-white/30 text-white placeholder:text-white/50"

// Radio buttons com borda quando selecionado
className="border-2 border-transparent has-[:checked]:border-white/50"
```

---

## ✅ Checklist de Implementação

### Estrutura Base
- [ ] Criar checkoutStore (Zustand)
- [ ] Criar QuickCheckoutButton
- [ ] Criar QuickCheckoutModal
- [ ] Adicionar botão ao layout

### Formulário
- [ ] CheckoutFormSection
- [ ] Inputs (nome, telefone)
- [ ] PaymentMethodSelect
- [ ] Validação de campos
- [ ] Máscaras (telefone)

### Resumo (Sidebar)
- [ ] OrderSummarySection
- [ ] OrderItemsList (expansível)
- [ ] CouponInput
- [ ] DeliveryOptions
- [ ] Campo observações
- [ ] Cálculo de total

### Finalização
- [ ] Validar dados
- [ ] Criar pedido (API)
- [ ] Gerar mensagem WhatsApp
- [ ] Redirecionar
- [ ] Limpar carrinho
- [ ] Loading states

### Responsivo
- [ ] Layout desktop (2 colunas)
- [ ] Layout mobile (coluna única)
- [ ] Botão finalizar (bottom mobile)
- [ ] Modal full-screen mobile

---

## 🚀 Próximos Passos

1. **Implementar estrutura base** (2-3 dias)
2. **Adicionar validações** (1 dia)
3. **Integrar com API** (1 dia)
4. **Testar responsividade** (1 dia)
5. **Polish e refinamentos** (1 dia)

**Total estimado:** 6-7 dias

---

**Pronto para implementar o checkout mais rápido e intuitivo! 🎉**

# 🛒 Checkout Rápido Estilo Vendizap

## 📋 Visão Geral

Checkout otimizado em **página única** (ou modal) inspirado na Vendizap:
- Sem múltiplas páginas
- Modal/Slide-over centralizado
- Resumo fixo lateral
- Fluxo rápido e intuitivo

## 🎯 Análise do Checkout Vendizap

### Estrutura Visual

```
┌─────────────────────────────────────────────────────────┐
│ [X]                  Suas Informações                   │
│                                                           │
│  Nome completo *                                         │
│  [_____________________________________________]         │
│                                                           │
│  Telefone *                                              │
│  [_____________________________________________]         │
│                                                           │
│  Pagamento                                               │
│  Forma de pagamento *                                    │
│  [Selecione ▼]                                          │
│    ├─ PIX                                                │
│    ├─ Dinheiro                                           │
│    └─ Transferência TED                                 │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│  Confirma seu pedido         │
│                              │
│  4x VESTIDO CLEIDE           │
│  1x Bege/44 R$ 120,00       │
│  1x ROSÊ/44 R$ 120,00       │
│  1x ROSÊ/46 R$ 120,00       │
│  1x ROSÊ/48 R$ 120,00       │
│                              │
│  Subtotal:      R$ 480,00    │
│                              │
│  [+ Adicionar mais itens]    │
│                              │
│  Cupom de desconto           │
│  [__________________]        │
│                              │
│  Entrega                     │
│  ○ Retirar na loja          │
│  ○ Entregar no meu endereço │
│  ○ Retirar em Envio por... │
│                              │
│  Total:         R$ 480,00    │
│                              │
│  Observações                 │
│  [_____________________]    │
│                              │
│  [FINALIZAR PEDIDO]         │
└──────────────────────────────┘
```

### Features Principais

1. ✅ **Modal centralizado** com formulário
2. ✅ **Sidebar fixa** com resumo do pedido
3. ✅ **Formulário mínimo** (nome, telefone, pagamento)
4. ✅ **Dropdown de pagamento** integrado
5. ✅ **Cupom de desconto** inline
6. ✅ **Opções de entrega** com radio buttons
7. ✅ **Observações** expandidas
8. ✅ **Botão destacado** para finalizar

---

## 💻 Implementação

### 1. Estrutura do Componente

```
src/components/storefront/
├── QuickCheckout.tsx           # Componente principal
├── CheckoutModal.tsx           # Modal do checkout
├── CheckoutForm.tsx            # Formulário (lado esquerdo)
├── OrderSummary.tsx            # Resumo (sidebar direita)
└── DeliveryOptions.tsx         # Opções de entrega
```

### 2. Código do Checkout Modal

```typescript
// src/components/storefront/QuickCheckout.tsx

'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useCartStore } from '@/store/cartStore'
import { CheckoutForm } from './CheckoutForm'
import { OrderSummary } from './OrderSummary'

export function QuickCheckout({ isOpen, onClose }: Props) {
  const cart = useCartStore()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    paymentMethod: '',
    deliveryMethod: '',
    address: null,
    coupon: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validar dados
    if (!formData.name || !formData.phone || !formData.paymentMethod) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Se escolheu entrega, validar endereço
    if (formData.deliveryMethod === 'delivery' && !formData.address) {
      toast.error('Informe o endereço de entrega')
      return
    }

    // Criar pedido
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items,
          customer: {
            name: formData.name,
            phone: formData.phone,
          },
          payment_method: formData.paymentMethod,
          delivery_method: formData.deliveryMethod,
          address: formData.address,
          shipping_cost: cart.shippingCost,
          total: cart.total + cart.shippingCost,
          notes: formData.notes,
        }),
      })

      const order = await response.json()

      // Gerar mensagem do WhatsApp
      const whatsappMessage = generateWhatsAppMessage(order)
      const whatsappUrl = generateWhatsAppLink(tenant.whatsapp, whatsappMessage)

      // Limpar carrinho
      cart.clearCart()

      // Redirecionar para WhatsApp
      window.location.href = whatsappUrl
    } catch (error) {
      toast.error('Erro ao finalizar pedido')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <div className="grid md:grid-cols-[1fr,400px] h-full">
          {/* Formulário (lado esquerdo) */}
          <div className="p-6 overflow-y-auto">
            <CheckoutForm
              data={formData}
              onChange={setFormData}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Resumo (sidebar direita) */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 overflow-y-auto">
            <OrderSummary
              items={cart.items}
              subtotal={cart.subtotal}
              shippingCost={cart.shippingCost}
              discount={cart.discount}
              total={cart.total}
              coupon={formData.coupon}
              onCouponChange={(coupon) => setFormData({...formData, coupon})}
              deliveryMethod={formData.deliveryMethod}
              onDeliveryChange={(method) => setFormData({...formData, deliveryMethod: method})}
              notes={formData.notes}
              onNotesChange={(notes) => setFormData({...formData, notes})}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 3. Formulário do Checkout

```typescript
// src/components/storefront/CheckoutForm.tsx

'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function CheckoutForm({ data, onChange, onSubmit }: Props) {
  const [paymentMethods, setPaymentMethods] = useState([])

  useEffect(() => {
    // Buscar formas de pagamento do tenant
    fetch('/api/payment-methods')
      .then(r => r.json())
      .then(setPaymentMethods)
  }, [])

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Suas Informações</h2>

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nome completo <span className="text-red-500">*</span>
        </label>
        <Input
          value={data.name}
          onChange={(e) => onChange({...data, name: e.target.value})}
          placeholder="Nome Completo"
          required
          className="w-full"
        />
      </div>

      {/* Telefone */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Telefone <span className="text-red-500">*</span>
        </label>
        <Input
          value={data.phone}
          onChange={(e) => onChange({...data, phone: formatPhone(e.target.value)})}
          placeholder="(00) 00000-0000"
          required
          maxLength={15}
          className="w-full"
        />
      </div>

      {/* Pagamento */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pagamento</h3>
        <label className="block text-sm font-medium mb-2">
          Forma de pagamento <span className="text-red-500">*</span>
        </label>
        <Select
          value={data.paymentMethod}
          onValueChange={(value) => onChange({...data, paymentMethod: value})}
          required
        >
          <option value="">Selecione</option>
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </Select>

        {/* Instruções do método selecionado */}
        {data.paymentMethod && (
          <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
            {getPaymentInstructions(data.paymentMethod)}
          </div>
        )}
      </div>

      {/* Botão mobile (no desktop fica na sidebar) */}
      <div className="md:hidden">
        <Button type="submit" className="w-full" size="lg">
          Finalizar Pedido
        </Button>
      </div>
    </form>
  )
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}
```

### 4. Resumo do Pedido (Sidebar)

```typescript
// src/components/storefront/OrderSummary.tsx

'use client'

export function OrderSummary({
  items,
  subtotal,
  shippingCost,
  discount,
  total,
  coupon,
  onCouponChange,
  deliveryMethod,
  onDeliveryChange,
  notes,
  onNotesChange,
}: Props) {
  const [expandedItems, setExpandedItems] = useState(true)
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  async function handleApplyCoupon() {
    if (!coupon) return

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon }),
      })

      const data = await response.json()
      
      if (data.valid) {
        setAppliedCoupon(data.coupon)
        toast.success('Cupom aplicado!')
      } else {
        toast.error('Cupom inválido')
      }
    } catch (error) {
      toast.error('Erro ao validar cupom')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Confirma seu pedido</h2>
        <button className="text-white/80 hover:text-white">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de itens */}
      <div className="space-y-2">
        <button
          onClick={() => setExpandedItems(!expandedItems)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-semibold">
            {items.reduce((sum, item) => sum + item.quantity, 0)}x itens
          </span>
          {expandedItems ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedItems && (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 py-2">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{item.quantity}x {item.name}</div>
                  {item.variant_name && (
                    <div className="text-white/80">{item.variant_name}</div>
                  )}
                  <div className="font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subtotal */}
      <div className="flex justify-between text-lg">
        <span>Subtotal:</span>
        <span className="font-bold">{formatCurrency(subtotal)}</span>
      </div>

      {/* Adicionar mais itens */}
      <button className="w-full py-2 border border-white/30 rounded hover:bg-white/10 transition">
        + Adicionar mais itens
      </button>

      {/* Cupom */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Cupom de desconto
        </label>
        <div className="flex gap-2">
          <Input
            value={coupon}
            onChange={(e) => onCouponChange(e.target.value.toUpperCase())}
            placeholder="Código do cupom"
            className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50"
          />
          <Button
            onClick={handleApplyCoupon}
            variant="secondary"
            disabled={!coupon}
          >
            Aplicar
          </Button>
        </div>
        {appliedCoupon && (
          <div className="mt-2 text-sm text-green-300">
            ✓ Cupom {appliedCoupon.code} aplicado (-{appliedCoupon.discount}%)
          </div>
        )}
      </div>

      {/* Entrega */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Entrega</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-white/10 transition">
            <input
              type="radio"
              name="delivery"
              value="pickup"
              checked={deliveryMethod === 'pickup'}
              onChange={(e) => onDeliveryChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Retirar na loja</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-white/10 transition">
            <input
              type="radio"
              name="delivery"
              value="delivery"
              checked={deliveryMethod === 'delivery'}
              onChange={(e) => onDeliveryChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Entregar no meu endereço</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-white/10 transition">
            <input
              type="radio"
              name="delivery"
              value="shipping"
              checked={deliveryMethod === 'shipping'}
              onChange={(e) => onDeliveryChange(e.target.value)}
              className="w-4 h-4"
            />
            <span>Retirar em Envio por excursão</span>
          </label>
        </div>

        {/* Formulário de endereço (se delivery) */}
        {deliveryMethod === 'delivery' && (
          <DeliveryAddressForm
            onAddressChange={(address) => {/* atualizar */}}
          />
        )}
      </div>

      {/* Desconto */}
      {discount > 0 && (
        <div className="flex justify-between text-green-300">
          <span>Desconto:</span>
          <span>-{formatCurrency(discount)}</span>
        </div>
      )}

      {/* Frete */}
      {shippingCost > 0 && (
        <div className="flex justify-between">
          <span>Frete:</span>
          <span>{formatCurrency(shippingCost)}</span>
        </div>
      )}

      {/* Total */}
      <div className="pt-4 border-t border-white/30">
        <div className="flex justify-between text-2xl font-bold">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Observações
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Detalhes do seu pedido"
          rows={3}
          className="w-full p-3 rounded bg-white/10 border border-white/30 text-white placeholder:text-white/50 resize-none"
        />
      </div>

      {/* Botão finalizar (desktop) */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-white text-rose-600 hover:bg-gray-100 font-bold text-lg h-14"
      >
        Finalizar Pedido
      </Button>
    </div>
  )
}
```

### 5. Como Ativar o Checkout

```typescript
// src/app/(storefront)/page.tsx ou layout

'use client'

import { QuickCheckout } from '@/components/storefront/QuickCheckout'

export default function StorefrontLayout() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const cart = useCartStore()

  return (
    <>
      {/* Botão carrinho flutuante */}
      <button
        onClick={() => setCheckoutOpen(true)}
        className="fixed bottom-6 right-6 bg-rose-600 text-white rounded-full p-4 shadow-lg hover:scale-110 transition z-50"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {cart.itemCount}
          </span>
        )}
      </button>

      {/* Modal do checkout */}
      <QuickCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  )
}
```

---

## 🎨 Variações de Produtos - Tabela Estilo Vendizap

A Vendizap usa uma **tabela elegante** para mostrar variações. Vou criar o componente:

```typescript
// src/components/storefront/VariantsTable.tsx

'use client'

export function VariantsTable({ product, variants }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const cart = useCartStore()

  // Agrupar variações por atributo principal (ex: Cor)
  const groupedVariants = groupBy(variants, 'attributes.cor')

  function addToCart(variant: Variant) {
    const quantity = quantities[variant.id] || 1
    cart.addItem({
      product_id: product.id,
      variant_id: variant.id,
      name: product.name,
      variant_name: formatVariantName(variant.attributes),
      price: variant.price,
      quantity,
      image_url: variant.image_url || product.image_url,
    })
    
    // Resetar quantidade
    setQuantities({...quantities, [variant.id]: 0})
    toast.success('Adicionado ao carrinho!')
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left font-semibold">Variação</th>
            {/* Cabeçalhos dinâmicos (tamanhos) */}
            {getUniqueValues(variants, 'attributes.tamanho').map(size => (
              <th key={size} className="p-3 text-center font-semibold">
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedVariants).map(([color, colorVariants]) => (
            <tr key={color} className="border-t hover:bg-gray-50">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  {colorVariants[0].image_url && (
                    <img
                      src={colorVariants[0].image_url}
                      alt={color}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <span className="font-medium">{color}</span>
                </div>
              </td>

              {/* Células para cada tamanho */}
              {getUniqueValues(variants, 'attributes.tamanho').map(size => {
                const variant = colorVariants.find(
                  v => v.attributes.tamanho === size
                )

                if (!variant) {
                  return <td key={size} className="p-3 text-center text-gray-400">-</td>
                }

                return (
                  <td key={size} className="p-3">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm font-semibold">
                        {formatCurrency(variant.price)}
                      </div>
                      
                      {variant.stock_quantity > 0 ? (
                        <>
                          <div className="text-xs text-gray-600">
                            {variant.stock_quantity} em estoque
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const qty = Math.max(0, (quantities[variant.id] || 0) - 1)
                                setQuantities({...quantities, [variant.id]: qty})
                              }}
                              className="w-7 h-7 rounded border hover:bg-gray-100"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={quantities[variant.id] || 0}
                              onChange={(e) => {
                                const qty = Math.max(0, parseInt(e.target.value) || 0)
                                setQuantities({...quantities, [variant.id]: qty})
                              }}
                              className="w-12 text-center border rounded"
                              min="0"
                            />
                            <button
                              onClick={() => {
                                const qty = Math.min(
                                  variant.stock_quantity,
                                  (quantities[variant.id] || 0) + 1
                                )
                                setQuantities({...quantities, [variant.id]: qty})
                              }}
                              className="w-7 h-7 rounded border hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          {(quantities[variant.id] || 0) > 0 && (
                            <Button
                              onClick={() => addToCart(variant)}
                              size="sm"
                              className="w-full"
                            >
                              Adicionar
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-red-600 font-medium">
                          Esgotado
                        </div>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Helpers
function groupBy<T>(array: T[], key: string): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const value = getNestedValue(item, key)
    if (!acc[value]) acc[value] = []
    acc[value].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

function getUniqueValues<T>(array: T[], key: string): string[] {
  return [...new Set(array.map(item => getNestedValue(item, key)))]
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

function formatVariantName(attributes: Record<string, string>): string {
  return Object.values(attributes).join(' / ')
}
```

---

## 📱 Responsividade

### Mobile

```typescript
// Ajustes mobile no QuickCheckout

<DialogContent className="max-w-full h-full md:max-w-5xl md:max-h-[90vh] md:rounded-lg">
  <div className="flex flex-col md:grid md:grid-cols-[1fr,400px] h-full">
    {/* Mobile: formulário primeiro, depois resumo */}
    <div className="order-2 md:order-1 p-6 overflow-y-auto">
      <CheckoutForm />
    </div>

    {/* Mobile: resumo fixo no topo */}
    <div className="order-1 md:order-2 bg-gradient-to-br from-rose-500 to-pink-600 text-white p-4 md:p-6 overflow-y-auto">
      <OrderSummary />
    </div>
  </div>
</DialogContent>
```

---

## 🎯 Fluxo Completo

### 1. Cliente navega pelo catálogo
```
Produtos → Variações em Tabela → Adicionar ao carrinho
```

### 2. Cliente abre carrinho
```
Botão flutuante → Modal Checkout abre
```

### 3. Cliente preenche dados
```
Nome → Telefone → Pagamento → Entrega
```

### 4. Cliente finaliza
```
Botão Finalizar → Criar pedido → WhatsApp
```

---

## ✅ Checklist de Implementação

### Checkout Rápido
- [ ] Criar QuickCheckout component
- [ ] Criar CheckoutForm component
- [ ] Criar OrderSummary component
- [ ] Implementar modal/dialog
- [ ] Layout responsivo (mobile/desktop)
- [ ] Validação de formulário
- [ ] Integração com carrinho
- [ ] Integração com API de pedidos
- [ ] Mensagem WhatsApp formatada
- [ ] Redirect para WhatsApp

### Tabela de Variações
- [ ] Criar VariantsTable component
- [ ] Agrupar variações por atributo
- [ ] Input de quantidade por variação
- [ ] Adicionar múltiplas variações ao carrinho
- [ ] Mostrar estoque
- [ ] Desabilitar esgotados
- [ ] Imagem por cor/variação
- [ ] Responsivo (scroll horizontal mobile)

### Features Extras
- [ ] Sistema de cupons
- [ ] Validação de cupom
- [ ] Cálculo de desconto
- [ ] Opções de entrega dinâmicas
- [ ] Formulário de endereço inline
- [ ] Campo de observações
- [ ] Botão compartilhar pedido
- [ ] Loading states
- [ ] Toast notifications

---

## 🎨 Customização de Cores

A Vendizap usa gradiente rosa/roxo. Personalize:

```typescript
// tailwind.config.ts

theme: {
  extend: {
    colors: {
      brand: {
        50: '#fdf2f8',
        100: '#fce7f3',
        500: '#ec4899',  // Rosa principal
        600: '#db2777',  // Rosa escuro
        700: '#be185d',
      }
    }
  }
}

// Usar no OrderSummary
className="bg-gradient-to-br from-brand-500 to-brand-700"
```

---

## 🚀 Performance

### Otimizações

1. **Modal lazy load**
```typescript
const QuickCheckout = dynamic(() => import('./QuickCheckout'), {
  ssr: false
})
```

2. **Debounce no cupom**
```typescript
const debouncedValidateCoupon = useMemo(
  () => debounce(validateCoupon, 500),
  []
)
```

3. **Cache de formas de pagamento**
```typescript
const { data: paymentMethods } = useSWR('/api/payment-methods')
```

---

## 📊 Comparação: Vendizap vs Nossa Plataforma

| Feature | Vendizap | UP Catálogo v2 |
|---------|----------|----------------|
| Checkout | Modal único | ✅ Implementado |
| Tabela de variações | ✅ | ✅ Implementado |
| Sidebar resumo | ✅ | ✅ Implementado |
| Cupons | ✅ | ✅ Preparado |
| Múltiplas entregas | ✅ | ✅ Implementado |
| WhatsApp redirect | ✅ | ✅ Implementado |
| Responsivo | ✅ | ✅ Implementado |

---

**Pronto para implementar! 🎉**

Ver IMPLEMENTACAO-CHECKOUT-VENDIZAP.md para guia detalhado.

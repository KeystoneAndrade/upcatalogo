'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency, generateWhatsAppLink } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [shippingZones, setShippingZones] = useState<any[]>([])
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedShipping, setSelectedShipping] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadTenantData()
  }, [])

  async function loadTenantData() {
    const supabase = createClient()
    const hostname = window.location.hostname
    const appDomain =
      process.env.NEXT_PUBLIC_APP_DOMAIN || 'upcatalogo.com.br'
    let tenantData = null

    if (hostname.endsWith(`.${appDomain}`)) {
      const subdomain = hostname.replace(`.${appDomain}`, '')
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single()
      tenantData = data
    } else if (hostname !== 'localhost' && hostname !== appDomain) {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('custom_domain', hostname)
        .eq('status', 'active')
        .single()
      tenantData = data
    }

    if (!tenantData) return
    setTenant(tenantData)

    const [pmRes, szRes] = await Promise.all([
      supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('shipping_zones')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .order('display_order'),
    ])

    setPaymentMethods(pmRes.data || [])
    setShippingZones(szRes.data || [])
  }

  function getShippingCost() {
    if (!selectedShipping) return 0
    if (
      selectedShipping.free_shipping_threshold &&
      total() >= selectedShipping.free_shipping_threshold
    )
      return 0
    return selectedShipping.price
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Carrinho vazio')
      return
    }
    if (!tenant?.whatsapp) {
      toast.error('Loja sem WhatsApp configurado')
      return
    }
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const customerName = formData.get('customer_name') as string
    const customerPhone = formData.get('customer_phone') as string
    const customerEmail = formData.get('customer_email') as string
    const street = formData.get('street') as string
    const number = formData.get('number') as string
    const complement = formData.get('complement') as string
    const neighborhood = formData.get('neighborhood') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const zipcode = formData.get('zipcode') as string
    const customerNotes = formData.get('customer_notes') as string

    const shippingCost = getShippingCost()
    const orderTotal = total() + shippingCost

    const orderData = {
      tenant_id: tenant.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      address: {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipcode,
      },
      subtotal: total(),
      shipping_cost: shippingCost,
      total: orderTotal,
      items: items.map((item) => ({
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image_url: item.image,
        variant: item.variant || null,
      })),
      payment_method: selectedPayment || 'Nao informado',
      shipping_method: selectedShipping?.name || 'Retirada',
      shipping_zone_id: selectedShipping?.id || null,
      customer_notes: customerNotes || null,
    }

    const supabase = createClient()
    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select('order_number')
      .single()

    if (error) {
      toast.error('Erro ao criar pedido')
      setLoading(false)
      return
    }

    const itemsList = items
      .map(
        (item) =>
          `- ${item.quantity}x ${item.name} (${formatCurrency(item.price * item.quantity)})`
      )
      .join('\n')

    const message = `Ola! Gostaria de fazer um pedido:

*Pedido #${order.order_number}*

*Produtos:*
${itemsList}

*Subtotal:* ${formatCurrency(total())}
*Frete:* ${shippingCost > 0 ? formatCurrency(shippingCost) : 'Gratis'}
*Total:* ${formatCurrency(orderTotal)}

*Endereco:*
${street}, ${number}${complement ? ' - ' + complement : ''}
${neighborhood} - ${city}/${state}
${zipcode ? 'CEP: ' + zipcode : ''}

*Pagamento:* ${selectedPayment || 'Nao informado'}
*Entrega:* ${selectedShipping?.name || 'Retirada'}

${customerNotes ? '*Obs:* ' + customerNotes : ''}

_Pedido via UP Catalogo_`

    const whatsappLink = generateWhatsAppLink(tenant.whatsapp, message)
    clearCart()
    window.open(whatsappLink, '_blank')
    toast.success('Pedido criado! Redirecionando para WhatsApp...')
    setLoading(false)
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Carrinho vazio</h1>
        <p className="text-muted-foreground mb-4">
          Adicione produtos para continuar
        </p>
        <Button onClick={() => router.push('/produtos')}>Ver produtos</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Finalizar Pedido</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nome completo *</Label>
                  <Input id="customer_name" name="customer_name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_phone">WhatsApp *</Label>
                    <Input
                      id="customer_phone"
                      name="customer_phone"
                      required
                      placeholder="11999999999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_email">Email</Label>
                    <Input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereco de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input id="street" name="street" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Numero *</Label>
                    <Input id="number" name="number" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" name="complement" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input id="neighborhood" name="neighborhood" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input id="city" name="city" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      name="state"
                      required
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">CEP</Label>
                    <Input id="zipcode" name="zipcode" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {paymentMethods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {paymentMethods.map((pm) => (
                      <label
                        key={pm.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={pm.name}
                          checked={selectedPayment === pm.name}
                          onChange={() => setSelectedPayment(pm.name)}
                          className="text-blue-600"
                        />
                        <div>
                          <p className="font-medium">{pm.name}</p>
                          {pm.instructions && (
                            <p className="text-sm text-muted-foreground">
                              {pm.instructions}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {shippingZones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Forma de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {shippingZones.map((sz) => (
                      <label
                        key={sz.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShipping?.id === sz.id}
                            onChange={() => setSelectedShipping(sz)}
                            className="text-blue-600"
                          />
                          <div>
                            <p className="font-medium">{sz.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {sz.cities?.join(', ')}
                              {sz.delivery_time_min &&
                                sz.delivery_time_max &&
                                ` | ${sz.delivery_time_min}-${sz.delivery_time_max} dias`}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">
                          {sz.free_shipping_threshold &&
                          total() >= sz.free_shipping_threshold
                            ? 'Gratis'
                            : formatCurrency(sz.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Observacoes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="customer_notes"
                  rows={3}
                  placeholder="Alguma observacao para o pedido?"
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <MessageCircle className="mr-2 h-5 w-5" />
              )}
              Finalizar Pedido via WhatsApp
            </Button>
          </form>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const key = item.variant
                  ? `${item.productId}-${item.variant}`
                  : item.productId
                return (
                  <div key={key} className="flex items-start space-x-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">
                          {item.variant}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.variant
                            )
                          }
                          className="h-6 w-6 rounded border flex items-center justify-center text-xs hover:bg-gray-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.variant
                            )
                          }
                          className="h-6 w-6 rounded border flex items-center justify-center text-xs hover:bg-gray-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.productId, item.variant)
                          }
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                )
              })}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total())}</span>
                </div>
                {selectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span>Frete</span>
                    <span>
                      {getShippingCost() > 0
                        ? formatCurrency(getShippingCost())
                        : 'Gratis'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {formatCurrency(total() + getShippingCost())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

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
  MapPin,
  Search,
  AlertCircle,
  CheckCircle2,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'

function formatCepInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function normalizeCep(cep: string) {
  return cep.replace(/\D/g, '')
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [allShippingZones, setAllShippingZones] = useState<any[]>([])
  const [matchedMethods, setMatchedMethods] = useState<any[]>([])
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [cep, setCep] = useState('')
  const [cepSearched, setCepSearched] = useState(false)
  const [searchingCep, setSearchingCep] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

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
        .select('*, shipping_zone_ranges(*), shipping_methods(*)')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .order('display_order'),
    ])

    setPaymentMethods(pmRes.data || [])
    setAllShippingZones(szRes.data || [])
  }

  function searchCep() {
    const cepNorm = normalizeCep(cep)
    if (cepNorm.length !== 8) {
      toast.error('Digite um CEP valido com 8 digitos')
      return
    }

    setSearchingCep(true)
    setSelectedMethod(null)

    // Buscar zonas que cobrem este CEP
    const methods: any[] = []

    allShippingZones.forEach(zone => {
      const hasMatch = zone.shipping_zone_ranges?.some((range: any) => {
        return cepNorm >= range.cep_start && cepNorm <= range.cep_end
      })

      if (hasMatch) {
        zone.shipping_methods?.forEach((method: any) => {
          if (method.is_active) {
            methods.push({
              ...method,
              zone_name: zone.name
            })
          }
        })
      }
    })

    setMatchedMethods(methods)
    setCepSearched(true)
    setSearchingCep(false)

    if (methods.length === 1) {
      setSelectedMethod(methods[0])
    }
  }

  function getShippingCost() {
    if (!selectedMethod) return 0
    if (
      selectedMethod.free_shipping_threshold &&
      total() >= selectedMethod.free_shipping_threshold
    )
      return 0
    return selectedMethod.price
  }

  function getDiscountAmount() {
    if (!appliedCoupon) return 0
    if (appliedCoupon.discount_type === 'percentage') {
      return total() * (appliedCoupon.discount_value / 100)
    }
    return appliedCoupon.discount_value
  }

  async function validateCoupon() {
    if (!couponCode) return
    setValidatingCoupon(true)

    // Reset previous coupon
    setAppliedCoupon(null)

    const supabase = createClient()
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single() // Expecting unique code per tenant

    if (error || !coupons) {
      toast.error('Cupom inválido ou não encontrado')
      setValidatingCoupon(false)
      return
    }

    // Validate rules
    if (coupons.expiration_date && new Date(coupons.expiration_date) < new Date()) {
      toast.error('Este cupom expirou')
      setValidatingCoupon(false)
      return
    }

    if (coupons.min_purchase_amount && total() < coupons.min_purchase_amount) {
      toast.error(`Valor mínimo para este cupom é ${formatCurrency(coupons.min_purchase_amount)}`)
      setValidatingCoupon(false)
      return
    }

    if (coupons.max_usage_limit && coupons.usage_count >= coupons.max_usage_limit) {
      toast.error('Limite de uso deste cupom excedido')
      setValidatingCoupon(false)
      return
    }

    setAppliedCoupon(coupons)
    toast.success('Cupom aplicado com sucesso!')
    setValidatingCoupon(false)
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    toast.info('Cupom removido')
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
    if (allShippingZones.length > 0 && !selectedMethod) {
      toast.error('Selecione uma opcao de entrega')
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
    const zipcode = cep
    const customerNotes = formData.get('customer_notes') as string

    const shippingCost = getShippingCost()
    const discountAmount = getDiscountAmount()
    const orderTotal = Math.max(0, total() - discountAmount + shippingCost)

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
      shipping_method: selectedMethod?.name || 'Retirada',
      shipping_zone_id: selectedMethod?.zone_id || null,
      shipping_method_id: selectedMethod?.id || null,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      discount: discountAmount,
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

    // Update coupon usage count
    if (appliedCoupon) {
      await supabase.rpc('increment_coupon_usage', { coupon_id: appliedCoupon.id })
      // Fallback if RPC doesn't exist (though RPC is safer for concurrency)
      // await supabase.from('coupons').update({ usage_count: appliedCoupon.usage_count + 1 }).eq('id', appliedCoupon.id)
      // For now, let's just do a simple update implementation since RPC might not be set up
      const { error: usageError } = await supabase
        .from('coupons')
        .update({ usage_count: appliedCoupon.usage_count + 1 })
        .eq('id', appliedCoupon.id)

      if (usageError) console.error('Error updating coupon usage', usageError)
    }

    const itemsList = items
      .map(
        (item) =>
          `- ${item.quantity}x ${item.name}${item.variant ? ' (' + item.variant + ')' : ''} (${formatCurrency(item.price * item.quantity)})`
      )
      .join('\n')

    const message = `Ola! Gostaria de fazer um pedido:

*Pedido #${order.order_number}*

*Produtos:*
${itemsList}

*Subtotal:* ${formatCurrency(total())}
${appliedCoupon ? `*Desconto (${appliedCoupon.code}):* -${formatCurrency(discountAmount)}\n` : ''}*Frete:* ${shippingCost > 0 ? formatCurrency(shippingCost) : 'Gratis'}
*Total:* ${formatCurrency(orderTotal)}

*Endereco:*
${street}, ${number}${complement ? ' - ' + complement : ''}
${neighborhood} - ${city}/${state}
${zipcode ? 'CEP: ' + zipcode : ''}

*Pagamento:* ${selectedPayment || 'Nao informado'}
*Entrega:* ${selectedMethod?.name || 'Retirada'}

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
                {/* CEP com busca de frete */}
                <div className="space-y-2">
                  <Label htmlFor="zipcode">CEP *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="zipcode"
                      value={cep}
                      onChange={(e) => {
                        setCep(formatCepInput(e.target.value))
                        setCepSearched(false)
                        setSelectedMethod(null)
                        setMatchedMethods([])
                      }}
                      placeholder="00000-000"
                      required
                      maxLength={9}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={searchCep}
                      disabled={searchingCep || normalizeCep(cep).length !== 8}
                    >
                      {searchingCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="ml-2">Calcular frete</span>
                    </Button>
                  </div>

                  {/* Resultado da busca de frete */}
                  {cepSearched && matchedMethods.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p>Nao entregamos neste CEP. Entre em contato para mais informacoes.</p>
                    </div>
                  )}

                  {matchedMethods.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {matchedMethods.map((sm) => (
                        <label
                          key={sm.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedMethod?.id === sm.id
                            ? 'border-green-500 bg-green-50'
                            : 'hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedMethod?.id === sm.id}
                              onChange={() => setSelectedMethod(sm)}
                              className="text-green-600"
                            />
                            <div>
                              <p className="font-medium text-sm">{sm.name}</p>
                              {sm.delivery_time_min && sm.delivery_time_max && (
                                <p className="text-xs text-muted-foreground">
                                  {sm.delivery_time_min}-{sm.delivery_time_max} dias uteis
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-sm">
                            {sm.free_shipping_threshold &&
                              total() >= sm.free_shipping_threshold
                              ? 'Gratis'
                              : formatCurrency(sm.price)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {selectedMethod && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Frete: {getShippingCost() > 0 ? formatCurrency(getShippingCost()) : 'Gratis'}
                        {selectedMethod.delivery_time_min && selectedMethod.delivery_time_max &&
                          ` | ${selectedMethod.delivery_time_min}-${selectedMethod.delivery_time_max} dias uteis`}
                      </span>
                    </div>
                  )}
                </div>

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
                <div className="grid grid-cols-2 gap-4">
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

              {/* Coupon Input */}
              <div className="pt-4 border-t">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cupom de desconto"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                    <Button type="button" variant="outline" onClick={validateCoupon} disabled={!couponCode || validatingCoupon}>
                      {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200 text-sm">
                    <span className="text-green-700 font-medium flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {appliedCoupon.code} aplicado
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={removeCoupon} className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total())}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(getDiscountAmount())}</span>
                  </div>
                )}

                {selectedMethod && (
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
                    {formatCurrency(Math.max(0, total() - getDiscountAmount() + getShippingCost()))}
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

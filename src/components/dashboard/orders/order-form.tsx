'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { logOrderHistory } from '@/lib/order-logger'
import { ProductSearch } from './product-search'

interface OrderFormProps {
    tenantId: string
    order?: any
    shippingZones: any[]
    paymentMethods: any[]
}

export function OrderForm({ tenantId, order, shippingZones, paymentMethods }: OrderFormProps) {
    const router = useRouter()
    const isEditing = !!order
    const [loading, setLoading] = useState(false)

    const [customerName, setCustomerName] = useState(order?.customer_name || '')
    const [customerPhone, setCustomerPhone] = useState(order?.customer_phone || '')
    const [customerEmail, setCustomerEmail] = useState(order?.customer_email || '')

    const [address, setAddress] = useState(order?.address || {
        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipcode: ''
    })

    const [items, setItems] = useState<any[]>(order?.items || [])
    const [subtotal, setSubtotal] = useState(order?.subtotal || 0)
    const [shippingMethod, setShippingMethod] = useState(order?.shipping_method || 'Retirada')
    const [shippingCost, setShippingCost] = useState(order?.shipping_cost || 0)
    const [discount, setDiscount] = useState(order?.discount || 0)
    const [total, setTotal] = useState(order?.total || 0)
    const [status, setStatus] = useState(order?.status || 'pending')
    const [paymentMethod, setPaymentMethod] = useState(order?.payment_method || 'Nao informado')

    // Calculated values
    useEffect(() => {
        const newSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        setSubtotal(newSubtotal)
        setTotal(Math.max(0, newSubtotal + Number(shippingCost) - Number(discount)))
    }, [items, shippingCost, discount])

    const handleAddItem = (product: any) => {
        const existingItem = items.find(i => i.product_id === product.id && !i.variant)

        if (existingItem) {
            const newQty = existingItem.quantity + 1
            if (product.manage_stock && newQty > product.stock_quantity) {
                toast.error(`Estoque insuficiente: apenas ${product.stock_quantity} disponivéis.`)
                return
            }
            setItems(items.map(i =>
                i.product_id === product.id && !i.variant
                    ? { ...i, quantity: newQty }
                    : i
            ))
        } else {
            if (product.manage_stock && product.stock_quantity <= 0) {
                toast.error('Produto sem estoque.')
                return
            }
            setItems([...items, {
                product_id: product.id,
                name: product.name,
                quantity: 1,
                price: product.price,
                image_url: product.image_url,
                variant: null,
                manage_stock: product.manage_stock,
                stock_quantity: product.stock_quantity
            }])
        }
        toast.success('Produto adicionado')
    }

    const handleUpdateQuantity = (productId: string, variant: string | null, newQty: number) => {
        if (newQty < 1) return

        const item = items.find(i => i.product_id === productId && i.variant === variant)
        if (item && item.manage_stock && newQty > item.stock_quantity) {
            toast.error(`Limite de estoque atingido (${item.stock_quantity}).`)
            return
        }

        setItems(items.map(i =>
            i.product_id === productId && i.variant === variant
                ? { ...i, quantity: newQty }
                : i
        ))
    }

    const handleRemoveItem = (productId: string, variant: string | null) => {
        setItems(items.filter(i => !(i.product_id === productId && i.variant === variant)))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        const orderData = {
            loja_id: tenantId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            address,
            items,
            subtotal,
            shipping_cost: shippingCost,
            discount,
            total,
            status,
            payment_method: paymentMethod,
            shipping_method: shippingMethod,
            updated_at: new Date().toISOString()
        }

        try {
            if (isEditing) {
                // Calculate Deltas for Stock (Very simplified)
                // Only works for products with manage_stock = true
                // Real implementation requires fetching current products to check manage_stock flag

                // 1. Update Order
                const { error } = await supabase
                    .from('pedidos')
                    .update(orderData)
                    .eq('id', order.id)

                if (error) throw error

                await logOrderHistory(
                    tenantId,
                    order.id,
                    'update',
                    'Pedido atualizado manualmente pelo painel',
                    session?.user.id,
                    { changes: 'Updated via dashboard' }
                )

                // TODO: Update Stock Logic here (Complex: need to fetch old items + current product stocks)
                // For this MVP, we are logging the change but stock sync is manual or complex
                // We will log a warning if stock changes are needed

            } else {
                // Create
                const { data: newOrder, error } = await supabase
                    .from('pedidos')
                    .insert({
                        ...orderData,
                        numero_pedido: Math.floor(100000 + Math.random() * 900000).toString(), // Temporary random number
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (error) throw error

                await logOrderHistory(
                    tenantId,
                    newOrder.id,
                    'creation',
                    'Pedido criado manualmente pelo painel',
                    session?.user.id
                )
            }

            toast.success(isEditing ? 'Pedido atualizado!' : 'Pedido criado!')
            router.push('/dashboard/orders')
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error('Erro ao salvar pedido: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome *</Label>
                            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Telefone *</Label>
                                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} type="email" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Endereco</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>Rua</Label>
                                <Input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Numero</Label>
                                <Input value={address.number} onChange={e => setAddress({ ...address, number: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Bairro</Label>
                                <Input value={address.neighborhood} onChange={e => setAddress({ ...address, neighborhood: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cidade</Label>
                                <Input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} maxLength={2} />
                            </div>
                            <div className="space-y-2">
                                <Label>CEP</Label>
                                <Input value={address.zipcode} onChange={e => setAddress({ ...address, zipcode: e.target.value })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="w-full max-w-sm">
                        <Label className="mb-2 block">Adicionar Produto</Label>
                        <ProductSearch onSelect={handleAddItem} tenantId={tenantId} />
                    </div>

                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Produto</th>
                                    <th className="px-4 py-3 text-center font-medium w-32">Qtd</th>
                                    <th className="px-4 py-3 text-right font-medium w-32">Total</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                            Nenhum item adicionado
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, i) => (
                                        <tr key={`${item.product_id}-${item.variant || 'novar'}-${i}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {item.image_url && (
                                                        <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded object-cover" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                                                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                                                        onClick={() => handleUpdateQuantity(item.product_id, item.variant, item.quantity - 1)}
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                    <Button
                                                        type="button" variant="outline" size="sm" className="h-7 w-7 p-0"
                                                        onClick={() => handleUpdateQuantity(item.product_id, item.variant, item.quantity + 1)}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(item.price * item.quantity)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Button
                                                    type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemoveItem(item.product_id, item.variant)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col items-end space-y-2 pt-4 border-t">
                        <div className="w-64 flex justify-between items-center text-sm">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>

                        <div className="w-64 flex justify-between items-center">
                            <Label className="text-sm font-normal">Frete:</Label>
                            <Input
                                type="number" className="h-8 w-24 text-right"
                                value={shippingCost}
                                onChange={e => setShippingCost(Number(e.target.value))}
                            />
                        </div>

                        <div className="w-64 flex justify-between items-center">
                            <Label className="text-sm font-normal">Desconto:</Label>
                            <Input
                                type="number" className="h-8 w-24 text-right"
                                value={discount}
                                onChange={e => setDiscount(Number(e.target.value))}
                            />
                        </div>

                        <div className="w-64 flex justify-between items-center font-bold text-lg pt-2 border-t">
                            <span>Total:</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhes do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Forma de Pagamento</Label>
                            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                <option value="Nao informado">Nao informado</option>
                                {paymentMethods.map(pm => (
                                    <option key={pm.id} value={pm.name}>{pm.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Metodo de Entrega</Label>
                            <Select value={shippingMethod} onChange={e => setShippingMethod(e.target.value)}>
                                <option value="Retirada">Retirada</option>
                                {shippingZones.map(sz => (
                                    <option key={sz.id} value={sz.name}>{sz.name}</option>
                                ))}
                                <option value="Outro">Outro</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="pending">Pendente</option>
                                <option value="confirmed">Confirmado</option>
                                <option value="preparing">Preparando</option>
                                <option value="shipped">Enviado</option>
                                <option value="delivered">Entregue</option>
                                <option value="cancelled">Cancelado</option>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t pt-6">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Salvar Alteracoes' : 'Criar Pedido'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logOrderHistory } from '@/lib/order-logger'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const statuses = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
]

// Statuses where stock has been deducted
const stockDeductedStatuses = ['confirmed', 'preparing', 'shipped', 'delivered']

export function OrderStatusUpdate({ orderId, currentStatus, tenantId }: { orderId: string; currentStatus: string; tenantId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function adjustStock(items: any[], action: 'deduct' | 'restore') {
    const supabase = createClient()
    const adjustments: { productId: string; name: string; qty: number }[] = []

    for (const item of items) {
      if (!item.product_id) continue

      const { data: product } = await supabase
        .from('products')
        .select('id, name, stock_quantity, manage_stock')
        .eq('id', item.product_id)
        .single()

      if (!product || !product.manage_stock) continue

      const delta = action === 'deduct' ? -item.quantity : item.quantity
      const newStock = Math.max(0, product.stock_quantity + delta)

      await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product.id)

      adjustments.push({
        productId: product.id,
        name: product.name,
        qty: item.quantity,
      })
    }

    return adjustments
  }

  async function handleUpdate() {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Fetch order items for stock adjustment
    const { data: order } = await supabase
      .from('orders')
      .select('items')
      .eq('id', orderId)
      .single()

    const items = (order?.items as any[]) || []

    const updateData: any = { status }
    if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString()
    if (status === 'shipped') updateData.shipped_at = new Date().toISOString()
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString()
    if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString()

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)

    if (error) {
      toast.error('Erro ao atualizar status')
      setLoading(false)
      return
    }

    // Stock adjustment logic
    const wasStockDeducted = stockDeductedStatuses.includes(currentStatus)
    const willDeductStock = stockDeductedStatuses.includes(status)

    // Deduct stock: pending → confirmed (first time confirming)
    if (!wasStockDeducted && willDeductStock) {
      const adjustments = await adjustStock(items, 'deduct')
      if (adjustments.length > 0) {
        await logOrderHistory(
          tenantId,
          orderId,
          'stock_change',
          `Estoque abatido: ${adjustments.map(a => `${a.name} (-${a.qty})`).join(', ')}`,
          session?.user.id,
          { action: 'deduct', adjustments }
        )
      }
    }

    // Restore stock: confirmed/preparing/shipped → cancelled
    if (wasStockDeducted && status === 'cancelled') {
      const adjustments = await adjustStock(items, 'restore')
      if (adjustments.length > 0) {
        await logOrderHistory(
          tenantId,
          orderId,
          'stock_change',
          `Estoque devolvido: ${adjustments.map(a => `${a.name} (+${a.qty})`).join(', ')}`,
          session?.user.id,
          { action: 'restore', adjustments }
        )
      }
    }

    await logOrderHistory(
      tenantId,
      orderId,
      'status_change',
      `Status alterado de ${currentStatus} para ${status}`,
      session?.user.id,
      { old_status: currentStatus, new_status: status }
    )
    toast.success('Status atualizado!')
    router.refresh()
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atualizar Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <Button onClick={handleUpdate} disabled={loading || status === currentStatus}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

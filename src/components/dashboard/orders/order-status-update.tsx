'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

export function OrderStatusUpdate({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleUpdate() {
    setLoading(true)
    const supabase = createClient()

    const updateData: any = { status }
    if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString()
    if (status === 'shipped') updateData.shipped_at = new Date().toISOString()
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString()
    if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString()

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)

    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success('Status atualizado!')
      router.refresh()
    }
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

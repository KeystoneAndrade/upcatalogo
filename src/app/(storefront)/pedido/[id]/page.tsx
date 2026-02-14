import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', params.id)
    .single()

  if (!order) notFound()

  const items = (order.items as any[]) || []

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Pedido Confirmado!</h1>
        <p className="text-muted-foreground mt-2">
          Pedido #{order.order_number}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detalhes do Pedido</CardTitle>
            <Badge variant="outline">
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frete</span>
              <span>{formatCurrency(Number(order.shipping_cost))}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
          <div className="border-t pt-4 text-sm text-muted-foreground">
            <p>Criado em: {formatDateTime(order.created_at)}</p>
            <p>Pagamento: {order.payment_method}</p>
            <p>Entrega: {order.shipping_method}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

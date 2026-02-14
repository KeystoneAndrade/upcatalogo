import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { OrderStatusUpdate } from '@/components/dashboard/orders/order-status-update'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('owner_id', session!.user.id)
    .single()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .eq('tenant_id', tenant!.id)
    .single()

  if (!order) notFound()

  const items = (order.items as any[]) || []
  const address = order.address as any

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
        <Badge variant="outline" className="text-base px-3 py-1">
          {statusLabels[order.status] || order.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Nome:</strong> {order.customer_name}</p>
            <p><strong>Telefone:</strong> {order.customer_phone}</p>
            {order.customer_email && <p><strong>Email:</strong> {order.customer_email}</p>}
            {order.customer_notes && <p><strong>Observacoes:</strong> {order.customer_notes}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {address && (
              <>
                <p>{address.street}, {address.number}</p>
                {address.complement && <p>{address.complement}</p>}
                <p>{address.neighborhood}</p>
                <p>{address.city} - {address.state}</p>
                {address.zipcode && <p>CEP: {address.zipcode}</p>}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center space-x-3">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.variant && <p className="text-sm text-muted-foreground">{item.variant}</p>}
                    <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frete ({order.shipping_method})</span>
              <span>{formatCurrency(Number(order.shipping_cost))}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Pagamento:</strong> {order.payment_method}</p>
          <p><strong>Entrega:</strong> {order.shipping_method}</p>
          <p><strong>Criado em:</strong> {formatDateTime(order.created_at)}</p>
          {order.tracking_code && <p><strong>Rastreamento:</strong> {order.tracking_code}</p>}
        </CardContent>
      </Card>

      <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />
    </div>
  )
}

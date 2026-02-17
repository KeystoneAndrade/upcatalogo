import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderForm } from '@/components/dashboard/orders/order-form'

export default async function EditOrderPage({ params }: { params: { id: string } }) {
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

    const { data: shippingZones } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .eq('is_active', true)
        .order('display_order')

    const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .eq('is_active', true)
        .order('display_order')

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Editar Pedido #{order.order_number}</h1>
            <OrderForm
                key={order.id}
                tenantId={tenant!.id}
                order={order}
                shippingZones={shippingZones || []}
                paymentMethods={paymentMethods || []}
            />
        </div>
    )
}

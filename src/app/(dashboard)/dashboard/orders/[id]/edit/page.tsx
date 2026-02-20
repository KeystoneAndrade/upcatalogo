import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderForm } from '@/components/dashboard/orders/order-form'
import { getTenant, getShippingZones, getPaymentMethods } from '@/services/tenant-service'
import { getOrderById } from '@/services/order-service'

export default async function EditOrderPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const tenant = await getTenant(supabase)

    const order = await getOrderById(supabase, tenant.id, params.id)
    if (!order) notFound()

    const shippingZones = await getShippingZones(supabase, tenant.id)
    const paymentMethods = await getPaymentMethods(supabase, tenant.id)


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Editar Pedido #{order.numero_pedido}</h1>
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

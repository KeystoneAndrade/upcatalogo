import { createClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/dashboard/orders/order-form'
import { getTenant, getShippingZones, getPaymentMethods } from '@/services/tenant-service'

export default async function NewOrderPage() {
    const supabase = createClient()
    const tenant = await getTenant(supabase)

    const shippingZones = await getShippingZones(supabase, tenant.id)
    const paymentMethods = await getPaymentMethods(supabase, tenant.id)


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Novo Pedido</h1>
            <OrderForm
                tenantId={tenant!.id}
                shippingZones={shippingZones || []}
                paymentMethods={paymentMethods || []}
            />
        </div>
    )
}

import { createClient } from '@/lib/supabase/server'
import { OrderForm } from '@/components/dashboard/orders/order-form'

export default async function NewOrderPage() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', session!.user.id)
        .single()

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
            <h1 className="text-2xl font-bold">Novo Pedido</h1>
            <OrderForm
                tenantId={tenant!.id}
                shippingZones={shippingZones || []}
                paymentMethods={paymentMethods || []}
            />
        </div>
    )
}

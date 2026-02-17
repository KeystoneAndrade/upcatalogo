import { createClient } from '@/lib/supabase/client'

export async function logOrderHistory(
    tenantId: string,
    orderId: string,
    type: string,
    description: string,
    userId: string | null = null,
    metadata: any = {},
    isCustomerVisible: boolean = false
) {
    const supabase = createClient()

    await supabase.from('order_history').insert({
        tenant_id: tenantId,
        order_id: orderId,
        user_id: userId,
        type,
        description,
        metadata,
        is_customer_visible: isCustomerVisible
    })
}

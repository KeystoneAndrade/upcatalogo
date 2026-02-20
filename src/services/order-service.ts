import { SupabaseClient } from '@supabase/supabase-js'

export async function getOrderById(supabase: SupabaseClient, loja_id: string, id: string) {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*, pedido_itens(*)')
        .eq('loja_id', loja_id)
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }
    return data
}

export async function updateOrderStatus(supabase: SupabaseClient, loja_id: string, id: string, status: string) {
    const { data, error } = await supabase
        .from('pedidos')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('loja_id', loja_id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function createOrder(supabase: SupabaseClient, loja_id: string, orderData: any, items: any[]) {
    // 1. Insert Order
    const { data: order, error: orderError } = await supabase
        .from('pedidos')
        .insert({
            ...orderData,
            loja_id,
            numero_pedido: Math.floor(100000 + Math.random() * 900000).toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (orderError) throw orderError

    // 2. Insert Items
    const itemsToInsert = items.map(item => ({
        loja_id,
        pedido_id: order.id,
        produto_id: item.productId || item.produto_id,
        variacao_id: item.variacaoId || item.variacao_id || null,
        name: item.name,
        sku: item.sku || null,
        price_at_purchase: item.price || item.price_at_purchase,
        quantity: item.quantity,
        subtotal: (item.price || item.price_at_purchase) * item.quantity,
        image_url: item.image || item.image_url || null,
        attributes: item.attributes || (item.variant ? { combination_string: item.variant } : {})
    }))

    const { error: itemsError } = await supabase
        .from('pedido_itens')
        .insert(itemsToInsert)

    if (itemsError) throw itemsError

    return order
}
export async function updateOrder(supabase: SupabaseClient, loja_id: string, id: string, orderData: any, items: any[]) {
    // 1. Update Order
    const { data: order, error: orderError } = await supabase
        .from('pedidos')
        .update({
            ...orderData,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('loja_id', loja_id)
        .select()
        .single()

    if (orderError) throw orderError

    // 2. Update Items (Delete and Re-insert)
    await supabase.from('pedido_itens').delete().eq('pedido_id', id)

    const itemsToInsert = items.map(item => ({
        loja_id,
        pedido_id: id,
        produto_id: item.productId || item.product_id,
        variacao_id: item.variacaoId || item.variacao_id || null,
        name: item.name,
        sku: item.sku || null,
        price_at_purchase: item.price || item.price_at_purchase,
        quantity: item.quantity,
        subtotal: (item.price || item.price_at_purchase) * item.quantity,
        image_url: item.image || item.image_url || null,
        attributes: item.attributes || (item.variant ? { combination_string: item.variant } : {})
    }))

    const { error: itemsError } = await supabase
        .from('pedido_itens')
        .insert(itemsToInsert)

    if (itemsError) throw itemsError

    return order
}

export async function getOrders(supabase: SupabaseClient, loja_id: string, limit = 50) {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('loja_id', loja_id)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error
    return data || []
}


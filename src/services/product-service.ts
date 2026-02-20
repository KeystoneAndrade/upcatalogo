import { SupabaseClient } from '@supabase/supabase-js'

export interface ProductFilters {
    loja_id: string
    is_active?: boolean
    categoria_id?: string
    limit?: number
    order_by?: string
}

export async function getProducts(supabase: SupabaseClient, {
    loja_id,
    is_active = true,
    categoria_id,
    limit = 20,
    order_by = 'display_order'
}: ProductFilters) {
    let query = supabase
        .from('produtos')
        .select('*, categories(name), produtos_variacoes(*)')
        .eq('loja_id', loja_id)
        .order(order_by)
        .limit(limit)

    if (is_active !== undefined) {
        query = query.eq('is_active', is_active)
    }

    if (categoria_id) {
        query = query.eq('categoria_id', categoria_id)
    }

    const { data, error } = await query
    if (error) throw error
    return data
}

export async function getProductBySlug(supabase: SupabaseClient, loja_id: string, slug: string) {
    const { data, error } = await supabase
        .from('produtos')
        .select('*, produtos_variacoes(*)')
        .eq('loja_id', loja_id)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
    }
    return data
}

export async function getProductById(supabase: SupabaseClient, loja_id: string, id: string) {
    const { data, error } = await supabase
        .from('produtos')
        .select('*, produtos_variacoes(*)')
        .eq('loja_id', loja_id)
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }
    return data
}

export async function saveProduct(supabase: SupabaseClient, loja_id: string, data: any, variations: any[] = [], productId?: string) {
    let returningProductId = productId

    // 1. Save Product
    if (productId) {
        const { error } = await supabase
            .from('produtos')
            .update(data)
            .eq('id', productId)
            .eq('loja_id', loja_id)
        if (error) throw error
    } else {
        const { data: insertedData, error } = await supabase
            .from('produtos')
            .insert({ ...data, loja_id })
            .select('id')
            .single()
        if (error) throw error
        returningProductId = insertedData.id
    }

    // 2. Save Variations
    if (returningProductId) {
        if (variations.length > 0) {
            const variacoesRows = variations.map((item, index) => ({
                id: item.id && item.id.length === 36 ? item.id : undefined,
                loja_id: loja_id,
                produto_id: returningProductId,
                name: Object.values(item.combination).join(' / ') || data.name,
                sku: item.sku || null,
                price: item.price,
                compare_at_price: item.compare_at_price || null,
                stock_quantity: item.stock_quantity,
                manage_stock: item.manage_stock,
                image_url: item.image_url || null,
                attributes: item.combination,
                is_active: item.is_active,
                display_order: index,
                weight: item.weight || null,
                height: item.height || null,
                width: item.width || null,
                length: item.length || null,
            }))

            const { error: variantsError } = await supabase
                .from('produtos_variacoes')
                .upsert(variacoesRows, { onConflict: 'id' })

            if (variantsError) throw variantsError

            // Cleanup removed variations
            const keepIds = variacoesRows.map(r => r.id).filter(Boolean) as string[]
            if (keepIds.length > 0) {
                await supabase
                    .from('produtos_variacoes')
                    .delete()
                    .eq('produto_id', returningProductId)
                    .not('id', 'in', `(${keepIds.join(',')})`)
            } else {
                await supabase
                    .from('produtos_variacoes')
                    .delete()
                    .eq('produto_id', returningProductId)
            }
        } else {
            // Product simple or all variations removed
            await supabase
                .from('produtos_variacoes')
                .delete()
                .eq('produto_id', returningProductId)
        }
    }

    return returningProductId
}

export async function deleteProduct(supabase: SupabaseClient, loja_id: string, id: string) {
    // First get the product to collect image URLs if needed for storage cleanup
    const product = await getProductById(supabase, loja_id, id)
    if (!product) return

    const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)
        .eq('loja_id', loja_id)

    if (error) throw error

    return product
}
export async function searchProducts(supabase: SupabaseClient, loja_id: string, query: string, limit = 10) {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', loja_id)
        .ilike('name', `%${query}%`)
        .limit(limit)

    if (error) throw error
    return data || []
}

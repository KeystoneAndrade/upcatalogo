import { SupabaseClient } from '@supabase/supabase-js'

export async function getCategories(supabase: SupabaseClient, loja_id: string, activeOnly = true) {
    let query = supabase
        .from('categorias')
        .select('*')
        .eq('loja_id', loja_id)
        .order('display_order')

    if (activeOnly) {
        query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
}

export async function getCategoryById(supabase: SupabaseClient, loja_id: string, id: string) {
    const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('loja_id', loja_id)
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }
    return data
}

export async function saveCategory(supabase: SupabaseClient, loja_id: string, data: any, id?: string) {
    if (id) {
        const { error } = await supabase
            .from('categorias')
            .update(data)
            .eq('id', id)
            .eq('loja_id', loja_id)
        if (error) throw error
        return id
    } else {
        const { data: inserted, error } = await supabase
            .from('categorias')
            .insert({ ...data, loja_id })
            .select('id')
            .single()
        if (error) throw error
        return inserted.id
    }
}

export async function deleteCategory(supabase: SupabaseClient, loja_id: string, id: string) {
    const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .eq('loja_id', loja_id)

    if (error) throw error
}

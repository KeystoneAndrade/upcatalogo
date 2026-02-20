import { SupabaseClient } from '@supabase/supabase-js'

export async function getTenantBySlug(supabase: SupabaseClient, slug: string) {
    const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }
    return data
}

export async function getTenantByOwner(supabase: SupabaseClient, owner_id: string) {
    const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('proprietario_id', owner_id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }
    return data
}

export async function getTenant(supabase: SupabaseClient) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Unauthorized')

    const tenant = await getTenantByOwner(supabase, session.user.id)
    if (!tenant) throw new Error('Tenant not found')

    return tenant
}

export async function updateTenant(supabase: SupabaseClient, id: string, data: any) {
    const { data: updated, error } = await supabase
        .from('lojas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return updated
}

export async function updateTenantSettings(supabase: SupabaseClient, id: string, settings: any) {
    return updateTenant(supabase, id, { settings })
}

export async function getShippingZones(supabase: SupabaseClient, loja_id: string, activeOnly = true) {
    let query = supabase
        .from('zonas_entrega')
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

export async function getPaymentMethods(supabase: SupabaseClient, loja_id: string, activeOnly = true) {
    let query = supabase
        .from('metodos_pagamento')
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


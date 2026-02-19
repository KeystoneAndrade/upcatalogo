import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAvailableServices, extractMeConfig } from '@/lib/melhor-envio'

export async function GET() {
    try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, settings')
            .eq('owner_id', session.user.id)
            .single()

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

        const meConfig = extractMeConfig(tenant.settings as any)
        if (!meConfig) return NextResponse.json({ error: 'Melhor Envio not configured' }, { status: 400 })

        const services = await getAvailableServices(meConfig)
        return NextResponse.json(services)
    } catch (error: any) {
        console.error('ME services error:', error)
        return NextResponse.json({ error: error.message || 'Error fetching services' }, { status: 500 })
    }
}

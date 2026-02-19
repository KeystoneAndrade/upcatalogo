import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAddresses, extractMeConfig } from '@/lib/melhor-envio'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, settings')
      .eq('owner_id', session.user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const meConfig = extractMeConfig(tenant.settings as any)
    if (!meConfig) return NextResponse.json({ error: 'Melhor Envio not configured' }, { status: 400 })

    const addresses = await getAddresses(meConfig)

    // Map to a simpler format for the frontend
    const mapped = addresses.map((addr: any) => ({
      id: String(addr.id),
      label: addr.label || '',
      postal_code: addr.postal_code || '',
      address: addr.address || '',
      number: addr.number || '',
      complement: addr.complement || '',
      district: addr.district || '',
      city: addr.city?.city || '',
      state_abbr: addr.city?.state?.state_abbr || '',
    }))

    return NextResponse.json(mapped)
  } catch (error: any) {
    console.error('ME addresses error:', error)
    return NextResponse.json({ error: error.message || 'Error fetching addresses' }, { status: 500 })
  }
}

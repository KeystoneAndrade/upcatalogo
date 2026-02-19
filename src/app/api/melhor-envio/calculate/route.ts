import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateShipping, extractMeConfig, type ProductDimensions } from '@/lib/melhor-envio'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, to_postal_code, products, service_ids } = body

    if (!tenant_id || !to_postal_code || !products?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch tenant settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const settings = tenant.settings as any
    const meConfig = extractMeConfig(settings)

    if (!meConfig || !meConfig.cep_origem) {
      return NextResponse.json({ error: 'Melhor Envio not configured' }, { status: 400 })
    }

    // Build product dimensions with fallbacks
    const productDimensions: ProductDimensions[] = products.map((p: any) => ({
      weight: p.weight ?? meConfig.default_weight ?? 0.3,
      height: p.height ?? meConfig.default_height ?? 11,
      width: p.width ?? meConfig.default_width ?? 11,
      length: p.length ?? meConfig.default_length ?? 11,
      quantity: p.quantity || 1,
      price: p.price || 0,
    }))

    // If specific service_ids were requested, override config
    if (Array.isArray(service_ids) && service_ids.length > 0) {
      meConfig.services = service_ids
    }

    const services = await calculateShipping(
      meConfig,
      to_postal_code.replace(/\D/g, ''),
      productDimensions
    )

    return NextResponse.json(services)
  } catch (error: any) {
    console.error('ME calculate error:', error)
    return NextResponse.json(
      { error: error.message || 'Error calculating shipping' },
      { status: 500 }
    )
  }
}
